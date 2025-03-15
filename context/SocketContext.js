import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

const INITIAL_BOARD = Array(9).fill(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState([]);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [gameBoard, setGameBoard] = useState(INITIAL_BOARD);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState(null);
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current = newSocket;
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      setSocket(newSocket);
      reconnectAttemptsRef.current = 0;
    });

    newSocket.on('connect_error', () => {
      setIsConnected(false);
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        newSocket.close();
      }
      reconnectAttemptsRef.current += 1;
    });

    const resetState = () => {
      setIsConnected(false);
      setRoomId(null);
      setPlayers([]);
      setIsYourTurn(false);
      setGameBoard(INITIAL_BOARD);
      setWinner(null);
      setWinningLine(null);
    };

    newSocket.on('disconnect', resetState);

    newSocket.on('gameCreated', ({ roomId }) => {
      setRoomId(roomId);
      setPlayers([newSocket.id]);
      setIsYourTurn(true);
      setGameBoard(INITIAL_BOARD);
      setWinner(null);
      setWinningLine(null);
    });

    newSocket.on('joinSuccess', ({ roomId, players, board, currentPlayer }) => {
      setRoomId(roomId);
      setPlayers(players);
      setGameBoard(board);
      setWinner(null);
      setWinningLine(null);
      setIsYourTurn(players[1] === newSocket.id && currentPlayer === 'O');
    });

    newSocket.on('gameStarted', ({ players, board, currentPlayer }) => {
      setPlayers(players);
      setGameBoard(board);
      const playerIndex = players.indexOf(newSocket.id);
      setIsYourTurn(
        (playerIndex === 0 && currentPlayer === 'X') ||
        (playerIndex === 1 && currentPlayer === 'O')
      );
    });

    newSocket.on('moveMade', ({ board, currentPlayer, players }) => {
      setGameBoard(board);
      if (socketRef.current && players) {
        const playerIndex = players.indexOf(socketRef.current.id);
        setPlayers(players);
        setIsYourTurn(
          (currentPlayer === 'X' && playerIndex === 0) ||
          (currentPlayer === 'O' && playerIndex === 1)
        );
      }
    });

    newSocket.on('gameOver', ({ board, winner, winningLine }) => {
      setGameBoard(board);
      setWinner(winner);
      setWinningLine(winningLine);
      setIsYourTurn(false);
    });

    newSocket.on('gameReset', ({ board }) => {
      setGameBoard(board);
      setWinner(null);
      setWinningLine(null);
      const playerIndex = players.indexOf(socketRef.current?.id);
      setIsYourTurn(playerIndex === 0);
    });

    newSocket.on('playerDisconnected', () => {
      alert('Other player disconnected');
      resetState();
    });

    newSocket.on('error', ({ message }) => {
      alert(message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const resetGameState = useCallback(() => {
    setRoomId(null);
    setPlayers([]);
    setIsYourTurn(false);
    setGameBoard(INITIAL_BOARD);
    setWinner(null);
    setWinningLine(null);
  }, []);

  const createGame = useCallback(() => {
    const currentSocket = socketRef.current;
    if (!currentSocket?.connected) return;
    resetGameState();
    currentSocket.emit('createGame');
  }, [resetGameState]);

  const joinGame = useCallback((roomIdToJoin) => {
    const currentSocket = socketRef.current;
    if (!currentSocket?.connected || !roomIdToJoin?.trim()) return;
    resetGameState();
    currentSocket.emit('joinGame', roomIdToJoin.trim());
  }, [resetGameState]);

  const makeMove = useCallback((index) => {
    const currentSocket = socketRef.current;
    if (
      !currentSocket?.connected || 
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

    currentSocket.emit('makeMove', { roomId, index });
  }, [roomId, isYourTurn, winner, gameBoard]);

  const value = {
    socket,
    roomId,
    isConnected,
    players,
    isYourTurn,
    gameBoard,
    winner,
    winningLine,
    createGame,
    joinGame,
    makeMove,
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