import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

const AnimatedButton = ({ 
  children, 
  onClick, 
  className = "", 
  variant = "primary",
  size = "md",
  disabled = false 
}) => {
  const buttonRef = useRef();
  const rippleRef = useRef();

  useGSAP(() => {
    const button = buttonRef.current;
    const ripple = rippleRef.current;

    // Hover animations
    const handleMouseEnter = () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out"
      });
      
      gsap.to(ripple, {
        scale: 1.2,
        opacity: 0.1,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
      
      gsap.to(ripple, {
        scale: 1,
        opacity: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    // Click animation
    const handleClick = (e) => {
      if (disabled) return;
      
      // Create ripple effect
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      gsap.set(ripple, {
        x: x - 50,
        y: y - 50,
        scale: 0,
        opacity: 0.3
      });
      
      gsap.to(ripple, {
        scale: 4,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out"
      });

      // Button press animation
      gsap.to(button, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.out",
        yoyo: true,
        repeat: 1
      });

      onClick && onClick(e);
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);
    button.addEventListener('click', handleClick);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
      button.removeEventListener('click', handleClick);
    };
  }, { scope: buttonRef });

  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50",
    outline: "border-2 border-gray-300 text-gray-700 hover:border-purple-600 hover:text-purple-600"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button
      ref={buttonRef}
      className={`
        relative overflow-hidden rounded-lg font-semibold transition-all duration-300
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      disabled={disabled}
    >
      {/* Ripple effect */}
      <div
        ref={rippleRef}
        className="absolute w-24 h-24 bg-white rounded-full pointer-events-none opacity-0"
        style={{ transform: 'translate(-50%, -50%)' }}
      />
      
      {/* Button content */}
      <span className="relative z-10">
        {children}
      </span>
    </button>
  );
};

export default AnimatedButton;