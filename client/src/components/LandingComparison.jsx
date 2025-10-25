import { Check, X, Star, ArrowRight, Zap, Shield, Users, BarChart3 } from "lucide-react";

const LandingComparison = () => {

  const comparisonData = [
    {
      feature: "Real-time Collaboration",
      others: false,
      syncspace: true,
      icon: Users
    },
    {
      feature: "Advanced Analytics",
      others: "Limited",
      syncspace: true,
      icon: BarChart3
    },
    {
      feature: "Enterprise Security",
      others: "Basic",
      syncspace: true,
      icon: Shield
    },
    {
      feature: "API Integration",
      others: false,
      syncspace: true,
      icon: Zap
    },
    {
      feature: "24/7 Support",
      others: "Business hours only",
      syncspace: true,
      icon: null
    },
    {
      feature: "Custom Workflows",
      others: false,
      syncspace: true,
      icon: null
    }
  ];

  return (
    <section
      id="comparison"
      className="py-10 lg:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Why Choose Us
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            See how we
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              stack up
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Compare SyncSpace with traditional collaboration tools and see why 
            thousands of teams are making the switch.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Table Header */}
          <div className="grid grid-cols-3 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900">Features</h3>
            </div>
            <div className="p-6 text-center border-l border-gray-200">
              <h3 className="text-lg font-semibold text-gray-600">Other Tools</h3>
            </div>
            <div className="p-6 text-center border-l border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                SyncSpace
              </h3>
            </div>
          </div>

          {/* Table Body */}
          <div>
            {comparisonData.map((item, index) => (
              <div key={index} className="grid grid-cols-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <div className="p-6 flex items-center gap-3">
                  {item.icon && <item.icon className="w-5 h-5 text-gray-600" />}
                  <span className="font-medium text-gray-900">{item.feature}</span>
                </div>
                <div className="p-6 text-center border-l border-gray-100 flex items-center justify-center">
                  {typeof item.others === 'boolean' ? (
                    item.others ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )
                  ) : (
                    <span className="text-sm text-gray-600 px-3 py-1 bg-gray-100 rounded-full">
                      {item.others}
                    </span>
                  )}
                </div>
                <div className="p-6 text-center border-l border-gray-100 bg-gradient-to-r from-purple-50/30 to-blue-50/30 flex items-center justify-center">
                  {typeof item.syncspace === 'boolean' && item.syncspace ? (
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-purple-600">
                      {item.syncspace}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 lg:p-12 text-white">
            <h3 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to make the switch?
            </h3>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Join thousands of teams who've already upgraded their collaboration experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => (window.location.href = "/signup")}
                className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors duration-200">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingComparison;