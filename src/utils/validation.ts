/**
 * Data Validation Utilities
 * 
 * Comprehensive data validation system using Zod for form validation,
 * data sanitization, and type safety across the FreeSign application.
 * 
 * Features:
 * - Form validation schemas
 * - Data sanitization
 * - Type-safe validation
 * - Real-time validation feedback
 * - Server-side validation support
 */

import { z } from 'zod';

/**
 * Common validation patterns
 */
const PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,}$/,
  URL: /^https?:\/\/.+/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  NAME: /^[a-zA-Z\s\-']{2,50}$/,
  FILE_NAME: /^[a-zA-Z0-9._-]{1,255}$/
} as const;

/**
 * Error messages
 */
const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  INVALID_NAME: 'Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes',
  INVALID_FILE_NAME: 'File name must be 1-255 characters and contain only letters, numbers, dots, hyphens, and underscores',
  FILE_TOO_LARGE: 'File size must be less than 10MB',
  INVALID_FILE_TYPE: 'File type not allowed',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  MIN_VALUE: (min: number) => `Must be at least ${min}`,
  MAX_VALUE: (max: number) => `Must be no more than ${max}`,
  INVALID_DATE: 'Please enter a valid date',
  FUTURE_DATE: 'Date must be in the future',
  PAST_DATE: 'Date must be in the past'
} as const;

/**
 * Base validation schemas
 */
export const baseSchemas = {
  email: z.string()
    .min(1, ERROR_MESSAGES.REQUIRED)
    .email(ERROR_MESSAGES.INVALID_EMAIL)
    .transform(val => val.toLowerCase().trim()),

  password: z.string()
    .min(1, ERROR_MESSAGES.REQUIRED)
    .min(8, ERROR_MESSAGES.MIN_LENGTH(8))
    .regex(PATTERNS.PASSWORD, ERROR_MESSAGES.INVALID_PASSWORD),

  name: z.string()
    .min(1, ERROR_MESSAGES.REQUIRED)
    .min(2, ERROR_MESSAGES.MIN_LENGTH(2))
    .max(50, ERROR_MESSAGES.MAX_LENGTH(50))
    .regex(PATTERNS.NAME, ERROR_MESSAGES.INVALID_NAME)
    .transform(val => val.trim()),

  phone: z.string()
    .min(1, ERROR_MESSAGES.REQUIRED)
    .regex(PATTERNS.PHONE, ERROR_MESSAGES.INVALID_PHONE)
    .transform(val => val.replace(/\s+/g, '')),

  url: z.string()
    .min(1, ERROR_MESSAGES.REQUIRED)
    .url(ERROR_MESSAGES.INVALID_URL),

  date: z.string()
    .min(1, ERROR_MESSAGES.REQUIRED)
    .refine((val) => !isNaN(Date.parse(val)), ERROR_MESSAGES.INVALID_DATE)
    .transform(val => new Date(val)),

  futureDate: z.string()
    .min(1, ERROR_MESSAGES.REQUIRED)
    .refine((val) => {
      const date = new Date(val);
      return date > new Date();
    }, ERROR_MESSAGES.FUTURE_DATE)
    .transform(val => new Date(val)),

  pastDate: z.string()
    .min(1, ERROR_MESSAGES.REQUIRED)
    .refine((val) => {
      const date = new Date(val);
      return date < new Date();
    }, ERROR_MESSAGES.PAST_DATE)
    .transform(val => new Date(val))
} as const;

/**
 * File validation schemas
 */
export const fileSchemas = {
  image: z.object({
    file: z.instanceof(File),
    size: z.number().max(10 * 1024 * 1024, ERROR_MESSAGES.FILE_TOO_LARGE),
    type: z.string().refine(
      (type) => ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'].includes(type),
      ERROR_MESSAGES.INVALID_FILE_TYPE
    )
  }),

  document: z.object({
    file: z.instanceof(File),
    size: z.number().max(50 * 1024 * 1024, 'File size must be less than 50MB'),
    type: z.string().refine(
      (type) => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(type),
      'Document type not allowed'
    )
  }),

  signature: z.object({
    file: z.instanceof(File),
    size: z.number().max(5 * 1024 * 1024, 'Signature file must be less than 5MB'),
    type: z.string().refine(
      (type) => ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'].includes(type),
      'Signature file type not allowed'
    )
  })
} as const;

/**
 * Form validation schemas
 */
