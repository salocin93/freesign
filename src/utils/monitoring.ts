/**
 * Performance Monitoring & System Health Utilities
 * 
 * Comprehensive monitoring system for tracking application performance,
 * system health, and providing real-time insights into FreeSign's operation.
 * 
 * Features:
 * - Core Web Vitals monitoring
 * - API performance tracking
 * - Memory usage monitoring
 * - Error rate tracking
 * - Real-time performance dashboard
 * - Alerting system
 * 
 * @module Monitoring
 */

import { analytics, AnalyticsEventType } from './analytics';

/**
 * Performance Metric Types
 */
export interface CoreWebVitals {
  // Core Web Vitals (Google)
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  interactionToNextPaint: number;
  
  // Custom FreeSign Metrics
  timeToInteractive: number;
  documentRenderTime: number;
  signatureCreationTime: number;
  pdfLoadTime: number;
  apiResponseTime: number;
  
  // Navigation Timing
  navigationStart: number;
  domContentLoaded: number;
  windowLoaded: number;
  
  // Resource Timing
  resourcesLoaded: number;
  totalResourceSize: number;
  cacheHitRatio: number;
}

/**
 * System Health Metrics
 */
export interface SystemHealthMetrics {
  // Memory Usage
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  
  // Network
  effectiveConnectionType: string;
  downlink: number;
  rtt: number;
  
  // Error Tracking
  errorCount: number;
  errorRate: number;
  
  // User Experience
  bounceRate: number;
  sessionDuration: number;
  pageViews: number;
}

/**
 * Performance Alert Configuration
 */
export interface PerformanceAlert {
  metric: keyof CoreWebVitals | keyof SystemHealthMetrics;
  threshold: number;
  condition: 'greater_than' | 'less_than' | 'equal_to';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  enabled: boolean;
}

/**
 * Main Performance Monitor Class
 */
export class PerformanceMonitor {
  private metrics: Partial<CoreWebVitals> = {};
  private systemHealth: Partial<SystemHealthMetrics> = {};
  private alerts: PerformanceAlert[] = [];
  private observers: {
    performance?: PerformanceObserver;
    navigation?: PerformanceObserver;
    resource?: PerformanceObserver;
  } = {};
  private isMonitoring = false;

  constructor() {
    this.setupDefaultAlerts();
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupPerformanceObservers();
    this.startHealthChecks();
    this.measureCoreWebVitals();
    
    console.log('[PerformanceMonitor] Monitoring started');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    this.disconnectObservers();
    
    console.log('[PerformanceMonitor] Monitoring stopped');
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): { performance: Partial<CoreWebVitals>; systemHealth: Partial<SystemHealthMetrics> } {
    return {
      performance: { ...this.metrics },
      systemHealth: { ...this.systemHealth }
    };
  }

