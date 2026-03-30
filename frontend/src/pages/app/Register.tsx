import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../services/api/client';
import { registerWithEmail, loginWithGoogle } from '../../services/api/auth';

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      window.location.hash = '#app';
    } catch (err: unknown) {
      const msg = (err as { code?: string })?.code || '';
      if (msg !== 'auth/popup-closed-by-user') {
        const errorDetails = (err as Error)?.message || String(err);
        setError(`Google sign-in failed: ${errorDetails}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await registerWithEmail({ name, email, password });
      window.location.hash = '#app';
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || '';
      if (msg.includes('auth/email-already-in-use')) {
        setError('This email is already registered');
      } else if (msg.includes('auth/weak-password')) {
        setError('Password should be at least 6 characters');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to register right now');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="bg-surface text-on-surface min-h-[100dvh] w-full overflow-x-hidden flex flex-col relative">
      {/* Decorative Elements — desktop only */}
      <div className="hidden lg:block fixed top-12 right-12 w-40 opacity-10 pointer-events-none z-0">
        <span className="material-symbols-outlined text-[80px] text-primary">edit_note</span>
      </div>
      <div className="hidden lg:block fixed bottom-12 left-12 w-48 opacity-10 pointer-events-none z-0">
        <span className="material-symbols-outlined text-[120px] text-primary">draw</span>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 py-6 md:py-12 relative z-10">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 md:mb-12 text-center">
          <div className="inline-block mb-2 md:mb-4 italic font-headline text-2xl md:text-4xl font-black tracking-tighter text-primary">
            STICK
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary mb-2 transform -rotate-1">
            {t('register.title')}
          </h1>
          <p className="text-on-surface-variant text-sm md:text-lg">{t('register.subtitle')}</p>
        </div>

        {/* Registration Card */}
        <div className="w-full max-w-lg bg-surface-container-lowest sketch-card p-6 sm:p-8 md:p-10 lg:p-14 mb-4 sm:mb-6 md:mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-8 md:gap-10">
            {/* Input Fields */}
            <div className="flex flex-col gap-5 sm:gap-6 md:gap-8">
              {/* Name */}
              <div className="flex flex-col gap-1.5 md:gap-2">
                <label
                  className="font-headline font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-widest text-primary px-1"
                  htmlFor="reg-name"
                >
                  {t('register.name_label')}
                </label>
                <input
                  className="sketch-input py-3 md:py-4 px-1 text-base md:text-xl font-body placeholder:text-outline-variant focus:ring-0"
                  id="reg-name"
                  placeholder={t('register.name_placeholder')}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              {/* Email */}
              <div className="flex flex-col gap-1.5 md:gap-2">
                <label
                  className="font-headline font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-widest text-primary px-1"
                  htmlFor="reg-email"
                >
                  {t('register.email_label')}
                </label>
                <input
                  className="sketch-input py-3 md:py-4 px-1 text-base md:text-xl font-body placeholder:text-outline-variant focus:ring-0"
                  id="reg-email"
                  placeholder="hello@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {/* Password */}
              <div className="flex flex-col gap-1.5 md:gap-2">
                <label
                  className="font-headline font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-widest text-primary px-1"
                  htmlFor="reg-password"
                >
                  {t('register.password_label')}
                </label>
                <input
                  className="sketch-input py-3 md:py-4 px-1 text-base md:text-xl font-body placeholder:text-outline-variant focus:ring-0"
                  id="reg-password"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-[10px] sm:text-xs text-on-surface-variant mt-1 px-1">{t('register.password_hint')}</p>
              </div>
            </div>

            {/* Primary Action */}
            <button
              className="sketch-border bg-surface-container-highest hover:bg-secondary-container py-3 sm:py-4 md:py-5 px-6 md:px-8 font-headline font-extrabold text-lg sm:text-xl md:text-2xl flex items-center justify-center gap-2 md:gap-3 transition-colors group"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('register.creating', 'Creating...') : t('register.create_btn')}
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
              <span className="font-headline font-bold text-xs md:text-sm text-on-surface-variant italic">{t('register.or')}</span>
              <div className="h-[2px] bg-outline-variant opacity-30 flex-1"></div>
            </div>

            {/* Social Options */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="sketch-border border-2 bg-transparent hover:bg-surface-container py-3 md:py-4 flex items-center justify-center gap-2 md:gap-3 transition-all active:scale-95"
                type="button"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined text-primary text-lg md:text-2xl animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-primary text-lg md:text-2xl">public</span>
                )}
                <span className="font-bold text-xs md:text-sm">Google</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-3 md:gap-4 text-center">
          <p className="text-on-surface-variant text-xs md:text-sm">
            {t('register.already_have')}{' '}
            <button
              onClick={() => { window.location.hash = '#login'; }}
              className="text-primary font-bold hover:underline"
            >
              {t('register.sign_in')}
            </button>
          </p>
          <p className="text-on-surface-variant text-[10px] md:text-xs max-w-sm leading-relaxed mt-2">
            {t('register.terms')}
          </p>
        </div>
      </main>
    </div>
    </>
  );
};
