import '../styles/globals.css'
import theme from '../components/theme'

import 'react-toastify/dist/ReactToastify.css'
import { ChakraProvider } from "@chakra-ui/react"
import type { AppProps } from 'next/app'
import { ToastContainer } from 'react-toastify';
import { SessionProvider } from "next-auth/react"

function MyApp({ Component, pageProps: {session, ...pageProps} }: AppProps) {
  console.log('myapp session', session)
  return(
    <ChakraProvider theme={ theme }>
      <SessionProvider session={session}>
        <ToastContainer />
        <Component {...pageProps} />
      </SessionProvider>
    </ChakraProvider>
  )   
}

export default MyApp
