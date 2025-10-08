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
    <div className="min-h-screen flex flex-col bg-[var(--color-primary)]">
      {/* Navigation */}
      <header className="flex items-center justify-between py-4 px-8 w-full absolute top-0 left-0 z-20">
        <span className="text-2xl lg:text-3xl font-extrabold text-[var(--color-accent)]">
          Sync<span className="text-[var(--color-secondary)]">Space</span>
        </span>
        <nav className="space-x-4">
          <Link
            to="/login"
            className="px-4 py-2 text-[var(--color-accent)] font-medium rounded-md hover:text-[var(--color-secondary)] transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 bg-[var(--color-secondary)] text-white rounded-md font-semibold shadow-md hover:bg-[var(--color-accent)] transition-colors"
          >
            Sign up
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col-reverse lg:flex-row items-center justify-between pt-32 lg:pt-40 pb-16 lg:pb-24 px-6 lg:px-16 bg-gradient-to-b from-[var(--color-secondary)/20] to-transparent">
        {/* Text */}
        <div className="w-full lg:w-1/2 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--color-accent)] leading-tight">
            Collaborate. Plan. <span className="text-[var(--color-secondary)]">Succeed.</span>
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-[var(--color-accent)]/80 max-w-xl mx-auto lg:mx-0">
            Organise your schedule, manage tasks, and stay in sync with your team — all in one intuitive space.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              to="/signup"
              className="px-8 py-3 bg-[var(--color-accent)] text-white rounded-md font-semibold hover:bg-[var(--color-secondary)] transition-colors shadow-lg"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 border-2 border-[var(--color-accent)] text-[var(--color-accent)] rounded-md font-semibold hover:bg-[var(--color-accent)] hover:text-white transition-colors"
            >
              Demo Login
            </Link>
          </div>
        </div>

        {/* Illustration */}
        <div className="w-full lg:w-1/2 mb-12 lg:mb-0 flex justify-center">
          <img
            src="https://images.unsplash.com/photo-1587614382346-ac420104bacc?auto=format&fit=crop&w=800&q=60"
            alt="Team collaboration illustration"
            className="w-full max-w-md rounded-lg shadow-2xl"
          />
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-24 px-6 lg:px-16 bg-[var(--color-primary)]">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--color-accent)] mb-12">
          Why choose <span className="text-[var(--color-secondary)]">SyncSpace?</span>
        </h2>
        <div className="grid gap-10 md:grid-cols-3">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] mb-4">
              <Calendar size={28} />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-accent)] mb-2">Smart Scheduling</h3>
            <p className="text-[var(--color-accent)]/70 text-sm">
              Avoid conflicts and manage your events effortlessly with our smart calendar integration.
            </p>
          </div>
          {/* Feature 2 */}
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] mb-4">
              <Users size={28} />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-accent)] mb-2">Team Collaboration</h3>
            <p className="text-[var(--color-accent)]/70 text-sm">
              Real-time updates keep everyone on the same page, ensuring seamless team coordination.
            </p>
          </div>
          {/* Feature 3 */}
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] mb-4">
              <Shield size={28} />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-accent)] mb-2">Secure & Private</h3>
            <p className="text-[var(--color-accent)]/70 text-sm">
              Your data is protected with industry-standard encryption and robust security measures.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16 lg:py-24 px-6 lg:px-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--color-accent)] mb-12">
          Loved by teams everywhere
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-8 border rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} size={18} className="text-yellow-400 fill-yellow-400 mr-1" />
                ))}
              </div>
              <p className="text-[var(--color-accent)]/80 italic mb-4">
                "SyncSpace has completely transformed our workflow. Scheduling and collaboration have never been this seamless!"
              </p>
              <div className="font-semibold text-[var(--color-accent)]">Jane Doe</div>
              <div className="text-sm text-[var(--color-accent)]/60">Product Manager, Acme Corp</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24 px-6 lg:px-16 bg-[var(--color-primary)]">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--color-accent)] mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqItems.map((item, idx) => (
            <div key={idx} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-[var(--color-accent)]">
                  {item.question}
                </span>
                <span className="text-[var(--color-secondary)] text-xl">
                  {activeFAQ === idx ? "-" : "+"}
                </span>
              </button>
              {activeFAQ === idx && (
                <div className="p-4 bg-white border-t text-[var(--color-accent)]/80">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 lg:px-16 bg-[var(--color-accent)] text-white text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
          Ready to level up your productivity?
        </h2>
        <p className="mb-10 max-w-2xl mx-auto text-lg opacity-90">
          Start using SyncSpace today and see the difference in how your team organises, collaborates, and succeeds.
        </p>
        <Link
          to="/signup"
          className="inline-block px-10 py-4 bg-white text-[var(--color-accent)] font-semibold rounded-md shadow-lg hover:bg-[var(--color-accent)] hover:text-white transition-colors"
        >
          Create your free account
        </Link>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center bg-[var(--color-accent)] text-[var(--color-primary)]/60 text-sm">
        © {new Date().getFullYear()} SyncSpace. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;