'use client';

import { AuthGate } from '@/components/AuthGate';
import { TeamProvider } from '@/components/TeamContext';
import { useParams } from 'next/navigation';

export function TeamLayoutClient({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <AuthGate>
      <TeamProvider slug={slug}>
        {children}
      </TeamProvider>
    </AuthGate>
  );
}