export const formSchemas = {
  // User registration
  userRegistration: z.object({
    firstName: baseSchemas.name,
    lastName: baseSchemas.name,
    email: baseSchemas.email,
    password: baseSchemas.password,
    confirmPassword: z.string().min(1, ERROR_MESSAGES.REQUIRED),
    phone: baseSchemas.phone.optional(),
    agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions')
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }),

  // User login
  userLogin: z.object({
    email: baseSchemas.email,
    password: z.string().min(1, ERROR_MESSAGES.REQUIRED),
    rememberMe: z.boolean().optional()
  }),

  // Document upload
  documentUpload: z.object({
    title: z.string().min(1, ERROR_MESSAGES.REQUIRED).max(255, ERROR_MESSAGES.MAX_LENGTH(255)),
    description: z.string().max(1000, ERROR_MESSAGES.MAX_LENGTH(1000)).optional(),
    file: fileSchemas.document,
    tags: z.array(z.string().max(50)).optional(),
    isPublic: z.boolean().optional()
  }),

  // Signature creation
  signatureCreation: z.object({
    type: z.enum(['draw', 'type', 'upload']),
    data: z.union([
      z.string().min(1, 'Signature data is required'),
      fileSchemas.signature
    ]),
    name: z.string().max(100, ERROR_MESSAGES.MAX_LENGTH(100)).optional(),
    description: z.string().max(500, ERROR_MESSAGES.MAX_LENGTH(500)).optional()
  }),

  // Recipient addition
  recipientAddition: z.object({
    name: baseSchemas.name,
    email: baseSchemas.email,
    phone: baseSchemas.phone.optional(),
    role: z.enum(['signer', 'viewer', 'approver']).optional(),
    message: z.string().max(1000, ERROR_MESSAGES.MAX_LENGTH(1000)).optional()
  }),

  // Document signing
  documentSigning: z.object({
    documentId: z.string().min(1, ERROR_MESSAGES.REQUIRED),
    signatureData: z.string().min(1, 'Signature is required'),
    agreedToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
    timestamp: z.date().optional(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional()
  }),

  // Email sending
  emailSending: z.object({
    to: z.array(baseSchemas.email).min(1, 'At least one recipient is required'),
    subject: z.string().min(1, ERROR_MESSAGES.REQUIRED).max(200, ERROR_MESSAGES.MAX_LENGTH(200)),
    body: z.string().min(1, ERROR_MESSAGES.REQUIRED).max(10000, ERROR_MESSAGES.MAX_LENGTH(10000)),
    attachments: z.array(fileSchemas.document).optional(),
    cc: z.array(baseSchemas.email).optional(),
    bcc: z.array(baseSchemas.email).optional()
  }),

  // Settings update
  settingsUpdate: z.object({
    firstName: baseSchemas.name.optional(),
    lastName: baseSchemas.name.optional(),
    email: baseSchemas.email.optional(),
    phone: baseSchemas.phone.optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      push: z.boolean().optional()
    }).optional()
  })
} as const;

/**
 * Validation helpers
 */
export class ValidationHelpers {
  /**
   * Validate form data against schema
   */
  static async validateForm<T extends z.ZodType>(
    schema: T,
    data: unknown
  ): Promise<{ success: true; data: z.infer<T> } | { success: false; errors: Record<string, string[]> }> {
    try {
      const validatedData = await schema.parseAsync(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        return { success: false, errors };
      }
      return { success: false, errors: { _form: ['Validation failed'] } };
    }
  }

  /**
   * Validate single field
   */
  static validateField<T extends z.ZodType>(
    schema: T,
    value: unknown
  ): { success: true; data: z.infer<T> } | { success: false; error: string } {
    try {
      const validatedData = schema.parse(value);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0]?.message || 'Invalid value' };
      }
      return { success: false, error: 'Validation failed' };
    }
  }

  /**
   * Sanitize input data
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }

  /**
   * Sanitize object data recursively
   */
  static sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const sanitized = { ...obj };
    
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      }
    }
    
    return sanitized;
  }

  /**
   * Validate file upload
   */
  static validateFile(file: File, allowedTypes: string[], maxSize: number): { isValid: boolean; error?: string } {
    if (file.size > maxSize) {
      return { isValid: false, error: `File size must be less than ${maxSize / (1024 * 1024)}MB` };
    }

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
    }

    return { isValid: true };
  }

  /**
   * Generate validation error message
   */
  static getErrorMessage(field: string, error: string): string {
    return `${field}: ${error}`;
  }

  /**
   * Check if value is empty
   */
  static isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    return PATTERNS.EMAIL.test(email);
  }

  /**
   * Validate phone format
   */
  static isValidPhone(phone: string): boolean {
    return PATTERNS.PHONE.test(phone);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    return PATTERNS.URL.test(url);
  }
}

/**
 * Real-time validation hooks
 */
export function useFieldValidation<T extends z.ZodType>(
  schema: T,
  value: unknown,
  debounceMs: number = 300
) {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (ValidationHelpers.isEmpty(value)) {
        setError(null);
        setIsValid(null);
        return;
      }

      setIsValidating(true);
      const result = ValidationHelpers.validateField(schema, value);
      
      if (result.success) {
        setError(null);
        setIsValid(true);
      } else {
        setError(result.error);
        setIsValid(false);
      }
      
      setIsValidating(false);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [schema, value, debounceMs]);

  return { isValidating, error, isValid };
}

/**
 * Form validation hook
 */
export function useFormValidation<T extends z.ZodType>(
  schema: T,
  initialData: Partial<z.infer<T>> = {}
) {
  const [data, setData] = useState<Partial<z.infer<T>>>(initialData);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async () => {
    setIsValidating(true);
    const result = await ValidationHelpers.validateForm(schema, data);
    
    if (result.success) {
      setErrors({});
    } else {
      setErrors(result.errors);
    }
    
    setIsValidating(false);
    return result;
  }, [schema, data]);

  const updateField = useCallback((field: keyof z.infer<T>, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    data,
    errors,
    isValidating,
    validate,
    updateField,
    clearErrors,
    setData
  };
}

// Import React for hooks
import { useState, useEffect, useCallback } from 'react';
