
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Send } from 'lucide-react';
import { STTStatus } from '@/types';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  sttStatus: STTStatus;
  sttSupported: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  onStartListening,
  onStopListening,
  sttStatus,
  sttSupported
}) => {
  const [input, setInput] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };
  
  const getMicIcon = () => {
    switch (sttStatus) {
      case 'listening':
        return <Mic className="h-5 w-5 text-red-500 animate-pulse" />;
      case 'processing':
        return <Mic className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <MicOff className="h-5 w-5 text-red-500" />;
      default:
        return <Mic className="h-5 w-5" />;
    }
  };
  
  const handleMicClick = () => {
    if (sttStatus === 'listening') {
      onStopListening();
    } else {
      onStartListening();
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-healthcare-primary focus:border-transparent"
          />
        </div>
        
        {sttSupported && (
          <Button 
            type="button"
            onClick={handleMicClick}
            variant="outline"
            className="rounded-full p-2 h-10 w-10"
            disabled={sttStatus === 'processing'}
          >
            {getMicIcon()}
          </Button>
        )}
        
        <Button 
          type="submit"
          className="rounded-full p-2 h-10 w-10 bg-healthcare-primary hover:bg-healthcare-dark"
          disabled={!input.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
