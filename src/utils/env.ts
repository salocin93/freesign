/**
 * Environment Configuration and Validation
 * 
 * Provides centralized environment variable access, validation, and type safety
 * for the FreeSign application. Ensures all required environment variables
 * are properly configured before the application starts.
 */

interface EnvironmentConfig {
  // Required Configuration
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // Optional Email Service
  sendgridApiKey?: string;
  sendgridFromEmail?: string;
  sendgridTemplateId?: string;
  
  // Optional Analytics & Monitoring
  analyticsEndpoint?: string;
  analyticsApiKey?: string;
  
  // Optional Error Tracking
  sentryDsn?: string;
  errorTrackingEnabled: boolean;
  
  // Feature Flags
  enableAnalyticsPanel: boolean;
  enableOfflineMode: boolean;
  enablePerformanceMonitoring: boolean;
  
  // Development
  useMockAuth: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  
  // Performance & CDN
  cdnUrl?: string;
  enableServiceWorker: boolean;
  
  // Security
  cspReportUri?: string;
  enableStrictCSP: boolean;
}

/**
 * Validates and parses environment variables
 */
function parseEnvironment(): EnvironmentConfig {
  // Required variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required. ' +
      'Please copy .env.example to .env and configure your Supabase credentials.'
    );
  }
  
  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error('Invalid VITE_SUPABASE_URL: Must be a valid URL');
  }
  
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  
  // Parse boolean environment variables with defaults
  const parseBool = (value: string | undefined, defaultValue: boolean): boolean => {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  };
  
  return {
    // Required
    supabaseUrl,
    supabaseAnonKey,
    
    // Optional Email Service
    sendgridApiKey: import.meta.env.VITE_SENDGRID_API_KEY,
    sendgridFromEmail: import.meta.env.VITE_SENDGRID_FROM_EMAIL,
    sendgridTemplateId: import.meta.env.VITE_SENDGRID_TEMPLATE_ID,
    
    // Optional Analytics & Monitoring
    analyticsEndpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT,
    analyticsApiKey: import.meta.env.VITE_ANALYTICS_API_KEY,
    
    // Optional Error Tracking
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    errorTrackingEnabled: parseBool(import.meta.env.VITE_ERROR_TRACKING_ENABLED, isProduction),
    
    // Feature Flags
    enableAnalyticsPanel: parseBool(import.meta.env.VITE_ENABLE_ANALYTICS_PANEL, isDevelopment),
    enableOfflineMode: parseBool(import.meta.env.VITE_ENABLE_OFFLINE_MODE, true),
    enablePerformanceMonitoring: parseBool(import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING, true),
    
    // Development
    useMockAuth: parseBool(import.meta.env.VITE_USE_MOCK_AUTH, false),
    isDevelopment,
    isProduction,
    
    // Performance & CDN
    cdnUrl: import.meta.env.VITE_CDN_URL,
    enableServiceWorker: parseBool(import.meta.env.VITE_ENABLE_SW, isProduction),
    
    // Security
    cspReportUri: import.meta.env.VITE_CSP_REPORT_URI,
    enableStrictCSP: parseBool(import.meta.env.VITE_ENABLE_STRICT_CSP, isProduction),
  };
}

/**
 * Validates production-specific requirements
 */
function validateProductionConfig(config: EnvironmentConfig): void {
  if (!config.isProduction) return;
  
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Mock auth should never be enabled in production
  if (config.useMockAuth) {
    errors.push('VITE_USE_MOCK_AUTH must be false in production');
  }
  
  // Recommended production configurations
  if (!config.sendgridApiKey) {
    warnings.push('VITE_SENDGRID_API_KEY not configured - email functionality will be limited');
  }
  
  if (!config.sentryDsn && config.errorTrackingEnabled) {
    warnings.push('VITE_SENTRY_DSN not configured - error tracking will be limited');
  }
  
  if (!config.analyticsEndpoint && config.enablePerformanceMonitoring) {
    warnings.push('VITE_ANALYTICS_ENDPOINT not configured - analytics will be limited');
  }
  
  // Log warnings
  if (warnings.length > 0) {
    console.warn('Production configuration warnings:', warnings.join(', '));
  }
  
  // Throw errors
  if (errors.length > 0) {
    throw new Error(`Production configuration errors: ${errors.join(', ')}`);
  }
}

/**
 * Global environment configuration
 * Validates and exports environment variables with proper types
 */
export const env: EnvironmentConfig = (() => {
  try {
    const config = parseEnvironment();
    validateProductionConfig(config);
    
    // Log configuration in development
    if (config.isDevelopment) {
      console.log('Environment configuration loaded:', {
        supabaseUrl: config.supabaseUrl,
        hasEmailConfig: !!config.sendgridApiKey,
        hasAnalyticsConfig: !!config.analyticsEndpoint,
        hasErrorTracking: !!config.sentryDsn,
        featureFlags: {
          analyticsPanel: config.enableAnalyticsPanel,
          offlineMode: config.enableOfflineMode,
          performanceMonitoring: config.enablePerformanceMonitoring,
        }
      });
    }
    
    return config;
  } catch (error) {
    console.error('Environment configuration error:', error);
    throw error;
  }
})();

/**
 * Type-safe environment variable access
 * Use this instead of direct import.meta.env access
 */
export const getEnvVar = {
  supabase: {
    url: env.supabaseUrl,
    anonKey: env.supabaseAnonKey,
  },
  email: {
    apiKey: env.sendgridApiKey,
    fromEmail: env.sendgridFromEmail,
    templateId: env.sendgridTemplateId,
  },
  analytics: {
    endpoint: env.analyticsEndpoint,
    apiKey: env.analyticsApiKey,
  },
  features: {
    analyticsPanel: env.enableAnalyticsPanel,
    offlineMode: env.enableOfflineMode,
    performanceMonitoring: env.enablePerformanceMonitoring,
  },
  development: {
    useMockAuth: env.useMockAuth,
    isDev: env.isDevelopment,
    isProd: env.isProduction,
  },
  security: {
    cspReportUri: env.cspReportUri,
    enableStrictCSP: env.enableStrictCSP,
  }
};

/**
 * Runtime environment checks
 */
export const EnvChecks = {
  hasEmailConfig: (): boolean => !!(env.sendgridApiKey && env.sendgridFromEmail),
  hasAnalyticsConfig: (): boolean => !!env.analyticsEndpoint,
  hasErrorTracking: (): boolean => !!(env.sentryDsn && env.errorTrackingEnabled),
  isConfiguredForProduction: (): boolean => {
    return env.isProduction && 
           !env.useMockAuth && 
           EnvChecks.hasEmailConfig() && 
           EnvChecks.hasErrorTracking();
  },
};

export default env;