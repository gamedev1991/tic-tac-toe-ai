import React from 'react';
import styles from '../styles/Board.module.css';

const Board = ({ squares = Array(9).fill(null), onSquareClick = () => {}, winningLine = [], disabled = false }) => {
  const renderSquare = (i) => {
    const isWinning = winningLine && winningLine.includes(i);
    return (
      <div
        key={i}
        data-testid={`square-${i}`}
        className={`${styles.square} ${isWinning ? styles.winning : ''}`}
      >
        <button
          className={styles.squareButton}
          onClick={() => onSquareClick(i)}
          disabled={squares[i] !== null || disabled}
          aria-label={`Square ${i}`}
        >
          <span className={`${styles.symbol} ${squares[i] === 'X' ? styles.x : styles.o}`}>
            {squares[i]}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className={styles.board}>
      {Array(9).fill(null).map((_, i) => renderSquare(i))}
    </div>
  );
};

export default Board; 