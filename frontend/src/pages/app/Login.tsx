import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../services/api/client';
import { loginWithEmail, loginWithGoogle } from '../../services/api/auth';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithEmail({ email, password });
      window.location.hash = '#app';
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || '';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
        setError('Invalid email or password');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to sign in right now');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      window.location.hash = '#app';
    } catch (err: unknown) {
      const msg = (err as { code?: string })?.code || '';
      if (msg === 'auth/popup-closed-by-user') {
        // User closed the popup, do nothing
      } else {
        setError('Google sign-in failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneSignIn = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  return (
    <>
    <div className="bg-surface text-on-surface min-h-[100dvh] w-full overflow-x-hidden flex flex-col relative">
      {/* Decorative */}
      <div className="hidden lg:block fixed top-20 right-16 opacity-20 pointer-events-none z-0">
        <span className="material-symbols-outlined text-[200px] text-black/10">lock_open</span>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 py-6 md:py-12 relative z-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-12 text-center">
          <div className="inline-block mb-2 md:mb-4 italic font-headline text-2xl md:text-4xl font-black tracking-tighter text-primary">
            STICK
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-primary mb-2 transform -rotate-1">
            {t('login.title')}
          </h1>
          <p className="text-on-surface-variant text-sm md:text-lg">{t('login.subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-lg bg-surface-container-lowest sketch-card p-6 sm:p-8 md:p-10 lg:p-14 mb-4 sm:mb-6 md:mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-8 md:gap-10">
            <div className="flex flex-col gap-5 sm:gap-6 md:gap-8">
              {/* Email */}
              <div className="flex flex-col gap-1.5 md:gap-2">
                <label className="font-headline font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-widest text-primary px-1" htmlFor="login-email">
                  {t('login.email_label')}
                </label>
                <input
                  className="sketch-input py-3 md:py-4 px-1 text-base md:text-xl font-body placeholder:text-outline-variant focus:ring-0"
                  id="login-email"
                  placeholder="hello@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {/* Password */}
              <div className="flex flex-col gap-1.5 md:gap-2">
                <label className="font-headline font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-widest text-primary px-1" htmlFor="login-password">
                  {t('login.password_label')}
                </label>
                <input
                  className="sketch-input py-3 md:py-4 px-1 text-base md:text-xl font-body placeholder:text-outline-variant focus:ring-0"
                  id="login-password"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="flex justify-end mt-1">
                  <button type="button" onClick={() => (window.location.hash = '#forgot-password')} className="text-xs md:text-sm text-primary font-bold hover:underline">
                    {t('login.forgot_password')}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              className="sketch-border bg-surface-container-highest hover:bg-secondary-container py-3 sm:py-4 md:py-5 px-6 md:px-8 font-headline font-extrabold text-lg sm:text-xl md:text-2xl flex items-center justify-center gap-2 md:gap-3 transition-colors group"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('login.signing_in', 'Signing In...') : t('login.sign_in_btn')}
              {isSubmitting ? (
                <span className="material-symbols-outlined text-xl md:text-2xl animate-spin">sync</span>
              ) : (
                <span className="material-symbols-outlined text-xl md:text-2xl group-hover:translate-x-2 transition-transform">arrow_forward</span>
              )}
            </button>
            {error && (
              <p className="text-error text-xs md:text-sm font-bold text-center">{error}</p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 md:gap-4 py-1 md:py-2">
              <div className="h-[2px] bg-outline-variant opacity-30 flex-1"></div>
              <span className="font-headline font-bold text-xs md:text-sm text-on-surface-variant italic">{t('login.or')}</span>
              <div className="h-[2px] bg-outline-variant opacity-30 flex-1"></div>
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <button onClick={handleGoogleSignIn} disabled={isSubmitting} className="sketch-border border-2 bg-transparent hover:bg-surface-container py-3 md:py-4 flex items-center justify-center gap-2 md:gap-3 transition-all active:scale-95" type="button">
                {isSubmitting ? (
                  <span className="material-symbols-outlined text-primary text-lg md:text-2xl animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-primary text-lg md:text-2xl">public</span>
                )}
                <span className="font-bold text-xs md:text-sm">Google</span>
              </button>
              <button onClick={handlePhoneSignIn} disabled={isSubmitting} className="sketch-border border-2 bg-transparent hover:bg-surface-container py-3 md:py-4 flex items-center justify-center gap-2 md:gap-3 transition-all active:scale-95" type="button">
                <span className="material-symbols-outlined text-primary text-lg md:text-2xl">smartphone</span>
                <span className="font-bold text-xs md:text-sm">Phone</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-3 md:gap-4 text-center">
          <p className="text-on-surface-variant text-xs md:text-sm">
            {t('login.no_account')}{' '}
            <button onClick={() => { window.location.hash = '#register'; }} className="text-primary font-bold hover:underline">
              {t('login.sign_up')}
            </button>
          </p>
        </div>
      </main>
    </div>

    {/* Coming Soon Toast */}
    {showToast && (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-tertiary-container text-white px-6 py-3 rounded-full sketch-border shadow-xl z-[60] flex items-center gap-2 animate-fade-in-up font-headline font-bold">
        <span className="material-symbols-outlined text-lg">info</span>
        {t('login.coming_soon')}
      </div>
    )}
    </>
  );
};
