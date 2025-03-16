import { render, act } from '@testing-library/react'
import { SocketProvider } from './SocketContext'
import { io } from 'socket.io-client'

// Mock socket.io-client
jest.mock('socket.io-client')

describe('SocketContext', () => {
  let mockSocket
  let mockEmit
  let mockOn
  let mockDisconnect
  let eventHandlers

  beforeEach(() => {
    // Reset event handlers for each test
    eventHandlers = {}
    
    // Create mock functions
    mockEmit = jest.fn()
    mockOn = jest.fn((event, handler) => {
      eventHandlers[event] = handler
    })
    mockDisconnect = jest.fn()

    // Create mock socket
    mockSocket = {
      emit: mockEmit,
      on: mockOn,
      disconnect: mockDisconnect
    }

    // Mock io to return our mock socket
    io.mockReturnValue(mockSocket)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('provides socket connection status', () => {
    const { unmount } = render(<SocketProvider />)
    expect(io).toHaveBeenCalled()
    unmount()
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('handles room creation', async () => {
    const { unmount } = render(<SocketProvider />)

    // Simulate creating a room
    await act(async () => {
      mockEmit.mockClear()
      mockSocket.emit('game:create')
      if (eventHandlers['game:created']) {
        eventHandlers['game:created']({ roomId: 'test-room-123' })
      }
    })

    expect(mockEmit).toHaveBeenCalledWith('game:create')
    unmount()
  })

  it('handles joining a room', async () => {
    const roomId = 'test-room-123'
    const { unmount } = render(<SocketProvider />)

    // Simulate joining a room
    await act(async () => {
      mockEmit.mockClear()
      mockSocket.emit('game:join', roomId)
      if (eventHandlers['game:joined']) {
        eventHandlers['game:joined']({ roomId })
      }
    })

    expect(mockEmit).toHaveBeenCalledWith('game:join', roomId)
    unmount()
  })

  it('handles game moves', async () => {
    const moveData = { position: 0, symbol: 'X' }
    const { unmount } = render(<SocketProvider />)

    // Simulate making a move
    await act(async () => {
      mockEmit.mockClear()
      mockSocket.emit('move:made', moveData)
      if (eventHandlers['move:made']) {
        eventHandlers['move:made'](moveData)
      }
    })

    expect(mockEmit).toHaveBeenCalledWith('move:made', moveData)
    unmount()
  })

  it('handles player disconnection', async () => {
    const { unmount } = render(<SocketProvider />)
    
    // Mock window.alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {})

    // Simulate opponent disconnection
    await act(async () => {
      if (eventHandlers['playerLeft']) {
        eventHandlers['playerLeft']()
      }
    })

    expect(mockAlert).toHaveBeenCalledWith('Opponent left the game')
    mockAlert.mockRestore()
    unmount()
  })

  it('handles game reset', async () => {
    const resetData = {
      board: Array(9).fill(null),
      currentPlayer: 'X',
      players: ['player1', 'player2']
    }
    const { unmount } = render(<SocketProvider />)

    // Simulate game reset
    await act(async () => {
      mockEmit.mockClear()
      mockSocket.emit('game:reset', resetData)
      if (eventHandlers['gameReset']) {
        eventHandlers['gameReset'](resetData)
      }
    })

    expect(mockEmit).toHaveBeenCalledWith('game:reset', resetData)
    unmount()
  })

  it('cleans up socket connection on unmount', () => {
    const { unmount } = render(<SocketProvider />)
    unmount()
    expect(mockDisconnect).toHaveBeenCalled()
  })
}) 