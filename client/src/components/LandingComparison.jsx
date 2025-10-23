import { X, CheckCheck } from "lucide-react";

const LandingComparision = () => {
  return (
    <section
        id="comparison"
        className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] bg-clip-text text-transparent">
                SyncSpace
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-4">
              See the difference between traditional tools and our unified
              collaboration platform
            </p>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 xl:gap-12">
            {/* Others Card */}
            <div className="group relative flex flex-col">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
              <div className="relative flex flex-col h-full p-4 sm:p-6 lg:p-8 xl:p-10 rounded-3xl bg-white border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer">
                {/* Header */}
                <div className="flex items-center justify-center xl:justify-start mb-4 sm:mb-6 lg:mb-8">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center mr-2 sm:mr-3 lg:mr-4">
                    <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-800">
                    Others
                  </h3>
                </div>

                {/* Content Points */}
                {[
                  "Scattered tools for chat, tasks, and meetings",
                  "Generic access for all users — no role control",
                  "Complex, bloated interfaces not suited for small teams",
                  "Switching between multiple apps causes confusion",
                ].map((text, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 mb-2 sm:mb-3 rounded-2xl bg-gray-300/20 hover:bg-gray-200/50 transition-all duration-300 group/item cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full bg-red-100 flex items-center justify-center mt-0.5 sm:mt-1">
                      <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-red-500" />
                    </div>
                    <p className="font-medium text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 leading-relaxed group-hover/item:text-gray-900 transition-colors flex-1">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* SyncSpace Card */}
            <div className="group relative flex flex-col">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 to-indigo-500/30 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300 cursor-pointer"></div>
              <div className="relative flex flex-col h-full p-4 sm:p-6 lg:p-8 xl:p-10 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden cursor-pointer">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-white rounded-full -translate-y-8 sm:-translate-y-16 translate-x-8 sm:translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-white rounded-full translate-y-6 sm:translate-y-12 -translate-x-6 sm:-translate-x-12"></div>
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-center xl:justify-start mb-4 sm:mb-6 lg:mb-8">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-2 sm:mr-3 lg:mr-4">
                      <CheckCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white">
                      SyncSpace
                    </h3>
                  </div>

                  {/* Content Points */}
                  {[
                    "Unified platform combining chat, tasks, and meetings",
                    "Role-based permissions for secure and organized teamwork",
                    "Simple, modern UI built for students, startups, and agile teams",
                    "Seamless workflow — everything happens in one place",
                  ].map((text, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3 p-2 sm:p-3 lg:p-4 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 group/item border border-white/20 cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full bg-green-400/20 flex items-center justify-center mt-0.5 sm:mt-1">
                        <CheckCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-green-300" />
                      </div>
                      <p className="font-medium text-xs sm:text-sm md:text-base lg:text-lg text-white leading-relaxed group-hover/item:text-green-100 transition-colors flex-1">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  )
}

export default LandingComparision;