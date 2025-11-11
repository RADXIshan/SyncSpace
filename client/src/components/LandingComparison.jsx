import { Check, X, Sparkles } from "lucide-react";

const LandingComparison = () => {
  const features = [
    { name: "Real-time Messaging", syncspace: true, slack: true, teams: true, discord: true },
    { name: "Video Conferencing", syncspace: true, slack: true, teams: true, discord: true },
    { name: "AI Assistant", syncspace: true, slack: false, teams: false, discord: false },
    { name: "Smart Search", syncspace: true, slack: true, teams: true, discord: false },
    { name: "Meeting Reports", syncspace: true, slack: false, teams: true, discord: false },
    { name: "Voice Messages", syncspace: true, slack: false, teams: false, discord: true },
    { name: "Quick Polls", syncspace: true, slack: true, teams: true, discord: true },
    { name: "Focus Mode", syncspace: true, slack: false, teams: false, discord: false },
    { name: "Keyboard Shortcuts", syncspace: true, slack: true, teams: true, discord: true },
    { name: "Free Forever Plan", syncspace: true, slack: false, teams: false, discord: true },
    { name: "No User Limits", syncspace: true, slack: false, teams: false, discord: false },
    { name: "Unlimited Storage", syncspace: true, slack: false, teams: false, discord: false },
  ];

  const platforms = [
    { name: "SyncSpace", color: "from-purple-500 to-blue-600", highlight: true },
    { name: "Slack", color: "from-pink-500 to-purple-600", highlight: false },
    { name: "Teams", color: "from-blue-500 to-indigo-600", highlight: false },
    { name: "Discord", color: "from-indigo-500 to-purple-600", highlight: false },
  ];

  return (
    <section id="comparison" className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 glass-button-enhanced rounded-full px-6 py-3 text-sm font-medium text-white/90 mb-8">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Platform Comparison
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 px-4">
            Why Choose{" "}
            <span className="gradient-text-purple">SyncSpace?</span>
          </h2>
          <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed px-4">
            See how we stack up against the competition. More features, better value, completely free.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="glass-button-enhanced rounded-3xl p-4 sm:p-6 lg:p-8 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-white/70 font-semibold text-sm sm:text-base">
                  Feature
                </th>
                {platforms.map((platform, index) => (
                  <th key={index} className="py-4 px-4 text-center">
                    <div className={`inline-flex items-center gap-2 ${platform.highlight ? 'glass-button-enhanced' : 'glass'} rounded-xl px-4 py-2`}>
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${platform.color}`}></div>
                      <span className={`font-bold text-sm sm:text-base ${platform.highlight ? 'text-white' : 'text-white/80'}`}>
                        {platform.name}
                      </span>
                      {platform.highlight && (
                        <Sparkles className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr
                  key={index}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-4 text-white/90 font-medium text-sm sm:text-base">
                    {feature.name}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {feature.syncspace ? (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
                        <X className="w-5 h-5 text-white/40" />
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {feature.slack ? (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
                        <Check className="w-5 h-5 text-white/60" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/5">
                        <X className="w-5 h-5 text-white/30" />
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {feature.teams ? (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
                        <Check className="w-5 h-5 text-white/60" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/5">
                        <X className="w-5 h-5 text-white/30" />
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {feature.discord ? (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
                        <Check className="w-5 h-5 text-white/60" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/5">
                        <X className="w-5 h-5 text-white/30" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button
            onClick={() => (window.location.href = "/signup")}
            className="glass-button-enhanced px-10 py-5 text-white font-bold rounded-2xl inline-flex items-center gap-2 group cursor-pointer text-lg shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
          >
            <Sparkles className="w-5 h-5" />
            Try SyncSpace Free
          </button>
          <p className="text-white/60 mt-4 text-sm">
            No credit card required • Free forever plan available
          </p>
        </div>
      </div>
    </section>
  );
};

export default LandingComparison;
