'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/// Simplified AuthGate for cricket-hub — single branding, no variant logic.
/// Wraps content that requires authentication.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, isCloud, authMode, authError, syncing, login, signup, resetPassword, setAuthMode, clearError, init } =
    useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => { init(); }, [init]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--orange)] border-t-transparent" />
      </div>
    );
  }

  if (!isCloud) return <>{children}</>;
  if (user) return <>{children}</>;

  // Message screens
  if (authMode === 'check-email' || authMode === 'reset-sent' || authMode === 'pending-approval') {
    const config = {
      'check-email': { icon: '✉️', title: 'Confirm Your Email', message: 'We sent a confirmation link. Click it, then come back and log in.' },
      'reset-sent': { icon: '🔑', title: 'Check Your Email', message: 'We sent a password reset link to your email.' },
      'pending-approval': { icon: '⏳', title: 'Pending Approval', message: 'Your request has been sent to the team admin. You\'ll be able to log in once approved.' },
    }[authMode];
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="animate-slide-in w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-xl">
          <div className="mb-4 text-4xl">{config.icon}</div>
          <h2 className="mb-2 text-xl font-bold text-[var(--text)]">{config.title}</h2>
          <p className="mb-6 text-[15px] text-[var(--muted)]">{config.message}</p>
          <button
            onClick={() => setAuthMode('login')}
            className="w-full cursor-pointer rounded-xl bg-[var(--surface)] px-4 py-2.5 text-[15px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--border)]"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Forgot password screen
  if (authMode === 'forgot') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="animate-slide-in w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-xl">
          <div className="mb-6 text-center">
            <h2 className="mb-1 text-[22px] font-bold text-[var(--text)]">Reset Password</h2>
            <p className="text-[14px] text-[var(--muted)]">Enter your email and we&apos;ll send a reset link</p>
          </div>

          {authError && (
            <div className="mb-4 rounded-xl border border-[var(--red)]/30 bg-[var(--red)]/10 px-3 py-2.5 text-[14px] text-[var(--red)]">
              {authError}
            </div>
          )}

          <div className="mb-5">
            <label className="mb-1 block text-[13px] font-medium text-[var(--muted)]">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--dim)] focus:border-[var(--orange)] focus:ring-[var(--orange)]/30 transition-all"
              placeholder="you@example.com" autoComplete="email"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); resetPassword(email); } }}
            />
          </div>

          <button
            onClick={() => resetPassword(email)}
            disabled={syncing}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--orange)] to-[var(--red)] px-4 py-3 text-[16px] font-semibold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncing && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Send Reset Link
          </button>

          <p className="mt-4 text-center text-[13px] text-[var(--muted)]">
            Remember your password?{' '}
            <button onClick={() => { setAuthMode('login'); clearError(); setEmail(''); }} className="cursor-pointer font-medium text-[var(--orange)] hover:underline">
              Log in
            </button>
          </p>
        </div>
      </div>
    );
  }

  const isLogin = authMode === 'login';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (isLogin) {
      await login(email, password);
    } else {
      await signup(email, password, name);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-52px)] overflow-hidden">
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, var(--orange), transparent 70%)', animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full opacity-15 blur-[100px]"
          style={{ background: 'radial-gradient(circle, var(--red), transparent 70%)', animation: 'float 10s ease-in-out infinite reverse' }} />
      </div>

      <div className="relative flex items-center justify-center min-h-[calc(100vh-52px)] px-4 py-6 lg:py-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 lg:p-10 shadow-2xl"
            style={{ boxShadow: '0 20px 80px rgba(251, 191, 36, 0.15)' }}>

            <form onSubmit={handleSubmit}>
              <div className="mb-6 text-center">
                <div className="mb-3 text-4xl">🏏</div>
                <h2 className="mb-1 text-[22px] font-bold text-[var(--text)]">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-[14px] text-[var(--muted)]">
                  {isLogin ? 'Log in to your cricket team' : 'Sign up to get started'}
                </p>
              </div>

              {authError && (
                <div className="mb-4 rounded-xl border border-[var(--red)]/30 bg-[var(--red)]/10 px-3 py-2.5 text-[14px] text-[var(--red)]">
                  {authError}
                </div>
              )}

              {!isLogin && (
                <div className="mb-3">
                  <label className="mb-1 block text-[13px] font-medium text-[var(--muted)]">Name</label>
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--dim)] focus:border-[var(--orange)] transition-all"
                    placeholder="Your name" autoComplete="name"
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="mb-1 block text-[13px] font-medium text-[var(--muted)]">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--dim)] focus:border-[var(--orange)] transition-all"
                  placeholder="you@example.com" autoComplete="email"
                />
              </div>

              <div className="mb-5">
                <label className="mb-1 block text-[13px] font-medium text-[var(--muted)]">Password</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--dim)] focus:border-[var(--orange)] transition-all"
                  placeholder="••••••••" autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>

              <button
                type="submit" disabled={syncing}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--orange)] to-[var(--red)] px-4 py-3 text-[16px] font-semibold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {syncing && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {isLogin ? 'Log In' : 'Sign Up'}
              </button>

              {isLogin && (
                <p className="mt-3 text-center">
                  <button type="button" onClick={() => { setAuthMode('forgot'); clearError(); setPassword(''); }}
                    className="cursor-pointer text-[13px] text-[var(--muted)] hover:text-[var(--orange)] transition-colors">
                    Forgot password?
                  </button>
                </p>
              )}

              <p className="mt-3 text-center text-[13px] text-[var(--muted)]">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button type="button" onClick={() => { setAuthMode(isLogin ? 'signup' : 'login'); clearError(); setEmail(''); setPassword(''); setName(''); }}
                  className="cursor-pointer font-medium text-[var(--orange)] hover:underline">
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
