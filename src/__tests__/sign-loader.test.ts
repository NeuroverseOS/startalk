import { describe, it, expect } from 'vitest';
import {
  loadSign,
  getSignInfo,
  buildStarTalkPrompt,
  ALL_SIGNS,
  SIGN_SHORT,
  type SignId,
} from '../sign-loader.js';

// ─── Sign Data ────────────────────────────────────────────────────────────────

describe('ALL_SIGNS', () => {
  it('contains exactly 12 signs', () => {
    expect(ALL_SIGNS).toHaveLength(12);
  });

  it('every sign has id, name, short, dates, and symbol', () => {
    for (const sign of ALL_SIGNS) {
      expect(sign.id).toBeTruthy();
      expect(sign.name).toBeTruthy();
      expect(sign.short).toBeTruthy();
      expect(sign.dates).toBeTruthy();
      expect(sign.symbol).toBeTruthy();
    }
  });
});

describe('SIGN_SHORT', () => {
  it('abbreviates long sign names', () => {
    expect(SIGN_SHORT['sagittarius']).toBe('Sag');
    expect(SIGN_SHORT['capricorn']).toBe('Cap');
    expect(SIGN_SHORT['aquarius']).toBe('Aqua');
  });

  it('keeps short names unchanged', () => {
    expect(SIGN_SHORT['aries']).toBe('Aries');
    expect(SIGN_SHORT['leo']).toBe('Leo');
  });
});

describe('getSignInfo', () => {
  it('returns sign info for valid id', () => {
    const info = getSignInfo('aries');
    expect(info).toBeDefined();
    expect(info!.name).toBe('Aries');
    expect(info!.symbol).toBe('The Ram');
  });

  it('returns undefined for invalid id', () => {
    expect(getSignInfo('notasign')).toBeUndefined();
  });
});

// ─── World Loading & Parsing ──────────────────────────────────────────────────

describe('loadSign', () => {
  it('loads Aries with correct metadata', () => {
    const aries = loadSign('aries');
    expect(aries.id).toBe('aries');
    expect(aries.name).toBe('Aries');
    expect(aries.element).toBe('fire');
    expect(aries.modality).toBe('cardinal');
    expect(aries.rulingPlanet).toBe('Mars');
  });

  it('loads Cancer with correct element', () => {
    const cancer = loadSign('cancer');
    expect(cancer.element).toBe('water');
    expect(cancer.modality).toBe('cardinal');
  });

  it('parses thesis section', () => {
    const aries = loadSign('aries');
    expect(aries.thesis).toContain('Aries leads');
  });

  it('parses traits section', () => {
    const aries = loadSign('aries');
    expect(aries.traits).toContain('takes_initiative');
    expect(aries.traits).toContain('speaks_directly');
  });

  it('parses all five modes', () => {
    const aries = loadSign('aries');
    expect(Object.keys(aries.modes)).toEqual(
      expect.arrayContaining(['direct', 'translate', 'reflect', 'challenge', 'teach']),
    );
  });

  it('mode has name, tagline, and directives', () => {
    const aries = loadSign('aries');
    const direct = aries.modes['direct'];
    expect(direct.name).toBe('Direct');
    expect(direct.tagline).toBeTruthy();
    expect(direct.directives).toBeTruthy();
  });

  it('parses compatibility', () => {
    const aries = loadSign('aries');
    expect(aries.compatibility.bestWith).toContain('Leo');
    expect(aries.compatibility.tensionWith).toContain('Cancer');
  });

  it('parses tone', () => {
    const aries = loadSign('aries');
    expect(aries.tone.formality).toBe('casual');
    expect(aries.tone.confidence).toBe('assertive');
  });

  it('caches loaded signs (returns same reference)', () => {
    const first = loadSign('aries');
    const second = loadSign('aries');
    expect(first).toBe(second);
  });

  it('loads all 12 signs without errors', () => {
    const signIds: SignId[] = [
      'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
    ];
    for (const id of signIds) {
      const sign = loadSign(id);
      expect(sign.id).toBeTruthy();
      expect(sign.name).toBeTruthy();
      expect(Object.keys(sign.modes).length).toBeGreaterThanOrEqual(5);
    }
  });
});

// ─── World Stacking (Prompt Building) ─────────────────────────────────────────

describe('buildStarTalkPrompt', () => {
  it('builds prompt with sun sign only', () => {
    const prompt = buildStarTalkPrompt({ sunSign: 'aries' });
    expect(prompt).toContain('Aries');
    expect(prompt).toContain('fire sign');
    expect(prompt).toContain('Mars');
    expect(prompt).not.toContain('Rising Influence');
  });

  it('includes rising sign when different from sun', () => {
    const prompt = buildStarTalkPrompt({ sunSign: 'cancer', risingSign: 'aries' });
    expect(prompt).toContain('Cancer');
    expect(prompt).toContain('Aries Rising');
    expect(prompt).toContain('Rising Influence');
  });

  it('omits rising section when rising equals sun', () => {
    const prompt = buildStarTalkPrompt({ sunSign: 'aries', risingSign: 'aries' });
    expect(prompt).not.toContain('Rising Influence');
  });

  it('includes compatibility when otherSign provided', () => {
    const prompt = buildStarTalkPrompt({ sunSign: 'aries' }, 'cancer');
    expect(prompt).toContain('Cancer');
    expect(prompt).toContain('Talking To');
  });

  it('detects best_with compatibility', () => {
    const prompt = buildStarTalkPrompt({ sunSign: 'aries' }, 'leo');
    expect(prompt).toContain('Natural Allies');
  });

  it('detects tension_with compatibility', () => {
    const prompt = buildStarTalkPrompt({ sunSign: 'aries' }, 'cancer');
    expect(prompt).toContain('Watch Points');
  });

  it('shows neutral when no strong compatibility', () => {
    const prompt = buildStarTalkPrompt({ sunSign: 'aries' }, 'virgo');
    expect(prompt).toContain('Neutral Ground');
  });

  it('respects maxWords parameter', () => {
    const prompt15 = buildStarTalkPrompt({ sunSign: 'aries' }, undefined, 15);
    const prompt50 = buildStarTalkPrompt({ sunSign: 'aries' }, undefined, 50);
    expect(prompt15).toContain('15 words');
    expect(prompt50).toContain('50 words');
  });

  it('includes all five mode directives', () => {
    const prompt = buildStarTalkPrompt({ sunSign: 'aries' });
    expect(prompt).toContain('TRANSLATE');
    expect(prompt).toContain('REFLECT');
    expect(prompt).toContain('CHALLENGE');
    expect(prompt).toContain('TEACH');
    expect(prompt).toContain('DIRECT');
  });

  it('includes mode selection guidance', () => {
    const prompt = buildStarTalkPrompt({ sunSign: 'aries' });
    expect(prompt).toContain('Mode Selection');
    expect(prompt).toContain('When in doubt, use TRANSLATE');
  });

  it('includes constraints for glasses display', () => {
    const prompt = buildStarTalkPrompt({ sunSign: 'aries' });
    expect(prompt).toContain('smart glasses');
    expect(prompt).toContain('No bullet points');
    expect(prompt).toContain('No markdown');
    expect(prompt).toContain('[MODE:');
  });
});
