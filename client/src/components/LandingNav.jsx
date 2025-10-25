import { useState, useEffect } from "react";
import { Menu, X, ArrowRight, Brain, Sparkles } from "lucide-react";

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
    { name: "Reviews", href: "#testimonials" },
    { name: "Pricing", href: "#pricing" },
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
            isScrolled ? "py-3" : "py-4"
          }`}
        >
          {/* Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div
              className={`bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center pulse-glow group-hover:scale-110 transition-transform duration-300 ${
                isScrolled ? "w-10 h-10" : "w-12 h-12"
              }`}
            >
              <Brain
                className={`text-white ${isScrolled ? "w-6 h-6" : "w-7 h-7"}`}
              />
            </div>
            <h1
              className={`font-bold tracking-tight gradient-text-purple ${
                isScrolled ? "text-xl" : "text-2xl"
              }`}
            >
              SyncSpace
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="px-4 py-2 text-white/80 hover:text-white font-medium transition-all duration-300 hover:scale-105 rounded-lg hover:bg-white/10"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => (window.location.href = "/login")}
              className="glass px-6 py-2 text-white/90 font-semibold rounded-xl hover:text-white transition-colors duration-300"
            >
              Login
            </button>
            <button
              onClick={() => (window.location.href = "/signup")}
              className="glass-button px-6 py-2 text-white font-semibold rounded-xl flex items-center gap-2 group"
            >
              <Sparkles className="w-4 h-4" />
              Sign Up
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden glass-button p-3 rounded-xl"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="sm:hidden glass-dark border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="space-y-2 mb-6">
              {navLinks.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full text-left px-4 py-3 text-white/80 hover:text-white font-medium rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 pt-4 border-t border-white/20">
              <button
                onClick={() => {
                  window.location.href = "/login";
                  setIsMenuOpen(false);
                }}
                className="w-full glass px-4 py-3 text-white/90 font-medium rounded-xl hover:text-white transition-colors duration-300"
              >
                Access Portal
              </button>
              <button
                onClick={() => {
                  window.location.href = "/signup";
                  setIsMenuOpen(false);
                }}
                className="w-full glass-button px-4 py-3 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Join Revolution
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNav;
