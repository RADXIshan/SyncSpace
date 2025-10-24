import { Users, Clock, Globe, CheckCircle, TrendingUp, Award } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const LandingStats = () => {
  const sectionRef = useRef();
  const statsRef = useRef();
  const counterRefs = useRef([]);

  useGSAP(() => {
    // Stats animation
    gsap.fromTo(statsRef.current.children,
      {
        opacity: 0,
        y: 40,
        scale: 0.9,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Counter animations
    counterRefs.current.forEach((counter, index) => {
      if (counter) {
        const finalValue = counter.dataset.value;
        const obj = { value: 0 };
        
        gsap.to(obj, {
          value: finalValue,
          duration: 2,
          ease: "power2.out",
          onUpdate: () => {
            if (finalValue.includes('K')) {
              counter.textContent = Math.round(obj.value) + 'K+';
            } else if (finalValue.includes('%')) {
              counter.textContent = obj.value.toFixed(1) + '%';
            } else if (finalValue.includes('★')) {
              counter.textContent = obj.value.toFixed(1) + '★';
            } else {
              counter.textContent = Math.round(obj.value) + '+';
            }
          },
          scrollTrigger: {
            trigger: counter,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        });
      }
    });

  }, { scope: sectionRef });

  const stats = [
    {
      icon: Users,
      value: "50K",
      label: "Active Teams",
      description: "Teams worldwide trust SyncSpace",
      color: "from-blue-500 to-indigo-500"
    },
    {
      icon: Clock,
      value: "99.9%",
      label: "Uptime",
      description: "Reliable service you can count on",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Globe,
      value: "150+",
      label: "Countries",
      description: "Global reach, local impact",
      color: "from-purple-500 to-violet-500"
    },
    {
      icon: CheckCircle,
      value: "1M+",
      label: "Tasks Completed",
      description: "Productivity milestones achieved",
      color: "from-orange-500 to-amber-500"
    },
    {
      icon: TrendingUp,
      value: "300%",
      label: "Productivity Boost",
      description: "Average team improvement",
      color: "from-teal-500 to-cyan-500"
    },
    {
      icon: Award,
      value: "4.9★",
      label: "User Rating",
      description: "Consistently top-rated platform",
      color: "from-pink-500 to-rose-500"
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
            <TrendingUp className="w-4 h-4" />
            Trusted Worldwide
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Numbers that speak
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              for themselves
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Join a growing community of teams who've transformed their collaboration 
            and achieved remarkable results with SyncSpace.
          </p>
        </div>

        {/* Stats Grid */}
        <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 cursor-pointer"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                
                <div 
                  ref={el => counterRefs.current[index] = el}
                  data-value={stat.value.replace(/[^\d.]/g, '')}
                  className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2"
                >
                  {stat.value}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {stat.label}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full border-2 border-white flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Join 50,000+ teams</p>
              <p className="text-xs text-gray-600">Start your free trial today</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingStats;