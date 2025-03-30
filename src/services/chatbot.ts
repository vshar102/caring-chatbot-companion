import { Message } from "../types";
import { generateMessageId } from "../utils/conversation";
import { healthcareProviderService } from "./healthcareProviders";

interface ChatbotResponse {
  message: Message;
  needsInfo?: boolean;
  infoType?: string;
}

interface ApiKeyConfig {
  key: string;
  role: "patient" | "provider";
  permissions: string[];
  isValid: boolean;
}

export class ChatbotService {
  // API key management
  private apiKeys: Record<string, ApiKeyConfig> = {
    "patient-demo-key": {
      key: "patient-demo-key",
      role: "patient",
      permissions: ["basic_chat", "voice_input"],
      isValid: true
    },
    "provider-demo-key": {
      key: "provider-demo-key",
      role: "provider",
      permissions: ["basic_chat", "voice_input", "history_access", "patient_data"],
      isValid: true
    }
  };

  private activeApiKey: string | null = null;
  private currentRole: "patient" | "provider" = "patient";
  
  // Memory and state management for agentic workflow
  private conversationContext = {
    patientName: "",
    currentGoal: "initial_greeting",
    previousTopics: [] as string[],
    preferredResponseStyle: "friendly",
    urgencyLevel: "normal",
    lastInteractionTimestamp: new Date(),
    hasGreeted: false // Track if we've already greeted the user
  };
  
  // Information tracking for conversation context
  private collectedInfo: Record<string, any> = {
    symptoms: {
      collected: false,
      value: null,
      importance: "high",
      followUpNeeded: false
    },
    duration: {
      collected: false,
      value: null, 
      importance: "high",
      followUpNeeded: false
    },
    severity: {
      collected: false,
      value: null,
      importance: "high", 
      followUpNeeded: false
    },
    history: {
      collected: false,
      value: null,
      importance: "medium",
      followUpNeeded: false
    },
    medications: {
      collected: false,
      value: null,
      importance: "medium",
      followUpNeeded: false
    },
    allergies: {
      collected: false,
      value: null,
      importance: "medium", 
      followUpNeeded: false
    }
  };

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

  // Personalized guidance options based on symptom patterns
  private personalizedGuidance = {
    urgent: [
      "Based on what you've shared, your symptoms suggest an urgent situation. Please consider seeking immediate medical attention.",
      "Your symptoms may require prompt medical evaluation. Would you like me to help you locate the nearest urgent care facility?"
    ],
    moderate: [
      "Your symptoms suggest a condition that should be evaluated by a healthcare provider within the next few days.",
      "While not an emergency, your symptoms warrant professional medical attention. I recommend scheduling an appointment with your doctor this week."
    ],
    mild: [
      "Your symptoms appear to be mild. I recommend rest, staying hydrated, and monitoring for any changes.",
      "Based on what you've described, these mild symptoms can often be managed at home. Would you like some self-care recommendations?"
    ],
    followUp: [
      "Since you've been experiencing these symptoms for some time, it would be good to follow up with your healthcare provider about your progress.",
      "A follow-up appointment might be helpful to assess how your condition has evolved. Would you like guidance on scheduling one?"
    ]
  };
  
  // Generate a secure API key
  generateApiKey(role: "patient" | "provider"): string {
    const keyPrefix = role === "patient" ? "pat" : "prov";
    const randomString = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString(36);
    const newKey = `${keyPrefix}_${randomString}_${timestamp}`;
    
    // Store the new key
    this.apiKeys[newKey] = {
      key: newKey,
      role: role,
      permissions: role === "patient" 
        ? ["basic_chat", "voice_input"] 
        : ["basic_chat", "voice_input", "history_access", "patient_data"],
      isValid: true
    };
    
    return newKey;
  }
  
  // Validate API key
  validateApiKey(apiKey: string): boolean {
    const keyConfig = this.apiKeys[apiKey];
    if (!keyConfig || !keyConfig.isValid) {
      return false;
    }
    
    this.activeApiKey = apiKey;
    this.currentRole = keyConfig.role;
    return true;
  }
  
  // Revoke an API key
  revokeApiKey(apiKey: string): boolean {
    if (this.apiKeys[apiKey]) {
      this.apiKeys[apiKey].isValid = false;
      
      // If this was the active key, clear it
      if (this.activeApiKey === apiKey) {
        this.activeApiKey = null;
      }
      
      return true;
    }
    return false;
  }
  
