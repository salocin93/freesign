import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface GeoLocation {
  city?: string;
  country?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const clientIp = req.headers.get('x-real-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     'unknown';

    // Get geolocation data from IP (you could use a service like ipapi.co here)
    let geolocation: GeoLocation = {};
    try {
      const geoResponse = await fetch(`https://ipapi.co/${clientIp}/json/`);
      geolocation = await geoResponse.json();
    } catch (error) {
      console.error('Error getting geolocation:', error);
    }

    const response = {
      ip: clientIp,
      userAgent: req.headers.get('user-agent'),
      geolocation,
      timestamp: new Date().toISOString(),
    };

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