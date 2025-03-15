import { useContext, useState, useCallback } from 'react'
import { GameContext } from '../context/GameContext'
import { SocketContext } from '../context/SocketContext'
import Confetti from 'react-confetti'
import Board from '../components/Board'
import styles from '../styles/Home.module.css'

const GAME_MODES = {
  MENU: 'menu',
  AI: 'ai',
  ONLINE: 'online'
}

export default function Home() {
  const {
    board,
    currentPlayer,
    winner,
    winningLine,
    makeMove,
    startNewGame,
    isAIMode,
    isProcessing
  } = useContext(GameContext)

  const {
    roomId,
    players,
    isYourTurn,
    createGame,
    joinGame,
    resetGameState,
    isConnected
  } = useContext(SocketContext)

  const [gameMode, setGameMode] = useState(GAME_MODES.MENU)
  const [joinRoomId, setJoinRoomId] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const handleModeSelect = useCallback((mode) => {
    if (mode === GAME_MODES.AI) {
      resetGameState()
      startNewGame(true)
    } else if (mode === GAME_MODES.ONLINE) {
      startNewGame(false)
    }
    setGameMode(mode)
  }, [resetGameState, startNewGame])

  const handleJoinGame = useCallback((e) => {
    e.preventDefault()
    if (!joinRoomId.trim()) return
    
    setIsJoining(true)
    startNewGame(false)
    joinGame(joinRoomId.trim())
    setGameMode(GAME_MODES.ONLINE)
  }, [joinRoomId, joinGame, startNewGame])

  const handleCellClick = useCallback((index) => {
    if (gameMode === GAME_MODES.AI) {
      makeMove(index)
    } else if (gameMode === GAME_MODES.ONLINE && isYourTurn) {
      makeMove(index)
    }
  }, [gameMode, isYourTurn, makeMove])

  const handleBackToMenu = useCallback(() => {
    resetGameState()
    startNewGame(false)
    setGameMode(GAME_MODES.MENU)
    setJoinRoomId('')
    setIsJoining(false)
  }, [resetGameState, startNewGame])

  const getStatusMessage = useCallback(() => {
    if (winner) {
      if (winner === 'draw') return 'Game Over - Draw!'
      if (gameMode === GAME_MODES.AI) {
        return winner === 'X' ? 'You Win!' : 'AI Wins!'
      }
      return `Player ${winner} Wins!`
    }

    if (gameMode === GAME_MODES.ONLINE) {
      if (!isConnected) return 'Connecting to server...'
      if (players.length < 2) return 'Waiting for opponent...'
      return isYourTurn ? 'Your turn' : "Opponent's turn"
    }

    if (gameMode === GAME_MODES.AI) {
      return isProcessing ? 'AI is thinking...' : `Current player: ${currentPlayer}`
    }

    return ''
  }, [winner, gameMode, isConnected, players, isYourTurn, currentPlayer, isProcessing])

  if (gameMode === GAME_MODES.MENU) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Tic Tac Toe</h1>
        <div className={styles.menu}>
          <button
            className={styles.button}
            onClick={() => handleModeSelect(GAME_MODES.AI)}
          >
            Play vs AI
          </button>
          <button
            className={styles.button}
            onClick={() => handleModeSelect(GAME_MODES.ONLINE)}
          >
            Create Online Game
          </button>
          <div className={styles.joinForm}>
            <form onSubmit={handleJoinGame}>
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Enter Room ID"
                className={styles.input}
                disabled={isJoining}
              />
              <button
                type="submit"
                className={styles.button}
                disabled={!joinRoomId.trim() || isJoining}
              >
                {isJoining ? 'Joining...' : 'Join Game'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Tic Tac Toe</h1>
      {gameMode === GAME_MODES.ONLINE && roomId && (
        <div className={styles.roomInfo}>
          Room ID: <span className={styles.roomId}>{roomId}</span>
        </div>
      )}
      <div className={styles.status}>{getStatusMessage()}</div>
      <Board
        squares={board}
        winningLine={winningLine}
        onClick={handleCellClick}
        disabled={
          winner ||
          isProcessing ||
          (gameMode === GAME_MODES.ONLINE && (!isYourTurn || players.length < 2))
        }
      />
      <div className={styles.controls}>
        {winner && (
          <button
            className={styles.button}
            onClick={() => startNewGame(gameMode === GAME_MODES.AI)}
          >
            Play Again
          </button>
        )}
        <button className={styles.button} onClick={handleBackToMenu}>
          Back to Menu
        </button>
      </div>
    </div>
  )
} 