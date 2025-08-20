import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import {
  baseSchemas,
  formSchemas,
  fileSchemas,
  ValidationHelpers
} from '../validation'

describe('ValidationHelpers', () => {
  describe('validateForm', () => {
    it('should validate correct form data', async () => {
      const schema = z.object({
        name: z.string().min(2),
        email: z.string().email()
      })
      
      const data = {
        name: 'John Doe',
        email: 'john@example.com'
      }

      const result = await ValidationHelpers.validateForm(schema, data)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(data)
      }
    })

    it('should return errors for invalid form data', async () => {
      const schema = z.object({
        name: z.string().min(2),
        email: z.string().email()
      })
      
      const data = {
        name: 'J',
        email: 'invalid-email'
      }

      const result = await ValidationHelpers.validateForm(schema, data)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.name).toBeDefined()
        expect(result.errors.email).toBeDefined()
      }
    })
  })

  describe('validateField', () => {
    it('should validate correct field value', () => {
      const schema = z.string().email()
      const value = 'test@example.com'

      const result = ValidationHelpers.validateField(schema, value)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(value)
      }
    })

    it('should return error for invalid field value', () => {
      const schema = z.string().email()
      const value = 'invalid-email'

      const result = ValidationHelpers.validateField(schema, value)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Invalid email')
      }
    })
  })

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>Hello World!'
      const sanitized = ValidationHelpers.sanitizeInput(input)
      
      expect(sanitized).toBe('scriptalert("xss")/scriptHello World!')
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('</script>')
    })

    it('should remove javascript protocols', () => {
      const input = 'javascript:alert("xss")'
      const sanitized = ValidationHelpers.sanitizeInput(input)
      
      expect(sanitized).not.toContain('javascript:')
    })

    it('should remove event handlers', () => {
      const input = 'onload="alert(1)" onclick="alert(2)"'
      const sanitized = ValidationHelpers.sanitizeInput(input)
      
      expect(sanitized).not.toContain('onload=')
      expect(sanitized).not.toContain('onclick=')
    })
  })

  describe('sanitizeObject', () => {
    it('should sanitize string properties recursively', () => {
      const obj = {
        name: '<script>alert("xss")</script>John',
        details: {
          bio: 'javascript:alert("xss")',
          contact: {
            email: 'onclick="alert(1)"test@example.com'
          }
        }
      }

      const sanitized = ValidationHelpers.sanitizeObject(obj)
      
      expect(sanitized.name).not.toContain('<script>')
      expect(sanitized.details.bio).not.toContain('javascript:')
      expect(sanitized.details.contact.email).not.toContain('onclick=')
    })
  })

  describe('validateFile', () => {
    it('should validate file within size and type limits', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB

      const result = ValidationHelpers.validateFile(
        file,
        ['application/pdf'],
        10 * 1024 * 1024 // 10MB limit
      )

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject file exceeding size limit', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 }) // 15MB

      const result = ValidationHelpers.validateFile(
        file,
        ['application/pdf'],
        10 * 1024 * 1024 // 10MB limit
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('File size must be less than')
    })

    it('should reject file with invalid type', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const result = ValidationHelpers.validateFile(
        file,
        ['application/pdf'],
        10 * 1024 * 1024
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('File type not allowed')
    })
  })

  describe('isEmpty', () => {
    it('should return true for empty values', () => {
      expect(ValidationHelpers.isEmpty(null)).toBe(true)
      expect(ValidationHelpers.isEmpty(undefined)).toBe(true)
      expect(ValidationHelpers.isEmpty('')).toBe(true)
      expect(ValidationHelpers.isEmpty('   ')).toBe(true)
      expect(ValidationHelpers.isEmpty([])).toBe(true)
      expect(ValidationHelpers.isEmpty({})).toBe(true)
    })

    it('should return false for non-empty values', () => {
      expect(ValidationHelpers.isEmpty('hello')).toBe(false)
      expect(ValidationHelpers.isEmpty(['item'])).toBe(false)
      expect(ValidationHelpers.isEmpty({ key: 'value' })).toBe(false)
      expect(ValidationHelpers.isEmpty(0)).toBe(false)
      expect(ValidationHelpers.isEmpty(false)).toBe(false)
    })
  })

  describe('email validation', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'firstname.lastname@subdomain.example.com'
      ]

      validEmails.forEach(email => {
        expect(ValidationHelpers.isValidEmail(email)).toBe(true)
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com'
      ]

      invalidEmails.forEach(email => {
        expect(ValidationHelpers.isValidEmail(email)).toBe(false)
      })
    })
  })

  describe('phone validation', () => {
    it('should validate correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '(123) 456-7890',
        '123-456-7890',
        '+1 (123) 456-7890'
      ]

      validPhones.forEach(phone => {
        expect(ValidationHelpers.isValidPhone(phone)).toBe(true)
      })
    })

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        'abc123',
        '12345'
      ]

      invalidPhones.forEach(phone => {
        expect(ValidationHelpers.isValidPhone(phone)).toBe(false)
      })
    })
  })
})

