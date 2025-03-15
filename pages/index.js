import { useContext, useState, useEffect } from 'react'
import { GameContext } from '../context/GameContext'
import Confetti from 'react-confetti'

export default function Home() {
  const { board, currentPlayer, makeMove, resetGame, aiMove, winner, winningLine } = useContext(GameContext)
  const [isAIMode, setIsAIMode] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    if (isAIMode && currentPlayer === 'O' && !winner) {
      aiMove()
    }
  }, [board, currentPlayer, isAIMode, winner])

  const handleMove = (index) => {
    if (winner || board[index]) return
    makeMove(index)
  }

  const startGame = (withAI) => {
    setIsAIMode(withAI)
    setGameStarted(true)
    resetGame()
  }

  const handleReset = () => {
    setGameStarted(false)
    resetGame()
  }

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ]
    for (let line of lines) {
      const [a, b, c] = line
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: line }
      }
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {winner && <Confetti />}
      <div className="w-full max-w-[400px] mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Tic Tac Toe</h1>
        
        {!gameStarted ? (
          <div className="flex flex-col gap-4 items-center">
            <button
              onClick={() => startGame(false)}
              className="w-64 px-6 py-4 rounded-lg text-xl font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              Play vs Friend
            </button>
            <button
              onClick={() => startGame(true)}
              className="w-64 px-6 py-4 rounded-lg text-xl font-bold bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              Play vs AI
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <p className="text-xl font-semibold">
                Mode: {isAIMode ? 'Playing vs AI' : 'Playing vs Friend'}
              </p>
            </div>
            {winner ? (
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Winner: {winner}</h2>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleReset}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg text-xl font-bold hover:bg-blue-700"
                  >
                    New Game
                  </button>
                  <button
                    onClick={() => startGame(isAIMode)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg text-xl font-bold hover:bg-green-700"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-8 mx-auto">
                  {board.map((value, index) => (
                    <button
                      key={index}
                      onClick={() => handleMove(index)}
                      className={`w-32 h-32 border-4 ${winningLine && winningLine.includes(index) ? 'border-green-500 bg-green-100' : 'border-gray-800'} bg-white text-6xl font-bold flex items-center justify-center hover:bg-gray-100`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold mb-4">Current Player: {currentPlayer}</p>
                  <button
                    onClick={handleReset}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg text-xl font-bold hover:bg-blue-700"
                  >
                    Back to Menu
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
} 