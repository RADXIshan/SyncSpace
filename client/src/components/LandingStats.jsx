import {
  Users,
  Clock,
  Globe,
  CheckCircle,
  TrendingUp,
  Award,
  Zap,
  Target,
  Infinity,
} from "lucide-react";

const LandingStats = () => {
  const stats = [
    {
      icon: Users,
      value: "300K+",
      label: "Global Users",
      description: "Innovators worldwide choose our platform",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: Infinity,
      value: "99.8%",
      label: "Uptime",
      description: "Quantum-reliable infrastructure",
      color: "from-emerald-500 to-teal-600",
    },
    {
      icon: Globe,
      value: "195+",
      label: "Countries",
      description: "Truly global collaboration network",
      color: "from-purple-500 to-violet-600",
    },
    {
      icon: Target,
      value: "4M+",
      label: "Goals Achieved",
      description: "Success stories powered by AI",
      color: "from-orange-500 to-amber-600",
    },
    {
      icon: Zap,
      value: "500%",
      label: "Efficiency Gain",
      description: "Revolutionary productivity boost",
      color: "from-cyan-500 to-blue-600",
    },
    {
      icon: Award,
      value: "4.8 ★",
      label: "Perfect Rating",
      description: "Unmatched user satisfaction",
      color: "from-pink-500 to-rose-600",
    },
  ];

  return (
    <section className="py-10 lg:py-16 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 text-sm font-medium text-white/90 mb-8">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Proven Excellence
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-8">
            Impact That Speaks
            <span className="block gradient-text-purple">
              Volumes
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Join the revolution that's transforming how teams collaborate. 
            These numbers represent real transformation, real success.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="glass rounded-3xl p-8 hover:bg-white/20 transition-all duration-300 group relative overflow-hidden"
            >
              {/* Background glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              {/* Content */}
              <div className="text-center relative z-10">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}
                >
                  <stat.icon className="w-8 h-8 text-white" />
                </div>

                <div className="text-4xl lg:text-5xl font-bold text-white mb-3">
                  {stat.value}
                </div>

                <h3 className="text-xl font-semibold text-white mb-4">
                  {stat.label}
                </h3>

                <p className="text-white/70 leading-relaxed">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="glass rounded-3xl p-8 relative overflow-hidden">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="flex -space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full border-2 border-white/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full border-2 border-white/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-emerald-600 rounded-full border-2 border-white/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-center md:text-left">
                <p className="text-lg font-semibold text-white mb-1">
                  Join 300,000+ Innovators
                </p>
                <p className="text-white/70">
                  Experience the future of collaboration today
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingStats;
