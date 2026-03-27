import React from 'react';
import { Icon } from '../../../components/ui/Icon';

export const PricingSection: React.FC = () => {
  return (
    <section className="py-12 md:py-24 bg-surface-container" id="pricing">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <h2 className="text-2xl md:text-4xl font-black font-headline text-center mb-8 md:mb-16">A Plan for Every Journey</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-stretch">
          
          <div className="p-6 md:p-10 bg-white sketch-border flex flex-col">
            <div className="text-xl font-bold mb-4">Free</div>
            <div className="text-3xl md:text-4xl font-black mb-4 md:mb-8">$0<span className="text-sm font-normal">/mo</span></div>
            <ul className="space-y-3 md:space-y-4 mb-6 md:mb-12 flex-grow">
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs" /> 3 Journals per week</li>
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs" /> Basic AI Refinement</li>
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs" /> Progress Tracking</li>
            </ul>
            <button 
              onClick={() => window.location.hash = '#onboarding'}
              className="w-full py-3 border-2 border-black rounded-full font-bold hover:bg-surface-container-low transition-colors"
            >
              Get Started
            </button>
          </div>
          
          <div className="p-6 md:p-10 bg-white sketch-border flex flex-col md:scale-105 shadow-xl relative z-10 border-4">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-xs font-bold">
              MOST POPULAR
            </div>
            <div className="text-xl font-bold mb-4">Premium</div>
            <div className="text-3xl md:text-4xl font-black mb-4 md:mb-8">$12<span className="text-sm font-normal">/mo</span></div>
            <ul className="space-y-3 md:space-y-4 mb-6 md:mb-12 flex-grow">
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs font-bold" /> Unlimited Journals</li>
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs font-bold" /> Deep Nuance AI Analysis</li>
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs font-bold" /> Native Audio Shadowing</li>
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs font-bold" /> Smart Vocab Review</li>
            </ul>
            <button 
              onClick={() => window.location.hash = '#onboarding'}
              className="w-full py-3 bg-black text-white rounded-full font-bold hover:opacity-90 transition-opacity"
            >
              Start 7-Day Free Trial
            </button>
          </div>
          
          <div className="p-6 md:p-10 bg-white sketch-border flex flex-col">
            <div className="text-xl font-bold mb-4">School</div>
            <div className="text-3xl md:text-4xl font-black mb-4 md:mb-8">Custom</div>
            <ul className="space-y-3 md:space-y-4 mb-6 md:mb-12 flex-grow">
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs" /> Student Dashboard</li>
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs" /> Class Progress Reports</li>
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs" /> Curriculum Integration</li>
            </ul>
            <button className="w-full py-3 border-2 border-black rounded-full font-bold hover:bg-surface-container-low transition-colors">
              Contact Sales
            </button>
          </div>
          
        </div>
      </div>
    </section>
  );
};