#!/usr/bin/env node

/**
 * Auto-Start Service for LakeB2B Social Post Generator
 * Provides bulletproof startup with intelligent recovery
 */

const { spawn, exec, execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const http = require('http')

class AutoStartService {
  constructor() {
    this.configPath = path.join(__dirname, '../dev-server.json')
    this.logPath = path.join(__dirname, '../logs/auto-start.log')
    this.pidPath = path.join(__dirname, '../.server.pid')
    
    this.config = this.loadConfig()
    this.isShuttingDown = false
    this.serverProcess = null
    this.healthCheckInterval = null
    this.restartCount = 0
    this.maxRestarts = 10
    
    this.ensureDirectories()
    this.setupGracefulShutdown()
  }

  loadConfig() {
    const defaultConfig = {
      port: 3000,
      fallbackPorts: [3001, 3002, 3003],
      healthCheckInterval: 30000,
      maxRestartAttempts: 10,
      restartDelay: 5000,
      autoOpen: true,
      environment: 'development'
    }

    try {
      if (fs.existsSync(this.configPath)) {
        const userConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'))
        return { ...defaultConfig, ...userConfig }
      }
      
      // Create default config file
      fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2))
      return defaultConfig
    } catch (error) {
      this.log('Failed to load config, using defaults', 'WARN')
      return defaultConfig
    }
  }

  ensureDirectories() {
    const logsDir = path.dirname(this.logPath)
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [AUTO-START] [${level}] ${message}`
    
    console.log(logMessage)
    
    try {
      fs.appendFileSync(this.logPath, logMessage + '\n')
    } catch (error) {
      // Ignore log write errors
    }
  }

  async findAvailablePort() {
    const ports = [this.config.port, ...this.config.fallbackPorts]
    
    for (const port of ports) {
      if (await this.isPortAvailable(port)) {
        return port
      }
    }
    
    throw new Error(`No available ports found in range: ${ports.join(', ')}`)
  }

  isPortAvailable(port) {
    return new Promise((resolve) => {
      try {
        execSync(`lsof -ti:${port}`, { stdio: 'pipe' })
        resolve(false) // Port is in use
      } catch (error) {
        resolve(true) // Port is available
      }
    })
  }

  async killProcessOnPort(port) {
    try {
      this.log(`Killing process on port ${port}`)
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'pipe' })
      await this.delay(2000) // Wait for cleanup
      return true
    } catch (error) {
      return false
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async checkServerHealth(port) {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/api/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        resolve(res.statusCode === 200)
      })

      req.on('error', () => resolve(false))
      req.on('timeout', () => {
        req.destroy()
        resolve(false)
      })

      req.end()
    })
  }

  async startServer() {
    if (this.isShuttingDown) return

    try {
      // Find available port
      let port
      try {
        port = await this.findAvailablePort()
      } catch (error) {
        // Try to kill processes on preferred ports and retry
        this.log('No available ports, attempting cleanup...')
        await this.killProcessOnPort(this.config.port)
        port = await this.findAvailablePort()
      }

      this.log(`Starting server on port ${port} (attempt ${this.restartCount + 1})`)

      // Start Next.js development server
      this.serverProcess = spawn('npm', ['run', 'dev', '--', '--port', port], {
        cwd: path.join(__dirname, '..'),
        stdio: ['inherit', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PORT: port,
          NODE_ENV: this.config.environment,
          HOSTNAME: '127.0.0.1'
        }
      })

      // Store PID
      fs.writeFileSync(this.pidPath, this.serverProcess.pid.toString())

      this.setupProcessHandlers(port)
      this.startHealthChecks(port)

      return { port, pid: this.serverProcess.pid }

    } catch (error) {
      this.log(`Failed to start server: ${error.message}`, 'ERROR')
      await this.scheduleRestart()
      throw error
    }
  }

  setupProcessHandlers(port) {
    this.serverProcess.stdout.on('data', (data) => {
      const output = data.toString().trim()
      if (output) {
        console.log(output)

        if (output.includes('Ready in') || output.includes('started server on')) {
          this.log(`✅ Server ready on port ${port}`)
          this.restartCount = 0 // Reset on successful start
          
          if (this.config.autoOpen) {
            this.openBrowser(port)
          }
        }

        if (output.includes('Error:') || output.includes('EADDRINUSE')) {
          this.log(`🚨 Server error: ${output}`, 'ERROR')
        }
      }
    })

    this.serverProcess.stderr.on('data', (data) => {
      const error = data.toString().trim()
      if (error && !error.includes('ExperimentalWarning')) {
        this.log(`🚨 Server stderr: ${error}`, 'ERROR')
      }
    })

    this.serverProcess.on('exit', (code, signal) => {
      this.log(`💀 Server exited. Code: ${code}, Signal: ${signal}`, 'WARN')
      
      this.stopHealthChecks()
      this.cleanupPidFile()

      if (!this.isShuttingDown && code !== 0) {
        this.scheduleRestart()
      }
    })

    this.serverProcess.on('error', (error) => {
      this.log(`💥 Process error: ${error.message}`, 'ERROR')
      this.scheduleRestart()
    })
  }

  startHealthChecks(port) {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    this.log('🔍 Starting health monitoring...')
    
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.checkServerHealth(port)
      
      if (!isHealthy) {
        this.log('💔 Health check failed - server unresponsive', 'ERROR')
        
        if (this.serverProcess && !this.serverProcess.killed) {
          this.log('🔪 Killing unresponsive server')
          this.serverProcess.kill('SIGTERM')
          
          setTimeout(() => {
            if (this.serverProcess && !this.serverProcess.killed) {
              this.serverProcess.kill('SIGKILL')
            }
          }, 5000)
        }
      } else {
        this.log('💚 Health check passed')
      }
    }, this.config.healthCheckInterval)
  }

  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
      this.log('🔍 Health monitoring stopped')
    }
  }

  async scheduleRestart() {
    if (this.isShuttingDown) return

    if (this.restartCount >= this.maxRestarts) {
      this.log(`🛑 Max restarts exceeded (${this.maxRestarts}). Stopping auto-start.`, 'ERROR')
      this.shutdown()
      return
    }

    this.restartCount++
    this.log(`⏰ Scheduling restart in ${this.config.restartDelay}ms (${this.restartCount}/${this.maxRestarts})`)
    
    setTimeout(() => {
      if (!this.isShuttingDown) {
        this.startServer()
      }
    }, this.config.restartDelay)
  }

  openBrowser(port) {
    try {
      const url = `http://localhost:${port}`
      this.log(`🌐 Opening browser: ${url}`)
      
      // macOS
      if (process.platform === 'darwin') {
        exec(`open "${url}"`)
      }
      // Windows
      else if (process.platform === 'win32') {
        exec(`start "${url}"`)
      }
      // Linux
      else {
        exec(`xdg-open "${url}"`)
      }
    } catch (error) {
      this.log(`Failed to open browser: ${error.message}`, 'WARN')
    }
  }

  setupGracefulShutdown() {
    const signals = ['SIGINT', 'SIGTERM', 'SIGUSR2']
    
    signals.forEach(signal => {
      process.on(signal, () => {
        this.log(`🛑 Received ${signal}, shutting down...`)
        this.shutdown()
      })
    })

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.log(`💥 Uncaught exception: ${error.message}`, 'ERROR')
      this.shutdown()
    })
  }

  cleanupPidFile() {
    try {
      if (fs.existsSync(this.pidPath)) {
        fs.unlinkSync(this.pidPath)
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  async shutdown() {
    this.isShuttingDown = true
    this.log('🛑 Auto-start service shutting down...')

    this.stopHealthChecks()
    this.cleanupPidFile()

    if (this.serverProcess && !this.serverProcess.killed) {
      this.log('🔄 Terminating server process...')
      this.serverProcess.kill('SIGTERM')
      
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          this.log('🔪 Force killing server process')
          this.serverProcess.kill('SIGKILL')
        }
        
        setTimeout(() => {
          this.log('👋 Auto-start service stopped')
          process.exit(0)
        }, 1000)
      }, 5000)
    } else {
      this.log('👋 Auto-start service stopped')
      process.exit(0)
    }
  }

  async getStatus() {
    const status = {
      running: false,
      port: null,
      pid: null,
      healthy: false,
      uptime: null
    }

    try {
      if (fs.existsSync(this.pidPath)) {
        const pidStr = fs.readFileSync(this.pidPath, 'utf8').trim()
        const pid = parseInt(pidStr)
        
        // Check if process is still running
        try {
          process.kill(pid, 0) // Send signal 0 to test if process exists
          status.running = true
          status.pid = pid
        } catch (error) {
          // Process doesn't exist, clean up pid file
          this.cleanupPidFile()
        }
      }

      if (status.running) {
        // Try to determine port and health
        for (const port of [this.config.port, ...this.config.fallbackPorts]) {
          if (await this.checkServerHealth(port)) {
            status.port = port
            status.healthy = true
            break
          }
        }
      }

      return status
    } catch (error) {
      return status
    }
  }

  async start() {
    this.log('🎯 Auto-start service starting...')
    this.log(`📊 Config: port=${this.config.port}, healthCheck=${this.config.healthCheckInterval}ms, autoOpen=${this.config.autoOpen}`)
    
    try {
      const result = await this.startServer()
      this.log(`✅ Server started successfully on port ${result.port} (PID: ${result.pid})`)
      return result
    } catch (error) {
      this.log(`❌ Failed to start server: ${error.message}`, 'ERROR')
      throw error
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2]
  const service = new AutoStartService()

  switch (command) {
    case 'start':
      service.start().catch(error => {
        console.error('Failed to start:', error.message)
        process.exit(1)
      })
      break

    case 'status':
      service.getStatus().then(status => {
        console.log('Server Status:', JSON.stringify(status, null, 2))
        process.exit(status.running && status.healthy ? 0 : 1)
      })
      break

    case 'stop':
      service.shutdown()
      break

    default:
      console.log('Usage: node auto-start.js [start|status|stop]')
      console.log('  start  - Start the development server with auto-restart')
      console.log('  status - Check server status')
      console.log('  stop   - Stop the server')
      process.exit(1)
  }
}

module.exports = AutoStartService