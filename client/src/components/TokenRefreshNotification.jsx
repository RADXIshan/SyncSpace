import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const TokenRefreshNotification = () => {
  const [status, setStatus] = useState(null); // null, 'refreshing', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Listen for token refresh events
    const handleTokenRefresh = (event) => {
      const { type, message } = event.detail;
      setStatus(type);
      setMessage(message);
      
      // Auto-hide success/error messages after 3 seconds
      if (type === 'success' || type === 'error') {
        setTimeout(() => {
          setStatus(null);
          setMessage('');
        }, 3000);
      }
    };

    window.addEventListener('tokenRefresh', handleTokenRefresh);
    
    return () => {
      window.removeEventListener('tokenRefresh', handleTokenRefresh);
    };
  }, []);

  if (!status) return null;

  const getIcon = () => {
    switch (status) {
      case 'refreshing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'refreshing':
        return 'bg-blue-900/90 border-blue-500/50';
      case 'success':
        return 'bg-green-900/90 border-green-500/50';
      case 'error':
        return 'bg-red-900/90 border-red-500/50';
      default:
        return 'bg-gray-900/90 border-gray-500/50';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${getBackgroundColor()} border rounded-lg px-4 py-2 backdrop-blur-sm transition-all duration-300`}>
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="text-sm text-white">{message}</span>
      </div>
    </div>
  );
};

export default TokenRefreshNotification;