# LakeB2B Social Post Generator

A simple frontend application for generating brand-consistent social media images for LakeB2B.

## Features

- Generate social media images with AI-powered prompts
- Five visual styles: Isometric, Infographic, Cartoon, Minimalist LinkedIn, and Meme
- Support for multiple social media sizes (LinkedIn, Instagram, Feed)
- Automatic logo overlay and headline text
- Brand-consistent color schemes and typography
- Download generated images
- Smart Meme mode with real meme templates (Drake, Distracted Boyfriend, Woman Yelling at Cat, Change My Mind)
- Infographic style for data-driven visual storytelling

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

## Deployment Guide

### Pre-Deployment Checklist

1. **Environment Variables Setup**
   - Copy `.env.local.template` to `.env.local`
   - Update `GEMINI_API_KEY` with your actual API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Set a secure `JWT_SECRET` for production

2. **Meme Templates**
   - Replace placeholder PNG files in `/public/meme-templates/` with actual meme images:
     - `drake-template.png` - Drake pointing meme
     - `distracted-boyfriend-template.png` - Distracted boyfriend stock photo
     - `woman-cat-template.png` - Woman yelling at cat meme
     - `change-my-mind-template.png` - Steven Crowder "Change My Mind" meme

3. **Build Test**
   ```bash
   npm run build
   npm start
   ```

### Deployment Options

#### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure Environment Variables**
   
   **Via Dashboard:**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Select your project
   - Navigate to **Settings → Environment Variables**
   - Add the following for Production, Preview, and Development:
     - `GEMINI_API_KEY` - Your Gemini API key
     - `JWT_SECRET` - A secure random string
     - `NODE_ENV` - Set to `production`

   **Via CLI:**
   ```bash
   vercel env add GEMINI_API_KEY production
   vercel env add JWT_SECRET production
   vercel env add NODE_ENV production
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

#### Option 2: Docker Deployment

1. **Create Dockerfile** (create this file in project root)
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   ENV NODE_ENV=production
   CMD ["npm", "start"]
   ```

2. **Build and Run**
   ```bash
   docker build -t lakeb2b-social-generator .
   docker run -p 3000:3000 \
     -e GEMINI_API_KEY=your_key \
     -e JWT_SECRET=your_secret \
     lakeb2b-social-generator
   ```

#### Option 3: Traditional VPS/Cloud

1. **Server Requirements**
   - Node.js 18+
   - npm or yarn
   - PM2 (for process management)

2. **Setup Steps**
   ```bash
   # Clone repository
   git clone [your-repo-url]
   cd "Social Post Creator LakeB2B"
   
   # Install dependencies
   npm install
   
   # Build application
   npm run build
   
   # Install PM2
   npm install -g pm2
   
   # Start with PM2
   pm2 start npm --name "lakeb2b-social" -- start
   
   # Save PM2 config
   pm2 save
   pm2 startup
   ```

3. **Nginx Configuration** (optional)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Post-Deployment

1. **Verify Deployment**
   - Test image generation with all styles
   - Verify authentication is working
   - Check logo overlay functionality
   - Test meme generation

2. **Monitor Performance**
   - Set up error tracking (e.g., Sentry)
   - Monitor API usage and costs
   - Set up uptime monitoring

3. **Security Considerations**
   - Enable CORS only for your domains
   - Set up rate limiting for API endpoints
   - Regularly rotate JWT_SECRET
   - Monitor Gemini API usage

### Troubleshooting

- **Images not generating**: Check GEMINI_API_KEY is set correctly
- **Authentication errors**: Verify JWT_SECRET is consistent across deployments
- **Meme templates not showing**: Ensure PNG files exist in `/public/meme-templates/`
- **Performance issues**: Consider implementing caching for generated images

## Smart Meme Mode

- Pick `Smart Meme (Auto)` from the style selector and the app will analyse your message/headline to pick the right meme format (frustration → Woman Yelling at Cat, comparisons → Distracted Boyfriend, progressive frameworks → Expanding Brain, hot takes → Change My Mind).
- You’ll see which format is predicted before you click **Generate**, and the backend uses the same selector so deployments stay in sync.
- If Gemini can’t return an image, the fallback placeholders now mimic the exact meme layouts instead of generic gradients, so you can still preview copy placement.

## License

Internal use only - LakeB2B proprietary