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
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000
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
  console.log(`Client connected: ${socket.id} (Total: ${activeConnections})`);

  socket.on('disconnect', () => {
    activeConnections--;
    console.log(`Client disconnected: ${socket.id} (Total: ${activeConnections})`);
  });

  // Game event handlers
  socket.on('game:create', () => {
    const roomId = generateRoomId();
    games.set(roomId, {
      players: [socket.id],
      board: Array(9).fill(null),
      currentPlayer: 'X'
    });
    socket.join(roomId);
    socket.emit('game:created', roomId);
  });

  socket.on('game:join', (roomId) => {
    const game = games.get(roomId);
    if (!game || game.players.length >= 2) {
      socket.emit('error', { message: game ? 'Game is full' : 'Game not found' });
      return;
    }
    game.players.push(socket.id);
    socket.join(roomId);
    socket.emit('game:joined', roomId);
    io.to(roomId).emit('gameStarted', {
      board: game.board,
      currentPlayer: game.currentPlayer,
      players: game.players
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