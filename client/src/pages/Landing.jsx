import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Import components
import LandingNav from "../components/LandingNav";
import LandingHero from "../components/LandingHero";
import LandingFeatures from "../components/LandingFeatures";
import LandingStats from "../components/LandingStats";
import LandingTestimonials from "../components/LandingTestimonials";
import LandingPricing from "../components/LandingPricing";
import FAQList from "../components/FAQList";
import Footer from "../components/Footer";
import ScrollProgress from "../components/ScrollProgress";
import ParticleSystem from "../components/ParticleSystem";

const Landing = () => {
  const containerRef = useRef();

  useGSAP(() => {
    // Smooth page entrance
    gsap.fromTo(containerRef.current,
      {
        opacity: 0,
      },
      {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out"
      }
    );

    // Add subtle parallax effect to sections
    gsap.utils.toArray(".parallax-section").forEach((section, i) => {
      gsap.to(section, {
        yPercent: -10 * (i + 1),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1
        }
      });
    });

  }, { scope: containerRef });

  return (
    <>
      <ScrollProgress />
      <ParticleSystem count={30} />
      
      <div ref={containerRef} className="min-h-screen bg-white overflow-hidden">
        <LandingNav />
        <LandingHero />
        <div className="parallax-section">
          <LandingFeatures />
        </div>
        <div className="parallax-section">
          <LandingStats />
        </div>
        <div className="parallax-section">
          <LandingTestimonials />
        </div>
        <div className="parallax-section">
          <LandingPricing />
        </div>
        <div className="parallax-section">
          <FAQList />
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Landing;