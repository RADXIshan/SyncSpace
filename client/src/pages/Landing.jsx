// Import components
import LandingHero from "../components/LandingHero";
import LandingFeatures from "../components/LandingFeatures";
import LandingStats from "../components/LandingStats";
import LandingTestimonials from "../components/LandingTestimonials";
import LandingPricing from "../components/LandingPricing";
import FAQList from "../components/FAQList";
import Footer from "../components/Footer";
import LandingNav from "../components/LandingNav";

const Landing = () => {
  return (
    <div className="min-h-screen cosmic-bg relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/3 to-blue-500/3 rounded-full blur-3xl"></div>
      </div>
      
      {/* Navigation */}
      <LandingNav />
      
      {/* Content */}
      <div className="relative z-10">
        <LandingHero />
        <LandingFeatures />
        <LandingStats />
        <LandingTestimonials />
        <LandingPricing />
        <FAQList />
        <Footer />
      </div>
    </div>
  );
};

export default Landing;
