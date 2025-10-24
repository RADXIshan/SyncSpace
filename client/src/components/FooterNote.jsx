const FooterNote = () => {
  return (
    <footer className="gradient-bg text-white w-full min-h-100 flex flex-col items-center justify-between border-t border-[var(--color-accent)] relative overflow-hidden">
      
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
      
      {/* Floating geometric shapes */}
      <div className="absolute top-10 left-10 w-20 h-20 border border-white/20 rounded-full animate-pulse"></div>
      <div className="absolute top-20 right-16 w-12 h-12 border border-white/15 rotate-45 animate-pulse delay-1000"></div>
      <div className="absolute bottom-32 left-1/4 w-16 h-16 border border-white/10 rounded-full animate-pulse delay-2000"></div>
      <div className="absolute bottom-20 right-1/3 w-8 h-8 border border-white/20 rotate-12 animate-pulse delay-500"></div>
      
      {/* Subtle particle effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-1 h-1 bg-white/30 rounded-full animate-ping delay-700"></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white/40 rounded-full animate-ping delay-1500"></div>
        <div className="absolute bottom-1/3 left-1/5 w-1 h-1 bg-white/25 rounded-full animate-ping delay-3000"></div>
      </div>

      {/* Call to Action Section */}
      <div className="flex-grow flex flex-col items-center justify-center text-center px-6 relative z-10">
        <div className="mb-8">
          <h2 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight drop-shadow-lg bg-gradient-to-r from-white via-white to-white/80 bg-clip-text">
            Ready to start your journey?
          </h2>
          {/* Subtle accent dots instead of lines */}
          <div className="flex justify-center items-center space-x-2">
            <div className="w-1 h-1 bg-[var(--color-accent)] rounded-full animate-pulse"></div>
            <div className="w-2 h-1 bg-[var(--color-accent)] rounded-full animate-pulse delay-300"></div>
            <div className="w-1 h-1 bg-[var(--color-accent)] rounded-full animate-pulse delay-700"></div>
          </div>
        </div>
        
        <button
          className="group relative px-10 py-3 rounded-2xl bg-[var(--color-accent)] text-[var(--color-primary)] font-semibold text-lg shadow-md shadow-[var(--color-accent)]/30 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_var(--color-accent)] overflow-hidden"
        >
          {/* Button shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          
          <span className="relative z-10 flex items-center">
            Create Account
            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </span>
        </button>
        
        {/* Decorative line below button */}
        <div className="mt-8 w-24 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      </div>

      {/* Copyright Section */}
      <div className="w-full bg-black backdrop-blur-sm py-4 text-white text-center text-sm opacity-90 mt-auto border-t border-white/10 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="relative z-10">
          © {new Date().getFullYear()} Your Company Name. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default FooterNote;