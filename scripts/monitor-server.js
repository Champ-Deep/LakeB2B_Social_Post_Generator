#!/usr/bin/env node

/**
 * Server Process Monitor
 * Tracks Next.js server lifecycle and provides debugging information
 */

const { spawn, execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

class ServerMonitor {
  constructor() {
    this.logFile = path.join(__dirname, '../logs/server-monitor.log')
    this.startTime = null
    this.restartCount = 0
    this.maxRestarts = 5
    this.process = null
    
    // Ensure logs directory exists
    const logsDir = path.dirname(this.logFile)
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${level}] ${message}\n`
    
    console.log(logMessage.trim())
    fs.appendFileSync(this.logFile, logMessage)
  }

  killPorts() {
    // Kill any existing processes on ports 3000, 3001, and 3002
    // Next.js auto-increments ports if 3000 is busy, causing conflicts
    const ports = [3000, 3001, 3002]
    this.log('🧹 Cleaning up ports 3000, 3001, 3002...')
    
    ports.forEach(port => {
      try {
        execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'pipe' })
      } catch (error) {
        // Ignore errors - port might not be in use
      }
    })
  }

  async startServer() {
    // Kill any existing processes on ports before starting
    this.killPorts()
    
    this.log('🚀 Starting Next.js server...')
    this.startTime = Date.now()
    
    try {
      this.process = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, '..'),
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env, PORT: '3000' }
      })

      this.setupProcessHandlers()
      
      // Monitor for successful startup
      this.waitForStartup()
      
    } catch (error) {
      this.log(`❌ Failed to start server: ${error.message}`, 'ERROR')
      this.handleRestart()
    }
  }

  setupProcessHandlers() {
    // Monitor stdout for startup confirmation
    this.process.stdout.on('data', (data) => {
      const output = data.toString()
      console.log(output)
      
      if (output.includes('Ready in')) {
        this.log('✅ Server started successfully')
        this.startHealthChecks()
      }
      
      if (output.includes('Error:') || output.includes('TypeError:')) {
        this.log(`🚨 Runtime error detected: ${output}`, 'ERROR')
      }
    })

    // Monitor stderr for errors
    this.process.stderr.on('data', (data) => {
      const error = data.toString()
      console.error(error)
      this.log(`🚨 Server error: ${error}`, 'ERROR')
    })

    // Handle process exit
    this.process.on('exit', (code, signal) => {
      const uptime = this.startTime ? Date.now() - this.startTime : 0
      this.log(`💀 Server process exited. Code: ${code}, Signal: ${signal}, Uptime: ${uptime}ms`, 'WARN')
      
      if (code !== 0) {
        this.handleRestart()
      }
    })

    // Handle uncaught errors
    this.process.on('error', (error) => {
      this.log(`💥 Process error: ${error.message}`, 'ERROR')
      this.handleRestart()
    })
  }

  async waitForStartup() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.log('⏰ Server startup timeout - killing process', 'WARN')
        this.process?.kill()
        reject(new Error('Startup timeout'))
      }, 30000) // 30 second timeout

      this.process.stdout.on('data', (data) => {
        if (data.toString().includes('Ready in')) {
          clearTimeout(timeout)
          resolve()
        }
      })
    })
  }

  startHealthChecks() {
    this.log('🔍 Starting health checks...')
    
    // Check server health every 30 seconds
    setInterval(async () => {
      try {
        const http = require('http')
        const options = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/health',
          method: 'GET',
          timeout: 5000
        }

        const req = http.request(options, (res) => {
          if (res.statusCode === 200) {
            this.log('💚 Health check passed')
          } else {
            this.log(`🟡 Health check warning: Status ${res.statusCode}`, 'WARN')
          }
        })

        req.on('error', (error) => {
          this.log(`🔴 Health check failed: ${error.message}`, 'ERROR')
          // Server might be dead, attempt restart
          this.handleRestart()
        })

        req.on('timeout', () => {
          this.log('🔴 Health check timeout', 'ERROR')
          req.destroy()
        })

        req.end()
      } catch (error) {
        this.log(`🔴 Health check error: ${error.message}`, 'ERROR')
      }
    }, 30000)
  }

  handleRestart() {
    if (this.restartCount >= this.maxRestarts) {
      this.log(`🛑 Max restarts (${this.maxRestarts}) exceeded. Stopping monitor.`, 'ERROR')
      process.exit(1)
    }

    this.restartCount++
    this.log(`🔄 Attempting restart ${this.restartCount}/${this.maxRestarts}...`, 'WARN')
    
    // Kill existing process if still running
    if (this.process && !this.process.killed) {
      this.process.kill('SIGTERM')
    }

    // Wait a bit before restarting
    setTimeout(() => {
      this.startServer()
    }, 5000)
  }

  async stop() {
    this.log('🛑 Stopping server monitor...')
    
    if (this.process && !this.process.killed) {
      this.process.kill('SIGTERM')
      
      // Force kill after 10 seconds
      setTimeout(() => {
        if (!this.process.killed) {
          this.log('🔪 Force killing server process', 'WARN')
          this.process.kill('SIGKILL')
        }
      }, 10000)
    }
  }
}

// Handle graceful shutdown
const monitor = new ServerMonitor()

process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...')
  await monitor.stop()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
  await monitor.stop()
  process.exit(0)
})

// Start monitoring
monitor.log('🎯 Server monitor started')
monitor.startServer().catch((error) => {
  monitor.log(`💥 Monitor failed: ${error.message}`, 'ERROR')
  process.exit(1)
})