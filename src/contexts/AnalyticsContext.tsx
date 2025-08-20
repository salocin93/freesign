/**
 * Analytics Context & Hooks
 * 
 * React context and hooks for managing analytics and monitoring throughout
 * the FreeSign application. Provides easy-to-use hooks for tracking user
 * interactions, performance metrics, and application events.
 * 
 * Features:
 * - React context for analytics state
 * - Custom hooks for common tracking patterns
 * - Component lifecycle tracking
 * - Automatic page view tracking
 * - Error boundary integration
 * 
 * @module AnalyticsContext
 */

import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { analytics as globalAnalytics, AnalyticsEventType, AnalyticsUtils } from '@/utils/analytics';
import { performanceMonitor, MonitoringUtils } from '@/utils/monitoring';

/**
 * Analytics Property Types
 */
interface AnalyticsProperties {
  [key: string]: string | number | boolean | null | undefined;
}

interface ErrorContext {
  [key: string]: string | number | boolean | null | undefined;
  component?: string;
  action?: string;
  userId?: string;
}

interface PerformanceProperties extends AnalyticsProperties {
  duration?: number;
  memoryUsage?: number;
  timestamp?: number;
}

/**
 * Analytics Context Type
 */
interface AnalyticsContextType {
  // Core tracking methods
  track: (event: AnalyticsEventType, properties?: AnalyticsProperties) => void;
  trackPageView: (path?: string, title?: string) => void;
  trackInteraction: (element: string, action: string, properties?: AnalyticsProperties) => void;
  trackError: (error: Error, context?: ErrorContext) => void;
  
  // Performance tracking
  trackPerformance: (metric: string, value: number, properties?: PerformanceProperties) => void;
  measureExecutionTime: <T extends unknown>(fn: () => T, label: string) => T;
  measureAsyncExecutionTime: <T extends unknown>(fn: () => Promise<T>, label: string) => Promise<T>;
  
  // Specialized tracking
  trackDocumentWorkflow: (step: 'upload' | 'edit' | 'send' | 'sign' | 'complete', documentId: string) => void;
  trackSignatureWorkflow: (step: 'start' | 'draw' | 'type' | 'upload' | 'complete', method?: string) => void;
  trackFeatureUsage: (feature: string, properties?: AnalyticsProperties) => void;
  
  // Configuration
  setUserId: (userId: string) => void;
  enabled: boolean;
  userId?: string;
}

/**
 * Analytics Context
 */
const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

/**
 * Analytics Provider Props
 */
interface AnalyticsProviderProps {
  children: ReactNode;
  enabled?: boolean;
  debug?: boolean;
}

/**
 * Analytics Provider Component
 */
