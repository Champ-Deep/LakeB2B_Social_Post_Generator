# 🚀 LakeB2B Social Post Generator - Server Startup Guide

## Quick Start (Recommended)

### Method 1: Double-Click Launcher (macOS)
1. Double-click `start.command` in the project folder
2. The server will start automatically and open in your browser
3. Leave the terminal window open while using the app

### Method 2: Auto-Start Service
```bash
npm run start:auto
```
This provides the most reliable startup with automatic recovery.

## Alternative Startup Methods

### Enhanced Startup Script
```bash
./start-lakeb2b.sh --auto          # Auto-restart service (recommended)
./start-lakeb2b.sh --simple        # Simple mode
./start-lakeb2b.sh --supervised    # Supervised mode
./start-lakeb2b.sh --status        # Check server status
./start-lakeb2b.sh --help          # Show help
```

### NPM Scripts
```bash
npm run start:auto        # Start with auto-restart (recommended)
npm run server:status     # Check if server is running
npm run server:stop       # Stop the server
npm run restart           # Stop and restart
npm run quick-start       # Simple startup
```

### Manual Development
```bash
npm run dev              # Standard Next.js development
```

## Server Status & Management

### Check Server Status
```bash
npm run server:status
```

### Stop Server
```bash
npm run server:stop
```

### Restart Server
```bash
npm run restart
```

## Configuration

### Environment Setup
1. Copy `.env.local.template` to `.env.local`
2. Add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

### Server Configuration
Edit `dev-server.json` to customize:
- Port preferences
- Health check intervals
- Auto-restart settings
- Browser auto-open

## Troubleshooting

### Connection Refused Error
1. Run `npm run server:status` to check if server is running
2. Run `npm run restart` to restart the server
3. Check if port 3000 is occupied by another process

### Port Already in Use
The auto-start service will automatically try ports 3000 → 3001 → 3002 → 3003

### Dependencies Issues
```bash
rm -rf node_modules package-lock.json
npm install
npm run start:auto
```

## Features

### Auto-Start Service Benefits
- ✅ Automatic port detection and fallback
- ✅ Health monitoring every 30 seconds
- ✅ Automatic restart on crashes
- ✅ Process cleanup on startup
- ✅ Browser auto-open
- ✅ Graceful shutdown handling
- ✅ Detailed logging

### Monitoring
- Health checks every 30 seconds
- Automatic recovery from unresponsive state
- Process monitoring and restart
- Clean port management

## Support

If you encounter persistent connection issues:
1. Check the logs in `logs/auto-start.log`
2. Ensure Node.js and npm are properly installed
3. Verify your Gemini API key is configured
4. Try restarting your computer and running `npm run start:auto`

For the best experience, use `npm run start:auto` or double-click `start.command`!