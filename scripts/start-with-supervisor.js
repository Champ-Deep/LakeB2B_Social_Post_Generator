#!/usr/bin/env node

/**
 * Process Supervisor for LakeB2B Social Post Generator
 * Ensures server stays running with automatic restart capabilities
 */

const { spawn, execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const StartupValidator = require('./startup-validation')

class ProcessSupervisor {
  constructor(options = {}) {
    this.maxRestarts = options.maxRestarts || 10
    this.restartDelay = options.restartDelay || 5000
    this.healthCheckInterval = options.healthCheckInterval || 30000
    this.logFile = path.join(__dirname, '../logs/supervisor.log')
    
    this.restartCount = 0
    this.process = null
    this.isShuttingDown = false
    this.lastStartTime = null
    this.healthCheckTimer = null
    
    // Ensure logs directory exists
    const logsDir = path.dirname(this.logFile)
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }
    
    this.setupGracefulShutdown()
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [SUPERVISOR] [${level}] ${message}\n`
    
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
        this.log(`✅ Port ${port} cleaned up`)
      } catch (error) {
        // Ignore errors - port might not be in use
      }
    })
  }

  async validateBeforeStart() {
    this.log('🔍 Running startup validation...')
    
    try {
      const validator = new StartupValidator()
      const isValid = await validator.run()
      
      if (!isValid) {
        throw new Error('Startup validation failed')
      }
      
      this.log('✅ Startup validation passed')
      return true
    } catch (error) {
      this.log(`❌ Startup validation failed: ${error.message}`, 'ERROR')
      return false
    }
  }

  async startServer() {
    if (this.isShuttingDown) {
      this.log('🛑 Shutdown in progress, not starting server')
      return
    }

    // Kill any existing processes on ports before starting
    this.killPorts()

    // Validate before starting
    const isValid = await this.validateBeforeStart()
    if (!isValid) {
      this.log('💥 Cannot start server due to validation failures', 'ERROR')
      return
    }

    this.log(`🚀 Starting server (attempt ${this.restartCount + 1}/${this.maxRestarts})...`)
    this.lastStartTime = Date.now()

    try {
      this.process = spawn('npm', ['run', 'dev'], {
        cwd: path.join(__dirname, '..'),
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { 
          ...process.env, 
          PORT: '3000',
          HOST: '127.0.0.1',
          NODE_ENV: process.env.NODE_ENV || 'development'
        }
      })

      this.setupProcessHandlers()
      this.startHealthChecks()
      
    } catch (error) {
      this.log(`❌ Failed to start server: ${error.message}`, 'ERROR')
      this.scheduleRestart()
    }
  }

  setupProcessHandlers() {
    // Monitor stdout
    this.process.stdout.on('data', (data) => {
      const output = data.toString().trim()
      if (output) {
        console.log(output)
        
        if (output.includes('Ready in')) {
          this.log('✅ Server started successfully')
          this.restartCount = 0 // Reset restart count on successful start
        }
        
        if (output.includes('Error:') || output.includes('TypeError:')) {
          this.log(`🚨 Server error detected: ${output}`, 'ERROR')
        }
      }
    })

    // Monitor stderr
    this.process.stderr.on('data', (data) => {
      const error = data.toString().trim()
      if (error) {
        console.error(error)
        this.log(`🚨 Server stderr: ${error}`, 'ERROR')
      }
    })

    // Handle process exit
    this.process.on('exit', (code, signal) => {
      const uptime = this.lastStartTime ? Date.now() - this.lastStartTime : 0
      this.log(`💀 Server process exited. Code: ${code}, Signal: ${signal}, Uptime: ${uptime}ms`, 'WARN')
      
      this.stopHealthChecks()
      
      if (!this.isShuttingDown && code !== 0) {
        this.scheduleRestart()
      }
    })

    // Handle process errors
    this.process.on('error', (error) => {
      this.log(`💥 Process error: ${error.message}`, 'ERROR')
      this.scheduleRestart()
    })
  }

  startHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
    }

    this.log('🔍 Starting health checks...')
    
    this.healthCheckTimer = setInterval(async () => {
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
          
          // If health check fails and process appears to be running, kill it
          if (this.process && !this.process.killed) {
            this.log('🔪 Killing unresponsive server process', 'WARN')
            this.process.kill('SIGTERM')
          }
        })

        req.on('timeout', () => {
          this.log('🔴 Health check timeout', 'ERROR')
          req.destroy()
        })

        req.end()
      } catch (error) {
        this.log(`🔴 Health check error: ${error.message}`, 'ERROR')
      }
    }, this.healthCheckInterval)
  }

  stopHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
      this.log('🔍 Health checks stopped')
    }
  }

  scheduleRestart() {
    if (this.isShuttingDown) {
      return
    }

    if (this.restartCount >= this.maxRestarts) {
      this.log(`🛑 Max restarts (${this.maxRestarts}) exceeded. Supervisor stopping.`, 'ERROR')
      this.shutdown()
      return
    }

    this.restartCount++
    this.log(`⏰ Scheduling restart in ${this.restartDelay}ms (${this.restartCount}/${this.maxRestarts})...`, 'WARN')
    
    setTimeout(() => {
      this.startServer()
    }, this.restartDelay)
  }

  setupGracefulShutdown() {
    const signals = ['SIGINT', 'SIGTERM']
    
    signals.forEach(signal => {
      process.on(signal, () => {
        this.log(`🛑 Received ${signal}, shutting down gracefully...`)
        this.shutdown()
      })
    })
  }

  async shutdown() {
    this.isShuttingDown = true
    this.log('🛑 Supervisor shutdown initiated...')
    
    this.stopHealthChecks()
    
    if (this.process && !this.process.killed) {
      this.log('🔄 Terminating server process...')
      this.process.kill('SIGTERM')
      
      // Force kill after 10 seconds
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.log('🔪 Force killing server process', 'WARN')
          this.process.kill('SIGKILL')
        }
        
        setTimeout(() => {
          this.log('👋 Supervisor shutdown complete')
          process.exit(0)
        }, 1000)
      }, 10000)
    } else {
      this.log('👋 Supervisor shutdown complete')
      process.exit(0)
    }
  }

  async start() {
    this.log('🎯 Process supervisor starting...')
    this.log(`📊 Configuration: maxRestarts=${this.maxRestarts}, restartDelay=${this.restartDelay}ms, healthCheckInterval=${this.healthCheckInterval}ms`)
    
    await this.startServer()
  }
}

// Start supervisor if called directly
if (require.main === module) {
  const supervisor = new ProcessSupervisor({
    maxRestarts: process.env.MAX_RESTARTS ? parseInt(process.env.MAX_RESTARTS) : 10,
    restartDelay: process.env.RESTART_DELAY ? parseInt(process.env.RESTART_DELAY) : 5000,
    healthCheckInterval: process.env.HEALTH_CHECK_INTERVAL ? parseInt(process.env.HEALTH_CHECK_INTERVAL) : 30000
  })

  supervisor.start().catch((error) => {
    console.error('Supervisor failed to start:', error)
    process.exit(1)
  })
}

module.exports = ProcessSupervisor