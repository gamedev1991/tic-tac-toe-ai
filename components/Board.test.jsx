import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Board from './Board'
import { GameContext } from '../context/GameContext'

describe('Board Component', () => {
  const mockOnClick = jest.fn()
  const defaultProps = {
    squares: Array(9).fill(null),
    onSquareClick: mockOnClick,
    winningLine: [],
  }

  const renderBoard = (props = {}) => {
    const mergedProps = { ...defaultProps, ...props }
    return render(<Board {...mergedProps} />)
  }

  beforeEach(() => {
    mockOnClick.mockClear()
  })

  it('renders a 3x3 grid', () => {
    renderBoard()
    const squares = screen.getAllByRole('button')
    expect(squares).toHaveLength(9)
  })

  it('displays X and O correctly', () => {
    const squares = ['X', 'O', null, 'X', null, 'O', null, null, null]
    renderBoard({ squares })
    
    squares.forEach((value, index) => {
      if (value) {
        expect(screen.getByTestId(`square-${index}`)).toHaveTextContent(value)
      }
    })
  })

  it('calls onSquareClick with square index when clicked', async () => {
    renderBoard()
    const squares = screen.getAllByRole('button')
    await userEvent.click(squares[0])
    expect(mockOnClick).toHaveBeenCalledWith(0)
  })

  it('highlights winning squares', () => {
    const winningLine = [0, 1, 2]
    renderBoard({ winningLine })
    
    winningLine.forEach(index => {
      expect(screen.getByTestId(`square-${index}`)).toHaveClass('winning')
    })
  })

  it('disables squares when there is a winner', () => {
    const winningLine = [0, 1, 2]
    renderBoard({ winningLine })
    
    const squares = screen.getAllByRole('button')
    userEvent.click(squares[3])
    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('renders squares', () => {
    const board = Array(9).fill(null)
    render(<Board squares={board} onSquareClick={() => {}} />)
    const squares = screen.getAllByRole('button')
    expect(squares).toHaveLength(9)
  })

  it('handles clicks', async () => {
    const board = Array(9).fill(null)
    const handleClick = jest.fn()
    render(<Board squares={board} onSquareClick={handleClick} />)
    
    const square = screen.getAllByRole('button')[0]
    await userEvent.click(square)
    expect(handleClick).toHaveBeenCalledWith(0)
  })

  it('displays X and O', () => {
    const board = ['X', 'O', null, null, null, null, null, null, null]
    render(<Board squares={board} onSquareClick={() => {}} />)
    
    const squares = screen.getAllByRole('button')
    expect(squares[0]).toHaveTextContent('X')
    expect(squares[1]).toHaveTextContent('O')
  })

  it('disables squares when game is over', () => {
    const board = ['X', 'X', 'X', 'O', 'O', null, null, null, null]
    render(<Board squares={board} onSquareClick={() => {}} disabled={true} />)
    
    const squares = screen.getAllByRole('button')
    squares.forEach(square => {
      expect(square).toBeDisabled()
    })
  })

  it('handles missing onSquareClick prop gracefully', async () => {
    render(<Board squares={Array(9).fill(null)} />)
    const square = screen.getAllByRole('button')[0]
    await userEvent.click(square)
    // Test passes if no error is thrown
  })
}) 