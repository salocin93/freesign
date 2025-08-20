import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignatureVerificationUtil } from '../signatureVerification'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn()
  }
}))

// Mock crypto.subtle for testing environment
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn()
    }
  }
})

describe('SignatureVerificationUtil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createSignatureHash', () => {
    it('should create a consistent hash for the same input', async () => {
      const mockArrayBuffer = new ArrayBuffer(32)
      const mockUint8Array = new Uint8Array(mockArrayBuffer)
      // Fill with predictable values for testing
      for (let i = 0; i < mockUint8Array.length; i++) {
        mockUint8Array[i] = i
      }

      vi.mocked(crypto.subtle.digest).mockResolvedValue(mockArrayBuffer)

      const signatureData = 'base64signaturedata'
      const userId = 'user123'
      const timestamp = '2023-01-01T00:00:00Z'
      const documentId = 'doc456'

      const hash1 = await SignatureVerificationUtil.createSignatureHash(
        signatureData,
        userId,
        timestamp,
        documentId
      )

      const hash2 = await SignatureVerificationUtil.createSignatureHash(
        signatureData,
        userId,
        timestamp,
        documentId
      )

      expect(hash1).toBe(hash2)
      expect(hash1).toBe('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f')
    })

    it('should create different hashes for different inputs', async () => {
      const mockArrayBuffer1 = new ArrayBuffer(32)
      const mockUint8Array1 = new Uint8Array(mockArrayBuffer1)
      for (let i = 0; i < mockUint8Array1.length; i++) {
        mockUint8Array1[i] = i
      }

      const mockArrayBuffer2 = new ArrayBuffer(32)
      const mockUint8Array2 = new Uint8Array(mockArrayBuffer2)
      for (let i = 0; i < mockUint8Array2.length; i++) {
        mockUint8Array2[i] = i + 1
      }

      vi.mocked(crypto.subtle.digest)
        .mockResolvedValueOnce(mockArrayBuffer1)
        .mockResolvedValueOnce(mockArrayBuffer2)

      const baseData = {
        signatureData: 'base64signaturedata',
        userId: 'user123',
        timestamp: '2023-01-01T00:00:00Z',
        documentId: 'doc456'
      }

      const hash1 = await SignatureVerificationUtil.createSignatureHash(
        baseData.signatureData,
        baseData.userId,
        baseData.timestamp,
        baseData.documentId
      )

      const hash2 = await SignatureVerificationUtil.createSignatureHash(
        'differentSignatureData',
        baseData.userId,
        baseData.timestamp,
        baseData.documentId
      )

      expect(hash1).not.toBe(hash2)
    })

    it('should use TextEncoder to encode data correctly', async () => {
      const mockArrayBuffer = new ArrayBuffer(32)
      vi.mocked(crypto.subtle.digest).mockResolvedValue(mockArrayBuffer)

      const signatureData = 'signature'
      const userId = 'user1'
      const timestamp = '2023-01-01T00:00:00Z'
      const documentId = 'doc1'

      await SignatureVerificationUtil.createSignatureHash(
        signatureData,
        userId,
        timestamp,
        documentId
      )

      expect(crypto.subtle.digest).toHaveBeenCalledTimes(1)
      expect(crypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.anything())
    })
  })

  describe('verifySignatureHash', () => {
    it('should return true when hashes match', async () => {
      const mockArrayBuffer = new ArrayBuffer(32)
      const mockUint8Array = new Uint8Array(mockArrayBuffer)
      for (let i = 0; i < mockUint8Array.length; i++) {
        mockUint8Array[i] = i
      }

      vi.mocked(crypto.subtle.digest).mockResolvedValue(mockArrayBuffer)

      const signatureData = 'base64signaturedata'
      const userId = 'user123'
      const timestamp = '2023-01-01T00:00:00Z'
      const documentId = 'doc456'
      const expectedHash = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'

      const result = await SignatureVerificationUtil.verifySignatureHash(
        signatureData,
        userId,
        timestamp,
        documentId,
        expectedHash
      )

      expect(result).toBe(true)
    })

    it('should return false when hashes do not match', async () => {
      const mockArrayBuffer = new ArrayBuffer(32)
      const mockUint8Array = new Uint8Array(mockArrayBuffer)
      for (let i = 0; i < mockUint8Array.length; i++) {
        mockUint8Array[i] = i
      }

      vi.mocked(crypto.subtle.digest).mockResolvedValue(mockArrayBuffer)

      const signatureData = 'base64signaturedata'
      const userId = 'user123'
      const timestamp = '2023-01-01T00:00:00Z'
      const documentId = 'doc456'
      const expectedHash = 'differenthash'

      const result = await SignatureVerificationUtil.verifySignatureHash(
        signatureData,
        userId,
        timestamp,
        documentId,
        expectedHash
      )

      expect(result).toBe(false)
    })
  })

  describe('verifySignature', () => {
    it('should return true when signature is valid', async () => {
      const mockSignature = {
        id: 'sig123',
        value: 'signaturedata',
        user_id: 'user123',
        created_at: '2023-01-01T00:00:00Z',
        verification_hash: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
        users: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User'
        }
      }

      const { supabase } = await import('@/lib/supabase')
      vi.mocked(supabase.single).mockResolvedValue({ 
        data: mockSignature, 
        error: null 
      })

      const mockArrayBuffer = new ArrayBuffer(32)
      const mockUint8Array = new Uint8Array(mockArrayBuffer)
      for (let i = 0; i < mockUint8Array.length; i++) {
        mockUint8Array[i] = i
      }
      vi.mocked(crypto.subtle.digest).mockResolvedValue(mockArrayBuffer)

      const result = await SignatureVerificationUtil.verifySignature('sig123', 'doc456')

      expect(result).toBe(true)
    })

    it('should return false when signature is not found', async () => {
      const { supabase } = await import('@/lib/supabase')
      vi.mocked(supabase.single).mockResolvedValue({ 
        data: null, 
        error: { message: 'Not found' }
      })

      const result = await SignatureVerificationUtil.verifySignature('nonexistent', 'doc456')

      expect(result).toBe(false)
    })

    it('should return false when hash verification fails', async () => {
      const mockSignature = {
        id: 'sig123',
        value: 'signaturedata',
        user_id: 'user123',
        created_at: '2023-01-01T00:00:00Z',
        verification_hash: 'incorrecthash',
        users: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User'
        }
      }

      const { supabase } = await import('@/lib/supabase')
      vi.mocked(supabase.single).mockResolvedValue({ 
        data: mockSignature, 
        error: null 
      })

      const mockArrayBuffer = new ArrayBuffer(32)
      const mockUint8Array = new Uint8Array(mockArrayBuffer)
      for (let i = 0; i < mockUint8Array.length; i++) {
        mockUint8Array[i] = i
      }
      vi.mocked(crypto.subtle.digest).mockResolvedValue(mockArrayBuffer)

      const result = await SignatureVerificationUtil.verifySignature('sig123', 'doc456')

      expect(result).toBe(false)
    })
  })

  describe('getVerificationInfo', () => {
    it('should return verification info for valid signature', async () => {
      const mockSignature = {
        id: 'sig123',
        value: 'signaturedata',
        user_id: 'user123',
        created_at: '2023-01-01T00:00:00Z',
        verification_hash: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
        users: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User'
        }
      }

      const { supabase } = await import('@/lib/supabase')
      vi.mocked(supabase.single).mockResolvedValue({ 
        data: mockSignature, 
        error: null 
      })

      const mockArrayBuffer = new ArrayBuffer(32)
      const mockUint8Array = new Uint8Array(mockArrayBuffer)
      for (let i = 0; i < mockUint8Array.length; i++) {
        mockUint8Array[i] = i
      }
      vi.mocked(crypto.subtle.digest).mockResolvedValue(mockArrayBuffer)

      const result = await SignatureVerificationUtil.getVerificationInfo('sig123', 'doc456')

      expect(result).toEqual({
        isValid: true,
        timestamp: '2023-01-01T00:00:00Z',
        signedBy: {
          name: 'Test User',
          email: 'test@example.com',
          userId: 'user123'
        },
        documentId: 'doc456',
        verificationHash: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'
      })
    })

    it('should throw error when signature not found', async () => {
      const { supabase } = await import('@/lib/supabase')
      vi.mocked(supabase.single).mockResolvedValue({ 
        data: null, 
        error: { message: 'Not found' }
      })

      await expect(
        SignatureVerificationUtil.getVerificationInfo('nonexistent', 'doc456')
      ).rejects.toThrow('Signature not found')
    })
  })

  describe('hash format', () => {
    it('should produce hexadecimal hash of correct length', async () => {
      const mockArrayBuffer = new ArrayBuffer(32) // SHA-256 produces 32 bytes
      vi.mocked(crypto.subtle.digest).mockResolvedValue(mockArrayBuffer)

      const hash = await SignatureVerificationUtil.createSignatureHash(
        'data',
        'user',
        'timestamp',
        'doc'
      )

      expect(hash).toMatch(/^[a-f0-9]{64}$/) // 32 bytes = 64 hex characters
      expect(hash.length).toBe(64)
    })

    it('should pad single-digit hex values with zero', async () => {
      const mockArrayBuffer = new ArrayBuffer(4)
      const mockUint8Array = new Uint8Array(mockArrayBuffer)
      mockUint8Array[0] = 5    // Should become "05"
      mockUint8Array[1] = 255  // Should become "ff"
      mockUint8Array[2] = 0    // Should become "00"
      mockUint8Array[3] = 16   // Should become "10"

      vi.mocked(crypto.subtle.digest).mockResolvedValue(mockArrayBuffer)

      const hash = await SignatureVerificationUtil.createSignatureHash(
        'data',
        'user',
        'timestamp',
        'doc'
      )

      expect(hash).toBe('05ff0010')
    })
  })

  describe('data combination', () => {
    it('should combine data fields in the correct order', async () => {
      const mockArrayBuffer = new ArrayBuffer(32)
      vi.mocked(crypto.subtle.digest).mockResolvedValue(mockArrayBuffer)

      const signatureData = 'signature'
      const userId = 'user123'
      const timestamp = '2023-01-01T00:00:00Z'
      const documentId = 'doc456'

      await SignatureVerificationUtil.createSignatureHash(
        signatureData,
        userId,
        timestamp,
        documentId
      )

      // Verify that crypto.subtle.digest was called with encoded data
      expect(crypto.subtle.digest).toHaveBeenCalledTimes(1)
      expect(crypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.anything())
      
      // The TextEncoder should have encoded the combined string
      const call = vi.mocked(crypto.subtle.digest).mock.calls[0]
      const encodedData = call[1] as Uint8Array
      const decodedString = new TextDecoder().decode(encodedData)
      
      expect(decodedString).toBe('signature|user123|2023-01-01T00:00:00Z|doc456')
    })
  })
})