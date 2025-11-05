# LakeB2B Social Post Generator

A simple frontend application for generating brand-consistent social media images for LakeB2B.

## Features

- Generate social media images with AI-powered prompts
- Three visual styles: Isometric, Cartoon, Dashboard
- Support for multiple social media sizes (LinkedIn, Instagram, Feed)
- Automatic logo overlay and headline text
- Brand-consistent color schemes and typography
- Download generated images

## Getting Started

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. Clone or navigate to this directory:
```bash
cd "Social Post Creator LakeB2B"
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:

**Option A - Simple method:**
```bash
npm run dev
```

**Option B - Recommended (handles port conflicts):**
```bash
./start-dev.sh
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

**⚠️ If you get "connection refused":**
- See `TROUBLESHOOTING.md` for detailed solutions
- Use the startup script: `./start-dev.sh`

## Usage

1. Enter your post message in the text area
2. Optionally add a headline to overlay on the image
3. Select a visual style (Isometric, Cartoon, or Dashboard)
4. Choose the image size for your target platform
5. Click "Generate Post" to create your image
6. Download the generated image using the download button

## Technical Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Chakra UI** - Component library
- **Canvas API** - Image processing and logo overlay
- **Montserrat Font** - Brand typography

## Brand Guidelines

The app follows LakeB2B brand guidelines:
- Primary colors: Yellow (#FFB703), Red (#E8033A), Purple (#6D08BE)
- Typography: Montserrat font family
- Logo placement and gradients as per brand book

## Notes

- Currently uses placeholder images from Unsplash for MVP
- For production, integrate with actual AI image generation APIs (Stable Diffusion, DALL-E, etc.)
- Logo overlay is handled client-side using Canvas API
- All generated images include the LakeB2B watermark

## Development

To build for production:
```bash
npm run build
npm start
```

## License

Internal use only - LakeB2B proprietary