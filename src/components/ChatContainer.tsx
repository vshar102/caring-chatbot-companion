
import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import ChatBubble from './ChatBubble';

interface ChatContainerProps {
  messages: Message[];
  isTyping: boolean;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ messages, isTyping }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);
  
  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 flex flex-col"
      style={{ scrollBehavior: 'smooth' }}
    >
      {messages.map((message, index) => (
        <ChatBubble 
          key={message.id} 
          message={message} 
          isLatest={index === messages.length - 1} 
        />
      ))}
      
      {isTyping && (
        <div className="chat-bubble chat-bubble-bot animate-fade-in">
          <div className="flex space-x-2">
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-100"></div>
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-200"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
