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

  // Enhanced notification display using existing toast system
  const showNotification = useCallback((notification) => {
    const { type, title, message, priority = 'medium' } = notification;
    
    // Get appropriate icon and styling based on type and priority
    let icon = '📢';
    let toastOptions = {
      duration: 4000,
    };

    // Set icon based on notification type
    switch (type) {
      case 'mention':
        icon = '👤';
        break;
      case 'meeting':
        icon = '📅';
        toastOptions.duration = 6000; // Longer for meetings
        break;
      case 'member_joined':
        icon = '👋';
        break;
      case 'notice':
        icon = '📋';
        break;
      case 'task':
        icon = '✅';
        break;
      case 'channel_update':
        icon = '🔄';
        break;
      case 'system':
        icon = '⚙️';
        break;
      case 'success':
        icon = '✅';
        break;
      case 'alert':
        icon = '⚠️';
        break;
      case 'info':
        icon = 'ℹ️';
        break;
      default:
        icon = '📢';
    }

    // Adjust styling based on priority
    if (priority === 'high') {
      toastOptions.duration = 8000; // Longer duration for high priority
      toastOptions.style = {
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
      };
    } else if (priority === 'low') {
      toastOptions.duration = 6000; // Shorter for low priority
      toastOptions.style = {
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        color: '#6b7280',
      };
    }
    
    // Format message
    const notificationMessage = `${title}${message ? `: ${message}` : ''}`;
    
    // Show the toast
    toast(notificationMessage, { 
      icon,
      ...toastOptions
    });
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