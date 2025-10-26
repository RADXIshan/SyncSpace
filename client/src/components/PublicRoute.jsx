import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  console.log("PublicRoute - user:", user, "loading:", loading);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">Loading...</div>
    );
  }

  // If user is authenticated, redirect them to home/dashboard
  if (user) {
    console.log("User authenticated, redirecting to /home/dashboard");
    return <Navigate to="/home/dashboard" replace />;
  }

  // Otherwise, render the public page
  console.log("No user, rendering public page");
  return children;
};

export default PublicRoute;