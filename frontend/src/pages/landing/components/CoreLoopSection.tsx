import React from 'react';
import { useTranslation } from 'react-i18next';

export const CoreLoopSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="py-12 md:py-24 bg-primary text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black font-headline text-center mb-10 md:mb-20">{t("core_loop.title")}</h2>

        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 border-t-2 border-dashed border-white/20 -translate-y-1/2"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8 relative">

            {/* Step 1 */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-white text-black font-black text-2xl flex items-center justify-center rounded-full mx-auto mb-6 sketch-border relative z-10 w-[64px] h-[64px]">{t("core_loop.step1_num")}</div>
              <h4 className="font-bold mb-2">{t("core_loop.step1_title")}</h4>
              <p className="text-xs text-white/60">{t("core_loop.step1_desc")}</p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-white text-black font-black text-2xl flex items-center justify-center rounded-full mx-auto mb-6 sketch-border relative z-10 w-[64px] h-[64px]">{t("core_loop.step2_num")}</div>
              <h4 className="font-bold mb-2">{t("core_loop.step2_title")}</h4>
              <p className="text-xs text-white/60">{t("core_loop.step2_desc")}</p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-white text-black font-black text-2xl flex items-center justify-center rounded-full mx-auto mb-6 sketch-border relative z-10 w-[64px] h-[64px]">{t("core_loop.step3_num")}</div>
              <h4 className="font-bold mb-2">{t("core_loop.step3_title")}</h4>
              <p className="text-xs text-white/60">{t("core_loop.step3_desc")}</p>
            </div>

            {/* Step 4 */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-white text-black font-black text-2xl flex items-center justify-center rounded-full mx-auto mb-6 sketch-border relative z-10 w-[64px] h-[64px]">{t("core_loop.step4_num")}</div>
              <h4 className="font-bold mb-2">{t("core_loop.step4_title")}</h4>
              <p className="text-xs text-white/60">{t("core_loop.step4_desc")}</p>
            </div>

            {/* Step 5 */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-white text-black font-black text-2xl flex items-center justify-center rounded-full mx-auto mb-6 sketch-border relative z-10 w-[64px] h-[64px]">{t("core_loop.step5_num")}</div>
              <h4 className="font-bold mb-2">{t("core_loop.step5_title")}</h4>
              <p className="text-xs text-white/60">{t("core_loop.step5_desc")}</p>            </div>          </div>
        </div>
      </div>
    </section>
  );
};