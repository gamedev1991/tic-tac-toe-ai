import { createContext, useState } from 'react'

export const GameContext = createContext()

export function GameProvider({ children }) {
  const [board, setBoard] = useState(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState('X')
  const [winner, setWinner] = useState(null)
  const [winningLine, setWinningLine] = useState(null)

  const makeMove = (index) => {
    if (board[index] || winner) return

    const newBoard = [...board]
    newBoard[index] = currentPlayer
    setBoard(newBoard)

    const result = calculateWinner(newBoard)
    if (result) {
      setWinningLine(result.line)
      setTimeout(() => {
        setWinner(result.winner)
      }, 2000)
      return
    }

    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setCurrentPlayer('X')
    setWinner(null)
    setWinningLine(null)
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
        return { winner: squares[a], line: line }
      }
    }
    return null
  }

  const minimax = (newBoard, player) => {
    const availSpots = newBoard.reduce((acc, val, idx) => val === null ? acc.concat(idx) : acc, [])

    if (calculateWinner(newBoard) === 'X') return { score: -10 }
    if (calculateWinner(newBoard) === 'O') return { score: 10 }
    if (availSpots.length === 0) return { score: 0 }

    const moves = []
    for (let i = 0; i < availSpots.length; i++) {
      const move = {}
      move.index = availSpots[i]
      newBoard[availSpots[i]] = player

      if (player === 'O') {
        const result = minimax(newBoard, 'X')
        move.score = result.score
      } else {
        const result = minimax(newBoard, 'O')
        move.score = result.score
      }

      newBoard[availSpots[i]] = null
      moves.push(move)
    }

    let bestMove
    if (player === 'O') {
      let bestScore = -10000
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score > bestScore) {
          bestScore = moves[i].score
          bestMove = i
        }
      }
    } else {
      let bestScore = 10000
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score < bestScore) {
          bestScore = moves[i].score
          bestMove = i
        }
      }
    }

    return moves[bestMove]
  }

  const aiMove = () => {
    const bestSpot = minimax(board, 'O')
    makeMove(bestSpot.index)
  }

  return (
    <GameContext.Provider value={{ board, currentPlayer, makeMove, resetGame, aiMove, winner, winningLine }}>
      {children}
    </GameContext.Provider>
  )
} 