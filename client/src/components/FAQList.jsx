import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQList = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "How can I get started?",
      a: "Getting started is simple — sign up, verify your account, and follow the quick-start guide in your dashboard.",
    },
    {
      q: "What is your refund policy?",
      a: "We offer a 14-day money-back guarantee if you’re not satisfied — no questions asked.",
    },
    {
      q: "Is customer support available 24/7?",
      a: "Yes! Our support team is available 24/7 to assist you through chat or email.",
    },
    {
      q: "Can I upgrade my plan later?",
      a: "Absolutely! You can upgrade anytime from your account settings — your data will remain intact.",
    },
    {
      q: "How do I contact support?",
      a: "You can reach us via the 'Help' section in your dashboard or by emailing support@example.com.",
    },
    {
      q: "Do you offer team discounts?",
      a: "Yes, we offer special pricing for teams and organizations. Contact us to learn more.",
    },
  ];

  return (
    <>
      <div id="faqs" className="min-h-screen text-[var(--color-accent)] flex flex-col items-center py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
        <div className="w-full text-center mb-8 sm:mb-12 lg:mb-14">
          <header className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Frequently Asked <span className="gradient-text">Questions</span>
          </header>

          <p className="text-[var(--color-gray-600)] mt-3 text-sm sm:text-base lg:text-lg italic max-w-2xl mx-auto">
            Find quick answers to our most commonly asked questions.
          </p>

          <div className="mt-4 w-16 sm:w-20 lg:w-24 h-1 mx-auto bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] rounded-full">
          </div>
        </div>
        <div className="w-full max-w-4xl space-y-4 sm:space-y-5">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`group border border-[var(--color-gray-200)] rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden backdrop-blur-sm ${
                openIndex === index
                  ? "ring-2 ring-[var(--color-secondary)] ring-opacity-40"
                  : ""
              }`}
            >
              {/* ✅ Entire row clickable now */}
              <div
                className={`flex items-center justify-between p-4 sm:p-5 lg:p-6 cursor-pointer select-none transition-all duration-500 ${
                  openIndex === index
                    ? "bg-gradient-to-r from-[var(--color-secondary)]/10 to-[var(--color-info)]/10"
                    : "hover:bg-[var(--color-gray-100)]"
                }`}
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              >
                <p className="font-semibold text-base sm:text-lg lg:text-xl text-[var(--color-accent)] group-hover:text-[var(--color-secondary)] transition-colors duration-300 pr-4">
                  {faq.q}
                </p>

                <ChevronDown
                  className={`w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-secondary)] transition-transform duration-300 flex-shrink-0 ${
                    openIndex === index
                      ? "rotate-180 text-[var(--color-info)]"
                      : ""
                  }`}
                />
              </div>

              <div
                className={`px-4 sm:px-5 lg:px-6 text-[var(--color-gray-700)] text-sm sm:text-base leading-relaxed overflow-hidden transition-all duration-300 ease-out ${
                  openIndex === index
                    ? "max-h-40 py-3 sm:py-4 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}



export default FAQList;
