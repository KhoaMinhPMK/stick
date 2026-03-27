import React from 'react';
import { Icon } from '../../../components/ui/Icon';

export const ProblemSection: React.FC = () => {
  return (
    <section className="py-12 md:py-24 max-w-7xl mx-auto px-4 md:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-20 items-center">
        <div className="order-2 lg:order-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
            <div className="p-5 md:p-8 border-2 border-black rounded-3xl bg-surface-container transition-all duration-300 transform hover:-translate-y-2 hover:-rotate-2 hover:shadow-[6px_8px_0_rgba(0,0,0,1)] hover:bg-white cursor-default">
              <h4 className="font-bold text-xl mb-3">Mental Translation</h4>
              <p className="text-sm text-on-surface-variant">Converting word-by-word kills your speed and natural rhythm.</p>
            </div>
            <div className="p-5 md:p-8 border-2 border-black rounded-3xl bg-surface-container mt-6 sm:mt-12 transition-all duration-300 transform hover:-translate-y-2 hover:rotate-2 hover:shadow-[6px_8px_0_rgba(0,0,0,1)] hover:bg-white cursor-default">
              <h4 className="font-bold text-xl mb-3">Fear of Errors</h4>
              <p className="text-sm text-on-surface-variant">The "Grammar Police" in your head stops you from even trying to speak.</p>
            </div>
            <div className="p-5 md:p-8 border-2 border-black rounded-3xl bg-surface-container transition-all duration-300 transform hover:-translate-y-2 hover:rotate-1 hover:shadow-[6px_8px_0_rgba(0,0,0,1)] hover:bg-white cursor-default">
              <h4 className="font-bold text-xl mb-3">The Plateau</h4>
              <p className="text-sm text-on-surface-variant">Knowing the rules but not being able to apply them in real-time conversations.</p>
            </div>
            <div className="p-5 md:p-8 border-2 border-black rounded-3xl bg-surface-container mt-6 sm:mt-12 transition-all duration-300 transform hover:-translate-y-2 hover:-rotate-3 hover:shadow-[6px_8px_0_rgba(0,0,0,1)] hover:bg-white cursor-default">
              <h4 className="font-bold text-xl mb-3">Drill Fatigue</h4>
              <p className="text-sm text-on-surface-variant">Boring flashcards don't build emotional connections to the language.</p>
            </div>
          </div>
        </div>
        
        <div className="order-1 lg:order-2">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black font-headline mb-4 md:mb-8">Why learners study for years and still can't use it.</h2>
          <p className="text-sm md:text-lg text-on-surface-variant mb-4 md:mb-8">
            Traditional methods focus on <i>passive consumption</i>. You watch, you read, you listen. But you never <i>produce</i>. The gap between input and output is where fluency goes to die.
          </p>
          <div className="flex items-center gap-4 p-4 bg-stone-200 rounded-2xl border-l-8 border-black">
            <Icon name="warning" className="text-black" />
            <p className="font-bold text-black">Knowledge ≠ Performance</p>
          </div>
        </div>
      </div>
    </section>
  );
};