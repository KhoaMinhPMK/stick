import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../../components/ui/Icon';
import { SketchCard } from '../../../components/ui/SketchCard';
import { InteractiveJournalDemo } from './InteractiveJournalDemo';

export const FeatureShowcase: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="py-12 md:py-24 space-y-16 md:space-y-32" id="features">
      
      {/* Journal */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-20 items-center">
        <SketchCard className="bg-surface-container-low p-5 md:p-12">
          <img 
            className="w-full h-48 md:h-80 object-cover rounded-2xl border-2 border-black mb-4 md:mb-8" 
            alt="User journal UI" 
            src="https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=2835&auto=format&fit=crop" 
          />
          <div className="notebook-paper p-4 md:p-6 rounded-xl min-h-[120px] md:min-h-[180px] flex flex-col pl-[60px] md:pl-[76px] relative overflow-hidden">
            <div className="text-stone-400 text-sm mb-4">Start typing...</div>
            <InteractiveJournalDemo />
          </div>
        </SketchCard>
        
        <div>
          <h3 className="text-2xl md:text-4xl font-black font-headline mb-4 md:mb-6">{t("features.journal_badge")}</h3>
          <p className="text-sm md:text-lg text-on-surface-variant mb-4 md:mb-8">
            Low pressure. High output. Just tell STICK about your day. No prompts, no rules—just your life in English.
          </p>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 font-bold"><Icon name="check" className="text-tertiary" /> {t("features.journal_li1")}</li>
            <li className="flex items-center gap-3 font-bold"><Icon name="check" className="text-tertiary" /> {t("features.journal_li2")}</li>
            <li className="flex items-center gap-3 font-bold"><Icon name="check" className="text-tertiary" /> {t("features.journal_li3")}</li>
          </ul>
        </div>
      </div>

      {/* AI Feedback */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-20 items-center">
        <div className="order-2 lg:order-1">
          <h3 className="text-2xl md:text-4xl font-black font-headline mb-4 md:mb-6">{t("features.polish_title")}</h3>
          <p className="text-sm md:text-lg text-on-surface-variant mb-4 md:mb-8">
            STICK doesn't just correct errors; it shows you how a native speaker would express the same thought naturally.
          </p>
          <div className="p-6 bg-secondary-container rounded-2xl border-2 border-black">
            <p className="font-bold italic">"We focus on 'Nuance'—the difference between technically correct and sounding like yourself."</p>
          </div>
        </div>
        
        <div className="order-1 lg:order-2 space-y-6">
          <SketchCard className="p-8 relative overflow-hidden bg-surface-container-low">
            <div className="absolute -top-4 left-6 bg-error text-white px-3 py-1 rounded-full text-xs">Original</div>
            <p className="text-on-surface-variant italic">"I go store for buy some milks."</p>
          </SketchCard>
          <SketchCard className="bg-tertiary text-black p-8 relative">
            <div className="absolute -top-4 left-6 bg-white text-black px-3 py-1 rounded-full text-xs font-bold border-2 border-black">Refined</div>
            <p className="text-xl font-bold">"I'm heading to the store to pick up some milk."</p>
          </SketchCard>
        </div>
      </div>

    </section>
  );
};