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
      className="py-10 lg:py-16 px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20 lg:mb-24">
          <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 text-sm font-medium text-white/90 mb-8">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Powerful Features
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-8">
            Everything You Need for
            <span className="block gradient-text-purple">
              Team Collaboration
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            A comprehensive platform with real-time messaging, video meetings,
            calendar integration, and organization management tools designed for
            modern teams.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass rounded-3xl p-6 hover:bg-white/20 transition-all duration-300 group"
            >
              <div
                className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6`}
              >
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-xl font-bold text-white mb-4">
                {feature.title}
              </h3>

              <p className="text-white/70 mb-6 leading-relaxed text-sm">
                {feature.description}
              </p>

              <ul className="space-y-3">
                {feature.benefits.map((benefit, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 text-white/80 text-sm"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="glass rounded-3xl p-8 lg:p-12 relative overflow-hidden">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl"></div>

            <div className="relative z-10">
              <h3 className="text-3xl lg:text-4xl font-bold mb-6 text-white">
                Ready to Get Started?
              </h3>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Join thousands of teams already using our platform to streamline
                their communication and collaboration.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => (window.location.href = "/signup")}
                  className="glass-button px-8 py-4 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 group"
                >
                  Start Collaborating
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;
