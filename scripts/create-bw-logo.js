/**
 * Create B&W version of LakeB2B logo for newyork-cartoon style
 *
 * This script converts the color logo to a high-contrast black & white version
 * suitable for the New York Cartoon editorial style.
 */

const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

async function createBWLogo() {
  const logosDir = path.join(__dirname, '..', 'public', 'logos')
  const colorLogoPath = path.join(logosDir, 'LakeB2B Logo Square.png')
  const bwLogoPath = path.join(logosDir, 'LakeB2B Logo BW.png')

  console.log('Creating B&W logo for newyork-cartoon style...')
  console.log(`Source: ${colorLogoPath}`)
  console.log(`Output: ${bwLogoPath}`)

  // Check if source exists
  if (!fs.existsSync(colorLogoPath)) {
    console.error('Error: Source logo not found!')
    process.exit(1)
  }

  try {
    // Load the color logo
    const image = sharp(colorLogoPath)
    const metadata = await image.metadata()

    console.log(`Original size: ${metadata.width}x${metadata.height}`)

    // Convert to B&W with high contrast
    // Steps:
    // 1. Convert to grayscale
    // 2. Apply threshold for pure B&W (not grayscale)
    // 3. Ensure transparency is preserved or converted to white
    await image
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // White background for transparent areas
      .grayscale() // Convert to grayscale
      .threshold(128) // Convert to pure B&W (values below 128 become black, above become white)
      .png()
      .toFile(bwLogoPath)

    console.log('B&W logo created successfully!')

    // Verify the file was created
    const stats = fs.statSync(bwLogoPath)
    console.log(`Output file size: ${(stats.size / 1024).toFixed(1)}KB`)

    // Also create a version with inverted colors for dark backgrounds
    const invertedPath = path.join(logosDir, 'LakeB2B Logo BW Inverted.png')
    await sharp(colorLogoPath)
      .flatten({ background: { r: 0, g: 0, b: 0 } }) // Black background for transparent areas
      .grayscale()
      .threshold(128)
      .negate({ alpha: false }) // Invert colors (black becomes white, white becomes black)
      .png()
      .toFile(invertedPath)

    console.log(`Inverted version also created: ${invertedPath}`)

  } catch (error) {
    console.error('Error creating B&W logo:', error)
    process.exit(1)
  }
}

createBWLogo()
