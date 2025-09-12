import { useState, useCallback, useEffect } from 'react';
import { Message } from '../types/chat-types';
import { databases } from '@/lib/api/appwrite';
import { Query, Permission, Role } from 'appwrite';
import { useAuth } from '@/context/auth-context';

const useChatMessages = () => {
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem('chatbot-messages');
      if (stored) {
        const parsedMessages = JSON.parse(stored).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        return parsedMessages;
      }
    } catch (error) {
      console.warn('Failed to load chat history:', error);
    }
    
    return [
      {
        id: '1',
        type: 'bot',
        content: 'Hi! I\'m your first aid kit assistant. Tell me what kind of first aid kit you need and I\'ll create a personalized kit for you!',
        timestamp: new Date(),
        status: 'delivered'
      }
    ];
  });

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    setMessages(prev => {
      const updated = [...prev, newMessage];
      // Keep only last 100 messages to prevent storage bloat
      return updated.slice(-100);
    });
    return newMessage;
  }, []);

  // Load chat history from Appwrite for authenticated users
  useEffect(() => {
    const loadChatHistory = async () => {
      if (user) {
        try {
          const response = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'chatHistory',
            [Query.equal('userId', user.$id)]
          );
          
          if (response.documents && response.documents.length > 0) {
            // Get the most recent chat history
            const chatDoc = response.documents[0];
            if (chatDoc.messages) {
              const parsedMessages = JSON.parse(chatDoc.messages).map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }));
              setMessages(parsedMessages);
            }
          }
        } catch (error: any) {
          // Handle the case where the chatHistory collection doesn't exist
          if (error?.code === 404) {
            console.warn('Chat history collection not found. Using localStorage only.');
          } else {
            console.warn('Failed to load chat history from Appwrite:', error);
          }
          // Fall back to localStorage
          loadFromLocalStorage();
        }
      } else {
        // Load from localStorage for anonymous users
        loadFromLocalStorage();
      }
    };
    
    const loadFromLocalStorage = () => {
      try {
        const stored = localStorage.getItem('chatbot-messages');
        if (stored) {
          const parsedMessages = JSON.parse(stored).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.warn('Failed to load chat history from localStorage:', error);
      }
    };
    
    loadChatHistory();
  }, [user]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    const saveMessages = async () => {
      if (messages.length > 0) {
        try {
          const messagesString = JSON.stringify(messages);
          
          if (user) {
            // Save to Appwrite for authenticated users
            try {
              const response = await databases.listDocuments(
                import.meta.env.VITE_APPWRITE_DATABASE_ID,
                'chatHistory',
                [Query.equal('userId', user.$id)]
              );
              
              if (response.documents && response.documents.length > 0) {
                // Update existing chat history document
                const chatDocId = response.documents[0].$id;
                await databases.updateDocument(
                  import.meta.env.VITE_APPWRITE_DATABASE_ID,
                  'chatHistory',
                  chatDocId,
                  {
                    messages: messagesString
                  }
                );
              } else {
                // Create new chat history document
                await databases.createDocument(
                  import.meta.env.VITE_APPWRITE_DATABASE_ID,
                  'chatHistory',
                  'unique()',
                  {
                    userId: user.$id,
                    messages: messagesString
                  },
                  [
                    Permission.read(Role.user(user.$id)),
                    Permission.update(Role.user(user.$id)),
                    Permission.delete(Role.user(user.$id))
                  ]
                );
              }
            } catch (appwriteError: any) {
              // Handle the case where the chatHistory collection doesn't exist
              if (appwriteError?.code === 404) {
                console.warn('Chat history collection not found. Using localStorage only.');
              } else {
                console.warn('Failed to save chat history to Appwrite:', appwriteError);
              }
              // Fall back to localStorage
              localStorage.setItem('chatbot-messages', messagesString);
            }
          } else {
            // Save to localStorage for anonymous users
            localStorage.setItem('chatbot-messages', messagesString);
          }
        } catch (error) {
          console.warn('Failed to save chat history:', error);
        }
      }
    };
    
    saveMessages();
  }, [messages, user]);

  const clearChatHistory = useCallback(() => {
    const defaultMessages = [
      {
        id: '1',
        type: 'bot' as const,
        content: 'Hi! I\'m your first aid kit assistant. Tell me what kind of first aid kit you need and I\'ll create a personalized kit for you!',
        timestamp: new Date(),
        status: 'delivered' as const
      }
    ];
    setMessages(defaultMessages);
    
    const clearHistory = async () => {
      try {
        if (user) {
          // Clear from Appwrite for authenticated users
          try {
            const response = await databases.listDocuments(
              import.meta.env.VITE_APPWRITE_DATABASE_ID,
              'chatHistory',
              [Query.equal('userId', user.$id)]
            );
            
            if (response.documents && response.documents.length > 0) {
              // Update existing chat history document with empty messages
              const chatDocId = response.documents[0].$id;
              await databases.updateDocument(
                import.meta.env.VITE_APPWRITE_DATABASE_ID,
                'chatHistory',
                chatDocId,
                {
                  messages: JSON.stringify(defaultMessages)
                }
              );
            } else {
              // Create new chat history document with default messages
              await databases.createDocument(
                import.meta.env.VITE_APPWRITE_DATABASE_ID,
                'chatHistory',
                'unique()',
                {
                  userId: user.$id,
                  messages: JSON.stringify(defaultMessages)
                },
                [
                  Permission.read(Role.user(user.$id)),
                  Permission.update(Role.user(user.$id)),
                  Permission.delete(Role.user(user.$id))
                ]
              );
            }
          } catch (appwriteError: any) {
            // Handle the case where the chatHistory collection doesn't exist
            if (appwriteError?.code === 404) {
              console.warn('Chat history collection not found. Using localStorage only.');
            } else {
              console.warn('Failed to clear chat history in Appwrite:', appwriteError);
            }
            // Fall back to localStorage
            localStorage.removeItem('chatbot-messages');
          }
        } else {
          // Clear from localStorage for anonymous users
          localStorage.removeItem('chatbot-messages');
        }
      } catch (error) {
        console.warn('Failed to clear chat history:', error);
      }
    };
    
    clearHistory();
  }, [user]);

  return {
    messages,
    setMessages,
    addMessage,
    clearChatHistory
  };
};

export default useChatMessages;