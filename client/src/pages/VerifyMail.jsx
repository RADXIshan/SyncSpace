import { useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router";
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
  // In your handleSubmit function
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
      
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/auth/verify-mail`,
        { otp: code, token }, 
        { withCredentials: true }
      );
  
      toast.success("Email verified successfully", { id: toastId });
      await checkAuth();
      navigate("/home/dashboard", { state: { message: "Welcome!" } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify OTP", { id: toastId });
      console.error("OTP verify error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP placeholder
  const handleResend = async () => {
    let toastId;
    try {
      toastId = toast.loading("Resending OTP...");
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/resend-otp`, { email }, { withCredentials: true });
      toast.success("OTP resent successfully", { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP", { id: toastId });
      console.error("Resend OTP error:", err);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-r from-blue-200 to-purple-200">
      <div className="w-full md:w-[45%] flex items-center justify-center p-4 sm:p-6 md:p-8">
        <form
          className="bg-white rounded-3xl shadow-lg p-6 sm:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md"
          onSubmit={handleSubmit}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center text-secondary">
            Verify Email
          </h2>
          <p className="mb-6 text-center text-gray-600">
            Enter the 6‑digit code we've sent to your email
          </p>

          <div className="flex justify-center gap-2 sm:gap-3 md:gap-2 mb-8">
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
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-lg sm:text-xl md:text-2xl"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white py-2 rounded-lg font-semibold text-m hover:bg-purple-700 transition ease-in-out duration-300 hover:scale-105 active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>

          <p className="mt-6 text-center text-gray-600">
            Didn't get the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              className="text-purple-600 hover:underline transition ease-in-out duration-300 cursor-pointer"
            >
              Resend
            </button>
          </p>

          <p className="mt-4 text-center text-gray-600">
            <Link to="/signup" className="text-purple-600 hover:underline">
              Back to Signup
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default VerifyMail;
