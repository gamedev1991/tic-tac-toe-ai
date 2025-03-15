import { memo } from 'react'
import styles from '../styles/Board.module.css'

const Board = memo(({ squares, winningLine, onClick, disabled }) => {
  const renderSquare = (index) => {
    const isWinningSquare = winningLine?.includes(index)
    const squareClassName = `${styles.square} ${
      isWinningSquare ? styles.winning : ''
    } ${disabled ? styles.disabled : ''}`

    return (
      <button
        key={index}
        className={squareClassName}
        onClick={() => onClick(index)}
        disabled={disabled || squares[index]}
      >
        <span className={squares[index] === 'X' ? styles.x : styles.o}>
          {squares[index]}
        </span>
      </button>
    )
  }

  return (
    <div className={styles.board}>
      {squares.map((_, index) => renderSquare(index))}
    </div>
  )
})

Board.displayName = 'Board'

export default Board 