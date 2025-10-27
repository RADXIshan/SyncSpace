import { useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { Mail, ArrowRight, RefreshCw } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const VerifyMail = () => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputs = useRef([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth, user } = useAuth();
  const email = location.state?.email || user?.email;

  // Handle input change
  const handleChange = (e, idx) => {
    const raw = e.target.value.replace(/[^0-9]/g, ""); // only digits
    const newOtp = [...otp];

    if (!raw) {
      newOtp[idx] = "";
      setOtp(newOtp);
      if (idx > 0) inputs.current[idx - 1]?.focus();
      return;
    }

    newOtp[idx] = raw[0]; // only first digit if multiple pasted
    setOtp(newOtp);

    if (idx < 5) inputs.current[idx + 1]?.focus();
  };

  // Handle backspace key
  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);

    const nextIndex = pasted.length >= 6 ? 5 : pasted.length;
    inputs.current[nextIndex]?.focus();
  };

  // Submit OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
  
    if (code.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }
  
    setLoading(true);
    let toastId;
    try {
      toastId = toast.loading("Verifying email...");
      // Get token from localStorage if you stored it there during signup
      const token = localStorage.getItem("token");
      
      // Add timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/auth/verify-mail`,
        { otp: code, token }, 
        { 
          withCredentials: true,
          signal: controller.signal,
          timeout: 15000
        }
      );
      
      clearTimeout(timeoutId);
  
      toast.success("Email verified successfully", { id: toastId });
      // Force auth check to update user state
      await checkAuth(true);
      navigate("/home/dashboard", { state: { message: "Welcome! Your email has been verified." } });
    } catch (err) {
      let errorMessage = "Failed to verify OTP";
      
      if (err.code === 'ECONNABORTED' || err.name === 'AbortError') {
        errorMessage = "Verification timeout. Please try again.";
      } else if (err.response?.status === 504) {
        errorMessage = "Server timeout. Please try again.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      toast.error(errorMessage, { id: toastId });
      console.error("OTP verify error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    let toastId;
    try {
      toastId = toast.loading("Resending OTP...");
      
      // Add timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/auth/resend-otp`, 
        { email }, 
        { 
          withCredentials: true,
          signal: controller.signal,
          timeout: 15000
        }
      );
      
      clearTimeout(timeoutId);
      toast.success("OTP resent successfully! Please check your email.", { id: toastId });
    } catch (err) {
      let errorMessage = "Failed to resend OTP";
      
      if (err.code === 'ECONNABORTED' || err.name === 'AbortError') {
        errorMessage = "Request timeout. Please try again.";
      } else if (err.response?.status === 504) {
        errorMessage = "Server timeout. Please try again.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      toast.error(errorMessage, { id: toastId });
      console.error("Resend OTP error:", err);
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

            {/* Back to signup */}
            <Link
              to="/signup"
              className="glass px-4 py-2 text-white/90 font-medium rounded-xl hover:text-white transition-colors duration-300"
            >
              Back to Signup
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 text-sm font-medium text-white/90 mb-6">
            <Mail className="w-4 h-4 text-purple-400" />
            Email Verification
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Verify Your
            <span className="block gradient-text-purple">Email</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Enter the 6-digit code we've sent to your email address
          </p>
          {email && (
            <p className="text-sm text-purple-300 mt-2 font-medium">{email}</p>
          )}
        </div>

        <form className="glass rounded-3xl p-8 space-y-6" onSubmit={handleSubmit}>
          <div className="flex justify-center gap-3 mb-8">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputs.current[idx] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(e, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onPaste={handlePaste}
                className="w-12 h-12 sm:w-14 sm:h-14 text-center glass-dark rounded-xl text-white text-xl sm:text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all duration-200"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-button px-6 py-4 text-white font-semibold rounded-xl flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : (
              <>
                Verify Email
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="text-center space-y-4">
            <p className="text-white/70">
              Didn't get the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-200 hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Resend
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyMail;
