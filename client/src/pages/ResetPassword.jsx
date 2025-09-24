import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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

  const validatePassword = (val) => val.length < 6;

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
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/reset-password/${email}`, { password: formData.password });
      toast.success("Password reset successful! Please login with your new password.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100">
      <div className="w-full sm:w-[80%] md:w-[45%] flex items-center justify-center p-6 sm:p-8 md:p-10">
        <form className="bg-white rounded-3xl shadow-lg p-8 sm:p-10 w-full max-w-md" onSubmit={handleSubmit}>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-center text-secondary">Reset Password</h2>
          <p className="mb-6 text-center text-gray-600">Enter your new password below.</p>

          {/* Password Field */}
          <div className="mb-6 relative">
            <label htmlFor="password" className="block mb-2 text-m font-medium text-gray-700">New Password</label>
            <input
              type={showPassword ? "password" : "text"}
              id="password"
              name="password"
              placeholder="Enter new password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none pr-10 ${errors.password ? "border-secondary focus:border-red-400" : "focus:border-secondary"}`}
              value={formData.password}
              onChange={handleChange}
            />
            <button type="button" className="absolute right-3 top-10.5 text-gray-500 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Confirm Password Field */}
          <div className="mb-6 relative">
            <label htmlFor="confirmPassword" className="block mb-2 text-m font-medium text-gray-700">Confirm Password</label>
            <input
              type={showPassword ? "password" : "text"}
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm new password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none pr-10 ${errors.confirmPassword ? "border-secondary focus:border-red-400" : "focus:border-secondary"}`}
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <button type="button" className="absolute right-3 top-10.5 text-gray-500 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="w-full bg-secondary text-white py-2 rounded-lg font-semibold text-m hover:bg-purple-700 transition ease-in-out duration-300 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading || Object.values(errors).some(Boolean)}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;