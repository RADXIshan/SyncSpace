import FAQList from "../components/FAQList";
import LandingNav  from "../components/LandingNav";
import LandingHero from "../components/LandingHero";
import LandingComparision from "../components/LandingComparison";
import LandingFeatures from "../components/LandingFeatures";
import Footer from "../components/footernote";

const Landing = () => {
  return (
    <>
      <LandingNav />
      <LandingHero />
      <LandingComparision />
      <LandingFeatures />
      <FAQList />
      <Footer />
    </>
  );
};

export default Landing;
