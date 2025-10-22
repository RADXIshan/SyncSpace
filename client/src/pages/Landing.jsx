import FAQList from "../components/FAQList";
import LandingNav  from "../components/LandingNav";
import LandingHero from "../components/LandingHero";
import LandingComparision from "../components/LandingComparison";
import LandingFeatures from "../components/LandingFeatures";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Global Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200/20 to-indigo-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-2/3 -right-40 w-72 h-72 bg-gradient-to-br from-indigo-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-200/20 to-blue-200/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10">
        <LandingNav />
        <LandingHero />
        <LandingComparision />
        <LandingFeatures />
        <FAQList />
      </div>
    </div>
  );
};

export default Landing;
