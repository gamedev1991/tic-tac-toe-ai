// pages/_app.js
import '../styles/globals.css'
import { GameProvider } from '../context/GameContext'

function MyApp({ Component, pageProps }) {
  return (
    <GameProvider>
      <Component {...pageProps} />
    </GameProvider>
  )
}

export default MyApp

// pages/index.js
import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

export default function Home() {
  const { board, currentPlayer, makeMove, resetGame } = useContext(GameContext)

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Tic Tac Toe</h1>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {board.map((value, index) => (
            <button
              key={index}
              onClick={() => makeMove(index)}
              className="h-24 bg-white shadow-md rounded-lg text-4xl font-bold hover:bg-gray-50"
            >
              {value}
            </button>
          ))}
        </div>
        <div className="text-center">
          <p className="text-xl mb-4">Current Player: {currentPlayer}</p>
          <button
            onClick={resetGame}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reset Game
          </button>
        </div>
      </div>
    </div>
  )
}

// context/GameContext.js
import { createContext, useState } from 'react'

export const GameContext = createContext()

export function GameProvider({ children }) {
  const [board, setBoard] = useState(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState('X')

  const makeMove = (index) => {
    if (board[index] || calculateWinner(board)) return

    const newBoard = [...board]
    newBoard[index] = currentPlayer
    setBoard(newBoard)
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setCurrentPlayer('X')
  }

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ]

    for (let line of lines) {
      const [a, b, c] = line
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a]
      }
    }
    return null
  }

  return (
    <GameContext.Provider value={{ board, currentPlayer, makeMove, resetGame }}>
      {children}
    </GameContext.Provider>
  )
}

// styles/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

// tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

// next.config.js
module.exports = {
  reactStrictMode: true,
}

// package.json dependencies to add:
{
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "autoprefixer": "latest",
    "postcss": "latest",
    "tailwindcss": "latest"
  }
}
