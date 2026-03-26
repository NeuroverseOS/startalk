import { describe, it, expect } from 'vitest';
import {
  trustToGate,
  gateAdjustments,
  evaluateTrustFromMetrics,
  stripModeTag,
  validateCoreInvariant,
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

// ─── Core Invariant: Symbolic Interpretation, Never Tactical ─────────────────

describe('validateCoreInvariant', () => {
  // ── VALID: symbolic interpretation ──────────────────────────────────────

  it('valid: astrological read with sign reference', () => {
    const result = validateCoreInvariant(
      "That's classic Aries energy — they charged ahead because waiting feels like dying to a fire sign."
    );
    expect(result.valid).toBe(true);
    expect(result.hasSymbolic).toBe(true);
    expect(result.hasTactical).toBe(false);
  });

  it('valid: mode translate with compatibility', () => {
    const result = validateCoreInvariant(
      "Your Cancer instinct is to protect, but their Sagittarius nature needs room to run. Water meets fire."
    );
    expect(result.valid).toBe(true);
  });

  it('valid: challenge mode with shadow trait', () => {
    const result = validateCoreInvariant(
      "You're retreating into your Scorpio shadow right now. That silence isn't protecting you — it's a wall."
    );
    expect(result.valid).toBe(true);
  });

  it('valid: teach mode explaining dynamic', () => {
    const result = validateCoreInvariant(
      "Cardinal signs like Aries and Cancer both want to lead, but through different elements — fire charges, water flows."
    );
    expect(result.valid).toBe(true);
  });

  it('valid: reflect mode with planetary reference', () => {
    const result = validateCoreInvariant(
      "Mars energy is driving you hard today. Where is that urgency actually coming from?"
    );
    expect(result.valid).toBe(true);
  });

  // ── INVALID: tactical advice (no symbolic framing) ─────────────────────

  it('invalid: tactical advice without symbolic framing', () => {
    const result = validateCoreInvariant(
      "You should call your manager tomorrow morning and ask for a raise."
    );
    expect(result.valid).toBe(false);
    expect(result.hasTactical).toBe(true);
    expect(result.hasSymbolic).toBe(false);
  });

  it('invalid: step-by-step plan', () => {
    const result = validateCoreInvariant(
      "Step 1: Open the conversation. Step 2: State your needs clearly."
    );
    expect(result.valid).toBe(false);
    expect(result.hasTactical).toBe(true);
  });

  it('invalid: action items', () => {
    const result = validateCoreInvariant(
      "Action items: send the email, book the meeting, update your resume."
    );
    expect(result.valid).toBe(false);
    expect(result.hasTactical).toBe(true);
  });

  it('invalid: here is a plan', () => {
    const result = validateCoreInvariant(
      "Here's a plan for your conversation with your boss this afternoon."
    );
    expect(result.valid).toBe(false);
    expect(result.hasTactical).toBe(true);
  });

  it('invalid: concrete recommendation', () => {
    const result = validateCoreInvariant(
      "My recommendation is to quit and find a new job before the end of the month."
    );
    expect(result.valid).toBe(false);
    expect(result.hasTactical).toBe(true);
  });

  // ── INVALID: tactical even WITH symbolic framing ───────────────────────

  it('invalid: tactical wrapped in astrology still fails', () => {
    const result = validateCoreInvariant(
      "As a Taurus, you should buy that house. Your earth sign energy makes it the right investment."
    );
    expect(result.valid).toBe(false);
    expect(result.hasTactical).toBe(true);
    expect(result.hasSymbolic).toBe(true);
    expect(result.tacticalMatches.length).toBeGreaterThan(0);
  });

  it('invalid: step-by-step plan with astrological garnish', () => {
    const result = validateCoreInvariant(
      "Your Capricorn discipline is perfect for this. Step 1: update LinkedIn. Step 2: reach out to recruiters."
    );
    expect(result.valid).toBe(false);
    expect(result.hasTactical).toBe(true);
    expect(result.hasSymbolic).toBe(true);
  });

  // ── INVALID: no symbolic framing at all ────────────────────────────────

  it('invalid: generic response with no astrological content', () => {
    const result = validateCoreInvariant(
      "That sounds like a tough situation. Maybe just give it some time."
    );
    expect(result.valid).toBe(false);
    expect(result.hasSymbolic).toBe(false);
  });

  it('invalid: therapy-speak with no symbolic lens', () => {
    const result = validateCoreInvariant(
      "It's important to set boundaries and communicate your needs clearly."
    );
    expect(result.valid).toBe(false);
    expect(result.hasSymbolic).toBe(false);
  });

  // ── tacticalMatches reports what triggered ──────────────────────────────

  it('tacticalMatches lists the offending phrases', () => {
    const result = validateCoreInvariant(
      "You should call your boss and I suggest you apply for that role."
    );
    expect(result.tacticalMatches.map(m => m.toLowerCase())).toContain('you should call');
    expect(result.tacticalMatches.length).toBeGreaterThanOrEqual(1);
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
