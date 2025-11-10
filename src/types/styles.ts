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
    systemPrompt: `Create a clean LinkedIn-optimized professional illustration:

STYLE: Ultra-minimalist design with strategic visual hierarchy and refined composition
BACKGROUND: Clean solid background - pure white (#FFFFFF) or very subtle single-color gradient only
COLOR PALETTE: Refined LakeB2B brand colors - muted purple (#8B5BB8), soft orange (#F7C566), elegant magenta (#E85BA3), with sophisticated grays (#6B7280, #9CA3AF)
COMPOSITION: Ultra-clean layout with 1-2 focal elements maximum, abundant negative space, NO geometric patterns or lines
ELEMENTS: Simple business iconography, clean shapes, minimal data visualization elements, modern corporate symbols
AESTHETIC: Executive-level presentation quality, refined infographic style, premium mobile-optimized design

CRITICAL REQUIREMENTS:
- Square format (1080x1080)
- Ultra-minimalist design with sophisticated visual hierarchy
- Clean solid background (white or single subtle gradient) - NO geometric patterns, lines, or complex backgrounds
- Refined LakeB2B brand colors (muted, not bright)
- Maximum 1-2 visual elements for true minimalist approach
- ABSOLUTELY NO logos, text, labels, or branding anywhere in the image
- ABSOLUTELY NO geometric background patterns, lines, grids, or decorative elements
- Abundant negative space usage for premium feel
- LinkedIn top-performer quality with executive aesthetic
- Mobile-optimized high contrast and readability
- Clean, uncluttered, and visually refined composition`,
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