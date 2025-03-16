export const calculateWinner = (squares) => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] }
    }
  }

  return null
}

export const isBoardFull = (squares) => {
  return squares.every(square => square !== null)
}

export function getAIMove(board, player, difficulty = 'easy') {
  // For now, just find the first empty square
  const emptySquares = board.map((square, index) => square === null ? index : null).filter(index => index !== null)
  if (emptySquares.length === 0) {
    return -1 // Return -1 for a full board instead of null
  }
  return emptySquares[0]
} 