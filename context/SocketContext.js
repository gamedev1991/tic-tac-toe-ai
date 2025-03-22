import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';

export const SocketContext = createContext();

const INITIAL_BOARD = Array(9).fill(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState([]);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [gameBoard, setGameBoard] = useState(INITIAL_BOARD);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';
    const newSocket = io(serverUrl);
    socketRef.current = newSocket;
    
    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to server');
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from server');
      setSocket(null);
      setRoomId(null);
      setPlayers([]);
      setIsYourTurn(false);
      setGameBoard(INITIAL_BOARD);
      setWinner(null);
      setWinningLine(null);
    });

    newSocket.on('game:created', (data) => {
      console.log('Game created:', data);
      if (typeof data === 'string') {
        setRoomId(data);
      } else if (data && data.roomId) {
        setRoomId(data.roomId);
      }
      setIsHost(true);
      setPlayers([newSocket.id]);
      setIsYourTurn(true);
      setGameBoard(INITIAL_BOARD);
      setWinner(null);
      setWinningLine(null);
    });

    newSocket.on('game:joined', (data) => {
      console.log('Game joined:', data);
      if (typeof data === 'string') {
        setRoomId(data);
      } else if (data && data.roomId) {
        setRoomId(data.roomId);
      }
      setIsHost(false);
      setPlayers([newSocket.id]);
      setIsYourTurn(false);
      setGameBoard(INITIAL_BOARD);
      setWinner(null);
      setWinningLine(null);
    });

    newSocket.on('gameStarted', ({ players, board, currentPlayer }) => {
      console.log('Game started:', { players, board, currentPlayer });
      setPlayers(players);
      setGameBoard(board);
      const playerIndex = players.indexOf(newSocket.id);
      setIsYourTurn(
        (playerIndex === 0 && currentPlayer === 'X') ||
        (playerIndex === 1 && currentPlayer === 'O')
      );
    });

    newSocket.on('moveMade', ({ board, currentPlayer, players }) => {
      console.log('Move made:', { board, currentPlayer, players, myId: newSocket.id });
      setGameBoard(board);
      const playerIndex = players.indexOf(newSocket.id);
      setPlayers(players);
      setIsYourTurn(
        (currentPlayer === 'X' && playerIndex === 0) ||
        (currentPlayer === 'O' && playerIndex === 1)
      );
    });

    newSocket.on('gameOver', ({ board, winner, winningLine }) => {
      console.log('Game over:', { board, winner, winningLine });
      setGameBoard(board);
      setWinner(winner);
      setWinningLine(winningLine);
      setIsYourTurn(false);
    });

    newSocket.on('gameReset', ({ board, currentPlayer, players: gamePlayers }) => {
      console.log('Game reset:', { board, currentPlayer, players: gamePlayers });
      setGameBoard(board || INITIAL_BOARD);
      setWinner(null);
      setWinningLine(null);
      
      if (gamePlayers) {
        setPlayers(gamePlayers);
        const playerIndex = gamePlayers.indexOf(newSocket.id);
        setIsYourTurn(playerIndex === 0);
      } else {
        setIsYourTurn(isHost);
      }
    });

    newSocket.on('playerDisconnected', () => {
      alert('Other player disconnected');
      setRoomId(null);
      setPlayers([]);
      setIsYourTurn(false);
      setGameBoard(INITIAL_BOARD);
      setWinner(null);
      setWinningLine(null);
    });

    newSocket.on('playerLeft', () => {
      alert('Opponent left the game');
      resetGameState();
    });

    newSocket.on('error', ({ message }) => {
      alert(message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [isHost]);

  const resetGameState = useCallback(() => {
    setRoomId(null);
    setPlayers([]);
    setIsYourTurn(false);
    setGameBoard(INITIAL_BOARD);
    setWinner(null);
    setWinningLine(null);
  }, []);

  const createGame = useCallback(() => {
    if (socket) {
      resetGameState();
      socket.emit('game:create');
    }
  }, [resetGameState, socket]);

  const joinGame = useCallback((gameId) => {
    if (socket) {
      resetGameState();
      socket.emit('game:join', gameId);
    }
  }, [resetGameState, socket]);

  const makeMove = useCallback((index) => {
    if (
      !socket || 
      !roomId || 
      !isYourTurn || 
      winner || 
      typeof index !== 'number' || 
      index < 0 || 
      index > 8 || 
      gameBoard[index] !== null
    ) {
      return;
    }

    // Optimistically update the board
    const newBoard = [...gameBoard];
    newBoard[index] = isHost ? 'X' : 'O';
    setGameBoard(newBoard);
    setIsYourTurn(false);

    socket.emit('makeMove', { roomId, index });
  }, [roomId, isYourTurn, winner, gameBoard, socket, isHost]);

  const resetGame = useCallback(() => {
    if (socket && roomId) {
      setGameBoard(INITIAL_BOARD);
      setWinner(null);
      setWinningLine(null);
      
      socket.emit('resetGame', roomId);
    }
  }, [socket, roomId]);

  const leaveGame = useCallback(() => {
    if (socket && roomId) {
      socket.emit('leaveGame', roomId);
      resetGameState();
    }
  }, [socket, roomId, resetGameState]);

  const value = {
    socket,
    roomId,
    isHost,
    connected,
    players,
    isYourTurn,
    board: gameBoard,
    winner,
    winningLine,
    createGame,
    joinGame,
    makeMove,
    resetGame,
    leaveGame
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
} 