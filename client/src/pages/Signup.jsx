import { useState } from "react";
import { Eye, EyeOff, Check, X, AlertCircle, ArrowRight, Sparkles, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import { toast } from "react-hot-toast";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Track validation state with detailed feedback
  const [validation, setValidation] = useState({
    name: { isValid: false, message: "", touched: false },
    email: { isValid: false, message: "", touched: false },
    password: { isValid: false, message: "", touched: false, requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }}
  });

  const validateField = (name, value) => {
    let isValid = false;
    let message = "";
    let requirements = {};
    
    switch (name) {
      case "name":
        if (!value.trim()) {
          message = "Full name is required";
        } else if (value.trim().length < 2) {
          message = "Name must be at least 2 characters";
        } else {
          isValid = true;
          message = "Name looks good";
        }
        break;
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
        // Backend regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        requirements = {
          length: value.length >= 8,
          uppercase: /[A-Z]/.test(value),
          lowercase: /[a-z]/.test(value),
          number: /\d/.test(value),
          special: /[@$!%*?&]/.test(value)
        };
        
        const allRequirementsMet = Object.values(requirements).every(req => req);
        
        if (!value) {
          message = "Password is required";
        } else if (!allRequirementsMet) {
          message = "Password must meet all requirements below";
        } else {
          isValid = true;
          message = "Strong password";
        }
        break;
    }
    
    return { isValid, message, requirements };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    const { isValid, message, requirements } = validateField(name, value);
    setValidation((prev) => ({
      ...prev,
      [name]: { 
        isValid, 
        message, 
        touched: true,
        ...(requirements && { requirements })
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
    };
    let toastId;
    try {
      toastId = toast.loading("Signing up...");
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/auth/signup`, 
        payload, 
        { withCredentials: true }
      );
      
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      toast.success("Account created successfully. Please verify your email.", { id: toastId });
      navigate("/verify-email", {
        state: {
          email: formData.email,
          message: "Account created successfully. Please verify your email.",
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message, { id: toastId });
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen cosmic-bg relative overflow-hidden flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
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

            {/* Sign in link */}
            <Link
              to="/login"
              className="glass px-4 py-2 text-white/90 font-medium rounded-xl hover:text-white transition-colors duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 text-sm font-medium text-white/90 mb-6">
            <UserPlus className="w-4 h-4 text-purple-400" />
            Join the Revolution
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Create Your
            <span className="block gradient-text-purple">SyncSpace</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Start collaborating with your team in minutes. Join thousands of teams already using SyncSpace.
          </p>
        </div>

        <form className="glass rounded-3xl p-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-2">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 glass-dark rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all duration-200 pr-10 ${
                    validation.name.touched
                      ? validation.name.isValid
                        ? "border-green-500/50 focus:border-green-500 focus:ring-green-500"
                        : "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  value={formData.name}
                  onChange={handleChange}
                />
                {validation.name.touched && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validation.name.isValid ? (
                      <Check size={20} className="text-green-400" />
                    ) : (
                      <X size={20} className="text-red-400" />
                    )}
                  </div>
                )}
              </div>
              {validation.name.touched && (
                <div className={`flex items-center mt-2 text-sm ${
                  validation.name.isValid ? "text-green-400" : "text-red-400"
                }`}>
                  <AlertCircle size={16} className="mr-1" />
                  {validation.name.message}
                </div>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">Email Address</label>
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
                <div className={`flex items-center mt-2 text-sm ${
                  validation.email.isValid ? "text-green-400" : "text-red-400"
                }`}>
                  <AlertCircle size={16} className="mr-1" />
                  {validation.email.message}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">Password</label>
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
                  {validation.password.touched && (
                    validation.password.isValid ? (
                      <Check size={20} className="text-green-400" />
                    ) : (
                      <X size={20} className="text-red-400" />
                    )
                  )}
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
                <div className={`flex items-center mt-2 text-sm ${
                  validation.password.isValid ? "text-green-400" : "text-red-400"
                }`}>
                  <AlertCircle size={16} className="mr-1" />
                  {validation.password.message}
                </div>
              )}
              
              {/* Password Requirements */}
              {validation.password.touched && validation.password.requirements && (
                <div className="mt-3 glass-dark rounded-lg p-3">
                  <p className="text-sm font-medium text-white/90 mb-2">Password Requirements:</p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className={`flex items-center ${
                      validation.password.requirements.length ? "text-green-400" : "text-white/60"
                    }`}>
                      {validation.password.requirements.length ? (
                        <Check size={14} className="mr-1" />
                      ) : (
                        <X size={14} className="mr-1" />
                      )}
                      At least 8 characters
                    </div>
                    <div className={`flex items-center ${
                      validation.password.requirements.uppercase ? "text-green-400" : "text-white/60"
                    }`}>
                      {validation.password.requirements.uppercase ? (
                        <Check size={14} className="mr-1" />
                      ) : (
                        <X size={14} className="mr-1" />
                      )}
                      One uppercase letter (A-Z)
                    </div>
                    <div className={`flex items-center ${
                      validation.password.requirements.lowercase ? "text-green-400" : "text-white/60"
                    }`}>
                      {validation.password.requirements.lowercase ? (
                        <Check size={14} className="mr-1" />
                      ) : (
                        <X size={14} className="mr-1" />
                      )}
                      One lowercase letter (a-z)
                    </div>
                    <div className={`flex items-center ${
                      validation.password.requirements.number ? "text-green-400" : "text-white/60"
                    }`}>
                      {validation.password.requirements.number ? (
                        <Check size={14} className="mr-1" />
                      ) : (
                        <X size={14} className="mr-1" />
                      )}
                      One number (0-9)
                    </div>
                    <div className={`flex items-center ${
                      validation.password.requirements.special ? "text-green-400" : "text-white/60"
                    }`}>
                      {validation.password.requirements.special ? (
                        <Check size={14} className="mr-1" />
                      ) : (
                        <X size={14} className="mr-1" />
                      )}
                      One special character (@$!%*?&)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full glass-button px-6 py-4 text-white font-semibold rounded-xl flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || !validation.name.isValid || !validation.email.isValid || !validation.password.isValid}
            >
              {loading ? "Creating Account..." : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-white/70">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-200 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
          </form>
      </div>
    </div>
  );
};

export default Signup;
