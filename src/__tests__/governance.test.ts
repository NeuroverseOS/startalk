import { describe, it, expect } from 'vitest';
import {
  trustToGate,
  gateAdjustments,
  evaluateTrustFromMetrics,
  stripModeTag,
  WORDS_DEPTH,
  WORDS_GLANCE,
} from '../governance.js';

// ─── Gate Transitions ─────────────────────────────────────────────────────────

describe('trustToGate', () => {
  it('returns ACTIVE at trust 100', () => {
    expect(trustToGate(100)).toBe('ACTIVE');
  });

  it('returns ACTIVE at trust 70 (boundary)', () => {
    expect(trustToGate(70)).toBe('ACTIVE');
  });

  it('returns DEGRADED at trust 69', () => {
    expect(trustToGate(69)).toBe('DEGRADED');
  });

  it('returns DEGRADED at trust 31', () => {
    expect(trustToGate(31)).toBe('DEGRADED');
  });

  it('returns SUSPENDED at trust 30 (boundary)', () => {
    expect(trustToGate(30)).toBe('SUSPENDED');
  });

  it('returns SUSPENDED at trust 11', () => {
    expect(trustToGate(11)).toBe('SUSPENDED');
  });

  it('returns REVOKED at trust 10 (boundary)', () => {
    expect(trustToGate(10)).toBe('REVOKED');
  });

  it('returns REVOKED at trust 0', () => {
    expect(trustToGate(0)).toBe('REVOKED');
  });

  it('returns REVOKED for negative trust', () => {
    expect(trustToGate(-5)).toBe('REVOKED');
  });
});

// ─── Word Limit Adjustments ──────────────────────────────────────────────────

describe('gateAdjustments', () => {
  it('ACTIVE gate returns full depth words (50)', () => {
    expect(gateAdjustments('ACTIVE').maxWords).toBe(WORDS_DEPTH);
    expect(gateAdjustments('ACTIVE').maxWords).toBe(50);
  });

  it('DEGRADED gate returns 60% of depth (30)', () => {
    expect(gateAdjustments('DEGRADED').maxWords).toBe(Math.round(WORDS_DEPTH * 0.6));
    expect(gateAdjustments('DEGRADED').maxWords).toBe(30);
  });

  it('SUSPENDED gate returns glance words (15)', () => {
    expect(gateAdjustments('SUSPENDED').maxWords).toBe(WORDS_GLANCE);
    expect(gateAdjustments('SUSPENDED').maxWords).toBe(15);
  });

  it('REVOKED gate returns 0 (no responses)', () => {
    expect(gateAdjustments('REVOKED').maxWords).toBe(0);
  });
});

// ─── Trust Degradation from Metrics ──────────────────────────────────────────

describe('evaluateTrustFromMetrics', () => {
  const baseMetrics = {
    activations: 0,
    aiCalls: 0,
    aiFailures: 0,
    dismissals: 0,
    ambientSends: 0,
  };

  it('trust unchanged with fewer than 5 dismissals', () => {
    expect(evaluateTrustFromMetrics(100, { ...baseMetrics, dismissals: 4 })).toBe(100);
  });

  it('trust degrades by 0.85 at exactly 5 dismissals', () => {
    expect(evaluateTrustFromMetrics(100, { ...baseMetrics, dismissals: 5 })).toBe(85);
  });

  it('trust degrades by 0.85 at 10 dismissals', () => {
    expect(evaluateTrustFromMetrics(100, { ...baseMetrics, dismissals: 10 })).toBe(85);
  });

  it('repeated evaluations compound degradation', () => {
    let trust = 100;
    const metrics = { ...baseMetrics, dismissals: 5 };
    trust = evaluateTrustFromMetrics(trust, metrics);
    expect(trust).toBe(85);
    trust = evaluateTrustFromMetrics(trust, metrics);
    expect(trust).toBeCloseTo(72.25);
    trust = evaluateTrustFromMetrics(trust, metrics);
    expect(trust).toBeCloseTo(61.41, 1);
  });

  it('trust never goes below 0', () => {
    expect(evaluateTrustFromMetrics(1, { ...baseMetrics, dismissals: 100 })).toBeGreaterThanOrEqual(0);
  });

  it('trust never exceeds 100', () => {
    expect(evaluateTrustFromMetrics(100, baseMetrics)).toBeLessThanOrEqual(100);
  });

  it('full degradation chain: ACTIVE → DEGRADED → SUSPENDED → REVOKED', () => {
    let trust = 100;
    const metrics = { ...baseMetrics, dismissals: 5 };

    // Each evaluation applies trust *= 0.85
    expect(trustToGate(trust)).toBe('ACTIVE');        // 100

    trust = evaluateTrustFromMetrics(trust, metrics);  // 85
    expect(trustToGate(trust)).toBe('ACTIVE');

    trust = evaluateTrustFromMetrics(trust, metrics);  // 72.25
    expect(trustToGate(trust)).toBe('ACTIVE');

    trust = evaluateTrustFromMetrics(trust, metrics);  // 61.41
    expect(trustToGate(trust)).toBe('DEGRADED');

    // Keep degrading
    for (let i = 0; i < 5; i++) {
      trust = evaluateTrustFromMetrics(trust, metrics);
    }
    expect(trustToGate(trust)).toBe('SUSPENDED');

    // Keep going to REVOKED
    for (let i = 0; i < 10; i++) {
      trust = evaluateTrustFromMetrics(trust, metrics);
    }
    expect(trustToGate(trust)).toBe('REVOKED');
  });
});

// ─── Mode Tag Stripping ──────────────────────────────────────────────────────

describe('stripModeTag', () => {
  it('strips [MODE:translate] and returns mode', () => {
    const result = stripModeTag('[MODE:translate]\nYour Cancer instinct is right here.');
    expect(result.mode).toBe('translate');
    expect(result.displayText).toBe('Your Cancer instinct is right here.');
  });

  it('strips [MODE:direct] without trailing newline', () => {
    const result = stripModeTag('[MODE:direct]Say it now.');
    expect(result.mode).toBe('direct');
    expect(result.displayText).toBe('Say it now.');
  });

  it('returns null mode when no tag present', () => {
    const result = stripModeTag('Just a normal response.');
    expect(result.mode).toBeNull();
    expect(result.displayText).toBe('Just a normal response.');
  });

  it('only strips tag at the start of the text', () => {
    const text = 'Some text [MODE:reflect] more text';
    const result = stripModeTag(text);
    expect(result.mode).toBeNull();
    expect(result.displayText).toBe(text);
  });

  it('handles all five modes', () => {
    for (const mode of ['translate', 'reflect', 'challenge', 'teach', 'direct']) {
      const result = stripModeTag(`[MODE:${mode}]\nTest.`);
      expect(result.mode).toBe(mode);
    }
  });
});
