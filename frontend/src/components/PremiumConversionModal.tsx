import React, { useState, useEffect } from 'react';
import { getActivePremiumGrant, type PremiumGrantInfo } from '../services/api/endpoints';

interface Props {
  /** Called when user closes the modal */
  onDismiss: () => void;
}

/**
 * End-of-day popup shown to users who received a Premium Day Pass.
 * Encourages them to convert to premium by showing the value they experienced.
 * Spec section 14.3 — popup_psychology settings control copy/behavior.
 */
export const PremiumConversionModal: React.FC<Props> = ({ onDismiss }) => {
  const [grant, setGrant] = useState<PremiumGrantInfo | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    getActivePremiumGrant()
      .then(g => {
        if (g.active && g.reason === 'leaderboard_top3') {
          setGrant(g);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!visible || !grant) return null;

  const handleClose = () => {
    setVisible(false);
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-black relative animate-in fade-in zoom-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={handleClose} className="absolute top-4 right-4 p-1 hover:bg-stone-100 rounded-full transition-colors">
          <span className="material-symbols-outlined text-[20px] text-stone-400">close</span>
        </button>

        {/* Illustration */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[32px]">workspace_premium</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="font-headline font-black text-xl text-center mb-2">
          You experienced Premium today!
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-stone-500 text-center mb-6">
          Your top 3 finish gave you a free Premium Day Pass.
          Want to keep these features every day?
        </p>

        {/* Features list */}
        <div className="space-y-3 mb-6">
          {[
            { icon: 'lightbulb', text: 'Unlimited AI feedback depth' },
            { icon: 'record_voice_over', text: 'Premium voice & shadowing' },
            { icon: 'insights', text: 'Advanced progress analytics' },
            { icon: 'emoji_events', text: 'Exclusive leaderboard badges' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px] text-purple-500">{f.icon}</span>
              </div>
              <span className="text-sm font-headline">{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-headline font-black text-base rounded-xl hover:opacity-95 transition-opacity mb-3 shadow-lg"
          onClick={() => {
            // For MVP pilot — no real payment, just track intent
            window.location.hash = '#premium';
            handleClose();
          }}
        >
          Upgrade to Premium
        </button>

        <button
          onClick={handleClose}
          className="w-full py-2.5 text-stone-400 font-headline font-bold text-sm hover:text-stone-600 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};
