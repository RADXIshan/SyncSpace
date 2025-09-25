import formpage from "../assets/formpage.jpg";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [showPassword, setShowPassword] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: true, password: true });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    let invalid = false;
    if (name === "email") {
      invalid = !/^\S+@\S+\.\S+$/.test(value);
    } else if (name === "password") {
      invalid = value.length < 6;
    }
    setErrors((prev) => ({ ...prev, [name]: invalid }));
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
    <div className="flex h-screen items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100">
      <div className="hidden md:flex w-[55%] h-full items-center justify-center overflow-hidden p-6">
        <img src={formpage} alt="Login Illustration" className="w-full h-full object-cover rounded-3xl shadow-lg" />
      </div>
      <div className="w-full md:w-[45%] flex items-center justify-center p-8">
        <form className="rounded-3xl p-8 w-full max-w-md" onSubmit={handleSubmit}>
          <h2 className="text-5xl font-bold mb-8 text-center text-secondary">Login</h2>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-m font-medium text-gray-700">Email</label>
            <input type="email" id="email" name="email" placeholder="Enter your email" className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${errors.email ? "border-secondary focus:border-red-400" : "focus:border-secondary"}`} value={formData.email} onChange={handleChange} />
          </div>
          <div className="mb-4 relative">
            <label htmlFor="password" className="block mb-2 text-m font-medium text-gray-700">Password</label>
            <input type={showPassword ? "password" : "text"} id="password" name="password" placeholder="Enter your password" className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${errors.password ? "border-secondary focus:border-red-400" : "focus:border-secondary"}`} value={formData.password} onChange={handleChange} />
            <button type="button" className="absolute right-3 top-10.5 text-gray-500 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="mb-6 text-right">
            <Link to="/forgot-password" className="text-purple-600 hover:underline transition ease-in-out duration-300">Forgot password?</Link>
          </div>
          <div className="mb-6">
            <button type="submit" className="w-full bg-secondary text-white py-2 rounded-lg font-semibold text-m hover:bg-purple-700 transition ease-in-out duration-300 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed" disabled={Object.values(errors).some(Boolean) || loading}>Login</button>
          </div>
          <p className="mb-6 text-center text-gray-600">Don't have an account? <Link to="/signup" className="text-purple-600 hover:underline transition ease-in-out duration-300">Signup</Link></p>
        </form>
      </div>
    </div>
  )
}

export default Login