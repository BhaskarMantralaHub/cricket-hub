export type NavItem = {
  name: string;
  href: string;
  icon: string;
  description: string;
  roles?: string[];
};

/// Navigation items for cricket-hub.
/// Team-scoped items use a placeholder {slug} replaced at render time.
export const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/t/{slug}',
    icon: '🏏',
    description: 'Team dashboard — expenses, players, moments.',
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: '⚙️',
    description: 'Manage teams and platform settings.',
    roles: ['super_admin'],
  },
];
