/**
 * Better-Auth Configuration
 *
 * Server-side authentication configuration using Better-Auth with Prisma adapter.
 * Supports email/password authentication with optional @lakeb2b.* domain validation.
 */

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '../db/client'

// Database provider must match prisma/schema.prisma datasource provider
// Current: PostgreSQL (for Vercel/Supabase deployment)
const dbProvider = (process.env.DATABASE_PROVIDER || 'postgresql') as 'postgresql' | 'sqlite' | 'mysql'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: dbProvider,
  }),

  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    // Require email verification (optional - can be disabled for development)
    requireEmailVerification: false,
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // User configuration
  user: {
    additionalFields: {
      // Add any additional user fields here if needed
    },
  },

  // Cookie settings
  advanced: {
    cookiePrefix: 'lakeb2b',
    useSecureCookies: process.env.NODE_ENV === 'production',
  },

  // Trust host header for proxy setups
  trustedOrigins: [
    'http://localhost:3000',
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  ],
})

export type Auth = typeof auth
