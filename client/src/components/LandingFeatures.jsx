function Features() {
  const problemSolutions = [
  {
    problem: "Manual workflows slow down progress and increase error rates.",
    solution: "Automated systems streamline tasks, ensuring consistency and saving time.",
  },
  {
    problem: "Teams struggle with unclear project visibility and communication gaps.",
    solution: "Real-time dashboards and collaboration tools keep everyone aligned effortlessly.",
  },
  {
    problem: "Scattered data leads to inefficient decision-making.",
    solution: "Unified analytics provide actionable insights from a single source of truth.",
  },
  {
    problem: "Security concerns over shared access and integrations.",
    solution: "Advanced permission layers and encrypted data exchange ensure full protection.",
  },
];

  return (
    <section id="features" className="min-h-screen flex flex-col items-center justify-center px-6 py-16 w-full"> 
        {/* Header */}
        <div className="w-full max-w-3xl text-center mb-14">
          <header className="text-5xl font-extrabold gradient-text bg-clip-text text-transparent tracking-tight drop-shadow-sm">
            Features
          </header>
          <p className="text-[var(--color-gray-600)] mt-3 text-base sm:text-lg italic">
            Explore what makes this platform powerful, elegant, and simple to use.
          </p>
          <div className="mt-4 w-24 h-1 mx-auto bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] rounded-full"></div>
        </div>

        <div className="max-w-6xl w-full rounded-[2.5rem] overflow-hidden shadow-2xl">
          {/* background */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 text-[var(--color-light)]"
            style={{
              background:
                "linear-gradient(90deg, rgba(206,180,255,0.9) 0%, rgba(112,58,189,0.95) 100%)",
            }}
          >
            {/* Headings */}
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 divide-x-0">
              <div className="p-10 text-left">
                <h2 className="text-3xl font-bold mb-6 text-[var(--color-dark)]">
                  Problem
                </h2>
              </div>
              <div className="p-10 text-left">
                <h2 className="text-3xl font-bold mb-6 text-[var(--color-light)]">
                  Solution
                </h2>
              </div>
            </div>

            {/* Problem–Solution pairs */}
            <div className="col-span-2">
              {problemSolutions.map((item, index) => (
                <div
                  key={index}
                  className="group grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-4 px-10 md:px-12 py-6 
                            transition-all duration-300 hover:scale-[1.02] 
                            border border-white/60 rounded-2xl mx-6 my-3 backdrop-blur-sm"
                >
                  {/* Problem */}
                  <div className="flex items-start gap-3 transition-all duration-300 group-hover:scale-[1.04]">
                    <span className="text-[var(--color-accent)] mt-1 text-base group-hover:text-lg transition-all duration-300">◆</span>
                    <p className="text-[var(--color-dark)] opacity-90 leading-relaxed transition-all duration-300 group-hover:text-[var(--color-primary)] group-hover:text-lg">
                      {item.problem}
                    </p>
                  </div>

                  {/* Solution */}
                  <div className="flex items-start gap-3 transition-all duration-300 group-hover:scale-[1.04]">
                    <span className="text-[var(--color-accent)] mt-1 text-base group-hover:text-lg transition-all duration-300">◆</span>
                    <p className="text-[var(--color-light)] opacity-90 leading-relaxed transition-all duration-300 group-hover:text-[var(--color-primary)] group-hover:text-lg">
                      {item.solution}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
  );
}
export default Features;