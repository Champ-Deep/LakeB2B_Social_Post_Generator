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
  memeTopText?: string
  memeBottomText?: string
  memeTexts?: string[]
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
 * Apply meme text overlay
 */
async function addMemeTextOverlay(
  image: sharp.Sharp,
  options: ImageProcessingOptions,
  metadata: sharp.Metadata
): Promise<sharp.Sharp> {
  const width = metadata.width || 1080
  const height = metadata.height || 1080
  
  const composites: sharp.OverlayOptions[] = []
  
  // Determine meme format from style
  const style = options.style || ''
  
  if (style.startsWith('meme-')) {
    const fontSize = Math.max(36, Math.floor(width / 20))
    const strokeWidth = Math.max(3, Math.floor(fontSize / 12))
    
    // Create text overlays based on meme type
    if (style === 'meme-drake' && options.memeTopText && options.memeBottomText) {
      // Top panel text
      const topTextSvg = `
        <svg width="${width}" height="${height/2}">
          <text x="50%" y="20%" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" 
                font-size="${fontSize}" font-weight="bold" fill="white" 
                stroke="black" stroke-width="${strokeWidth}">
            ${options.memeTopText.toUpperCase()}
          </text>
        </svg>
      `
      composites.push({
        input: Buffer.from(topTextSvg),
        top: 0,
        left: 0
      })
      
      // Bottom panel text
      const bottomTextSvg = `
        <svg width="${width}" height="${height/2}">
          <text x="50%" y="20%" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" 
                font-size="${fontSize}" font-weight="bold" fill="white" 
                stroke="black" stroke-width="${strokeWidth}">
            ${options.memeBottomText.toUpperCase()}
          </text>
        </svg>
      `
      composites.push({
        input: Buffer.from(bottomTextSvg),
        top: Math.floor(height/2),
        left: 0
      })
    } else if ((style === 'meme-brain' || style === 'meme-expanding') && options.memeTexts) {
      // Multiple text overlays for expanding brain meme
      const panelHeight = height / 4
      options.memeTexts.slice(0, 4).forEach((text, index) => {
        const textSvg = `
          <svg width="${width/2}" height="${panelHeight}">
            <text x="10" y="50%" font-family="Impact, Arial Black, sans-serif" 
                  font-size="${fontSize * 0.8}" font-weight="bold" fill="white" 
                  stroke="black" stroke-width="${strokeWidth}">
              ${text.toUpperCase()}
            </text>
          </svg>
        `
        composites.push({
          input: Buffer.from(textSvg),
          top: Math.floor(index * panelHeight),
          left: 0
        })
      })
    } else if (style === 'meme-woman-cat' && options.memeTexts && Array.isArray(options.memeTexts) && options.memeTexts.length >= 2) {
      // Woman text (left)
      const womanTextSvg = `
        <svg width="${width/2}" height="${height}">
          <text x="50%" y="90%" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" 
                font-size="${fontSize}" font-weight="bold" fill="white" 
                stroke="black" stroke-width="${strokeWidth}">
            ${options.memeTexts[0].toUpperCase()}
          </text>
        </svg>
      `
      composites.push({
        input: Buffer.from(womanTextSvg),
        top: 0,
        left: 0
      })
      
      // Cat text (right)
      const catTextSvg = `
        <svg width="${width/2}" height="${height}">
          <text x="50%" y="90%" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" 
                font-size="${fontSize}" font-weight="bold" fill="white" 
                stroke="black" stroke-width="${strokeWidth}">
            ${options.memeTexts[1].toUpperCase()}
          </text>
        </svg>
      `
      composites.push({
        input: Buffer.from(catTextSvg),
        top: 0,
        left: Math.floor(width/2)
      })
    } else if (options.memeTopText || options.memeBottomText) {
      // Standard top/bottom text
      if (options.memeTopText) {
        const topTextSvg = `
          <svg width="${width}" height="${height}">
            <text x="50%" y="10%" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" 
                  font-size="${fontSize}" font-weight="bold" fill="white" 
                  stroke="black" stroke-width="${strokeWidth}">
              ${options.memeTopText.toUpperCase()}
            </text>
          </svg>
        `
        composites.push({
          input: Buffer.from(topTextSvg),
          top: 0,
          left: 0
        })
      }
      
      if (options.memeBottomText) {
        const bottomTextSvg = `
          <svg width="${width}" height="${height}">
            <text x="50%" y="95%" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" 
                  font-size="${fontSize}" font-weight="bold" fill="white" 
                  stroke="black" stroke-width="${strokeWidth}">
              ${options.memeBottomText.toUpperCase()}
            </text>
          </svg>
        `
        composites.push({
          input: Buffer.from(bottomTextSvg),
          top: 0,
          left: 0
        })
      }
    }
  }
  
  if (composites.length > 0) {
    return image.composite(composites)
  }
  
  return image
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
      // For B&W style, add white background to logo for visibility
      processedLogo = processedLogo
        .flatten({ background: '#FFFFFF' })
        .extend({
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
          background: '#FFFFFF'
        })
        .composite([{
          input: Buffer.from(
            `<svg width="${placement.width + 20}" height="${placement.height + 20}">
              <rect width="100%" height="100%" fill="white" stroke="black" stroke-width="3"/>
            </svg>`
          ),
          blend: 'dest-over'
        }])
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

    // Apply meme text overlay if needed
    let processedImage = baseImageSharp
    if (style.startsWith('meme-') && (options.memeTopText || options.memeBottomText || options.memeTexts)) {
      processedImage = await addMemeTextOverlay(processedImage, options, metadata)
    }

    // Composite logo onto base image
    // For New York Cartoon style, use max opacity and 'over' blend for best visibility on lightened background
    const finalImage = await processedImage
      .composite([
        {
          input: compositeInput,
          left: placement.x,
          top: placement.y,
          blend: 'over',
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
/**
 * Create meme from template with text overlays
 */
export async function createMemeFromTemplate(
  format: string,
  memeTexts: Record<string, string> = {}
): Promise<string> {
  try {
    const width = 1080
    const height = 1080
    
    // Load the appropriate template PNG
    const templatePath = path.join(process.cwd(), 'public', 'meme-templates', `${format}-template.png`)
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Meme template not found: ${format}`)
    }
    
    // Load template image
    const templateBuffer = fs.readFileSync(templatePath)
    let memeImage = sharp(templateBuffer)
    const metadata = await memeImage.metadata()
    
    // Prepare text overlays based on format
    const composites: sharp.OverlayOptions[] = []
    const fontSize = 60
    const strokeWidth = 3
    
    // Helper function to create text SVG
    const createTextSvg = (text: string, x: string, y: string, maxWidth: number = width, anchor: string = 'middle') => {
      return Buffer.from(`
        <svg width="${maxWidth}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <style>
            .meme-text {
              font-family: Impact, Arial Black, sans-serif;
              font-size: ${fontSize}px;
              font-weight: bold;
              fill: white;
              stroke: black;
              stroke-width: ${strokeWidth}px;
              paint-order: stroke;
            }
          </style>
          <text x="${x}" y="${y}" class="meme-text" text-anchor="${anchor}">
            ${text.toUpperCase()}
          </text>
        </svg>
      `)
    }
    
    switch (format) {
      case 'drake':
        // Drake meme: Two panels, top and bottom
        if (memeTexts.top) {
          composites.push({
            input: createTextSvg(memeTexts.top, '70%', '25%', width),
            top: 0,
            left: 0
          })
        }
        if (memeTexts.bottom) {
          composites.push({
            input: createTextSvg(memeTexts.bottom, '70%', '75%', width),
            top: 0,
            left: 0
          })
        }
        break
        
      case 'distracted':
        // Distracted boyfriend: Three text areas
        if (memeTexts.girlfriend) {
          composites.push({
            input: createTextSvg(memeTexts.girlfriend, '15%', '90%', width * 0.3),
            top: 0,
            left: 0
          })
        }
        if (memeTexts.boyfriend) {
          composites.push({
            input: createTextSvg(memeTexts.boyfriend, '50%', '90%', width * 0.3),
            top: 0,
            left: Math.floor(width * 0.35)
          })
        }
        if (memeTexts['other-woman']) {
          composites.push({
            input: createTextSvg(memeTexts['other-woman'], '50%', '90%', width * 0.3),
            top: 0,
            left: Math.floor(width * 0.7)
          })
        }
        break
        
      case 'woman-cat':
        // Woman yelling at cat: Two panels side by side
        if (memeTexts.woman) {
          composites.push({
            input: createTextSvg(memeTexts.woman, '25%', '90%', width * 0.5),
            top: 0,
            left: 0
          })
        }
        if (memeTexts.cat) {
          composites.push({
            input: createTextSvg(memeTexts.cat, '25%', '90%', width * 0.5),
            top: 0,
            left: Math.floor(width * 0.5)
          })
        }
        break
        
      case 'change-mind':
        // Change my mind: Text on the sign
        if (memeTexts.sign) {
          // Position text on the sign area (typically center-bottom of image)
          composites.push({
            input: createTextSvg(memeTexts.sign, '50%', '75%', width * 0.6),
            top: 0,
            left: Math.floor(width * 0.2)
          })
        }
        break
    }
    
    // Apply text overlays if any
    if (composites.length > 0) {
      memeImage = memeImage.composite(composites)
    }
    
    // Convert to PNG and return as data URL
    const outputBuffer = await memeImage.png().toBuffer()
    return `data:image/png;base64,${outputBuffer.toString('base64')}`
    
  } catch (error) {
    console.error('Error creating meme from template:', error)
    
    // Fallback to simple placeholder
    const fallbackSvg = `
      <svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#6B46C1" />
        <text x="50%" y="50%" font-family="Impact, Arial Black, sans-serif" font-size="48" font-weight="bold" 
              fill="white" text-anchor="middle" dominant-baseline="middle">MEME TEMPLATE ERROR</text>
      </svg>
    `
    const buffer = Buffer.from(fallbackSvg)
    const image = await sharp(buffer).png().toBuffer()
    return `data:image/png;base64,${image.toString('base64')}`
  }
}

export async function createPlaceholderImage(
  style: string = 'isometric',
  prompt: string = 'LakeB2B'
): Promise<string> {
  try {
    const width = 1080
    const height = 1080

    const svgToDataUrl = async (svgMarkup: string) => {
      const buffer = Buffer.from(svgMarkup)
      const image = await sharp(buffer).png().toBuffer()
      return `data:image/png;base64,${image.toString('base64')}`
    }

    switch (style) {
      case 'meme-drake':
        return svgToDataUrl(`
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="50%" fill="#6B46C1"/>
            <rect y="50%" width="100%" height="50%" fill="#FFB703"/>
            <text x="50%" y="20%" text-anchor="middle" font-family="Impact" font-size="64" fill="#fff" stroke="#000" stroke-width="4">
              TOP PANEL
            </text>
            <text x="50%" y="70%" text-anchor="middle" font-family="Impact" font-size="64" fill="#fff" stroke="#000" stroke-width="4">
              BOTTOM PANEL
            </text>
          </svg>
        `)
      case 'meme-distracted':
        return svgToDataUrl(`
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f7f7f7"/>
            <rect x="40" y="220" width="300" height="520" rx="40" fill="#d4d4d8"/>
            <rect x="380" y="220" width="300" height="520" rx="40" fill="#fecdd3"/>
            <rect x="720" y="220" width="300" height="520" rx="40" fill="#bfdbfe"/>
            <text x="190" y="780" text-anchor="middle" font-family="Impact" font-size="48" fill="#111" stroke="#fff" stroke-width="3">
              Status Quo
            </text>
            <text x="530" y="780" text-anchor="middle" font-family="Impact" font-size="48" fill="#111" stroke="#fff" stroke-width="3">
              Distraction
            </text>
            <text x="870" y="780" text-anchor="middle" font-family="Impact" font-size="48" fill="#111" stroke="#fff" stroke-width="3">
              You
            </text>
          </svg>
        `)
      case 'meme-woman-cat':
        return svgToDataUrl(`
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="50%" height="100%" fill="#fee2e2"/>
            <rect x="50%" width="50%" height="100%" fill="#e0f2fe"/>
            <text x="25%" y="90%" text-anchor="middle" font-family="Impact" font-size="60" fill="#fff" stroke="#000" stroke-width="4">
              YELL
            </text>
            <text x="75%" y="90%" text-anchor="middle" font-family="Impact" font-size="60" fill="#fff" stroke="#000" stroke-width="4">
              CAT
            </text>
          </svg>
        `)
      case 'meme-brain':
        return svgToDataUrl(`
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            ${[0,1,2,3].map(i => `
              <rect width="100%" height="${height/4}" y="${i * (height/4)}" fill="url(#grad${i})"/>`).join('')}
            <defs>
              ${['#0f172a','#1e293b','#4c1d95','#7c3aed'].map((color, index) => `
                <linearGradient id="grad${index}" x1="0" x2="1">
                  <stop offset="0%" stop-color="${color}"/>
                  <stop offset="100%" stop-color="${index === 3 ? '#f472b6' : '#38bdf8'}"/>
                </linearGradient>
              `).join('')}
            </defs>
            ${['Basic','Aware','Scaling','Galaxy'].map((label, index) => `
              <text x="50%" y="${(index * (height/4)) + (height/8)}" text-anchor="middle"
                    font-family="Impact" font-size="56" fill="#fff" stroke="#000" stroke-width="3">
                ${label}
              </text>
            `).join('')}
          </svg>
        `)
      case 'meme-change-mind':
        return svgToDataUrl(`
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#fef3c7"/>
            <rect x="150" y="620" width="780" height="200" rx="20" fill="#fff" stroke="#111" stroke-width="8"/>
            <text x="540" y="740" text-anchor="middle" font-family="Impact" font-size="60" fill="#111">
              CHANGE MY MIND
            </text>
            <circle cx="540" cy="360" r="140" fill="#e0f2fe"/>
            <rect x="480" y="360" width="120" height="220" fill="#cbd5f5" rx="16"/>
          </svg>
        `)
      case 'infographic':
        return svgToDataUrl(`
          <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#FAFBFC" />
            <!-- Header section -->
            <rect x="0" y="0" width="100%" height="120" fill="#6D08BE" />
            <!-- Data visualization placeholders -->
            <circle cx="270" cy="350" r="120" fill="none" stroke="#6D08BE" stroke-width="40" opacity="0.3"/>
            <circle cx="270" cy="350" r="120" fill="none" stroke="#FFB703" stroke-width="40" 
                    stroke-dasharray="188 565" stroke-dashoffset="-188" opacity="0.8"/>
            <!-- Bar chart -->
            <rect x="600" y="250" width="80" height="200" fill="#6D08BE" opacity="0.8"/>
            <rect x="720" y="300" width="80" height="150" fill="#FFB703" opacity="0.8"/>
            <rect x="840" y="350" width="80" height="100" fill="#DD1286" opacity="0.8"/>
            <!-- Bottom section -->
            <rect x="200" y="600" width="680" height="3" fill="#E5E7EB"/>
            <circle cx="300" cy="750" r="60" fill="#6D08BE" opacity="0.2"/>
            <circle cx="540" cy="750" r="60" fill="#FFB703" opacity="0.2"/>
            <circle cx="780" cy="750" r="60" fill="#DD1286" opacity="0.2"/>
            <!-- Icons -->
            <rect x="270" y="720" width="60" height="60" fill="#6D08BE" rx="8"/>
            <rect x="510" y="720" width="60" height="60" fill="#FFB703" rx="8"/>
            <rect x="750" y="720" width="60" height="60" fill="#DD1286" rx="8"/>
            <text x="50%" y="50" font-family="Arial" font-size="36" font-weight="bold" 
                  fill="white" text-anchor="middle">INFOGRAPHIC</text>
          </svg>
        `)
      case 'newyork-cartoon':
      case 'minimalist-linkedin':
      case 'isometric':
      default: {
        let svg: string
        if (style === 'newyork-cartoon') {
          svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="#FFFFFF" />
              <text x="50%" y="45%" font-family="Arial" font-size="48" font-weight="bold" 
                    fill="#000000" text-anchor="middle" dominant-baseline="middle">${prompt}</text>
              <text x="50%" y="55%" font-family="Arial" font-size="24" 
                    fill="#000000" text-anchor="middle" dominant-baseline="middle">Style: ${style}</text>
            </svg>
          `
        } else if (style === 'minimalist-linkedin') {
          svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="#F8F9FA" />
              <text x="50%" y="45%" font-family="Arial" font-size="48" font-weight="bold" 
                    fill="#6D08BE" text-anchor="middle" dominant-baseline="middle">${prompt}</text>
              <text x="50%" y="55%" font-family="Arial" font-size="24" 
                    fill="#6D08BE" text-anchor="middle" dominant-baseline="middle">Style: ${style}</text>
            </svg>
          `
        } else {
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
              <text x="50%" y="45%" font-family="Arial" font-size="48" font-weight="bold" 
                    fill="white" text-anchor="middle" dominant-baseline="middle">${prompt}</text>
              <text x="50%" y="55%" font-family="Arial" font-size="24" 
                    fill="white" text-anchor="middle" dominant-baseline="middle">Style: ${style}</text>
            </svg>
          `
        }
        return svgToDataUrl(svg)
      }
    }
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

