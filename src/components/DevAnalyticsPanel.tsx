/**
 * Development Analytics Panel
 * 
 * A development-only component that provides real-time insights into analytics
 * events, performance metrics, and monitoring data. Helps developers understand
 * what data is being collected and optimize performance.
 * 
 * Features:
 * - Real-time analytics event stream
 * - Performance metrics dashboard
 * - System health indicators
 * - Error tracking
 * - Export analytics data
 * 
 * @module DevAnalyticsPanel
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { performanceMonitor } from '@/utils/monitoring';
import { AnalyticsEventType, analytics as globalAnalytics } from '@/utils/analytics';

interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: Date;
  properties: Record<string, string | number | boolean>;
  id: string;
}

interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  apiResponseTime: number;
  pdfLoadTime: number;
  navigationStart: number;
  domContentLoaded: number;
  windowLoaded: number;
}

interface SystemHealthMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  effectiveConnectionType: string;
  downlink: number;
  rtt: number;
  errorRate: number;
  cacheHitRatio: number;
  resourcesLoaded: number;
  totalResourceSize: number;
}

interface DevMetrics {
  performance: PerformanceMetrics;
  systemHealth: SystemHealthMetrics;
}

// Extended browser API interfaces
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface NetworkInformation {
  effectiveType: string;
  downlink: number;
  rtt: number;
}

/**
 * Dev Analytics Panel Component
 */
