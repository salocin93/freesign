/**
 * Client Information Edge Function
 * 
 * This edge function collects client-side information for audit and verification purposes
 * in the document signing workflow. It gathers various pieces of information about the
 * client's environment and location to enhance security and traceability.
 * 
 * Features:
 * - IP address detection
 * - Geolocation data collection
 * - User agent information
 * - Timestamp generation
 * 
 * The function ensures:
 * - CORS compliance
 * - Error handling
 * - Secure data collection
 * - Comprehensive client information
 * 
 * @module get-client-info
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Interface for geolocation data
 * 
 * @interface GeoLocation
 * @property {string} [city] - The city name
 * @property {string} [country] - The country name
 * @property {string} [region] - The region/state name
 * @property {number} [latitude] - The latitude coordinate
 * @property {number} [longitude] - The longitude coordinate
 */
interface GeoLocation {
  city?: string;
  country?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Edge function handler for collecting client information
 * 
 * This function:
 * 1. Handles CORS preflight requests
 * 2. Extracts client IP from various headers
 * 3. Fetches geolocation data from IP
 * 4. Returns comprehensive client information
 * 
 * @param {Request} req - The incoming request object
 * @returns {Response} Response containing client information
 * 
 * @example
 * ```typescript
 * // Response format
 * {
 *   ip: "123.45.67.89",
 *   userAgent: "Mozilla/5.0...",
 *   geolocation: {
 *     city: "New York",
 *     country: "US",
 *     region: "NY",
 *     latitude: 40.7128,
 *     longitude: -74.0060
 *   },
 *   timestamp: "2024-03-15T12:34:56.789Z"
 * }
 * ```
 */
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing client information request');

    // Extract client IP from various headers
    const clientIp = req.headers.get('x-real-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     'unknown';

    console.log('Client IP:', clientIp);

    // Get geolocation data from IP
    let geolocation: GeoLocation = {};
    try {
      console.log('Fetching geolocation data...');
      const geoResponse = await fetch(`https://ipapi.co/${clientIp}/json/`);
      geolocation = await geoResponse.json();
      console.log('Geolocation data received:', geolocation);
    } catch (error) {
      console.error('Error getting geolocation:', error);
    }

    // Prepare response data
    const response = {
      ip: clientIp,
      userAgent: req.headers.get('user-agent'),
      geolocation,
      timestamp: new Date().toISOString(),
    };

    console.log('Sending client information response:', {
      ip: response.ip,
      userAgent: response.userAgent,
      timestamp: response.timestamp,
      geolocation: response.geolocation,
    });

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error processing client information:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      },
    )
  }
}) 