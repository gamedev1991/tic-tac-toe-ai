import { createContext, useState, useEffect, useCallback } from 'react'

export const GameContext = createContext()

const INITIAL_BOARD = Array(9).fill(null)
const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6] // diagonals
]

const AI_MOVE_DELAY = 500

export function GameProvider({ children }) {
  const [board, setBoard] = useState(INITIAL_BOARD)
  const [currentPlayer, setCurrentPlayer] = useState('X')
  const [winner, setWinner] = useState(null)
  const [winningLine, setWinningLine] = useState(null)
  const [isAIMode, setIsAIMode] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (isAIMode && currentPlayer === 'O' && !winner && !isProcessing) {
      setIsProcessing(true)
      const timer = setTimeout(() => {
        aiMove()
        setIsProcessing(false)
      }, AI_MOVE_DELAY)
      return () => clearTimeout(timer)
    }
  }, [currentPlayer, winner, isAIMode, isProcessing])

  const calculateWinner = useCallback((squares) => {
    for (const line of WINNING_COMBINATIONS) {
      const [a, b, c] = line
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line }
      }
    }

    if (squares.every(square => square !== null)) {
      return { winner: 'draw', line: null }
    }

    return null
  }, [])

  const makeMove = useCallback((index) => {
    if (
      typeof index !== 'number' ||
      index < 0 ||
      index > 8 ||
      board[index] ||
      winner ||
      isProcessing
    ) {
      return false
    }

    const newBoard = [...board]
    newBoard[index] = currentPlayer
    setBoard(newBoard)

    const result = calculateWinner(newBoard)
    if (result) {
      setWinningLine(result.line)
      setWinner(result.winner)
      return true
    }

    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
    return true
  }, [board, currentPlayer, winner, isProcessing, calculateWinner])

  const evaluateBoard = useCallback((squares, depth) => {
    const result = calculateWinner(squares)
    
    if (result) {
      if (result.winner === 'X') return -10 + depth
      if (result.winner === 'O') return 10 - depth
      if (result.winner === 'draw') return 0
    }
    return null
  }, [calculateWinner])

  const minimax = useCallback((squares, player, depth = 0, alpha = -Infinity, beta = Infinity) => {
    const score = evaluateBoard(squares, depth)
    if (score !== null) return { score }

    const moves = []
    const availableSpots = squares.reduce((acc, val, idx) => 
      val === null ? acc.concat(idx) : acc, [])

    for (let i = 0; i < availableSpots.length; i++) {
      const move = { index: availableSpots[i] }
      squares[availableSpots[i]] = player

      if (player === 'O') {
        const result = minimax(squares, 'X', depth + 1, alpha, beta)
        move.score = result.score
        alpha = Math.max(alpha, result.score)
      } else {
        const result = minimax(squares, 'O', depth + 1, alpha, beta)
        move.score = result.score
        beta = Math.min(beta, result.score)
      }

      squares[availableSpots[i]] = null
      moves.push(move)

      if (beta <= alpha) break
    }

    const getBestMove = (moves, player) => {
      const compare = (a, b) => player === 'O' ? b.score - a.score : a.score - b.score
      return moves.sort(compare)[0]
    }

    return getBestMove(moves, player)
  }, [evaluateBoard])

  const aiMove = useCallback(() => {
    if (winner || isProcessing) return
    const bestMove = minimax([...board], 'O')
    if (bestMove?.index !== undefined) {
      makeMove(bestMove.index)
    }
  }, [board, winner, isProcessing, minimax, makeMove])

  const startNewGame = useCallback((withAI = false) => {
    setBoard(INITIAL_BOARD)
    setCurrentPlayer('X')
    setWinner(null)
    setWinningLine(null)
    setIsAIMode(withAI)
    setIsProcessing(false)
  }, [])

  const value = {
    board,
    currentPlayer,
    winner,
    winningLine,
    makeMove,
    startNewGame,
    isAIMode,
    isProcessing
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
} 