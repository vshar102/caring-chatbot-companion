
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

  // Next steps suggestions based on collected information
  private nextStepsResponses = [
    "Based on what you've shared, I recommend scheduling a consultation with your primary care physician to discuss these symptoms in more detail.",
    "Your symptoms suggest you might benefit from speaking with a healthcare professional. Consider booking an appointment in the next few days.",
    "I'd advise you to monitor these symptoms for the next 24-48 hours. If they persist or worsen, please contact your healthcare provider immediately.",
    "Given what you've described, it would be best to speak with a specialist. Would you like information on how to find the right specialist for your concerns?"
  ];

  // Information tracking for conversation context
  private collectedInfo: Record<string, boolean> = {
    symptoms: false,
    duration: false,
    severity: false
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
    if (this.containsSymptoms(lowerMessage) && !this.collectedInfo.symptoms) {
      this.collectedInfo.symptoms = true;
      return {
        message: this.createResponse(
          "Thank you for sharing that information. " + this.infoPrompts.duration
        ),
        needsInfo: true,
        infoType: "duration"
      };
    }
    
    // Check for duration information
    if (this.isDurationInfo(lowerMessage) && !this.collectedInfo.duration) {
      this.collectedInfo.duration = true;
      return {
        message: this.createResponse(
          "I understand. " + this.infoPrompts.severity
        ),
        needsInfo: true,
        infoType: "severity"
      };
    }
    
    // Check for severity information and provide next steps
    if (this.containsNumberRating(lowerMessage) && !this.collectedInfo.severity) {
      this.collectedInfo.severity = true;
      return {
        message: this.createResponse(
          "Thank you for providing that information. " + this.getRandomItem(this.nextStepsResponses) + 
          "\n\nIs there anything specific you'd like me to explain further about what you should do next?"
        ),
        needsInfo: false
      };
    }
    
    // If we've collected all necessary info but the user is still chatting
    if (this.collectedInfo.symptoms && this.collectedInfo.duration && this.collectedInfo.severity) {
      // Check if the message contains questions about what to do
      if (this.containsNextStepsQuestion(lowerMessage)) {
        return {
          message: this.createResponse(
            "Based on the symptoms you've described, their duration, and severity, I would recommend the following steps: " +
            "\n\n1. Contact your primary care provider within the next 24-48 hours" +
            "\n2. Keep track of any changes in your symptoms" +
            "\n3. Stay hydrated and get adequate rest" +
            "\n\nWould you like me to help you find healthcare providers in your area?"
          ),
          needsInfo: false
        };
      }
      
      // General response for continued conversation after collecting info
      return {
        message: this.createResponse(
          "I'm here to help you navigate your healthcare needs. Would you like me to provide information about healthcare facilities near you, or is there something else I can assist you with?"
        ),
        needsInfo: false
      };
    }
    
    // Default response for unrecognized input
    return {
      message: this.createResponse(
        "I appreciate you sharing that information. To better assist you, could you tell me more about your symptoms, how long you've been experiencing them, or their severity? This will help me provide more personalized guidance."
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
  
  private containsNumberRating(message: string): boolean {
    // Check for numeric ratings or descriptions of severity
    return /\b([0-9]|10|one|two|three|four|five|six|seven|eight|nine|ten|severe|moderate|mild)\b/i.test(message);
  }
  
  private containsNextStepsQuestion(message: string): boolean {
    const nextStepsWords = ['what should i do', 'next steps', 'what to do', 'recommend', 'suggestion', 'advice', 'help me', 'doctor', 'hospital', 'treatment'];
    return nextStepsWords.some(word => message.includes(word));
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

  // Reset the conversation state
  public resetConversation(): void {
    this.collectedInfo = {
      symptoms: false,
      duration: false,
      severity: false
    };
  }
}

export const chatbotService = new ChatbotService();
