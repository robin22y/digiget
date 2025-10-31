import Navigation from '../components/landing/Navigation';
import Hero from '../components/landing/Hero';
import ProblemSection from '../components/landing/ProblemSection';
import SolutionSection from '../components/landing/SolutionSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import PricingSection from '../components/landing/PricingSection';
import WhoItsFor from '../components/landing/WhoItsFor';
import HowItWorks from '../components/landing/HowItWorks';
import FAQ from '../components/landing/FAQ';
import ComingSoon from '../components/landing/ComingSoon';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/landing/Footer';
import CookieConsent from '../components/CookieConsent';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <FeaturesSection />
        <PricingSection />
        <WhoItsFor />
        <HowItWorks />
        <FAQ />
        <ComingSoon />
        <FinalCTA />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}

