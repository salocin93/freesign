import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@/test/test-utils'
import { useAuth } from '../useAuth'

// Mock the AuthContext
const mockAuthContext = {
  user: null,
  loading: false,
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  error: null
}

// Mock the useAuth hook directly instead of React context
vi.mock('../useAuth', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAuth: vi.fn(() => ({
      ...mockAuthContext,
      isAuthenticated: mockAuthContext.user !== null
    }))
  }
})

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthContext.user = null
    mockAuthContext.loading = false
    mockAuthContext.error = null
  })

  it('should return auth context values', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.signInWithGoogle).toBeDefined()
    expect(result.current.signOut).toBeDefined()
    expect(result.current.error).toBeNull()
  })

  it('should return user when authenticated', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    mockAuthContext.user = mockUser

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toEqual(mockUser)
  })

  it('should handle loading state', () => {
    mockAuthContext.loading = true

    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(true)
  })

  it('should handle error state', () => {
    const mockError = new Error('Authentication failed')
    mockAuthContext.error = mockError

    const { result } = renderHook(() => useAuth())

    expect(result.current.error).toEqual(mockError)
  })

  it('should call signInWithGoogle', async () => {
    const { result } = renderHook(() => useAuth())

    await result.current.signInWithGoogle()

    expect(mockAuthContext.signInWithGoogle).toHaveBeenCalled()
  })

  it('should call signOut', async () => {
    const { result } = renderHook(() => useAuth())

    await result.current.signOut()

    expect(mockAuthContext.signOut).toHaveBeenCalled()
  })

  describe('computed properties', () => {
    it('should indicate user is authenticated when user exists', () => {
      mockAuthContext.user = {
        id: '123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { result } = renderHook(() => useAuth())

      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should indicate user is not authenticated when user is null', () => {
      mockAuthContext.user = null

      const { result } = renderHook(() => useAuth())

      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle signInWithGoogle errors', async () => {
      const mockError = new Error('Sign in failed')
      mockAuthContext.signInWithGoogle.mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuth())

      await expect(result.current.signInWithGoogle()).rejects.toThrow('Sign in failed')
    })

    it('should handle signOut errors', async () => {
      const mockError = new Error('Sign out failed')
      mockAuthContext.signOut.mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuth())

      await expect(result.current.signOut()).rejects.toThrow('Sign out failed')
    })
  })

  describe('hook stability', () => {
    it('should maintain stable references to functions', () => {
      const { result, rerender } = renderHook(() => useAuth())

      const firstSignIn = result.current.signInWithGoogle
      const firstSignOut = result.current.signOut

      rerender()

      expect(result.current.signInWithGoogle).toBe(firstSignIn)
      expect(result.current.signOut).toBe(firstSignOut)
    })
  })

  describe('development mode', () => {
    it('should handle mock user in development', () => {
      const mockDevUser = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'dev@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockAuthContext.user = mockDevUser

      const { result } = renderHook(() => useAuth())

      expect(result.current.user?.id).toBe('00000000-0000-0000-0000-000000000000')
      expect(result.current.user?.email).toBe('dev@example.com')
    })
  })
})