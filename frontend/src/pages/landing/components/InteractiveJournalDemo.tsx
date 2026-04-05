import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const stepOrder = [
  'idle', 'typing', 'reading', 'scanning', 
  'highlight_1', 'highlight_2', 'highlight_3', 
  'fixing_1', 'fixing_2', 'fixing_3', 
  'polishing', 'done'
];

export const InteractiveJournalDemo: React.FC = () => {
  const { t } = useTranslation();
  const wrongText = "Today I very happy cus finish my project.";
  
  const [step, setStep] = useState<string>('idle');
  const [typeIndex, setTypeIndex] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const nextStep = () => {
    setStep(prev => {
      const idx = stepOrder.indexOf(prev);
      return idx < stepOrder.length - 1 ? stepOrder[idx + 1] : prev;
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && step === 'idle') {
          setStep('typing');
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [step]);

  useEffect(() => {
    if (step === 'typing') {
      const id = setInterval(() => {
        setTypeIndex(prev => {
          if (prev >= wrongText.length - 1) {
            clearInterval(id);
            setTimeout(() => nextStep(), 800);
            return wrongText.length;
          }
          return prev + 1;
        });
      }, 70); // Tốc độ gõ tự nhiên, có chủ ý
      return () => clearInterval(id);
    }
    
    // Mỗi bước xử lý được gán một delay để "làm màu"
    const delays: Record<string, number> = {
      'reading': 1500,     // Dừng lại để user đọc câu sai
      'scanning': 1400,    // Đang phân tích tổng thể
      'highlight_1': 600,  // Phát hiện lỗi 1
      'highlight_2': 600,  // Phát hiện lỗi 2
      'highlight_3': 1200, // Phát hiện lỗi 3 (rồi chờ xíu)
      'fixing_1': 700,     // Sửa lỗi 1
      'fixing_2': 700,     // Sửa lỗi 2
      'fixing_3': 1000,    // Sửa lỗi 3
      'polishing': 1200    // Chuốt lại văn phong tổng thể
    };

    if (delays[step]) {
      const id = setTimeout(() => nextStep(), delays[step]);
      return () => clearTimeout(id);
    }
  }, [step, wrongText.length]);

  const getCurrentStepIdx = () => stepOrder.indexOf(step);

  const renderTokens = () => {
    const tokens = [
      { type: 'text', val: "Today I " },
      { type: 'err', wrong: "very", right: "felt", hStep: 'highlight_1', fStep: 'fixing_1' },
      { type: 'text', val: " happy " },
      { type: 'err', wrong: "cus", right: "because I", hStep: 'highlight_2', fStep: 'fixing_2' },
      { type: 'text', val: " " },
      { type: 'err', wrong: "finish", right: "finished", hStep: 'highlight_3', fStep: 'fixing_3' },
      { type: 'text', val: " my project." },
    ];

    const currIdx = getCurrentStepIdx();

    return tokens.map((tok, i) => {
      if (tok.type === 'text') {
        const isPolished = currIdx >= stepOrder.indexOf('polishing');
        return <span key={i} className={`transition-colors duration-700 ${isPolished ? 'text-black' : 'text-stone-600'}`}>{tok.val}</span>;
      }
      
      const hIdx = stepOrder.indexOf(tok.hStep as string);
      const fIdx = stepOrder.indexOf(tok.fStep as string);

      if (currIdx >= fIdx) {
        // Trạng thái đã Fix
        return (
          <span 
            key={i} 
            className="text-tertiary bg-tertiary-container/30 px-2 py-0.5 mx-0.5 rounded-md font-bold transition-all duration-300 inline-block border border-tertiary/40"
            style={{ animation: 'pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
          >
            {tok.right}
          </span>
        );
      } else if (currIdx >= hIdx) {
        // Trạng thái đang Highlight lỗi sai chưa sửa
        return (
          <span 
            key={i} 
            className="text-error bg-error-container/20 px-1 py-0.5 mx-0.5 rounded-md line-through decoration-2 decoration-error font-medium inline-block border-b-2 border-error/50"
            style={{ animation: 'shake 0.4s ease-in-out forwards' }}
          >
            {tok.wrong}
          </span>
        );
      } else {
        // Trạng thái bình thường chưa bị phát hiện
        return <span key={i} className="text-stone-600 transition-colors duration-300">{tok.wrong}</span>;
      }
    });
  };

  const getActionIndicator = () => {
    if (step === 'idle' || step === 'typing' || step === 'reading') return null;
    
    if (step === 'scanning') {
      return (
        <div className="flex items-center gap-2 text-secondary font-bold text-sm bg-secondary-container px-4 py-2 rounded-full sketch-border w-fit animate-pulse">
          <span className="material-symbols-outlined text-base animate-spin-slow">radar</span>
          <span>{t('demo.scanning', { defaultValue: 'Scanning grammar & tone...' })}</span>
        </div>
      );
    }
    
    if (step.startsWith('highlight')) {
      return (
        <div className="flex items-center gap-2 text-error font-bold text-sm bg-error-container/20 px-4 py-2 rounded-full border-2 border-error w-fit transition-all shadow-[2px_2px_0_rgba(0,0,0,0.1)]">
          <span className="material-symbols-outlined text-base">manage_search</span>
          <span>{t('demo.locating', { defaultValue: 'Locating awkward phrasing...' })}</span>
        </div>
      );
    }

    if (step.startsWith('fixing')) {
      return (
        <div className="flex items-center gap-2 text-tertiary font-bold text-sm bg-tertiary-container/30 px-4 py-2 rounded-full border-2 border-tertiary w-fit transition-all shadow-[2px_2px_0_rgba(0,0,0,0.1)]">
          <span className="material-symbols-outlined text-base animate-spin">sync</span>
          <span>{t('demo.applying', { defaultValue: 'Applying native nuance...' })}</span>
        </div>
      );
    }
    
    if (step === 'polishing') {
      return (
        <div className="flex items-center gap-2 text-primary font-bold text-sm bg-primary-container/40 px-4 py-2 rounded-full border-2 border-primary w-fit transition-all scale-105 shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
          <span className="material-symbols-outlined text-base animate-bounce">auto_awesome</span>
          <span>{t('demo.polishing', { defaultValue: 'Finalizing sentence rhythm...' })}</span>
        </div>
      );
    }

    if (step === 'done') {
      return (
        <div className="flex items-center gap-2 text-white font-bold text-sm bg-black px-5 py-2.5 rounded-full sketch-border w-fit" style={{ animation: 'pop 0.4s ease-out' }}>
          <span className="material-symbols-outlined text-base text-tertiary">verified</span>
          <span>{t('demo.done', { defaultValue: 'Perfect native rhythm!' })}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col justify-between">
      <style>{`
        @keyframes pop {
          0% { transform: scale(0.8) translateY(4px); opacity: 0; }
          40% { transform: scale(1.1) translateY(-2px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px) rotate(-1deg); }
          75% { transform: translateX(2px) rotate(1deg); }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
      
      <div className="font-headline text-lg leading-8 min-h-[128px]">
        {step === 'idle' || step === 'typing' || step === 'reading' ? (
          <span className="text-stone-600">
            {wrongText.slice(0, typeIndex)}
            {step !== 'reading' && <span className="w-[2px] h-[1em] bg-black inline-block align-middle ml-[2px] animate-pulse"></span>}
          </span>
        ) : (
          renderTokens()
        )}
      </div>

      {/* AI Action Indicator */}
      <div className="h-10 mt-4 flex items-end">
        {getActionIndicator()}
      </div>
    </div>
  );
};
