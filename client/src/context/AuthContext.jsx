import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastAuthCheck, setLastAuthCheck] = useState(null);

  const checkAuth = useCallback(async (force = false) => {
    // Debounce auth checks - only check if it's been more than 30 seconds
    const now = Date.now();
    if (!force && lastAuthCheck && (now - lastAuthCheck) < 30000) {
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
      setUser({ ...response.data.user, photo: response.data.user.user_photo });
      setLastAuthCheck(now);
    } catch (error) {
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
  }, [lastAuthCheck]);

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