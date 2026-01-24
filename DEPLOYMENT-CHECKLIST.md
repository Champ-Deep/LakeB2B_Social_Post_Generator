# LakeB2B Social Post Creator - Deployment Guide

> **Last Updated**: January 2026
> **Version**: 1.0.0
> **Deployment Options**: Vercel (Recommended) | Docker Self-Hosted

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
3. [Docker Self-Hosted Deployment](#docker-self-hosted-deployment)
4. [Environment Variables Reference](#environment-variables-reference)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance and Updates](#maintenance-and-updates)

---

## Prerequisites

Before deploying, ensure you have:

### Required Accounts
- [x] **Supabase Account** - Free tier available at [supabase.com](https://supabase.com)
- [x] **Google AI Studio Account** - For Gemini API at [aistudio.google.com](https://aistudio.google.com)
- [x] **LinkedIn Developer Account** - For OAuth integration at [developer.linkedin.com](https://developer.linkedin.com)

### Optional Accounts (Recommended for Production)
- [ ] **Sentry Account** - Error monitoring at [sentry.io](https://sentry.io)
- [ ] **PostHog Account** - Product analytics at [posthog.com](https://posthog.com)
- [ ] **Cloudinary Account** - Image hosting/CDN at [cloudinary.com](https://cloudinary.com)
- [ ] **Upstash Account** - Redis for rate limiting at [upstash.com](https://upstash.com)

### Local Tools (for Docker deployment)
- [x] Docker Desktop 20.10+ or Docker Engine with Docker Compose
- [x] Node.js 18+ (for local testing before deployment)
- [x] Git (for version control)

---

## Vercel Deployment (Recommended)

Vercel provides the fastest and most reliable deployment with automatic HTTPS, CDN, and scaling.

### Step 1: Initial Setup

1. **Install Vercel CLI** (optional, but recommended)
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Prepare Your Repository**
   ```bash
   # Ensure you're on the correct branch
   git checkout main

   # Pull latest changes
   git pull origin main

   # Verify build works locally
   npm install
   npm run build
   ```

### Step 2: Create Supabase Project

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**

2. **Create New Project**
   - Click "New Project"
   - Organization: Select or create one
   - Name: `lakeb2b-social-post-creator`
   - Database Password: Generate a strong password (save this!)
   - Region: Choose closest to your users (e.g., `us-east-1`)
   - Pricing Plan: Free (or Pro for production)
   - Click "Create new project" (takes ~2 minutes)

3. **Get Database Connection Strings**
   - Navigate to **Settings** → **Database**
   - Copy **Connection String** → **URI** (for `DATABASE_URL`)
     - Select "Transaction" mode
     - Replace `[YOUR-PASSWORD]` with your database password
     - Example: `postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

   - Copy **Connection String** → **Direct Connection** (for `DIRECT_URL`)
     - Select "Session" mode
     - Replace `[YOUR-PASSWORD]` with your database password
     - Example: `postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres`

4. **Save Supabase API Keys** (optional, for Supabase Auth if used)
   - Navigate to **Settings** → **API**
   - Copy **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **Project API Keys** → **anon public** → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **Project API Keys** → **service_role** → Use for `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Get Gemini API Key

1. **Go to [Google AI Studio](https://aistudio.google.com/app/apikey)**

2. **Create API Key**
   - Click "Create API Key"
   - Select or create a Google Cloud project
   - Copy the generated API key (starts with `AIza...`)
   - Save securely (you won't see it again)

3. **Enable Required APIs** (if prompted)
   - Gemini API
   - Cloud Vision API (optional, for image analysis)

### Step 4: Setup LinkedIn OAuth

1. **Go to [LinkedIn Developer Portal](https://developer.linkedin.com)**

2. **Create an App**
   - Click "Create app"
   - App name: `LakeB2B Social Post Creator`
   - LinkedIn Page: Select your company page
   - App logo: Upload LakeB2B logo
   - Click "Create app"

3. **Configure OAuth Settings**
   - Navigate to **Auth** tab
   - Under **OAuth 2.0 settings**:
     - Redirect URLs: Add production URL(s):
       - `https://your-domain.vercel.app/api/auth/linkedin/callback`
       - `https://your-custom-domain.com/api/auth/linkedin/callback` (if applicable)
   - Click "Update"

4. **Request Product Access**
   - Navigate to **Products** tab
   - Request access to:
     - "Sign In with LinkedIn using OpenID Connect" (REQUIRED)
     - "Share on LinkedIn" (REQUIRED)
   - Wait for approval (usually instant for OpenID Connect)

5. **Get Credentials**
   - Navigate to **Auth** tab
   - Copy **Client ID** → Use for `LINKEDIN_CLIENT_ID`
   - Copy **Client Secret** → Use for `LINKEDIN_CLIENT_SECRET`

### Step 5: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Easiest)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Import Repository**
   - Click "Add New..." → "Project"
   - Select your Git provider (GitHub, GitLab, Bitbucket)
   - Authorize Vercel to access your repository
   - Select the `Social Post Creator LakeB2B` repository

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

4. **Add Environment Variables** (see [Environment Variables Reference](#environment-variables-reference))

   Click "Environment Variables" and add all REQUIRED variables:

   **Core Configuration**
   ```
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
   NEXT_PUBLIC_APP_VERSION=1.0.0
   ```

   **Database (Supabase)**
   ```
   DATABASE_URL=postgresql://postgres.xxxxx:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres.xxxxx:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   DATABASE_PROVIDER=postgresql
   ```

   **Authentication**
   ```
   BETTER_AUTH_SECRET=[generate-with-crypto]
   BETTER_AUTH_URL=https://your-project.vercel.app
   JWT_SECRET=[generate-secure-string]
   ```

   **Gemini API**
   ```
   GEMINI_API_KEY=AIza...
   ```

   **LinkedIn OAuth**
   ```
   LINKEDIN_CLIENT_ID=your_client_id
   LINKEDIN_CLIENT_SECRET=your_client_secret
   LINKEDIN_REDIRECT_URI=https://your-project.vercel.app/api/auth/linkedin/callback
   LINKEDIN_TOKEN_ENCRYPTION_KEY=[generate-64-char-hex]
   ```

   **Cron Jobs**
   ```
   CRON_SECRET=[generate-secure-string]
   ```

   **Generate Secrets with Node.js:**
   ```bash
   # BETTER_AUTH_SECRET (32 bytes hex)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # LINKEDIN_TOKEN_ENCRYPTION_KEY (32 bytes hex = 64 hex chars)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # JWT_SECRET (any secure random string)
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

   # CRON_SECRET (any secure random string)
   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (~3-5 minutes)
   - Note the deployment URL (e.g., `https://lakeb2b-social-xxxxx.vercel.app`)

#### Option B: Via Vercel CLI

1. **Deploy to Preview**
   ```bash
   vercel
   ```

2. **Add Environment Variables**
   ```bash
   # Core configuration
   vercel env add NODE_ENV production
   vercel env add NEXT_PUBLIC_APP_URL production
   vercel env add NEXT_PUBLIC_APP_VERSION production

   # Database
   vercel env add DATABASE_URL production
   vercel env add DIRECT_URL production
   vercel env add DATABASE_PROVIDER production

   # Authentication
   vercel env add BETTER_AUTH_SECRET production
   vercel env add BETTER_AUTH_URL production
   vercel env add JWT_SECRET production

   # Gemini API
   vercel env add GEMINI_API_KEY production

   # LinkedIn OAuth
   vercel env add LINKEDIN_CLIENT_ID production
   vercel env add LINKEDIN_CLIENT_SECRET production
   vercel env add LINKEDIN_REDIRECT_URI production
   vercel env add LINKEDIN_TOKEN_ENCRYPTION_KEY production

   # Cron
   vercel env add CRON_SECRET production
   ```

3. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Step 6: Run Database Migrations

After first deployment, you need to set up the database schema:

1. **Install Prisma CLI locally** (if not already installed)
   ```bash
   npm install -g prisma
   ```

2. **Set Database URL temporarily**
   ```bash
   export DATABASE_URL="your-supabase-direct-url-here"
   ```

3. **Push Database Schema**
   ```bash
   npx prisma db push
   ```

   You should see:
   ```
   ✓ Generated Prisma Client
   ✓ Database schema applied successfully
   ```

4. **Verify Schema** (optional)
   ```bash
   npx prisma studio
   ```
   This opens a web UI at `http://localhost:5555` to browse your database.

### Step 7: Configure Vercel Cron Jobs

Vercel natively supports cron jobs via `vercel.json`.

1. **Verify `vercel.json` exists** in project root:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/process-scheduled",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```

2. **Cron job automatically configured** during deployment
   - No additional setup needed
   - Runs every 5 minutes to process scheduled LinkedIn posts

### Step 8: Custom Domain (Optional)

1. **Add Domain in Vercel Dashboard**
   - Go to Project → Settings → Domains
   - Add your custom domain (e.g., `social.lakeb2b.com`)

2. **Update DNS Records**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or follow Vercel's specific instructions for your domain

3. **Update Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_APP_URL production
   # Enter: https://social.lakeb2b.com

   vercel env add BETTER_AUTH_URL production
   # Enter: https://social.lakeb2b.com

   vercel env add LINKEDIN_REDIRECT_URI production
   # Enter: https://social.lakeb2b.com/api/auth/linkedin/callback
   ```

4. **Update LinkedIn OAuth Redirect URI**
   - Go to [LinkedIn Developer Portal](https://developer.linkedin.com)
   - Navigate to your app → Auth tab
   - Add new redirect URI: `https://social.lakeb2b.com/api/auth/linkedin/callback`

5. **Redeploy**
   ```bash
   vercel --prod
   ```

---

## Docker Self-Hosted Deployment

For organizations requiring full control, use Docker Compose for self-hosted deployment.

### Architecture Overview

The Docker deployment includes:
- **App Container**: Next.js application (port 3000)
- **Worker Container**: Background job processor (BullMQ)
- **PostgreSQL**: Database (port 5432)
- **Redis**: Job queue backend (port 6379)
- **Cron Container**: Scheduled task runner (every 5 minutes)

### Step 1: Prerequisites

1. **Install Docker**
   - **macOS/Windows**: [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - **Linux**: Docker Engine + Docker Compose
     ```bash
     curl -fsSL https://get.docker.com -o get-docker.sh
     sudo sh get-docker.sh
     sudo apt-get install docker-compose-plugin
     ```

2. **Verify Installation**
   ```bash
   docker --version
   docker compose version
   ```

### Step 2: Configure Environment Variables

1. **Copy Environment Template**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` File**
   ```bash
   nano .env
   # Or use your preferred editor
   ```

3. **Set Required Variables** (see [Environment Variables Reference](#environment-variables-reference))

   **Minimal Configuration:**
   ```env
   # Database
   POSTGRES_PASSWORD=generate-secure-password
   DATABASE_URL=postgresql://lakeb2b:generate-secure-password@postgres:5432/lakeb2b
   DATABASE_PROVIDER=postgresql

   # Gemini API
   GEMINI_API_KEY=your-gemini-api-key

   # Authentication
   BETTER_AUTH_SECRET=generate-32-byte-hex
   BETTER_AUTH_URL=http://localhost:3000
   JWT_SECRET=generate-secure-string

   # LinkedIn OAuth
   LINKEDIN_CLIENT_ID=your-linkedin-client-id
   LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
   LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback
   LINKEDIN_TOKEN_ENCRYPTION_KEY=generate-64-char-hex

   # Cron
   CRON_SECRET=generate-secure-string

   # Redis (auto-configured by docker-compose)
   REDIS_URL=redis://redis:6379
   ```

   **Generate Secrets:**
   ```bash
   # POSTGRES_PASSWORD
   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

   # BETTER_AUTH_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # LINKEDIN_TOKEN_ENCRYPTION_KEY
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

   # CRON_SECRET
   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
   ```

### Step 3: First-Time Database Migration

Before starting all services, run the database migration:

1. **Start PostgreSQL Only**
   ```bash
   docker compose up postgres -d
   ```

2. **Wait for PostgreSQL to be Ready**
   ```bash
   docker compose exec postgres pg_isready -U lakeb2b
   ```

3. **Run Database Migration**
   ```bash
   docker compose --profile migrate run --rm migrate
   ```

   You should see:
   ```
   ✓ Database schema applied successfully
   ```

4. **Stop PostgreSQL** (we'll restart all services together)
   ```bash
   docker compose down
   ```

### Step 4: Start All Services

1. **Build and Start**
   ```bash
   docker compose up -d --build
   ```

   This starts:
   - `lakeb2b-app` - Main application (http://localhost:3000)
   - `lakeb2b-worker` - Background job processor
   - `lakeb2b-postgres` - PostgreSQL database
   - `lakeb2b-redis` - Redis cache/queue
   - `lakeb2b-cron` - Scheduled task runner

2. **Check Service Status**
   ```bash
   docker compose ps
   ```

   All services should show `Up` status:
   ```
   NAME                 STATUS   PORTS
   lakeb2b-app          Up       0.0.0.0:3000->3000/tcp
   lakeb2b-worker       Up
   lakeb2b-postgres     Up       0.0.0.0:5432->5432/tcp
   lakeb2b-redis        Up       0.0.0.0:6379->6379/tcp
   lakeb2b-cron         Up
   ```

3. **View Logs**
   ```bash
   # All services
   docker compose logs -f

   # Specific service
   docker compose logs -f app
   docker compose logs -f worker
   ```

4. **Access Application**
   - Open browser: http://localhost:3000
   - Health check: http://localhost:3000/api/health

### Step 5: Production Configuration

For production deployment, additional steps are recommended:

1. **Use Reverse Proxy (Nginx/Traefik)**

   Example Nginx configuration:
   ```nginx
   server {
       listen 80;
       server_name social.lakeb2b.com;

       # Redirect to HTTPS
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name social.lakeb2b.com;

       ssl_certificate /etc/ssl/certs/lakeb2b.crt;
       ssl_certificate_key /etc/ssl/private/lakeb2b.key;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

2. **Update Environment Variables for Production**
   ```env
   BETTER_AUTH_URL=https://social.lakeb2b.com
   NEXT_PUBLIC_APP_URL=https://social.lakeb2b.com
   LINKEDIN_REDIRECT_URI=https://social.lakeb2b.com/api/auth/linkedin/callback
   ```

3. **Restart Services**
   ```bash
   docker compose down
   docker compose up -d --build
   ```

### Step 6: Docker Commands Reference

**Starting Services**
```bash
# Start all services
docker compose up -d

# Start with rebuild
docker compose up -d --build

# Start specific service
docker compose up -d app
```

**Stopping Services**
```bash
# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes database)
docker compose down -v
```

**Restarting Services**
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart app
```

**Viewing Logs**
```bash
# All services, live tail
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f worker
docker compose logs -f postgres

# Last 100 lines
docker compose logs --tail=100 app
```

**Accessing Containers**
```bash
# Shell access to app container
docker compose exec app sh

# Shell access to PostgreSQL
docker compose exec postgres psql -U lakeb2b -d lakeb2b
```

**Database Operations**
```bash
# Run database migration
docker compose --profile migrate run --rm migrate

# Backup database
docker compose exec postgres pg_dump -U lakeb2b lakeb2b > backup.sql

# Restore database
docker compose exec -T postgres psql -U lakeb2b lakeb2b < backup.sql
```

### Step 7: Backup and Restore Procedures

**Automated Backup Script** (`scripts/backup-docker.sh`)
```bash
#!/bin/bash
BACKUP_DIR="/backups/lakeb2b"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
docker compose exec -T postgres pg_dump -U lakeb2b lakeb2b | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Backup uploads volume
docker run --rm -v lakeb2b-uploads:/data -v "$BACKUP_DIR":/backup alpine tar czf /backup/uploads_$TIMESTAMP.tar.gz -C /data .

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

echo "Backup completed: $TIMESTAMP"
```

**Restore from Backup**
```bash
# Stop application
docker compose down

# Restore database
gunzip -c /backups/lakeb2b/db_20260124_120000.sql.gz | docker compose exec -T postgres psql -U lakeb2b lakeb2b

# Restore uploads
docker run --rm -v lakeb2b-uploads:/data -v /backups/lakeb2b:/backup alpine tar xzf /backup/uploads_20260124_120000.tar.gz -C /data

# Restart application
docker compose up -d
```

**Setup Cron for Automated Backups**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/scripts/backup-docker.sh >> /var/log/lakeb2b-backup.log 2>&1
```

---

## Environment Variables Reference

Complete reference for all environment variables used in the application.

### Required Variables

| Variable | Purpose | How to Obtain | Example |
|----------|---------|---------------|---------|
| `GEMINI_API_KEY` | Gemini API for image generation | [Google AI Studio](https://aistudio.google.com/app/apikey) | `AIzaSyD...` |
| `DATABASE_URL` | PostgreSQL connection (pooled) | Supabase Dashboard → Database → Connection String (Transaction mode) | `postgresql://postgres...@pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | PostgreSQL direct connection | Supabase Dashboard → Database → Connection String (Session mode) | `postgresql://postgres...@pooler.supabase.com:5432/postgres` |
| `DATABASE_PROVIDER` | Database type | Set manually | `postgresql` |
| `BETTER_AUTH_SECRET` | Authentication secret | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | `a1b2c3d4...` (64 hex chars) |
| `BETTER_AUTH_URL` | Application base URL | Your deployment URL | `https://your-app.vercel.app` |
| `JWT_SECRET` | Legacy JWT secret | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` | `abc123...` |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth client ID | [LinkedIn Developer Portal](https://developer.linkedin.com) → Your App → Auth | `78xyz...` |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth secret | LinkedIn Developer Portal → Your App → Auth | `abc123...` |
| `LINKEDIN_REDIRECT_URI` | OAuth callback URL | Set manually (must match LinkedIn app config) | `https://your-app.vercel.app/api/auth/linkedin/callback` |
| `LINKEDIN_TOKEN_ENCRYPTION_KEY` | Encrypts stored OAuth tokens | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | `a1b2c3d4...` (64 hex chars) |
| `CRON_SECRET` | Authenticates cron requests | Generate: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"` | `abc123...` |

### Optional Variables

| Variable | Purpose | Default/Fallback | How to Obtain |
|----------|---------|------------------|---------------|
| `REDIS_URL` | Redis connection for job queue | In-memory fallback | Docker: `redis://redis:6379`<br>Upstash: From dashboard |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint | In-memory rate limiting | [Upstash Console](https://upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash auth token | In-memory rate limiting | Upstash Console |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Not required (using Prisma) | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key | Not required (using Better-Auth) | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key | Not required | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics key | No analytics | [PostHog Settings](https://posthog.com/settings) |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog instance URL | No analytics | `https://us.i.posthog.com` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking | No error tracking | [Sentry Project Settings](https://sentry.io/settings) |
| `SENTRY_ORG` | Sentry organization | No error tracking | Sentry Settings |
| `SENTRY_PROJECT` | Sentry project name | No error tracking | Sentry Settings |
| `SENTRY_AUTH_TOKEN` | Sentry auth token | No source maps | Sentry Settings |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Local storage | [Cloudinary Console](https://cloudinary.com/console) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Local storage | Cloudinary Console |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | Local storage | Cloudinary Console |
| `TWITTER_CLIENT_ID` | Twitter OAuth client ID | Twitter disabled | [Twitter Developer Portal](https://developer.twitter.com) |
| `TWITTER_CLIENT_SECRET` | Twitter OAuth secret | Twitter disabled | Twitter Developer Portal |
| `TWITTER_CALLBACK_URL` | Twitter OAuth callback | Twitter disabled | `https://your-app/api/twitter/callback` |
| `NODE_ENV` | Environment mode | `development` | `production` for prod |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` | Your deployment URL |
| `NEXT_PUBLIC_APP_VERSION` | App version number | `1.0.0` | From package.json |

### Docker-Only Variables

| Variable | Purpose | Default | Notes |
|----------|---------|---------|-------|
| `POSTGRES_PASSWORD` | PostgreSQL password | `lakeb2b_secure_password` | Generate secure password |

---

## Post-Deployment Verification

Complete this checklist after deployment to ensure everything works correctly.

### 1. Health Endpoint Check

**Verify application is running:**
```bash
# Replace with your deployment URL
curl https://your-app.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-24T12:00:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

**If health check fails:**
- [ ] Check environment variables are set correctly
- [ ] Verify database connection string is correct
- [ ] Check deployment logs for errors
- [ ] Ensure database schema is deployed (run `npx prisma db push`)

### 2. Image Generation Test

**Manual Test:**
1. [ ] Open application in browser
2. [ ] Fill in post message: `Test post for LakeB2B social media`
3. [ ] Add headline: `Testing Image Generation`
4. [ ] Select style: **Isometric**
5. [ ] Select size: **LinkedIn Post (1200x1200)**
6. [ ] Click **Generate Post**
7. [ ] Wait 5-10 seconds
8. [ ] Verify image appears with:
   - [ ] LakeB2B logo in bottom-left corner
   - [ ] Headline text overlaid
   - [ ] Correct dimensions and style
9. [ ] Click **Download** button
10. [ ] Verify image downloads correctly

**Test All Styles:**
- [ ] Isometric
- [ ] Infographic
- [ ] New York Cartoon B&W
- [ ] Minimalist LinkedIn
- [ ] Smart Meme (Auto)
- [ ] Meme - Drake Pointing
- [ ] Meme - Distracted Boyfriend
- [ ] Meme - Woman Yelling at Cat
- [ ] Meme - Change My Mind

**API Test (via curl):**
```bash
curl -X POST https://your-app.vercel.app/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message",
    "headline": "Test Headline",
    "style": "isometric",
    "size": "linkedin"
  }'
```

**Expected Response:**
```json
{
  "imageUrl": "data:image/png;base64,iVBORw0KG...",
  "success": true
}
```

### 3. Authentication Test

**Register/Login Flow:**
1. [ ] Click **Sign Up** or **Login** button
2. [ ] Enter email: `test@lakeb2b.com`
3. [ ] Enter password: `TestPassword123!`
4. [ ] Click **Register** or **Login**
5. [ ] Verify successful authentication
6. [ ] Check user dashboard loads
7. [ ] Verify points/streak display
8. [ ] Test logout functionality

**LinkedIn OAuth Flow:**
1. [ ] Click **Connect LinkedIn** button
2. [ ] Redirected to LinkedIn authorization page
3. [ ] Authorize the application
4. [ ] Redirected back to application
5. [ ] Verify LinkedIn account connected
6. [ ] Check success message appears

**Verify in Database:**
```bash
# For Vercel (via Prisma Studio locally)
npx prisma studio

# For Docker
docker compose exec postgres psql -U lakeb2b lakeb2b -c "SELECT * FROM \"User\";"
```

### 4. Scheduled Posts Test

**Create Scheduled Post:**
1. [ ] Login to application
2. [ ] Connect LinkedIn account (if not already)
3. [ ] Generate a post image
4. [ ] Click **Schedule Post**
5. [ ] Select date/time (at least 10 minutes in future)
6. [ ] Add caption: `This is a scheduled test post`
7. [ ] Click **Schedule**
8. [ ] Verify confirmation message

**Check Database:**
```bash
# View scheduled posts
npx prisma studio
# Navigate to ScheduledPost table
```

**Verify Cron Processing:**
```bash
# For Vercel: Check logs in dashboard
vercel logs

# For Docker: Check cron container logs
docker compose logs -f cron
```

**Expected Log Output (every 5 minutes):**
```
Running scheduled post processor at Fri Jan 24 12:00:00 UTC 2026
Processing X scheduled posts...
```

**Manual Cron Trigger Test:**
```bash
# Get CRON_SECRET from .env
CRON_SECRET="your-cron-secret"

curl -X GET https://your-app.vercel.app/api/cron/process-scheduled \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Expected Response:**
```json
{
  "success": true,
  "processed": 0,
  "errors": []
}
```

### 5. Performance Verification

**Page Load Time:**
```bash
# Use curl to measure response time
time curl -o /dev/null -s -w "%{time_total}\n" https://your-app.vercel.app
```

**Expected:** < 2 seconds

**Image Generation Time:**
- [ ] Measure time from clicking "Generate Post" to image display
- **Expected:** 5-15 seconds (depends on Gemini API)

**Core Web Vitals** (via browser DevTools or [PageSpeed Insights](https://pagespeed.web.dev/)):
- [ ] **LCP (Largest Contentful Paint)**: < 2.5s
- [ ] **FID (First Input Delay)**: < 100ms
- [ ] **CLS (Cumulative Layout Shift)**: < 0.1

### 6. Security Verification

**Environment Variables:**
- [ ] No API keys visible in client-side code
- [ ] Check browser console (no secrets logged)
- [ ] Inspect Network tab (no secrets in responses)

**API Endpoint Protection:**
```bash
# Try accessing protected endpoint without auth
curl https://your-app.vercel.app/api/user/stats
```

**Expected:** `401 Unauthorized` or redirect to login

**Rate Limiting** (if configured with Upstash):
```bash
# Make 20 rapid requests
for i in {1..20}; do
  curl -X POST https://your-app.vercel.app/api/generate-image \
    -H "Content-Type: application/json" \
    -d '{"message":"test","style":"isometric","size":"linkedin"}'
done
```

**Expected:** After ~10 requests, receive `429 Too Many Requests`

**HTTPS Enforcement:**
```bash
# Try accessing via HTTP
curl -I http://your-app.vercel.app
```

**Expected:** Redirect to HTTPS (301/302)

### 7. Cross-Browser Testing

Test in multiple browsers:
- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest)
- [ ] **Edge** (latest)
- [ ] **Mobile Safari** (iOS)
- [ ] **Chrome Mobile** (Android)

**Verify:**
- [ ] Page loads correctly
- [ ] Forms work
- [ ] Image generation works
- [ ] Download functionality works
- [ ] No console errors
- [ ] Responsive design works on mobile

### 8. Error Monitoring Setup

**Sentry (if configured):**
1. [ ] Go to [Sentry Dashboard](https://sentry.io)
2. [ ] Verify project is receiving events
3. [ ] Test error reporting:
   ```javascript
   // In browser console
   throw new Error("Test error from production");
   ```
4. [ ] Check error appears in Sentry

**PostHog (if configured):**
1. [ ] Go to [PostHog Dashboard](https://posthog.com)
2. [ ] Verify events are being tracked
3. [ ] Check user sessions appear
4. [ ] Verify feature flags work (if used)

### 9. Backup Verification (Docker Only)

**Test Database Backup:**
```bash
# Run backup script
./scripts/backup-docker.sh

# Verify backup files created
ls -lh /backups/lakeb2b/
```

**Test Restore:**
```bash
# Create test data
docker compose exec postgres psql -U lakeb2b lakeb2b -c "INSERT INTO \"User\" (email, name) VALUES ('backup-test@example.com', 'Backup Test');"

# Backup
./scripts/backup-docker.sh

# Delete test data
docker compose exec postgres psql -U lakeb2b lakeb2b -c "DELETE FROM \"User\" WHERE email = 'backup-test@example.com';"

# Restore
# (follow restore procedure in Docker section)

# Verify data restored
docker compose exec postgres psql -U lakeb2b lakeb2b -c "SELECT * FROM \"User\" WHERE email = 'backup-test@example.com';"
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Errors

**Error:** `Error: P1001: Can't reach database server at...`

**Solutions:**
- [ ] Verify `DATABASE_URL` is correct
- [ ] Check database server is running
- [ ] For Supabase: Ensure project is not paused (free tier pauses after 7 days inactivity)
- [ ] Test connection manually:
  ```bash
  psql "your-database-url-here"
  ```
- [ ] Check firewall rules allow connections from your IP/Vercel

**Error:** `Error: P1001: Can't reach database server (connect ECONNREFUSED)`

**For Docker:**
```bash
# Check postgres container is running
docker compose ps postgres

# Restart postgres
docker compose restart postgres

# Check logs
docker compose logs postgres
```

#### 2. Image Generation Failures

**Error:** `Failed to generate image` or `Gemini API error`

**Solutions:**
- [ ] Verify `GEMINI_API_KEY` is set correctly
- [ ] Check API key is active at [Google AI Studio](https://aistudio.google.com/app/apikey)
- [ ] Verify API quota is not exceeded
- [ ] Check Gemini API logs for rate limits
- [ ] Test API key directly:
  ```bash
  curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY \
    -H "Content-Type: application/json" \
    -d '{"contents":[{"parts":[{"text":"Test"}]}]}'
  ```

**Error:** `Image processing failed`

**Solutions:**
- [ ] Check Sharp is installed correctly (for serverless deployments)
- [ ] Verify canvas dependencies (Docker only)
- [ ] Check logs for specific error messages
- [ ] Ensure sufficient memory (increase Vercel function memory if needed)

#### 3. LinkedIn OAuth Issues

**Error:** `redirect_uri_mismatch`

**Solutions:**
- [ ] Verify `LINKEDIN_REDIRECT_URI` matches exactly what's configured in LinkedIn app
- [ ] Check for trailing slashes (should NOT have trailing slash)
- [ ] Ensure protocol matches (http vs https)
- [ ] Update LinkedIn app settings at [LinkedIn Developer Portal](https://developer.linkedin.com)

**Error:** `invalid_client` or `unauthorized_client`

**Solutions:**
- [ ] Verify `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` are correct
- [ ] Check LinkedIn app has "Sign In with LinkedIn using OpenID Connect" product enabled
- [ ] Ensure LinkedIn app is not in draft mode
- [ ] Verify credentials haven't been rotated

**Error:** `Failed to post to LinkedIn`

**Solutions:**
- [ ] Check "Share on LinkedIn" product is approved
- [ ] Verify OAuth token is still valid (tokens expire after 60 days)
- [ ] Check user has reconnected LinkedIn recently
- [ ] Verify LinkedIn API is not rate limited

#### 4. Scheduled Posts Not Processing

**Error:** Scheduled posts remain in "pending" status

**For Vercel:**
- [ ] Verify cron job is configured in `vercel.json`
- [ ] Check cron job is enabled in Vercel dashboard (Project → Settings → Cron)
- [ ] View cron job logs in Vercel dashboard
- [ ] Ensure `CRON_SECRET` is set correctly

**For Docker:**
- [ ] Check cron container is running:
  ```bash
  docker compose ps cron
  ```
- [ ] View cron logs:
  ```bash
  docker compose logs -f cron
  ```
- [ ] Verify app container is healthy:
  ```bash
  docker compose exec cron curl -s http://app:3000/api/health
  ```
- [ ] Check `CRON_SECRET` matches in both cron and app containers

**Manual Test:**
```bash
curl -X GET https://your-app.vercel.app/api/cron/process-scheduled \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### 5. Build Failures

**Error:** `Module not found` during build

**Solutions:**
- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Clear build cache:
  ```bash
  # Vercel
  vercel --force

  # Docker
  docker compose build --no-cache
  ```
- [ ] Check `package.json` for missing dependencies
- [ ] Verify Node.js version compatibility (requires Node 18+)

**Error:** `Out of memory` during build

**For Vercel:**
- [ ] Upgrade to higher plan (Pro has more build resources)
- [ ] Optimize build process (reduce bundle size)

**For Docker:**
- [ ] Increase Docker memory limit in Docker Desktop settings
- [ ] Use multi-stage builds to reduce memory usage

#### 6. Performance Issues

**Slow page loads:**
- [ ] Enable Vercel Edge Network (automatic)
- [ ] Optimize images (use Next.js Image component)
- [ ] Check database query performance
- [ ] Enable caching for static assets
- [ ] Use Vercel Analytics to identify bottlenecks

**Slow image generation:**
- [ ] Verify using `gemini-2.0-flash-exp` model (fastest)
- [ ] Check network latency to Gemini API
- [ ] Consider implementing caching for similar prompts
- [ ] Monitor Gemini API performance

#### 7. Docker-Specific Issues

**Error:** `Cannot connect to the Docker daemon`

**Solutions:**
```bash
# Start Docker Desktop (macOS/Windows)
# Or start Docker service (Linux)
sudo systemctl start docker

# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

**Error:** Port already in use (3000, 5432, 6379)

**Solutions:**
```bash
# Find process using port
lsof -i :3000
# Or
netstat -tuln | grep 3000

# Kill process
kill -9 <PID>

# Or change port in .env
NEXT_PUBLIC_APP_URL=http://localhost:3001
# And update docker-compose.yml port mapping
```

**Error:** Volume mount permission denied

**Solutions:**
```bash
# Change volume ownership
docker compose exec app chown -R node:node /app/uploads

# Or use Docker volume instead of bind mount
```

---

## Maintenance and Updates

### Regular Maintenance Tasks

**Weekly:**
- [ ] Check error logs for issues (Sentry/Vercel logs)
- [ ] Monitor Gemini API usage and costs
- [ ] Review scheduled post success rate
- [ ] Check disk space (Docker only)

**Monthly:**
- [ ] Update dependencies:
  ```bash
  npm update
  npm audit fix
  ```
- [ ] Review and rotate secrets if needed
- [ ] Check database backups are working (Docker)
- [ ] Review performance metrics
- [ ] Update Node.js/Docker images if needed

**Quarterly:**
- [ ] Security audit:
  ```bash
  npm audit
  ```
- [ ] Review and update LinkedIn OAuth credentials if needed
- [ ] Load testing and performance optimization
- [ ] Review and archive old scheduled posts

### Updating the Application

**Vercel Deployment:**
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Test locally
npm run build
npm start

# Deploy to Vercel
vercel --prod
```

**Docker Deployment:**
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose up -d --build

# Check logs
docker compose logs -f app
```

### Scaling Considerations

**Vercel:**
- **Free Tier**: Suitable for development/testing
- **Pro Tier** ($20/month): Recommended for production
  - Faster builds
  - Higher function execution limits
  - Better performance

**Docker:**
- **Vertical Scaling**: Increase resources for containers
  ```yaml
  # docker-compose.yml
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
  ```

- **Horizontal Scaling**: Use Docker Swarm or Kubernetes
  - Multiple app instances behind load balancer
  - Shared PostgreSQL and Redis
  - Distributed job processing

### Support and Resources

**Documentation:**
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Better-Auth Documentation](https://www.better-auth.com/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)

**Community:**
- GitHub Issues: Report bugs and request features
- Internal LakeB2B Slack: #social-post-creator

**Monitoring:**
- Vercel Dashboard: https://vercel.com/dashboard
- Sentry Dashboard: https://sentry.io
- Supabase Dashboard: https://supabase.com/dashboard

---

## Deployment Checklist Summary

Use this quick checklist before going live:

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database schema deployed (`npx prisma db push`)
- [ ] LinkedIn OAuth app created and configured
- [ ] Gemini API key obtained and tested
- [ ] Secrets generated securely (32+ bytes)
- [ ] `.env` file never committed to git

### Deployment
- [ ] Application deployed (Vercel or Docker)
- [ ] Health endpoint responding
- [ ] Database connected successfully
- [ ] Redis connected (if using)

### Post-Deployment
- [ ] Image generation tested (all styles)
- [ ] LinkedIn OAuth flow tested
- [ ] Scheduled posts tested
- [ ] Performance verified (< 2s page load)
- [ ] Security verified (no exposed secrets)
- [ ] Cross-browser testing completed
- [ ] Error monitoring configured (Sentry)
- [ ] Backup procedures tested (Docker)

### Production Readiness
- [ ] Custom domain configured (if applicable)
- [ ] SSL/HTTPS enabled
- [ ] Monitoring and alerting set up
- [ ] Backup procedures in place
- [ ] Documentation updated
- [ ] Team trained on deployment and maintenance

---

**Congratulations!** Your LakeB2B Social Post Creator is now deployed and ready for production use.

For additional support, refer to the project README or contact the development team.
