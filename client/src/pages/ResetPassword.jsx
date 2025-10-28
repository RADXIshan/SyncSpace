import { useState } from "react";
import { Eye, EyeOff, Shield, ArrowRight } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import axios from "axios";
import { toast } from "react-hot-toast";

const ResetPassword = () => {
  const { email } = useParams();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    password: true,
    confirmPassword: true,
  });

  const validatePassword = (val) => {
    // Backend regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return !passwordRegex.test(val);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      const invalid = validatePassword(value);
      setErrors((prev) => ({ ...prev, password: invalid, confirmPassword: prev.confirmPassword || value !== formData.confirmPassword }));
    } else if (name === "confirmPassword") {
      const mismatch = value !== formData.password;
      setErrors((prev) => ({ ...prev, confirmPassword: mismatch }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.values(errors).some(Boolean)) return;
    setLoading(true);
    let toastId;
    try {
      toastId = toast.loading("Resetting password...");
      
      // Add timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/auth/reset-password/${email}`, 
        { password: formData.password }, 
        { 
          withCredentials: true,
          signal: controller.signal,
          timeout: 30000
        }
      );
      
      clearTimeout(timeoutId);
      toast.success("Password reset successful! Please login with your new password.", { id: toastId });
      navigate("/login");
    } catch (err) {
      let errorMessage = "Failed to reset password";
      
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
      console.error("Reset password error:", err);
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
          <div className="flex items-center justify-center py-4">
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 text-sm font-medium text-white/90 mb-6">
            <Shield className="w-4 h-4 text-purple-400" />
            Secure Reset
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Reset Your
            <span className="block gradient-text-purple">Password</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Enter your new password below to secure your account.
          </p>
        </div>

        <form className="glass rounded-3xl p-8 space-y-6" onSubmit={handleSubmit}>
          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "password" : "text"}
                id="password"
                name="password"
                placeholder="Enter new password"
                className={`w-full px-4 py-3 glass-dark rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all duration-200 pr-12 ${
                  errors.password && formData.password ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""
                }`}
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && formData.password && (
              <p className="mt-2 text-sm text-red-400">
                Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "password" : "text"}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm new password"
                className={`w-full px-4 py-3 glass-dark rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all duration-200 pr-12 ${
                  errors.confirmPassword && formData.confirmPassword ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : ""
                }`}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && formData.confirmPassword && (
              <p className="mt-2 text-sm text-red-400">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full glass-button px-6 py-4 text-white font-semibold rounded-xl flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading || Object.values(errors).some(Boolean)}
          >
            {loading ? "Resetting..." : (
              <>
                Reset Password
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;