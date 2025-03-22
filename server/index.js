const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Enhanced logging
console.log('Starting server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);
console.log('Client URL:', process.env.CLIENT_URL);
console.log('Node version:', process.version);

const app = express();

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
  pingInterval: 25000,
  allowEIO3: true,
  allowUpgrades: true
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint requested');
  res.status(200).json({ 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
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

// Start server with error handling
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 