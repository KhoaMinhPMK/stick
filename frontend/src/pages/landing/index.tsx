import React from 'react';
import { HeroManifesto } from './components/HeroManifesto';
import { MissionSection } from './components/MissionSection';
import { ProblemSection } from './components/ProblemSection';
import { CoreLoopSection } from './components/CoreLoopSection';
import { FeatureShowcase } from './components/FeatureShowcase';
import { PsychologySection } from './components/PsychologySection';
import { ValidationSection } from './components/ValidationSection';
import { TargetAudienceSection } from './components/TargetAudienceSection';
import { AboutUsSection } from './components/AboutUsSection';
import { PricingSection } from './components/PricingSection';
import { ClosingCTASection } from './components/ClosingCTASection';
import { TopNavBar } from '../../components/layout/TopNavBar';
import { Footer } from '../../components/layout/Footer';
import { ScrollToTopButton } from '../../components/ui/ScrollToTopButton';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fdf9f0] text-black font-body font-medium antialiased overflow-x-hidden pt-20 relative">
      <TopNavBar />
      <main>
        <HeroManifesto />
        <MissionSection />
        <ProblemSection />
        <CoreLoopSection />
        <FeatureShowcase />
        <PsychologySection />
        <ValidationSection />
        <TargetAudienceSection />
        <AboutUsSection />
        <PricingSection />
        <ClosingCTASection />
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default LandingPage;