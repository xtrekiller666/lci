import type { ProsodyParams } from './ProsodyTypes';

/**
 * SpeechEngine — LCI's Voice
 * 
 * Manages Web Speech API TTS with emotion-driven prosody parameters.
 * Provides real-time audio amplitude for lip-sync via Web Audio API AnalyserNode.
 * 
 * Singleton pattern — access via SpeechEngine.getInstance().
 */
export class SpeechEngine {
  private static instance: SpeechEngine | null = null;

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  private queue: Array<{ text: string; prosody: ProsodyParams }> = [];
  private isBusy = false;
  private enabled = true;
  private _isSpeaking = false;

  // Callback fired when speaking state changes
  public onSpeakingChange: ((speaking: boolean) => void) | null = null;

  private constructor() {
    this.initAudioContext();
  }

  public static getInstance(): SpeechEngine {
    if (!SpeechEngine.instance) {
      SpeechEngine.instance = new SpeechEngine();
    }
    return SpeechEngine.instance;
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    } catch (e) {
      console.warn('[SpeechEngine] AudioContext unavailable:', e);
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  public get isEnabled(): boolean {
    return this.enabled;
  }

  public get isSpeaking(): boolean {
    return this._isSpeaking;
  }

  /**
   * Enqueue a sentence for TTS with prosody parameters.
   */
  public speak(text: string, prosody: ProsodyParams): void {
    if (!this.enabled) return;
    if (!text.trim()) return;

    this.queue.push({ text, prosody });
    this.processQueue();
  }

  /**
   * Stop all speech immediately and clear the queue.
   */
  public stop(): void {
    this.queue = [];
    this.isBusy = false;
    this._isSpeaking = false;
    this.onSpeakingChange?.(false);

    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
  }

  /**
   * Reset the audio subsystem (called on error recovery).
   */
  public reset(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
    }
    this.initAudioContext();
    console.log('[SpeechEngine] Audio driver reset complete.');
  }

  /**
   * Returns normalized mouth-open amplitude (0.0–1.0) for lip-sync.
   * 
   * Uses the AnalyserNode frequency data focused on the human voice range.
   * When not speaking, returns a simulated amplitude based on the speaking state.
   */
  public getAmplitude(): number {
    if (!this._isSpeaking) return 0;

    // If we have real audio analysis data, use it
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);

      // Focus on bins 2–16 (~170Hz–2700Hz at 44.1kHz with fftSize=256)
      // This captures the fundamental frequency and first formants of human speech
      const voiceBins = this.dataArray.slice(2, 16);
      let sum = 0;
      for (let i = 0; i < voiceBins.length; i++) {
        sum += voiceBins[i];
      }
      const avg = sum / voiceBins.length;
      return Math.min(1.0, avg / 180); // Normalize to 0–1
    }

    // Fallback: Generate synthetic amplitude when real audio analysis isn't available
    // (Web Speech API doesn't expose audio stream on most browsers)
    // Use a naturalistic pattern based on time
    const t = performance.now() / 1000;
    const base = 0.35;
    const variation = Math.sin(t * 8) * 0.15 + Math.sin(t * 13) * 0.1 + Math.sin(t * 21) * 0.05;
    const noise = (Math.random() - 0.5) * 0.1;
    return Math.max(0, Math.min(1.0, base + variation + noise));
  }

  private processQueue(): void {
    if (this.isBusy || this.queue.length === 0) return;

    if (typeof speechSynthesis === 'undefined') {
      console.warn('[SpeechEngine] speechSynthesis not available. Silent mode.');
      this.queue = [];
      return;
    }

    this.isBusy = true;
    const { text, prosody } = this.queue.shift()!;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = prosody.rate;
    utterance.pitch = prosody.pitch;
    utterance.volume = prosody.volume;

    // Try to select a female voice if available
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('zira') || 
      v.name.toLowerCase().includes('samantha') ||
      v.name.toLowerCase().includes('google') // Google voices tend to be higher quality
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => {
      this._isSpeaking = true;
      this.onSpeakingChange?.(true);

      // Resume AudioContext if suspended (browser autoplay policy)
      if (this.audioContext?.state === 'suspended') {
        this.audioContext.resume();
      }
    };

    utterance.onend = () => {
      this.isBusy = false;
      if (this.queue.length === 0) {
        this._isSpeaking = false;
        this.onSpeakingChange?.(false);
      }
      // Process next sentence in queue
      this.processQueue();
    };

    utterance.onerror = (e) => {
      console.error('[SpeechEngine] TTS Error:', e.error);
      this.isBusy = false;
      this._isSpeaking = false;
      this.onSpeakingChange?.(false);
      // Try next sentence despite error
      this.processQueue();
    };

    speechSynthesis.speak(utterance);
  }
}
