
// Generate a unique conversation ID
export const generateConversationId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `conv-${timestamp}-${randomStr}`;
};

// Generate a unique message ID
export const generateMessageId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 5);
  return `msg-${timestamp}-${randomStr}`;
};

// Store conversation in localStorage
export const saveConversation = (conversationId: string, messages: any[]): void => {
  try {
    const conversations = getConversations();
    conversations[conversationId] = {
      id: conversationId,
      messages,
      createdAt: conversations[conversationId]?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    localStorage.setItem('healthcareConversations', JSON.stringify(conversations));
  } catch (error) {
    console.error('Failed to save conversation:', error);
  }
};

// Get all conversations from localStorage
export const getConversations = (): Record<string, any> => {
  try {
    const conversations = localStorage.getItem('healthcareConversations');
    return conversations ? JSON.parse(conversations) : {};
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return {};
  }
};

// Get a specific conversation by ID
export const getConversation = (conversationId: string): any | null => {
  try {
    const conversations = getConversations();
    return conversations[conversationId] || null;
  } catch (error) {
    console.error(`Failed to get conversation ${conversationId}:`, error);
    return null;
  }
};
