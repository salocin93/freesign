
/**
 * Gets client information for audit and verification purposes
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
