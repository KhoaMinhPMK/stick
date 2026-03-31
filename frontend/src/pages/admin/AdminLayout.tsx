import React, { useState } from 'react';
import { getAdminUser, adminLogout } from '../../services/api/admin.api';

interface AdminLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

const menuItems = [
  { id: 'dashboard', hash: '#admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { id: 'prompts', hash: '#admin/prompts', icon: 'edit_note', label: 'Prompts' },
  { id: 'ai-logs', hash: '#admin/ai-logs', icon: 'smart_toy', label: 'AI Logs' },
  { id: 'users', hash: '#admin/users', icon: 'group', label: 'Users' },
  { id: 'settings', hash: '#admin/settings', icon: 'settings', label: 'Settings' },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activePath = 'dashboard' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const adminUser = getAdminUser();

  return (
    <div className="min-h-screen bg-surface-container-low flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-surface border-r-2 border-black flex flex-col z-50 transition-transform md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b-2 border-black">
          <h1
            className="text-xl font-black tracking-tighter text-black italic font-headline cursor-pointer"
            onClick={() => (window.location.hash = '#admin/dashboard')}
          >
            STICK <span className="text-xs font-normal not-italic tracking-wide text-on-surface-variant">Admin</span>
          </h1>
          <p className="text-[10px] font-headline tracking-widest text-outline uppercase mt-0.5">Pilot Control</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 py-4 px-3 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activePath === item.id;
            return (
              <a
                key={item.id}
                href={item.hash}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-headline transition-colors ${
                  isActive
                    ? 'bg-primary text-on-primary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t-2 border-black">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-sm font-bold font-headline">
              {adminUser?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold font-headline truncate">{adminUser?.name || 'Admin'}</p>
              <p className="text-[10px] text-outline truncate">{adminUser?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={adminLogout}
            className="w-full flex items-center justify-center gap-2 text-xs font-headline text-error hover:bg-error-container px-3 py-2 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-sm border-b border-outline-variant h-14 flex items-center px-4 md:px-6 gap-3">
          <button
            className="md:hidden p-1"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h2 className="font-headline font-bold text-sm md:text-base capitalize">{activePath?.replace('-', ' ')}</h2>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
