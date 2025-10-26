import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, checkAuth } = useAuth();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!user && !hasChecked) {
        await checkAuth(); // Only check once if user is not present
        setHasChecked(true);
      }
    };
    verifyAuth();
  }, [user, hasChecked]); // Removed checkAuth from dependencies since it's now stable

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
