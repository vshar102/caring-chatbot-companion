
import React, { useEffect, useRef } from 'react';
import { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
  isLatest: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isLatest }) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isLatest && bubbleRef.current) {
      bubbleRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isLatest]);
  
  const isUser = message.role === 'user';
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return (
    <div 
      ref={bubbleRef}
      className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-bot'} animate-fade-in`}
    >
      <div className="flex flex-col">
        <div className="text-sm">
          {message.content}
        </div>
        <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
