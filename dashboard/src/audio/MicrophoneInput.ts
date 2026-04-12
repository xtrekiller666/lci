/**
 * MicrophoneInput — LCI's Ears
 * 
 * Uses the Web Speech API (SpeechRecognition) for real-time
 * Speech-to-Text transcription. Continuous recognition with
 * interim results for a responsive experience.
 * 
 * Singleton pattern — access via MicrophoneInput.getInstance().
 */
export class MicrophoneInput {
  private static instance: MicrophoneInput | null = null;
  private recognition: any = null;
  private _isListening = false;
  private _isSupported = false;

  // Callbacks
  public onTranscript: ((text: string, isFinal: boolean) => void) | null = null;
  public onListeningChange: ((listening: boolean) => void) | null = null;
  public onError: ((error: string) => void) | null = null;

  private constructor() {
    // Check for Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this._isSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          this.onTranscript?.(finalTranscript.trim(), true);
        } else if (interimTranscript) {
          this.onTranscript?.(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('[MicrophoneInput] Error:', event.error);
        
        // Don't stop on "no-speech" — user is just pausing
        if (event.error === 'no-speech') return;
        
        this.onError?.(event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-available') {
          this._isListening = false;
          this.onListeningChange?.(false);
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if we're supposed to be listening (continuous mode)
        if (this._isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            // Already started, ignore
          }
        }
      };
    } else {
      console.warn('[MicrophoneInput] Web Speech API not supported in this browser.');
      this._isSupported = false;
    }
  }

  public static getInstance(): MicrophoneInput {
    if (!MicrophoneInput.instance) {
      MicrophoneInput.instance = new MicrophoneInput();
    }
    return MicrophoneInput.instance;
  }

  public get isSupported(): boolean {
    return this._isSupported;
  }

  public get isListening(): boolean {
    return this._isListening;
  }

  /**
   * Start continuous listening. Will auto-detect language.
   */
  public start(lang: string = ''): void {
    if (!this._isSupported || !this.recognition) {
      this.onError?.('Speech recognition not supported');
      return;
    }

    if (this._isListening) return;

    try {
      if (lang) {
        this.recognition.lang = lang;
      } else {
        // Auto-detect: empty string lets the browser decide
        this.recognition.lang = '';
      }
      
      this.recognition.start();
      this._isListening = true;
      this.onListeningChange?.(true);
    } catch (e: any) {
      console.error('[MicrophoneInput] Failed to start:', e);
      this.onError?.(e.message);
    }
  }

  /**
   * Stop listening.
   */
  public stop(): void {
    if (!this.recognition) return;
    
    this._isListening = false;
    this.onListeningChange?.(false);
    
    try {
      this.recognition.stop();
    } catch (e) {
      // Ignore if already stopped
    }
  }

  /**
   * Toggle listening state.
   */
  public toggle(): void {
    if (this._isListening) {
      this.stop();
    } else {
      this.start();
    }
  }
}
