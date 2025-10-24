import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(ScrollTrigger, TextPlugin);

// Utility function for staggered fade-in animations
export const staggerFadeIn = (elements, options = {}) => {
  const defaults = {
    duration: 0.8,
    stagger: 0.1,
    y: 50,
    opacity: 0,
    ease: "power2.out"
  };
  
  const config = { ...defaults, ...options };
  
  return gsap.fromTo(elements, 
    { 
      opacity: config.opacity, 
      y: config.y 
    },
    {
      opacity: 1,
      y: 0,
      duration: config.duration,
      stagger: config.stagger,
      ease: config.ease
    }
  );
};

// Utility function for scroll-triggered animations
export const scrollTriggerAnimation = (trigger, elements, options = {}) => {
  const defaults = {
    start: "top 80%",
    end: "bottom 20%",
    toggleActions: "play none none reverse",
    duration: 1,
    y: 60,
    opacity: 0,
    stagger: 0.2
  };
  
  const config = { ...defaults, ...options };
  
  return gsap.fromTo(elements,
    {
      opacity: config.opacity,
      y: config.y,
      scale: config.scale || 1,
      rotation: config.rotation || 0
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      rotation: 0,
      duration: config.duration,
      stagger: config.stagger,
      ease: config.ease || "power2.out",
      scrollTrigger: {
        trigger,
        start: config.start,
        end: config.end,
        toggleActions: config.toggleActions
      }
    }
  );
};

// Utility function for magnetic hover effects
export const magneticHover = (element, strength = 0.3) => {
  const handleMouseMove = (e) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    gsap.to(element, {
      x: x * strength,
      y: y * strength,
      duration: 0.3,
      ease: "power2.out"
    });
  };
  
  const handleMouseLeave = () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.3)"
    });
  };
  
  element.addEventListener('mousemove', handleMouseMove);
  element.addEventListener('mouseleave', handleMouseLeave);
  
  return () => {
    element.removeEventListener('mousemove', handleMouseMove);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
};

// Utility function for parallax scrolling
export const parallaxScroll = (elements, speed = 0.5) => {
  return gsap.to(elements, {
    yPercent: -50 * speed,
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top bottom",
      end: "bottom top",
      scrub: true
    }
  });
};

// Utility function for typewriter effect
export const typewriterEffect = (element, text, options = {}) => {
  const defaults = {
    duration: 2,
    ease: "none",
    delay: 0
  };
  
  const config = { ...defaults, ...options };
  
  return gsap.to(element, {
    text: text,
    duration: config.duration,
    ease: config.ease,
    delay: config.delay
  });
};

// Utility function for morphing shapes
export const morphShape = (element, options = {}) => {
  const defaults = {
    scale: 1.1,
    rotation: 5,
    duration: 2,
    yoyo: true,
    repeat: -1,
    ease: "power2.inOut"
  };
  
  const config = { ...defaults, ...options };
  
  return gsap.to(element, {
    scale: config.scale,
    rotation: config.rotation,
    duration: config.duration,
    yoyo: config.yoyo,
    repeat: config.repeat,
    ease: config.ease
  });
};

// Utility function for reveal animations
export const revealAnimation = (element, direction = "up", options = {}) => {
  const defaults = {
    duration: 1,
    ease: "power2.out",
    delay: 0
  };
  
  const config = { ...defaults, ...options };
  
  const directions = {
    up: { y: 100 },
    down: { y: -100 },
    left: { x: 100 },
    right: { x: -100 }
  };
  
  return gsap.fromTo(element,
    {
      opacity: 0,
      ...directions[direction]
    },
    {
      opacity: 1,
      x: 0,
      y: 0,
      duration: config.duration,
      ease: config.ease,
      delay: config.delay
    }
  );
};