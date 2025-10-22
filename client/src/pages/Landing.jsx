import FAQList from "../components/FAQList";
import LandingNav  from "../components/LandingNav";
import LandingHero from "../components/LandingHero";
import LandingComparision from "../components/LandingComparison";
import LandingFeatures from "../components/LandingFeatures";

const Landing = () => {
  return (
    <>
      <LandingNav />
      <LandingHero />
      <LandingComparision />
      <LandingFeatures />
      <FAQList />
    </>
  );
};

export default Landing;
