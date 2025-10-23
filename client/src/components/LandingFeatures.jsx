import { Zap, Users, BarChart3, Shield, ArrowRight, Sparkles } from "lucide-react";

function Features() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast Automation",
      description: "Streamline your workflows with intelligent automation that eliminates manual tasks and reduces errors by up to 90%.",
      highlight: "90% Error Reduction",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: Users,
      title: "Seamless Team Collaboration",
      description: "Keep your entire team synchronized with real-time updates, shared workspaces, and crystal-clear communication channels.",
      highlight: "Real-time Sync",
      color: "from-blue-400 to-indigo-500"
    },
    {
      icon: BarChart3,
      title: "Unified Analytics Dashboard",
      description: "Make data-driven decisions with comprehensive insights and analytics all consolidated in one powerful dashboard.",
      highlight: "Single Source of Truth",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      description: "Protect your data with advanced encryption, role-based permissions, and industry-leading security protocols.",
      highlight: "Bank-Level Security",
      color: "from-purple-400 to-pink-500"
    }
  ];

  return (
    <section 
      id="features" 
      className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
            Powerful Features for{" "}
            <span className="bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] bg-clip-text text-transparent">
              Modern Teams
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-4">
            Discover the tools and capabilities that make SyncSpace the ultimate collaboration platform for teams of all sizes
          </p>
          <div className="mt-6 w-24 h-1 mx-auto bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] rounded-full"></div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative flex flex-col h-full"
            >
              {/* Animated border gradient */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${feature.color} rounded-3xl blur-sm group-hover:blur-md transition-all duration-500 opacity-30 group-hover:opacity-50`}></div>
              
              {/* Main card */}
              <div className="relative flex flex-col h-full p-4 sm:p-6 lg:p-8 xl:p-10 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group-hover:bg-white/90 cursor-pointer">
                
                {/* Icon and highlight badge */}
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <div className={`px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r ${feature.color} text-white text-xs sm:text-sm font-semibold shadow-md opacity-90 group-hover:opacity-100 transition-opacity`}>
                    {feature.highlight}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 group-hover:text-gray-900 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed mb-4 sm:mb-6 group-hover:text-gray-700 transition-colors">
                    {feature.description}
                  </p>
                </div>

                {/* Learn more link */}
                <div onClick={() => window.location.href = "/signup"} className="flex items-center gap-2 text-purple-600 font-semibold group-hover:text-purple-700 transition-colors cursor-pointer">
                  <span className="text-sm sm:text-base">Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>

                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-purple-100/50 to-indigo-100/50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute bottom-4 left-4 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export default Features;