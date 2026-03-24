import { describe, it, expect } from 'vitest';
import { navItems, type NavItem } from '@/lib/nav';

describe('lib/nav', () => {
  it('exports a non-empty navItems array', () => {
    expect(Array.isArray(navItems)).toBe(true);
    expect(navItems.length).toBeGreaterThan(0);
  });

  it('each item has required fields: name, href, icon, description', () => {
    for (const item of navItems) {
      expect(item.name).toBeTruthy();
      expect(item.href).toBeTruthy();
      expect(item.href.startsWith('/')).toBe(true);
      expect(item.icon).toBeTruthy();
      expect(item.description).toBeTruthy();
    }
  });

  it('contains Dashboard nav item', () => {
    const dashboard = navItems.find((t) => t.name === 'Dashboard');
    expect(dashboard).toBeDefined();
    expect(dashboard!.href).toContain('/t/');
  });

  it('contains Admin nav item with super_admin role', () => {
    const admin = navItems.find((t) => t.name === 'Admin');
    expect(admin).toBeDefined();
    expect(admin!.href).toBe('/admin');
    expect(admin!.roles).toContain('super_admin');
  });

  it('all nav item hrefs are unique', () => {
    const hrefs = navItems.map((t) => t.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('all nav item names are unique', () => {
    const names = navItems.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
