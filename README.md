# Tic Tac Toe Game

A modern implementation of the classic Tic Tac Toe game with multiple game modes, including local multiplayer, AI opponent, and online multiplayer functionality.

## Features

- 🎮 Multiple Game Modes:
  - Local 2-Player Mode
  - AI Opponent (with different difficulty levels)
  - Online Multiplayer Mode

- 🎯 Game Features:
  - Real-time game state updates
  - Room creation and joining system
  - Turn-based gameplay
  - Win detection
  - Game reset functionality
  - Player disconnection handling

- 💅 UI/UX Features:
  - Responsive design
  - Status messages
  - Turn indicators
  - Room ID display
  - Confetti effect on win
  - Back to menu functionality

## Tech Stack

- **Frontend:**
  - Next.js
  - React
  - Tailwind CSS
  - Socket.io-client

- **Backend:**
  - Node.js
  - Socket.io
  - Express

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd TicTacToe
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Install backend dependencies:
   ```bash
   cd server
   npm install
   # or
   yarn install
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd server
   npm run start
   # or
   yarn start
   ```

2. In a new terminal, start the frontend:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Game Modes

### Local 2-Player Mode
- Play against a friend on the same device
- Take turns clicking on the board to make moves
- Winner is announced when a player gets three in a row

### AI Mode
- Play against the computer
- Multiple difficulty levels available
- AI uses minimax algorithm for optimal moves

### Online Multiplayer Mode
1. Create a new game room
2. Share the room ID with your friend
3. Friend joins using the room ID
4. Play in real-time over the internet

## Contributing

Feel free to open issues and pull requests for any improvements you want to add.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
