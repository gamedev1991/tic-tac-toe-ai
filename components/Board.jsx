import React from 'react'
import styles from '../styles/Board.module.css'

const Board = ({ squares, onSquareClick, winningLine, disabled }) => {
  const renderSquare = (i) => {
    const isWinningSquare = winningLine && winningLine.includes(i)
    return (
      <div key={i} className={`${styles.square} ${isWinningSquare ? styles.winning : ''}`}>
        <button
          className={styles.squareButton}
          onClick={() => onSquareClick(i)}
          disabled={squares[i] !== null || disabled || winningLine}
          data-testid={`square-${i}`}
        >
          {squares[i]}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.board}>
      {Array(9).fill(null).map((_, i) => renderSquare(i))}
    </div>
  )
}

export default Board 