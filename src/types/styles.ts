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
- Natural composition that flows throughout the entire image
- Professional B2B social media quality
- Distribute visual elements naturally across the full image area`,
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
- Natural composition that flows throughout the entire image
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
COLOR PALETTE: LakeB2B brand colors - primary purple (#6D08BE), secondary orange (#FFB703), accent magenta (#DD1286), with neutral grays and white
ELEMENTS: Simple geometric shapes, clean icons, professional symbols, minimal human figures
AESTHETIC: Corporate presentation style, infographic-inspired, highly readable on mobile

CRITICAL REQUIREMENTS:
- Square format (1080x1080)
- Minimalist design principles with lots of white space
- LakeB2B purple (#6D08BE) as primary color with orange and magenta accents
- ABSOLUTELY NO logos, text, labels, or branding anywhere in the image
- Natural composition that flows throughout the entire image
- High contrast for mobile viewing
- Professional business iconography with LakeB2B brand color scheme
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