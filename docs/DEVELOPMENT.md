# Development Guide

## Project Setup

1. **Environment Setup**
   ```bash
   # Clone the repository
   git clone [repository-url]
   cd TicTacToe

   # Install dependencies for frontend
   npm install

   # Install dependencies for backend
   cd server
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```

   Create a `.env` file in the server directory:
   ```
   PORT=3001
   ```

## Development Workflow

1. **Running in Development Mode**
   ```bash
   # Start the backend server
   cd server
   npm run dev

   # In a new terminal, start the frontend
   cd ..
   npm run dev
   ```

2. **Code Style**
   - Follow the existing code style
   - Use ESLint and Prettier configurations
   - Run linting before committing:
     ```bash
     npm run lint
     ```

3. **Making Changes**
   - Create a new branch for each feature/fix
   - Follow conventional commit messages
   - Update documentation as needed
   - Add tests for new features

## Testing

1. **Running Tests**
   ```bash
   # Run frontend tests
   npm test

   # Run backend tests
   cd server
   npm test
   ```

2. **Types of Tests**
   - Unit tests for components
   - Integration tests for game logic
   - Socket event tests
   - End-to-end tests for full gameplay

## Debugging

1. **Frontend Debugging**
   - Use React Developer Tools
   - Check browser console for errors
   - Use the Network tab for WebSocket events

2. **Backend Debugging**
   - Use console.log for server events
   - Monitor WebSocket connections
   - Check server logs for errors

## Common Issues

1. **WebSocket Connection Issues**
   - Verify correct socket URL in environment variables
   - Check for CORS configuration
   - Ensure server is running

2. **Game State Sync Issues**
   - Check socket event handlers
   - Verify room management logic
   - Debug state updates in context

## Deployment

1. **Frontend Deployment (Vercel)**
   - Connect GitHub repository
   - Configure environment variables
   - Set up build commands

2. **Backend Deployment (Railway)**
   - Set up Railway project
   - Configure environment variables
   - Set up deployment triggers

## Adding New Features

1. **Frontend**
   - Add new components in `/components`
   - Update context if needed
   - Add new styles in `/styles`
   - Update tests

2. **Backend**
   - Add new socket events in `server/index.js`
   - Update game logic as needed
   - Add new error handlers
   - Update tests

## Best Practices

1. **Code Organization**
   - Keep components small and focused
   - Use meaningful variable names
   - Comment complex logic
   - Follow DRY principles

2. **Performance**
   - Optimize re-renders
   - Use proper React hooks
   - Implement proper cleanup
   - Monitor bundle size

3. **Security**
   - Validate all inputs
   - Sanitize data
   - Handle errors gracefully
   - Follow security best practices

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to your fork
5. Create a Pull Request

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Socket.io Documentation](https://socket.io/docs/v4)
- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) 