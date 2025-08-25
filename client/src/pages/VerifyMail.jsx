import { useState, useRef } from "react";
import { Link } from "react-router";

const VerifyMail = () => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputs = useRef([]);

  const handleChange = (e, idx) => {
    const raw = e.target.value;
    const value = raw.replace(/[^0-9]/g, "");
    const newOtp = [...otp];

    // If user pressed backspace (value becomes empty), clear current box
    if (value === "") {
      newOtp[idx] = "";
      setOtp(newOtp);
      // move focus to previous box if exists
      if (idx > 0) inputs.current[idx - 1].focus();
      return;
    }

    // Accept only the first digit if multiple characters are pasted
    newOtp[idx] = value[0];
    setOtp(newOtp);

    // move to next input automatically
    if (idx < 5 && inputs.current[idx + 1]) {
      inputs.current[idx + 1].focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && idx > 0 && otp[idx] === "") {
      // If current box is already empty, move focus to previous box
      inputs.current[idx - 1].focus();
    }
  };

  // Paste handler: distribute first six digits across inputs
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, 6);

    if (!pasted) return;
    const newOtp = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    // focus next empty input or the last one if filled
    const nextIndex = pasted.length >= 6 ? 5 : pasted.length;
    if (inputs.current[nextIndex]) inputs.current[nextIndex].focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = otp.join("");
    console.log("Submitted OTP:", code);
    // TODO: integrate with backend verification endpoint
  };

  const handleResend = () => {
    console.log("Resend verification email");
    // TODO: trigger resend email endpoint
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100">
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
            className="w-full bg-secondary text-white py-2 rounded-lg font-semibold text-m hover:bg-purple-700 transition ease-in-out duration-300 hover:scale-105 active:scale-95"
          >
            Verify
          </button>
          <p className="mt-6 text-center text-gray-600">
            Didn't get the code? {" "}
            <button
              type="button"
              onClick={handleResend}
              className="text-purple-600 hover:underline transition ease-in-out duration-300 cursor-pointer"
            >
              Resend
            </button>
          </p>
          <p className="mt-4 text-center text-gray-600">
            <Link to="/login" className="text-purple-600 hover:underline">
              Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default VerifyMail;