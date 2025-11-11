import { useState, useEffect } from "react";
import { Menu, X, ArrowRight, Sparkles } from "lucide-react";

const LandingNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMenuOpen]);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Comparison", href: "#comparison" },
    { name: "Reviews", href: "#testimonials" },
    { name: "FAQ", href: "#faq" },
  ];

  const scrollToSection = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "glass-dark" : "glass"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between ${
            isScrolled ? "py-2 sm:py-3" : "py-3 sm:py-4"
          }`}
        >
          {/* Brand */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div
              className={`rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                isScrolled ? "w-8 h-8 sm:w-10 sm:h-10" : "w-10 h-10 sm:w-12 sm:h-12"
              }`}
            >
              <img
                src="/icon.png"
                alt="SyncSpace Logo"
                className={`${
                  isScrolled ? "w-8 h-8 sm:w-10 sm:h-10" : "w-10 h-10 sm:w-12 sm:h-12"
                } rounded-xl sm:rounded-2xl`}
              />
            </div>
            <h1
              className={`font-bold tracking-tight gradient-text-purple ${
                isScrolled ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
              }`}
            >
              SyncSpace
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="px-3 xl:px-4 py-2 text-white/80 hover:text-white font-medium transition-all duration-300 hover:scale-105 rounded-lg hover:bg-white/10 cursor-pointer text-sm xl:text-base"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => (window.location.href = "/login")}
              className="glass px-4 sm:px-6 py-1.5 sm:py-2 text-white/90 font-semibold rounded-lg sm:rounded-xl hover:text-white transition-colors duration-300 cursor-pointer text-sm sm:text-base"
            >
              Login
            </button>
            <button
              onClick={() => (window.location.href = "/signup")}
              className="glass-button px-4 sm:px-6 py-1.5 sm:py-2 text-white font-semibold rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 group cursor-pointer text-sm sm:text-base"
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Sign Up</span>
              <span className="md:hidden">Join</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden glass-button p-2.5 rounded-lg cursor-pointer"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`sm:hidden glass-dark border-t border-white/20 overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen 
            ? "max-h-96 opacity-100" 
            : "max-h-0 opacity-0"
        }`}
      >
        <div className={`max-w-7xl mx-auto px-4 py-4 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-y-0" : "-translate-y-4"
        }`}>
          <div className="space-y-1 mb-4">
            {navLinks.map((item, index) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className={`block w-full text-left px-4 py-2.5 text-white/80 hover:text-white font-medium rounded-lg hover:bg-white/10 transition-all duration-300 text-sm transform ${
                  isMenuOpen 
                    ? "translate-x-0 opacity-100" 
                    : "-translate-x-4 opacity-0"
                }`}
                style={{
                  transitionDelay: isMenuOpen ? `${index * 50}ms` : "0ms"
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className={`flex flex-col gap-2 pt-3 border-t border-white/20 transform transition-all duration-300 ${
            isMenuOpen 
              ? "translate-x-0 opacity-100" 
              : "-translate-x-4 opacity-0"
          }`}
          style={{
            transitionDelay: isMenuOpen ? `${navLinks.length * 50}ms` : "0ms"
          }}>
            <button
              onClick={() => {
                window.location.href = "/login";
                setIsMenuOpen(false);
              }}
              className="w-full glass px-4 py-2.5 text-white/90 font-medium rounded-lg hover:text-white transition-colors duration-300 text-sm cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => {
                window.location.href = "/signup";
                setIsMenuOpen(false);
              }}
              className="w-full glass-button px-4 py-2.5 text-white font-semibold rounded-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
