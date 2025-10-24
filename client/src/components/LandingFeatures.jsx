import { 
  MessageCircle, 
  Calendar, 
  Users, 
  BarChart3, 
  Shield, 
  Zap, 
  Video, 
  Bell,
  ArrowRight,
  CheckCircle 
} from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const LandingFeatures = () => {
  const sectionRef = useRef();
  const headerRef = useRef();
  const gridRef = useRef();
  const ctaRef = useRef();

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

    // Feature cards animation
    gsap.fromTo(gridRef.current.children,
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
        ease: "power2.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // CTA animation
    gsap.fromTo(ctaRef.current,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );

  }, { scope: sectionRef });

  const features = [
    {
      icon: MessageCircle,
      title: "Real-time Messaging",
      description: "Instant communication with your team through channels, direct messages, and group conversations.",
      benefits: ["Unlimited messages", "File sharing", "Message history"],
      color: "from-blue-500 to-indigo-500"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Coordinate meetings, events, and deadlines with our intelligent calendar system.",
      benefits: ["Meeting scheduling", "Event reminders", "Calendar sync"],
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Organize your team with role-based permissions and seamless collaboration tools.",
      benefits: ["Role management", "Team invitations", "Access controls"],
      color: "from-purple-500 to-violet-500"
    },
    {
      icon: Video,
      title: "Video Meetings",
      description: "Built-in video conferencing with screen sharing and recording capabilities.",
      benefits: ["HD video calls", "Screen sharing", "Meeting recordings"],
      color: "from-red-500 to-pink-500"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track team productivity and project progress with comprehensive analytics.",
      benefits: ["Performance metrics", "Custom reports", "Data insights"],
      color: "from-orange-500 to-amber-500"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Stay updated with intelligent notifications that keep you informed without overwhelming.",
      benefits: ["Custom alerts", "Priority filtering", "Mobile sync"],
      color: "from-teal-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with end-to-end encryption and compliance certifications.",
      benefits: ["End-to-end encryption", "SOC 2 compliant", "Data protection"],
      color: "from-gray-600 to-slate-600"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized performance with real-time sync and offline capabilities.",
      benefits: ["Real-time sync", "Offline mode", "Fast loading"],
      color: "from-yellow-500 to-orange-500"
    }
  ];

  return (
    <section 
      ref={sectionRef}
      id="features" 
      className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Powerful Features
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Everything your team
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              needs to succeed
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover the comprehensive suite of tools designed to streamline your workflow 
            and supercharge your team's productivity.
          </p>
        </div>

        {/* Features Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 cursor-pointer"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                  {feature.description}
                </p>
                
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div ref={ctaRef} className="text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 lg:p-12 text-white">
            <h3 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to transform your workflow?
            </h3>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Join thousands of teams who've already upgraded their collaboration experience with SyncSpace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => (window.location.href = "/signup")}
                className="group px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
              <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;