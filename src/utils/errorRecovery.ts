/**
 * Error Recovery Utilities
 * 
 * Utilities for handling network failures, offline scenarios, and providing
 * robust error recovery mechanisms for the FreeSign application.
 * 
 * Features:
 * - Network status monitoring
 * - Offline queue management
 * - Retry mechanisms with exponential backoff
 * - Data persistence for offline operations
 * - Automatic recovery when connection is restored
 */

export interface OfflineOperation {
  id: string;
  type: 'signature' | 'document_upload' | 'email_send' | 'recipient_add';
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface NetworkStatus {
  isOnline: boolean;
  lastChecked: number;
  connectionType?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

class ErrorRecoveryManager {
  private offlineQueue: OfflineOperation[] = [];
  private networkStatus: NetworkStatus = {
    isOnline: navigator.onLine,
    lastChecked: Date.now()
  };
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();

  constructor() {
    this.initializeNetworkMonitoring();
    this.loadOfflineQueue();
  }

  /**
   * Initialize network status monitoring
   */
  private initializeNetworkMonitoring() {
    // Monitor online/offline events
    window.addEventListener('online', () => this.updateNetworkStatus(true));
    window.addEventListener('offline', () => this.updateNetworkStatus(false));

    // Monitor connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
      connection.addEventListener('change', () => {
        this.updateNetworkStatus(navigator.onLine);
      });
    }

    // Periodic network check
    setInterval(() => {
      this.checkNetworkStatus();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Update network status and notify listeners
   */
  private updateNetworkStatus(isOnline: boolean) {
    const connectionType = this.getConnectionType();
    
    this.networkStatus = {
      isOnline,
      lastChecked: Date.now(),
      connectionType
    };

    this.notifyListeners();

    // Process offline queue when coming back online
    if (isOnline) {
      this.processOfflineQueue();
    }
  }

  /**
   * Get connection type if available
   */
  private getConnectionType(): NetworkStatus['connectionType'] {
    if ('connection' in navigator) {
      const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
      if (connection.effectiveType) {
        return connection.type || 'unknown';
      }
    }
    return 'unknown';
  }

  /**
   * Check network status by making a lightweight request
   */
  private async checkNetworkStatus() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.updateNetworkStatus(true);
    } catch (error) {
      this.updateNetworkStatus(false);
    }
  }

  /**
   * Add a listener for network status changes
   */
  public addNetworkListener(listener: (status: NetworkStatus) => void) {
    this.listeners.add(listener);
    // Immediately call with current status
    listener(this.networkStatus);
  }

  /**
   * Remove a network status listener
   */
  public removeNetworkListener(listener: (status: NetworkStatus) => void) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of network status changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.networkStatus);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  /**
   * Get current network status
   */
  public getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  /**
   * Add operation to offline queue
   */
  public addToOfflineQueue(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>) {
    const offlineOperation: OfflineOperation = {
      ...operation,
      id: this.generateOperationId(),
      timestamp: Date.now(),
      retryCount: 0
    };

    this.offlineQueue.push(offlineOperation);
    this.saveOfflineQueue();
  }

  /**
   * Process offline queue when network is restored
   */
  private async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    console.log(`Processing ${this.offlineQueue.length} offline operations`);

    const operationsToProcess = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const operation of operationsToProcess) {
      try {
        await this.processOperation(operation);
      } catch (error) {
        console.error('Failed to process offline operation:', error);
        // Re-add to queue if retries remaining
        if (operation.retryCount < operation.maxRetries) {
          operation.retryCount++;
          this.offlineQueue.push(operation);
        }
      }
    }

    this.saveOfflineQueue();
  }

  /**
   * Process a single offline operation
   */
  private async processOperation(operation: OfflineOperation) {
    switch (operation.type) {
      case 'signature':
        await this.processSignatureOperation(operation);
        break;
      case 'document_upload':
        await this.processDocumentUploadOperation(operation);
        break;
      case 'email_send':
        await this.processEmailSendOperation(operation);
        break;
      case 'recipient_add':
        await this.processRecipientAddOperation(operation);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Process signature operation
   */
  private async processSignatureOperation(operation: OfflineOperation) {
    // Implementation would depend on your API structure
    const response = await fetch('/api/signatures', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operation.data)
    });

    if (!response.ok) {
      throw new Error(`Signature operation failed: ${response.statusText}`);
    }
  }

  /**
   * Process document upload operation
   */
  private async processDocumentUploadOperation(operation: OfflineOperation) {
    // Implementation would depend on your API structure
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operation.data)
    });

    if (!response.ok) {
      throw new Error(`Document upload failed: ${response.statusText}`);
    }
  }

  /**
   * Process email send operation
   */
  private async processEmailSendOperation(operation: OfflineOperation) {
    // Implementation would depend on your API structure
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operation.data)
    });

    if (!response.ok) {
      throw new Error(`Email send failed: ${response.statusText}`);
    }
  }

  /**
   * Process recipient add operation
   */
  private async processRecipientAddOperation(operation: OfflineOperation) {
    // Implementation would depend on your API structure
    const response = await fetch('/api/recipients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operation.data)
    });

    if (!response.ok) {
      throw new Error(`Recipient add failed: ${response.statusText}`);
    }
  }

  /**
   * Save offline queue to localStorage
   */
  private saveOfflineQueue() {
    try {
      localStorage.setItem('freesign_offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Load offline queue from localStorage
   */
  private loadOfflineQueue() {
    try {
      const saved = localStorage.getItem('freesign_offline_queue');
      if (saved) {
        this.offlineQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get offline queue status
   */
  public getOfflineQueueStatus() {
    return {
      count: this.offlineQueue.length,
      operations: this.offlineQueue.map(op => ({
        id: op.id,
        type: op.type,
        timestamp: op.timestamp,
        retryCount: op.retryCount
      }))
    };
  }

  /**
   * Clear offline queue
   */
  public clearOfflineQueue() {
    this.offlineQueue = [];
    this.saveOfflineQueue();
  }

  /**
   * Set retry configuration
   */
  public setRetryConfig(config: Partial<RetryConfig>) {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Execute function with retry logic
   */
  public async withRetry<T>(
    fn: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig = { ...this.retryConfig, ...config };
    let lastError: Error;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retryConfig.maxRetries) {
          break;
        }

        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt),
          retryConfig.maxDelay
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// Create singleton instance
export const errorRecoveryManager = new ErrorRecoveryManager();

/**
 * Hook for network status
 */
export function useNetworkStatus() {
  const [status, setStatus] = React.useState<NetworkStatus>(errorRecoveryManager.getNetworkStatus());

  React.useEffect(() => {
    const listener = (newStatus: NetworkStatus) => setStatus(newStatus);
    errorRecoveryManager.addNetworkListener(listener);
    return () => errorRecoveryManager.removeNetworkListener(listener);
  }, []);

  return status;
}

/**
 * Hook for offline queue status
 */
export function useOfflineQueue() {
  const [queueStatus, setQueueStatus] = React.useState(errorRecoveryManager.getOfflineQueueStatus());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setQueueStatus(errorRecoveryManager.getOfflineQueueStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return queueStatus;
}

// Export React for the hooks
import * as React from 'react'; 