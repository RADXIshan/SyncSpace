import { Link } from "react-router";
import { Calendar, Users, Shield } from "lucide-react";
import { useState } from "react";
import { Star } from "lucide-react";

const Landing = () => {
  const faqItems = [
    {
      question: "What is SyncSpace?",
      answer: "SyncSpace is an all-in-one platform that combines smart scheduling, collaborative tools, and task management to keep your team perfectly aligned.",
    },
    {
      question: "Is there a free plan?",
      answer: "Yes! We offer a generous free tier ideal for individuals and small teams. Upgrade anytime as your needs grow.",
    },
    {
      question: "How secure is my data?",
      answer: "Security is paramount. We employ industry-standard encryption in transit and at rest, with regular audits to ensure your information remains protected.",
    },
    {
      question: "Can I integrate my existing calendar?",
      answer: "Absolutely. SyncSpace integrates with Google Calendar, Outlook, and more so you can keep using the tools you already love.",
    },
  ];
  const [activeFAQ, setActiveFAQ] = useState(null);
  const toggleFAQ = (idx) => setActiveFAQ((prev) => (prev === idx ? null : idx));
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Navigation */}
      <header className="flex items-center justify-between py-6 px-8 w-full absolute top-0 left-0 z-20">
        <span className="text-3xl lg:text-4xl font-extrabold gradient-text">
          SyncSpace
        </span>
        <nav className="flex items-center space-x-4">
          <Link
            to="/login"
            className="px-6 py-2 text-gray-700 font-semibold rounded-lg hover:text-purple-600 transition-all duration-200 hover:bg-gray-100"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="btn-primary"
          >
            Sign up
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col-reverse lg:flex-row items-center justify-between pt-32 lg:pt-40 pb-16 lg:pb-24 px-6 lg:px-16">
        {/* Text */}
        <div className="w-full lg:w-1/2 text-center lg:text-left animate-fadeIn">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight">
            Collaborate. Plan. <span className="gradient-text">Succeed.</span>
          </h1>
          <p className="mt-8 text-xl lg:text-2xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Organise your schedule, manage tasks, and stay in sync with your team — all in one intuitive space.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
            <Link
              to="/signup"
              className="btn-primary text-lg px-10 py-4"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="btn-secondary text-lg px-10 py-4"
            >
              Demo Login
            </Link>
          </div>
        </div>

        {/* Illustration */}
        <div className="w-full lg:w-1/2 mb-12 lg:mb-0 flex justify-center animate-scaleIn">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1587614382346-ac420104bacc?auto=format&fit=crop&w=800&q=60"
              alt="Team collaboration illustration"
              className="w-full max-w-lg rounded-2xl shadow-2xl"
            />
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-32 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 mb-16">
            Why choose <span className="gradient-text">SyncSpace?</span>
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="card p-8 text-center hover-lift animate-fadeIn">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 mb-6 mx-auto">
                <Calendar size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Scheduling</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Avoid conflicts and manage your events effortlessly with our smart calendar integration.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="card p-8 text-center hover-lift animate-fadeIn" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-purple-600 mb-6 mx-auto">
                <Users size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Team Collaboration</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Real-time updates keep everyone on the same page, ensuring seamless team coordination.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="card p-8 text-center hover-lift animate-fadeIn" style={{animationDelay: '0.4s'}}>
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 text-green-600 mb-6 mx-auto">
                <Shield size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure & Private</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Your data is protected with industry-standard encryption and robust security measures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-20 lg:py-32 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 mb-16">
            Loved by teams everywhere
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-8 hover-lift animate-fadeIn" style={{animationDelay: `${i * 0.2}s`}}>
                <div className="flex items-center mb-6">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} size={20} className="text-yellow-400 fill-yellow-400 mr-1" />
                  ))}
                </div>
                <p className="text-gray-700 italic text-lg mb-6 leading-relaxed">
                  "SyncSpace has completely transformed our workflow. Scheduling and collaboration have never been this seamless!"
                </p>
                <div className="font-bold text-gray-900 text-lg">Jane Doe</div>
                <div className="text-gray-600">Product Manager, Acme Corp</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-32 px-6 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 mb-16">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div key={idx} className="card overflow-hidden animate-fadeIn" style={{animationDelay: `${idx * 0.1}s`}}>
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full flex justify-between items-center p-6 hover:bg-gray-50 transition-colors group"
                >
                  <span className="font-semibold text-gray-900 text-lg group-hover:text-purple-600 transition-colors">
                    {item.question}
                  </span>
                  <span className="text-purple-600 text-2xl font-bold transition-transform group-hover:scale-110">
                    {activeFAQ === idx ? "−" : "+"}
                  </span>
                </button>
                {activeFAQ === idx && (
                  <div className="px-6 pb-6 text-gray-600 text-lg leading-relaxed animate-fadeIn">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 lg:px-16 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-8">
            Ready to level up your productivity?
          </h2>
          <p className="mb-12 max-w-3xl mx-auto text-xl text-gray-300 leading-relaxed">
            Start using SyncSpace today and see the difference in how your team organises, collaborates, and succeeds.
          </p>
          <Link
            to="/signup"
            className="btn-primary text-xl px-12 py-4 inline-block"
          >
            Create your free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center bg-slate-900 text-gray-400">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-lg">© {new Date().getFullYear()} SyncSpace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;