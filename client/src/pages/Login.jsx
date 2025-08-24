import formpage from "../assets/formpage.jpg"
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router";

const Login = () => {
  const [showPassword, setShowPassword] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100">
      <div className="hidden md:flex w-[55%] h-full items-center justify-center overflow-hidden p-6">
        <img src={formpage} alt="Login Illustration" className="w-full h-full object-cover rounded-3xl shadow-lg" />
      </div>
      <div className="w-full md:w-[45%] flex items-center justify-center p-8">
        <form className="rounded-3xl p-8 w-full max-w-md">
          <h2 className="text-4xl font-bold mb-8 text-center text-purple-700">Login</h2>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-m font-medium text-gray-700">Email</label>
            <input type="email" id="email" name="email" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          <div className="mb-6 relative">
            <label htmlFor="password" className="block mb-2 text-m font-medium text-gray-700">Password</label>
            <input type={showPassword ? "text" : "password"} id="password" name="password" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 pr-10" />
            <button type="button" className="absolute right-3 top-10.5 text-gray-500 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="mb-6">
            <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold text-m hover:bg-purple-700 transition ease-in-out duration-300 hover:scale-105 active:scale-95 cursor-pointer">Login</button>
          </div>
          <p className="mb-6 text-center text-gray-600">Don't have an account? <Link to="/signup" className="text-purple-600 hover:underline transition ease-in-out duration-300">Signup</Link></p>
        </form>
      </div>
    </div>
  )
}

export default Login