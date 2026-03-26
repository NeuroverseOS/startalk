/**
 * StarTalk Governance Logic — extracted for testability.
 *
 * Gate transitions and word limits are the core product integrity rules.
 * These must be deterministic and testable without external dependencies.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const WORDS_GLANCE = 15;
export const WORDS_EXPAND = 30;
export const WORDS_FOLLOWUP = 35;
export const WORDS_DEPTH = 50;

export const FOLLOW_UP_WINDOW_MS = 30_000;

// ─── Gate Logic ───────────────────────────────────────────────────────────────

export type GovernanceGate = 'ACTIVE' | 'DEGRADED' | 'SUSPENDED' | 'REVOKED';

export interface GovernanceState {
  sessionTrust: number;
  gate: GovernanceGate;
}

/**
 * Determine the governance gate from a trust score.
 * Trust starts at 100 per session and degrades based on usage patterns.
 *
 * ACTIVE (>=70):     Full responses (50 words)
 * DEGRADED (30-69):  Reduced responses (30 words)
 * SUSPENDED (11-30): Glance only (15 words)
 * REVOKED (<=10):    No responses (0 words)
 */
export function trustToGate(trust: number): GovernanceGate {
  if (trust <= 10) return 'REVOKED';
  if (trust <= 30) return 'SUSPENDED';
  if (trust < 70) return 'DEGRADED';
  return 'ACTIVE';
}

/**
 * Get word limit adjustments for a governance gate.
 * This is invisible to the user — responses just get shorter/longer.
 */
export function gateAdjustments(gate: GovernanceGate): { maxWords: number } {
  switch (gate) {
    case 'ACTIVE': return { maxWords: WORDS_DEPTH };
    case 'DEGRADED': return { maxWords: Math.round(WORDS_DEPTH * 0.6) };
    case 'SUSPENDED': return { maxWords: WORDS_GLANCE };
    case 'REVOKED': return { maxWords: 0 };
  }
}

// ─── Metrics-based Trust Evaluation ───────────────────────────────────────────

export interface SessionMetrics {
  activations: number;
  aiCalls: number;
  aiFailures: number;
  dismissals: number;
  ambientSends: number;
}

/**
 * Simple trust degradation based on session metrics.
 * This runs when governance world simulation is unavailable.
 *
 * Rule: after 5+ dismissals, trust *= 0.85 per evaluation.
 * This provides a fallback when the full simulateWorld() engine isn't loaded.
 */
export function evaluateTrustFromMetrics(
  currentTrust: number,
  metrics: SessionMetrics,
): number {
  let trust = currentTrust;
  if (metrics.dismissals >= 5) {
    trust *= 0.85;
  }
  return Math.max(0, Math.min(100, trust));
}

// ─── Core Invariant ──────────────────────────────────────────────────────────
//
// StarTalk MUST always interpret meaning through symbolic systems (astrology).
// StarTalk MUST NEVER output tactical advice (do X, buy Y, go to Z).
//
// This is the product boundary. StarTalk is a translator, not a coach.
// Every response should read the moment through the user's chart — not tell
// them what to do in concrete, non-symbolic terms.

/**
 * Tactical advice patterns — phrases that indicate the response has crossed
 * from symbolic interpretation into concrete life coaching / directives.
 *
 * These are NOT astrological. They're actionable instructions that belong
 * in a productivity app, not a cosmic translator.
 */
const TACTICAL_PATTERNS: RegExp[] = [
  /\byou should (?:go|buy|sell|call|email|text|apply|invest|quit|hire|fire|move to|sign up)\b/i,
  /\bI (?:recommend|suggest|advise) (?:you )?(go|buy|sell|call|email|text|apply|invest|quit)\b/i,
  /\bstep \d+[:.]/i,
  /\bhere(?:'s| is) (?:a |your |the )?(?:plan|strategy|checklist|action item|to-do|roadmap)\b/i,
  /\baction items?:/i,
  /\bmy (?:recommendation|advice) is to\b/i,
];

/**
 * Symbolic framing patterns — phrases that indicate the response IS
 * interpreting through an astrological / symbolic lens.
 */
const SYMBOLIC_PATTERNS: RegExp[] = [
  /\b(?:aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)\b/i,
  /\b(?:fire|earth|air|water)\s+sign\b/i,
  /\b(?:cardinal|fixed|mutable)\b/i,
  /\b(?:sun|moon|rising|mercury|venus|mars|jupiter|saturn)\b/i,
  /\b(?:energy|instinct|shadow|trait|nature|chart|cosmic|star)\b/i,
];

export interface InvariantResult {
  valid: boolean;
  hasTactical: boolean;
  hasSymbolic: boolean;
  tacticalMatches: string[];
}

/**
 * Validate the core StarTalk invariant:
 *   - Must interpret through symbolic systems (astrology)
 *   - Must never output tactical advice
 *
 * Returns { valid: true } if the response is symbolic and not tactical.
 * Returns { valid: false } with details if either invariant is violated.
 */
export function validateCoreInvariant(text: string): InvariantResult {
  const tacticalMatches: string[] = [];
  for (const pattern of TACTICAL_PATTERNS) {
    const match = text.match(pattern);
    if (match) tacticalMatches.push(match[0]);
  }

  const hasSymbolic = SYMBOLIC_PATTERNS.some(p => p.test(text));
  const hasTactical = tacticalMatches.length > 0;

  return {
    valid: hasSymbolic && !hasTactical,
    hasTactical,
    hasSymbolic,
    tacticalMatches,
  };
}

// ─── Mode Tag Parsing ─────────────────────────────────────────────────────────

/**
 * Strip [MODE:xxx] tag from AI response and return the mode + clean text.
 * The mode tag is for internal tracking — the user never sees it.
 */
export function stripModeTag(text: string): { mode: string | null; displayText: string } {
  const match = text.match(/^\[MODE:(\w+)\]\n?/);
  if (match) {
    return {
      mode: match[1],
      displayText: text.replace(/^\[MODE:\w+\]\n?/, ''),
    };
  }
  return { mode: null, displayText: text };
}
