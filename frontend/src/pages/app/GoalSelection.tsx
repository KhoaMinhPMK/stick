import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../services/api/client';
import { saveOnboardingState } from '../../services/api/onboarding';

export const GoalSelectionPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const goals = [
    { id: 'habit', icon: 'calendar_today', titleKey: 'goal_selection.goals.habit.title', descKey: 'goal_selection.goals.habit.desc' },
    { id: 'speak', icon: 'record_voice_over', titleKey: 'goal_selection.goals.speak.title', descKey: 'goal_selection.goals.speak.desc' },
    { id: 'write', icon: 'edit_square', titleKey: 'goal_selection.goals.write.title', descKey: 'goal_selection.goals.write.desc' },
    { id: 'confidence', icon: 'psychology', titleKey: 'goal_selection.goals.confidence.title', descKey: 'goal_selection.goals.confidence.desc' },
    { id: 'school', icon: 'school', titleKey: 'goal_selection.goals.school.title', descKey: 'goal_selection.goals.school.desc' },
    { id: 'work', icon: 'work', titleKey: 'goal_selection.goals.work.title', descKey: 'goal_selection.goals.work.desc' }
  ];

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (selectedGoals.length === 0) return;

    setError('');
    setIsSaving(true);
    try {
      await saveOnboardingState({
        step: 3,
        goal: selectedGoals,
      });
      window.location.hash = '#save-progress';
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to save goals');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface overflow-x-hidden min-h-[100dvh] flex flex-col relative">

      {/* Main Workspace */}
      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col items-center px-4 md:px-12 lg:px-20 py-8 lg:py-12 relative z-10">
        
        {/* Content Header */}
        <div className="mb-8 md:mb-12 text-center animate-fade-in px-2">
          <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-black mb-3 md:mb-4 -rotate-1 inline-block">
            {t('goal_selection.title')}
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-secondary font-medium max-w-lg mx-auto">
            {t('goal_selection.subtitle')}
          </p>
        </div>

        {/* Goal Selection Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-12 lg:mb-16">
          {goals.map((goal, index) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <button 
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={`flex flex-col items-start p-6 lg:p-8 sketch-border wobble-hover transition-all text-left relative group ${
                  isSelected ? 'bg-secondary-container ring-1 ring-black' : 'bg-surface-container-lowest hover:bg-surface-container-low'
                }`}
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
                <div className="mb-4 lg:mb-6">
                  <span className="material-symbols-outlined text-4xl lg:text-5xl text-primary">{goal.icon}</span>
                </div>
                <h3 className="font-headline text-xl lg:text-2xl font-bold leading-tight mb-2 pr-6">
                  {t(goal.titleKey)}
                </h3>
                <p className="text-on-surface-variant leading-relaxed text-sm lg:text-base">
                  {t(goal.descKey)}
                </p>
                <div className={`absolute top-4 right-4 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}>
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex justify-center w-full max-w-[280px] sm:max-w-none mb-12">
          <button 
            onClick={handleContinue}
            disabled={selectedGoals.length === 0 || isSaving}
            className={`w-full sm:w-auto py-4 px-12 rounded-full font-headline font-bold text-lg md:text-xl transition-all sketch-border flex items-center justify-center gap-3 ${
              selectedGoals.length > 0 
                ? 'bg-primary text-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000]' 
                : 'bg-surface-dim text-outline opacity-50 cursor-not-allowed'
            }`}
          >
            {t('goal_selection.continue')}
            <span className="material-symbols-outlined transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
        {error && (
          <p className="mb-8 text-error text-xs md:text-sm font-bold text-center">{error}</p>
        )}
      </main>

      {/* Decorative Stick Figures */}
      <div className="fixed bottom-10 right-10 pointer-events-none opacity-10 hidden lg:block z-0">
        <span className="material-symbols-outlined text-[120px] text-primary">rocket_launch</span>
      </div>
      <div className="fixed top-40 left-10 xl:left-20 pointer-events-none opacity-[0.08] hidden md:block z-0">
        <span className="material-symbols-outlined text-[60px] xl:text-[80px] text-primary rotate-12">auto_awesome</span>
      </div>
    </div>
  );
};
