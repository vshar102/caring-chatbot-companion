
import React from 'react';
import { Message } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import HealthcareProviders from './HealthcareProviders';

interface ChatBubbleProps {
  message: Message;
  isLastMessage: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isLastMessage }) => {
  const isAssistant = message.role === 'assistant';
  
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      {isAssistant && (
        <Avatar className="h-8 w-8 bg-healthcare-primary text-white flex items-center justify-center">
          <span className="text-xs font-medium">AI</span>
        </Avatar>
      )}
      
      <div className="max-w-[80%]">
        <div className={cn(
          "px-4 py-2.5 rounded-lg",
          isAssistant ? "bg-muted text-foreground" : "bg-healthcare-primary text-white"
        )}>
          <div className="whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
        
        {message.healthcareProviders && (
          <div className="mt-3">
            <HealthcareProviders providers={message.healthcareProviders} />
          </div>
        )}
        
        <div className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </div>
      </div>
      
      {!isAssistant && (
        <Avatar className="h-8 w-8 bg-healthcare-dark text-white flex items-center justify-center">
          <span className="text-xs font-medium">You</span>
        </Avatar>
      )}
    </div>
  );
};

export default ChatBubble;
