
export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TTSConfig {
  voiceId: string;
  model: string;
  apiKey: string;
}

export type STTStatus = "idle" | "listening" | "processing" | "error";
