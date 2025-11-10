import type { NextApiRequest, NextApiResponse } from 'next'

interface LogoutResponse {
  success: boolean
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogoutResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    })
  }

  try {
    // Clear the authentication cookie
    res.setHeader('Set-Cookie', [
      'lakeb2b_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    ])

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}