import React, { useState } from 'react';
import { adminLogin } from '../../services/api/admin.api';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      await adminLogin(email.trim(), password.trim());
      window.location.hash = '#admin/dashboard';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic font-headline tracking-tighter">STICK</h1>
          <p className="text-xs font-headline tracking-widest text-outline uppercase mt-1">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="border-2 border-black rounded-2xl p-6 bg-surface-container-lowest">
          <h2 className="text-lg font-bold font-headline mb-6">Sign in</h2>

          {error && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-headline font-bold mb-1.5 text-on-surface-variant">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors"
              placeholder="admin@stick.app"
              autoComplete="email"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-headline font-bold mb-1.5 text-on-surface-variant">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-on-primary-container font-headline font-bold text-sm rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-[10px] text-outline mt-6">
          <a href="#" className="hover:text-on-surface-variant transition-colors">← Back to app</a>
        </p>
      </div>
    </div>
  );
};
