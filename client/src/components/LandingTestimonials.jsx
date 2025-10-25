import { Star, Quote, ArrowLeft, ArrowRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

const LandingTestimonials = () => {
  const sectionRef = useRef();
  const headerRef = useRef();
  const carouselRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);

  useGSAP(() => {
    // Header animation
    gsap.fromTo(headerRef.current.children,
      {
        opacity: 0,
        y: 40,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Testimonials animation
    gsap.fromTo(carouselRef.current.children,
      {
        opacity: 0,
        y: 40,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: carouselRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );

  }, { scope: sectionRef });

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager",
      company: "TechFlow Inc.",
      avatar: "SC",
      rating: 5,
      text: "SyncSpace has completely transformed how our team collaborates. The real-time features and intuitive interface make project management effortless. We've seen a 40% increase in productivity since switching.",
      highlight: "40% increase in productivity"
    },
    {
      name: "Marcus Rodriguez",
      role: "Engineering Lead",
      company: "DevCorp",
      avatar: "MR",
      rating: 5,
      text: "The video meeting integration is seamless, and the security features give us peace of mind. Our distributed team feels more connected than ever. It's like having everyone in the same room.",
      highlight: "Seamless remote collaboration"
    },
    {
      name: "Emily Watson",
      role: "Creative Director",
      company: "Design Studio",
      avatar: "EW",
      rating: 5,
      text: "As a creative team, we need tools that don't get in our way. SyncSpace's clean interface and powerful features let us focus on what matters most - creating amazing work together.",
      highlight: "Focus on creativity, not tools"
    },
    {
      name: "David Kim",
      role: "Startup Founder",
      company: "InnovateLab",
      avatar: "DK",
      rating: 5,
      text: "From day one, SyncSpace scaled with our growing team. The role management and permissions system is exactly what we needed. It's the backbone of our remote-first culture.",
      highlight: "Scales with growing teams"
    },
    {
      name: "Lisa Thompson",
      role: "Operations Manager",
      company: "GlobalTech",
      avatar: "LT",
      rating: 5,
      text: "The analytics dashboard gives us insights we never had before. We can track team performance and identify bottlenecks instantly. It's like having a crystal ball for project management.",
      highlight: "Data-driven insights"
    },
    {
      name: "Alex Johnson",
      role: "Team Lead",
      company: "AgileWorks",
      avatar: "AJ",
      rating: 5,
      text: "Customer support is outstanding, and the platform is incredibly reliable. We've had zero downtime issues, and the team responds to questions within minutes. Truly exceptional service.",
      highlight: "Outstanding support & reliability"
    }
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const getVisibleTestimonials = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % testimonials.length;
      visible.push(testimonials[index]);
    }
    return visible;
  };

  return (
    <section 
      ref={sectionRef}
      id="testimonials"
      className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Customer Stories
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Loved by teams
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              worldwide
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Don't just take our word for it. Here's what real teams are saying about 
            their experience with SyncSpace.
          </p>
        </div>

        {/* Enhanced Testimonials Carousel */}
        <div className="relative">
          <div ref={carouselRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {getVisibleTestimonials().map((testimonial, index) => (
              <div
                key={`${testimonial.name}-${currentIndex}-${index}`}
                className={`group relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-gray-200 cursor-pointer transform hover:scale-105 hover:-translate-y-2 ${
                  index === 1 ? 'lg:scale-110 lg:shadow-2xl lg:border-indigo-200 lg:bg-gradient-to-br lg:from-white lg:to-indigo-50/30' : ''
                }`}
              >
                {/* Enhanced Quote icon */}
                <div className="absolute top-6 right-6 w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Quote className="w-5 h-5 text-indigo-600 group-hover:text-purple-600 transition-colors duration-300" />
                </div>

                {/* Enhanced Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current group-hover:scale-110 transition-transform duration-300" style={{ transitionDelay: `${i * 50}ms` }} />
                  ))}
                </div>

                {/* Testimonial text */}
                <p className="text-gray-700 leading-relaxed mb-6 text-lg group-hover:text-gray-800 transition-colors duration-300">
                  "{testimonial.text}"
                </p>

                {/* Enhanced Highlight */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-full text-sm font-medium text-indigo-700 mb-6 group-hover:from-indigo-100 group-hover:via-purple-100 group-hover:to-pink-100 transition-all duration-300 shadow-sm">
                  <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
                  {testimonial.highlight}
                </div>

                {/* Enhanced Author */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={prevTestimonial}
              className="group p-3 bg-white border border-gray-200 rounded-full hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors duration-300" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    index === currentIndex 
                      ? 'bg-indigo-600 w-8' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className="group p-3 bg-white border border-gray-200 rounded-full hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 cursor-pointer"
            >
              <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors duration-300" />
            </button>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-16 border-t border-gray-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">4.9/5</div>
            <div className="text-gray-600">Average Rating</div>
            <div className="flex justify-center mt-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
              ))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">10K+</div>
            <div className="text-gray-600">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">99%</div>
            <div className="text-gray-600">Would Recommend</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingTestimonials;