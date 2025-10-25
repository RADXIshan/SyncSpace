import { ArrowRight, Play, Users, Zap, Shield, CheckCircle } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import landing_page_pic from "../assets/landing_page_pic.png";
import ScrambleText from "./ScrambleText";

gsap.registerPlugin(ScrollTrigger);

const LandingHero = () => {
  const heroRef = useRef();
  const titleRef = useRef();
  const subtitleRef = useRef();
  const buttonsRef = useRef();
  const imageRef = useRef();
  const statsRef = useRef();
  const floatingElementsRef = useRef();
  const badgesRef = useRef();

  useGSAP(
    () => {
      // Professional entrance animation
      const tl = gsap.timeline();

      // Floating elements animation
      gsap.fromTo(
        floatingElementsRef.current.children,
        {
          opacity: 0,
          scale: 0,
          rotation: 180,
        },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1,
          stagger: 0.2,
          ease: "back.out(1.7)",
          delay: 0.5,
        }
      );

      // Continuous floating animation
      gsap.to(floatingElementsRef.current.children, {
        y: -20,
        duration: 3,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.5,
      });

      // Main content animation
      tl.fromTo(
        titleRef.current,
        {
          opacity: 0,
          y: 50,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
        }
      )
        .fromTo(
          subtitleRef.current,
          {
            opacity: 0,
            y: 30,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
          },
          "-=0.3"
        )
        .fromTo(
          buttonsRef.current.children,
          {
            opacity: 0,
            y: 20,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: "back.out(1.7)",
          },
          "-=0.2"
        )
        .fromTo(
          imageRef.current,
          {
            opacity: 0,
            scale: 0.8,
          },
          {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.6"
        )
        .fromTo(
          badgesRef.current.children,
          {
            opacity: 0,
            scale: 0.8,
            y: 20,
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: "back.out(1.7)",
          },
          "-=0.4"
        )
        .fromTo(
          statsRef.current.children,
          {
            opacity: 0,
            y: 30,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out",
          },
          "-=0.3"
        );
    },
    { scope: heroRef }
  );

  return (
    <section
      ref={heroRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-23 pb-16 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30"></div>
      
      {/* Floating Elements */}
      <div ref={floatingElementsRef} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-2xl rotate-12"></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full"></div>
        <div className="absolute bottom-40 left-20 w-20 h-20 bg-gradient-to-br from-pink-400/20 to-indigo-400/20 rounded-3xl -rotate-12"></div>
        <div className="absolute bottom-20 right-10 w-14 h-14 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-xl rotate-45"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Content Section */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-6">
              <h1
                ref={titleRef}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-gray-900"
              >
                <ScrambleText text="Transform" delay={0.8} />
                <br />
                <ScrambleText text="Your Team's" delay={1.0} />
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  <ScrambleText text="Collaboration" delay={1.2} />
                </span>
              </h1>
              
              <p
                ref={subtitleRef}
                className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              >
                The all-in-one workspace that brings your team together. Streamline communication, 
                manage projects, and boost productivity with our powerful collaboration platform.
              </p>
            </div>

            {/* CTA Buttons */}
            <div
              ref={buttonsRef}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <button
                onClick={() => (window.location.href = "/signup")}
                className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>

              <button className="group px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all duration-300 cursor-pointer">
                <span className="flex items-center gap-2">
                  <Play className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  Watch Demo
                </span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Free 14-day trial
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Cancel anytime
              </div>
            </div>

            {/* Stats */}
            <div
              ref={statsRef}
              className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200"
            >
              <div className="text-center lg:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">50K+</div>
                <div className="text-sm text-gray-600">Active Teams</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">4.9★</div>
                <div className="text-sm text-gray-600">User Rating</div>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="relative">
            <div className="relative z-10">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-3xl blur-2xl"></div>
              <img
                ref={imageRef}
                src={landing_page_pic}
                alt="Team collaboration dashboard"
                className="relative z-10 w-full max-w-lg mx-auto rounded-2xl shadow-2xl"
              />
            </div>
            
            {/* Floating badges */}
            <div ref={badgesRef}>
              <div className="absolute -top-4 -left-4 bg-white rounded-xl shadow-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-900">50+ Teams</span>
                </div>
              </div>
              
              <div className="absolute top-1/2 -right-6 bg-white rounded-xl shadow-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">Real-time</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-6 bg-white rounded-xl shadow-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;