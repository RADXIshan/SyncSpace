import formpage from "../assets/formpage.jpg";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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

  // Track validation errors (true = invalid)
  const [errors, setErrors] = useState({
    name: true,
    email: true,
    password: true,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    let invalid = false;
    if (name === "email") {
      invalid = !/^\S+@\S+\.\S+$/.test(value);
    } else if (name === "password") {
      invalid = value.length < 6;
    } else {
      invalid = value.trim() === "";
    }
    setErrors((prev) => ({ ...prev, [name]: invalid }));
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
    <div className="flex h-screen items-center justify-center bg-gradient-to-r from-blue-200 to-purple-200">
      <div className="hidden md:flex w-[55%] h-full items-center justify-center overflow-hidden p-6">
        <div className="relative w-full h-full">
          <img
            src={formpage}
            alt="Signup Illustration"
            className="w-full h-full object-cover rounded-3xl shadow-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
        </div>
      </div>
      <div className="w-full md:w-[45%] flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold gradient-text mb-2">Join SyncSpace</h1>
            <p className="text-gray-600">Create your account to get started</p>
          </div>
          <form className="card p-8 animate-fadeIn" onSubmit={handleSubmit}>
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Sign Up</h2>

            {/* Name Field */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter your full name"
                className={`input-primary ${
                  errors.name
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                    : ""
                }`}
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                className={`input-primary ${
                  errors.email
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                    : ""
                }`}
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "password" : "text"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  className={`input-primary pr-12 ${
                    errors.password
                      ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                      : ""
                  }`}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mb-6">
              <button
                type="submit"
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading || Object.values(errors).some(Boolean)}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>

            <p className="text-center text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200 hover:underline"
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
