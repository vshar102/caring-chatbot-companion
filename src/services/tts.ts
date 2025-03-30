
import { TTSConfig } from "../types";

export class TTSService {
  private voiceId: string;
  private model: string;
  private apiKey: string | null;
  private audio: HTMLAudioElement | null = null;
  
  constructor(config?: Partial<TTSConfig>) {
    this.voiceId = config?.voiceId || "EXAVITQu4vr4xnSDxMaL"; // Sarah voice
    this.model = config?.model || "eleven_multilingual_v2";
    this.apiKey = config?.apiKey || null;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  setVoiceId(voiceId: string) {
    this.voiceId = voiceId;
  }

  async speak(text: string): Promise<void> {
    if (!this.apiKey) {
      console.error("ElevenLabs API key is required");
      return;
    }

    try {
      if (this.audio) {
        this.audio.pause();
        this.audio = null;
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": this.apiKey
        },
        body: JSON.stringify({
          text,
          model_id: this.model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      this.audio = new Audio(audioUrl);
      await this.audio.play();
      
    } catch (error) {
      console.error("Text-to-speech error:", error);
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
  }
}

export const ttsService = new TTSService();
