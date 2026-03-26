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
