import React, { useState, useEffect } from 'react';
import { getActivePremiumGrant, type PremiumGrantInfo } from '../services/api/endpoints';

/**
 * Shows a banner when the user has an active Premium Day Pass.
 * Placed at the top of Dashboard or AppLayout.
 */
export const PremiumDayPassBanner: React.FC = () => {
  const [grant, setGrant] = useState<PremiumGrantInfo | null>(null);

  useEffect(() => {
    getActivePremiumGrant()
      .then(g => { if (g.active) setGrant(g); })
      .catch(() => {});
  }, []);

  if (!grant) return null;

  const hoursLeft = grant.expiresAt
    ? Math.max(0, Math.ceil((new Date(grant.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))
    : null;

  return (
    <div className="mx-4 mb-4 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white flex items-center gap-3 shadow-lg">
      <span className="material-symbols-outlined text-[24px]">card_giftcard</span>
      <div className="flex-1 min-w-0">
        <p className="font-headline font-bold text-sm">Premium Day Pass Active!</p>
        <p className="text-[11px] opacity-90">
          You finished in the top 3 yesterday — enjoy full premium features today.
          {hoursLeft !== null && ` Expires in ~${hoursLeft}h.`}
        </p>
      </div>
      <span className="material-symbols-outlined text-[20px] opacity-70">timer</span>
    </div>
  );
};
