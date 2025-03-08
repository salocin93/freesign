import { supabase } from '@/lib/supabase';

interface ClientInfo {
  ip: string;
  userAgent: string;
  geolocation: {
    city?: string;
    country?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
  };
  timestamp: string;
}

export async function getClientInfo(): Promise<ClientInfo> {
  try {
    const { data, error } = await supabase.functions.invoke('get-client-info', {
      method: 'GET',
    });

    if (error) throw error;

    return data as ClientInfo;
  } catch (error) {
    console.error('Error getting client info:', error);
    return {
      ip: 'unknown',
      userAgent: navigator.userAgent,
      geolocation: {},
      timestamp: new Date().toISOString(),
    };
  }
} 