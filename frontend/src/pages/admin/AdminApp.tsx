import React from 'react';
import { getAdminToken } from '../../services/api/admin.api';
import { AdminLoginPage } from './AdminLogin';
import { AdminDashboardPage } from './AdminDashboard';
import { AdminPromptListPage } from './AdminPromptList';
import { AdminPromptEditPage } from './AdminPromptEdit';
import { AdminUsersPage } from './AdminUsers';
import { AdminUserDetailPage } from './AdminUserDetail';
import { AdminAILogsPage } from './AdminAILogs';
import { AdminSettingsPage } from './AdminSettings';

/**
 * Hash-based router for all #admin/* routes.
 * Handles auth guard: redirects to login if no token.
 */
export const AdminApp: React.FC<{ route: string }> = ({ route }) => {
  const isAuthenticated = !!getAdminToken();

  // Always allow login page
  if (route === 'login') {
    return <AdminLoginPage />;
  }

  // Auth guard
  if (!isAuthenticated) {
    // Redirect to login
    window.location.hash = '#admin/login';
    return <AdminLoginPage />;
  }

  switch (route) {
    case 'dashboard':
      return <AdminDashboardPage />;
    case 'prompts':
      return <AdminPromptListPage />;
    case 'prompt-edit':
      return <AdminPromptEditPage />;
    case 'users':
      return <AdminUsersPage />;
    case 'user-detail':
      return <AdminUserDetailPage />;
    case 'ai-logs':
      return <AdminAILogsPage />;
    case 'settings':
      return <AdminSettingsPage />;
    default:
      return <AdminDashboardPage />;
  }
};
