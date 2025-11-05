/**
 * Logo Service - Server-safe implementation
 * Following Single Responsibility Principle (SOLID)
 */

import { ILogoService, LogoPlacement, LogoConfiguration } from './interfaces/ILogoService'

export class LogoService implements ILogoService {
  private config: LogoConfiguration

  constructor(config: LogoConfiguration) {
    this.config = config
  }

  /**
   * Get logo placement configuration for specific size
   */
  getPlacement(size: string): LogoPlacement {
    return this.config.placements[size] || this.config.placements.default
  }

  /**
   * Get logo path
   */
  getLogoPath(): string {
    return this.config.logoPath
  }
}

// Default logo service configuration
export const createDefaultLogoService = (): LogoService => {
  return new LogoService({
    logoPath: '/logos/LakeB2B Logo Square.png',
    placements: {
      landscape: { x: 40, y: 615, width: 150, height: 45 }, // 1200x675
      square: { x: 40, y: 995, width: 150, height: 45 },    // 1080x1080  
      story: { x: 40, y: 1835, width: 150, height: 45 },    // 1080x1920
      default: { x: 40, y: 615, width: 150, height: 45 }
    }
  })
}