  /**
   * Measure Core Web Vitals
   */
  private measureCoreWebVitals(): void {
    // First Contentful Paint (FCP)
    this.observePerformanceEntry('paint', (entries) => {
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.updateMetric('firstContentfulPaint', entry.startTime);
        }
      });
    });

    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      entries.forEach((entry) => {
        this.updateMetric('largestContentfulPaint', entry.startTime);
      });
    });

    // Cumulative Layout Shift (CLS)
    this.observePerformanceEntry('layout-shift', (entries) => {
      let clsValue = 0;
      entries.forEach((entry: PerformanceEntry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.updateMetric('cumulativeLayoutShift', clsValue);
    });

    // First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entries) => {
      entries.forEach((entry: PerformanceEntry) => {
        this.updateMetric('firstInputDelay', entry.processingStart - entry.startTime);
      });
    });

    // Navigation timing
    this.measureNavigationTiming();
  }

  /**
   * Measure navigation timing
   */
  private measureNavigationTiming(): void {
    window.addEventListener('load', () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (nav) {
        this.updateMetric('navigationStart', nav.fetchStart);
        this.updateMetric('domContentLoaded', nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart);
        this.updateMetric('windowLoaded', nav.loadEventEnd - nav.loadEventStart);
        
        // Time to Interactive (simplified calculation)
        this.updateMetric('timeToInteractive', nav.domInteractive - nav.fetchStart);
      }
    });
  }

  /**
   * Setup performance observers
   */
  private setupPerformanceObservers(): void {
    try {
      // Performance Observer for various entry types
      this.observers.performance = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe multiple entry types
      const entryTypes = ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input', 'navigation'];
      entryTypes.forEach(type => {
        try {
          this.observers.performance?.observe({ type });
        } catch (error) {
          console.warn(`Performance observer for ${type} not supported:`, error);
        }
      });

      // Resource timing observer
      this.observers.resource = new PerformanceObserver((list) => {
        this.processResourceEntries(list.getEntries());
      });

      this.observers.resource.observe({ type: 'resource' });
    } catch (error) {
      console.error('Failed to setup performance observers:', error);
    }
  }

  /**
   * Observe specific performance entry type
   */
  private observePerformanceEntry(
    type: string,
    callback: (entries: PerformanceEntry[]) => void
  ): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type });
    } catch (error) {
      console.warn(`Performance observer for ${type} not supported`);
    }
  }

  /**
   * Process performance entry
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    // Track API calls
    if (entry.name.includes('/api/') || entry.name.includes('supabase')) {
      this.trackApiPerformance(entry);
    }

    // Track PDF loading
    if (entry.name.includes('.pdf')) {
      this.updateMetric('pdfLoadTime', entry.duration || 0);
    }

    analytics.trackPerformance(entry.name, entry.startTime, {
      duration: entry.duration,
      entryType: entry.entryType
    });
  }

  /**
   * Process resource entries
   */
  private processResourceEntries(entries: PerformanceEntry[]): void {
    let totalSize = 0;
    let cacheHits = 0;

    entries.forEach((entry: PerformanceEntry) => {
      if (entry.transferSize !== undefined) {
        totalSize += entry.transferSize;
        
        // Check if resource was served from cache
        if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
          cacheHits++;
        }
      }
    });

    this.updateSystemHealth('totalResourceSize', totalSize);
    this.updateSystemHealth('resourcesLoaded', entries.length);
    this.updateSystemHealth('cacheHitRatio', entries.length > 0 ? cacheHits / entries.length : 0);
  }

  /**
   * Track API performance
   */
  private trackApiPerformance(entry: PerformanceEntry): void {
    const duration = entry.duration || 0;
    this.updateMetric('apiResponseTime', duration);

    // Alert on slow API calls
    if (duration > 3000) { // 3 seconds
      this.triggerAlert('apiResponseTime', duration, 'API call taking too long');
    }

    analytics.track(AnalyticsEventType.API_REQUEST, {
      endpoint: entry.name,
      duration,
      startTime: entry.startTime
    });
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    // Check every 30 seconds
    setInterval(() => {
      this.checkMemoryUsage();
      this.checkNetworkConditions();
      this.checkErrorRate();
    }, 30000);

    // Initial check
    this.checkMemoryUsage();
    this.checkNetworkConditions();
  }

  /**
   * Check memory usage
   */
  private checkMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      
      this.updateSystemHealth('usedJSHeapSize', memory.usedJSHeapSize);
      this.updateSystemHealth('totalJSHeapSize', memory.totalJSHeapSize);
      this.updateSystemHealth('jsHeapSizeLimit', memory.jsHeapSizeLimit);

      // Alert on high memory usage
      const memoryUsagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (memoryUsagePercentage > 80) {
        this.triggerAlert('usedJSHeapSize', memoryUsagePercentage, 'High memory usage detected');
      }
    }
  }

  /**
   * Check network conditions
   */
  private checkNetworkConditions(): void {
    if ('connection' in navigator) {
      const connection = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number } }).connection;
      
      this.updateSystemHealth('effectiveConnectionType', connection.effectiveType);
      this.updateSystemHealth('downlink', connection.downlink);
      this.updateSystemHealth('rtt', connection.rtt);

      // Alert on slow connection
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        this.triggerAlert('effectiveConnectionType', 0, 'Slow network connection detected');
      }
    }
  }

  /**
   * Check error rate
   */
  private checkErrorRate(): void {
    // This would typically integrate with your error tracking system
    // For now, we'll track JavaScript errors
    const errorCount = this.getErrorCount();
    const pageViews = this.getPageViews();
    const errorRate = pageViews > 0 ? (errorCount / pageViews) * 100 : 0;

    this.updateSystemHealth('errorCount', errorCount);
    this.updateSystemHealth('errorRate', errorRate);

    // Alert on high error rate
    if (errorRate > 5) { // 5% error rate
      this.triggerAlert('errorRate', errorRate, 'High error rate detected');
    }
  }

  /**
   * Update performance metric
   */
  private updateMetric(key: keyof CoreWebVitals, value: number): void {
    this.metrics[key] = value;
    this.checkAlerts(key, value);
  }

  /**
   * Update system health metric
   */
  private updateSystemHealth(key: keyof SystemHealthMetrics, value: number | string): void {
    (this.systemHealth as Record<keyof SystemHealthMetrics, number | string>)[key] = value;
    if (typeof value === 'number') {
      this.checkAlerts(key as keyof (CoreWebVitals & SystemHealthMetrics), value);
    }
  }

  /**
   * Check alerts for a metric
   */
  private checkAlerts(metric: keyof (CoreWebVitals & SystemHealthMetrics), value: number): void {
    this.alerts
      .filter(alert => alert.metric === metric && alert.enabled)
      .forEach(alert => {
        let shouldTrigger = false;
        
        switch (alert.condition) {
          case 'greater_than':
            shouldTrigger = value > alert.threshold;
            break;
          case 'less_than':
            shouldTrigger = value < alert.threshold;
            break;
          case 'equal_to':
            shouldTrigger = value === alert.threshold;
            break;
        }

        if (shouldTrigger) {
          this.triggerAlert(metric, value, alert.message, alert.severity);
        }
      });
  }

  /**
   * Trigger performance alert
   */
  private triggerAlert(
    metric: string, 
    value: number, 
    message: string, 
    severity: PerformanceAlert['severity'] = 'medium'
  ): void {
    const alert = {
      metric,
      value,
      message,
      severity,
      timestamp: new Date()
    };

    console.warn(`[PerformanceAlert] ${severity.toUpperCase()}: ${message}`, alert);

    // Track alert in analytics
    analytics.track(AnalyticsEventType.ERROR_BOUNDARY, {
      alert_type: 'performance',
      metric,
      value,
      message,
      severity
    });

    // In a real application, you might send this to a monitoring service
    // like Sentry, DataDog, or your own alerting system
  }

  /**
   * Setup default alerts
   */
  private setupDefaultAlerts(): void {
    this.alerts = [
      {
        metric: 'firstContentfulPaint',
        threshold: 3000,
        condition: 'greater_than',
        severity: 'high',
        message: 'First Contentful Paint is slow (>3s)',
        enabled: true
      },
      {
        metric: 'largestContentfulPaint',
        threshold: 4000,
        condition: 'greater_than',
        severity: 'high',
        message: 'Largest Contentful Paint is slow (>4s)',
        enabled: true
      },
      {
        metric: 'cumulativeLayoutShift',
        threshold: 0.1,
        condition: 'greater_than',
        severity: 'medium',
        message: 'Cumulative Layout Shift is high (>0.1)',
        enabled: true
      },
      {
        metric: 'firstInputDelay',
        threshold: 300,
        condition: 'greater_than',
        severity: 'high',
        message: 'First Input Delay is slow (>300ms)',
        enabled: true
      },
      {
        metric: 'apiResponseTime',
        threshold: 5000,
        condition: 'greater_than',
        severity: 'critical',
        message: 'API response time is very slow (>5s)',
        enabled: true
      }
    ];
  }

  /**
   * Disconnect observers
   */
  private disconnectObservers(): void {
    Object.values(this.observers).forEach(observer => {
      observer?.disconnect();
    });
  }

  /**
   * Get error count (placeholder - would integrate with error tracking)
   */
  private getErrorCount(): number {
    // This would typically come from your error tracking system
    return 0;
  }

  /**
   * Get page views count (placeholder - would integrate with analytics)
   */
  private getPageViews(): number {
    // This would typically come from your analytics system
    return 1;
  }

  /**
   * Create performance report
   */
  createReport(): string {
    const metrics = this.getMetrics();
    
    return `
FreeSign Performance Report
Generated: ${new Date().toISOString()}

Core Web Vitals:
- First Contentful Paint: ${metrics.performance.firstContentfulPaint?.toFixed(2) || 'N/A'}ms
- Largest Contentful Paint: ${metrics.performance.largestContentfulPaint?.toFixed(2) || 'N/A'}ms
- Cumulative Layout Shift: ${metrics.performance.cumulativeLayoutShift?.toFixed(3) || 'N/A'}
- First Input Delay: ${metrics.performance.firstInputDelay?.toFixed(2) || 'N/A'}ms

Application Performance:
- Time to Interactive: ${metrics.performance.timeToInteractive?.toFixed(2) || 'N/A'}ms
- Document Render Time: ${metrics.performance.documentRenderTime?.toFixed(2) || 'N/A'}ms
- API Response Time: ${metrics.performance.apiResponseTime?.toFixed(2) || 'N/A'}ms

System Health:
- Memory Usage: ${((metrics.systemHealth.usedJSHeapSize || 0) / 1024 / 1024).toFixed(2)}MB
- Network Type: ${metrics.systemHealth.effectiveConnectionType || 'N/A'}
- Error Rate: ${metrics.systemHealth.errorRate?.toFixed(2) || 'N/A'}%
`;
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance monitoring utilities
 */
export const MonitoringUtils = {
  /**
   * Measure function execution time
   */
  measureExecutionTime: <T>(fn: () => T, label: string): T => {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    analytics.trackPerformance(label, duration, {
      function_execution: true
    });
    
    return result;
  },

  /**
   * Measure async function execution time
   */
  measureAsyncExecutionTime: async <T>(fn: () => Promise<T>, label: string): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    analytics.trackPerformance(label, duration, {
      async_function_execution: true
    });
    
    return result;
  },

  /**
   * Track component render time
   */
  trackComponentRender: (componentName: string, renderTime: number): void => {
    analytics.trackPerformance(`component_render_${componentName}`, renderTime, {
      component_render: true
    });
  },

  /**
   * Track PDF operations
   */
  trackPdfOperation: (operation: 'load' | 'render' | 'sign', duration: number, pageCount?: number): void => {
    analytics.trackPerformance(`pdf_${operation}`, duration, {
      pdf_operation: true,
      page_count: pageCount
    });
  }
};

// Auto-start monitoring in production
if (import.meta.env.PROD) {
  performanceMonitor.start();
}

export default performanceMonitor;