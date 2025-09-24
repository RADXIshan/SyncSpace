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
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/auth/signup`, 
        payload, 
        { withCredentials: true }
      );
      
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      toast.success("Account created successfully. Please verify your email.");
      navigate("/verify-email", {
        state: {
          message: "Account created successfully. Please verify your email.",
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message);
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100">
      <div className="hidden md:flex w-[55%] h-full items-center justify-center overflow-hidden p-6">
        <img
          src={formpage}
          alt="Signup Illustration"
          className="w-full h-full object-cover rounded-3xl shadow-lg"
        />
      </div>
      <div className="w-full md:w-[45%] flex items-center justify-center p-8">
        <form className="p-8 w-full max-w-md" onSubmit={handleSubmit}>
          <h2 className="text-5xl font-bold mb-8 text-center text-secondary">Signup</h2>

          {/* Name Field */}
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block mb-2 text-m font-medium text-gray-700"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your full name"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                errors.name
                  ? "border-secondary focus:border-red-400"
                  : "focus:border-secondary"
              }`}
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Email Field */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block mb-2 text-m font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
                errors.email
                  ? "border-secondary focus:border-red-400"
                  : "focus:border-secondary"
              }`}
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Password Field */}
          <div className="mb-6 relative">
            <label
              htmlFor="password"
              className="block mb-2 text-m font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type={showPassword ? "password" : "text"}
              id="password"
              name="password"
              placeholder="Enter your password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none pr-10 ${
                errors.password
                  ? "border-secondary focus:border-red-400"
                  : "focus:border-secondary"
              }`}
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute right-3 top-10.5 text-gray-500 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Submit Button */}
          <div className="mb-6">
            <button
              type="submit"
              className="w-full bg-secondary text-white py-2 rounded-lg font-semibold text-m hover:bg-purple-700 transition ease-in-out duration-300 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || Object.values(errors).some(Boolean)}
            >
              {loading ? "Signing up..." : "Signup"}
            </button>
          </div>

          <p className="mb-6 text-center text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-purple-600 hover:underline transition ease-in-out duration-300"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
