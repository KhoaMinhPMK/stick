import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../../components/ui/Icon';

export const ProblemSection: React.FC = () => {
  const { t } = useTranslation();

  const cards = [
    { title: t('problem.card1_title'), desc: t('problem.card1_desc'), hoverRotate: 'hover:-rotate-2' },
    { title: t('problem.card2_title'), desc: t('problem.card2_desc'), hoverRotate: 'hover:rotate-2', mt: 'mt-6 sm:mt-12' },
    { title: t('problem.card3_title'), desc: t('problem.card3_desc'), hoverRotate: 'hover:rotate-1' },
    { title: t('problem.card4_title', { defaultValue: 'Drill Fatigue' }), desc: t('problem.card4_desc', { defaultValue: 'Boring flashcards don\'t build emotional connections to the language.' }), hoverRotate: 'hover:-rotate-3', mt: 'mt-6 sm:mt-12' },
  ];

  return (
    <section className="py-12 md:py-24 max-w-7xl mx-auto px-4 md:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-20 items-center">
        <div className="order-2 lg:order-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
            {cards.map((card, i) => (
              <div key={i} className={`p-5 md:p-8 border-2 border-black rounded-3xl bg-surface-container transition-all duration-300 transform hover:-translate-y-2 ${card.hoverRotate} hover:shadow-[6px_8px_0_rgba(0,0,0,1)] hover:bg-white cursor-default ${card.mt || ''}`}>
                <h4 className="font-bold text-xl mb-3">{card.title}</h4>
                <p className="text-sm text-on-surface-variant">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="order-1 lg:order-2">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black font-headline mb-4 md:mb-8">{t('problem.headline', { defaultValue: 'Why learners study for years and still can\'t use it.' })}</h2>
          <p className="text-sm md:text-lg text-on-surface-variant mb-4 md:mb-8">
            {t('problem.description', { defaultValue: 'Traditional methods focus on passive consumption. You watch, you read, you listen. But you never produce. The gap between input and output is where fluency goes to die.' })}
          </p>
          <div className="flex items-center gap-4 p-4 bg-stone-200 rounded-2xl border-l-8 border-black">
            <Icon name="warning" className="text-black" />
            <p className="font-bold text-black">{t('problem.callout', { defaultValue: 'Knowledge ≠ Performance' })}</p>
          </div>
        </div>
      </div>
    </section>
  );
};