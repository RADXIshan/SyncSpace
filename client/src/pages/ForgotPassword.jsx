import { useState } from "react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import { toast } from "react-hot-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);
  const navigate = useNavigate();

  const validateEmail = (val) => !/^\S+@\S+\.\S+$/.test(val);

  const handleChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setError(validateEmail(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (error) return;
    setLoading(true);
    let toastId;
    try {
      toastId = toast.loading("Sending reset link...");
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/forgot-password`, { email });
      toast.success("Reset link sent! Check your email.", { id: toastId });
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100">
      <div className="w-full sm:w-[80%] md:w-[45%] flex items-center justify-center p-6 sm:p-8 md:p-10">
        <form
          className="bg-white rounded-3xl shadow-lg p-8 sm:p-10 w-full max-w-md"
          onSubmit={handleSubmit}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-center text-secondary">
            Forgot Password
          </h2>
          <p className="mb-6 text-center text-gray-600">
            Enter your registered email address to receive a password reset link.
          </p>
          <div className="mb-6">
            <label htmlFor="email" className="block mb-2 text-m font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${error ? "border-secondary focus:border-red-400" : "focus:border-secondary"}`}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-secondary text-white py-2 rounded-lg font-semibold text-m hover:bg-purple-700 transition ease-in-out duration-300 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading || error}
          >
            Send Reset Link
          </button>
          <p className="mt-6 text-center text-gray-600">
            Remembered your password? {" "}
            <Link to="/login" className="text-purple-600 hover:underline transition ease-in-out duration-300">
              Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;