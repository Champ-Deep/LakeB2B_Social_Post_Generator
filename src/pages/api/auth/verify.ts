import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'lakeb2b-secret-key-2024'

interface VerifyResponse {
  success: boolean
  user?: {
    id: string
    email: string
    name: string
  }
  message?: string
  error?: string
}

interface JWTPayload {
  userId: string
  email: string
  name: string
  iat: number
  exp: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }

  try {
    // Get token from cookie or Authorization header
    const cookieToken = req.cookies.lakeb2b_token
    const authHeader = req.headers.authorization
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    
    const token = cookieToken || bearerToken

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload

    // Create user object from decoded token
    const user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name
    }

    return res.status(200).json({
      success: true,
      user,
      message: 'Token valid'
    })

  } catch (error) {
    console.error('Token verification error:', error)
    
    // Clear invalid cookie
    res.setHeader('Set-Cookie', [
      'lakeb2b_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    ])

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      })
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      })
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}