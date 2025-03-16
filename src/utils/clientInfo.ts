/**
 * Client Information Utility Module
 * 
 * This module provides functionality to gather client-side information for audit
 * and verification purposes in document signing workflows. It collects various
 * pieces of information about the client's environment and location to enhance
 * the security and traceability of digital signatures.
 * 
 * Features:
 * - Timestamp collection
 * - User agent detection
 * - IP address detection (when available)
 * - Geolocation data (with user permission)
 * 
 * @module ClientInfo
 */

/**
 * Gets comprehensive client information for audit and verification purposes.
 * This function attempts to gather various pieces of information about the client's
 * environment, including timestamp, user agent, IP address, and geolocation.
 * 
 * @returns {Promise<{
 *   timestamp: string,
 *   userAgent: string,
 *   ip: string,
 *   geolocation: {
 *     latitude: number | null,
 *     longitude: number | null,
 *     accuracy: number | null
 *   }
 * }>} An object containing client information
 * 
 * @throws {Error} If there are issues accessing geolocation services
 * 
 * @example
 * ```typescript
 * const clientInfo = await getClientInfo();
 * console.log(clientInfo.timestamp); // "2024-03-15T12:34:56.789Z"
 * console.log(clientInfo.geolocation.latitude); // 51.5074 (if available)
 * ```
 */
export const getClientInfo = async () => {
  const timestamp = new Date().toISOString();
  const userAgent = navigator.userAgent;
  
  // Default to empty IP when it can't be determined
  let ip = '';
  
  // Try to get client IP from an API (won't work on localhost)
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    ip = data.ip;
  } catch (error) {
    console.warn('Could not determine client IP address', error);
  }

  // Default geolocation
  const geolocation = {
    latitude: null,
    longitude: null,
    accuracy: null
  };

  // Try to get geolocation if available in browser
  if (navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 60000
        });
      });

      geolocation.latitude = position.coords.latitude;
      geolocation.longitude = position.coords.longitude;
      geolocation.accuracy = position.coords.accuracy;
    } catch (error) {
      console.warn('Geolocation permission denied or unavailable', error);
    }
  }

  return {
    timestamp,
    userAgent,
    ip,
    geolocation
  };
};