  // Check if a specific permission is allowed for the current API key
  hasPermission(permission: string): boolean {
    if (!this.activeApiKey) return false;
    
    const keyConfig = this.apiKeys[this.activeApiKey];
    return keyConfig.permissions.includes(permission);
  }
  
  // Check if message is asking for nearby healthcare providers
  private isAskingForNearbyProviders(message: string): boolean {
    const providerKeywords = ['near', 'nearby', 'closest', 'nearest', 'around', 'close to'];
    const locationWords = ['hospital', 'clinic', 'doctor', 'physician', 'healthcare', 'medical', 'provider', 'facility'];
    
    // Check if the message contains both location-related words and healthcare facility words
    const hasLocationWord = providerKeywords.some(word => message.includes(word));
    const hasHealthcareWord = locationWords.some(word => message.includes(word));
    
    // Check for address patterns (streets, cities, zip codes)
    const hasAddressPattern = /\b\d+\s+\w+\s+(st|street|ave|avenue|blvd|boulevard|rd|road|way|drive|dr|lane|ln)\b/i.test(message);
    const hasZipCode = /\b\d{5}(-\d{4})?\b/.test(message);
    
    return (hasLocationWord && hasHealthcareWord) || 
           (message.includes('address') && hasHealthcareWord) || 
           (hasAddressPattern || hasZipCode) && message.includes('provider');
  }
  
  // Extract location from message
  private extractLocation(message: string): string | null {
    // Simple extraction of potential address
    const addressMatch = message.match(/\d+\s+\w+\s+(st|street|ave|avenue|blvd|boulevard|rd|road|way|drive|dr|lane|ln)[^,]*(,\s*[^,]+){1,2}/i);
    
    if (addressMatch) {
      return addressMatch[0];
    }
    
    return null;
  }
  
  // Process user message and generate response
  async processMessage(userMessage: string, apiKey?: string): Promise<ChatbotResponse> {
    // API key validation if provided
    if (apiKey && !this.validateApiKey(apiKey)) {
      return {
        message: this.createResponse(
          "Invalid API key. Please provide a valid API key to access this service."
        ),
        needsInfo: false
      };
    }
    
    // Update conversation context
    this.conversationContext.lastInteractionTimestamp = new Date();
    
    const lowerMessage = userMessage.toLowerCase();
    
    // Check if the user is asking for nearby healthcare providers
    if (this.isAskingForNearbyProviders(lowerMessage)) {
      try {
        const location = this.extractLocation(userMessage) || userMessage;
        const providers = await healthcareProviderService.findNearbyProviders(location);
        
        const response: Message = {
          id: generateMessageId(),
          content: "Here are some healthcare providers near your location:",
          role: "assistant",
          timestamp: new Date(),
          healthcareProviders: providers
        };
        
        return {
          message: response,
          needsInfo: false
        };
      } catch (error) {
        console.error("Error finding healthcare providers:", error);
        return {
          message: this.createResponse(
            "I'm sorry, I couldn't find healthcare providers at that location. Please verify the address and try again, or try a different location."
          ),
          needsInfo: false
        };
      }
    }
    
    // Execute the perception-decision-action loop for other types of messages
    return this.agentDecisionLoop(lowerMessage);
  }
  
  // Main agent decision loop implementing the perception-decision-action pattern
  private agentDecisionLoop(message: string): ChatbotResponse {
    // PERCEPTION: Analyze the message
    const intent = this.identifyIntent(message);
    const entities = this.extractEntities(message);
    
    // DECISION: Determine next action
    const nextAction = this.determineNextAction(intent, entities);
    
    // ACTION: Execute the determined action
    return this.executeAction(nextAction, message);
  }
  
  // Identify user intent from message
  private identifyIntent(message: string): string {
    if (this.isGreeting(message) && !this.conversationContext.hasGreeted) {
      this.conversationContext.hasGreeted = true;
      return "greeting";
    }
    
    if (this.containsSymptoms(message)) return "symptom_description";
    if (this.isDurationInfo(message)) return "duration_info";
    if (this.containsNumberRating(message)) return "severity_rating";
    if (this.containsMedicationInfo(message)) return "medication_info";
    if (this.containsAllergyInfo(message)) return "allergy_info";
    if (this.containsNextStepsQuestion(message)) return "next_steps_request";
    if (this.containsHistoryInfo(message)) return "medical_history";
    
    // Default intent
    return "general_query";
  }
  
