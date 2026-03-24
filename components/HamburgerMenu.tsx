'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useTeamStore } from '@/stores/team-store';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  const { myTeams } = useTeamStore();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-[var(--card)] p-6 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="bg-gradient-to-r from-[var(--orange)] to-[var(--red)] bg-clip-text text-lg font-bold text-transparent">
            Cricket Hub
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-[var(--muted)] transition-colors hover:text-[var(--text)]"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 h-px bg-[var(--border)]" />

        {/* My Teams */}
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--dim)]">My Teams</p>
        <nav className="flex flex-col gap-1 mb-4">
          {myTeams.map((team) => (
            <Link key={team.id} href={`/t/${team.slug}`} onClick={onClose}>
              <div className="flex items-start gap-3 rounded-lg px-3 py-3 cursor-pointer hover:bg-[var(--hover-bg)] transition-colors">
                <span className="mt-0.5 text-xl">🏏</span>
                <div className="flex-1">
                  <span className="text-[15px] font-medium text-[var(--text)]">{team.name}</span>
                  <p className="mt-0.5 text-[12px] text-[var(--muted)] capitalize">{team.role.replace('_', ' ')}</p>
                </div>
              </div>
            </Link>
          ))}
          {myTeams.length === 0 && (
            <p className="px-3 py-2 text-[13px] text-[var(--muted)]">No teams yet</p>
          )}
        </nav>

        <div className="mb-4 h-px bg-[var(--border)]" />

        <nav className="flex flex-col gap-1">
          <Link href="/admin" onClick={onClose}>
            <div className="flex items-start gap-3 rounded-lg px-3 py-3 cursor-pointer hover:bg-[var(--hover-bg)] transition-colors">
              <span className="mt-0.5 text-xl">⚙️</span>
              <div>
                <span className="text-[15px] font-medium text-[var(--text)]">Admin</span>
                <p className="mt-0.5 text-[13px] text-[var(--muted)]">Manage teams & users</p>
              </div>
            </div>
          </Link>
        </nav>

        {/* Bottom section — user info + logout */}
        <UserSection onClose={onClose} />
      </div>
    </>
  );
}

function UserSection({ onClose }: { onClose: () => void }) {
  const { user, isCloud, logout } = useAuthStore();

  if (!isCloud || !user) return null;

  const name = (user.user_metadata?.full_name as string) || '';
  const email = user.email || '';

  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-[var(--border)]">
      <div className="mb-3">
        {name && <div className="text-[13px] font-medium text-[var(--text)] truncate">{name}</div>}
        {email && <div className="text-[12px] text-[var(--muted)] truncate">{email}</div>}
      </div>
      <button
        onClick={() => { logout(); onClose(); }}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface)] text-[var(--red)] text-[15px] font-medium hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
      >
        Sign Out
      </button>
    </div>
  );
}
