import { extendTheme } from '@chakra-ui/react'
import { brandTheme } from './brand'

export const theme = extendTheme({
  fonts: {
    heading: brandTheme.fonts.heading,
    body: brandTheme.fonts.body,
  },
  colors: {
    brand: {
      ...brandTheme.colors.primary,
      50: '#FFF7E6',
      100: '#FFE5B3',
      200: '#FFD280',
      300: '#FFBF4D',
      400: '#FFAC1A',
      500: brandTheme.colors.primary.yellow,
      600: '#E69D00',
      700: '#B37A00',
      800: '#805800',
      900: '#4D3500',
    },
    purple: {
      500: brandTheme.colors.primary.purple,
    },
    red: {
      500: brandTheme.colors.primary.red,
    }
  },
  styles: {
    global: {
      'html, body': {
        fontFamily: brandTheme.fonts.body,
        bg: 'gray.50',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
        borderRadius: 'md',
      },
      variants: {
        gradient: {
          bgGradient: brandTheme.colors.gradients.logo,
          color: 'white',
          _hover: {
            opacity: 0.9,
          },
        },
      },
    },
  },
})