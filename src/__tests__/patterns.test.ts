import { describe, it, expect } from 'vitest';

/**
 * Tests for the regex patterns used in server.ts for speech recognition.
 * These patterns gate all user interactions — correctness is critical.
 */

const STAR_TRIGGER_PATTERN = /\b(?:star\s*(?:talk)?|what\s+do\s+the\s+stars\s+say)\b/i;
const HELP_PATTERN = /^(?:help|show\s+me\s+commands|how\s+does\s+this\s+work)\b/i;
const RESET_PATTERN = /\b(?:new\s+(?:conversation|chat|call)|reset|start\s+over|clear)\b/i;
const OTHER_SIGN_PATTERN = /\b(?:talking\s+to\s+(?:a\s+)?|they(?:'re|\s+are)\s+(?:a\s+)?)(\w+)\b/i;
const PERSON_SIGN_PATTERN = /(\w+)\s+is\s+(?:a\s+)?(\w+)(?:\s+with\s+(\w+)\s+rising)?/i;
const TALKING_TO_PERSON_PATTERN = /\b(?:talking\s+to|with|meeting)\s+(\w+)\b/i;

describe('STAR_TRIGGER_PATTERN', () => {
  it('matches "star"', () => {
    expect(STAR_TRIGGER_PATTERN.test('star')).toBe(true);
  });

  it('matches "star talk"', () => {
    expect(STAR_TRIGGER_PATTERN.test('star talk')).toBe(true);
  });

  it('matches "what do the stars say"', () => {
    expect(STAR_TRIGGER_PATTERN.test('what do the stars say')).toBe(true);
  });

  it('matches case-insensitive', () => {
    expect(STAR_TRIGGER_PATTERN.test('Star')).toBe(true);
    expect(STAR_TRIGGER_PATTERN.test('STAR TALK')).toBe(true);
  });

  it('matches star within a sentence', () => {
    expect(STAR_TRIGGER_PATTERN.test('hey star what\'s up')).toBe(true);
  });

  it('does not match "starting"', () => {
    expect(STAR_TRIGGER_PATTERN.test('starting the meeting')).toBe(false);
  });
});

describe('HELP_PATTERN', () => {
  it('matches "help"', () => {
    expect(HELP_PATTERN.test('help')).toBe(true);
  });

  it('matches "show me commands"', () => {
    expect(HELP_PATTERN.test('show me commands')).toBe(true);
  });

  it('matches "how does this work"', () => {
    expect(HELP_PATTERN.test('how does this work')).toBe(true);
  });

  it('only matches at start of string', () => {
    expect(HELP_PATTERN.test('I need help')).toBe(false);
  });
});

describe('RESET_PATTERN', () => {
  it('matches "new conversation"', () => {
    expect(RESET_PATTERN.test('new conversation')).toBe(true);
  });

  it('matches "reset"', () => {
    expect(RESET_PATTERN.test('reset')).toBe(true);
  });

  it('matches "start over"', () => {
    expect(RESET_PATTERN.test('start over')).toBe(true);
  });

  it('matches "clear"', () => {
    expect(RESET_PATTERN.test('clear')).toBe(true);
  });

  it('matches within a sentence', () => {
    expect(RESET_PATTERN.test('I want to start over please')).toBe(true);
  });
});

describe('PERSON_SIGN_PATTERN', () => {
  it('matches "Sophie is a Cancer"', () => {
    const match = 'Sophie is a Cancer'.match(PERSON_SIGN_PATTERN);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('Sophie');
    expect(match![2]).toBe('Cancer');
  });

  it('matches "Sophie is Cancer" (without article)', () => {
    const match = 'Sophie is Cancer'.match(PERSON_SIGN_PATTERN);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('Sophie');
    expect(match![2]).toBe('Cancer');
  });

  it('matches "Sophie is a Cancer with Aries rising"', () => {
    const match = 'Sophie is a Cancer with Aries rising'.match(PERSON_SIGN_PATTERN);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('Sophie');
    expect(match![2]).toBe('Cancer');
    expect(match![3]).toBe('Aries');
  });

  it('captures undefined rising when not provided', () => {
    const match = 'Alex is a Leo'.match(PERSON_SIGN_PATTERN);
    expect(match![3]).toBeUndefined();
  });
});

describe('OTHER_SIGN_PATTERN', () => {
  it('matches "talking to a Taurus"', () => {
    const match = 'talking to a Taurus'.match(OTHER_SIGN_PATTERN);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('Taurus');
  });

  it('matches "talking to Taurus" (no article)', () => {
    const match = 'talking to Taurus'.match(OTHER_SIGN_PATTERN);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('Taurus');
  });

  it('matches "they\'re a Leo"', () => {
    const match = "they're a Leo".match(OTHER_SIGN_PATTERN);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('Leo');
  });

  it('matches "they are a Gemini"', () => {
    const match = 'they are a Gemini'.match(OTHER_SIGN_PATTERN);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('Gemini');
  });
});

describe('TALKING_TO_PERSON_PATTERN', () => {
  it('matches "talking to Sophie"', () => {
    const match = 'talking to Sophie'.match(TALKING_TO_PERSON_PATTERN);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('Sophie');
  });

  it('matches "meeting Alex"', () => {
    const match = 'meeting Alex'.match(TALKING_TO_PERSON_PATTERN);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('Alex');
  });

  it('matches "with Jordan"', () => {
    const match = 'with Jordan'.match(TALKING_TO_PERSON_PATTERN);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('Jordan');
  });
});
