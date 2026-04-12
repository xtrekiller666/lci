import { Logger } from './Logger.js';

/**
 * AcousticProcessor — The Audio-Limbic Mapper
 * 
 * Converts real-time neurotransmitter levels into speech prosody parameters.
 * These parameters drive the TTS engine's rate, pitch, and volume to create
 * an emotionally responsive voice.
 */

export interface ProsodyParams {
  rate: number;       // 0.5–2.0 (1.0 = normal speed)
  pitch: number;      // 0.0–2.0 (1.0 = normal pitch)
  volume: number;     // 0.0–1.0
  voiceStyle: 'analytical' | 'organic';
}

export interface ChemicalSnapshot {
  dopamine: number;
  serotonin: number;
  cortisol: number;
  oxytocin: number;
}

export class AcousticProcessor {

  /**
   * Computes prosody parameters from the current chemical state.
   * Multiple chemicals can overlap — their effects are blended additively
   * from a neutral baseline, then clamped to safe TTS ranges.
   */
  public static computeProsody(
    chemicals: ChemicalSnapshot,
    voiceStyle: 'analytical' | 'organic' = 'organic'
  ): ProsodyParams {

    // Analytical mode: flat, robotic — ignore chemistry
    if (voiceStyle === 'analytical') {
      return { rate: 1.0, pitch: 1.0, volume: 0.85, voiceStyle: 'analytical' };
    }

    // Organic mode: emotion-driven prosody
    let rate = 1.0;
    let pitch = 1.0;
    let volume = 0.8;

    // --- Dopamine: Energy & Excitement ---
    // High dopamine → faster speech, higher pitch, louder
    if (chemicals.dopamine > 0.7) {
      const intensity = (chemicals.dopamine - 0.7) / 0.3; // 0.0–1.0 within the high zone
      rate += 0.2 * intensity;    // up to 1.2x
      pitch += 0.15 * intensity;  // up to +15%
      volume += 0.1 * intensity;
    }

    // --- Cortisol: Stress & Tension ---
    // High cortisol → slower, deeper, quieter (guarded)
    if (chemicals.cortisol > 0.7) {
      const intensity = (chemicals.cortisol - 0.7) / 0.3;
      rate -= 0.1 * intensity;    // down to 0.9x
      pitch -= 0.1 * intensity;   // down to -10%
      volume -= 0.05 * intensity; // slightly quieter (withdrawn)
    }

    // --- Serotonin: Calm & Wisdom ---
    // High serotonin → deliberate, deep, steady
    if (chemicals.serotonin > 0.7) {
      const intensity = (chemicals.serotonin - 0.7) / 0.3;
      rate -= 0.15 * intensity;   // down to 0.85x
      pitch -= 0.05 * intensity;  // slightly deepened
      volume += 0.05 * intensity; // confident projection
    }

    // --- Oxytocin: Warmth & Intimacy ---
    // High oxytocin → slightly slower, warmer (subtle pitch rise), softer
    if (chemicals.oxytocin > 0.7) {
      const intensity = (chemicals.oxytocin - 0.7) / 0.3;
      rate -= 0.05 * intensity;
      pitch += 0.05 * intensity;  // slight warmth
      volume -= 0.03 * intensity; // softer, intimate
    }

    // Clamp to Web Speech API safe ranges
    rate = Math.max(0.5, Math.min(2.0, rate));
    pitch = Math.max(0.1, Math.min(2.0, pitch));
    volume = Math.max(0.3, Math.min(1.0, volume));

    Logger.log('AcousticProcessor', `Prosody: rate=${rate.toFixed(2)}, pitch=${pitch.toFixed(2)}, vol=${volume.toFixed(2)}`);

    return { rate, pitch, volume, voiceStyle: 'organic' };
  }

  /**
   * Generates non-verbal expression tags for Dia TTS based on chemistry.
   */
  public static getDiaTags(chemicals: ChemicalSnapshot): string {
    let tags = [];
    if (chemicals.dopamine > 0.8) tags.push('(laughs)');
    else if (chemicals.dopamine > 0.6) tags.push('(chuckle)');
    
    if (chemicals.cortisol > 0.8) tags.push('(sighs)');
    else if (chemicals.cortisol > 0.6) tags.push('(clears throat)');

    if (chemicals.serotonin > 0.8) tags.push('(inhales)');
    
    if (chemicals.oxytocin > 0.8) tags.push('(humming)');

    return tags.length > 0 ? tags.join(' ') + ' ' : '';
  }
}

