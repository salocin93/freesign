/**
 * NetworkStatusIndicator Component
 * 
 * A component that displays the current network status and provides information
 * about offline operations. This component helps users understand the connection
 * state and any pending operations.
 * 
 * Features:
 * - Real-time network status display
 * - Offline queue status
 * - Connection type indicator
 * - Visual feedback for different states
 * - Manual retry options
 */

import { useNetworkStatus, useOfflineQueue, errorRecoveryManager } from '@/utils/errorRecovery';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useState } from 'react';

export function NetworkStatusIndicator() {
  const networkStatus = useNetworkStatus();
  const offlineQueue = useOfflineQueue();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryAll = async () => {
    setIsRetrying(true);
    try {
      // Force network check and queue processing
      await errorRecoveryManager.withRetry(async () => {
        // This will trigger the network check and queue processing
        return Promise.resolve();
      });
    } catch (error) {
      console.error('Failed to retry operations:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const getConnectionIcon = () => {
    switch (networkStatus.connectionType) {
      case 'wifi':
        return <Wifi className="h-4 w-4" />;
      case 'cellular':
        return <Smartphone className="h-4 w-4" />;
      case 'ethernet':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    if (!networkStatus.isOnline) return 'destructive';
    if (offlineQueue.count > 0) return 'warning';
    return 'default';
  };

  const getStatusIcon = () => {
    if (!networkStatus.isOnline) return <WifiOff className="h-4 w-4" />;
    if (offlineQueue.count > 0) return <Clock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  // Don't show if everything is fine
  if (networkStatus.isOnline && offlineQueue.count === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {getStatusIcon()}
            Network Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <span className="text-sm">
                {networkStatus.isOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
            <Badge variant={getStatusColor()}>
              {networkStatus.connectionType || 'unknown'}
            </Badge>
          </div>

          {/* Offline Queue Status */}
          {offlineQueue.count > 0 && (
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    {offlineQueue.count} operation{offlineQueue.count !== 1 ? 's' : ''} pending
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryAll}
                    disabled={isRetrying || !networkStatus.isOnline}
                    className="ml-2"
                  >
                    {isRetrying ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Retry
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Offline Operations List */}
          {offlineQueue.count > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600">Pending Operations:</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {offlineQueue.operations.slice(0, 3).map((op) => (
                  <div key={op.id} className="flex items-center justify-between text-xs">
                    <span className="capitalize">{op.type.replace('_', ' ')}</span>
                    <Badge variant="outline" className="text-xs">
                      {op.retryCount} retries
                    </Badge>
                  </div>
                ))}
                {offlineQueue.count > 3 && (
                  <p className="text-xs text-gray-500">
                    +{offlineQueue.count - 3} more operations
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Last Check */}
          <div className="text-xs text-gray-500">
            Last checked: {new Date(networkStatus.lastChecked).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
