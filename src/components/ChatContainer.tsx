
import React, { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';
import { Message } from '@/types';

interface ChatContainerProps {
  messages: Message[];
  isTyping: boolean;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ messages, isTyping }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {messages.map((message, index) => (
        <ChatBubble 
          key={message.id} 
          message={message} 
          isLastMessage={index === messages.length - 1} 
        />
      ))}
      
      {isTyping && (
        <div className="flex gap-3 mb-4">
          <div className="h-8 w-8 bg-healthcare-primary text-white flex items-center justify-center rounded-full">
            <span className="text-xs font-medium">AI</span>
          </div>
          
          <div className="bg-muted px-4 py-2.5 rounded-lg inline-flex gap-1 items-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-0"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatContainer;
