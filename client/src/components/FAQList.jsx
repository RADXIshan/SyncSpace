import { useState } from "react";
import {
  ChevronDown,
  HelpCircle,
  MessageCircle,
  ArrowRight,
  Brain,
  Sparkles,
} from "lucide-react";

const FAQList = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "How do I create and manage organizations?",
      a: "Creating an organization is simple - just sign up and you'll be prompted to create your first organization. As an admin, you can invite team members, assign roles, create channels, and manage organization settings. Each organization has its own workspace with dedicated channels and calendar.",
    },
    {
      q: "What's the difference between channels and direct messages?",
      a: "Channels are shared spaces where team members can collaborate on specific topics or projects. They're visible to all organization members. Direct messages are private conversations between individuals. Both support real-time messaging with message history.",
    },
    {
      q: "How does the calendar integration work?",
      a: "Our integrated calendar lets you schedule events, meetings, and deadlines directly within the platform. You can create events, invite participants, set reminders, and view everything in a clean calendar interface. All events are synced across your organization.",
    },
    {
      q: "Can I have video meetings within the platform?",
      a: "Yes! We have built-in video meeting functionality. You can create meeting rooms, join video calls, and collaborate in real-time. Meeting links can be shared with participants, and you can access meetings directly from the platform.",
    },
    {
      q: "How do notifications work?",
      a: "You'll receive notifications for mentions, meeting reminders, and important updates. The notification system is smart - it filters based on relevance and lets you customize what you want to be notified about. You can view all notifications in the dedicated notifications panel.",
    },
    {
      q: "What is the Notice Board feature?",
      a: "The Notice Board is where organization admins can post important announcements, policy updates, and company-wide information. It's perfect for sharing news that everyone in the organization needs to see, like policy changes or important updates.",
    },
    {
      q: "Is my data secure and private?",
      a: "Absolutely. We use industry-standard JWT authentication, secure password hashing, and encrypted data transmission. Your messages, files, and personal information are protected with enterprise-grade security measures. We also provide email verification and password recovery features.",
    },
    {
      q: "Can I use this on mobile devices?",
      a: "Yes! Our platform is fully responsive and works seamlessly on desktop, tablet, and mobile devices. You can access all features - messaging, calendar, video meetings, and notifications - from any device with a web browser.",
    },
  ];

  return (
    <section id="faq" className="py-10 lg:py-16 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 text-sm font-medium text-white/90 mb-8">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            Common Questions
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-8">
            Frequently asked
            <span className="block pt-2 gradient-text-purple">Questions</span>
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Get answers to common questions about our collaboration platform and
            learn how to make the most of its features.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-6 mb-20">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`glass rounded-3xl hover:bg-white/20 ${
                openIndex === index ? "bg-white/15" : ""
              }`}
            >
              <button
                className="w-full flex items-center justify-between p-8 text-left focus:outline-none rounded-3xl"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-lg font-semibold text-white pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-6 h-6 text-white/70 flex-shrink-0 ${
                    openIndex === index ? "rotate-180 text-purple-400" : ""
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  openIndex === index ? "max-h-96 pb-8" : "max-h-0"
                }`}
              >
                <div className="px-8">
                  <div className="border-t border-white/20 pt-6">
                    <p className="text-white/80 leading-relaxed text-lg">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQList;
