
import { STTStatus } from "../types";

export class STTService {
  private recognition: any;
  private onResultCallback: ((text: string) => void) | null = null;
  private onStatusChangeCallback: ((status: STTStatus) => void) | null = null;
  private status: STTStatus = "idle";
  
  constructor() {
    if ('webkitSpeechRecognition' in window) {
      // @ts-ignore: Webkit speech recognition API
      this.recognition = new webkitSpeechRecognition();
      this.setupRecognition();
    } else if ('SpeechRecognition' in window) {
      // @ts-ignore: Standard speech recognition API
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    } else {
      console.error("Speech recognition not supported in this browser");
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = "en-US";
    
    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (this.onResultCallback) {
        this.onResultCallback(transcript);
      }
      this.setStatus("idle");
    };
    
    this.recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      this.setStatus("error");
    };
    
    this.recognition.onend = () => {
      if (this.status === "listening") {
        this.setStatus("processing");
      }
    };
  }

  setStatus(status: STTStatus): void {
    this.status = status;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }

  onResult(callback: (text: string) => void): void {
    this.onResultCallback = callback;
  }

  onStatusChange(callback: (status: STTStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }

  start(): void {
    if (!this.recognition) {
      console.error("Speech recognition not supported");
      return;
    }
    
    try {
      this.recognition.start();
      this.setStatus("listening");
    } catch (error) {
      console.error("Speech recognition start error:", error);
      this.setStatus("error");
    }
  }

  stop(): void {
    if (!this.recognition) return;
    
    try {
      this.recognition.stop();
      if (this.status === "listening") {
        this.setStatus("processing");
      }
    } catch (error) {
      console.error("Speech recognition stop error:", error);
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }
}

export const sttService = new STTService();
