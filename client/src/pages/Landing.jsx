import FAQList from "../components/FAQList";
import LandingNav  from "../components/LandingNav";
import LandingHero from "../components/LandingHero";
import LandingComparision from "../components/LandingComparison";

const Landing = () => {
  return (
    <>
      <LandingNav />
      <LandingHero />
      <LandingComparision />
      <FAQList />
    </>
  );
};

export default Landing;
