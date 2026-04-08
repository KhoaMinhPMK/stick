import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getSettings, updateSettings, deleteAccount } from '../../services/api/endpoints';
import { logout } from '../../services/api/auth';

const speeds = ['Slow', 'Normal', 'Fast'];
const languages = [
  { label: 'English (United Kingdom)', value: 'en-GB' },
  { label: 'English (United States)', value: 'en-US' },
  { label: 'Tiếng Việt', value: 'vi' },
];

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSpeed, setSelectedSpeed] = useState(1);
  const [selectedLang, setSelectedLang] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(15);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { settings } = await getSettings();
        setSoundEnabled(settings.soundOn);
        setDailyGoal(settings.dailyGoalMinutes);
        // Match language
        const langIdx = languages.findIndex(l => l.value === settings.language);
        if (langIdx >= 0) setSelectedLang(langIdx);
      } catch (err) {
        console.error('Failed to load settings:', err);
        setLoadError(t('settings.error_load'));
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        soundOn: soundEnabled,
        dailyGoalMinutes: dailyGoal,
        language: languages[selectedLang].value,
      });
      setShowSaved(true);
      setSaveError(null);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveError(t('settings.error_save'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setShowResetConfirm(false);
    window.location.hash = '#onboarding';
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      localStorage.clear();
      window.location.hash = '#landing';
      window.location.reload();
    } catch {
      setDeleting(false);
      setDeleteError(t('settings.delete_error'));
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <AppLayout activePath="#settings">
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
    <AppLayout activePath="#settings">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-12">
          <button onClick={() => (window.location.hash = '#profile')} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-3 md:mb-4 group">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="font-headline font-bold text-xs md:text-sm">{t('settings.back')}</span>
          </button>
          <h1 className="font-headline font-extrabold text-3xl md:text-4xl lg:text-5xl tracking-tight -rotate-1 origin-left">{t('settings.title')}</h1>
          <p className="text-on-surface-variant font-body mt-1 md:mt-2 text-sm md:text-base">{t('settings.subtitle')}</p>
        </div>

        {/* Settings Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 lg:gap-8">
          {/* Sound Settings */}
          <div className="md:col-span-4 sketch-card bg-surface-container p-5 md:p-8 flex flex-col justify-between hover:-rotate-1 transition-transform">
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-3xl md:text-4xl">volume_up</span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-12 md:w-14 h-6 md:h-7 rounded-full border-2 md:border-3 border-black relative transition-colors ${soundEnabled ? 'bg-tertiary-container' : 'bg-surface-container-highest'}`}
              >
                <div className={`w-4 h-4 md:w-[18px] md:h-[18px] rounded-full absolute top-[2px] transition-transform ${soundEnabled ? 'translate-x-6 md:translate-x-7 bg-white' : 'translate-x-[2px] bg-black'}`} />
              </button>
            </div>
            <div className="mt-6 md:mt-8">
              <h3 className="font-headline font-bold text-xl md:text-2xl">{t('settings.sound_title')}</h3>
              <p className="font-body text-xs md:text-sm text-on-surface-variant mt-1 md:mt-2">{t('settings.sound_desc')}</p>
            </div>
          </div>

          {/* Playback Speed */}
          <div className="md:col-span-8 sketch-card bg-surface p-5 md:p-8">
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <span className="material-symbols-outlined text-2xl md:text-3xl">speed</span>
              <h3 className="font-headline font-bold text-xl md:text-2xl">{t('settings.speed_title')}</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {speeds.map((s, i) => (
                <button
                  key={s}
                  onClick={() => setSelectedSpeed(i)}
                  className={`font-headline py-3 md:py-4 rounded-xl transition-colors text-sm md:text-base ${
                    i === selectedSpeed
                      ? 'border-3 md:border-4 border-black bg-secondary-container font-bold shadow-[3px_3px_0_0_#000] md:shadow-[4px_4px_0_0_#000]'
                      : 'border-2 border-black hover:bg-secondary-container'
                  }`}
                >
                  {t(`settings.speed_${s.toLowerCase()}`)}
                </button>
              ))}
            </div>
            <p className="mt-4 md:mt-6 text-xs md:text-sm italic opacity-70 flex items-center gap-1 md:gap-2">
              <span className="material-symbols-outlined text-xs md:text-base">info</span>
              {t('settings.speed_note')}
            </p>
          </div>

          {/* Language Selection */}
          <div className="md:col-span-7 sketch-card bg-surface-container-low p-5 md:p-8">
            <h3 className="font-headline font-bold text-xl md:text-2xl mb-4 md:mb-6">{t('settings.language_title')}</h3>
            <div className="space-y-2 md:space-y-4">
              {languages.map((lang, i) => (
                <button
                  key={lang.value}
                  onClick={() => setSelectedLang(i)}
                  className={`flex items-center justify-between w-full p-3 md:p-4 rounded-lg transition-colors text-left ${
                    i === selectedLang
                      ? 'border-2 md:border-3 border-black bg-surface'
                      : 'border-2 border-black/10 hover:border-black/50'
                  }`}
                >
                  <span className="font-body font-medium text-sm md:text-base">{lang.label}</span>
                  {i === selectedLang && (
                    <span className="material-symbols-outlined text-sm md:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Goal */}
          <div className="md:col-span-5 sketch-card bg-tertiary-container text-white p-5 md:p-8 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-headline font-bold text-xl md:text-2xl mb-1 md:mb-2">{t('settings.goal_title')}</h3>
              <p className="text-on-tertiary opacity-90 text-xs md:text-sm mb-4 md:mb-6">{t('settings.goal_desc')}</p>
              <div className="flex items-end gap-1 md:gap-2 mb-6 md:mb-8">
                <span className="text-4xl md:text-6xl font-headline font-black">{dailyGoal}</span>
                <span className="text-lg md:text-xl font-headline font-bold pb-1 md:pb-2">{t('settings.min_per_day')}</span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={dailyGoal}
                onChange={e => setDailyGoal(Number(e.target.value))}
                className="w-full h-2 bg-black/20 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between text-[10px] md:text-xs mt-1 md:mt-2 font-bold font-headline uppercase tracking-widest">
                <span>{t('settings.casual')}</span>
                <span>{t('settings.intense')}</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-20 transform scale-125 md:scale-150">
              <span className="material-symbols-outlined text-[120px] md:text-[180px]">directions_run</span>
            </div>
          </div>

          {/* Reset */}
          <div className="md:col-span-12 mt-6 md:mt-12 flex flex-col items-center">
            <div className="w-full max-w-md p-5 md:p-8 border-2 border-black border-dashed rounded-3xl text-center">
              <span className="material-symbols-outlined text-3xl md:text-4xl text-error mb-3 md:mb-4 block">refresh</span>
              <h4 className="font-headline font-bold text-base md:text-xl mb-1 md:mb-2">{t('settings.reset_title')}</h4>
              <p className="font-body text-xs md:text-sm text-on-surface-variant mb-4 md:mb-6">{t('settings.reset_desc')}</p>
              <button onClick={() => setShowResetConfirm(true)} className="sketch-border px-6 md:px-8 py-2 md:py-3 bg-white hover:bg-error-container hover:text-error transition-all font-headline font-bold uppercase tracking-widest text-[10px] md:text-sm active:scale-95">
                {t('settings.reset_button')}
              </button>
            </div>

            {/* Delete Account */}
            <div className="w-full max-w-md p-5 md:p-8 border-2 border-error/40 border-dashed rounded-3xl text-center mt-6">
              <span className="material-symbols-outlined text-3xl md:text-4xl text-error mb-3 md:mb-4 block">delete_forever</span>
              <h4 className="font-headline font-bold text-base md:text-xl mb-1 md:mb-2">{t('settings.delete_title', { defaultValue: 'Delete Account' })}</h4>
              <p className="font-body text-xs md:text-sm text-on-surface-variant mb-4 md:mb-6">{t('settings.delete_desc', { defaultValue: 'Permanently delete your account and all data. This action cannot be undone.' })}</p>
              <button onClick={() => setShowDeleteConfirm(true)} className="sketch-border px-6 md:px-8 py-2 md:py-3 bg-error text-white hover:bg-red-700 transition-all font-headline font-bold uppercase tracking-widest text-[10px] md:text-sm active:scale-95">
                {t('settings.delete_button', { defaultValue: 'Delete Account' })}
              </button>
            </div>

            {/* Logout */}
            <button
              onClick={async () => {
                await logout();
                window.location.hash = '#landing';
                window.location.reload();
              }}
              className="w-full max-w-md mt-6 py-3 md:py-4 sketch-border bg-surface-container-highest font-headline font-bold text-sm md:text-base hover:bg-secondary-container transition-colors flex items-center justify-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              {t('settings.logout', { defaultValue: 'Log Out' })}
            </button>
            <div className="mt-8 md:mt-12 opacity-30 flex flex-col items-center gap-1 md:gap-2">
              <div className="text-2xl md:text-3xl font-black italic font-headline">STICK</div>
              <p className="text-[10px] md:text-xs font-medium">v4.2.0-sketch-stable</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>

    {/* Save FAB */}
    <button
      onClick={handleSave}
      disabled={saving}
      className="fixed bottom-24 md:bottom-8 right-6 md:right-8 px-6 py-3 bg-black text-white rounded-full flex items-center gap-2 shadow-xl border-[3px] border-white hover:scale-105 active:scale-95 transition-all z-50 font-headline font-bold text-sm md:text-base disabled:opacity-50"
    >
      {saving ? (
        <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
      ) : (
        <span className="material-symbols-outlined text-lg">save</span>
      )}
      {saving ? t('settings.saving') : t('settings.save')}
    </button>

    {/* Saved Toast */}
    {showSaved && (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-tertiary-container text-white px-6 py-3 rounded-full sketch-border shadow-xl z-[60] flex items-center gap-2 animate-fade-in-up font-headline font-bold">
        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        {t('settings.saved_toast')}
      </div>
    )}

    {/* Save Error Toast */}
    {saveError && (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-error-container text-on-error-container px-6 py-3 rounded-full sketch-border shadow-xl z-[60] flex items-center gap-2 animate-fade-in-up font-headline font-bold">
        <span className="material-symbols-outlined text-lg">error</span>
        {saveError}
      </div>
    )}

    {/* Delete Error Toast */}
    {deleteError && (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-error-container text-on-error-container px-6 py-3 rounded-full sketch-border shadow-xl z-[60] flex items-center gap-2 animate-fade-in-up font-headline font-bold">
        <span className="material-symbols-outlined text-lg">error</span>
        {deleteError}
      </div>
    )}

    {/* Reset Confirm Modal */}
    {showResetConfirm && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest sketch-card p-6 md:p-8 max-w-sm w-full text-center">
          <span className="material-symbols-outlined text-4xl text-error mb-3 block">warning</span>
          <h3 className="font-headline font-bold text-lg md:text-xl mb-2">{t('settings.reset_title')}</h3>
          <p className="text-on-surface-variant text-xs md:text-sm mb-6">{t('settings.reset_desc')}</p>
          <div className="flex gap-3">
            <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2.5 sketch-border bg-surface-container font-headline font-bold text-sm hover:bg-surface-container-high transition-colors active:scale-95">
              {t('common.cancel')}
            </button>
            <button onClick={handleReset} className="flex-1 py-2.5 sketch-border bg-error text-white font-headline font-bold text-sm hover:bg-red-700 transition-colors active:scale-95">
              {t('settings.reset_button')}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Delete Account Confirm Modal */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest sketch-card p-6 md:p-8 max-w-sm w-full text-center">
          <span className="material-symbols-outlined text-4xl text-error mb-3 block">delete_forever</span>
          <h3 className="font-headline font-bold text-lg md:text-xl mb-2">{t('settings.delete_title', { defaultValue: 'Delete Account' })}</h3>
          <p className="text-on-surface-variant text-xs md:text-sm mb-6">{t('settings.delete_confirm_desc', { defaultValue: 'All your journals, progress, and data will be permanently removed. Are you sure?' })}</p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1 py-2.5 sketch-border bg-surface-container font-headline font-bold text-sm hover:bg-surface-container-high transition-colors active:scale-95">
              {t('common.cancel')}
            </button>
            <button onClick={handleDeleteAccount} disabled={deleting} className="flex-1 py-2.5 sketch-border bg-error text-white font-headline font-bold text-sm hover:bg-red-700 transition-colors active:scale-95 disabled:opacity-50">
              {deleting ? t('settings.deleting') : t('settings.delete_confirm')}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};
