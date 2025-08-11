/**
 * Security Utilities
 * 
 * Security utilities for the FreeSign application to address various
 * security vulnerabilities and implement best practices.
 * 
 * Features:
 * - Rate limiting for API calls
 * - CSRF protection
 * - Input sanitization and validation
 * - Token security with rotation
 * - XSS prevention
 * - Secure file upload validation
 */

import { createHash, randomBytes } from 'crypto';

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// CSRF token storage
let csrfToken: string | null = null;

/**
 * Rate Limiting Configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string; // Custom key generator
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyGenerator: (identifier: string) => `rate_limit:${identifier}`
};

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_RATE_LIMIT, ...config };
  }

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const key = this.config.keyGenerator!(identifier);
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return true;
    }

    if (record.count >= this.config.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string): number {
    const key = this.config.keyGenerator!(identifier);
    const record = rateLimitStore.get(key);
    
    if (!record) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - record.count);
  }

  /**
   * Get reset time for an identifier
   */
  getResetTime(identifier: string): number {
    const key = this.config.keyGenerator!(identifier);
    const record = rateLimitStore.get(key);
    
    return record?.resetTime || Date.now() + this.config.windowMs;
  }

  /**
   * Clear rate limit for an identifier
   */
  clear(identifier: string): void {
    const key = this.config.keyGenerator!(identifier);
    rateLimitStore.delete(key);
  }
}

// Create default rate limiter instances
export const signatureRateLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10 // 10 signature attempts per 5 minutes
});

export const uploadRateLimiter = new RateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 20 // 20 uploads per 10 minutes
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 API calls per 15 minutes
});

/**
 * CSRF Protection
 */
export class CSRFProtection {
  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    const token = randomBytes(32).toString('hex');
    csrfToken = token;
    return token;
  }

  /**
   * Get current CSRF token
   */
  static getToken(): string | null {
    return csrfToken;
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string): boolean {
    return csrfToken === token;
  }

  /**
   * Clear CSRF token
   */
  static clearToken(): void {
    csrfToken = null;
  }

  /**
   * Add CSRF token to headers
   */
  static addTokenToHeaders(headers: Headers): void {
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }
}

/**
 * Input Sanitization
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize email address
   */
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Sanitize file name
   */
  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  /**
   * Sanitize URL
   */
  static sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.toString();
    } catch {
      return '';
    }
  }

  /**
   * Remove potentially dangerous characters from text
   */
  static sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }
}

/**
 * File Upload Security
 */
export class FileUploadSecurity {
  private static readonly ALLOWED_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.gif', '.svg'
  ];

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  private static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml'
  ];

  /**
   * Validate file upload
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: `File type not allowed. Allowed types: ${this.ALLOWED_EXTENSIONS.join(', ')}`
      };
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'File MIME type not allowed'
      };
    }

    return { isValid: true };
  }

  /**
   * Generate secure file name
   */
  static generateSecureFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = randomBytes(8).toString('hex');
    const extension = '.' + originalName.split('.').pop()?.toLowerCase();
    return `${timestamp}_${random}${extension}`;
  }

  /**
   * Calculate file hash for integrity
   */
  static async calculateFileHash(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const hash = createHash('sha256').update(new Uint8Array(arrayBuffer)).digest('hex');
        resolve(hash);
      };
      reader.readAsArrayBuffer(file);
    });
  }
}

/**
 * Token Security
 */
export class TokenSecurity {
  private static readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private static tokenStore = new Map<string, { token: string; expires: number }>();

  /**
   * Generate secure token
   */
  static generateToken(identifier: string): string {
    const token = randomBytes(32).toString('hex');
    const expires = Date.now() + this.TOKEN_EXPIRY;
    
    this.tokenStore.set(identifier, { token, expires });
    
    // Clean up expired tokens
    this.cleanupExpiredTokens();
    
    return token;
  }

  /**
   * Validate token
   */
  static validateToken(identifier: string, token: string): boolean {
    const record = this.tokenStore.get(identifier);
    
    if (!record) {
      return false;
    }

    if (Date.now() > record.expires) {
      this.tokenStore.delete(identifier);
      return false;
    }

    return record.token === token;
  }

  /**
   * Rotate token
   */
  static rotateToken(identifier: string): string {
    return this.generateToken(identifier);
  }

  /**
   * Clean up expired tokens
   */
  private static cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [identifier, record] of this.tokenStore.entries()) {
      if (now > record.expires) {
        this.tokenStore.delete(identifier);
      }
    }
  }
}

/**
 * Request Security
 */
export class RequestSecurity {
  /**
   * Add security headers to request
   */
  static addSecurityHeaders(headers: Headers): void {
    // Add CSRF token
    CSRFProtection.addTokenToHeaders(headers);
    
    // Add content security policy
    headers.set('Content-Security-Policy', 
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:;"
    );
    
    // Add XSS protection
    headers.set('X-XSS-Protection', '1; mode=block');
    
    // Add content type options
    headers.set('X-Content-Type-Options', 'nosniff');
    
    // Add frame options
    headers.set('X-Frame-Options', 'DENY');
  }

  /**
   * Validate request origin
   */
  static validateOrigin(origin: string): boolean {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://freesign.app',
      'https://www.freesign.app'
    ];
    
    return allowedOrigins.includes(origin);
  }

  /**
   * Sanitize request body
   */
  static sanitizeRequestBody(body: any): any {
    if (typeof body === 'string') {
      return InputSanitizer.sanitizeText(body);
    }
    
    if (typeof body === 'object' && body !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(body)) {
        if (typeof value === 'string') {
          sanitized[key] = InputSanitizer.sanitizeText(value);
        } else if (typeof value === 'object') {
          sanitized[key] = this.sanitizeRequestBody(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }
    
    return body;
  }
}

/**
 * Security Hooks
 */
export function useRateLimit(identifier: string, limiter: RateLimiter = apiRateLimiter) {
  const isAllowed = limiter.isAllowed(identifier);
  const remaining = limiter.getRemaining(identifier);
  const resetTime = limiter.getResetTime(identifier);

  return {
    isAllowed,
    remaining,
    resetTime,
    clear: () => limiter.clear(identifier)
  };
}

export function useCSRF() {
  const token = CSRFProtection.getToken();
  
  const generateToken = () => CSRFProtection.generateToken();
  const validateToken = (tokenToValidate: string) => CSRFProtection.validateToken(tokenToValidate);
  const clearToken = () => CSRFProtection.clearToken();

  return {
    token,
    generateToken,
    validateToken,
    clearToken
  };
}
