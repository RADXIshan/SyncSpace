import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const LandingNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shouldRenderMenu, setShouldRenderMenu] = useState(false);
  const [menuAnimationClass, setMenuAnimationClass] = useState('');
  const [navItemAnimationClass, setNavItemAnimationClass] = useState('');

  useEffect(() => {
    if (isMenuOpen) {
      setShouldRenderMenu(true);
      setMenuAnimationClass('animate-slide-down-fade-in');
      setNavItemAnimationClass('animate-fade-in-up');
    } else {
      setMenuAnimationClass('animate-slide-up-fade-out');
      setNavItemAnimationClass('animate-fade-out-down');
      const timer = setTimeout(() => {
        setShouldRenderMenu(false);
      }, 300); // Duration of the slide-up-fade-out animation
      return () => clearTimeout(timer);
    }
  }, [isMenuOpen]);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/60 backdrop-blur-lg border-b border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
      {/* Gradient Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:scale-105 transition-transform duration-300">
          <img
            src="/icon.png"
            alt="SyncSpace Logo"
            className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain"
          />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-wide">
            <span className="bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] bg-clip-text text-transparent">
              SyncSpace
            </span>
          </h1>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex gap-6 xl:gap-8 text-base xl:text-lg font-medium">
          {["Home", "Features", "FAQs", "Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="relative text-gray-700 hover:text-[var(--color-secondary)] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-[2px] after:bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] after:rounded-full hover:after:w-full after:transition-all after:duration-300 hover:scale-110 active:scale-95 transition-all duration-300"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden sm:flex items-center gap-2 lg:gap-3">
          {/* Login Button */}
          <button
            onClick={() => (window.location.href = "/login")}
            className="relative px-3 sm:px-4 lg:px-6 py-2 rounded-lg font-semibold text-sm sm:text-base lg:text-lg bg-purple-100 text-purple-800/70 group transition-all hover:text-purple-800 hover:bg-purple-100 duration-300 cursor-pointer active:scale-95 hover:shadow-md shadow-purple-200 border"
          >
            Login
          </button>

          {/* Sign Up Button */}
          <button
            onClick={() => (window.location.href = "/signup")}
            className="relative px-3 sm:px-4 lg:px-6 py-[9px] rounded-lg font-semibold text-white bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer active:scale-95 text-sm sm:text-base lg:text-lg shadow-purple-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <span className="relative z-10">Sign Up</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-info)] to-[var(--color-secondary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {shouldRenderMenu && (
        <div className={`sm:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-lg border-b border-gray-200/60 shadow-lg ${menuAnimationClass}`}>
          <div className="px-4 py-6 space-y-4">
            {/* Mobile Nav Links */}
            <div className="space-y-3">
              {["Home", "Features", "FAQs", "Contact"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block text-gray-700 hover:text-[var(--color-secondary)] font-medium text-lg py-2 px-3 rounded-lg hover:bg-gray-50 transition-all duration-200 ${navItemAnimationClass}`}
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Mobile Buttons */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  window.location.href = "/login";
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-3 rounded-lg font-semibold text-base bg-purple-100 text-purple-800/70 hover:text-purple-800 hover:bg-purple-100 transition-all duration-300 border"
              >
                Login
              </button>
              <button
                onClick={() => {
                  window.location.href = "/signup";
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] hover:shadow-md transition-all duration-300 text-base"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNav;
