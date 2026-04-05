import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';

export const EditProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [nativeLang, setNativeLang] = useState('Vietnamese');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiRequest<{ user: { name: string; email: string; bio: string | null; nativeLanguage: string | null } }>('/profile');
        if (res.user) {
          setName(res.user.name || '');
          setEmail(res.user.email || '');
          setBio(res.user.bio || '');
          setNativeLang(res.user.nativeLanguage || 'Vietnamese');
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await apiRequest('/profile', {
        method: 'PUT',
        body: { name, bio, nativeLanguage: nativeLang }
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (err) {
      console.error('Failed to save profile', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <AppLayout activePath="#profile">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button onClick={() => (window.location.hash = '#profile')} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-3 md:mb-4 group">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="font-headline font-bold text-xs md:text-sm">{t('edit_profile.back')}</span>
          </button>
          <h2 className="font-headline font-extrabold text-2xl md:text-3xl lg:text-4xl tracking-tight -rotate-1 origin-left">
            {t('edit_profile.title')}
          </h2>
          <p className="text-on-surface-variant font-medium text-xs md:text-sm mt-1">{t('edit_profile.subtitle')}</p>
        </div>
          
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
          </div>
        ) : (
          <>
        {/* Avatar Section */}
        <div className="sketch-card p-6 md:p-8 mb-6 flex flex-col sm:flex-row items-center gap-5 md:gap-8">
          <div className="relative shrink-0">
            <div className="w-24 h-24 md:w-32 md:h-32 sketch-border overflow-hidden bg-surface-container-high flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-4xl md:text-5xl text-black/30">person</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setAvatarPreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full border-2 border-surface hover:scale-110 transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
            </button>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-headline font-bold text-lg md:text-xl">{name}</p>
            <p className="text-on-surface-variant text-xs md:text-sm">{t('edit_profile.avatar_hint')}</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4 md:space-y-6">
          {/* Name */}
          <div className="sketch-card p-5 md:p-6">
            <label className="font-headline font-bold text-xs md:text-sm uppercase tracking-widest text-primary block mb-2">{t('edit_profile.name_label')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full sketch-input py-2.5 md:py-3 px-1 text-base md:text-lg font-body focus:ring-0"
            />
          </div>

          {/* Bio */}
          <div className="sketch-card p-5 md:p-6">
            <label className="font-headline font-bold text-xs md:text-sm uppercase tracking-widest text-primary block mb-2">{t('edit_profile.bio_label')}</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              className="w-full sketch-input py-2.5 md:py-3 px-1 text-base md:text-lg font-body focus:ring-0 resize-none"
            />
            <p className="text-right text-[10px] md:text-xs text-on-surface-variant mt-1">{bio.length}/160</p>
          </div>

          {/* Email */}
          <div className="sketch-card p-5 md:p-6">
            <label className="font-headline font-bold text-xs md:text-sm uppercase tracking-widest text-primary block mb-2">{t('edit_profile.email_label')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full sketch-input py-2.5 md:py-3 px-1 text-base md:text-lg font-body focus:ring-0"
            />
          </div>

          {/* Native Language */}
          <div className="sketch-card p-5 md:p-6">
            <label className="font-headline font-bold text-xs md:text-sm uppercase tracking-widest text-primary block mb-2">{t('edit_profile.native_lang')}</label>
            <select
              value={nativeLang}
              onChange={e => setNativeLang(e.target.value)}
              className="w-full sketch-input py-2.5 md:py-3 px-1 text-base md:text-lg font-body focus:ring-0 bg-surface-container-lowest"
            >
              <option>Vietnamese</option>
              <option>Chinese</option>
              <option>Japanese</option>
              <option>Korean</option>
              <option>Spanish</option>
              <option>Other</option>
            </select>
          </div>

          {/* Danger Zone */}
          <div className="sketch-card p-5 md:p-6 border-error/30">
            <h4 className="font-headline font-bold text-sm md:text-base text-error mb-3">{t('edit_profile.danger_zone')}</h4>
            <button className="text-error font-bold text-xs md:text-sm hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">delete</span>
              {t('edit_profile.delete_account')}
            </button>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Save FAB */}
      <button
        onClick={handleSave}
        disabled={loading || saving}
        className={`fixed bottom-24 md:bottom-8 right-6 md:right-8 bg-primary text-white px-6 py-3 rounded-full sketch-border shadow-xl flex items-center gap-2 font-headline font-bold hover:scale-105 active:scale-95 transition-all z-50 ${loading || saving ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="material-symbols-outlined text-lg">{saving ? 'hourglass_empty' : 'save'}</span>
        {saving ? t('edit_profile.saving', { defaultValue: 'Saving...' }) : t('edit_profile.save')}
      </button>
    </AppLayout>

    {showToast && (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-tertiary-container text-white px-6 py-3 rounded-full sketch-border shadow-xl z-[60] flex items-center gap-2 animate-fade-in-up font-headline font-bold">
        <span className="material-symbols-outlined text-lg">check_circle</span>
        {t('edit_profile.saved')}
      </div>
    )}
    </>
  );
};
