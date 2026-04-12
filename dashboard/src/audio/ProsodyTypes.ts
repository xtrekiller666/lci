/**
 * Shared Prosody type definitions for LCI Audio-Limbic system.
 * Used by both the backend (AcousticProcessor) and frontend (SpeechEngine).
 */

export interface ProsodyParams {
  rate: number;       // 0.5–2.0 (1.0 = normal speed)
  pitch: number;      // 0.0–2.0 (1.0 = normal pitch)  
  volume: number;     // 0.0–1.0
  voiceStyle: 'analytical' | 'organic';
}

export interface TTSSentencePayload {
  text: string;
  prosody: ProsodyParams;
}
