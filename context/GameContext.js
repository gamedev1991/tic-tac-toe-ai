import { createContext, useState, useCallback } from 'react'

export const GameContext = createContext()

const INITIAL_BOARD = Array(9).fill(null)
const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6] // diagonals
]

export function GameProvider({ children }) {
  const [board, setBoard] = useState(INITIAL_BOARD)
  const [currentPlayer, setCurrentPlayer] = useState('X')
  const [winner, setWinner] = useState(null)
  const [winningLine, setWinningLine] = useState(null)
  const [isAIMode, setIsAIMode] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const checkWinner = useCallback((squares) => {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    if (squares.every(square => square !== null)) {
      return { winner: 'draw', line: null };
    }
    return null;
  }, []);

  const minimax = useCallback((board, player, depth = 0) => {
    const result = checkWinner(board);
    
    if (result) {
      if (result.winner === 'X') return -10 + depth;
      if (result.winner === 'O') return 10 - depth;
      return 0;
    }

    if (player === 'O') {
      let bestScore = -Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          board[i] = 'O';
          const score = minimax(board, 'X', depth + 1);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          board[i] = 'X';
          const score = minimax(board, 'O', depth + 1);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }, [checkWinner]);

  const findBestMove = useCallback((board) => {
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        const score = minimax(board, 'X', 0);
        board[i] = null;

        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }

    return bestMove;
  }, [minimax]);

  const makeMove = useCallback((index) => {
    if (board[index] || winner || isProcessing) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      return;
    }

    if (isAIMode && currentPlayer === 'X') {
      setIsProcessing(true);
      setCurrentPlayer('O');
      
      setTimeout(() => {
        const aiMove = findBestMove([...newBoard]);
        if (aiMove !== null) {
          const aiBoard = [...newBoard];
          aiBoard[aiMove] = 'O';
          setBoard(aiBoard);

          const aiResult = checkWinner(aiBoard);
          if (aiResult) {
            setWinner(aiResult.winner);
            setWinningLine(aiResult.line);
          }
          setCurrentPlayer('X');
        }
        setIsProcessing(false);
      }, 500);
    } else {
      setCurrentPlayer(prev => prev === 'X' ? 'O' : 'X');
    }
  }, [board, currentPlayer, winner, isProcessing, isAIMode, checkWinner, findBestMove]);

  const resetGame = useCallback(() => {
    setBoard(INITIAL_BOARD);
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine(null);
    setIsProcessing(false);
  }, []);

  const startNewGame = useCallback((withAI = false) => {
    resetGame();
    setIsAIMode(withAI);
  }, [resetGame]);

  const value = {
    board,
    currentPlayer,
    winner,
    winningLine,
    makeMove,
    startNewGame,
    isAIMode,
    setIsAIMode,
    isProcessing,
    resetGame
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
} 