describe('Base Schemas', () => {
  describe('email schema', () => {
    it('should validate and transform valid email', () => {
      const email = 'TEST@EXAMPLE.COM '
      const result = baseSchemas.email.parse(email)
      
      expect(result).toBe('test@example.com')
    })

    it('should reject invalid email', () => {
      expect(() => baseSchemas.email.parse('invalid-email')).toThrow()
    })
  })

  describe('password schema', () => {
    it('should validate strong password', () => {
      const password = 'StrongPass123!'
      
      expect(() => baseSchemas.password.parse(password)).not.toThrow()
    })

    it('should reject weak password', () => {
      expect(() => baseSchemas.password.parse('weak')).toThrow()
      expect(() => baseSchemas.password.parse('noNumber!')).toThrow()
      expect(() => baseSchemas.password.parse('NoSpecial123')).toThrow()
    })
  })

  describe('name schema', () => {
    it('should validate and transform valid name', () => {
      const name = '  John Doe  '
      const result = baseSchemas.name.parse(name)
      
      expect(result).toBe('John Doe')
    })

    it('should reject invalid name', () => {
      expect(() => baseSchemas.name.parse('J')).toThrow()
      expect(() => baseSchemas.name.parse('John123')).toThrow()
      expect(() => baseSchemas.name.parse('A'.repeat(60))).toThrow()
    })
  })
})

describe('Form Schemas', () => {
  describe('userRegistration', () => {
    it('should validate complete registration data', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        agreeToTerms: true
      }

      expect(() => formSchemas.userRegistration.parse(data)).not.toThrow()
    })

    it('should reject mismatched passwords', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'DifferentPass123!',
        agreeToTerms: true
      }

      expect(() => formSchemas.userRegistration.parse(data)).toThrow()
    })

    it('should reject when terms not agreed', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        agreeToTerms: false
      }

      expect(() => formSchemas.userRegistration.parse(data)).toThrow()
    })
  })

  describe('documentUpload', () => {
    it('should validate document upload data', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })

      const data = {
        title: 'Test Document',
        description: 'A test document',
        file: {
          file,
          size: file.size,
          type: file.type
        }
      }

      expect(() => formSchemas.documentUpload.parse(data)).not.toThrow()
    })
  })

  describe('recipientAddition', () => {
    it('should validate recipient data', () => {
      const data = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'signer' as const
      }

      expect(() => formSchemas.recipientAddition.parse(data)).not.toThrow()
    })
  })
})

describe('File Schemas', () => {
  describe('image schema', () => {
    it('should validate image file', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })

      const data = {
        file,
        size: file.size,
        type: file.type
      }

      expect(() => fileSchemas.image.parse(data)).not.toThrow()
    })

    it('should reject oversized image', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 })

      const data = {
        file,
        size: file.size,
        type: file.type
      }

      expect(() => fileSchemas.image.parse(data)).toThrow()
    })
  })

  describe('document schema', () => {
    it('should validate PDF document', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 })

      const data = {
        file,
        size: file.size,
        type: file.type
      }

      expect(() => fileSchemas.document.parse(data)).not.toThrow()
    })
  })
})