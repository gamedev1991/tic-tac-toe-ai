import React, { memo } from 'react';
import styles from '../styles/Board.module.css';

const Board = memo(({ squares, onClick, winningLine }) => {
  return (
    <div className={styles.board}>
      {squares?.map((square, i) => {
        const isWinningSquare = winningLine?.includes(i);
        return (
          <div
            key={i}
            className={`${styles.square} ${isWinningSquare ? styles.winning : ''}`}
          >
            <button
              className={styles.squareButton}
              onClick={() => onClick(i)}
              disabled={square !== null || winningLine}
            >
              {square && (
                <span 
                  className={`${styles.symbol} ${square === 'X' ? styles.x : styles.o}`}
                  data-testid={`square-${i}`}
                >
                  {square}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
});

Board.displayName = 'Board';
export default Board; 