import formpage from "../assets/formpage.jpg";
import { useState } from "react";
import { Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";
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
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-200 via-violet-200 to-blue-100 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-bl from-indigo-200/30 via-violet-200/20 to-blue-200/40 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-transparent via-white/20 to-indigo-100/30"></div>
      <div className="hidden md:flex w-[55%] h-full items-center justify-center overflow-hidden p-6 relative z-10">
        <div className="relative w-full h-full">
          <img
            src={formpage}
            alt="Signup Illustration"
            className="w-full h-full object-cover rounded-3xl shadow-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent rounded-3xl"></div>
          <div className="absolute bottom-8 left-8 right-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Join the Future</h2>
            <p className="text-gray-600">Create your account and start collaborating with your team today</p>
          </div>
        </div>
      </div>
      <div className="w-full md:w-[45%] flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-2">Join SyncSpace</h1>
            <p className="text-gray-600">Create your account to get started</p>
          </div>
          <form className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-8 shadow-xl animate-fadeIn" onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">Create Account</h2>

            {/* Name Field */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 bg-gray-50/50 border border-gray-300/50 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 transition-all duration-200 pr-10 ${
                    validation.name.touched
                      ? validation.name.isValid
                        ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                        : "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  value={formData.name}
                  onChange={handleChange}
                />
                {validation.name.touched && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validation.name.isValid ? (
                      <Check size={20} className="text-green-500" />
                    ) : (
                      <X size={20} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {validation.name.touched && (
                <div className={`flex items-center mt-2 text-sm ${
                  validation.name.isValid ? "text-green-600" : "text-red-600"
                }`}>
                  <AlertCircle size={16} className="mr-1" />
                  {validation.name.message}
                </div>
              )}
            </div>

            {/* Email Field */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  className={`w-full px-4 py-3 bg-gray-50/50 border border-gray-300/50 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 transition-all duration-200 pr-10 ${
                    validation.email.touched
                      ? validation.email.isValid
                        ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                        : "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  value={formData.email}
                  onChange={handleChange}
                />
                {validation.email.touched && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validation.email.isValid ? (
                      <Check size={20} className="text-green-500" />
                    ) : (
                      <X size={20} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {validation.email.touched && (
                <div className={`flex items-center mt-1 text-sm ${
                  validation.email.isValid ? "text-green-600" : "text-red-600"
                }`}>
                  <AlertCircle size={16} className="mr-1" />
                  {validation.email.message}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "password" : "text"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 bg-gray-50/50 border border-gray-300/50 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 transition-all duration-200 pr-20 ${
                    validation.password.touched
                      ? validation.password.isValid
                        ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                        : "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  value={formData.password}
                  onChange={handleChange}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  {validation.password.touched && (
                    validation.password.isValid ? (
                      <Check size={20} className="text-green-500" />
                    ) : (
                      <X size={20} className="text-red-500" />
                    )
                  )}
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              {validation.password.touched && (
                <div className={`flex items-center mt-1 text-sm ${
                  validation.password.isValid ? "text-green-600" : "text-red-600"
                }`}>
                  <AlertCircle size={16} className="mr-1" />
                  {validation.password.message}
                </div>
              )}
              
              {/* Password Requirements */}
              {validation.password.touched && validation.password.requirements && (
                <div className="mt-3 p-3 bg-gray-100/80 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className={`flex items-center ${
                      validation.password.requirements.length ? "text-green-600" : "text-gray-500"
                    }`}>
                      {validation.password.requirements.length ? (
                        <Check size={14} className="mr-1" />
                      ) : (
                        <X size={14} className="mr-1" />
                      )}
                      At least 8 characters
                    </div>
                    <div className={`flex items-center ${
                      validation.password.requirements.uppercase ? "text-green-600" : "text-gray-500"
                    }`}>
                      {validation.password.requirements.uppercase ? (
                        <Check size={14} className="mr-1" />
                      ) : (
                        <X size={14} className="mr-1" />
                      )}
                      One uppercase letter (A-Z)
                    </div>
                    <div className={`flex items-center ${
                      validation.password.requirements.lowercase ? "text-green-600" : "text-gray-500"
                    }`}>
                      {validation.password.requirements.lowercase ? (
                        <Check size={14} className="mr-1" />
                      ) : (
                        <X size={14} className="mr-1" />
                      )}
                      One lowercase letter (a-z)
                    </div>
                    <div className={`flex items-center ${
                      validation.password.requirements.number ? "text-green-600" : "text-gray-500"
                    }`}>
                      {validation.password.requirements.number ? (
                        <Check size={14} className="mr-1" />
                      ) : (
                        <X size={14} className="mr-1" />
                      )}
                      One number (0-9)
                    </div>
                    <div className={`flex items-center ${
                      validation.password.requirements.special ? "text-green-600" : "text-gray-500"
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
            <div className="mb-6">
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                disabled={loading || !validation.name.isValid || !validation.email.isValid || !validation.password.isValid}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>

            <p className="text-center text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-violet-600 hover:text-violet-700 font-semibold transition-colors duration-200 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
