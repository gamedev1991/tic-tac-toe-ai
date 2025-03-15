import { GameProvider } from '../context/GameContext'
import { SocketProvider } from '../context/SocketContext'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
    <SocketProvider>
      <GameProvider>
        <Component {...pageProps} />
      </GameProvider>
    </SocketProvider>
  )
}

export default MyApp 