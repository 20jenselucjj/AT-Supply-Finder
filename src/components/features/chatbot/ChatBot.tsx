import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from '@/context/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProductRefresh } from '@/context/product-refresh-context';
import { useAuth } from '@/context/auth-context';
import { databases } from '@/lib/api/appwrite';
import type { Product } from '@/lib/types/types';
import { debounce } from '@/lib/utils/utils';

// Types
import { Message, ProgressState, ChatBotProps } from './types/chat-types';

// Hooks
import useChatState from './hooks/useChatState';
import useChatMessages from './hooks/useChatMessages';

// Services
import { 
  generateFirstAidKit, 
  needsFollowUpQuestions, 
  extractContextFromQuery, 
  generateFollowUpQuestions 
} from './services/chat-service';

// Import only the wrapper functions, not the individual service functions
import { handleBuildKit } from './services/kit-customization';

// Components
import ChatButton from './components/ChatButton';
import ChatWindow from './components/ChatWindow';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';

const ChatBot: React.FC<ChatBotProps> = ({ apiKey, onInteraction }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const { refreshTrigger } = useProductRefresh();
  const { user } = useAuth();
  
  // Chat state management
  const { chatState, updateChatState } = useChatState();
  
  // Message management
  const { messages, setMessages, addMessage, clearChatHistory } = useChatMessages();
  
  // Input and loading states
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [progressState, setProgressState] = useState<ProgressState>({
    stage: '',
    progress: 0,
    message: '',
    isActive: false
  });

  // Utility functions
  const simulateTyping = useCallback(async (duration = 1500) => {
    updateChatState({ isTyping: true });
    await new Promise(resolve => setTimeout(resolve, duration));
    updateChatState({ isTyping: false });
  }, [updateChatState]);

  const loadProducts = useCallback(async () => {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products'
      );
      
      const appwriteProducts = response.documents || [];
      // Transform Appwrite documents to Product interface
      const transformedProducts = appwriteProducts.map((doc: any) => ({
        id: doc.$id,
        name: doc.name,
        category: doc.category,
        brand: doc.brand,
        rating: doc.rating,
        price: doc.price,
        features: doc.features || [],
        offers: [], // Appwrite doesn't have direct relationships like Supabase
        imageUrl: doc.imageUrl || doc.image_url || '/placeholder.svg', // Ensure we get the image URL
        image_url: doc.image_url || doc.imageUrl || '/placeholder.svg', // Add both for compatibility
        asin: doc.asin,
        affiliateLink: doc.affiliateLink,
        dimensions: doc.dimensions,
        weight: doc.weight,
        material: doc.material
      }));
      
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }, []);

  // Debounced product loading
  const debouncedLoadProducts = useCallback(
    debounce(loadProducts, 300),
    [loadProducts]
  );

  useEffect(() => {
    debouncedLoadProducts();
  }, [refreshTrigger, debouncedLoadProducts]);

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputValue.trim();
    if (!content || isLoading) return;

    // Track interaction
    onInteraction?.('send-message');

    const userMessage = addMessage({
      type: 'user',
      content,
      status: 'delivered'
    });

    setInputValue('');
    setIsLoading(true);
    
    // Simulate typing delay for better UX
    await simulateTyping();

    try {
      updateChatState({ connectionStatus: 'connecting' });
      
      // Check if this is an initial request that needs follow-up questions
      const isInitialKitRequest = content.toLowerCase().includes('kit') || 
                                 content.toLowerCase().includes('first aid') ||
                                 content.toLowerCase().includes('medical') ||
                                 content.toLowerCase().includes('supplies');
      
      // Check if follow-up questions are needed for initial requests
      if (isInitialKitRequest && needsFollowUpQuestions(content)) {
        updateChatState({ connectionStatus: 'online' });
        
        // Generate and send follow-up questions
        const context = extractContextFromQuery(content);
        const followUpMessage = generateFollowUpQuestions(content, context);
        
        addMessage({
          type: 'bot',
          content: followUpMessage,
          status: 'delivered'
        });
        
        setIsLoading(false);
        return; // Don't generate kit yet, wait for more details
      }
      
      // Extract context from user message and conversation history
      const conversationHistory = messages.slice(-5).map(m => m.content).join(' '); // Last 5 messages
      const fullContext = `${conversationHistory} ${content}`;
      const context = extractContextFromQuery(fullContext);
      
      // Progress callback to update UI
      const onProgress = (stage: string, progress: number, message: string) => {
        setProgressState({
          stage,
          progress,
          message,
          isActive: true
        });
        
        // Add a message to the chat for major stages
        if (progress % 25 === 0 && progress > 0) {
          let stageMessage = '';
          switch (stage) {
            case 'searching':
              stageMessage = '🔍 Searching for relevant products...';
              break;
            case 'preparing':
              stageMessage = '📋 Preparing kit generation request...';
              break;
            case 'generating':
              stageMessage = '🤖 Generating your personalized kit...';
              break;
            case 'finalizing':
              stageMessage = '✅ Finalizing your kit...';
              break;
            default:
              stageMessage = `🔄 ${message}`;
          }
          
          // Only add the message if it's not already the last message
          const lastMessage = messages[messages.length - 1];
          if (!lastMessage || !lastMessage.content.includes(stageMessage)) {
            addMessage({
              type: 'system',
              content: stageMessage,
              status: 'delivered'
            });
          }
        }
      };

      // Generate the first aid kit
      const generatedKit = await generateFirstAidKit(content, products, context, onProgress);

      updateChatState({ connectionStatus: 'online' });
      
      // Reset progress state
      setProgressState({
        stage: '',
        progress: 0,
        message: '',
        isActive: false
      });

      // Create a more concise response without markdown formatting
      const botMessage = addMessage({
        type: 'bot',
        content: `I've created a first aid kit for you: ${generatedKit.name}\n\nIt includes ${generatedKit.items.length} items for $${generatedKit.totalPrice.toFixed(2)}\n\n${generatedKit.reasoning.substring(0, 200)}${generatedKit.reasoning.length > 200 ? '...' : ''}`,
        status: 'delivered',
        kit: generatedKit
      });

      // Show notification if chat is closed
      if (!chatState.isOpen) {
        updateChatState({ hasNotification: true, unreadCount: chatState.unreadCount + 1 });
        toast.success('Your first aid kit is ready!');
      }
      
    } catch (error) {
      console.error('Error generating kit:', error);
      updateChatState({ connectionStatus: 'offline' });
      
      // Reset progress state on error
      setProgressState({
        stage: '',
        progress: 0,
        message: '',
        isActive: false
      });
      
      addMessage({
        type: 'bot',
        content: 'I apologize, but I encountered an error while creating your first aid kit. Please try rephrasing your request or try again later.',
        status: 'error'
      });
      
      toast.error('Failed to generate first aid kit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuildKitWrapper = (kit: any) => {
    handleBuildKit(kit, navigate);
    updateChatState({ isOpen: false });
  };

  const handleCustomizeKitWrapper = (kit: any, action: 'add' | 'remove' | 'update', productId?: string, newQuantity?: number) => {
    handleCustomizeKit(kit, action, user, productId, newQuantity).then(updatedKit => {
      if (updatedKit !== kit) {
        // Update the message with the modified kit
        setMessages(prev => prev.map(msg => {
          if (msg.kit && msg.kit.name === kit.name) {
            return {
              ...msg,
              kit: updatedKit
            };
          }
          return msg;
        }));
      }
    });
  };

  const handleFeedbackWrapper = (messageId: string, feedback: 'helpful' | 'not-helpful') => {
    // Track interaction
    onInteraction?.(`feedback-${feedback}`);
    handleFeedback(messageId, feedback);
  };

  const handleQuickAction = (query: string) => {
    handleSendMessage(query);
  };

  const toggleChat = () => {
    updateChatState({ 
      isOpen: !chatState.isOpen, 
      hasNotification: false, 
      unreadCount: 0 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <ChatButton 
        chatState={chatState}
        toggleChat={toggleChat}
        isMobile={isMobile}
      />
      
      <ChatWindow 
        chatState={chatState}
        toggleChat={toggleChat}
        clearChatHistory={clearChatHistory}
      >
        <MessageList
          messages={messages}
          isLoading={isLoading}
          chatState={chatState}
          progressState={progressState}
          handleQuickAction={handleQuickAction}
          handleBuildKit={handleBuildKitWrapper}
        />
        
        <MessageInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSendMessage={handleSendMessage}
          handleKeyPress={handleKeyPress}
          isLoading={isLoading}
          isMobile={isMobile}
        />
      </ChatWindow>
    </>
  );
};

export default ChatBot;