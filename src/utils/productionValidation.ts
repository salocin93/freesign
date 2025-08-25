/**
 * Production Environment Validation
 * 
 * Comprehensive validation and health checks for production deployments.
 * Ensures all critical systems are properly configured and operational
 * before the application starts serving users.
 */

import { env, EnvChecks } from './env';
import { supabase } from '@/lib/supabase';
import { trackError } from './errorTracking';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    environment: boolean;
    database: boolean;
    authentication: boolean;
    storage: boolean;
    errorTracking: boolean;
    performance: boolean;
  };
}

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

/**
 * Validates all production environment requirements
 */
export async function validateProductionEnvironment(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    checks: {
      environment: false,
      database: false,
      authentication: false,
      storage: false,
      errorTracking: false,
      performance: false,
    },
  };

  // Environment Configuration Check
  try {
    validateEnvironmentConfiguration(result);
  } catch (error) {
    result.errors.push(`Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.isValid = false;
  }

  // Database Connectivity Check
  try {
    result.checks.database = await validateDatabaseConnection();
  } catch (error) {
    result.errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.isValid = false;
  }

  // Authentication Service Check
  try {
    result.checks.authentication = await validateAuthenticationService();
  } catch (error) {
    result.errors.push(`Authentication service failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.isValid = false;
  }

  // Storage Service Check
  try {
    result.checks.storage = await validateStorageService();
  } catch (error) {
    result.warnings.push(`Storage service check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Error Tracking Check
  try {
    result.checks.errorTracking = validateErrorTracking();
  } catch (error) {
    result.warnings.push(`Error tracking validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Performance Monitoring Check
  try {
    result.checks.performance = validatePerformanceMonitoring();
  } catch (error) {
    result.warnings.push(`Performance monitoring validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Validates environment configuration
 */
function validateEnvironmentConfiguration(result: ValidationResult): void {
  // Critical environment variables
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    result.errors.push('Missing required Supabase configuration');
    return;
  }

  // URL validation
  try {
    new URL(env.supabaseUrl);
  } catch {
    result.errors.push('Invalid Supabase URL format');
    return;
  }

  // Production-specific checks
  if (env.isProduction) {
    if (env.useMockAuth) {
      result.errors.push('Mock authentication is enabled in production');
      return;
    }

    if (env.enableAnalyticsPanel) {
      result.warnings.push('Analytics panel is enabled in production');
    }

    // SSL/HTTPS check
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
      result.errors.push('HTTPS is required in production');
      return;
    }
  }

  result.checks.environment = true;
}

/**
 * Validates database connection
 */
async function validateDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('count', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Database validation failed:', error);
    throw error;
  }
}

/**
 * Validates authentication service
 */
async function validateAuthenticationService(): Promise<boolean> {
  try {
    const { data: session, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new Error(`Auth service error: ${error.message}`);
    }

    // Test auth configuration
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError && userError.message !== 'Invalid JWT' && userError.message !== 'JWT expired') {
      throw new Error(`Auth configuration error: ${userError.message}`);
    }

    return true;
  } catch (error) {
    console.error('Authentication validation failed:', error);
    throw error;
  }
}

/**
 * Validates storage service
 */
async function validateStorageService(): Promise<boolean> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw new Error(`Storage service error: ${error.message}`);
    }

    // Check if documents bucket exists
    const documentsBucket = buckets?.find(bucket => bucket.name === 'documents');
    if (!documentsBucket) {
      throw new Error('Documents storage bucket not found');
    }

    return true;
  } catch (error) {
    console.error('Storage validation failed:', error);
    throw error;
  }
}

/**
 * Validates error tracking configuration
 */
function validateErrorTracking(): boolean {
  try {
    // Test error tracking
    const testError = new Error('Production validation test error');
    trackError(testError, 'ProductionValidation', {
      test: true,
      timestamp: new Date().toISOString(),
    });

    return EnvChecks.hasErrorTracking();
  } catch (error) {
    console.error('Error tracking validation failed:', error);
    return false;
  }
}

/**
 * Validates performance monitoring
 */
function validatePerformanceMonitoring(): boolean {
  try {
    // Check if Performance API is available
    if (typeof window !== 'undefined' && !window.performance) {
      throw new Error('Performance API not available');
    }

    // Check Web Vitals support
    const vitalsSupported = typeof window !== 'undefined' && 
                           'PerformanceObserver' in window &&
                           'performance' in window &&
                           'measure' in window.performance;

    if (!vitalsSupported) {
      throw new Error('Web Vitals monitoring not supported');
    }

    return env.enablePerformanceMonitoring;
  } catch (error) {
    console.error('Performance monitoring validation failed:', error);
    return false;
  }
}

/**
 * Performs comprehensive health checks
 */
export async function performHealthChecks(): Promise<HealthCheckResult[]> {
  const checks: Array<() => Promise<HealthCheckResult>> = [
    () => healthCheckDatabase(),
    () => healthCheckAuthentication(),
    () => healthCheckStorage(),
  ];

  const results = await Promise.allSettled(
    checks.map(check => check())
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        service: ['Database', 'Authentication', 'Storage'][index],
        status: 'unhealthy' as const,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      };
    }
  });
}

async function healthCheckDatabase(): Promise<HealthCheckResult> {
  const startTime = performance.now();
  
  try {
    const { error } = await supabase
      .from('documents')
      .select('id')
      .limit(1)
      .single();

    const responseTime = performance.now() - startTime;

    // Allow "PGRST116" error (no rows returned) as this just means empty table
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return {
      service: 'Database',
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime: Math.round(responseTime),
    };
  } catch (error) {
    return {
      service: 'Database',
      status: 'unhealthy',
      responseTime: Math.round(performance.now() - startTime),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function healthCheckAuthentication(): Promise<HealthCheckResult> {
  const startTime = performance.now();
  
  try {
    const { error } = await supabase.auth.getSession();
    const responseTime = performance.now() - startTime;

    if (error) {
      throw error;
    }

    return {
      service: 'Authentication',
      status: responseTime > 500 ? 'degraded' : 'healthy',
      responseTime: Math.round(responseTime),
    };
  } catch (error) {
    return {
      service: 'Authentication',
      status: 'unhealthy',
      responseTime: Math.round(performance.now() - startTime),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function healthCheckStorage(): Promise<HealthCheckResult> {
  const startTime = performance.now();
  
  try {
    const { error } = await supabase.storage.listBuckets();
    const responseTime = performance.now() - startTime;

    if (error) {
      throw error;
    }

    return {
      service: 'Storage',
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime: Math.round(responseTime),
    };
  } catch (error) {
    return {
      service: 'Storage',
      status: 'unhealthy',
      responseTime: Math.round(performance.now() - startTime),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Formats validation results for display
 */
export function formatValidationResults(results: ValidationResult): string {
  const lines: string[] = [
    '🔍 Production Environment Validation',
    '=====================================',
    '',
  ];

  // Overall status
  lines.push(`Overall Status: ${results.isValid ? '✅ VALID' : '❌ INVALID'}`);
  lines.push('');

  // Checks
  lines.push('System Checks:');
  Object.entries(results.checks).forEach(([key, status]) => {
    const icon = status ? '✅' : '❌';
    const name = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    lines.push(`  ${icon} ${name}`);
  });
  lines.push('');

  // Errors
  if (results.errors.length > 0) {
    lines.push('❌ Errors:');
    results.errors.forEach(error => {
      lines.push(`  • ${error}`);
    });
    lines.push('');
  }

  // Warnings
  if (results.warnings.length > 0) {
    lines.push('⚠️  Warnings:');
    results.warnings.forEach(warning => {
      lines.push(`  • ${warning}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

export default {
  validateProductionEnvironment,
  performHealthChecks,
  formatValidationResults,
};