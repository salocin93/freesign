import { AppError } from './errorHandling';

export class ValidationError extends AppError {
  constructor(message: string, field: string) {
    super(message, 'VALIDATION_ERROR', { field });
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized') {
    super(message, 'AUTHZ_ERROR');
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR');
  }
}

export class ApiError extends AppError {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message, 'API_ERROR', { statusCode, endpoint });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, operation: string) {
    super(message, 'DB_ERROR', { operation });
  }
}

export class FileError extends AppError {
  constructor(message: string, operation: string) {
    super(message, 'FILE_ERROR', { operation });
  }
}

export class SignatureError extends AppError {
  constructor(message: string, type: 'VALIDATION' | 'PROCESSING' | 'VERIFICATION') {
    super(message, 'SIGNATURE_ERROR', { type });
  }
}

export class DocumentError extends AppError {
  constructor(message: string, operation: string) {
    super(message, 'DOCUMENT_ERROR', { operation });
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR');
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, setting: string) {
    super(message, 'CONFIG_ERROR', { setting });
  }
} 