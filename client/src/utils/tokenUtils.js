// Utility functions for JWT token management

export const decodeToken = (token) => {
  try {
    if (!token) return null;
    
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const isTokenValid = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return false;
  
  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp && decoded.exp < now) {
    return false;
  }
  
  // Check if token has required fields
  return !!(decoded.userId && decoded.email);
};

export const getTokenInfo = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  return {
    userId: decoded.userId,
    email: decoded.email,
    name: decoded.name,
    expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : null,
    isExpired: decoded.exp ? decoded.exp < Math.floor(Date.now() / 1000) : false,
    hasRequiredFields: !!(decoded.userId && decoded.email)
  };
};

export const shouldRefreshToken = (token) => {
  const info = getTokenInfo(token);
  if (!info) return true;
  
  // Refresh if token is expired
  if (info.isExpired) return true;
  
  // Refresh if token is missing required fields (email or name)
  if (!info.hasRequiredFields) return true;
  
  return false;
};

// Function to refresh token on the server
export const refreshTokenOnServer = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    // Update localStorage with new token
    localStorage.setItem('token', data.token);
    
    console.log('✅ Token refreshed successfully');
    return data;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    // Clear invalid token
    localStorage.removeItem('token');
    throw error;
  }
};