import { useState, useCallback, useEffect } from 'react';
import { ChatState } from '../types/chat-types';

const useChatState = () => {
  const [chatState, setChatState] = useState<ChatState>(() => {
    const defaultState = {
      isOpen: false,
      isTyping: false,
      connectionStatus: 'online' as const,
      unreadCount: 0,
      hasNotification: false
    };
    
    // Load state from storage on initialization
    try {
      const stored = localStorage.getItem('chatbot-state');
      if (stored) {
        const parsedState = JSON.parse(stored);
        return { ...defaultState, ...parsedState, isTyping: false, connectionStatus: 'online' as const };
      }
    } catch (error) {
      console.warn('Failed to load chat state:', error);
    }
    
    return defaultState;
  });

  const updateChatState = useCallback((updates: Partial<ChatState>) => {
    setChatState(prev => ({ ...prev, ...updates }));
  }, []);

  // Save chat state to localStorage whenever it changes
  useEffect(() => {
    try {
      const stateToSave = {
        isOpen: chatState.isOpen,
        unreadCount: chatState.unreadCount,
        hasNotification: chatState.hasNotification
      };
      localStorage.setItem('chatbot-state', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save chat state:', error);
    }
  }, [chatState.isOpen, chatState.unreadCount, chatState.hasNotification]);

  return {
    chatState,
    updateChatState
  };
};

export default useChatState;