export interface StyleOption {
  id: string
  name: string
  description: string
  systemPrompt: string
  category: 'professional' | 'creative' | 'minimalist'
  platform: string[]
  memeFormat?: 'distracted-boyfriend' | 'woman-yelling-cat' | 'expanding-brain' | 'change-my-mind' | 'this-is-fine' | 'surprised-pikachu'
  requiresTextOverlay?: boolean
  visibility?: 'public' | 'internal'
}

export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'isometric',
    name: 'Isometric',
    description: 'Modern 3D isometric illustration style',
    systemPrompt: `Generate a professional isometric 3D business illustration:

VISUAL STYLE: Clean isometric perspective with modern 3D graphics, sharp geometric shapes, and professional polish
COMPOSITION: Dynamic isometric scene with multiple floating elements at different heights

PRIMARY ELEMENTS:
- Business professionals in isometric style working together
- Floating holographic screens displaying abstract data visualizations
- Modern laptops, tablets, and technology devices
- Geometric platforms and walkways connecting scenes
- Abstract data flow lines and connection paths
- Growth charts and success indicators

COLOR SCHEME (LakeB2B Brand):
- Deep purple (#6D08BE) as primary accent
- Vibrant orange (#FFB703) for highlights and energy
- Bold magenta (#DD1286) for secondary elements
- Beautiful gradient background blending purple → orange → magenta
- Soft lighting and shadows for depth

BACKGROUND: Smooth gradient from deep purple through orange to magenta, creating a professional B2B atmosphere

MOOD: Modern, innovative, professional B2B tech aesthetic

IMPORTANT:
- Square format (1:1 aspect ratio)
- NO text, numbers, labels, or written content anywhere
- NO logos or branding elements
- Keep bottom-left corner relatively clear/simple (for logo overlay)
- Clean, polished 3D render quality
- Vibrant colors for social media impact`,
    category: 'professional',
    platform: ['linkedin', 'instagram', 'facebook']
  },
  {
    id: 'infographic',
    name: 'Infographic',
    description: 'Data-driven visual storytelling with charts and statistics',
    systemPrompt: `Generate a professional B2B infographic illustration with data visualization elements:

VISUAL STYLE: Modern, clean infographic design with 3D depth and professional polish
COMPOSITION: Vertical layout with clear visual hierarchy, floating data elements and charts arranged in an engaging pattern

PRIMARY ELEMENTS (choose 3-4):
- Colorful 3D pie charts or donut graphs with segments
- Floating bar charts with gradient fills
- Circular progress indicators or gauge meters
- Rising trend line graphs with glowing paths
- Isometric data cubes or blocks stacked creatively
- Abstract network/connection visualizations
- Stylized icons representing business metrics (growth arrows, targets, analytics)

COLOR SCHEME (LakeB2B Brand):
- Deep purple (#6D08BE) as primary color for main elements
- Vibrant orange (#FFB703) for accent highlights and call-outs
- Bold magenta (#DD1286) for secondary elements
- Smooth gradients blending these colors
- Soft shadows and glows for depth

BACKGROUND: Gradient from deep purple to subtle navy blue, or clean white with colored geometric accents

MOOD: Professional, data-driven, modern B2B aesthetic perfect for LinkedIn and business presentations

IMPORTANT:
- Square format (1:1 aspect ratio)
- NO text, numbers, labels, or written content anywhere
- NO logos or branding elements
- Keep bottom-left corner relatively clear/simple (for logo overlay)
- Rich, vibrant colors with professional finish
- High contrast for social media visibility`,
    category: 'professional',
    platform: ['linkedin', 'twitter', 'instagram']
  },
  {
    id: 'newyork-cartoon',
    name: 'New York Cartoon B&W',
    description: 'Black and white cartoon illustration with urban flair',
    systemPrompt: `Generate a black and white editorial cartoon illustration with New York urban aesthetic:

VISUAL STYLE: Bold line art cartoon style with hand-drawn appearance, reminiscent of New Yorker magazine illustrations
COLOR: STRICTLY black and white only - no color, no gradients, no grayscale tones - pure high-contrast B&W

PRIMARY ELEMENTS:
- Stylized business professionals in dynamic poses
- New York City skyline and urban architecture
- Office buildings with characteristic art deco details
- Briefcases, coffee cups, and business accessories
- Busy street scenes with taxis and pedestrians
- Editorial cartoon expressiveness and wit

LINE WORK:
- Bold, confident pen strokes
- Varied line weights for depth and emphasis
- Cross-hatching for subtle shading
- Clean, professional illustration quality

COMPOSITION:
- Dynamic scene with movement and energy
- Bottom-left corner kept SIMPLE and LIGHT - minimal detail, sparse linework
- Create a natural "white space" area in bottom-left for logo placement
- Dense detail concentrated in upper-right and center areas

MOOD: Sophisticated, witty, editorial-quality business cartoon

IMPORTANT:
- Square format (1:1 aspect ratio)
- PURE BLACK AND WHITE ONLY - absolutely no color
- NO text, numbers, labels, or written content anywhere
- NO logos or branding elements
- Bottom-left corner must be clean/simple (for logo overlay)
- Professional New Yorker magazine quality`,
    category: 'creative',
    platform: ['linkedin', 'twitter', 'instagram']
  },
  {
    id: 'minimalist-linkedin',
    name: 'Minimalist LinkedIn',
    description: 'Clean, professional LinkedIn-optimized style',
    systemPrompt: `Generate an ultra-minimalist professional illustration optimized for LinkedIn:

VISUAL STYLE: Premium minimalist design with sophisticated visual hierarchy and zen-like simplicity
COMPOSITION: Maximum 1-2 focal elements with abundant negative space, perfect balance

PRIMARY ELEMENTS (choose 1-2 only):
- Single elegant 3D geometric shape (sphere, cube, or abstract form)
- Minimalist business icon in soft gradient
- Abstract flowing ribbon or path
- Single floating element with subtle shadow
- Clean, simple growth or success symbol

COLOR SCHEME (LakeB2B Brand - Muted):
- Soft, muted purple (#6D08BE at 60% saturation)
- Gentle orange accents (#FFB703 as subtle highlights)
- Elegant magenta touches (#DD1286 for depth)
- Beautiful smooth gradient background flowing purple → orange → magenta
- Sophisticated shadows and ambient lighting

BACKGROUND: Seamless gradient from deep purple through warm orange to soft magenta - professional, premium feel

AESTHETIC: Executive boardroom quality, Apple-style minimalism, premium mobile-optimized

IMPORTANT:
- Square format (1:1 aspect ratio)
- MAXIMUM 1-2 visual elements only - true minimalism
- 70% of image should be gradient background (negative space)
- NO text, numbers, labels, or written content anywhere
- NO logos or branding elements
- NO geometric patterns, grids, or decorative lines
- Bottom-left corner kept clear (for logo overlay)
- Premium, refined, executive-level quality`,
    category: 'minimalist',
    platform: ['linkedin']
  },
  {
    id: 'meme',
    name: 'Meme',
    description: 'Internet meme templates with smart AI text suggestions',
    systemPrompt: `Use real meme template images. This will be replaced with specific meme template based on user selection.`,
    category: 'creative',
    platform: ['linkedin', 'twitter', 'instagram', 'facebook'],
    requiresTextOverlay: true
  }
]

