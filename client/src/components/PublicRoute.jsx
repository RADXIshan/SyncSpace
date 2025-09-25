import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">Loading...</div>
    );
  }

  // If user is authenticated, redirect them to home/dashboard
  if (user) {
    return <Navigate to="/home/dashboard" />;
  }

  // Otherwise, render the public page
  return children;
};

export default PublicRoute;