import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ScrollProgress = () => {
  const progressRef = useRef();

  useGSAP(() => {
    const progress = progressRef.current;
    
    gsap.to(progress, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: true
      }
    });
  }, { scope: progressRef });

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gray-200/50 z-50">
      <div
        ref={progressRef}
        className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 origin-left scale-x-0"
      />
    </div>
  );
};

export default ScrollProgress;