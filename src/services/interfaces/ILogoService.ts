/**
 * Logo Service Interface
 * Following Interface Segregation Principle (SOLID - I)
 */

export interface LogoPlacement {
  x: number
  y: number
  width: number
  height: number
}

export interface LogoConfiguration {
  logoPath: string
  placements: Record<string, LogoPlacement>
}

export interface ILogoService {
  /**
   * Get logo placement for specific size
   */
  getPlacement(size: string): LogoPlacement
  
  /**
   * Get logo path
   */
  getLogoPath(): string
}