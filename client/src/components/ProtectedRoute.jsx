import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, checkAuth } = useAuth();

  useEffect(() => {
    const verifyAuth = async () => {
      if (!user) {
        await checkAuth(); // Check authentication status if user is not present
      }
    };
    verifyAuth();
  }, [user, checkAuth]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
