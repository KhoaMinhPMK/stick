import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || sending) return;
    setSending(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/user-not-found') {
        setError(t('forgot_password.error_not_found', { defaultValue: 'No account found with this email.' }));
      } else if (code === 'auth/invalid-email') {
        setError(t('forgot_password.error_invalid', { defaultValue: 'Invalid email address.' }));
      } else {
        setError(t('forgot_password.error_generic', { defaultValue: 'Something went wrong. Please try again.' }));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-[100dvh] w-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block mb-3 italic font-headline text-2xl md:text-3xl font-black tracking-tighter text-primary">STICK</div>
          <h1 className="font-headline text-2xl md:text-4xl font-extrabold tracking-tight text-primary mb-2 -rotate-1">
            {t('forgot_password.title')}
          </h1>
          <p className="text-on-surface-variant text-sm md:text-base">{t('forgot_password.subtitle')}</p>
        </div>

        {!sent ? (
          <div className="sketch-card p-6 md:p-10 bg-surface-container-lowest">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="font-headline font-bold text-xs md:text-sm uppercase tracking-widest text-primary px-1" htmlFor="fp-email">
                  {t('forgot_password.email_label')}
                </label>
                <input
                  className="sketch-input py-3 md:py-4 px-1 text-base md:text-xl font-body placeholder:text-outline-variant focus:ring-0"
                  id="fp-email"
                  placeholder="hello@example.com"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button className="sketch-border bg-surface-container-highest hover:bg-secondary-container py-3 md:py-4 px-6 font-headline font-extrabold text-lg md:text-xl flex items-center justify-center gap-2 transition-colors group disabled:opacity-50" type="submit" disabled={sending}>
                {sending ? '...' : t('forgot_password.send_btn')}
                {!sending && <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">send</span>}
              </button>
              {error && <p className="text-error text-sm font-bold text-center">{error}</p>}
            </form>
          </div>
        ) : (
          <div className="sketch-card p-6 md:p-10 bg-surface-container-lowest text-center">
            <span className="material-symbols-outlined text-5xl md:text-6xl text-tertiary mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
            <h3 className="font-headline font-bold text-lg md:text-xl mb-2">{t('forgot_password.sent_title')}</h3>
            <p className="text-on-surface-variant text-sm md:text-base mb-6">{t('forgot_password.sent_desc')}</p>
            <button onClick={() => setSent(false)} className="text-primary font-bold text-sm hover:underline">
              {t('forgot_password.resend')}
            </button>
          </div>
        )}

        <div className="text-center mt-6">
          <button onClick={() => (window.location.hash = '#login')} className="text-primary font-bold text-sm hover:underline flex items-center gap-1 mx-auto">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {t('forgot_password.back_login')}
          </button>
        </div>
      </div>
    </div>
  );
};
