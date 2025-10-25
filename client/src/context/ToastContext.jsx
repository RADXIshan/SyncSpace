import { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [lastAuthError, setLastAuthError] = useState(null);
  const [authErrorCount, setAuthErrorCount] = useState(0);

  // Debounced authentication error handler
  const showAuthError = useCallback((message) => {
    const now = Date.now();
    
    // Only show auth error if:
    // 1. It's been more than 30 seconds since last auth error
    // 2. Or it's a different error message
    // 3. And we haven't shown more than 3 auth errors in the last 5 minutes
    if (
      !lastAuthError || 
      now - lastAuthError.timestamp > 30000 || 
      lastAuthError.message !== message
    ) {
      // Reset counter if it's been more than 5 minutes
      if (!lastAuthError || now - lastAuthError.timestamp > 300000) {
        setAuthErrorCount(1);
      } else {
        setAuthErrorCount(prev => prev + 1);
      }

      // Only show toast if we haven't exceeded the limit
      if (authErrorCount < 3) {
        toast.error(message, {
          id: 'auth-error', // Use same ID to prevent duplicates
          duration: 4000,
        });
      }

      setLastAuthError({ message, timestamp: now });
    }
  }, [lastAuthError, authErrorCount]);

  // Regular toast methods
  const showSuccess = useCallback((message, options = {}) => {
    toast.success(message, options);
  }, []);

  const showError = useCallback((message, options = {}) => {
    toast.error(message, options);
  }, []);

  const showInfo = useCallback((message, options = {}) => {
    toast(message, { icon: 'ℹ️', ...options });
  }, []);

  const showLoading = useCallback((message, options = {}) => {
    return toast.loading(message, options);
  }, []);

  // Simple notification display using existing toast system
  const showNotification = useCallback((notification) => {
    const { type, title, message, priority = 'medium' } = notification;
    
    // Format message
    const notificationMessage = `${title}: ${message}`;
    toast(notificationMessage, { icon: '📢' });
  }, []);

  const value = {
    showSuccess,
    showError,
    showInfo,
    showLoading,
    showAuthError,
    showNotification,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export default ToastContext;