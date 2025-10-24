import { useState, useRef, useEffect } from "react";
import { Menu, X, Sparkles, ArrowRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const LandingNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navRef = useRef();
  const brandRef = useRef();
  const linksRef = useRef();
  const buttonsRef = useRef();
  const mobileMenuRef = useRef();

  useGSAP(() => {
    // Professional navbar entrance animation
    const tl = gsap.timeline();

    tl.fromTo(navRef.current,
      {
        y: -100,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
      }
    )
    .fromTo(brandRef.current,
      {
        scale: 0.8,
        opacity: 0,
      },
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: "back.out(1.7)",
      },
      "-=0.4"
    )
    .fromTo(linksRef.current?.children || [],
      {
        opacity: 0,
        y: -20,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.08,
        ease: "power2.out",
      },
      "-=0.3"
    )
    .fromTo(buttonsRef.current?.children || [],
      {
        opacity: 0,
        scale: 0.9,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        stagger: 0.1,
        ease: "back.out(1.7)",
      },
      "-=0.2"
    );

    // Scroll-based navbar transformation
    ScrollTrigger.create({
      trigger: "body",
      start: "top -50",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (self.direction === 1 && self.progress > 0.01) {
          setIsScrolled(true);
        } else if (self.direction === -1 && self.progress < 0.01) {
          setIsScrolled(false);
        }
      },
    });
  }, { scope: navRef });

  // Mobile menu animation
  useGSAP(() => {
    if (isMenuOpen && mobileMenuRef.current) {
      gsap.fromTo(mobileMenuRef.current,
        {
          opacity: 0,
          y: -20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
        }
      );

      gsap.fromTo(mobileMenuRef.current.querySelectorAll(".mobile-nav-item"),
        {
          opacity: 0,
          x: -20,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.3,
          stagger: 0.05,
          ease: "power2.out",
          delay: 0.1,
        }
      );
    }
  }, [isMenuOpen]);

  // Close mobile menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuOpen]);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "FAQ", href: "#faq" },
  ];

  const scrollToSection = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50"
          : "bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100/50"
      }`}
    >
      {/* Dynamic gradient line */}
      <div
        className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-500 ${
          isScrolled ? "opacity-100" : "opacity-60"
        }`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between transition-all duration-300 ${
            isScrolled ? "py-3" : "py-4"
          }`}
        >
          {/* Brand */}
          <div
            ref={brandRef}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  SyncSpace
                </span>
              </h1>
              <span className="text-xs text-gray-500 -mt-1 hidden sm:block">
                Collaborate Seamlessly
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div ref={linksRef} className="hidden lg:flex items-center gap-8">
            {navLinks.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="relative px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium text-base transition-all duration-300 group cursor-pointer"
              >
                <span className="relative z-10">{item.name}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100" />
                <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:w-full group-hover:left-0 transition-all duration-300 rounded-full" />
              </button>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div ref={buttonsRef} className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => (window.location.href = "/login")}
              className="relative px-5 py-2.5 text-gray-700 hover:text-indigo-600 font-medium text-sm transition-all duration-300 rounded-lg hover:bg-gray-50 group cursor-pointer"
            >
              <span className="relative z-10">Login</span>
            </button>

            <button
              onClick={() => (window.location.href = "/signup")}
              className="relative px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden relative p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {isMenuOpen ? (
                <X className="w-5 h-5 text-gray-700 group-hover:text-indigo-600 transition-colors duration-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700 group-hover:text-indigo-600 transition-colors duration-300" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="sm:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-xl"
        >
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Mobile Nav Links */}
            <div className="space-y-2 mb-6">
              {navLinks.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="mobile-nav-item block w-full text-left px-4 py-3 text-gray-700 hover:text-indigo-600 font-medium text-base rounded-lg hover:bg-gradient-to-r hover:from-indigo-600/5 hover:to-purple-600/5 transition-all duration-300 cursor-pointer"
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Mobile Buttons */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  window.location.href = "/login";
                  setIsMenuOpen(false);
                }}
                className="mobile-nav-item w-full px-4 py-3 text-gray-700 hover:text-indigo-600 font-medium text-base rounded-lg hover:bg-gray-50 transition-all duration-300 border border-gray-200 cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => {
                  window.location.href = "/signup";
                  setIsMenuOpen(false);
                }}
                className="mobile-nav-item w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNav;