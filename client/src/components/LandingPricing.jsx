import { Check, X, Star, ArrowRight, Zap, Crown, Users } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

const LandingPricing = () => {
  const sectionRef = useRef();
  const headerRef = useRef();
  const cardsRef = useRef();
  const [isAnnual, setIsAnnual] = useState(true);

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

    // Cards animation
    gsap.fromTo(cardsRef.current.children,
      {
        opacity: 0,
        y: 60,
        scale: 0.9,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        stagger: 0.15,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );

  }, { scope: sectionRef });

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small teams getting started",
      icon: Users,
      monthlyPrice: 0,
      annualPrice: 0,
      popular: false,
      features: [
        "Up to 5 team members",
        "10GB storage",
        "Basic messaging",
        "Calendar integration",
        "Email support",
        "Mobile apps"
      ],
      limitations: [
        "Limited video meetings (40 min)",
        "Basic analytics",
        "Standard security"
      ],
      cta: "Start Free",
      color: "from-gray-600 to-slate-600"
    },
    {
      name: "Professional",
      description: "Ideal for growing teams and businesses",
      icon: Zap,
      monthlyPrice: 12,
      annualPrice: 10,
      popular: true,
      features: [
        "Up to 50 team members",
        "100GB storage",
        "Advanced messaging & channels",
        "Unlimited video meetings",
        "Advanced analytics",
        "Priority support",
        "Custom integrations",
        "Role management",
        "Advanced security"
      ],
      limitations: [],
      cta: "Start Free Trial",
      color: "from-indigo-600 to-purple-600"
    },
    {
      name: "Enterprise",
      description: "For large organizations with advanced needs",
      icon: Crown,
      monthlyPrice: 25,
      annualPrice: 20,
      popular: false,
      features: [
        "Unlimited team members",
        "Unlimited storage",
        "All Professional features",
        "Advanced admin controls",
        "SSO integration",
        "Custom branding",
        "Dedicated support",
        "SLA guarantee",
        "Advanced compliance",
        "Custom workflows"
      ],
      limitations: [],
      cta: "Contact Sales",
      color: "from-purple-600 to-pink-600"
    }
  ];

  return (
    <section 
      ref={sectionRef}
      id="pricing"
      className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Simple Pricing
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Choose the perfect
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              plan for your team
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Start free and scale as you grow. All plans include our core collaboration 
            features with no hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                !isAnnual 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 relative ${
                isAnnual 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-xl cursor-pointer ${
                plan.popular 
                  ? 'border-indigo-500 shadow-xl scale-105' 
                  : 'border-gray-200 hover:border-gray-300 shadow-lg'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan header */}
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-gray-900">
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-gray-600">
                      {plan.monthlyPrice === 0 ? '' : '/month'}
                    </span>
                  </div>
                  {isAnnual && plan.monthlyPrice > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Billed annually (${(isAnnual ? plan.annualPrice : plan.monthlyPrice) * 12}/year)
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <X className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500">{limitation}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    if (plan.name === 'Enterprise') {
                      // Handle contact sales
                      window.location.href = 'mailto:sales@syncspace.com';
                    } else {
                      window.location.href = '/signup';
                    }
                  }}
                  className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 group ${
                    plan.popular
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                      : 'border-2 border-gray-300 text-gray-700 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {plan.cta}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-2xl p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Need a custom solution?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              We offer custom enterprise solutions with dedicated support, 
              advanced security, and tailored integrations for large organizations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-300 cursor-pointer">
                Contact Sales
              </button>
              <button className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-300 cursor-pointer">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingPricing;