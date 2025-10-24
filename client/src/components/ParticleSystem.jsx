import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

const ParticleSystem = ({ count = 30, className = "" }) => {
  const containerRef = useRef();

  useGSAP(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const particles = [];
    
    // Create particles
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute w-1 h-1 bg-indigo-400/10 rounded-full';
      
      // Random initial position
      const x = Math.random() * (window.innerWidth || 1200);
      const y = Math.random() * (window.innerHeight || 800);
      
      gsap.set(particle, {
        x: x,
        y: y,
        scale: Math.random() * 0.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.1
      });
      
      container.appendChild(particle);
      particles.push(particle);
      
      // Animate particle
      gsap.to(particle, {
        x: x + (Math.random() - 0.5) * 100,
        y: y + (Math.random() - 0.5) * 100,
        duration: Math.random() * 8 + 4,
        ease: "none",
        repeat: -1,
        yoyo: true,
        delay: Math.random() * 2
      });
      
      // Floating animation
      gsap.to(particle, {
        y: y - 30,
        duration: Math.random() * 4 + 3,
        ease: "power2.inOut",
        repeat: -1,
        yoyo: true,
        delay: Math.random() * 2
      });
    }

    // Cleanup function
    return () => {
      particles.forEach(particle => {
        gsap.killTweensOf(particle);
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, { scope: containerRef });

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 ${className}`}
    />
  );
};

export default ParticleSystem;