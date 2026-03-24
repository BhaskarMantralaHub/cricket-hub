import { TeamLayoutClient } from './layout-client';

/// Placeholder slug for static export. Cloudflare Pages SPA fallback
/// (`/* /index.html 200`) serves the app for all /t/* routes.
/// The actual slug is read client-side via useParams().
export function generateStaticParams() {
  return [{ slug: '_' }];
}

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <TeamLayoutClient>{children}</TeamLayoutClient>;
}
