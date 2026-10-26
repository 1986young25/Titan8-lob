// Tactical Web Speech API Engine for Shannon Entropy Gate Announcements

class TacticalVoiceEngine {
  private isEnabled: boolean = true;
  private voice: SpeechSynthesisVoice | null = null;
  private isInitialized: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Prefer authoritative tactical English voices
      const tacticalVoice =
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('David') || v.name.includes('Daniel'))) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];
      this.voice = tacticalVoice || null;
      this.isInitialized = true;
    }
  }

  public isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public toggle(): boolean {
    this.setEnabled(!this.isEnabled);
    if (this.isEnabled) {
      this.speak("Tactical voice feedback engaged.");
    }
    return this.isEnabled;
  }

  public speak(message: string, priority: 'HIGH' | 'NORMAL' = 'NORMAL') {
    if (!this.isEnabled || !this.isAvailable()) return;

    try {
      const synth = window.speechSynthesis;
      // Cancel previous speech if high priority
      if (priority === 'HIGH') {
        synth.cancel();
      }

      if (!this.voice) {
        this.initVoices();
      }

      const utterance = new SpeechSynthesisUtterance(message);
      if (this.voice) {
        utterance.voice = this.voice;
      }
      utterance.pitch = 0.95; // Slightly deeper, authoritative tactical tone
      utterance.rate = 1.08;  // Crisp line-rate delivery
      utterance.volume = 0.95;

      synth.speak(utterance);
    } catch (e) {
      console.warn("SpeechSynthesis error:", e);
    }
  }

  public speakEntropyRejection(entropy: number, threshold: number = 1.5000, action: string = "Bitwise polarity inversion executed.") {
    const text = `Alert. Shannon Entropy Gate triggered. Payload rejected with H score of ${entropy.toFixed(2)}, below critical threshold ${threshold.toFixed(2)}. ${action}`;
    this.speak(text, 'HIGH');
  }
}

export const voiceEngine = new TacticalVoiceEngine();
