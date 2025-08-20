/**
 * Analytics & Monitoring Utilities
 * 
 * Comprehensive analytics system for tracking user behavior, performance metrics,
 * and application insights in the FreeSign platform.
 * 
 * Features:
 * - User behavior tracking (page views, clicks, interactions)
 * - Conversion funnel analysis
 * - Performance monitoring
 * - Error tracking integration
 * - Privacy-compliant data collection
 * - Real-time metrics dashboard
 * 
 * @module Analytics
 */

/**
 * Analytics Event Types
 */
export enum AnalyticsEventType {
  // User Authentication
  USER_SIGNIN = 'user_signin',
  USER_SIGNUP = 'user_signup',
  USER_SIGNOUT = 'user_signout',
  
  // Document Management
  DOCUMENT_UPLOAD = 'document_upload',
  DOCUMENT_VIEW = 'document_view',
  DOCUMENT_EDIT = 'document_edit',
  DOCUMENT_DELETE = 'document_delete',
  DOCUMENT_SHARE = 'document_share',
  
  // Signature Workflow
  SIGNATURE_START = 'signature_start',
  SIGNATURE_COMPLETE = 'signature_complete',
  SIGNATURE_CANCEL = 'signature_cancel',
  SIGNATURE_DRAW = 'signature_draw',
  SIGNATURE_TYPE = 'signature_type',
  SIGNATURE_UPLOAD = 'signature_upload',
  
  // Recipients
  RECIPIENT_ADD = 'recipient_add',
  RECIPIENT_INVITE = 'recipient_invite',
  RECIPIENT_REMIND = 'recipient_remind',
  
  // Performance
  PAGE_LOAD = 'page_load',
  API_REQUEST = 'api_request',
  ERROR_BOUNDARY = 'error_boundary',
  
  // UI Interactions
  BUTTON_CLICK = 'button_click',
  MODAL_OPEN = 'modal_open',
  MODAL_CLOSE = 'modal_close',
  TAB_SWITCH = 'tab_switch',
  
  // Feature Usage
  FEATURE_USED = 'feature_used',
  HELP_ACCESSED = 'help_accessed',
  SETTINGS_CHANGED = 'settings_changed'
}

/**
 * Analytics Event Data Structure
 */
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  properties: Record<string, string | number | boolean | null | undefined>;
  metadata?: {
    userAgent?: string;
    url?: string;
    referrer?: string;
    viewport?: { width: number; height: number };
    device?: 'mobile' | 'tablet' | 'desktop';
    performance?: {
      loadTime?: number;
      responseTime?: number;
      errorCount?: number;
    };
  };
}

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  // Core Web Vitals
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  
  // Custom Metrics
  timeToInteractive: number;
  documentLoadTime: number;
  apiResponseTime: number;
  signatureCreationTime: number;
  pdfRenderTime: number;
  
  // Navigation Timing
  navigationStart: number;
  domContentLoaded: number;
  loadEventEnd: number;
}

/**
 * Analytics Configuration
 */
export interface AnalyticsConfig {
  enabled: boolean;
  batchSize: number;
  flushInterval: number; // milliseconds
  endpoint?: string;
  apiKey?: string;
  userId?: string;
  privacyMode: boolean;
  collectPerformance: boolean;
  collectErrors: boolean;
}

/**
 * Main Analytics Class
 */
