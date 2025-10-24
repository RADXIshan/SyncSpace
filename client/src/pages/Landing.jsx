import FAQList from "../components/FAQList";
import LandingNav  from "../components/LandingNav";
import LandingHero from "../components/LandingHero";
import LandingComparision from "../components/LandingComparison";
import LandingFeatures from "../components/LandingFeatures";
import Footer from "../components/footernote";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Global Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-40 sm:w-60 lg:w-80 h-40 sm:h-60 lg:h-80 bg-gradient-to-br from-purple-200/20 to-indigo-200/20 rounded-full blur-2xl sm:blur-3xl"></div>
        <div className="absolute top-1/4 -left-20 sm:-left-40 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-2xl sm:blur-3xl"></div>
        <div className="absolute top-2/3 -right-20 sm:-right-40 w-36 sm:w-56 lg:w-72 h-36 sm:h-56 lg:h-72 bg-gradient-to-br from-indigo-200/20 to-pink-200/20 rounded-full blur-2xl sm:blur-3xl"></div>
        <div className="absolute -bottom-20 sm:-bottom-40 -left-20 sm:-left-40 w-40 sm:w-60 lg:w-80 h-40 sm:h-60 lg:h-80 bg-gradient-to-br from-purple-200/20 to-blue-200/20 rounded-full blur-2xl sm:blur-3xl"></div>
      </div>
      
      <div className="relative z-10">
        <LandingNav />
        <LandingHero />
        <LandingComparision />
        <LandingFeatures />
        <FAQList />
        <Footer />
      </div>
    </div>
  );
};

export default Landing;
