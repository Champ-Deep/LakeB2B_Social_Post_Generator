/**
 * Generate placeholder style preview images for the StyleMoodBoard
 * Run with: node scripts/create-style-previews.js
 */

const fs = require('fs')
const path = require('path')

const previewsDir = path.join(__dirname, '../public/style-previews')

// Ensure the directory exists
if (!fs.existsSync(previewsDir)) {
  fs.mkdirSync(previewsDir, { recursive: true })
}

// Style configurations with gradient colors
const styles = [
  {
    id: 'isometric',
    gradient: ['#6D08BE', '#FFB703'],
    icon: '🏢'
  },
  {
    id: 'infographic',
    gradient: ['#0077B6', '#00B4D8'],
    icon: '📊'
  },
  {
    id: 'newyork-cartoon',
    gradient: ['#2D3436', '#636E72'],
    icon: '🗽'
  },
  {
    id: 'minimalist-linkedin',
    gradient: ['#6D08BE', '#DD1286'],
    icon: '✨'
  },
  {
    id: 'meme',
    gradient: ['#E17055', '#FDCB6E'],
    icon: '😂'
  }
]

// Generate simple SVG placeholders
styles.forEach(style => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
  <defs>
    <linearGradient id="grad-${style.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${style.gradient[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${style.gradient[1]};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="150" fill="url(#grad-${style.id})"/>
  <text x="100" y="75" font-size="40" text-anchor="middle" dominant-baseline="middle">${style.icon}</text>
  <text x="100" y="130" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle">${style.id}</text>
</svg>`

  const svgPath = path.join(previewsDir, `${style.id}.svg`)
  fs.writeFileSync(svgPath, svg)
  console.log(`Created: ${svgPath}`)
})

console.log('\n✅ Style preview placeholders created!')
console.log('📝 Note: Replace these SVGs with actual PNG screenshots for production.')