export class Analytics {
  private config: AnalyticsConfig;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private flushTimer?: NodeJS.Timeout;
  private performanceObserver?: PerformanceObserver;
  private eventListeners: ((event: AnalyticsEvent) => void)[] = [];

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: true,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      privacyMode: false,
      collectPerformance: true,
      collectErrors: true,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.setupPerformanceMonitoring();
    this.setupAutoFlush();
    this.setupBeforeUnload();
  }

  /**
   * Track an analytics event
   */
  track(type: AnalyticsEventType, properties: Record<string, string | number | boolean | null | undefined> = {}): void {
    if (!this.config.enabled) return;

    const event: AnalyticsEvent = {
      type,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId: this.config.userId,
      properties: this.sanitizeProperties(properties),
      metadata: this.getMetadata()
    };

    this.events.push(event);

    // Notify event listeners (for DevTools)
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.warn('Analytics event listener error:', error);
      }
    });

    // Auto-flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.log('[Analytics]', type, properties);
    }
  }

  /**
   * Add event listener for DevTools
   */
  addEventListener(listener: (event: AnalyticsEvent) => void): () => void {
    this.eventListeners.push(listener);
    
    // Return cleanup function
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.config.userId = userId;
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string): void {
    this.track(AnalyticsEventType.PAGE_LOAD, {
      path,
      title: title || document.title,
      referrer: document.referrer,
      timestamp: Date.now()
    });
  }

  /**
   * Track user interaction
   */
  trackInteraction(element: string, action: string, properties: Record<string, string | number | boolean | null | undefined> = {}): void {
    this.track(AnalyticsEventType.BUTTON_CLICK, {
      element,
      action,
      ...properties
    });
  }

  /**
   * Track conversion funnel step
   */
  trackFunnelStep(step: string, stepNumber: number, properties: Record<string, string | number | boolean | null | undefined> = {}): void {
    this.track(AnalyticsEventType.FEATURE_USED, {
      funnel_step: step,
      step_number: stepNumber,
      ...properties
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: string, value: number, properties: Record<string, string | number | boolean | null | undefined> = {}): void {
    if (!this.config.collectPerformance) return;

    this.track(AnalyticsEventType.API_REQUEST, {
      performance_metric: metric,
      value,
      unit: 'milliseconds',
      ...properties
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, context: Record<string, string | number | boolean | null | undefined> = {}): void {
    if (!this.config.collectErrors) return;

    this.track(AnalyticsEventType.ERROR_BOUNDARY, {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      context
    });
  }

  /**
   * Flush events to server
   */
  async flush(): Promise<void> {
    if (this.events.length === 0 || !this.config.endpoint) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && this.config.apiKey.trim() && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          events: eventsToSend,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-queue events on failure
      this.events = [...eventsToSend, ...this.events];
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Partial<PerformanceMetrics> {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    const metrics: Partial<PerformanceMetrics> = {
      navigationStart: nav?.fetchStart || 0,
      domContentLoaded: nav?.domContentLoadedEventEnd - nav?.domContentLoadedEventStart || 0,
      loadEventEnd: nav?.loadEventEnd || 0
    };

    // Core Web Vitals
    paint.forEach(entry => {
      if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });

    return metrics;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize properties for privacy
   */
  private sanitizeProperties(properties: Record<string, string | number | boolean | null | undefined>): Record<string, string | number | boolean | null | undefined> {
    if (!this.config.privacyMode) return properties;

    const sanitized = { ...properties };
    
    // Remove sensitive data
    const sensitiveKeys = ['email', 'password', 'ssn', 'phone', 'address'];
    sensitiveKeys.forEach(key => {
      if (key in sanitized) {
        delete sanitized[key];
      }
    });

    return sanitized;
  }

  /**
   * Get metadata for events
   */
  private getMetadata(): AnalyticsEvent['metadata'] {
    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      device: this.getDeviceType()
    };
  }

  /**
   * Detect device type
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (!this.config.collectPerformance || typeof window === 'undefined') return;

    try {
      // Observe Core Web Vitals
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformance(entry.name, entry.startTime, {
            entry_type: entry.entryType,
            duration: entry.duration
          });
        }
      });

      this.performanceObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
    } catch (error) {
      console.warn('Performance monitoring not supported:', error);
    }
  }

  /**
   * Setup auto-flush timer
   */
  private setupAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Setup beforeunload event to flush on page exit
   */
  private setupBeforeUnload(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    this.flush();
  }
}

/**
 * Global analytics instance
 */
export const analytics = new Analytics({
  enabled: import.meta.env.PROD, // Only enable in production
  endpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT || undefined,
  apiKey: import.meta.env.VITE_ANALYTICS_API_KEY || undefined,
  privacyMode: true,
  collectPerformance: true,
  collectErrors: true
});

/**
 * Analytics utility functions
 */
export const AnalyticsUtils = {
  /**
   * Track document workflow funnel
   */
  trackDocumentFunnel: (step: 'upload' | 'edit' | 'send' | 'sign' | 'complete', documentId: string) => {
    const stepNumbers = { upload: 1, edit: 2, send: 3, sign: 4, complete: 5 };
    analytics.trackFunnelStep(`document_${step}`, stepNumbers[step], { document_id: documentId });
  },

  /**
   * Track signature creation workflow
   */
  trackSignatureWorkflow: (step: 'start' | 'draw' | 'type' | 'upload' | 'complete', method?: string) => {
    analytics.track(
      step === 'start' ? AnalyticsEventType.SIGNATURE_START : 
      step === 'complete' ? AnalyticsEventType.SIGNATURE_COMPLETE : AnalyticsEventType.SIGNATURE_DRAW,
      { step, method }
    );
  },

  /**
   * Track user onboarding
   */
  trackOnboarding: (step: string, completed: boolean) => {
    analytics.track(AnalyticsEventType.FEATURE_USED, {
      onboarding_step: step,
      completed,
      timestamp: Date.now()
    });
  },

  /**
   * Track feature adoption
   */
  trackFeatureAdoption: (feature: string, firstTime: boolean = false) => {
    analytics.track(AnalyticsEventType.FEATURE_USED, {
      feature,
      first_time: firstTime,
      timestamp: Date.now()
    });
  },

  /**
   * Track API performance
   */
  trackApiCall: (endpoint: string, method: string, responseTime: number, success: boolean) => {
    analytics.track(AnalyticsEventType.API_REQUEST, {
      endpoint,
      method,
      response_time: responseTime,
      success,
      timestamp: Date.now()
    });
  }
};

// Export analytics instance and utilities
export default analytics;