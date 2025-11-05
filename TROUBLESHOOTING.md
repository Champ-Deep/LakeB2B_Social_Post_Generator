# Troubleshooting Guide

## Common Issues and Solutions

### 1. Connection Refused / Development Server Issues
This is the most common issue. The server may show "Ready" but connections are refused.

**Solution:**
```bash
# 1. Kill any existing processes on ports 3000, 3001, and 3002
# (Next.js auto-increments ports if 3000 is busy, causing conflicts)
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# 2. Clear any cached builds
rm -rf .next

# 3. Restart the server (configured for port 3000)
npm run dev

# 4. Wait for "Ready in X ms" message
# 5. Open http://localhost:3000
```

**Why this happens:**
- Orphaned Next.js processes running on wrong ports
- Compilation errors preventing proper startup
- Port conflicts between different projects
- Cached build artifacts causing issues

### 2. Dependencies Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 3. Environment Variables
Ensure `.env.local` exists with:
```
GEMINI_API_KEY=your-api-key-here
```

### 4. TypeScript Errors
```bash
# Check for TypeScript issues
npm run lint
npx tsc --noEmit
```

### 5. Browser Issues
- Clear browser cache
- Try incognito/private mode
- Check browser console for JavaScript errors

### 6. API Issues
- Check if the Gemini API key is working
- Verify network connectivity
- Check browser Network tab for failed API calls

## Quick Test
1. Visit http://localhost:3000
2. You should see "LakeB2B Social Post Generator" heading
3. Form should be visible on the left
4. Preview panel should be on the right

## Getting Help
If issues persist:
1. Check the terminal for error messages
2. Check browser console (F12) for JavaScript errors
3. Verify all files are present in the project directory