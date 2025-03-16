import { useContext, useEffect, useState } from 'react'
import { GameContext } from '../context/GameContext'
import { SocketContext } from '../context/SocketContext'
import Board from '../components/Board'
import styles from '../styles/Home.module.css'
import Confetti from 'react-confetti'

const MENU = 'MENU'
const AI = 'AI'
const ONLINE = 'ONLINE'

export default function Home() {
  const { 
    isAIMode, 
    setIsAIMode, 
    currentPlayer, 
    winner: aiWinner, 
    resetGame: resetAIGame, 
    startNewGame,
    board: aiBoard,
    makeMove: aiMove,
    winningLine: aiWinningLine
  } = useContext(GameContext)
  const { 
    createGame, 
    joinGame, 
    roomId, 
    isHost, 
    connected, 
    isYourTurn,
    makeMove: onlineMove,
    board: onlineBoard,
    winner: onlineWinner,
    winningLine: onlineWinningLine,
    resetGame: resetOnlineGame,
    leaveGame
  } = useContext(SocketContext)
  const [joinRoomId, setJoinRoomId] = useState('')
  const [mode, setMode] = useState(MENU)
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })

  // Determine which board and winner to use based on mode
  const currentBoard = mode === ONLINE ? onlineBoard : aiBoard
  const currentWinner = mode === ONLINE ? onlineWinner : aiWinner
  const currentWinningLine = mode === ONLINE ? onlineWinningLine : aiWinningLine

  // Check if game is over (either someone won or it's a draw)
  const isGameOver = Boolean(currentWinner) || currentBoard.every(cell => cell !== null)

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId)
    alert('Room ID copied to clipboard!')
  }

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode)
    if (selectedMode === AI) {
      startNewGame(true)
    } else if (selectedMode === ONLINE) {
      startNewGame(false)
    }
  }

  const handleMove = (index) => {
    if (mode === ONLINE) {
      if (!isYourTurn || onlineWinner) return
      onlineMove(index)
    } else {
      if (aiWinner) return
      aiMove(index)
    }
  }

  const handleReset = () => {
    if (mode === ONLINE) {
      resetOnlineGame()
    } else {
      resetAIGame()
    }
  }

  const handleBackToMenu = () => {
    leaveGame()
    setMode(MENU)
    setJoinRoomId('')
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Tic Tac Toe</h1>

      {currentWinner && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      {mode === MENU && (
        <div className={styles.menu}>
          <button className={styles.button} onClick={() => handleModeSelect(AI)}>
            Play vs AI
          </button>
          <button 
            className={styles.button} 
            onClick={() => handleModeSelect(ONLINE)}
            disabled={!connected}
          >
            Play Online {!connected && '(Connecting...)'}
          </button>
        </div>
      )}

      {mode === ONLINE && !roomId && (
        <div className={styles.menu}>
          <button className={styles.button} onClick={createGame}>
            Create New Game
          </button>
          <div className={styles.joinForm}>
            <input
              type="text"
              className={styles.input}
              placeholder="Enter Room ID"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
            />
            <button 
              className={styles.button}
              onClick={() => joinGame(joinRoomId)}
              disabled={!joinRoomId}
            >
              Join Game
            </button>
          </div>
          <button 
            className={styles.button} 
            onClick={() => setMode(MENU)}
          >
            Back to Menu
          </button>
        </div>
      )}

      {roomId && (
        <div className={styles.roomInfo}>
          <p>
            Room ID: {roomId}
            <button className={styles.copyButton} onClick={handleCopyRoomId}>
              Copy
            </button>
          </p>
          <p>You are {isHost ? 'X' : 'O'}</p>
        </div>
      )}

      {(mode === AI || roomId) && (
        <div className={styles.gameContainer}>
          <div className={styles.gameContent}>
            <div className={styles.status}>
              {currentWinner
                ? `Winner: ${currentWinner}`
                : mode === ONLINE
                ? isYourTurn
                  ? "Your turn"
                  : "Opponent's turn"
                : `Current player: ${currentPlayer}`}
            </div>
            <Board 
              squares={currentBoard} 
              onSquareClick={handleMove}
              winningLine={currentWinningLine}
            />
            {isGameOver && (
              <button className={styles.button} onClick={handleReset}>
                Play Again
              </button>
            )}
            <button 
              className={styles.button} 
              onClick={handleBackToMenu}
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 