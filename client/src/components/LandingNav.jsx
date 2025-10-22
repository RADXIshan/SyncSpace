const LandingNav = () => {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/60 backdrop-blur-lg border-b border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
        {/* Gradient Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>

        <div className="max-w-7xl mx-auto px-1 py-5 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform duration-300">
            <img
              src="/icon.png"
              alt="SyncSpace Logo"
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-3xl font-bold tracking-wide">
              <span className="bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] bg-clip-text text-transparent">
                SyncSpace
              </span>
            </h1>
          </div>

          {/* Nav Links */}
          <div className="flex gap-8 text-lg font-medium">
            {["Home", "About", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="relative text-gray-700 hover:text-[var(--color-secondary)] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] after:rounded-full hover:after:w-full after:transition-all after:duration-300 hover:scale-110 active:scale-95 transition-all duration-300"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            {/* Login Button */}
            <button
              onClick={() => (window.location.href = "/login")}
              className="relative px-6 py-2 rounded-lg font-semibold text-lg text-gray-700 border-2 border-gray-400 overflow-hidden group transition-all hover:bg-accent hover:text-white duration-300 cursor-pointer hover:scale-110 active:scale-95"
            >
                Login
            </button>

            {/* Sign Up Button */}
            <button
              onClick={() => (window.location.href = "/signup")}
              className="relative px-6 py-[9px] rounded-lg font-semibold text-white bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] shadow-md hover:shadow-lg  transition-all duration-300 overflow-hidden group cursor-pointer hover:scale-110 active:scale-95 text-lg"
            >
              <span className="relative z-10">Sign Up</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-info)] to-[var(--color-secondary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </nav>
  )
}

export default LandingNav;