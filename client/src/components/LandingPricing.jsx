import {
  Check,
  X,
  Star,
  ArrowRight,
  Zap,
  Crown,
  Users,
  Rocket,
  Infinity,
  Brain,
} from "lucide-react";
import { useState } from "react";

const LandingPricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Explorer",
      description: "Perfect for visionary teams starting their journey",
      icon: Rocket,
      monthlyPrice: 0,
      annualPrice: 0,
      popular: false,
      features: [
        "Up to 10 future builders",
        "50GB quantum storage",
        "AI-powered messaging",
        "Basic predictive analytics",
        "Immersive video calls",
        "Mobile & desktop apps",
      ],
      limitations: [
        "Limited AI insights",
        "Standard security protocols",
        "Community support",
      ],
      cta: "Start Your Journey",
      color: "from-cyan-500 to-blue-600",
    },
    {
      name: "Visionary",
      description: "For teams ready to reshape their industry",
      icon: Brain,
      monthlyPrice: 29,
      annualPrice: 24,
      popular: true,
      features: [
        "Up to 100 team members",
        "1TB quantum storage",
        "Full AI collaboration suite",
        "Predictive project analytics",
        "Unlimited immersive meetings",
        "Dynamic team formation",
        "Contextual intelligence",
        "Priority neural support",
        "Advanced quantum security",
      ],
      limitations: [],
      cta: "Transform Your Team",
      color: "from-purple-500 to-pink-600",
    },
    {
      name: "Infinite",
      description: "For organizations building the future",
      icon: Infinity,
      monthlyPrice: 99,
      annualPrice: 79,
      popular: false,
      features: [
        "Unlimited future builders",
        "Infinite quantum storage",
        "All Visionary features",
        "Custom AI model training",
        "Quantum encryption",
        "White-label platform",
        "Dedicated success architect",
        "99.99% uptime SLA",
        "Regulatory compliance suite",
        "Custom workflow automation",
      ],
      limitations: [],
      cta: "Unlock Infinity",
      color: "from-gradient-to-r from-yellow-400 via-pink-500 to-purple-600",
    },
  ];

  return (
    <section
      id="pricing"
      className="py-10 lg:py-16 px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 text-sm font-medium text-white/90 mb-8">
            <Star className="w-4 h-4 text-yellow-400" />
            Future-Ready Pricing
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-8">
            Invest in Your
            <span className="block gradient-text-purple">Team's Future</span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-10">
            Choose the plan that matches your ambition. Every plan includes
            revolutionary AI features that will transform how your team works.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-2 glass rounded-2xl">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 cursor-pointer ${
                !isAnnual
                  ? "glass-button text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 relative cursor-pointer ${
                isAnnual
                  ? "glass-button text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs rounded-full">
                Save 30%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative glass rounded-3xl hover:bg-white/20 transition-all duration-300 group ${
                plan.popular ? "scale-105" : ""
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="glass-button-enhanced px-6 py-2 rounded-full text-sm font-semibold text-white">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan header */}
                <div className="text-center mb-8">
                  <div
                    className={`w-18 h-18 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}
                  >
                    <plan.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {plan.name}
                  </h3>
                  <p className="text-white/70">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-white">
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-white/70">
                      {plan.monthlyPrice === 0 ? "" : "/month"}
                    </span>
                  </div>
                  {isAnnual && plan.monthlyPrice > 0 && (
                    <p className="text-sm text-white/60 mt-2">
                      Billed annually ($
                      {(isAnnual ? plan.annualPrice : plan.monthlyPrice) * 12}
                      /year)
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-white/90">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <X className="w-5 h-5 text-white/40 flex-shrink-0" />
                      <span className="text-white/60">{limitation}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    if (plan.name === "Infinite") {
                      window.location.href = "mailto:future@syncspace.com";
                    } else {
                      window.location.href = "/signup";
                    }
                  }}
                  className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer ${
                    plan.popular
                      ? "glass-button text-white"
                      : "glass text-white/90 hover:text-white"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingPricing;
