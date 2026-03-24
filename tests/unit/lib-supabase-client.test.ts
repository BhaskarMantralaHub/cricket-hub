import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('lib/supabase/client', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('getSupabaseClient returns null when URL is missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'some-key';
    const { getSupabaseClient } = await import('@/lib/supabase/client');
    expect(getSupabaseClient()).toBeNull();
  });

  it('getSupabaseClient returns null when KEY is missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    const { getSupabaseClient } = await import('@/lib/supabase/client');
    expect(getSupabaseClient()).toBeNull();
  });

  it('getSupabaseClient returns null when URL is placeholder YOUR_SUPABASE_URL', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'YOUR_SUPABASE_URL';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'some-key';
    const { getSupabaseClient } = await import('@/lib/supabase/client');
    expect(getSupabaseClient()).toBeNull();
  });

  it('getSupabaseClient returns null when both URL and KEY are missing', async () => {
    const { getSupabaseClient } = await import('@/lib/supabase/client');
    expect(getSupabaseClient()).toBeNull();
  });

  it('isCloudMode returns false when client is null (no URL)', async () => {
    const { isCloudMode } = await import('@/lib/supabase/client');
    expect(isCloudMode()).toBe(false);
  });

  it('isCloudMode returns false when client is null (no KEY)', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    const { isCloudMode } = await import('@/lib/supabase/client');
    expect(isCloudMode()).toBe(false);
  });

  it('isCloudMode returns false when URL is placeholder', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'YOUR_SUPABASE_URL';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'some-key';
    const { isCloudMode } = await import('@/lib/supabase/client');
    expect(isCloudMode()).toBe(false);
  });

  it('getSupabaseClient returns null when URL is empty string', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'some-key';
    const { getSupabaseClient } = await import('@/lib/supabase/client');
    expect(getSupabaseClient()).toBeNull();
  });

  it('getSupabaseClient returns null when KEY is empty string', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
    const { getSupabaseClient } = await import('@/lib/supabase/client');
    expect(getSupabaseClient()).toBeNull();
  });
});
