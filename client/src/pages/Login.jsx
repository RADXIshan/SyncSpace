import formpage from "../assets/formpage.jpg";
import { useState } from "react";
import { Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [showPassword, setShowPassword] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [validation, setValidation] = useState({
    email: { isValid: false, message: "", touched: false },
    password: { isValid: false, message: "", touched: false }
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

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
      [name]: { isValid, message, touched: true }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      email: formData.email,
      password: formData.password,
    };
    let toastId;
    try {
      toastId = toast.loading("Logging in...");
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/login`, payload, { withCredentials: true });
      // Persist token for fallback authentication
      if(res.data?.token){
        localStorage.setItem("token", res.data.token);
      }
      await checkAuth();
      navigate("/home", {
        state: {
          message: "Login Successful",
        },
      });
      toast.success("Login Successful", { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message, { id: toastId });
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-violet-200 via-indigo-200 to-purple-100 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-200/30 via-indigo-200/20 to-purple-200/40 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/20 to-violet-100/30"></div>
      <div className="hidden md:flex w-[55%] h-full items-center justify-center overflow-hidden p-6 relative z-10">
        <div className="relative w-full h-full">
          <img src={formpage} alt="Login Illustration" className="w-full h-full object-cover rounded-3xl shadow-2xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent rounded-3xl"></div>
          <div className="absolute bottom-8 left-8 right-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome to SyncSpace</h2>
            <p className="text-gray-600">Your collaborative workspace for seamless team productivity</p>
          </div>
        </div>
      </div>
      <div className="w-full md:w-[45%] flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>
          <form className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-8 shadow-xl animate-fadeIn" onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">Sign In</h2>
            
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
                <div className={`flex items-center mt-2 text-sm ${
                  validation.email.isValid ? "text-green-600" : "text-red-600"
                }`}>
                  <AlertCircle size={16} className="mr-1" />
                  {validation.email.message}
                </div>
              )}
            </div>
            
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
                <div className={`flex items-center mt-2 text-sm ${
                  validation.password.isValid ? "text-green-600" : "text-red-600"
                }`}>
                  <AlertCircle size={16} className="mr-1" />
                  {validation.password.message}
                </div>
              )}
            </div>
            
            <div className="text-right mb-6">
              <Link to="/forgot-password" className="text-violet-600 hover:text-violet-700 font-medium transition-colors duration-200 hover:underline">
                Forgot password?
              </Link>
            </div>
            
            <div className="mb-6">
              <button 
                type="submit" 
                className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer" 
                disabled={!validation.email.isValid || !validation.password.isValid || loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>
            
            <p className="text-center text-gray-600">
              Don't have an account?{" "}
              <Link to="/signup" className="text-violet-600 hover:text-violet-700 font-semibold transition-colors duration-200 hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login