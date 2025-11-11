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
  CheckCircle,
  Sparkles,
  Brain,
  Rocket,
} from "lucide-react";

const LandingFeatures = () => {
  const features = [
    {
      icon: MessageCircle,
      title: "Real-Time Messaging",
      description:
        "Instant communication with organized channels, direct messages, and rich text formatting.",
      benefits: ["Channel-based chat", "Direct messaging", "Message history"],
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: Calendar,
      title: "Integrated Calendar",
      description:
        "Schedule and manage events, meetings, and deadlines with a full-featured calendar system.",
      benefits: ["Event scheduling", "Meeting reminders", "Calendar sharing"],
      color: "from-emerald-500 to-teal-600",
    },
    {
      icon: Users,
      title: "Organization Management",
      description:
        "Create and manage organizations with role-based permissions and member management.",
      benefits: [
        "Role-based access",
        "Member invitations",
        "Organization settings",
      ],
      color: "from-purple-500 to-violet-600",
    },
    {
      icon: Video,
      title: "Video Meetings",
      description:
        "Built-in video conferencing with meeting rooms and collaborative features.",
      benefits: ["Video calls", "Meeting rooms", "Screen sharing"],
      color: "from-pink-500 to-rose-600",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description:
        "Stay updated with intelligent notifications for mentions, meetings, and important updates.",
      benefits: ["Mention alerts", "Meeting reminders", "Custom filters"],
      color: "from-orange-500 to-amber-600",
    },
    {
      icon: BarChart3,
      title: "Notice Board",
      description:
        "Share announcements, updates, and important information with your entire organization.",
      benefits: ["Team announcements", "Policy updates", "Important notices"],
      color: "from-cyan-500 to-blue-600",
    },
    {
      icon: Shield,
      title: "Secure Authentication",
      description:
        "Enterprise-grade security with JWT tokens, password reset, and email verification.",
      benefits: [
        "JWT authentication",
        "Password recovery",
        "Email verification",
      ],
      color: "from-slate-600 to-gray-700",
    },
    {
      icon: Zap,
      title: "Real-Time Sync",
      description:
        "Lightning-fast real-time updates across all devices with WebSocket technology.",
      benefits: ["Live updates", "Cross-device sync", "Instant messaging"],
      color: "from-yellow-500 to-orange-600",
    },
  ];

  return (
    <section
      id="features"
      className="py-8 sm:py-10 lg:py-16 px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-24">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white/90 mb-6 sm:mb-8">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
            Powerful Features
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 lg:mb-8 px-4">
            Everything You Need for
            <span className="block gradient-text-purple mt-2">
              Team Collaboration
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed px-4">
            A comprehensive platform with real-time messaging, video meetings,
            calendar integration, and organization management tools designed for
            modern teams.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16 lg:mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-button-enhanced rounded-3xl p-6 feature-card-hover group cursor-pointer relative overflow-hidden"
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-blue-600/0 group-hover:from-purple-600/10 group-hover:to-blue-600/10 transition-all duration-300 rounded-3xl"></div>
              
              <div className="relative z-10">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">
                  {feature.title}
                </h3>

                <p className="text-white/70 mb-6 leading-relaxed text-sm group-hover:text-white/90 transition-colors">
                  {feature.description}
                </p>

                <ul className="space-y-3">
                  {feature.benefits.map((benefit, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-white/80 text-sm group-hover:text-white transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center px-4">
          <div className="glass-button-enhanced rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
            {/* Animated background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-3xl group-hover:from-purple-600/40 group-hover:to-blue-600/40 transition-all duration-500"></div>
            
            {/* Animated glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 glass-button-enhanced rounded-full px-6 py-3 text-sm font-medium text-white/90 mb-6">
                <Rocket className="w-4 h-4 text-purple-400" />
                <span>Start Your Journey Today</span>
              </div>
              
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
                Ready to Transform Your Team?
              </h3>
              <p className="text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                Join 50,000+ teams already using SyncSpace to streamline
                their communication and boost productivity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => (window.location.href = "/signup")}
                  className="glass-button-enhanced px-10 py-5 text-white font-bold rounded-2xl flex items-center justify-center gap-2 group cursor-pointer text-lg shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
                >
                  <Sparkles className="w-5 h-5" />
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="glass px-10 py-5 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 group cursor-pointer text-lg hover:bg-white/10 transition-all duration-300"
                >
                  View Pricing
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Free forever plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;
