import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getWelcomeMessage,
  getWelcomeCaption,
} from '@/app/t/[slug]/lib/welcome-messages';

describe('getWelcomeMessage', () => {
  it('returns a string containing the player name', () => {
    const msg = getWelcomeMessage('Rohit', 'Test CC');
    expect(msg).toContain('Rohit');
  });

  it('never returns an empty string', () => {
    for (let i = 0; i < 20; i++) {
      const msg = getWelcomeMessage('TestPlayer', 'Test CC');
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it('returns a non-empty string for an empty player name', () => {
    const msg = getWelcomeMessage('', 'Test CC');
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('can return different messages across multiple calls', () => {
    const results = new Set<string>();
    for (let i = 0; i < 50; i++) {
      results.add(getWelcomeMessage('Virat', 'Test CC'));
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it('returns a specific message when Math.random is mocked', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const msg = getWelcomeMessage('Sachin', 'Test CC');
    expect(msg).toBe(
      "Welcome to the squad, Sachin! Let's make this season one for the books"
    );
    vi.restoreAllMocks();
  });

  it('returns the last template when Math.random approaches 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    const msg = getWelcomeMessage('Dhoni', 'Test CC');
    expect(msg).toContain('Dhoni');
    expect(msg).toContain("Let's go");
    vi.restoreAllMocks();
  });
});

describe('getWelcomeCaption', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('contains @playerName mention', () => {
    const caption = getWelcomeCaption('Kohli', 'Test CC');
    expect(caption).toContain('@Kohli');
  });

  it('contains @Everyone mention', () => {
    const caption = getWelcomeCaption('Kohli', 'Test CC');
    expect(caption).toContain('@Everyone');
  });

  it('contains the welcome message text', () => {
    const caption = getWelcomeCaption('Bumrah', 'Test CC');
    expect(caption).toContain(
      "Welcome to the squad, Bumrah! Let's make this season one for the books"
    );
  });

  it('follows the format: message @name @Everyone', () => {
    const caption = getWelcomeCaption('Gill', 'Test CC');
    const welcomeMsg = getWelcomeMessage('Gill', 'Test CC');
    expect(caption).toBe(`${welcomeMsg} @Gill @Everyone`);
  });
});
