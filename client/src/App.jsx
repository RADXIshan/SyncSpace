import { Routes, Route } from "react-router";
import { Toaster } from "react-hot-toast";
import "./utils/axiosConfig";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Landing from "./pages/Landing";
import VerifyMail from "./pages/VerifyMail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MeetingPrep from "./pages/MeetingPrep";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ToastProvider } from "./context/ToastContext";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import MeetingRoom from "./components/MeetingRoom";
import MeetingInvite from "./components/MeetingInvite";
import ErrorBoundary from "./components/ErrorBoundary";

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <ErrorBoundary>
          <SocketProvider>
            <NotificationProvider>
              <div>
                <Toaster
                  position="top-right"
                  reverseOrder={false}
                  gutter={8}
                  containerClassName=""
                  containerStyle={{
                    top: 20,
                    right: 20,
                  }}
                  toastOptions={{
                    // Default options for all toasts
                    duration: 4000,
                    style: {
                      background: "#fff",
                      color: "#363636",
                    },
                    // Default options for specific types
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: "#10b981",
                        secondary: "#fff",
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: "#ef4444",
                        secondary: "#fff",
                      },
                    },
                    loading: {
                      iconTheme: {
                        primary: "#6366f1",
                        secondary: "#fff",
                      },
                    },
                  }}
                />
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/signup"
                    element={
                      <PublicRoute>
                        <Signup />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/verify-email"
                    element={
                      <PublicRoute>
                        <VerifyMail />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/forgot-password"
                    element={
                      <PublicRoute>
                        <ForgotPassword />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/reset-password/:email"
                    element={<ResetPassword />}
                  />
                  <Route
                    path="/meeting-prep/:meetingId"
                    element={
                      <ProtectedRoute>
                        <MeetingPrep />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/meeting/:roomId" element={<MeetingRoom />} />
                  <Route
                    path="/invite/:meetingId"
                    element={<MeetingInvite />}
                  />

                  <Route
                    path="/home/*"
                    element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </div>
            </NotificationProvider>
          </SocketProvider>
        </ErrorBoundary>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
