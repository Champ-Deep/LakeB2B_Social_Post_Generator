import type { NextApiRequest, NextApiResponse } from 'next'
import { HealthCheckResult } from '../../lib/api/interfaces/IApiService'

const startTime = Date.now()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResult | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const uptime = Math.floor((Date.now() - startTime) / 1000)

    const healthStatus: HealthCheckResult = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'lakeb2b-social-post-generator',
      uptime,
      environment: process.env.NODE_ENV || 'production',
      version: process.env.npm_package_version || '0.1.0'
    }

    res.status(200).json(healthStatus)
  } catch (error) {
    console.error('Health check error:', error)
    
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'lakeb2b-social-post-generator',
      environment: process.env.NODE_ENV || 'production'
    })
  }
}