export function AnalyticsProvider({ 
  children, 
  enabled = import.meta.env.PROD,
  debug = import.meta.env.DEV 
}: AnalyticsProviderProps) {
  const { user } = useAuth();
  const location = useLocation();
  const previousPath = useRef<string>();

  // Set user ID when user changes
  useEffect(() => {
    if (user?.id) {
      globalAnalytics.setUserId(user.id);
    }
  }, [user?.id]);

  // Track page views on route changes
  useEffect(() => {
    if (location.pathname !== previousPath.current) {
      previousPath.current = location.pathname;
      
      // Track page view
      globalAnalytics.trackPageView(location.pathname, document.title);
      
      if (debug) {
        console.log('[Analytics] Page view tracked:', location.pathname);
      }
    }
  }, [location.pathname, debug]);

  // Context value
  const contextValue: AnalyticsContextType = {
    // Core tracking methods
    track: (event: AnalyticsEventType, properties?: AnalyticsProperties) => {
      if (!enabled) return;
      globalAnalytics.track(event, properties);
    },

    trackPageView: (path?: string, title?: string) => {
      if (!enabled) return;
      globalAnalytics.trackPageView(path || location.pathname, title);
    },

    trackInteraction: (element: string, action: string, properties?: AnalyticsProperties) => {
      if (!enabled) return;
      globalAnalytics.trackInteraction(element, action, properties);
    },

    trackError: (error: Error, context?: ErrorContext) => {
      if (!enabled) return;
      globalAnalytics.trackError(error, context);
    },

    // Performance tracking
    trackPerformance: (metric: string, value: number, properties?: PerformanceProperties) => {
      if (!enabled) return;
      globalAnalytics.trackPerformance(metric, value, properties);
    },

    measureExecutionTime: <T extends unknown>(fn: () => T, label: string): T => {
      if (!enabled) return fn();
      return MonitoringUtils.measureExecutionTime(fn, label);
    },

    measureAsyncExecutionTime: async <T extends unknown>(fn: () => Promise<T>, label: string): Promise<T> => {
      if (!enabled) return fn();
      return MonitoringUtils.measureAsyncExecutionTime(fn, label);
    },

    // Specialized tracking
    trackDocumentWorkflow: (step: 'upload' | 'edit' | 'send' | 'sign' | 'complete', documentId: string) => {
      if (!enabled) return;
      AnalyticsUtils.trackDocumentFunnel(step, documentId);
    },

    trackSignatureWorkflow: (step: 'start' | 'draw' | 'type' | 'upload' | 'complete', method?: string) => {
      if (!enabled) return;
      AnalyticsUtils.trackSignatureWorkflow(step, method);
    },

    trackFeatureUsage: (feature: string, properties?: AnalyticsProperties) => {
      if (!enabled) return;
      AnalyticsUtils.trackFeatureAdoption(feature, false);
      globalAnalytics.track(AnalyticsEventType.FEATURE_USED, { feature, ...properties });
    },

    // Configuration
    setUserId: (userId: string) => {
      globalAnalytics.setUserId(userId);
    },

    enabled,
    userId: user?.id
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Use Analytics Hook
 */
export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

/**
 * Use Page View Tracking Hook
 */
export function usePageViewTracking(pageName?: string) {
  const { trackPageView } = useAnalytics();
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname, pageName || document.title);
  }, [location.pathname, pageName, trackPageView]);
}

/**
 * Use Interaction Tracking Hook
 */
export function useInteractionTracking() {
  const { trackInteraction } = useAnalytics();

  const trackClick = (element: string, properties?: Record<string, any>) => {
    trackInteraction(element, 'click', properties);
  };

  const trackHover = (element: string, properties?: Record<string, any>) => {
    trackInteraction(element, 'hover', properties);
  };

  const trackFocus = (element: string, properties?: Record<string, any>) => {
    trackInteraction(element, 'focus', properties);
  };

  const trackInput = (element: string, properties?: Record<string, any>) => {
    trackInteraction(element, 'input', properties);
  };

  return { trackClick, trackHover, trackFocus, trackInput };
}

/**
 * Use Performance Tracking Hook
 */
export function usePerformanceTracking() {
  const { trackPerformance, measureExecutionTime, measureAsyncExecutionTime } = useAnalytics();

  const trackRenderTime = (componentName: string, renderTime: number) => {
    trackPerformance(`component_render_${componentName}`, renderTime, {
      component_render: true
    });
  };

  const trackApiCall = (endpoint: string, responseTime: number, success: boolean) => {
    trackPerformance(`api_${endpoint}`, responseTime, {
      api_call: true,
      success
    });
  };

  return {
    trackRenderTime,
    trackApiCall,
    measureExecutionTime,
    measureAsyncExecutionTime
  };
}

/**
 * Use Component Lifecycle Tracking Hook
 */
export function useComponentLifecycleTracking(componentName: string) {
  const { track } = useAnalytics();

  useEffect(() => {
    const mountTime = performance.now();
    
    // Track component mount
    track(AnalyticsEventType.FEATURE_USED, {
      component_lifecycle: 'mount',
      component_name: componentName,
      timestamp: mountTime
    });

    return () => {
      const unmountTime = performance.now();
      const lifespan = unmountTime - mountTime;
      
      // Track component unmount
      track(AnalyticsEventType.FEATURE_USED, {
        component_lifecycle: 'unmount',
        component_name: componentName,
        lifespan,
        timestamp: unmountTime
      });
    };
  }, [componentName, track]);
}

