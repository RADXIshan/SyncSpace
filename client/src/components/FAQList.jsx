import { useState, useRef } from "react";
import { ChevronDown, HelpCircle, MessageCircle, ArrowRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FAQList = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const sectionRef = useRef();
  const headerRef = useRef();
  const faqsRef = useRef();
  const ctaRef = useRef();

  useGSAP(() => {
    // Header animation
    gsap.fromTo(headerRef.current.children,
      {
        opacity: 0,
        y: 40,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // FAQ items animation
    gsap.fromTo(faqsRef.current.children,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: faqsRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // CTA animation
    gsap.fromTo(ctaRef.current,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );

  }, { scope: sectionRef });

  const faqs = [
    {
      q: "How do I get started with SyncSpace?",
      a: "Getting started is simple! Sign up for a free account, invite your team members, and start collaborating immediately. Our intuitive onboarding guide will walk you through all the key features, and you'll be up and running in minutes.",
    },
    {
      q: "What's included in the free plan?",
      a: "Our free Starter plan includes up to 5 team members, 10GB storage, basic messaging and channels, calendar integration, email support, and mobile apps. It's perfect for small teams getting started with collaboration.",
    },
    {
      q: "Can I upgrade or downgrade my plan anytime?",
      a: "Absolutely! You can change your plan at any time from your account settings. Upgrades take effect immediately, and we'll prorate any billing adjustments. Downgrades take effect at the end of your current billing cycle.",
    },
    {
      q: "Is my data secure with SyncSpace?",
      a: "Security is our top priority. We use enterprise-grade end-to-end encryption, regular security audits, and comply with SOC 2, GDPR, and other major security standards. Your data is protected with the same level of security used by banks.",
    },
    {
      q: "Do you offer customer support?",
      a: "Yes! We provide 24/7 email support for all users, with priority chat and phone support for paid plans. Our comprehensive help center also includes guides, tutorials, and video walkthroughs for all features.",
    },
    {
      q: "Can I integrate SyncSpace with other tools?",
      a: "Definitely! We offer native integrations with popular tools like Slack, Google Workspace, Microsoft 365, Trello, Asana, and many more. We also provide a robust API and Zapier connections for custom integrations.",
    },
    {
      q: "What happens if I exceed my plan limits?",
      a: "We'll notify you when you're approaching your limits and offer options to upgrade. For storage, you can purchase additional space or upgrade your plan. For team members, you'll need to upgrade to add more users.",
    },
    {
      q: "Do you offer refunds?",
      a: "Yes, we offer a 30-day money-back guarantee for all paid plans. If you're not completely satisfied, contact our support team within 30 days of your purchase for a full refund, no questions asked.",
    }
  ];

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white"
    >
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            Frequently Asked Questions
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Got questions?
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              We've got answers
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Find answers to the most common questions about SyncSpace and how it can 
            transform your team's collaboration experience.
          </p>
        </div>

        {/* FAQ Items */}
        <div ref={faqsRef} className="space-y-4 mb-16">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`group relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${
                openIndex === index ? "ring-2 ring-indigo-500/20 shadow-lg border-indigo-200" : ""
              }`}
            >
              <button
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-xl cursor-pointer"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform duration-300 flex-shrink-0 ${
                    openIndex === index ? "rotate-180 text-indigo-600" : ""
                  }`}
                />
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  openIndex === index ? "max-h-96 pb-6" : "max-h-0"
                }`}
              >
                <div className="px-6">
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div ref={ctaRef} className="text-center">
          <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl p-8 border border-indigo-100">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Our friendly support team is here to help. Get in touch and we'll get back 
              to you as soon as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = 'mailto:support@syncspace.com'}
                className="group px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all duration-300 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  Contact Support
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
              <button 
                onClick={() => window.open('/help', '_blank')}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 cursor-pointer"
              >
                View Help Center
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQList;