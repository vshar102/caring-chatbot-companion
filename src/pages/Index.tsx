
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/types';
import { chatbotService } from '@/services/chatbot';
import { ttsService } from '@/services/tts';
import { sttService } from '@/services/stt';
import { 
  generateConversationId, 
  generateMessageId,
  saveConversation
} from '@/utils/conversation';
import ChatContainer from '@/components/ChatContainer';
import ChatInput from '@/components/ChatInput';
import SettingsPanel from '@/components/SettingsPanel';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Added missing Button import
import { Heart } from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sttStatus, setSttStatus] = useState<"idle" | "listening" | "processing" | "error">("idle");
  const [sttSupported, setSttSupported] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [voiceId, setVoiceId] = useState<string>("EXAVITQu4vr4xnSDxMaL"); // Sarah voice
  const [chatbotApiKey, setChatbotApiKey] = useState<string>('');
  const [conversationState, setConversationState] = useState<{
    symptomCollected: boolean;
    durationCollected: boolean;
    severityCollected: boolean;
  }>({
    symptomCollected: false,
    durationCollected: false,
    severityCollected: false
  });
  
  // Initialize conversation
  useEffect(() => {
    // Generate a new conversation ID
    const newConversationId = generateConversationId();
    setConversationId(newConversationId);
    
    // Initial message
    const initialMessage: Message = {
      id: generateMessageId(),
      content: "Hello! I'm your healthcare assistant. How can I help you today?",
      role: 'assistant',
      timestamp: new Date()
    };
    
    setMessages([initialMessage]);
    
    // Store the initial conversation
    saveConversation(newConversationId, [initialMessage]);
    
    // Check if speech recognition is supported
    setSttSupported(sttService.isSupported());
    
    // Set up speech-to-text callbacks
    sttService.onStatusChange(setSttStatus);
    sttService.onResult(handleSpeechResult);
    
    // Check for saved API keys
    const savedApiKey = localStorage.getItem('elevenLabsApiKey') || '';
    if (savedApiKey) {
      setApiKey(savedApiKey);
      ttsService.setApiKey(savedApiKey);
    }
    
    // Check for saved voice ID
    const savedVoiceId = localStorage.getItem('elevenLabsVoiceId') || voiceId;
    if (savedVoiceId) {
      setVoiceId(savedVoiceId);
      ttsService.setVoiceId(savedVoiceId);
    }
    
    // Check for saved chatbot API key
    const savedChatbotApiKey = localStorage.getItem('healthcareChatbotApiKey') || '';
    if (savedChatbotApiKey) {
      setChatbotApiKey(savedChatbotApiKey);
    }
    
    // Speak the initial greeting if API key is available
    if (savedApiKey) {
      ttsService.speak(initialMessage.content);
    }
  }, []);
  
  // Handle user message submission
  const handleSubmit = async (content: string) => {
    // Create new user message
    const userMessage: Message = {
      id: generateMessageId(),
      content,
      role: 'user',
      timestamp: new Date()
    };
    
    // Update messages state
    setMessages(prev => [...prev, userMessage]);
    
    // Save to conversation storage
    saveConversation(conversationId, [...messages, userMessage]);
    
    // Show typing indicator
    setIsTyping(true);
    
    // Process message with chatbot service
    setTimeout(async () => {
      try {
        const response = await chatbotService.processMessage(content, chatbotApiKey);
        
        // Update conversation state based on response
        if (response.infoType === 'symptoms') {
          setConversationState(prev => ({ ...prev, symptomCollected: true }));
        } else if (response.infoType === 'duration') {
          setConversationState(prev => ({ ...prev, durationCollected: true }));
        } else if (response.infoType === 'severity') {
          setConversationState(prev => ({ ...prev, severityCollected: true }));
        }
        
        setMessages(prev => [...prev, response.message]);
        saveConversation(conversationId, [...messages, userMessage, response.message]);
        
        // Speak response if API key is available
        if (apiKey) {
          ttsService.speak(response.message.content);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        toast({
          title: "Error",
          description: "Failed to process your message. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsTyping(false);
      }
    }, 1000); // Simulate thinking time
  };
  
  // Handle speech recognition result
  const handleSpeechResult = (text: string) => {
    if (text.trim()) {
      handleSubmit(text);
    }
  };
  
  // Start speech recognition
  const handleStartListening = () => {
    sttService.start();
  };
  
  // Stop speech recognition
  const handleStopListening = () => {
    sttService.stop();
  };
  
  // Save settings
  const handleSaveSettings = (newApiKey: string, newVoiceId: string) => {
    // Save voice API key
    setApiKey(newApiKey);
    localStorage.setItem('elevenLabsApiKey', newApiKey);
    ttsService.setApiKey(newApiKey);
    
    // Save voice ID
    setVoiceId(newVoiceId);
    localStorage.setItem('elevenLabsVoiceId', newVoiceId);
    ttsService.setVoiceId(newVoiceId);
    
    toast({
      title: "Settings Saved",
      description: "Your voice settings have been updated."
    });
  };
  
  // Reset conversation
  const handleResetConversation = () => {
    // Generate a new conversation ID
    const newConversationId = generateConversationId();
    setConversationId(newConversationId);
    
    // Reset conversation state
    setConversationState({
      symptomCollected: false,
      durationCollected: false,
      severityCollected: false
    });
    
    // Reset chatbot service state
    chatbotService.resetConversation();
    
    // Initial message
    const initialMessage: Message = {
      id: generateMessageId(),
      content: "Hello! I'm your healthcare assistant. How can I help you today?",
      role: 'assistant',
      timestamp: new Date()
    };
    
    setMessages([initialMessage]);
    
    // Store the initial conversation
    saveConversation(newConversationId, [initialMessage]);
    
    // Speak the initial greeting if API key is available
    if (apiKey) {
      ttsService.speak(initialMessage.content);
    }
    
    toast({
      title: "Conversation Reset",
      description: "Started a new healthcare conversation."
    });
  };
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-healthcare-light p-4">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col">
        <CardHeader className="bg-healthcare-primary text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center justify-center">
              <Heart className="mr-2 h-6 w-6 animate-pulse-slow" />
              Healthcare Assistant
            </CardTitle>
            <div className="flex space-x-2">
              <Badge variant="outline" className="bg-white/20 text-white hover:bg-white/30">
                Agentic AI
              </Badge>
              <Badge variant="outline" className="bg-white/20 text-white hover:bg-white/30">
                v2.0
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex-1 flex flex-col">
          <ChatContainer messages={messages} isTyping={isTyping} />
          
          <ChatInput 
            onSubmit={handleSubmit}
            onStartListening={handleStartListening}
            onStopListening={handleStopListening}
            sttStatus={sttStatus}
            sttSupported={sttSupported}
          />
        </CardContent>
        
        <CardFooter className="justify-between border-t p-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleResetConversation}
            className="text-sm text-muted-foreground hover:text-healthcare-primary"
          >
            Start New Conversation
          </Button>
          
          <div className="text-xs text-muted-foreground">
            {conversationState.symptomCollected && (
              <Badge variant="outline" className="mr-1 bg-green-50 text-green-700 border-green-200">
                Symptoms
              </Badge>
            )}
            {conversationState.durationCollected && (
              <Badge variant="outline" className="mr-1 bg-blue-50 text-blue-700 border-blue-200">
                Duration
              </Badge>
            )}
            {conversationState.severityCollected && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Severity
              </Badge>
            )}
          </div>
        </CardFooter>
        
        <SettingsPanel 
          onSave={handleSaveSettings}
          initialApiKey={apiKey}
          initialVoiceId={voiceId}
        />
      </Card>
    </div>
  );
};

export default Index;
