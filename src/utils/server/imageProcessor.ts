/**
 * Server-side image processing utility using Sharp
 * Compatible with Vercel and other serverless environments
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

export interface LogoPlacement {
  x: number
  y: number
  width: number
  height: number
  opacity?: number
  rotation?: number
}

export interface ImageProcessingOptions {
  style?: string
  position?: string
  logoSize?: number
  logoOpacity?: number
  logoRotation?: number
}

/**
 * Load image from URL or base64
 */
async function loadImage(source: string | Buffer): Promise<Buffer> {
  if (Buffer.isBuffer(source)) {
    return source
  }

  if (source.startsWith('data:image')) {
    // Base64 data URL
    const base64Data = source.replace(/^data:image\/[a-z]+;base64,/, '')
    return Buffer.from(base64Data, 'base64')
  }

  if (source.startsWith('http://') || source.startsWith('https://')) {
    // Remote URL
    const response = await axios.get(source, { responseType: 'arraybuffer' })
    return Buffer.from(response.data)
  }

  // Local file path
  return fs.readFileSync(source)
}

/**
 * Get logo path based on style
 */
function getLogoPath(style: string = 'isometric'): string {
  const logoDir = path.join(process.cwd(), 'public', 'logos')
  
  if (style === 'newyork-cartoon') {
    const bwLogoPath = path.join(logoDir, 'LakeB2B Logo BW.png')
    if (fs.existsSync(bwLogoPath)) {
      return bwLogoPath
    }
  }
  
  return path.join(logoDir, 'LakeB2B Logo Square.png')
}

/**
 * Calculate logo placement based on position and size
 */
function calculateLogoPlacement(
  imageWidth: number,
  imageHeight: number,
  logoWidth: number,
  logoHeight: number,
  position: string = 'bottom-left',
  logoSize: number = 35
): LogoPlacement {
  const margin = 20
  const scaledWidth = Math.max(200, imageWidth * (logoSize / 100))
  const scaledHeight = (logoHeight / logoWidth) * scaledWidth

  let x: number, y: number

  switch (position) {
    case 'bottom-right':
      x = imageWidth - scaledWidth - margin
      y = imageHeight - scaledHeight - margin
      break
    case 'top-right':
      x = imageWidth - scaledWidth - margin
      y = margin
      break
    case 'bottom-left':
    default:
      x = margin
      y = imageHeight - scaledHeight - margin
      break
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(scaledWidth),
    height: Math.round(scaledHeight),
  }
}

/**
 * Apply logo overlay to image using Sharp
 */
