import {
  ArrowRight,
  Play,
  Users,
  Zap,
  Shield,
  CheckCircle,
  Sparkles,
  Globe,
} from "lucide-react";
import landing_page_pic from "../assets/landing_page_pic.png";

const LandingHero = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-12 sm:pb-16"
    >
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Content Section */}
          <div className="text-center lg:text-left space-y-6 sm:space-y-8">
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-white">
                Connect, <br className="hidden sm:block" /> Create, <br />
                <span className="gradient-text-purple">
                  Collaborate
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Experience the next generation of team collaboration. Our
                AI-powered platform seamlessly integrates communication, project
                management, and productivity tools in one beautiful workspace.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <button
                onClick={() => (window.location.href = "/signup")}
                className="glass-button px-6 sm:px-8 py-3 sm:py-4 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 group cursor-pointer text-sm sm:text-base"
              >
                Get Started
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 justify-center lg:justify-start pt-3 sm:pt-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-white/70">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                <span>Completely free</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-white/70">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                <span>Intuitive for the new</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-white/70">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                <span>Get started within minutes</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-6 sm:pt-8">
              <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center lg:text-left">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  50K+
                </div>
                <div className="text-xs sm:text-sm text-white/70">Active Teams</div>
              </div>
              <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center lg:text-left">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  99.8%
                </div>
                <div className="text-xs sm:text-sm text-white/70">Uptime</div>
              </div>
              <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center lg:text-left">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  4.8 ★
                </div>
                <div className="text-xs sm:text-sm text-white/70">User Rating</div>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="relative mt-8 sm:mt-12 lg:mt-20">
            <div className="relative z-10">
              <div className="glass rounded-2xl sm:rounded-3xl p-1.5 sm:p-2">
                <img
                  src={landing_page_pic}
                  alt="Team collaboration dashboard"
                  className="w-full max-w-lg mx-auto rounded-xl sm:rounded-2xl"
                />
              </div>
            </div>

            {/* Floating badges - Hidden on mobile for cleaner look */}
            <div className="absolute inset-0 z-20 hidden md:block">
              {/* Top Left Badge */}
              <div className="absolute -top-8 -left-2 transform -translate-x-1/2">
                <div className="glass rounded-xl lg:rounded-2xl p-3 lg:p-4">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg lg:rounded-xl flex items-center justify-center">
                      <Users className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs lg:text-sm font-bold text-white">50K+</div>
                      <div className="text-[10px] lg:text-xs text-white/70">Active Teams</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Right Badge */}
              <div className="absolute -top-2 -right-10 transform -translate-y-1/2">
                <div className="glass rounded-xl lg:rounded-2xl p-3 lg:p-4">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl flex items-center justify-center">
                      <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs lg:text-sm font-bold text-white">
                        Real-time
                      </div>
                      <div className="text-[10px] lg:text-xs text-white/70">Sync</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Right Badge */}
              <div className="absolute -bottom-8 -right-4 transform -translate-x-1/2">
                <div className="glass rounded-xl lg:rounded-2xl p-3 lg:p-4">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg lg:rounded-xl flex items-center justify-center">
                      <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs lg:text-sm font-bold text-white">
                        Enterprise
                      </div>
                      <div className="text-[10px] lg:text-xs text-white/70">Security</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Left Badge */}
              <div className="absolute -bottom-6 -left-10 transform -translate-y-1/2">
                <div className="glass rounded-xl lg:rounded-2xl p-3 lg:p-4">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg lg:rounded-xl flex items-center justify-center">
                      <Globe className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs lg:text-sm font-bold text-white">Global</div>
                      <div className="text-[10px] lg:text-xs text-white/70">Reach</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
