const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Environment variables with defaults
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://tic-tac-toe-ai-ashen.vercel.app';

// Log startup configuration
console.log({
  event: 'SERVER_CONFIG',
  port: PORT,
  environment: NODE_ENV,
  corsOrigin: CORS_ORIGIN,
  time: new Date().toISOString()
});

const app = express();

// Health check endpoint that matches Railway configuration
app.get('/_health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    isHealthy
  });
});

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Create HTTP server
const server = http.createServer(app);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  allowEIO3: true,
  allowUpgrades: true
});

// Root endpoint for basic health check
app.get('/', (req, res) => {
  res.sendStatus(200);
});

// Detailed health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime()
  });
});

// Store active games
const games = new Map();
let activeConnections = 0;

// Simple root endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Game logic functions
const generateRoomId = () => Math.random().toString(36).substring(2, 8);

const checkWinner = (board) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }

  return board.every(cell => cell !== null) ? { winner: 'draw', line: null } : null;
};

// Socket connection handling
io.on('connection', (socket) => {
  activeConnections++;
  console.log({
    event: 'CLIENT_CONNECTED',
    socketId: socket.id,
    totalConnections: activeConnections,
    timestamp: new Date().toISOString()
  });

  // Game event handlers
  socket.on('game:create', () => {
    console.log({
      event: 'GAME_CREATE_REQUESTED',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    // Check if socket is already in a room
    const currentRooms = Array.from(socket.rooms);
    if (currentRooms.length > 1) {
      console.log({
        event: 'SOCKET_ALREADY_IN_ROOM',
        socketId: socket.id,
        rooms: currentRooms,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const roomId = generateRoomId();
    console.log({
      event: 'ROOM_CREATED',
      roomId,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    // Create game state
    const gameState = {
      players: [socket.id],
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      winningLine: null
    };

    // Set game state before joining room
    games.set(roomId, gameState);

    // Join room and emit events in sequence
    socket.join(roomId);
    console.log({
      event: 'SOCKET_JOINED_ROOM',
      roomId,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    // Emit game created event with complete game state
    socket.emit('game:created', {
      roomId,
      players: gameState.players,
      board: gameState.board,
      currentPlayer: gameState.currentPlayer
    });

    console.log({
      event: 'GAME_CREATED_EVENT_SENT',
      roomId,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('game:join', (roomId) => {
    console.log({
      event: 'GAME_JOIN_REQUESTED',
      roomId,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    const game = games.get(roomId);
    if (!game) {
      console.log({
        event: 'GAME_NOT_FOUND',
        roomId,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    if (game.players.length >= 2) {
      console.log({
        event: 'GAME_FULL',
        roomId,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
      socket.emit('error', { message: 'Game is full' });
      return;
    }

    game.players.push(socket.id);
    socket.join(roomId);
    console.log({
      event: 'PLAYER_JOINED_GAME',
      roomId,
      socketId: socket.id,
      players: game.players,
      timestamp: new Date().toISOString()
    });

    socket.emit('game:joined', { roomId, players: game.players });
    io.to(roomId).emit('gameStarted', {
      board: game.board,
      currentPlayer: game.currentPlayer,
      players: game.players
    });
    console.log({
      event: 'GAME_STARTED_EVENT_SENT',
      roomId,
      socketId: socket.id,
      players: game.players,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('makeMove', ({ roomId, index }) => {
    const game = games.get(roomId);
    if (!game) return;

    const playerIndex = game.players.indexOf(socket.id);
    const isValidMove = playerIndex !== -1 &&
      (game.currentPlayer === 'X' ? playerIndex === 0 : playerIndex === 1) &&
      game.board[index] === null;

    if (!isValidMove) return;

    game.board[index] = game.currentPlayer;
    const result = checkWinner(game.board);

    if (result) {
      io.to(roomId).emit('gameOver', {
        board: game.board,
        winner: result.winner,
        winningLine: result.line,
        players: game.players
      });
    } else {
      game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
      io.to(roomId).emit('moveMade', {
        board: game.board,
        currentPlayer: game.currentPlayer,
        lastMove: index,
        players: game.players
      });
    }
  });

  // Handle game reset
  socket.on('resetGame', (roomId) => {
    console.log({
      event: 'GAME_RESET_REQUESTED',
      roomId,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    const game = games.get(roomId);
    if (game) {
      // Reset game state
      game.board = Array(9).fill(null);
      game.currentPlayer = 'X';
      game.winner = null;
      game.winningLine = null;
      
      // Notify all players in the room
      io.to(roomId).emit('gameReset', {
        board: game.board,
        currentPlayer: game.currentPlayer,
        players: game.players
      });
      console.log({
        event: 'GAME_RESET_EVENT_SENT',
        roomId,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Consolidated disconnect handler
  socket.on('disconnect', () => {
    activeConnections--;
    console.log({
      event: 'CLIENT_DISCONNECTED',
      socketId: socket.id,
      totalConnections: activeConnections,
      timestamp: new Date().toISOString()
    });

    const roomId = Array.from(socket.rooms).find(room => room !== socket.id);
    if (roomId) {
      const game = games.get(roomId);
      if (game) {
        // Remove the disconnected player from the game
        game.players = game.players.filter(player => player !== socket.id);
        
        // If there are no players left, delete the game
        if (game.players.length === 0) {
          games.delete(roomId);
          console.log({
            event: 'GAME_DELETED',
            roomId,
            reason: 'No players left',
            timestamp: new Date().toISOString()
          });
        } else {
          // Notify the remaining player that their opponent has left
          io.to(roomId).emit('opponentLeft', {
            message: 'Your opponent has left the game',
            players: game.players
          });
          console.log({
            event: 'OPPONENT_LEFT_NOTIFICATION_SENT',
            roomId,
            remainingPlayers: game.players,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Shutdown handling
let isShuttingDown = false;

const shutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log({
    event: 'SHUTDOWN_INITIATED',
    signal,
    time: new Date().toISOString(),
    activeConnections,
    activeGames: games.size,
    memoryUsage: process.memoryUsage()
  });

  server.close(() => {
    console.log({
      event: 'SERVER_CLOSED',
      time: new Date().toISOString(),
      activeConnections,
      activeGames: games.size
    });
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    console.log({
      event: 'FORCE_SHUTDOWN',
      reason: 'Timeout',
      time: new Date().toISOString()
    });
    process.exit(1);
  }, 10000);
};

// Process event handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  console.error({
    event: 'UNCAUGHT_EXCEPTION',
    error: error.message,
    stack: error.stack,
    time: new Date().toISOString()
  });
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error({
    event: 'UNHANDLED_REJECTION',
    reason,
    time: new Date().toISOString()
  });
  shutdown('unhandledRejection');
}); 