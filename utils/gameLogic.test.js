import { calculateWinner, isBoardFull, getAIMove } from './gameLogic'

describe('Game Logic', () => {
  describe('calculateWinner', () => {
    it('detects horizontal wins', () => {
      const board = ['X', 'X', 'X', 'O', 'O', null, null, null, null]
      const result = calculateWinner(board)
      expect(result).toEqual({ winner: 'X', line: [0, 1, 2] })
    })

    it('detects vertical wins', () => {
      const board = ['X', 'O', null, 'X', 'O', null, 'X', null, null]
      const result = calculateWinner(board)
      expect(result).toEqual({ winner: 'X', line: [0, 3, 6] })
    })

    it('detects diagonal wins', () => {
      const board = ['X', 'O', null, null, 'X', 'O', null, null, 'X']
      const result = calculateWinner(board)
      expect(result).toEqual({ winner: 'X', line: [0, 4, 8] })
    })

    it('returns null when no winner', () => {
      const board = ['X', 'O', null, null, null, null, null, null, null]
      const result = calculateWinner(board)
      expect(result).toBeNull()
    })
  })

  describe('isBoardFull', () => {
    it('returns true when board is full', () => {
      const board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'X']
      expect(isBoardFull(board)).toBe(true)
    })

    it('returns false when board has empty squares', () => {
      const board = ['X', 'O', null, 'O', 'X', 'O', null, 'X', 'X']
      expect(isBoardFull(board)).toBe(false)
    })
  })

  describe('getAIMove', () => {
    it('blocks opponent winning move', () => {
      const board = ['X', 'X', null, 'O', 'O', null, null, null, null]
      const aiMove = getAIMove(board, 'O', 'hard')
      expect(aiMove).toBe(2) // Block X's winning move
    })

    it('takes winning move when available', () => {
      const board = ['O', 'O', null, 'X', 'X', null, null, null, null]
      const aiMove = getAIMove(board, 'O', 'hard')
      expect(aiMove).toBe(2) // Complete O's winning line
    })

    it('returns a valid move for empty board', () => {
      const board = Array(9).fill(null)
      const aiMove = getAIMove(board, 'O', 'hard')
      expect(aiMove).toBeGreaterThanOrEqual(0)
      expect(aiMove).toBeLessThan(9)
    })

    it('returns -1 for full board', () => {
      const board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'X']
      const aiMove = getAIMove(board, 'O', 'hard')
      expect(aiMove).toBe(-1)
    })
  })
}) 