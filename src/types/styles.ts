export interface StyleOption {
  id: string
  name: string
  description: string
  systemPrompt: string
  category: 'professional' | 'creative' | 'minimalist'
  platform: string[]
}

export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'isometric',
    name: 'Isometric',
    description: 'Modern 3D isometric illustration style',
    systemPrompt: `Create a professional isometric 3D business illustration:

STYLE: Clean isometric perspective, modern 3D graphics with sharp geometric shapes
BACKGROUND: Vibrant gradient from deep purple to orange to magenta (LakeB2B brand colors)
ELEMENTS: Business professionals, floating screens with data visualizations, laptops, modern technology
AESTHETIC: Professional B2B social media quality with clean lines and minimal shadows

CRITICAL REQUIREMENTS: 
- Square format (1080x1080)
- ABSOLUTELY NO logos, text, labels, or branding anywhere in the image
- Keep the bottom-left corner (200x150px area) completely clear and unoccupied by any elements
- Do not place any visual elements, characters, or objects in the bottom-left corner area
- Professional B2B social media quality
- Focus all visual elements in the center and right portions of the image`,
    category: 'professional',
    platform: ['linkedin', 'instagram', 'facebook']
  },
  {
    id: 'newyork-cartoon',
    name: 'New York Cartoon B&W',
    description: 'Black and white cartoon illustration with urban flair',
    systemPrompt: `Create a black and white cartoon illustration with New York urban aesthetic:

STYLE: Bold line art cartoon style, hand-drawn appearance, urban New York vibes
COLOR PALETTE: Strictly black and white only - no color, no gradients, only pure B&W
ELEMENTS: Business professionals in cartoon style, urban cityscape elements, office buildings, briefcases
AESTHETIC: Editorial cartoon style reminiscent of New York newspapers and magazines

CRITICAL REQUIREMENTS:
- Square format (1080x1080)
- STRICTLY BLACK AND WHITE ONLY - no color whatsoever
- Bold, clean line art with strong contrast
- ABSOLUTELY NO logos, text, labels, or branding anywhere in the image
- Keep the bottom-left corner (200x150px area) completely clear and unoccupied
- Cartoon/illustration style, not photorealistic
- Urban business theme with New York character`,
    category: 'creative',
    platform: ['linkedin', 'twitter', 'instagram']
  },
  {
    id: 'minimalist-linkedin',
    name: 'Minimalist LinkedIn',
    description: 'Clean, professional LinkedIn-optimized style',
    systemPrompt: `Create a minimalist professional illustration optimized for LinkedIn:

STYLE: Clean, modern minimalist design with plenty of white space
COLOR PALETTE: LinkedIn blue (#0077B5) as accent color, neutral grays, and white
ELEMENTS: Simple geometric shapes, clean icons, professional symbols, minimal human figures
AESTHETIC: Corporate presentation style, infographic-inspired, highly readable on mobile

CRITICAL REQUIREMENTS:
- Square format (1080x1080)
- Minimalist design principles with lots of white space
- LinkedIn blue (#0077B5) as primary accent color
- ABSOLUTELY NO logos, text, labels, or branding anywhere in the image
- Keep the bottom-left corner (200x150px area) completely clear and unoccupied
- High contrast for mobile viewing
- Professional business iconography
- Clean, readable design suitable for LinkedIn feed`,
    category: 'minimalist',
    platform: ['linkedin']
  }
]

export type StyleId = 'isometric' | 'newyork-cartoon' | 'minimalist-linkedin'

export function getStyleById(id: StyleId): StyleOption | undefined {
  return STYLE_OPTIONS.find(style => style.id === id)
}

export function getStylePrompt(id: StyleId): string {
  const style = getStyleById(id)
  return style?.systemPrompt || STYLE_OPTIONS[0].systemPrompt // Default to isometric
}