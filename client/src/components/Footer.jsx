import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Mail, Twitter, Github, Linkedin, Sparkles, MapPin, Phone } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const Footer = () => {
  const footerRef = useRef();
  const ctaRef = useRef();
  const linksRef = useRef();
  const copyrightRef = useRef();

  useGSAP(() => {
    // CTA animation
    gsap.fromTo(ctaRef.current.children,
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
          trigger: ctaRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Links animation
    gsap.fromTo(linksRef.current.children,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: linksRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Copyright animation
    gsap.fromTo(copyrightRef.current,
      {
        opacity: 0,
      },
      {
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: copyrightRef.current,
          start: "top 90%",
          toggleActions: "play none none reverse"
        }
      }
    );

  }, { scope: footerRef });

  const footerLinks = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "Integrations", href: "/integrations" },
        { name: "API", href: "/api" },
        { name: "Security", href: "/security" },
        { name: "Roadmap", href: "/roadmap" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Blog", href: "/blog" },
        { name: "Careers", href: "/careers" },
        { name: "Press Kit", href: "/press" },
        { name: "Contact", href: "/contact" },
        { name: "Partners", href: "/partners" }
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Help Center", href: "/help" },
        { name: "Community", href: "/community" },
        { name: "Guides", href: "/guides" },
        { name: "Webinars", href: "/webinars" },
        { name: "Status", href: "/status" },
        { name: "Changelog", href: "/changelog" }
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Cookie Policy", href: "/cookies" },
        { name: "GDPR", href: "/gdpr" },
        { name: "Security", href: "/security" },
        { name: "Compliance", href: "/compliance" }
      ]
    }
  ];

  const socialLinks = [
    { icon: Twitter, href: "https://twitter.com/syncspace", label: "Twitter" },
    { icon: Github, href: "https://github.com/syncspace", label: "GitHub" },
    { icon: Linkedin, href: "https://linkedin.com/company/syncspace", label: "LinkedIn" },
    { icon: Mail, href: "mailto:hello@syncspace.com", label: "Email" }
  ];

  const scrollToSection = (href) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = href;
    }
  };

  return (
    <footer ref={footerRef} className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* CTA Section */}
      <div ref={ctaRef} className="relative z-10 px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Ready to get started?
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Transform your team's
            <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              collaboration today
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of teams who've already upgraded their workflow with SyncSpace. 
            Start your free trial and experience the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => (window.location.href = "/signup")}
              className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
              <span className="relative z-10 flex items-center gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </button>
            <button 
              onClick={() => window.location.href = 'mailto:sales@syncspace.com'}
              className="px-8 py-4 border-2 border-gray-600 text-gray-300 font-semibold rounded-xl hover:border-gray-500 hover:text-white transition-all duration-300 cursor-pointer"
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </div>

      {/* Links Section */}
      <div ref={linksRef} className="relative z-10 px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  SyncSpace
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-sm">
                The all-in-one collaboration platform that brings your team together 
                and supercharges productivity.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">San Francisco, CA</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">hello@syncspace.com</span>
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
                    className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300 group cursor-pointer"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-300" />
                  </a>
                ))}
              </div>
            </div>

            {/* Footer Links */}
            {footerLinks.map((section, index) => (
              <div key={index}>
                <h3 className="text-white font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <button
                        onClick={() => scrollToSection(link.href)}
                        className="text-gray-400 hover:text-white transition-colors duration-300 text-left cursor-pointer"
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
      <div ref={copyrightRef} className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 border-t border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} SyncSpace. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <button 
              onClick={() => window.location.href = '/privacy'}
              className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => window.location.href = '/terms'}
              className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer"
            >
              Terms of Service
            </button>
            <button 
              onClick={() => window.location.href = '/cookies'}
              className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer"
            >
              Cookie Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;