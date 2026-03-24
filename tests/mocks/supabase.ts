import { vi } from 'vitest';

type Row = Record<string, unknown>;

// Chainable query builder mock
export function createQueryBuilder(data: Row[] = []) {
  const builder: Record<string, unknown> = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'ilike', 'in', 'is',
    'order', 'limit', 'single', 'maybeSingle', 'range',
  ];

  methods.forEach((m) => {
    builder[m] = vi.fn().mockReturnValue(builder);
  });

  // Terminal methods
  builder.then = vi.fn((cb: (res: { data: Row[] | Row | null; error: null }) => void) => {
    cb({ data: data.length === 1 ? data[0] : data, error: null });
    return { catch: vi.fn() };
  });

  return builder;
}

// Storage mock
export function createStorageMock() {
  return {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    }),
  };
}

// Auth mock
export function createAuthMock() {
  return {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    verifyOtp: vi.fn().mockResolvedValue({ error: null }),
    exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
  };
}

// Main mock client
export function createMockClient(tableData: Record<string, Row[]> = {}) {
  const auth = createAuthMock();
  const storage = createStorageMock();

  return {
    from: vi.fn((table: string) => createQueryBuilder(tableData[table] ?? [])),
    rpc: vi.fn().mockReturnValue({ then: vi.fn((cb: unknown) => (cb as Function)({ data: null, error: null })) }),
    auth,
    storage,
  };
}

// Setup for vi.mock('@/lib/supabase/client')
export function setupSupabaseMock(tableData: Record<string, Row[]> = {}) {
  const client = createMockClient(tableData);

  vi.mock('@/lib/supabase/client', () => ({
    getSupabaseClient: () => client,
    isCloudMode: () => true,
  }));

  return client;
}
