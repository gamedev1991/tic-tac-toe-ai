const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

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
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Create HTTP server
const server = http.createServer(app);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: '*',
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

// Generate a random room ID
const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 8);
};

// Check for winner
const checkWinner = (board) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a],
        line: [a, b, c]
      };
    }
  }

  if (board.every(cell => cell !== null)) {
    return { winner: 'draw', line: null };
  }

  return null;
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Create a new game room
  socket.on('game:create', () => {
    try {
      const roomId = generateRoomId();
      console.log('Creating game room:', roomId);
      
      const gameState = {
        players: [socket.id],
        board: Array(9).fill(null),
        currentPlayer: 'X',
        moves: [],
        winner: null,
        winningLine: null
      };
      
      games.set(roomId, gameState);
      socket.join(roomId);
      
      console.log('Emitting game:created with roomId:', roomId);
      socket.emit('game:created', roomId);
    } catch (error) {
      console.error('Error creating game:', error);
      socket.emit('error', { message: 'Failed to create game' });
    }
  });

  // Handle manual game leave
  socket.on('leaveGame', (roomId) => {
    console.log('Player leaving game:', { roomId, socketId: socket.id });
    const game = games.get(roomId);
    if (game) {
      // Notify other players in the room
      socket.to(roomId).emit('playerLeft');
      // Leave the socket room
      socket.leave(roomId);
      // Delete the game
      games.delete(roomId);
    }
  });

  // Join an existing game
  socket.on('game:join', (roomId) => {
    try {
      console.log('Join attempt:', { roomId, socketId: socket.id });
      const game = games.get(roomId);
      
      if (!game) {
        console.log('Game not found:', roomId);
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      if (game.players.length >= 2) {
        console.log('Game full:', roomId);
        socket.emit('error', { message: 'Game is full' });
        return;
      }

      game.players.push(socket.id);
      socket.join(roomId);
      console.log('Player joined successfully:', { roomId, players: game.players });
      
      socket.emit('game:joined', roomId);
      
      // Notify all players in the room that the game has started
      io.to(roomId).emit('gameStarted', {
        board: game.board,
        currentPlayer: game.currentPlayer,
        players: game.players
      });
    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  // Handle moves
  socket.on('makeMove', ({ roomId, index }) => {
    try {
      console.log('Move attempt:', { roomId, index, playerId: socket.id });
      const game = games.get(roomId);
      if (!game) {
        console.log('Game not found for move:', roomId);
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      if (game.winner) {
        console.log('Game already has a winner');
        socket.emit('error', { message: 'Game is already over' });
        return;
      }

      const playerIndex = game.players.indexOf(socket.id);
      console.log('Move validation:', {
        playerIndex,
        currentPlayer: game.currentPlayer,
        players: game.players,
        board: game.board
      });

      const isCorrectPlayer = (game.currentPlayer === 'X' && playerIndex === 0) ||
                            (game.currentPlayer === 'O' && playerIndex === 1);

      if (!isCorrectPlayer) {
        console.log('Not player\'s turn:', {
          currentPlayer: game.currentPlayer,
          playerIndex,
          socketId: socket.id,
          players: game.players
        });
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

      if (game.board[index] !== null) {
        console.log('Invalid move - space occupied:', index);
        socket.emit('error', { message: 'Invalid move' });
        return;
      }

      // Make the move
      game.board[index] = game.currentPlayer;
      game.moves.push({ player: game.currentPlayer, position: index });

      // Check for winner
      const result = checkWinner(game.board);
      if (result) {
        game.winner = result.winner;
        game.winningLine = result.line;
        console.log('Game over:', { winner: result.winner, line: result.line });
        
        // Broadcast game over
        io.to(roomId).emit('gameOver', {
          board: game.board,
          winner: result.winner,
          winningLine: result.line,
          players: game.players
        });
        return;
      }
      
      // Switch current player if game is not over
      game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';

      const nextPlayerIndex = playerIndex === 0 ? 1 : 0;
      console.log('Move successful:', {
        board: game.board,
        currentPlayer: game.currentPlayer,
        lastMove: index,
        nextPlayerIndex,
        players: game.players
      });

      // Broadcast the move to all players in the room
      io.to(roomId).emit('moveMade', {
        board: game.board,
        currentPlayer: game.currentPlayer,
        lastMove: index,
        players: game.players,
        nextPlayerIndex
      });
    } catch (error) {
      console.error('Error making move:', error);
      socket.emit('error', { message: 'Failed to make move' });
    }
  });

  // Handle game reset
  socket.on('resetGame', (roomId) => {
    const game = games.get(roomId);
    if (game) {
      game.board = Array(9).fill(null);
      game.currentPlayer = 'X';
      game.moves = [];
      game.winner = null;
      game.winningLine = null;
      io.to(roomId).emit('gameReset', {
        board: game.board,
        currentPlayer: game.currentPlayer,
        players: game.players
      });
    }
  });
});

// Server startup and health monitoring
const PORT = process.env.PORT || 3001;
let isHealthy = true;
let shutdownInProgress = false;
let serverStartTime = Date.now();
let activeConnections = 0;

// Log server stats
const logServerStats = () => {
  const uptime = Math.floor((Date.now() - serverStartTime) / 1000); // in seconds
  const memoryUsage = process.memoryUsage();
  console.log('Server Stats:', {
    uptime: `${uptime}s`,
    activeConnections,
    memoryUsage: {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
    },
    isHealthy,
    games: games.size
  });
};

// Simple memory usage check
const checkMemoryHealth = () => {
  const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  const isMemoryHealthy = usedMemory < 512;
  console.log('Memory Health Check:', {
    usedMemory: `${Math.round(usedMemory)}MB`,
    isHealthy: isMemoryHealthy,
    threshold: '512MB'
  });
  return isMemoryHealthy;
};

// Health check function
const checkHealth = () => {
  if (!shutdownInProgress) {
    // Only check memory usage for now
    isHealthy = checkMemoryHealth();
  }
};

// Keep-alive ping to prevent idle shutdown
const keepAlive = () => {
  const pingInterval = setInterval(() => {
    if (shutdownInProgress) {
      clearInterval(pingInterval);
      return;
    }
    
    // Perform health check
    checkHealth();
    
    // Log minimal stats to avoid cluttering logs
    console.log('Health Check:', {
      uptime: Math.floor(process.uptime()),
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      connections: activeConnections,
      isHealthy
    });
  }, 10000); // Check every 10 seconds
};

// Start server
server.listen(PORT, () => {
  console.log('Server Starting:', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
  
  // Start keep-alive mechanism
  keepAlive();
});

// Track connection counts
io.on('connection', (socket) => {
  activeConnections++;
  console.log('Socket Connected:', {
    socketId: socket.id,
    activeConnections,
    time: new Date().toISOString()
  });
  
  socket.on('disconnect', () => {
    activeConnections--;
    console.log('Socket Disconnected:', {
      socketId: socket.id,
      activeConnections,
      time: new Date().toISOString()
    });
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Create a new game room
  socket.on('game:create', () => {
    try {
      const roomId = generateRoomId();
      console.log('Creating game room:', roomId);
      
      const gameState = {
        players: [socket.id],
        board: Array(9).fill(null),
        currentPlayer: 'X',
        moves: [],
        winner: null,
        winningLine: null
      };
      
      games.set(roomId, gameState);
      socket.join(roomId);
      
      console.log('Emitting game:created with roomId:', roomId);
      socket.emit('game:created', roomId);
    } catch (error) {
      console.error('Error creating game:', error);
      socket.emit('error', { message: 'Failed to create game' });
    }
  });

  // Handle manual game leave
  socket.on('leaveGame', (roomId) => {
    console.log('Player leaving game:', { roomId, socketId: socket.id });
    const game = games.get(roomId);
    if (game) {
      // Notify other players in the room
      socket.to(roomId).emit('playerLeft');
      // Leave the socket room
      socket.leave(roomId);
      // Delete the game
      games.delete(roomId);
    }
  });

  // Join an existing game
  socket.on('game:join', (roomId) => {
    try {
      console.log('Join attempt:', { roomId, socketId: socket.id });
      const game = games.get(roomId);
      
      if (!game) {
        console.log('Game not found:', roomId);
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      
      if (game.players.length >= 2) {
        console.log('Game full:', roomId);
        socket.emit('error', { message: 'Game is full' });
        return;
      }

      game.players.push(socket.id);
      socket.join(roomId);
      console.log('Player joined successfully:', { roomId, players: game.players });
      
      socket.emit('game:joined', roomId);
      
      // Notify all players in the room that the game has started
      io.to(roomId).emit('gameStarted', {
        board: game.board,
        currentPlayer: game.currentPlayer,
        players: game.players
      });
    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  // Handle moves
  socket.on('makeMove', ({ roomId, index }) => {
    try {
      console.log('Move attempt:', { roomId, index, playerId: socket.id });
      const game = games.get(roomId);
      if (!game) {
        console.log('Game not found for move:', roomId);
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      if (game.winner) {
        console.log('Game already has a winner');
        socket.emit('error', { message: 'Game is already over' });
        return;
      }

      const playerIndex = game.players.indexOf(socket.id);
      console.log('Move validation:', {
        playerIndex,
        currentPlayer: game.currentPlayer,
        players: game.players,
        board: game.board
      });

      const isCorrectPlayer = (game.currentPlayer === 'X' && playerIndex === 0) ||
                            (game.currentPlayer === 'O' && playerIndex === 1);

      if (!isCorrectPlayer) {
        console.log('Not player\'s turn:', {
          currentPlayer: game.currentPlayer,
          playerIndex,
          socketId: socket.id,
          players: game.players
        });
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

      if (game.board[index] !== null) {
        console.log('Invalid move - space occupied:', index);
        socket.emit('error', { message: 'Invalid move' });
        return;
      }

      // Make the move
      game.board[index] = game.currentPlayer;
      game.moves.push({ player: game.currentPlayer, position: index });

      // Check for winner
      const result = checkWinner(game.board);
      if (result) {
        game.winner = result.winner;
        game.winningLine = result.line;
        console.log('Game over:', { winner: result.winner, line: result.line });
        
        // Broadcast game over
        io.to(roomId).emit('gameOver', {
          board: game.board,
          winner: result.winner,
          winningLine: result.line,
          players: game.players
        });
        return;
      }
      
      // Switch current player if game is not over
      game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';

      const nextPlayerIndex = playerIndex === 0 ? 1 : 0;
      console.log('Move successful:', {
        board: game.board,
        currentPlayer: game.currentPlayer,
        lastMove: index,
        nextPlayerIndex,
        players: game.players
      });

      // Broadcast the move to all players in the room
      io.to(roomId).emit('moveMade', {
        board: game.board,
        currentPlayer: game.currentPlayer,
        lastMove: index,
        players: game.players,
        nextPlayerIndex
      });
    } catch (error) {
      console.error('Error making move:', error);
      socket.emit('error', { message: 'Failed to make move' });
    }
  });

  // Handle game reset
  socket.on('resetGame', (roomId) => {
    const game = games.get(roomId);
    if (game) {
      game.board = Array(9).fill(null);
      game.currentPlayer = 'X';
      game.moves = [];
      game.winner = null;
      game.winningLine = null;
      io.to(roomId).emit('gameReset', {
        board: game.board,
        currentPlayer: game.currentPlayer,
        players: game.players
      });
    }
  });
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  if (shutdownInProgress) {
    console.log('Shutdown Already in Progress:', {
      signal,
      activeConnections,
      time: new Date().toISOString()
    });
    return;
  }

  shutdownInProgress = true;
  console.log('Starting Graceful Shutdown:', {
    signal,
    activeConnections,
    uptime: `${Math.floor((Date.now() - serverStartTime) / 1000)}s`,
    activeGames: games.size,
    time: new Date().toISOString()
  });

  // Log final server stats
  logServerStats();

  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      console.error('Error During Server Close:', {
        error: err.message,
        time: new Date().toISOString()
      });
    }
    console.log('HTTP Server Closed:', {
      activeConnections,
      time: new Date().toISOString()
    });
    
    // Close Socket.IO connections
    io.close(() => {
      console.log('Socket.IO Server Closed:', {
        finalStats: {
          uptime: `${Math.floor((Date.now() - serverStartTime) / 1000)}s`,
          gamesEnded: games.size
        },
        time: new Date().toISOString()
      });
      process.exit(0);
    });
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.log('Force Shutdown Initiated:', {
      reason: 'Timeout exceeded',
      activeConnections,
      time: new Date().toISOString()
    });
    process.exit(1);
  }, 10000);
};

// Signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (!shutdownInProgress) {
    gracefulShutdown('uncaughtException');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (!shutdownInProgress) {
    gracefulShutdown('unhandledRejection');
  }
}); 