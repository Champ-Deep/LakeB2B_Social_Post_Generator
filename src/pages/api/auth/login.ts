import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

const SHARED_PASSWORD = process.env.LAKEB2B_SHARED_PASSWORD || 'champ@123'
const JWT_SECRET = process.env.JWT_SECRET || 'lakeb2b-secret-key-2024'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  success: boolean
  token?: string
  user?: {
    id: string
    email: string
    name: string
  }
  message?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }

  try {
    const { email, password }: LoginRequest = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      })
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid input format'
      })
    }

    // Validate email domain
    const emailLower = email.toLowerCase().trim()
    if (!emailLower.endsWith('@lakeb2b.com')) {
      return res.status(401).json({
        success: false,
        error: 'Access restricted to @lakeb2b.com email addresses'
      })
    }

    // Validate password
    if (password !== SHARED_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      })
    }

    // Extract name from email
    const localPart = emailLower.split('@')[0]
    const name = localPart
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')

    // Create user object
    const user = {
      id: `lakeb2b-${localPart}`,
      email: emailLower,
      name: name
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name
      }, 
      JWT_SECRET, 
      { 
        expiresIn: '7d' // Token valid for 7 days
      }
    )

    // Set secure cookie
    res.setHeader('Set-Cookie', [
      `lakeb2b_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`, // 7 days
    ])

    console.log(`Successful login: ${user.email}`)

    return res.status(200).json({
      success: true,
      token,
      user,
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}