export type StyleId =
  | 'isometric'
  | 'infographic'
  | 'newyork-cartoon'
  | 'minimalist-linkedin'
  | 'meme'

// Meme format types for submenu
export type MemeFormatId = 'auto' | 'drake' | 'distracted' | 'woman-cat' | 'change-mind'

export interface MemeFormat {
  id: MemeFormatId
  name: string
  description: string
  templateFile: string
  textPositions: {
    areas: Array<{
      id: string
      x: number
      y: number
      width: number
      height: number
      fontSize: number
      textAlign: 'left' | 'center' | 'right'
    }>
  }
}

export const MEME_FORMATS: MemeFormat[] = [
  {
    id: 'auto',
    name: 'Auto-Select Best Format',
    description: 'AI chooses the most relevant meme template for your content',
    templateFile: '',
    textPositions: { areas: [] }
  },
  {
    id: 'drake',
    name: 'Drake Pointing',
    description: 'Two-panel format perfect for before/after comparisons',
    templateFile: 'drake-template.png',
    textPositions: {
      areas: [
        { id: 'top', x: 10, y: 10, width: 80, height: 40, fontSize: 36, textAlign: 'center' },
        { id: 'bottom', x: 10, y: 60, width: 80, height: 40, fontSize: 36, textAlign: 'center' }
      ]
    }
  },
  {
    id: 'distracted',
    name: 'Distracted Boyfriend',
    description: 'Great for showing tempting new solutions vs current state',
    templateFile: 'distracted-boyfriend-template.png',
    textPositions: {
      areas: [
        { id: 'boyfriend', x: 35, y: 85, width: 30, height: 10, fontSize: 24, textAlign: 'center' },
        { id: 'girlfriend', x: 5, y: 85, width: 25, height: 10, fontSize: 24, textAlign: 'center' },
        { id: 'other-woman', x: 70, y: 85, width: 25, height: 10, fontSize: 24, textAlign: 'center' }
      ]
    }
  },
  {
    id: 'woman-cat',
    name: 'Woman Yelling at Cat',
    description: 'Perfect for showing frustrated vs unbothered perspectives',
    templateFile: 'woman-cat-template.png',
    textPositions: {
      areas: [
        { id: 'woman', x: 5, y: 85, width: 40, height: 10, fontSize: 24, textAlign: 'center' },
        { id: 'cat', x: 55, y: 85, width: 40, height: 10, fontSize: 24, textAlign: 'center' }
      ]
    }
  },
  {
    id: 'change-mind',
    name: 'Change My Mind',
    description: 'Challenge conventional wisdom with debate-worthy statements',
    templateFile: 'change-my-mind-template.png',
    textPositions: {
      areas: [
        { id: 'sign', x: 25, y: 65, width: 50, height: 15, fontSize: 28, textAlign: 'center' }
      ]
    }
  }
]

export function getStyleById(id: StyleId): StyleOption | undefined {
  return STYLE_OPTIONS.find(style => style.id === id)
}

export function getStylePrompt(id: StyleId): string {
  const style = getStyleById(id)
  return style?.systemPrompt || STYLE_OPTIONS[0].systemPrompt // Default to isometric
}