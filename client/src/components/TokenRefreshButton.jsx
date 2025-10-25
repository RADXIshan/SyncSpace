import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { refreshTokenOnServer, getTokenInfo } from '../utils/tokenUtils';

const TokenRefreshButton = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Check if token needs refresh
  const token = localStorage.getItem('token');
  const tokenInfo = getTokenInfo(token);
  const needsRefresh = !tokenInfo?.hasRequiredFields || tokenInfo?.isExpired;
  
  if (!needsRefresh) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    let toastId;
    
    try {
      toastId = toast.loading('Refreshing authentication...');
      await refreshTokenOnServer();
      toast.success('Authentication refreshed successfully', { id: toastId });
      
      // Reload the page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Token refresh failed:', error);
      toast.error('Failed to refresh authentication. Please log out and log back in.', { id: toastId });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-900/90 border border-yellow-500/50 rounded-lg px-4 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="text-yellow-400">
          <span className="text-sm">Authentication needs update</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-sm rounded transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default TokenRefreshButton;