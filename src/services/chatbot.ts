
import { Message } from "../types";
import { generateMessageId } from "../utils/conversation";

interface ChatbotResponse {
  message: Message;
  needsInfo?: boolean;
  infoType?: string;
}

export class ChatbotService {
  // Pre-defined greeting responses
  private greetings = [
    "Hello! I'm your healthcare assistant. How are you feeling today?",
    "Hi there! I'm here to help with your healthcare needs. How can I assist you today?",
    "Good day! I'm your AI healthcare companion. How are you doing today?",
    "Welcome! I'm here to support your healthcare journey. How are you feeling?"
  ];
  
  // Pre-defined follow-up questions
  private followUps = [
    "Could you tell me more about any symptoms you're experiencing?",
    "Have you noticed any changes in your health recently?",
    "Is there anything specific you'd like to discuss about your health today?",
    "What brings you to our healthcare service today?"
  ];
  
  // Healthcare information collection prompts
  private infoPrompts = {
    symptoms: "Could you describe any symptoms you're experiencing in detail?",
    duration: "How long have you been experiencing these symptoms?",
    severity: "On a scale of 1-10, how would you rate the severity of your symptoms?",
    history: "Do you have any relevant medical history related to these symptoms?",
    medications: "Are you currently taking any medications?",
    allergies: "Do you have any known allergies?"
  };

  // Process user message and generate response
  async processMessage(userMessage: string): Promise<ChatbotResponse> {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for greetings
    if (this.isGreeting(lowerMessage)) {
      return {
        message: this.createResponse(
          this.getRandomItem(this.greetings) + " " + this.getRandomItem(this.followUps)
        ),
        needsInfo: false
      };
    }
    
    // Check for symptom descriptions
    if (this.containsSymptoms(lowerMessage)) {
      return {
        message: this.createResponse(
          "Thank you for sharing that information. " + this.infoPrompts.duration
        ),
        needsInfo: true,
        infoType: "duration"
      };
    }
    
    // Check for duration information
    if (this.isDurationInfo(lowerMessage)) {
      return {
        message: this.createResponse(
          "I understand. " + this.infoPrompts.severity
        ),
        needsInfo: true,
        infoType: "severity"
      };
    }
    
    // Default response for unrecognized input
    return {
      message: this.createResponse(
        "Thank you for that information. Is there anything else you'd like to share about your health concerns?"
      ),
      needsInfo: false
    };
  }
  
  // Helper methods
  private isGreeting(message: string): boolean {
    const greetingWords = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
    return greetingWords.some(word => message.includes(word));
  }
  
  private containsSymptoms(message: string): boolean {
    const symptomWords = ['pain', 'ache', 'sore', 'hurt', 'fever', 'cough', 'cold', 'headache', 'nausea', 'vomit', 'dizzy', 'tired', 'fatigue', 'symptom', 'feeling', 'unwell', 'sick'];
    return symptomWords.some(word => message.includes(word));
  }
  
  private isDurationInfo(message: string): boolean {
    const durationWords = ['day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years', 'hour', 'hours', 'minute', 'minutes', 'since', 'started'];
    return durationWords.some(word => message.includes(word));
  }
  
  private getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  private createResponse(content: string): Message {
    return {
      id: generateMessageId(),
      content,
      role: "assistant",
      timestamp: new Date()
    };
  }
}

export const chatbotService = new ChatbotService();
