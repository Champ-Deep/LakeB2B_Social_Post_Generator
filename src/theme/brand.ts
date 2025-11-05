export const brandTheme = {
  colors: {
    primary: {
      yellow: '#FFB703',
      red: '#E8033A',
      purple: '#6D08BE',
    },
    secondary: {
      pink: '#DD1286',
      teal: '#0095A0',
      darkRed: '#C1003C',
      orange: '#FF6903',
      lightPurple: '#7A76DA',
      darkBlue: '#011A6B',
    },
    gradients: {
      logo: 'linear-gradient(135deg, #6D08BE 60%, #E8033A 80%, #FFB703 100%)',
      purple: 'linear-gradient(135deg, #6D08BE 0%, #DD1286 100%)',
      orange: 'linear-gradient(135deg, #FFB703 0%, #FF6903 100%)',
      blue: 'linear-gradient(135deg, #0095A0 0%, #011A6B 100%)',
    },
    background: {
      dark: '#011A6B',
      light: '#FFFFFF',
    }
  },
  fonts: {
    heading: "'Montserrat', sans-serif",
    body: "'Montserrat', sans-serif",
  },
  fontWeights: {
    light: 300,
    regular: 400,
    bold: 700,
    extraBold: 800,
  },
  sizes: {
    square: { width: 1080, height: 1080 },   // 1:1 aspect ratio for Instagram
  },
  styles: {
    isometric: 'Isometric business illustrations with clean lines',
  }
}