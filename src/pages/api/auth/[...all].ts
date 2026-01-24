/**
 * Better-Auth API Route Handler
 *
 * Catch-all route that handles all Better-Auth operations:
 * - POST /api/auth/sign-up - User registration
 * - POST /api/auth/sign-in/email - Email/password login
 * - POST /api/auth/sign-out - Logout
 * - GET /api/auth/session - Get current session
 *
 * Better-Auth handles all the routing internally.
 */

import { auth } from '../../../lib/auth/auth'
import { toNodeHandler } from 'better-auth/node'

export default toNodeHandler(auth)
