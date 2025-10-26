import { useState } from "react";
import {
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  ArrowRight,
  Sparkles,
  LogIn,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [showPassword, setShowPassword] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [validation, setValidation] = useState({
    email: { isValid: false, message: "", touched: false },
    password: { isValid: false, message: "", touched: false },
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const { showError, showSuccess, showLoading } = useToast();

  const validateField = (name, value) => {
    let isValid = false;
    let message = "";

    switch (name) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          message = "Email is required";
        } else if (!emailRegex.test(value.trim())) {
          message = "Please enter a valid email address";
        } else {
          isValid = true;
          message = "Valid email format";
        }
        break;
      case "password":
        if (!value) {
          message = "Password is required";
        } else if (value.length < 6) {
          message = "Password must be at least 6 characters";
        } else {
          isValid = true;
          message = "Password format is valid";
        }
        break;
    }

    return { isValid, message };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    const { isValid, message } = validateField(name, value);
    setValidation((prev) => ({
      ...prev,
      [name]: { isValid, message, touched: true },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      email: formData.email,
      password: formData.password,
    };
    const toastId = showLoading("Logging in...");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/auth/login`,
        payload,
        { withCredentials: true }
      );
      // Persist token for fallback authentication
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
      }
      await checkAuth();
      navigate("/home", {
        state: {
          message: "Login Successful",
        },
      });
      showSuccess("Login Successful", { id: toastId });
    } catch (err) {
      showError(
        err.response?.data?.error || err.response?.data?.message || err.message,
        { id: toastId }
      );
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen cosmic-bg relative overflow-hidden flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/3 to-blue-500/3 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <div className="absolute top-0 left-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Brand */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => (window.location.href = "/")}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/icon.png"
                  alt="SyncSpace Logo"
                  className="w-10 h-10 rounded-2xl"
                />
              </div>
              <h1 className="text-xl font-bold tracking-tight gradient-text-purple">
                SyncSpace
              </h1>
            </div>

            {/* Sign up link */}
            <Link
              to="/signup"
              className="glass px-4 py-2 text-white/90 font-medium rounded-xl hover:text-white transition-colors duration-300 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 text-sm font-medium text-white/90 mb-6">
            <LogIn className="w-4 h-4 text-purple-400" />
            Welcome Back
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Sign In to
            <span className="block gradient-text-purple">SyncSpace</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Access your collaborative workspace and continue where you left off
          </p>
        </div>

        <form
          className="glass rounded-3xl p-8 space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  className={`w-full px-4 py-3 glass-dark rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all duration-200 pr-10 ${
                    validation.email.touched
                      ? validation.email.isValid
                        ? "border-green-500/50 focus:border-green-500 focus:ring-green-500"
                        : "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  value={formData.email}
                  onChange={handleChange}
                />
                {validation.email.touched && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validation.email.isValid ? (
                      <Check size={20} className="text-green-400" />
                    ) : (
                      <X size={20} className="text-red-400" />
                    )}
                  </div>
                )}
              </div>
              {validation.email.touched && (
                <div
                  className={`flex items-center mt-2 text-sm ${
                    validation.email.isValid ? "text-green-400" : "text-red-400"
                  }`}
                >
                  <AlertCircle size={16} className="mr-1" />
                  {validation.email.message}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "password" : "text"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 glass-dark rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all duration-200 pr-20 ${
                    validation.password.touched
                      ? validation.password.isValid
                        ? "border-green-500/50 focus:border-green-500 focus:ring-green-500"
                        : "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  value={formData.password}
                  onChange={handleChange}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  {validation.password.touched &&
                    (validation.password.isValid ? (
                      <Check size={20} className="text-green-400" />
                    ) : (
                      <X size={20} className="text-red-400" />
                    ))}
                  <button
                    type="button"
                    className="text-white/60 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              {validation.password.touched && (
                <div
                  className={`flex items-center mt-2 text-sm ${
                    validation.password.isValid
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  <AlertCircle size={16} className="mr-1" />
                  {validation.password.message}
                </div>
              )}
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full glass-button px-6 py-4 text-white font-semibold rounded-xl flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              disabled={
                !validation.email.isValid ||
                !validation.password.isValid ||
                loading
              }
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-white/70">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-200 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
