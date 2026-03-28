import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../services/api/client';
import { registerWithEmail, loginWithGoogle } from '../../services/api/auth';

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showToast, setShowToast] = useState(false);
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
      <div className="hidden lg:block fixed top-12 right-12 w-40 opacity-30 pointer-events-none z-0">
        <img
          alt="Ink doodles"
          className="w-full"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDReggf0P_wkcWWd0Fhda423sy33gQx4O8yth4VORSkrFmIMe3hMyR8OnwWuWU7OtpoU0sAv3n4dkMWkS36H28HiKLwMspeao6F2RwT7bAFdhxT0uIrPFmUOS6_XoXSbWuQnClBuMTVwZfGsZrQLuPRzj2q45y-6NYcCrphCnXtCdleSUlubDBY3GMZ_hyjYo2NA4eZ5kbw5GpGJZ1kzET1yTom38bkLcbe6v4hpyS0jTOSoHlOUehYbHvZAcxANcttNMP6F4SZODNM"
        />
      </div>
      <div className="hidden lg:block fixed bottom-12 left-12 w-48 opacity-40 grayscale contrast-150 pointer-events-none z-0">
        <img
          alt="Minimalist stick figure sketch"
          className="w-full"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_6nHS_ykcEo4n7c2uwnJlqGBak-v9FkXgYkIwXr0cDGPFd_rToKr1X4uYaTlDj4LVn4jg8n_VuCy87QlUvPMqImBpuzTR3YCL9zzaxUfmBb83G-lPK-KuGAJsvEY49sENg5uObgHK-jT2lKxRtHtxMp-8Vquh7YtK-gXoa9SrfbAYRzw5oz19yQ84wtZcvPpv5FGYWMb4nbYdgpzUTSyxQPEjJqSVZduifWt20S1KZ3ZbnGudj-Q8f0-pP9Wq73j0F3gxbIyMjUFQ"
        />
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
              {t('register.create_btn')}
              <span className="material-symbols-outlined text-xl md:text-2xl group-hover:translate-x-2 transition-transform">arrow_forward</span>
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
                <span className="material-symbols-outlined text-primary text-lg md:text-2xl">public</span>
                <span className="font-bold text-xs md:text-sm">Google</span>
              </button>
              <button
                onClick={handlePhoneSignIn}
                disabled={isSubmitting}
                className="sketch-border border-2 bg-transparent hover:bg-surface-container py-3 md:py-4 flex items-center justify-center gap-2 md:gap-3 transition-all active:scale-95"
                type="button"
              >
                <span className="material-symbols-outlined text-primary text-lg md:text-2xl">smartphone</span>
                <span className="font-bold text-xs md:text-sm">Phone</span>
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

    {/* Coming Soon Toast */}
    {showToast && (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-tertiary-container text-white px-6 py-3 rounded-full sketch-border shadow-xl z-[60] flex items-center gap-2 animate-fade-in-up font-headline font-bold">
        <span className="material-symbols-outlined text-lg">info</span>
        Coming soon!
      </div>
    )}
    </>
  );
};