/**
 * Use Error Tracking Hook
 */
export function useErrorTracking() {
  const { trackError } = useAnalytics();

  const trackJavaScriptError = (error: Error, errorInfo?: React.ErrorInfo) => {
    trackError(error, {
      error_boundary: true,
      component_stack: errorInfo?.componentStack,
      error_boundary_stack: errorInfo?.errorBoundary
    });
  };

  const trackAsyncError = (error: Error, operation: string) => {
    trackError(error, {
      async_operation: operation,
      error_type: 'async'
    });
  };

  const trackUserError = (message: string, context?: Record<string, any>) => {
    trackError(new Error(message), {
      error_type: 'user',
      ...context
    });
  };

  return {
    trackJavaScriptError,
    trackAsyncError,
    trackUserError
  };
}

/**
 * Use Document Workflow Tracking Hook
 */
export function useDocumentWorkflowTracking() {
  const { trackDocumentWorkflow } = useAnalytics();

  const trackUpload = (documentId: string, fileSize: number, fileType: string) => {
    trackDocumentWorkflow('upload', documentId);
    analytics.track(AnalyticsEventType.DOCUMENT_UPLOAD, {
      document_id: documentId,
      file_size: fileSize,
      file_type: fileType
    });
  };

  const trackEdit = (documentId: string, editType: string) => {
    trackDocumentWorkflow('edit', documentId);
    analytics.track(AnalyticsEventType.DOCUMENT_EDIT, {
      document_id: documentId,
      edit_type: editType
    });
  };

  const trackSend = (documentId: string, recipientCount: number) => {
    trackDocumentWorkflow('send', documentId);
    analytics.track(AnalyticsEventType.DOCUMENT_SHARE, {
      document_id: documentId,
      recipient_count: recipientCount
    });
  };

  const trackSign = (documentId: string, signatureMethod: string) => {
    trackDocumentWorkflow('sign', documentId);
    analytics.track(AnalyticsEventType.SIGNATURE_COMPLETE, {
      document_id: documentId,
      signature_method: signatureMethod
    });
  };

  const trackComplete = (documentId: string, totalTime: number) => {
    trackDocumentWorkflow('complete', documentId);
    analytics.track(AnalyticsEventType.FEATURE_USED, {
      document_id: documentId,
      workflow: 'document_complete',
      total_time: totalTime
    });
  };

  return {
    trackUpload,
    trackEdit,
    trackSend,
    trackSign,
    trackComplete
  };
}

/**
 * Use Signature Workflow Tracking Hook
 */
export function useSignatureWorkflowTracking() {
  const { trackSignatureWorkflow } = useAnalytics();

  const trackSignatureStart = () => {
    trackSignatureWorkflow('start');
  };

  const trackSignatureMethod = (method: 'draw' | 'type' | 'upload') => {
    trackSignatureWorkflow(method, method);
  };

  const trackSignatureComplete = (method: string, duration: number) => {
    trackSignatureWorkflow('complete', method);
    analytics.track(AnalyticsEventType.SIGNATURE_COMPLETE, {
      method,
      duration,
      success: true
    });
  };

  return {
    trackSignatureStart,
    trackSignatureMethod,
    trackSignatureComplete
  };
}

/**
 * With Analytics HOC
 */
export function withAnalytics<P extends {}>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const WithAnalyticsComponent = (props: P) => {
    useComponentLifecycleTracking(componentName);
    
    return <WrappedComponent {...props} />;
  };

  WithAnalyticsComponent.displayName = `withAnalytics(${componentName})`;
  
  return WithAnalyticsComponent;
}

export default AnalyticsContext;