  // Extract relevant entities from message
  private extractEntities(message: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Extract symptom information if present
    if (this.containsSymptoms(message)) {
      entities.symptoms = message;
      this.collectedInfo.symptoms.value = message;
    }
    
    // Extract duration information if present
    if (this.isDurationInfo(message)) {
      entities.duration = message;
      this.collectedInfo.duration.value = message;
      // Mark duration as collected if it includes time information
      if (this.hasTimeReference(message)) {
        this.collectedInfo.duration.collected = true;
      }
    }
    
    // Extract severity information if present
    if (this.containsNumberRating(message)) {
      const severityMatch = message.match(/\b([0-9]|10|one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
      if (severityMatch) {
        entities.severity = this.normalizeNumberWord(severityMatch[0]);
        this.collectedInfo.severity.value = entities.severity;
      } else if (message.includes("severe")) {
        entities.severity = 8;
        this.collectedInfo.severity.value = 8;
      } else if (message.includes("moderate")) {
        entities.severity = 5;
        this.collectedInfo.severity.value = 5;
      } else if (message.includes("mild")) {
        entities.severity = 3;
        this.collectedInfo.severity.value = 3;
      }
    }
    
    return entities;
  }

  // Check if message contains time references
  private hasTimeReference(message: string): boolean {
    const timeWords = ['day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years', 'hour', 'hours', 'minute', 'minutes', 'since', 'ago'];
    return timeWords.some(word => message.includes(word));
  }
  
  // Convert number words to actual numbers
  private normalizeNumberWord(word: string): number {
    const numberMap: Record<string, number> = {
      "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
      "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10
    };
    
    return numberMap[word.toLowerCase()] || parseInt(word, 10);
  }
  
  // Determine next action based on intent and conversation state
  private determineNextAction(intent: string, entities: Record<string, any>): string {
    // Update collected info based on intent
    if (intent === "symptom_description") {
      this.collectedInfo.symptoms.collected = true;
      this.conversationContext.currentGoal = "collect_duration";
    } else if (intent === "duration_info") {
      this.collectedInfo.duration.collected = true;
      this.conversationContext.currentGoal = "collect_severity";
    } else if (intent === "severity_rating") {
      this.collectedInfo.severity.collected = true;
      this.conversationContext.currentGoal = "provide_guidance";
    } else if (intent === "medication_info") {
      this.collectedInfo.medications.collected = true;
    } else if (intent === "allergy_info") {
      this.collectedInfo.allergies.collected = true;
    } else if (intent === "medical_history") {
      this.collectedInfo.history.collected = true;
    }
    
    // Use conversation context to guide the flow
    if (this.conversationContext.currentGoal === "initial_greeting" || intent === "greeting") {
      this.conversationContext.currentGoal = "collect_symptoms";
      return "ask_symptoms";
    }
    
    // Check if we need to collect critical information
    if (!this.collectedInfo.symptoms.collected && this.conversationContext.currentGoal === "collect_symptoms") {
      return "ask_symptoms";
    }
    
    if (this.collectedInfo.symptoms.collected && !this.collectedInfo.duration.collected && 
        (this.conversationContext.currentGoal === "collect_symptoms" || this.conversationContext.currentGoal === "collect_duration")) {
      this.conversationContext.currentGoal = "collect_duration";
      return "ask_duration";
    }
    
    if (this.collectedInfo.symptoms.collected && 
        this.collectedInfo.duration.collected && 
        !this.collectedInfo.severity.collected && 
        (this.conversationContext.currentGoal === "collect_duration" || this.conversationContext.currentGoal === "collect_severity")) {
      this.conversationContext.currentGoal = "collect_severity";
      return "ask_severity";
    }
    
    // Check if we have all critical information to provide next steps
    if (this.collectedInfo.symptoms.collected && 
        this.collectedInfo.duration.collected && 
        this.collectedInfo.severity.collected) {
      
      this.conversationContext.currentGoal = "provide_guidance";
      
      // Check if the user is explicitly asking for next steps
      if (intent === "next_steps_request") {
        return "provide_detailed_next_steps";
      }
      
      // Otherwise provide a general guidance based on collected info
      return "provide_guidance";
    }
    
    // Default action for unrecognized scenarios
    return "ask_more_info";
  }
  
  // Execute the determined action
  private executeAction(action: string, originalMessage: string): ChatbotResponse {
    switch (action) {
      case "ask_symptoms":
        return {
          message: this.createResponse(
            this.collectedInfo.symptoms.collected ? 
            "Thank you for sharing that. Could you tell me more about your symptoms?" : 
            this.infoPrompts.symptoms
          ),
          needsInfo: true,
          infoType: "symptoms"
        };
        
      case "ask_duration":
        return {
          message: this.createResponse(
            "Thank you for sharing that information. " + this.infoPrompts.duration
          ),
          needsInfo: true,
          infoType: "duration"
        };
        
      case "ask_severity":
        return {
          message: this.createResponse(
            "I understand. " + this.infoPrompts.severity
          ),
          needsInfo: true,
          infoType: "severity"
        };
        
      case "provide_guidance": {
        // Determine guidance type based on severity
        let guidanceType = "mild";
        const severity = this.collectedInfo.severity.value;
        
        if (severity >= 7) {
          guidanceType = "urgent";
        } else if (severity >= 4 && severity <= 6) {
          guidanceType = "moderate";
        }
        
        // Check if this has been ongoing for a while
        const duration = this.collectedInfo.duration.value?.toLowerCase() || "";
        if (duration.includes("week") || duration.includes("month") || duration.includes("year")) {
          guidanceType = "followUp";
        }
        
        const guidance = this.getRandomItem(this.personalizedGuidance[guidanceType]);
        const nextStep = this.getRandomItem(this.nextStepsResponses);
        
        return {
          message: this.createResponse(
            `Thank you for providing that information.\n\n${guidance}\n\n${nextStep}\n\nWould you like me to elaborate on any specific aspect of these recommendations?`
          ),
          needsInfo: false
        };
      }
        
      case "provide_detailed_next_steps": {
        // Generate a more detailed and personalized response
        const severity = this.collectedInfo.severity.value;
        const symptoms = this.collectedInfo.symptoms.value;
        const duration = this.collectedInfo.duration.value;
        
        let urgencyLevel = "non-urgent";
        let timeframe = "within the next week";
        let careType = "primary care physician";
        
        // Determine urgency based on severity
        if (severity >= 8) {
          urgencyLevel = "urgent";
          timeframe = "as soon as possible, today if feasible";
          careType = "emergency services";
        } else if (severity >= 6) {
          urgencyLevel = "prompt attention";
          timeframe = "in the next 1-2 days";
          careType = "urgent care or primary physician";
        } else if (severity >= 4) {
          urgencyLevel = "moderate concern";
          timeframe = "within the next few days";
        }
        
        // Assemble detailed guidance
        const detailedResponse = `
Based on what you've shared about your symptoms${symptoms ? ' (' + symptoms + ')' : ''}, their ${severity ? 'severity level of ' + severity + '/10' : 'severity'}, and their duration${duration ? ' (' + duration + ')' : ''}, I recommend the following steps:

1. **Seek Medical Attention**: Consider consulting with a ${careType} ${timeframe}. Your situation appears to be ${urgencyLevel}.

2. **Document Your Symptoms**: Keep a log of your symptoms, noting any changes in severity or new developments. This information will be valuable for your healthcare provider.

3. **Prepare for Your Appointment**: Make a list of:
   • All symptoms you're experiencing
   • When they started and how they've changed
   • Any medications you're currently taking
   • Your relevant medical history

4. **Self-Care in the Meantime**:
   • Stay hydrated
   • Get adequate rest
   • Avoid activities that worsen your symptoms
   • Follow any previous medical advice for similar conditions

5. **Watch for Warning Signs**: If your symptoms suddenly worsen, particularly if you experience ${this.getWarningSignsForSymptoms(symptoms || "")}, seek immediate medical attention.

Would you like me to help you find healthcare providers in your area, or is there anything else you'd like to know about managing your condition?`;

        return {
          message: this.createResponse(detailedResponse),
          needsInfo: false
        };
      }
        
      case "ask_more_info":
        // Check what information we still need
        if (!this.collectedInfo.symptoms.collected) {
          return {
            message: this.createResponse(
              "Thank you for sharing that information. Could you please tell me more about what specific symptoms you're experiencing?"
            ),
            needsInfo: true,
            infoType: "symptoms"
          };
        } else if (!this.collectedInfo.duration.collected) {
          return {
            message: this.createResponse(
              "Thank you for that information. Could you tell me approximately how long you've been experiencing these symptoms?"
            ),
            needsInfo: true,
            infoType: "duration"
          };
        } else if (!this.collectedInfo.severity.collected) {
          return {
            message: this.createResponse(
              "Thank you for sharing that. On a scale from 1 to 10, how would you rate the severity of your symptoms?"
            ),
            needsInfo: true,
            infoType: "severity"
          };
        } else {
          // If we somehow got here with all info collected, provide guidance
          return this.executeAction("provide_guidance", originalMessage);
        }
        
      default:
        // Handle greeting case
        if (this.isGreeting(originalMessage)) {
          return {
            message: this.createResponse(
              this.getRandomItem(this.greetings)
            ),
            needsInfo: false
          };
        }
        
        // Default response for unhandled cases - progress the conversation based on what we know
        if (this.collectedInfo.symptoms.collected && !this.collectedInfo.duration.collected) {
          return this.executeAction("ask_duration", originalMessage);
        } else if (this.collectedInfo.symptoms.collected && this.collectedInfo.duration.collected && !this.collectedInfo.severity.collected) {
          return this.executeAction("ask_severity", originalMessage);
        } else if (this.collectedInfo.symptoms.collected && this.collectedInfo.duration.collected && this.collectedInfo.severity.collected) {
          return this.executeAction("provide_guidance", originalMessage);
        } else {
          return {
            message: this.createResponse(
              "I appreciate you sharing that information. Could you tell me more about any symptoms you're experiencing?"
            ),
            needsInfo: true,
            infoType: "symptoms"
          };
        }
    }
  }
  
  // Get warning signs based on symptom mentions
  private getWarningSignsForSymptoms(symptoms: string): string {
    const lowerSymptoms = symptoms.toLowerCase();
    
    if (lowerSymptoms.includes("head") || lowerSymptoms.includes("migraine")) {
      return "severe headache, confusion, blurred vision, or difficulty speaking";
    }
    
    if (lowerSymptoms.includes("chest") || lowerSymptoms.includes("heart") || lowerSymptoms.includes("breath")) {
      return "chest pain, shortness of breath, or irregular heartbeat";
    }
    
    if (lowerSymptoms.includes("stomach") || lowerSymptoms.includes("abdomen")) {
      return "severe abdominal pain, persistent vomiting, or signs of dehydration";
    }
    
    // Default warning signs
    return "high fever, difficulty breathing, severe pain, or confusion";
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
  
  private containsMedicationInfo(message: string): boolean {
    const medicationWords = ['medication', 'medicine', 'pill', 'drug', 'prescription', 'taking', 'dose'];
    return medicationWords.some(word => message.includes(word));
  }
  
  private containsAllergyInfo(message: string): boolean {
    const allergyWords = ['allergy', 'allergic', 'reaction', 'sensitive'];
    return allergyWords.some(word => message.includes(word));
  }
  
  private containsHistoryInfo(message: string): boolean {
    const historyWords = ['history', 'condition', 'chronic', 'previous', 'before', 'diagnosed', 'past'];
    return historyWords.some(word => message.includes(word));
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
    // Reset collected information
    Object.keys(this.collectedInfo).forEach(key => {
      this.collectedInfo[key as keyof typeof this.collectedInfo] = {
        collected: false,
        value: null,
        importance: this.collectedInfo[key].importance,
        followUpNeeded: false
      };
    });
    
    // Reset conversation context
    this.conversationContext = {
      patientName: "",
      currentGoal: "initial_greeting",
      previousTopics: [],
      preferredResponseStyle: "friendly",
      urgencyLevel: "normal",
      lastInteractionTimestamp: new Date(),
      hasGreeted: false
    };
  }
}

export const chatbotService = new ChatbotService();
