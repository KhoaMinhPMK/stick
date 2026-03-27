import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import logoUrl from '../../assets/logo.svg';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [subEmail, setSubEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (subEmail.includes('@')) {
      setSubscribed(true);
      setSubEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="w-full mt-20 border-t-4 border-black bg-[#f1eee5] dark:bg-stone-800">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-12 py-16 max-w-7xl mx-auto">
        <div className="col-span-1 md:col-span-1">
          <div className="mb-6 h-8 flex items-center justify-start">
            <img src={logoUrl} alt="STICK Logo" className="h-full object-contain" />
          </div>
          <p className="text-stone-700 font-body text-sm">
            {t('footer.tagline')}
          </p>
        </div>
        
        <div>
          <h5 className="font-bold mb-6">{t("footer.product")}</h5>
          <ul className="space-y-4 text-sm font-body">
            <li><a className="text-stone-700 hover:italic transition-all" href="#features">{t("footer.features")}</a></li>
            <li><a className="text-stone-700 hover:italic transition-all" href="#pricing">{t("footer.pricing")}</a></li>
            <li><a className="text-stone-700 hover:italic transition-all" href="#why-stick">{t("footer.mission")}</a></li>
          </ul>
        </div>
        
        <div>
          <h5 className="font-bold mb-6">{t("footer.company")}</h5>
          <ul className="space-y-4 text-sm font-body">
            <li><a className="text-stone-700 hover:italic transition-all" href="#validation">{t("footer.validation")}</a></li>
            <li><button onClick={() => (window.location.hash = '#privacy')} className="text-stone-700 hover:italic transition-all">{t("footer.privacy")}</button></li>
            <li><button onClick={() => (window.location.hash = '#terms')} className="text-stone-700 hover:italic transition-all">{t("footer.terms")}</button></li>
          </ul>
        </div>
        
        <div>
          <h5 className="font-bold mb-6">{t("footer.subscribe_title")}</h5>
          <p className="text-sm mb-4">{t("footer.subscribe_desc")}</p>
          <div className="flex gap-2">
            <input 
              className="bg-white border-2 border-black rounded-lg px-3 py-2 text-xs w-full" 
              placeholder={t("footer.email_placeholder")}
              type="email"
              value={subEmail}
              onChange={e => setSubEmail(e.target.value)}
            />
            <button onClick={handleSubscribe} className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-stone-800 transition-colors active:scale-95">
              {t("footer.join_btn")}
            </button>
          </div>
          {subscribed && (
            <p className="text-xs text-tertiary font-bold mt-2 animate-fade-in-up">{t("footer.subscribed")}</p>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-12 py-8 border-t border-black/10 text-center text-xs text-stone-600 font-body">
          © {new Date().getFullYear()} STICK Analog EdTech. {t("footer.drawn_with")}
      </div>
    </footer>
  );
};