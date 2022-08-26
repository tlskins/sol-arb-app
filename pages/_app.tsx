import '../styles/globals.css'
import 'react-toastify/dist/ReactToastify.css'
import type { AppProps } from 'next/app'
import { ToastContainer } from 'react-toastify';
import { SessionProvider } from "next-auth/react"

function MyApp({ Component, pageProps: {session, ...pageProps} }: AppProps) {
  console.log('myapp session', session)
  return(
    <SessionProvider session={session}>
      <ToastContainer />
      <Component {...pageProps} />
    </SessionProvider>
  )   
}

export default MyApp
