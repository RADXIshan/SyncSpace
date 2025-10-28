import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);
  const navigate = useNavigate();

  const validateEmail = (val) => !/^\S+@\S+\.\S+$/.test(val);

  const handleChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setError(validateEmail(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (error) return;
    setLoading(true);
    let toastId;
    try {
      toastId = toast.loading("Sending reset link...");
      
      // Add timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/auth/forgot-password`, 
        { email }, 
        { 
          withCredentials: true,
          signal: controller.signal,
          timeout: 30000
        }
      );
      
      clearTimeout(timeoutId);
      toast.success("Reset link sent! Check your email.", { id: toastId });
      navigate("/login");
    } catch (err) {
      let errorMessage = "Failed to send reset link";
      
      if (err.code === 'ECONNABORTED' || err.name === 'AbortError') {
        errorMessage = "Request timeout. Please check your connection and try again.";
      } else if (err.response?.status === 504) {
        errorMessage = "Server timeout. Please try again in a moment.";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      toast.error(errorMessage, { id: toastId });
      console.error("Forgot password error:", err);
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
              onClick={() => window.location.href = "/"}
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

            {/* Back to login */}
            <Link
              to="/login"
              className="glass px-4 py-2 text-white/90 font-medium rounded-xl hover:text-white transition-colors duration-300 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 text-sm font-medium text-white/90 mb-6">
            <Mail className="w-4 h-4 text-purple-400" />
            Password Recovery
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Forgot Your
            <span className="block gradient-text-purple">Password?</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Enter your registered email address and we'll send you a password reset link.
          </p>
        </div>

        <form className="glass rounded-3xl p-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={`w-full px-4 py-3 glass-dark rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all duration-200 ${
                error && email ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""
              }`}
              required
            />
            {error && email && (
              <p className="mt-2 text-sm text-red-400">Please enter a valid email address</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full glass-button px-6 py-4 text-white font-semibold rounded-xl flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading || error}
          >
            {loading ? "Sending..." : (
              <>
                Send Reset Link
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-white/70">
              Remembered your password?{" "}
              <Link
                to="/login"
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-200 hover:underline"
              >
                Back to Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;