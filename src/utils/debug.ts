/*
MIT License
Copyright (c) 2025 Nicolas Freiherr von Rosen
*/

/**
 * Debug Utility
 *
 * Provides environment-aware logging that automatically disables
 * in production builds while maintaining error logging.
 *
 * Usage:
 *   import { debug } from '@/utils/debug';
 *
 *   debug.log('Development only message');
 *   debug.warn('Development warning');
 *   debug.error('Error - logs in all environments');
 *   debug.info('Info message');
 *
 *   debug.group('Group Label');
 *   debug.log('Grouped message');
 *   debug.groupEnd();
 *
 *   debug.time('operation');
 *   // ... some operation
 *   debug.timeEnd('operation');
 */

interface DebugLogger {
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  info(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  group(label: string): void;
  groupEnd(): void;
  time(label: string): void;
  timeEnd(label: string): void;
  table(data: unknown): void;
  trace(...args: unknown[]): void;
}

/**
 * Production Logger
 * Silences all logs except errors to reduce noise in production
 */
class ProductionLogger implements DebugLogger {
  log() {
    // No-op in production
  }

  warn() {
    // No-op in production
  }

  info() {
    // No-op in production
  }

  debug() {
    // No-op in production
  }

  group() {
    // No-op in production
  }

  groupEnd() {
    // No-op in production
  }

  time() {
    // No-op in production
  }

  timeEnd() {
    // No-op in production
  }

  table() {
    // No-op in production
  }

  trace() {
    // No-op in production
  }

  // Only errors are logged in production
  error(...args: unknown[]): void {
    console.error(...args);
  }
}

/**
 * Development Logger
 * Full console API with all methods enabled
 */
class DevelopmentLogger implements DebugLogger {
  log(...args: unknown[]): void {
    console.log(...args);
  }

  warn(...args: unknown[]): void {
    console.warn(...args);
  }

  error(...args: unknown[]): void {
    console.error(...args);
  }

  info(...args: unknown[]): void {
    console.info(...args);
  }

  debug(...args: unknown[]): void {
    console.debug(...args);
  }

  group(label: string): void {
    console.group(label);
  }

  groupEnd(): void {
    console.groupEnd();
  }

  time(label: string): void {
    console.time(label);
  }

  timeEnd(label: string): void {
    console.timeEnd(label);
  }

  table(data: unknown): void {
    console.table(data);
  }

  trace(...args: unknown[]): void {
    console.trace(...args);
  }
}

/**
 * Export the appropriate logger based on environment
 *
 * In development (Vite dev server), uses full console API
 * In production builds, silences all logs except errors
 */
export const debug: DebugLogger = import.meta.env.DEV
  ? new DevelopmentLogger()
  : new ProductionLogger();

/**
 * Convenience exports for common operations
 *
 * Usage:
 *   import { log, warn, error } from '@/utils/debug';
 *   log('message');
 */
export const { log, warn, error, info } = debug;

/**
 * Helper to check if we're in development mode
 */
export const isDevelopment = import.meta.env.DEV;

/**
 * Helper to check if we're in production mode
 */
export const isProduction = import.meta.env.PROD;