export async function addLogoOverlay(
  baseImage: string | Buffer,
  options: ImageProcessingOptions = {}
): Promise<string> {
  try {
    const {
      style = 'isometric',
      position = 'bottom-left',
      logoSize = 35,
      logoOpacity = 85,
      logoRotation = 0,
    } = options

    // Load base image
    const baseImageBuffer = await loadImage(baseImage)
    const baseImageSharp = sharp(baseImageBuffer)
    const metadata = await baseImageSharp.metadata()
    const imageWidth = metadata.width || 1080
    const imageHeight = metadata.height || 1080

    // Load logo
    const logoPath = getLogoPath(style)
    if (!fs.existsSync(logoPath)) {
      console.warn(`Logo not found at ${logoPath}, returning base image`)
      return `data:image/png;base64,${baseImageBuffer.toString('base64')}`
    }

    const logoBuffer = fs.readFileSync(logoPath)
    const logoSharp = sharp(logoBuffer)
    const logoMetadata = await logoSharp.metadata()
    const logoWidth = logoMetadata.width || 200
    const logoHeight = logoMetadata.height || 200

    // Calculate placement
    const placement = calculateLogoPlacement(
      imageWidth,
      imageHeight,
      logoWidth,
      logoHeight,
      position,
      logoSize
    )

    // Resize logo first
    let processedLogo = logoSharp.resize(placement.width, placement.height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })

    // Apply style-specific processing
    if (style === 'newyork-cartoon') {
      // Convert to grayscale and apply threshold for black and white effect
      processedLogo = processedLogo.greyscale().threshold(128)
    }

    // Apply rotation if needed (before opacity to avoid artifacts)
    if (logoRotation !== 0) {
      processedLogo = processedLogo.rotate(logoRotation, {
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
    }

    // Ensure alpha channel and get processed logo
    const processedLogoBuffer = await processedLogo
      .ensureAlpha()
      .png()
      .toBuffer()

    // Apply opacity by creating a semi-transparent version
    // For opacity < 100%, we'll apply it during compositing
    let compositeInput = processedLogoBuffer
    if (logoOpacity < 100) {
      // Create a composite that applies opacity
      // Sharp doesn't have direct opacity in composite, so we modify alpha channel
      const { data, info } = await sharp(processedLogoBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })

      const opacityMultiplier = logoOpacity / 100
      // Modify alpha channel (every 4th byte, starting at index 3)
      for (let i = 3; i < data.length; i += 4) {
        data[i] = Math.round(data[i] * opacityMultiplier)
      }

      compositeInput = await sharp(data, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 4,
        },
      })
        .png()
        .toBuffer()
    }

    // Composite logo onto base image
    // Use 'over' blend mode which respects alpha channel and opacity
    const finalImage = await baseImageSharp
      .composite([
        {
          input: compositeInput,
          left: placement.x,
          top: placement.y,
          blend: style === 'newyork-cartoon' ? 'multiply' : 'over',
        },
      ])
      .png()
      .toBuffer()

    // Convert to data URL
    return `data:image/png;base64,${finalImage.toString('base64')}`
  } catch (error) {
    console.error('Error adding logo overlay:', error)
    // Return base image as fallback
    if (typeof baseImage === 'string' && baseImage.startsWith('data:image')) {
      return baseImage
    }
    const buffer = Buffer.isBuffer(baseImage) ? baseImage : await loadImage(baseImage)
    return `data:image/png;base64,${buffer.toString('base64')}`
  }
}

/**
 * Create placeholder image using Sharp
 */
export async function createPlaceholderImage(
  style: string = 'isometric',
  prompt: string = 'LakeB2B'
): Promise<string> {
  try {
    const width = 1080
    const height = 1080

    let svg: string
    let backgroundColor: string
    let textColor: string

    switch (style) {
      case 'newyork-cartoon':
        backgroundColor = '#FFFFFF'
        textColor = '#000000'
        break
      case 'minimalist-linkedin':
        backgroundColor = '#F8F9FA'
        textColor = '#6D08BE'
        break
      case 'isometric':
      default:
        // Create gradient using SVG
        svg = `
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#6D08BE;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#FFB703;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#DD1286;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad)" />
            <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
                  fill="white" text-anchor="middle" dominant-baseline="middle">${prompt}</text>
            <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="24" 
                  fill="white" text-anchor="middle" dominant-baseline="middle">Style: ${style}</text>
          </svg>
        `
        const gradientBuffer = Buffer.from(svg)
        const image = await sharp(gradientBuffer).png().toBuffer()
        return `data:image/png;base64,${image.toString('base64')}`
    }

    // Create solid color image with text
    svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${backgroundColor}" />
        <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
              fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${prompt}</text>
        <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="24" 
              fill="${textColor}" text-anchor="middle" dominant-baseline="middle">Style: ${style}</text>
      </svg>
    `

    const svgBuffer = Buffer.from(svg)
    const image = await sharp(svgBuffer).png().toBuffer()
    return `data:image/png;base64,${image.toString('base64')}`
  } catch (error) {
    console.error('Error creating placeholder:', error)
    // Fallback to simple colored image
    const fallbackSvg = `
      <svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#6D08BE" />
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
              fill="white" text-anchor="middle" dominant-baseline="middle">LakeB2B</text>
      </svg>
    `
    const buffer = Buffer.from(fallbackSvg)
    const image = await sharp(buffer).png().toBuffer()
    return `data:image/png;base64,${image.toString('base64')}`
  }
}