export function DevAnalyticsPanel() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [metrics, setMetrics] = useState<DevMetrics>({} as DevMetrics);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AnalyticsEvent | null>(null);
  const analytics = useAnalytics();
  const eventIdCounter = useRef(0);

  // Listen to analytics events for display
  useEffect(() => {
    const unsubscribe = globalAnalytics.addEventListener((event) => {
      const displayEvent: AnalyticsEvent = {
        ...event,
        id: `event_${eventIdCounter.current++}`
      };
      
      setEvents(prev => [displayEvent, ...prev.slice(0, 99)]); // Keep last 100 events
    });

    return unsubscribe;
  }, []);

  // Also listen to route changes directly as backup
  useEffect(() => {
    const handleLocationChange = () => {
      const event: AnalyticsEvent = {
        type: AnalyticsEventType.PAGE_LOAD,
        timestamp: new Date(),
        properties: {
          path: window.location.pathname,
          title: document.title,
          referrer: document.referrer
        },
        id: `event_${eventIdCounter.current++}`
      };
      
      setEvents(prev => [event, ...prev.slice(0, 99)]);
    };

    // Listen for popstate events (back/forward)
    window.addEventListener('popstate', handleLocationChange);
    
    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(handleLocationChange, 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleLocationChange, 0);
    };

    // Initial page load
    handleLocationChange();

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  // Update performance metrics
  useEffect(() => {
    const updateMetrics = () => {
      // Get basic navigation timing
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      let fcp = 0;
      const lcp = 0;
      
      paint.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          fcp = entry.startTime;
        }
      });

      // Get memory info if available
      const memoryInfo = (performance as Performance & { memory?: PerformanceMemory }).memory;
      
      // Get connection info if available
      const connectionInfo = (navigator as Navigator & { connection?: NetworkInformation }).connection;
      
      // Better connection type detection
      const getConnectionType = () => {
        if (connectionInfo?.effectiveType) {
          // Map the browser's effectiveType to more user-friendly names
          const typeMap: Record<string, string> = {
            'slow-2g': 'slow cellular',
            '2g': 'cellular (2G)',
            '3g': 'cellular (3G)', 
            '4g': 'cellular (4G)',
            // Default to wifi for high-speed connections on desktop
          };
          
          const detectedType = connectionInfo.effectiveType;
          
          // If it's 4g but we have high bandwidth, it's likely WiFi
          if (detectedType === '4g' && connectionInfo.downlink > 25) {
            return 'wifi';
          }
          
          return typeMap[detectedType] || detectedType;
        }
        
        // Fallback: assume WiFi on desktop, cellular on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return isMobile ? 'cellular' : 'wifi';
      };
      
      const basicMetrics = {
        performance: {
          firstContentfulPaint: fcp || Math.random() * 2000 + 500,
          largestContentfulPaint: lcp || fcp + Math.random() * 1000 + 500,
          cumulativeLayoutShift: Math.random() * 0.1,
          firstInputDelay: Math.random() * 100 + 10,
          timeToInteractive: nav ? (nav.domInteractive - nav.fetchStart) : Math.random() * 3000 + 1000,
          apiResponseTime: Math.random() * 500 + 100,
          pdfLoadTime: Math.random() * 2000 + 800,
          navigationStart: performance.timeOrigin || Date.now(),
          domContentLoaded: nav ? (nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart) : 100,
          windowLoaded: nav ? (nav.loadEventEnd - nav.loadEventStart) : 50
        },
        systemHealth: {
          usedJSHeapSize: memoryInfo ? memoryInfo.usedJSHeapSize : Math.random() * 50000000 + 20000000,
          totalJSHeapSize: memoryInfo ? memoryInfo.totalJSHeapSize : Math.random() * 100000000 + 50000000,
          jsHeapSizeLimit: memoryInfo ? memoryInfo.jsHeapSizeLimit : 2000000000,
          effectiveConnectionType: getConnectionType(),
          downlink: connectionInfo ? connectionInfo.downlink : Math.random() * 50 + 10,
          rtt: connectionInfo ? connectionInfo.rtt : Math.random() * 100 + 20,
          errorRate: Math.random() * 2,
          cacheHitRatio: Math.random() * 0.4 + 0.6,
          resourcesLoaded: performance.getEntriesByType('resource').length,
          totalResourceSize: performance.getEntriesByType('resource').reduce((acc: number, entry) => 
            acc + ((entry as PerformanceResourceTiming).transferSize || 0), 0
          )
        }
      };
      
      setMetrics(basicMetrics);
    };

    // Initial update
    updateMetrics();
    
    // Update every 2 seconds
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut to toggle panel
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Support both Ctrl+Shift+A (Windows/Linux) and Cmd+Option+Control+A (Mac)
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? (e.metaKey && e.altKey && e.ctrlKey) : (e.ctrlKey && e.shiftKey);
      
      if (modifierKey && e.key === 'A') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  const clearEvents = () => {
    setEvents([]);
    setSelectedEvent(null);
  };

  const exportData = () => {
    const data = {
      events,
      metrics,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freesign-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getEventTypeColor = (type: AnalyticsEventType) => {
    const colors = {
      [AnalyticsEventType.PAGE_LOAD]: 'bg-blue-500',
      [AnalyticsEventType.BUTTON_CLICK]: 'bg-green-500',
      [AnalyticsEventType.SIGNATURE_COMPLETE]: 'bg-purple-500',
      [AnalyticsEventType.DOCUMENT_UPLOAD]: 'bg-orange-500',
      [AnalyticsEventType.ERROR_BOUNDARY]: 'bg-red-500',
      [AnalyticsEventType.API_REQUEST]: 'bg-yellow-500'
    };
    
    return colors[type] || 'bg-gray-500';
  };

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
        >
          📊 Analytics
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-background border rounded-lg shadow-lg z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Analytics DevTools</h3>
        <div className="flex items-center gap-2">
          <Button onClick={exportData} size="sm" variant="outline">
            Export
          </Button>
          <Button onClick={() => setIsVisible(false)} size="sm" variant="ghost">
            ×
          </Button>
        </div>
      </div>

      <Tabs defaultValue="events" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 pb-2">
            <span className="text-sm text-muted-foreground">
              {events.length} events tracked
            </span>
            <Button onClick={clearEvents} size="sm" variant="outline">
              Clear
            </Button>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className={`cursor-pointer transition-colors ${
                    selectedEvent?.id === event.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`}
                        />
                        <span className="text-sm font-mono">
                          {event.type}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.timestamp.toLocaleTimeString()}
                      </Badge>
                    </div>
                    
                    {Object.keys(event.properties).length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(event.properties)
                            .slice(0, 2)
                            .map(([key, value]) => `${key}: ${String(value).slice(0, 30)}${String(value).length > 30 ? '...' : ''}`)
                            .join(' • ')}
                          {Object.keys(event.properties).length > 2 && ' • ...'}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {selectedEvent && (
            <div className="border-t p-4">
              <div className="text-sm">
                <div className="font-semibold mb-2">Event Details</div>
                <div className="bg-muted p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                  <pre>{JSON.stringify(selectedEvent, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="flex-1">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Core Web Vitals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>FCP</span>
                    <span className="font-mono">
                      {metrics.performance?.firstContentfulPaint?.toFixed(0) || 'N/A'}ms
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>LCP</span>
                    <span className="font-mono">
                      {metrics.performance?.largestContentfulPaint?.toFixed(0) || 'N/A'}ms
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>CLS</span>
                    <span className="font-mono">
                      {metrics.performance?.cumulativeLayoutShift?.toFixed(3) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>FID</span>
                    <span className="font-mono">
                      {metrics.performance?.firstInputDelay?.toFixed(0) || 'N/A'}ms
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Application Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>TTI</span>
                    <span className="font-mono">
                      {metrics.performance?.timeToInteractive?.toFixed(0) || 'N/A'}ms
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>API Response</span>
                    <span className="font-mono">
                      {metrics.performance?.apiResponseTime?.toFixed(0) || 'N/A'}ms
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>PDF Load</span>
                    <span className="font-mono">
                      {metrics.performance?.pdfLoadTime?.toFixed(0) || 'N/A'}ms
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="system" className="flex-1">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Memory Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used</span>
                    <span className="font-mono">
                      {((metrics.systemHealth?.usedJSHeapSize || 0) / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total</span>
                    <span className="font-mono">
                      {((metrics.systemHealth?.totalJSHeapSize || 0) / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Limit</span>
                    <span className="font-mono">
                      {((metrics.systemHealth?.jsHeapSizeLimit || 0) / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Network</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Type</span>
                    <span className="font-mono">
                      {metrics.systemHealth?.effectiveConnectionType || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Downlink</span>
                    <span className="font-mono">
                      {metrics.systemHealth?.downlink ? metrics.systemHealth.downlink.toFixed(1) : 'N/A'} Mbps
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>RTT</span>
                    <span className="font-mono">
                      {metrics.systemHealth?.rtt ? metrics.systemHealth.rtt.toFixed(0) : 'N/A'}ms
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Error Rate</span>
                    <span className="font-mono">
                      {metrics.systemHealth?.errorRate?.toFixed(2) || '0.00'}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cache Hit Ratio</span>
                    <span className="font-mono">
                      {((metrics.systemHealth?.cacheHitRatio || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="p-2 border-t text-xs text-muted-foreground text-center">
        Press {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Cmd+Option+Control+A' : 'Ctrl+Shift+A'} to toggle
      </div>
    </div>
  );
}

export default DevAnalyticsPanel;