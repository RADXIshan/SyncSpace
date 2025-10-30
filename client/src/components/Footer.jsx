import {
  ArrowRight,
  Mail,
  Twitter,
  Github,
  Linkedin,
  Sparkles,
  MapPin,
  Phone,
  Rocket,
  Brain,
  Infinity,
} from "lucide-react";

const Footer = () => {
  const footerLinks = [
    {
      title: "Platform",
      links: [
        { name: "AI Features", href: "#features" },
        { name: "Future Pricing", href: "#pricing" },
        { name: "Quantum Security", href: "/security" },
        { name: "Neural API", href: "/api" },
        { name: "Vision Roadmap", href: "/roadmap" },
        { name: "Integration Hub", href: "/integrations" },
      ],
    },
    {
      title: "Innovation",
      links: [
        { name: "Future Lab", href: "/lab" },
        { name: "Research Blog", href: "/research" },
        { name: "Visionary Careers", href: "/careers" },
        { name: "Innovation Press", href: "/press" },
        { name: "Future Contact", href: "/contact" },
        { name: "Pioneer Partners", href: "/partners" },
      ],
    },
    {
      title: "Community",
      links: [
        { name: "Future Center", href: "/future-center" },
        { name: "Visionary Network", href: "/community" },
        { name: "Transformation Guides", href: "/guides" },
        { name: "Future Sessions", href: "/sessions" },
        { name: "System Status", href: "/status" },
        { name: "Evolution Log", href: "/changelog" },
      ],
    },
    {
      title: "Trust",
      links: [
        { name: "Privacy Shield", href: "/privacy" },
        { name: "Future Terms", href: "/terms" },
        { name: "Data Sovereignty", href: "/data" },
        { name: "Quantum Compliance", href: "/compliance" },
        { name: "Security Manifesto", href: "/security" },
        { name: "Trust Center", href: "/trust" },
      ],
    },
  ];

  const socialLinks = [
    {
      icon: Github,
      href: "https://github.com/RADXIshan/SyncSpace",
      label: "GitHub",
    },
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/in/ishanroy-radx/",
      label: "LinkedIn",
    },
    { icon: Mail, href: "mailto:ishanroy3118107@gmail.com", label: "Email" },
  ];

  const scrollToSection = (href) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.location.href = href;
    }
  };

  return (
    <footer className="relative overflow-hidden">
      {/* CTA Section */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 text-sm font-medium text-white/90 mb-8">
            <Rocket className="w-4 h-4 text-purple-400" />
            Ready to Transform?
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 text-white">
            Build Tomorrow's
            <span className="block gradient-text-purple py-1">
              Collaboration Today
            </span>
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join the revolution of teams who are already working in the future.
            Your transformation starts with a single click.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => (window.location.href = "/signup")}
              className="glass-button px-8 py-4 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 group cursor-pointer"
            >
              Start Collaborating
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Links Section */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center pulse-glow">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold gradient-text-purple">
                  SyncSpace
                </span>
              </div>
              <p className="text-white/70 mb-8 max-w-sm text-lg">
                The revolutionary AI-powered platform that's redefining how
                teams collaborate in the age of infinite possibility.
              </p>

              {/* Contact Info */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-white/60">
                  <MapPin className="w-5 h-5" />
                  <span>Kolkata, India</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <Phone className="w-5 h-5" />
                  <span>+91 9007195462</span>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <Mail className="w-5 h-5" />
                  <span>ishanroy3118107@gmail.com</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-button w-12 h-12 rounded-xl flex items-center justify-center group"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5 text-white/70 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
                  </a>
                ))}
              </div>
            </div>

            {/* Footer Links */}
            {footerLinks.map((section, index) => (
              <div key={index}>
                <h3 className="text-white font-bold mb-6 text-lg">
                  {section.title}
                </h3>
                <ul className="space-y-4">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <button
                        onClick={() => scrollToSection(link.href)}
                        className="text-white/70 hover:text-white duration-300 text-left hover:translate-x-1 transform"
                      >
                        {link.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass rounded-3xl p-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/60">
              © {new Date().getFullYear()} SyncSpace. Built by Ishan Roy.
            </p>
            <div className="flex gap-8 text-sm">
              <button
                onClick={() => (window.location.href = "/privacy")}
                className="text-white/60 hover:text-white transition-colors duration-300"
              >
                Privacy Shield
              </button>
              <button
                onClick={() => (window.location.href = "/terms")}
                className="text-white/60 hover:text-white transition-colors duration-300"
              >
                Future Terms
              </button>
              <button
                onClick={() => (window.location.href = "/trust")}
                className="text-white/60 hover:text-white transition-colors duration-300"
              >
                Trust Center
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
