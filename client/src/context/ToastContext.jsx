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

  // Notification toast for real-time updates
  const showNotification = useCallback((notification) => {
    const { type, title, message, priority = 'medium' } = notification;
    
    let icon = '🔔';
    let duration = 4000;
    
    switch (type) {
      case 'mention':
        icon = '💬';
        duration = 6000;
        break;
      case 'meeting':
        icon = '📅';
        duration = 8000;
        break;
      case 'member_joined':
        icon = '👋';
        break;
      case 'notice':
        icon = '📢';
        duration = 6000;
        break;
      case 'task':
        icon = '✅';
        break;
      case 'channel_update':
        icon = '🔄';
        break;
      default:
        icon = '🔔';
    }

    if (priority === 'high') {
      duration = 10000;
    }

    toast(
      (t) => (
        <div className="flex items-start gap-3 max-w-sm">
          <span className="text-lg">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{title}</p>
            <p className="text-gray-600 text-xs mt-1 line-clamp-2">{message}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-gray-400 hover:text-gray-600 ml-2"
          >
            ×
          </button>
        </div>
      ),
      {
        duration,
        position: 'top-center',
        style: {
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          minWidth: '300px',
          textAlign: 'center',
        },
      }
    );
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