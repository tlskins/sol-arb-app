import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    inputColor: '#fafbff',
    orange: '#ff624d',
    violet: '#ee346d',
    turquoise: {
      500: '#17cde5',
      600: '#009fb3',
      700: '#007281',
      800: '#00454f',
    },
    gray: {
      50: '#eaf3fc',
      100: '#d1d9e2',
      200: '#b6bfc9',
      300: '#99a6b2',
      400: '#7d8c9c',
      500: '#637382',
      600: '#4d5966',
      700: '#364049',
      800: '#1e262e',
      900: '#040e16',
    },
  }
})

export default theme
