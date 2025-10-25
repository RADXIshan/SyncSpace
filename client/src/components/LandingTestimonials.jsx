import { Star, Quote, ArrowLeft, ArrowRight, Sparkles, Heart } from "lucide-react";
import { useState } from "react";

const LandingTestimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "AI Product Lead",
      company: "QuantumFlow",
      avatar: "SC",
      rating: 5,
      text: "This platform has revolutionized our AI development workflow. The predictive analytics and real-time collaboration features are beyond anything we've experienced. Our team velocity increased by 400%.",
      highlight: "400% velocity increase"
    },
    {
      name: "Marcus Rodriguez",
      role: "CTO",
      company: "NeuralCorp",
      avatar: "MR",
      rating: 5,
      text: "The quantum security and immersive meeting experiences feel like science fiction made real. Our distributed team across 12 time zones collaborates as if we're in the same room.",
      highlight: "Seamless global collaboration"
    },
    {
      name: "Emily Watson",
      role: "Innovation Director",
      company: "FutureDesign",
      avatar: "EW",
      rating: 5,
      text: "The AI-powered creative tools understand our design intent and suggest improvements we never considered. It's like having a genius creative partner that never sleeps.",
      highlight: "AI creative partnership"
    },
    {
      name: "David Kim",
      role: "Startup Visionary",
      company: "NextGenLab",
      avatar: "DK",
      rating: 5,
      text: "From stealth mode to IPO, this platform scaled with our exponential growth. The dynamic team formation and skill matching features are pure magic for building the perfect teams.",
      highlight: "Scales to infinity"
    },
    {
      name: "Lisa Thompson",
      role: "Operations Oracle",
      company: "HyperTech",
      avatar: "LT",
      rating: 5,
      text: "The predictive analytics don't just show what happened - they predict what will happen. We prevent problems before they exist and optimize for outcomes we didn't know were possible.",
      highlight: "Predicts the future"
    },
    {
      name: "Alex Johnson",
      role: "Team Architect",
      company: "InfiniteWorks",
      avatar: "AJ",
      rating: 5,
      text: "Support feels like having a team of AI assistants who understand our business better than we do. The platform learns and evolves with us - it's truly alive.",
      highlight: "Living, breathing platform"
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
      id="testimonials"
      className="py-10 lg:py-16 px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 text-sm font-medium text-white/90 mb-8">
            <Heart className="w-4 h-4 text-pink-400" />
            Loved by Visionaries
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-8">
            Stories from the
            <span className="block gradient-text-purple">
              Future
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Hear from the pioneers who are already living in tomorrow. 
            These are the teams shaping the future of work.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {getVisibleTestimonials().map((testimonial, index) => (
              <div
                key={`${testimonial.name}-${currentIndex}-${index}`}
                className={`glass rounded-3xl p-8 hover:bg-white/20 transition-all duration-300 group relative overflow-hidden ${
                  index === 1 ? 'lg:scale-105' : ''
                }`}
              >
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 group-hover:from-purple-600/20 group-hover:to-blue-600/20 transition-all duration-300"></div>
                
                {/* Quote icon */}
                <div className="absolute -top-6 right-6 w-12 h-12 glass rounded-full flex items-center justify-center">
                  <Quote className="w-6 h-6 text-purple-400" />
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-6 relative z-10 pr-16">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Testimonial text */}
                <p className="text-white/90 leading-relaxed mb-8 text-lg relative z-10">
                  "{testimonial.text}"
                </p>

                {/* Highlight */}
                <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm font-medium text-white/90 mb-8 relative z-10">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  {testimonial.highlight}
                </div>

                {/* Author */}
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-lg">{testimonial.name}</h4>
                    <p className="text-white/70">{testimonial.role}</p>
                    <p className="text-white/60 text-sm">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={prevTestimonial}
              className="glass-button p-4 rounded-full group"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>

            {/* Dots */}
            <div className="flex gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 w-10' 
                      : 'bg-white/30 w-3 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className="glass-button p-4 rounded-full group"
            >
              <ArrowRight className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="glass rounded-3xl p-8 text-center">
            <div className="text-4xl font-bold text-white mb-3">4.8/5</div>
            <div className="text-white/70 mb-3">Perfect Rating</div>
            <div className="flex justify-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
            </div>
          </div>
          <div className="glass rounded-3xl p-8 text-center">
            <div className="text-4xl font-bold text-white mb-3">300K+</div>
            <div className="text-white/70">Future Builders</div>
          </div>
          <div className="glass rounded-3xl p-8 text-center">
            <div className="text-4xl font-bold text-white mb-3">100%</div>
            <div className="text-white/70">Would Recommend</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingTestimonials;