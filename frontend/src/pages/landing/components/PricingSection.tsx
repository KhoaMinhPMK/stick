import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../../components/ui/Icon';

export const PricingSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="py-12 md:py-24 bg-surface-container" id="pricing">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <h2 className="text-2xl md:text-4xl font-black font-headline text-center mb-8 md:mb-16">{t('pricing.title')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-stretch max-w-4xl mx-auto">
          
          {/* Free */}
          <div className="p-6 md:p-10 bg-white sketch-border flex flex-col">
            <div className="text-xl font-bold mb-4">{t('pricing.free_t')}</div>
            <div className="text-3xl md:text-4xl font-black mb-2">{t('pricing.free_p')}</div>
            <p className="text-sm text-on-surface-variant mb-4 md:mb-8">{t('pricing.free_d')}</p>
            <ul className="space-y-3 md:space-y-4 mb-6 md:mb-12 flex-grow">
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs" /> {t('pricing.f1')}</li>
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs" /> {t('pricing.f2')}</li>
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs" /> {t('pricing.f3')}</li>
            </ul>
            <button 
              onClick={() => {
                const uj = localStorage.getItem('stick_user');
                let isReal = false;
                try { const u = uj && JSON.parse(uj); isReal = u && u.isGuest === false; } catch { /* */ }
                window.location.hash = isReal ? '#dashboard' : '#onboarding';
              }}
              className="w-full py-3 border-2 border-black rounded-full font-bold hover:bg-surface-container-low transition-colors"
            >
              {t('pricing.btn_f')}
            </button>
          </div>
          
          {/* Premium */}
          <div className="p-6 md:p-10 bg-white sketch-border flex flex-col shadow-xl relative border-4 border-black">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-xs font-bold">
              {t('pricing.badge')}
            </div>
            <div className="text-xl font-bold mb-4">{t('pricing.prem_t')}</div>
            <div className="text-3xl md:text-4xl font-black mb-2">{t('pricing.prem_p1')}<span className="text-sm font-normal">/{t('pricing.monthly')}</span></div>
            <p className="text-sm text-on-surface-variant mb-4 md:mb-8">{t('pricing.prem_d')}</p>
            <ul className="space-y-3 md:space-y-4 mb-6 md:mb-12 flex-grow">
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs font-bold" /> {t('pricing.p1')}</li>
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs font-bold" /> {t('pricing.p2')}</li>
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs font-bold" /> {t('pricing.p3')}</li>
              <li className="flex items-center gap-2"><Icon name="check" className="text-xs font-bold" /> {t('pricing.p4')}</li>
            </ul>
            <button 
              onClick={() => {
                const uj = localStorage.getItem('stick_user');
                let isReal = false;
                try { const u = uj && JSON.parse(uj); isReal = u && u.isGuest === false; } catch { /* */ }
                window.location.hash = isReal ? '#dashboard' : '#onboarding';
              }}
              className="w-full py-3 bg-black text-white rounded-full font-bold hover:opacity-90 transition-opacity"
            >
              {t('pricing.btn_p')}
            </button>
          </div>
          
        </div>
      </div>
    </section>
  );
};