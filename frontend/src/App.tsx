import { useState, useEffect } from 'react';
import LandingPage from './pages/landing';
import { ensureSession } from './services/api/auth';
import { isRealUserLoggedIn } from './services/api/client';
import { getSettings } from './services/api/endpoints';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { OnboardingFlow } from './pages/app/onboarding/OnboardingFlow';
import { LevelSelectionPage } from './pages/app/LevelSelection';
import { PracticeSchedulePage } from './pages/app/PracticeSchedule';
import { GoalSelectionPage } from './pages/app/GoalSelection';
import { SaveProgressPage } from './pages/app/SaveProgress';
import { RegisterPage } from './pages/app/Register';
import { DashboardPage } from './pages/app/Dashboard';
import { JournalPage } from './pages/app/Journal';
import { VocabularyReviewPage } from './pages/app/VocabularyReview';
import { FeedbackPage } from './pages/app/Feedback';
import { CompletionPage } from './pages/app/Completion';
import { JournalWorkspacePage } from './pages/app/JournalWorkspace';
import { FeedbackResultPage } from './pages/app/FeedbackResult';
import { ProgressPage } from './pages/app/Progress';
import { HistoryDetailPage } from './pages/app/HistoryDetail';
import { SkeletonLoadingPage } from './pages/app/SkeletonLoading';
import { ErrorPage } from './pages/app/ErrorPage';
import { ProfilePage } from './pages/app/Profile';
import { SettingsPage } from './pages/app/Settings';
import { RemindersPage } from './pages/app/Reminders';
import { LibraryPage } from './pages/app/Library';
import { LoginPage } from './pages/app/Login';
import { HistoryListPage } from './pages/app/HistoryList';
import { LessonDetailPage } from './pages/app/LessonDetail';
import { EditProfilePage } from './pages/app/EditProfile';
import { SavedPhrasesPage } from './pages/app/SavedPhrases';
import { VocabNotebookPage } from './pages/app/VocabNotebook';
import { ForgotPasswordPage } from './pages/app/ForgotPassword';
import { AchievementsPage } from './pages/app/Achievements';
import { NotificationsPage } from './pages/app/Notifications';
import { StaticPage } from './pages/app/StaticPage';
import { ReadingModePage } from './pages/app/ReadingMode';
import { GrammarPracticePage } from './pages/app/GrammarPractice';
import { ListeningPracticePage } from './pages/app/ListeningPractice';
import { SpeakingReportPage } from './pages/app/SpeakingReport';
import { DailyChallengePage } from './pages/app/DailyChallenge';
import { LeaderboardPage } from './pages/app/Leaderboard';
import { JournalArchivePage } from './pages/app/JournalArchive';
import { SpeakingPracticePage } from './pages/app/SpeakingPractice';
import { AdminApp } from './pages/admin/AdminApp';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentView, setCurrentView] = useState('landing');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [adminRoute, setAdminRoute] = useState('');

  useEffect(() => {
    // Simple hash-based router
    const handleHashChange = () => {
      // Cancel any ongoing speech synthesis when navigating away
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      // Strip query params before route matching so '#feedback?journalId=x' routes correctly
      const hash = window.location.hash.split('?')[0];
      // Admin routes: #admin/login, #admin/dashboard, etc.
      if (hash.startsWith('#admin')) {
        const sub = hash.replace('#admin/', '').replace('#admin', '') || 'dashboard';
        setCurrentView('admin');
        setAdminRoute(sub);
        return;
      }
      if (hash === '#onboarding') {
        setCurrentView('onboarding');
        setOnboardingStep(0);
      } else if (hash === '#onboarding-2') {
        setCurrentView('onboarding');
        setOnboardingStep(1);
      } else if (hash === '#onboarding-3') {
        setCurrentView('onboarding');
        setOnboardingStep(2);
      } else if (hash === '#onboarding-4') {
        setCurrentView('onboarding');
        setOnboardingStep(3);
      } else if (hash === '#level') {
        setCurrentView('level');
      } else if (hash === '#schedule') {
        setCurrentView('schedule');
      } else if (hash === '#goal') {
        setCurrentView('goal');
      } else if (hash === '#save-progress') {
        setCurrentView('save-progress');
      } else if (hash === '#register') {
        setCurrentView('register');
      } else if (hash === '#dashboard' || hash === '#app') {
        setCurrentView('dashboard');
      } else if (hash === '#journal') {
        setCurrentView('journal');
      } else if (hash === '#journal-record') {
        // Redirect legacy route to feedback-result
        const qp = window.location.hash.split('?')[1] || '';
        window.location.hash = qp ? `#feedback-result?${qp}` : '#feedback-result';
        return;
      } else if (hash === '#completion') {
        setCurrentView('completion');
      } else if (hash === '#feedback') {
        setCurrentView('feedback');
      } else if (hash === '#speaking-intro') {
        // Redirect legacy route to feedback-result
        const qp2 = window.location.hash.split('?')[1] || '';
        window.location.hash = qp2 ? `#feedback-result?${qp2}` : '#feedback-result';
        return;
      } else if (hash === '#vocab-review') {
        setCurrentView('vocab-review');
      } else if (hash === '#journal-workspace') {
        setCurrentView('journal-workspace');
      } else if (hash === '#feedback-result') {
        setCurrentView('feedback-result');
      } else if (hash === '#progress') {
        setCurrentView('progress');
      } else if (hash === '#history-detail') {
        setCurrentView('history-detail');
      } else if (hash === '#history') {
        setCurrentView('history');
      } else if (hash === '#loading') {
        setCurrentView('loading');
      } else if (hash === '#error') {
        setCurrentView('error');
      } else if (hash === '#profile') {
        setCurrentView('profile');
      } else if (hash === '#settings') {
        setCurrentView('settings');
      } else if (hash === '#reminders') {
        setCurrentView('reminders');
      } else if (hash === '#library') {
        setCurrentView('library');
      } else if (hash === '#login') {
        setCurrentView('login');
      } else if (hash === '#lesson-detail') {
        setCurrentView('lesson-detail');
      } else if (hash === '#edit-profile') {
        setCurrentView('edit-profile');
      } else if (hash === '#saved-phrases') {
        setCurrentView('saved-phrases');
      } else if (hash === '#vocab-notebook') {
        setCurrentView('vocab-notebook');
      } else if (hash === '#forgot-password') {
        setCurrentView('forgot-password');
      } else if (hash === '#achievements') {
        setCurrentView('achievements');
      } else if (hash === '#notifications') {
        setCurrentView('notifications');
      } else if (hash === '#terms') {
        setCurrentView('terms');
      } else if (hash === '#privacy') {
        setCurrentView('privacy');
      } else if (hash === '#help') {
        setCurrentView('help');
      } else if (hash === '#about') {
        setCurrentView('about');
      } else if (hash === '#reading-mode') {
        setCurrentView('reading-mode');
      } else if (hash === '#grammar-practice') {
        setCurrentView('grammar-practice');
      } else if (hash === '#listening-practice') {
        setCurrentView('listening-practice');
      } else if (hash === '#speaking-report') {
        setCurrentView('speaking-report');
      } else if (hash === '#daily-challenge') {
        setCurrentView('daily-challenge');
      } else if (hash === '#leaderboard') {
        setCurrentView('leaderboard');
      } else if (hash === '#journal-archive') {
        setCurrentView('journal-archive');
      } else if (hash === '#speaking-practice') {
        setCurrentView('speaking-practice');
      } else {
        setCurrentView('landing');
      }
      window.scrollTo(0, 0); // Reset scroll on view change
    };
    
    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    handleHashChange();
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const handleLoad = () => {
      const extraDelay = 2000;
      setTimeout(() => setIsInitializing(false), extraDelay);
    };
    
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  // Bootstrap guest session silently — ensures protected API routes work
  // even before user goes through onboarding.
  // Only redirect to dashboard if a REAL (non-guest) user is stored.
  useEffect(() => {
    if (isRealUserLoggedIn()) {
      const hash = window.location.hash.split('?')[0];
      if (!hash || hash === '#' || hash === '#landing') {
        window.location.hash = '#dashboard';
      }
    }
    ensureSession().catch(() => {
      // Non-blocking: app still renders if session bootstrap fails
    });
  }, []);

  // Apply theme from user settings
  useEffect(() => {
    const applyTheme = (theme: string) => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const useDark = theme === 'dark' || (theme === 'system' && prefersDark);
      document.documentElement.classList.toggle('dark', useDark);
    };
    if (isRealUserLoggedIn()) {
      getSettings()
        .then(res => applyTheme(res.settings.theme || 'system'))
        .catch(() => {});
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      const stored = document.documentElement.dataset.themeMode || 'system';
      if (stored === 'system') {
        document.documentElement.classList.toggle('dark', mq.matches);
      }
    };
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'onboarding':
        return <OnboardingFlow stepIndex={onboardingStep} />;
      case 'level':
        return <LevelSelectionPage />;
      case 'schedule':
        return <PracticeSchedulePage />;
      case 'goal':
        return <GoalSelectionPage />;
      case 'save-progress':
        return <SaveProgressPage />;
      case 'register':
        return <RegisterPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'journal':
        return <JournalPage />;
      case 'journal-record':
      case 'completion':
        return <CompletionPage />;
      case 'feedback':
        return <FeedbackPage />;
      case 'vocab-review':
        return <VocabularyReviewPage />;
      case 'speaking-intro':
      case 'feedback-result':
        return <FeedbackResultPage />;
      case 'progress':
        return <ProgressPage />;
      case 'history-detail':
        return <HistoryDetailPage />;
      case 'journal-workspace':
        return <JournalWorkspacePage />;
      case 'loading':
        return <SkeletonLoadingPage />;
      case 'error':
        return <ErrorPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      case 'reminders':
        return <RemindersPage />;
      case 'library':
        return <LibraryPage />;
      case 'login':
        return <LoginPage />;
      case 'history':
        return <HistoryListPage />;
      case 'lesson-detail':
        return <LessonDetailPage />;
      case 'edit-profile':
        return <EditProfilePage />;
      case 'saved-phrases':
        return <SavedPhrasesPage />;
      case 'vocab-notebook':
        return <VocabNotebookPage />;
      case 'forgot-password':
        return <ForgotPasswordPage />;
      case 'achievements':
        return <AchievementsPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'terms':
        return <StaticPage type="terms" />;
      case 'privacy':
        return <StaticPage type="privacy" />;
      case 'help':
        return <StaticPage type="help" />;
      case 'about':
        return <StaticPage type="about" />;
      case 'reading-mode':
        return <ReadingModePage />;
      case 'grammar-practice':
        return <GrammarPracticePage />;
      case 'listening-practice':
        return <ListeningPracticePage />;
      case 'speaking-report':
        return <SpeakingReportPage />;
      case 'daily-challenge':
        return <DailyChallengePage />;
      case 'leaderboard':
        return <LeaderboardPage />;
      case 'journal-archive':
        return <JournalArchivePage />;
      case 'speaking-practice':
        return <SpeakingPracticePage />;
      case 'admin':
        return <AdminApp route={adminRoute} />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <>
      <LoadingScreen isLoading={isInitializing} minDelay={2000} />
      {renderCurrentView()}
    </>
  );
}

export default App;
