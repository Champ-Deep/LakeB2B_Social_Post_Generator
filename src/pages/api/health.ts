import type { NextApiRequest, NextApiResponse } from 'next'

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  services: {
    imageGeneration: 'available' | 'degraded' | 'unavailable'
    logoService: 'available' | 'unavailable'
  }
  environment: {
    nodeVersion: string
    platform: string
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        imageGeneration: 'unavailable',
        logoService: 'unavailable'
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    })
  }

  try {
    // Check image generation service
    const geminiApiKey = process.env.GEMINI_API_KEY
    const imageGenerationStatus = geminiApiKey ? 'available' : 'degraded'
    
    // Check logo service (always available since it's just configuration)
    const logoServiceStatus = 'available'

    const healthStatus: HealthCheckResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        imageGeneration: imageGenerationStatus,
        logoService: logoServiceStatus
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    }

    res.status(200).json(healthStatus)
  } catch (error) {
    console.error('Health check error:', error)
    
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        imageGeneration: 'unavailable',
        logoService: 'unavailable'
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    })
  }
}