// Use the actual LakeB2B Logo PNG file
export const getLakeB2BLogoDataUrl = (): string => {
  // Return the path to the actual logo file in the public directory
  return '/logos/LakeB2B Logo Square.png'
}

// Logo placement configurations for different social media sizes
// Based on analysis of example posts - bottom-left positioning
export const logoPlacement = {
  linkedin: { x: 40, y: 550, scale: 0.6 }, // Bottom-left for 1200x627, smaller scale
  instagram: { x: 40, y: 1000, scale: 0.7 }, // Bottom-left for 1080x1080  
  feed: { x: 40, y: 550, scale: 0.6 }, // Bottom-left for 1200x628, smaller scale
}