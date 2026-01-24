const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// Create meme-templates directory if it doesn't exist
const templatesDir = path.join(process.cwd(), 'public', 'meme-templates')
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true })
}

// Define meme template placeholders with instructions
const memeTemplates = [
  {
    name: 'drake-template.png',
    width: 1080,
    height: 1080,
    description: 'Drake pointing meme - Two panel format',
    instructions: 'Replace with actual Drake meme template image'
  },
  {
    name: 'distracted-boyfriend-template.png', 
    width: 1080,
    height: 1080,
    description: 'Distracted boyfriend meme',
    instructions: 'Replace with actual distracted boyfriend stock photo meme'
  },
  {
    name: 'woman-cat-template.png',
    width: 1080,
    height: 1080,
    description: 'Woman yelling at cat meme',
    instructions: 'Replace with actual woman yelling at cat meme template'
  },
  {
    name: 'change-my-mind-template.png',
    width: 1080,
    height: 1080,
    description: 'Change my mind meme with sign',
    instructions: 'Replace with actual Steven Crowder change my mind meme'
  }
]

async function createPlaceholder(template) {
  const { name, width, height, description, instructions } = template
  
  // Create a placeholder image with instructions
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <rect x="10" y="10" width="${width-20}" height="${height-20}" 
            fill="none" stroke="#666" stroke-width="2" stroke-dasharray="10,10"/>
      <text x="50%" y="40%" text-anchor="middle" font-family="Arial" font-size="36" fill="#333">
        PLACEHOLDER
      </text>
      <text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="#666">
        ${description}
      </text>
      <text x="50%" y="60%" text-anchor="middle" font-family="Arial" font-size="18" fill="#999">
        ${instructions}
      </text>
    </svg>
  `
  
  const buffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer()
    
  fs.writeFileSync(path.join(templatesDir, name), buffer)
  console.log(`Created placeholder: ${name}`)
}

// Create all placeholders
async function createAllPlaceholders() {
  console.log('Creating meme template placeholders...')
  
  for (const template of memeTemplates) {
    await createPlaceholder(template)
  }
  
  console.log('\nPlaceholder images created successfully!')
  console.log('\nIMPORTANT: Replace these placeholders with actual meme template images:')
  console.log('1. Drake pointing meme (two panels)')
  console.log('2. Distracted boyfriend stock photo')
  console.log('3. Woman yelling at cat (two panel format)')
  console.log('4. Steven Crowder "Change My Mind" meme')
  console.log('\nYou can find these templates on sites like:')
  console.log('- Know Your Meme')
  console.log('- Imgflip')
  console.log('- Meme Generator')
}

createAllPlaceholders().catch(console.error)