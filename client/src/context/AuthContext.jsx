import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastAuthCheckRef = useRef(null);

  const checkAuth = useCallback(async (force = false) => {
    // Debounce auth checks - only check if it's been more than 30 seconds, unless forced
    const now = Date.now();
    if (!force && lastAuthCheckRef.current && (now - lastAuthCheckRef.current) < 30000) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/auth/getMe`,
        {},
        { withCredentials: true }
      );
      const userData = { ...response.data.user, photo: response.data.user.user_photo };
      setUser(userData);
      lastAuthCheckRef.current = now;
    } catch (error) {
      // Handle email verification requirement
      if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
        // Don't clear the token, but don't set user either
        // This allows the verification process to continue
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Only log error if it's not a 401 (which is expected when not authenticated)
      if (error.response?.status !== 401) {
        console.error("Authentication check failed:", error);
      }
      setUser(null);
      // Clear invalid token
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
      }
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array to prevent recreation

  useEffect(() => {
    checkAuth(true); // Force initial check
  }, [checkAuth]);

  const logout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      setUser(null);
      localStorage.removeItem("token"); // Clear token from localStorage
      
      // Force page reload to clear any cached state
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if the server request fails, clear local state
      setUser(null);
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;