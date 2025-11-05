#!/usr/bin/env node

/**
 * Startup Validation Script
 * Validates environment and dependencies before server startup
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class StartupValidator {
  constructor() {
    this.errors = []
    this.warnings = []
    this.projectRoot = path.join(__dirname, '..')
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString()
    const colors = {
      INFO: '\x1b[32m',   // Green
      WARN: '\x1b[33m',   // Yellow
      ERROR: '\x1b[31m',  // Red
      SUCCESS: '\x1b[36m' // Cyan
    }
    const resetColor = '\x1b[0m'
    
    console.log(`${colors[type] || ''}[${timestamp}] [${type}] ${message}${resetColor}`)
  }

  async validateEnvironment() {
    this.log('🔍 Validating environment...', 'INFO')
    
    // Check Node.js version
    const nodeVersion = process.version
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
    
    if (majorVersion < 16) {
      this.errors.push(`Node.js version ${nodeVersion} is too old. Requires Node.js 16+`)
    } else {
      this.log(`✅ Node.js version: ${nodeVersion}`, 'SUCCESS')
    }

    // Check environment variables
    const requiredEnvVars = ['GEMINI_API_KEY']
    const optionalEnvVars = []
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        this.errors.push(`Missing required environment variable: ${envVar}`)
      }
    }

    for (const envVar of optionalEnvVars) {
      if (!process.env[envVar]) {
        this.warnings.push(`Optional environment variable not set: ${envVar}`)
      } else {
        this.log(`✅ Environment variable set: ${envVar}`, 'SUCCESS')
      }
    }
  }

  async validateFiles() {
    this.log('📁 Validating project files...', 'INFO')
    
    const requiredFiles = [
      'package.json',
      'next.config.js',
      'tsconfig.json',
      'src/pages/_app.tsx',
      'src/pages/index.tsx',
      'src/pages/api/health.ts',
      'public/logos/lakeb2b-logo.png'
    ]

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file)
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing required file: ${file}`)
      } else {
        this.log(`✅ File exists: ${file}`, 'SUCCESS')
      }
    }

    // Check if next build artifacts exist (for production)
    const buildDir = path.join(this.projectRoot, '.next')
    if (process.env.NODE_ENV === 'production' && !fs.existsSync(buildDir)) {
      this.errors.push('Production mode requires built application (.next directory missing)')
    }
  }

  async validateDependencies() {
    this.log('📦 Validating dependencies...', 'INFO')
    
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      
      // Check critical dependencies
      const criticalDeps = [
        'next',
        'react',
        'react-dom',
        '@chakra-ui/react'
      ]

      for (const dep of criticalDeps) {
        if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
          this.errors.push(`Missing critical dependency: ${dep}`)
        } else {
          this.log(`✅ Dependency found: ${dep}`, 'SUCCESS')
        }
      }

      // Check if node_modules exists
      const nodeModulesPath = path.join(this.projectRoot, 'node_modules')
      if (!fs.existsSync(nodeModulesPath)) {
        this.errors.push('node_modules directory missing. Run npm install.')
      } else {
        this.log('✅ node_modules directory exists', 'SUCCESS')
      }

    } catch (error) {
      this.errors.push(`Failed to validate dependencies: ${error.message}`)
    }
  }

  async validatePorts() {
    this.log('🔌 Validating ports...', 'INFO')
    
    const defaultPort = 3000
    const portToCheck = process.env.PORT || defaultPort

    try {
      // Try to bind to the port
      const net = require('net')
      const server = net.createServer()
      
      await new Promise((resolve, reject) => {
        server.listen(portToCheck, () => {
          server.close()
          this.log(`✅ Port ${portToCheck} is available`, 'SUCCESS')
          resolve()
        })
        
        server.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            this.warnings.push(`Port ${portToCheck} is already in use`)
          } else {
            this.errors.push(`Port validation failed: ${err.message}`)
          }
          reject(err)
        })
      })
    } catch (error) {
      // Port check failed, but this might be acceptable
    }
  }

  async validateServices() {
    this.log('🔧 Validating services...', 'INFO')
    
    try {
      // Check if service files exist (basic validation)
      const serviceFiles = [
        'src/services/imageGenerationService.ts',
        'src/services/logoService.ts',
        'src/services/interfaces/IImageGenerationService.ts',
        'src/services/interfaces/ILogoService.ts'
      ]
      
      for (const file of serviceFiles) {
        const filePath = path.join(this.projectRoot, file)
        if (!fs.existsSync(filePath)) {
          this.errors.push(`Missing service file: ${file}`)
        } else {
          this.log(`✅ Service file exists: ${file}`, 'SUCCESS')
        }
      }

      // Note: Cannot test TypeScript modules in Node.js validation script
      // Services will be validated during TypeScript compilation

    } catch (error) {
      this.errors.push(`Service validation failed: ${error.message}`)
    }
  }

  async validateTypeScript() {
    this.log('📝 Validating TypeScript...', 'INFO')
    
    try {
      // Run TypeScript type checking
      execSync('npx tsc --noEmit', { 
        cwd: this.projectRoot,
        stdio: 'pipe'
      })
      this.log('✅ TypeScript validation passed', 'SUCCESS')
    } catch (error) {
      this.warnings.push('TypeScript validation failed - check for type errors')
    }
  }

  async run() {
    this.log('🚀 Starting startup validation...', 'INFO')
    
    await this.validateEnvironment()
    await this.validateFiles()
    await this.validateDependencies()
    await this.validatePorts()
    await this.validateServices()
    await this.validateTypeScript()
    
    // Report results
    this.log('\n📊 Validation Results:', 'INFO')
    
    if (this.errors.length > 0) {
      this.log(`❌ ${this.errors.length} error(s) found:`, 'ERROR')
      this.errors.forEach(error => this.log(`  • ${error}`, 'ERROR'))
    }
    
    if (this.warnings.length > 0) {
      this.log(`⚠️  ${this.warnings.length} warning(s) found:`, 'WARN')
      this.warnings.forEach(warning => this.log(`  • ${warning}`, 'WARN'))
    }
    
    if (this.errors.length === 0) {
      this.log('🎉 All validation checks passed!', 'SUCCESS')
      return true
    } else {
      this.log('💥 Validation failed. Please fix the errors above.', 'ERROR')
      return false
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new StartupValidator()
  validator.run().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('Validation script failed:', error)
    process.exit(1)
  })
}

module.exports = StartupValidator