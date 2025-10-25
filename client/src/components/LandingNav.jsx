import { useState, useRef, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
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

    // Enhanced scroll-based navbar shrinking effect
    ScrollTrigger.create({
      trigger: "body",
      start: "top -10",
      end: "bottom bottom",
      onUpdate: (self) => {
        const scrollY = window.scrollY;
        
        if (scrollY > 50) {
          setIsScrolled(true);
          
          // Smooth shrinking animation
          gsap.to(navRef.current, {
            duration: 0.3,
            ease: "power2.out"
          });
          
          // Shrink brand logo and text
          gsap.to(brandRef.current.querySelector('div'), {
            scale: 0.85,
            duration: 0.3,
            ease: "power2.out"
          });
          
          gsap.to(brandRef.current.querySelector('h1'), {
            scale: 0.9,
            duration: 0.3,
            ease: "power2.out"
          });
          
        } else {
          setIsScrolled(false);
          
          // Return to original size
          gsap.to(navRef.current, {
            duration: 0.3,
            ease: "power2.out"
          });
          
          gsap.to(brandRef.current.querySelector('div'), {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });
          
          gsap.to(brandRef.current.querySelector('h1'), {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });
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
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-out ${
        isScrolled
          ? "bg-white/98 backdrop-blur-xl shadow-2xl border-b border-gray-200/60"
          : "bg-white/85 backdrop-blur-lg shadow-lg border-b border-gray-100/50"
      }`}
    >
      {/* Enhanced Dynamic gradient line with shrinking effect */}
      <div
        className={`absolute top-0 left-0 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-500 ${
          isScrolled 
            ? "h-0.5 opacity-100 shadow-lg shadow-purple-500/30" 
            : "h-1 opacity-70"
        }`}
      />
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50/10 to-transparent opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between transition-all duration-500 ease-out ${
            isScrolled ? "py-2 sm:py-2.5" : "py-4 sm:py-5"
          }`}
        >
          {/* Enhanced Brand with Shrinking Effect */}
          <div
            ref={brandRef}
            className="flex items-center gap-3 cursor-pointer group relative"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative">
              <div className={`rounded-full flex items-center justify-center group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                isScrolled ? "w-9 h-9 sm:w-10 sm:h-10" : "w-11 h-11 sm:w-12 sm:h-12"
              }`}>
                <img src="/icon.png" alt="SyncSpace Logo" className="w-full h-full transition-all duration-500" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className={`font-bold tracking-tight group-hover:scale-105 transition-all duration-500 ${
                isScrolled ? "text-lg sm:text-2xl" : "text-xl sm:text-3xl"
              }`}>
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  SyncSpace
                </span>
              </h1>
            </div>
          </div>

          {/* Desktop Navigation with Shrinking Effect */}
          <div ref={linksRef} className={`hidden lg:flex items-center transition-all duration-500 ${
            isScrolled ? "gap-6" : "gap-8"
          }`}>
            {navLinks.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className={`relative px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium transition-all duration-500 group cursor-pointer ${
                  isScrolled ? "text-sm" : "text-base"
                }`}
              >
                <span className="relative z-10">{item.name}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100" />
                <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:w-full group-hover:left-0 transition-all duration-300 rounded-full" />
              </button>
            ))}
          </div>

          {/* Desktop Buttons with Shrinking Effect */}
          <div ref={buttonsRef} className={`hidden sm:flex items-center transition-all duration-500 ${
            isScrolled ? "gap-2" : "gap-3"
          }`}>
            <button
              onClick={() => (window.location.href = "/login")}
              className={`relative border-2 border-gray-300 text-gray-700 font-semibold rounded-lg shadow-lg hover:shadow-2xl hover:border-violet-300 hover:text-violet-600 transition-all duration-500 group overflow-hidden cursor-pointer transform hover:scale-110 bg-white/80 hover:bg-white/90 ${
                isScrolled ? "px-4 py-2 text-xs" : "px-6 py-[13px] text-sm"
              }`}
            >
              <span className="relative z-10">Login</span>
            </button>

            <button
              onClick={() => (window.location.href = "/signup")}
              className={`relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-xl shadow-purple-500/20 hover:shadow-2xl transition-all duration-500 group overflow-hidden cursor-pointer transform hover:scale-110 ${
                isScrolled ? "px-4 py-2.5 text-xs" : "px-6 py-3.5 text-sm"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 animate-pulse" />
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight className={`group-hover:translate-x-1 transition-transform duration-300 ${
                  isScrolled ? "w-3 h-3" : "w-4 h-4"
                }`} />
              </span>
            </button>
          </div>

          {/* Mobile Menu Button with Shrinking Effect */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`sm:hidden relative rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-500 group cursor-pointer ${
              isScrolled ? "p-2" : "p-2.5"
            }`}
          >
            <div className={`flex items-center justify-center transition-all duration-500 ${
              isScrolled ? "w-5 h-5" : "w-6 h-6"
            }`}>
              {isMenuOpen ? (
                <X className={`text-gray-700 group-hover:text-indigo-600 transition-colors duration-300 ${
                  isScrolled ? "w-4 h-4" : "w-5 h-5"
                }`} />
              ) : (
                <Menu className={`text-gray-700 group-hover:text-indigo-600 transition-colors duration-300 ${
                  isScrolled ? "w-4 h-4" : "w-5 h-5"
                }`} />
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