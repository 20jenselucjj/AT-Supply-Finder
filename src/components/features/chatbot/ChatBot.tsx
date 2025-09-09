import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Send, 
  X, 
  Loader2, 
  Package, 
  ExternalLink, 
  Minus, 
  Maximize2, 
  MoreHorizontal,
  Zap,
  Package2,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Bot,
  User,
  Plus,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { OpenRouterService, type GeneratedKit } from '@/lib/ai/openrouter-service';
import { GeminiService } from '@/lib/ai/gemini-service';
import { databases } from '@/lib/api/appwrite';
import type { Product } from '@/lib/types/types';
import { useTheme } from '@/context/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProductRefresh } from '@/context/product-refresh-context';
import { useAuth } from '@/context/auth-context'; // Add this import
import { Query } from 'appwrite'; // Add this import
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'error';
  kit?: GeneratedKit;
  isTyping?: boolean;
  metadata?: {
    reactions?: string[];
    isEdited?: boolean;
    parentId?: string;
  };
  feedback?: 'helpful' | 'not-helpful';
}

interface ChatState {
  isOpen: boolean;
  isTyping: boolean;
  connectionStatus: 'online' | 'offline' | 'connecting';
  unreadCount: number;
  hasNotification: boolean;
}

interface ProgressState {
  stage: string;
  progress: number;
  message: string;
  isActive: boolean;
}

const QUICK_ACTIONS = [
  { label: 'Basic First Aid Kit', query: 'Create a basic first aid kit for home use' },
  { label: 'Travel First Aid Kit', query: 'Create a compact travel first aid kit' },
  { label: 'Workplace Kit', query: 'Create a first aid kit for my workplace' },
  { label: 'Outdoor Adventure Kit', query: 'Create a first aid kit for hiking and camping' }
];

interface ChatBotProps {
  apiKey: string;
  onInteraction?: (interactionType: string) => void;
}

const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const ChatBot: React.FC<ChatBotProps> = ({ apiKey, onInteraction }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const { refreshTrigger } = useProductRefresh();
  const { user } = useAuth(); // Add this line
  
  // Initialize chat state from storage
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
  
  // Initialize messages from storage
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

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [progressState, setProgressState] = useState<ProgressState>({
    stage: '',
    progress: 0,
    message: '',
    isActive: false
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const openRouterService = new OpenRouterService({ 
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
    model: 'deepseek/deepseek-chat-v3.1:free'
  });

  const geminiService = new GeminiService({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    model: 'gemini-2.0-flash-exp'
  });

  // Utility functions
  const updateChatState = useCallback((updates: Partial<ChatState>) => {
    setChatState(prev => ({ ...prev, ...updates }));
  }, []);

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

  const simulateTyping = useCallback(async (duration = 1500) => {
    updateChatState({ isTyping: true });
    await new Promise(resolve => setTimeout(resolve, duration));
    updateChatState({ isTyping: false });
  }, [updateChatState]);

  // Chat history persistence
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
    updateChatState({ unreadCount: 0, hasNotification: false });
    
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
                }
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
  }, [updateChatState, user]);
  
  useEffect(() => {
    loadProducts();
  }, [refreshTrigger]);

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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
                  }
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper function to detect if follow-up questions are needed
  const needsFollowUpQuestions = (query: string): boolean => {
    const queryLower = query.toLowerCase();
    
    // Check for vague group size indicators
    const groupSizeIndicators = [
      'large group', 'big group', 'many people', 'several people', 'multiple people',
      'group of', 'team', 'family', 'office', 'workplace', 'school', 'class',
      'crowd', 'bunch', 'lot of people', 'everyone', 'staff', 'crew'
    ];
    
    // Check for vague quantity terms without specific numbers
    const vagueQuantityTerms = [
      'large', 'big', 'small', 'comprehensive', 'complete', 'full', 'extensive',
      'minimal', 'basic', 'maximum', 'bulk', 'lots', 'plenty', 'enough'
    ];
    
    // Check for specific number mentions (these don't need follow-up)
    const hasSpecificNumbers = /\b\d+\s*(people|person|individuals?|members?|users?)\b/.test(queryLower);
    
    // If specific numbers are mentioned, no follow-up needed
    if (hasSpecificNumbers) {
      return false;
    }
    
    // Check if any group size or vague quantity indicators are present
    const hasGroupIndicators = groupSizeIndicators.some(indicator => queryLower.includes(indicator));
    const hasVagueQuantity = vagueQuantityTerms.some(term => queryLower.includes(term));
    
    return hasGroupIndicators || hasVagueQuantity;
  };
  
  // Generate follow-up questions based on the query and context
  const generateFollowUpQuestions = (query: string, context: any): string => {
    const queryLower = query.toLowerCase();
    const questions = [];
    
    // Group size questions - only ask if not already specified
    if (!context.groupSize && (queryLower.includes('group') || queryLower.includes('team') || queryLower.includes('people') || queryLower.includes('large') || queryLower.includes('small'))) {
      questions.push('• How many people will be using this kit?');
    }
    
    // Context-specific questions
    if (queryLower.includes('work') || queryLower.includes('office') || queryLower.includes('business') || queryLower.includes('company')) {
      if (!context.groupSize) questions.push('• How many people will be covered by this kit?');
      questions.push('• What type of work environment? (office, construction, factory, retail, etc.)');
      questions.push('• Are there any specific workplace hazards to consider?');
    }
    
    if (queryLower.includes('travel') || queryLower.includes('trip')) {
      if (!context.duration) questions.push('• How long will your trip be?');
      if (!context.groupSize) questions.push('• How many people will be traveling?');
      questions.push('• What type of travel? (domestic, international, remote areas)');
    }
    
    if (queryLower.includes('outdoor') || queryLower.includes('camping') || queryLower.includes('hiking')) {
      if (!context.groupSize) questions.push('• How many people will be participating?');
      questions.push('• What outdoor activities will you be doing?');
      questions.push('• How remote will you be from medical facilities?');
    }
    
    if (queryLower.includes('family') || queryLower.includes('home') || queryLower.includes('personal')) {
      if (!context.groupSize) questions.push('• How many people will be using this kit?');
      questions.push('• Are there children involved? If so, what age ranges?');
      questions.push('• Any specific medical conditions or allergies to consider?');
    }
    
    if (queryLower.includes('individual') || queryLower.includes('personal') || queryLower.includes('myself')) {
      questions.push('• What activities or situations will you primarily use this for?');
      questions.push('• Do you have any medical conditions or take medications regularly?');
      questions.push('• Will this be for general use or specific activities?');
    }
    
    // Duration questions - only ask if not already specified
    if (!context.duration && !queryLower.includes('emergency') && !queryLower.includes('immediate')) {
      questions.push('• How long do you need the supplies to last?');
    }
    
    // Budget questions - only ask if not already specified
    if (!context.budget && !queryLower.match(/budget|price|cost|\$\d+/)) {
      questions.push('• Do you have a preferred budget range?');
    }
    
    // Special needs questions
    if (!context.specialNeeds || context.specialNeeds.length === 0) {
      questions.push('• Are there any specific medical conditions, allergies, or special requirements?');
    }
    
    // Default questions if none of the above apply
    if (questions.length === 0) {
      questions.push('• How many people will be using this kit?');
      questions.push('• What specific situation or environment is this for?');
      questions.push('• Any particular medical needs or concerns?');
    }
    
    return `To create the best first aid kit for your needs, I'd like to know a bit more:\n\n${questions.join('\n')}\n\nPlease provide as much detail as you can so I can recommend the right quantities and products for your situation.`;
  };

  // Add the extractContextFromQuery function here, before handleSendMessage
  const extractContextFromQuery = (query: string): { kitType?: string; scenario?: string; budget?: number; groupSize?: number; duration?: string; specialNeeds?: string[] } => {
    const queryLower = query.toLowerCase();
    
    // Extract kit type
    let kitType: string | undefined;
    if (queryLower.includes('travel') || queryLower.includes('trip') || queryLower.includes('portable')) {
      kitType = 'travel';
    } else if (queryLower.includes('work') || queryLower.includes('office') || queryLower.includes('job')) {
      kitType = 'workplace';
    } else if (queryLower.includes('outdoor') || queryLower.includes('camping') || queryLower.includes('hiking')) {
      kitType = 'outdoor';
    } else if (queryLower.includes('child') || queryLower.includes('baby') || queryLower.includes('kids') || queryLower.includes('pediatric')) {
      kitType = 'pediatric';
    } else if (queryLower.includes('basic') || queryLower.includes('simple') || queryLower.includes('home')) {
      kitType = 'basic';
    }
    
    // Extract scenario
    let scenario: string | undefined;
    if (queryLower.includes('emergency') || queryLower.includes('urgent')) {
      scenario = 'emergency';
    } else if (queryLower.includes('sports') || queryLower.includes('exercise') || queryLower.includes('gym')) {
      scenario = 'sports';
    } else if (queryLower.includes('car') || queryLower.includes('vehicle')) {
      scenario = 'car travel';
    } else if (queryLower.includes('hiking') || queryLower.includes('camping') || queryLower.includes('outdoor')) {
      scenario = 'outdoor adventure';
    }
    
    // Extract budget
    let budget: number | undefined;
    const budgetMatch = queryLower.match(/(?:budget|price|cost|max)\s*(?:of\s*)?\$?(\d+)/);
    if (budgetMatch) {
      budget = parseInt(budgetMatch[1], 10);
    }
    
    // Extract group size
    let groupSize: number | undefined;
    const groupSizeMatch = queryLower.match(/\b(\d+)\s*(people|person|individuals?|members?|users?|family|team|staff|employees?)\b/);
    if (groupSizeMatch) {
      groupSize = parseInt(groupSizeMatch[1], 10);
    } else {
      // Try to infer from context
      if (queryLower.includes('large group') || queryLower.includes('big group')) {
        groupSize = 20; // Default for large group
      } else if (queryLower.includes('small group') || queryLower.includes('few people')) {
        groupSize = 5; // Default for small group
      } else if (queryLower.includes('family')) {
        groupSize = 4; // Default family size
      } else if (queryLower.includes('office') || queryLower.includes('workplace')) {
        groupSize = 15; // Default office size
      }
    }
    
    // Extract duration
    let duration: string | undefined;
    if (queryLower.match(/\b(\d+)\s*(day|days|week|weeks|month|months)\b/)) {
      const durationMatch = queryLower.match(/\b(\d+)\s*(day|days|week|weeks|month|months)\b/);
      if (durationMatch) {
        duration = `${durationMatch[1]} ${durationMatch[2]}`;
      }
    }
    
    // Extract special needs
    const specialNeeds: string[] = [];
    if (queryLower.includes('allerg')) specialNeeds.push('allergies');
    if (queryLower.includes('diabetic') || queryLower.includes('diabetes')) specialNeeds.push('diabetes');
    if (queryLower.includes('asthma')) specialNeeds.push('asthma');
    if (queryLower.includes('heart') || queryLower.includes('cardiac')) specialNeeds.push('cardiac');
    if (queryLower.includes('elderly') || queryLower.includes('senior')) specialNeeds.push('elderly care');
    if (queryLower.includes('children') || queryLower.includes('kids') || queryLower.includes('pediatric')) specialNeeds.push('pediatric');
    
    return { kitType, scenario, budget, groupSize, duration, specialNeeds: specialNeeds.length > 0 ? specialNeeds : undefined };
  };

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
      
      // Search for relevant products using enhanced RAG
      const relevantProducts = await openRouterService.searchProducts(content, products);
      
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

      // Try to generate kit using OpenRouter first
      let generatedKit: GeneratedKit;
      try {
        generatedKit = await openRouterService.generateFirstAidKit({
          userQuery: content,
          availableProducts: relevantProducts.slice(0, 50), // Limit for API efficiency
          kitType: context.kitType as any,
          scenario: context.scenario,
          budget: context.budget,
          groupSize: context.groupSize,
          duration: context.duration,
          specialNeeds: context.specialNeeds,
          onProgress
        });
      } catch (openRouterError) {
        console.warn('OpenRouter failed, falling back to Gemini:', openRouterError);
        // Fallback to Gemini service
        try {
          generatedKit = await geminiService.generateFirstAidKit({
            userQuery: content,
            availableProducts: relevantProducts.slice(0, 50), // Limit for API efficiency
            kitType: context.kitType as any,
            scenario: context.scenario,
            budget: context.budget,
            onProgress
          });
        } catch (geminiError) {
          console.warn('Gemini failed, falling back to rule-based generation:', geminiError);
          // Final fallback to rule-based generation
          try {
            generatedKit = openRouterService.generateFallbackKit({
              userQuery: content,
              availableProducts: relevantProducts.slice(0, 50),
              kitType: context.kitType as any,
              scenario: context.scenario,
              budget: context.budget,
              groupSize: context.groupSize
            });
          } catch (ruleBasedError) {
            console.error('All AI services failed:', ruleBasedError);
            throw new Error('Failed to generate first aid kit with all available methods. Please try again later.');
          }
        }
      }

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

  const handleBuildKit = (kit: GeneratedKit) => {
    // Create kit data for URL parameters
    const kitData = kit.items.map(item => ({
      id: item.product_id,
      name: item.product_name,
      brand: item.product_brand,
      category: item.product_category,
      // Set both imageUrl and product_image_url for compatibility
      imageUrl: item.product_image_url || '/placeholder.svg',
      product_image_url: item.product_image_url || '/placeholder.svg',
      image_url: item.product_image_url || '/placeholder.svg', // Add this for consistency
      price: item.price,
      quantity: item.quantity,
      description: `${item.product_name} - ${item.reasoning}`,
      // Add offers array for proper link handling
      offers: item.offers && item.offers.length > 0 
        ? item.offers 
        : [{
            name: 'Amazon',
            url: `https://www.amazon.com/dp/${(item as any).asin || 'B0'}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`,
            price: item.price || 0,
            lastUpdated: new Date().toISOString()
          }]
    }));

    // Create deep link URL with kit data
    const kitParam = encodeURIComponent(JSON.stringify(kitData));
    const buildUrl = `/build?kit=${kitParam}&ai=true`;
    
    // Navigate to build page with kit data
    navigate(buildUrl);
    updateChatState({ isOpen: false });
    toast.success(`Generated first aid kit with ${kit.items.length} items! Opening Build page...`);
  };

  const handleCustomizeKit = (kit: GeneratedKit, action: 'add' | 'remove' | 'update', productId?: string, newQuantity?: number) => {
    // Track user preferences
    const preferenceData = {
      action,
      kitName: kit.name,
      productId: productId || null,
      timestamp: new Date().toISOString()
    };
    
    // Store preferences in localStorage
    try {
      const existingPreferences = JSON.parse(localStorage.getItem('chatbot-preferences') || '[]');
      existingPreferences.push(preferenceData);
      localStorage.setItem('chatbot-preferences', JSON.stringify(existingPreferences.slice(-100))); // Keep last 100 preference items
    } catch (error) {
      console.warn('Failed to save preferences:', error);
    }
    
    // Save preferences to Appwrite for authenticated users
    const savePreferencesToAppwrite = async () => {
      if (user) {
        try {
          await databases.createDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'chatPreferences',
            'unique()',
            {
              userId: user.$id,
              action,
              kitName: kit.name,
              productId: productId || null,
              timestamp: new Date().toISOString()
            }
          );
        } catch (error) {
          console.warn('Failed to save preferences to Appwrite:', error);
        }
      }
    };
    
    savePreferencesToAppwrite();
    
    // Create a copy of the kit to modify
    const updatedKit = { ...kit };
    
    switch (action) {
      case 'add':
        // In a real implementation, we would show a product selector here
        toast.info('In a full implementation, this would open a product selector');
        break;
        
      case 'remove':
        if (productId) {
          updatedKit.items = updatedKit.items.filter(item => item.product_id !== productId);
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
          toast.success('Item removed from kit');
        }
        break;
        
      case 'update':
        if (productId && newQuantity !== undefined) {
          updatedKit.items = updatedKit.items.map(item => {
            if (item.product_id === productId) {
              return {
                ...item,
                quantity: newQuantity
              };
            }
            return item;
          });
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
          toast.success('Item quantity updated');
        }
        break;
    }
  };

  const handleQuickAction = (query: string) => {
    handleSendMessage(query);
  };

  // State for showing the feature tooltip
  const [showFeatureTooltip, setShowFeatureTooltip] = useState(true);

  const toggleChat = () => {
    // Hide the tooltip when the chat is opened
    setShowFeatureTooltip(false);
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

  const handleFeedback = useCallback((messageId: string, feedback: 'helpful' | 'not-helpful') => {
    // Track interaction
    onInteraction?.(`feedback-${feedback}`);

    // Update message with feedback
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          feedback
        };
      }
      return msg;
    }));
    
    // Store feedback in localStorage for future learning
    try {
      const feedbackData = {
        messageId,
        feedback,
        timestamp: new Date().toISOString()
      };
      
      const existingFeedback = JSON.parse(localStorage.getItem('chatbot-feedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('chatbot-feedback', JSON.stringify(existingFeedback.slice(-50))); // Keep last 50 feedback items
    } catch (error) {
      console.warn('Failed to save feedback:', error);
    }
    
    // Save feedback to Appwrite for authenticated users
    const saveFeedbackToAppwrite = async () => {
      if (user) {
        try {
          await databases.createDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'chatFeedback',
            'unique()',
            {
              userId: user.$id,
              messageId,
              feedback,
              timestamp: new Date().toISOString()
            }
          );
        } catch (error) {
          console.warn('Failed to save feedback to Appwrite:', error);
        }
      }
    };
    
    saveFeedbackToAppwrite();
    
    // Show confirmation
    toast.success(feedback === 'helpful' ? 'Thanks for your feedback!' : 'Thanks, we\'ll improve our recommendations.');
  }, [onInteraction, user]);

  return (
    <>
      {/* Modern Floating Chat Button inspired by ChatBot.com */}
      <AnimatePresence>
        {!chatState.isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={`fixed ${isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6'} z-50`}
          >
            <TooltipProvider>
              <Tooltip open={showFeatureTooltip} onOpenChange={setShowFeatureTooltip}>
                <TooltipTrigger asChild>
                  <div className="relative group">

                    
                    <Button
                      onClick={toggleChat}
                      className="
                        relative h-16 w-16 rounded-full shadow-xl 
                        bg-gradient-to-br from-red-500 via-red-500 to-red-600
                        hover:from-red-400 hover:via-red-500 hover:to-red-600
                        border-0 transition-all duration-300 ease-out
                        hover:scale-105 active:scale-95
                        group overflow-hidden
                        before:absolute before:inset-0 before:rounded-full
                        before:bg-gradient-to-br before:from-white/30 before:to-transparent
                        before:opacity-0 hover:before:opacity-100 before:transition-opacity
                      "
                      size="lg"
                      aria-label="Open Medical Assistant"
                    >
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 rounded-full" />
                      
                      {/* Icon with subtle animation */}
                      <MessageCircle className="h-7 w-7 text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 relative z-10" />
                      
                      {/* Modern glow effect */}
                      <div className="absolute inset-0 rounded-full bg-red-500/50 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                    </Button>
                    

                    
                    {/* Enhanced Notification Badge */}
                    {chatState.unreadCount > 0 && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="absolute -top-2 -left-2 h-6 w-6 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-background z-20"
                      >
                        {chatState.unreadCount > 9 ? '9+' : chatState.unreadCount}
                      </motion.div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  align="end" 
                  className="
                    rounded-xl bg-background/95 backdrop-blur-md border border-border/50 
                    shadow-2xl px-4 py-3 text-sm max-w-[200px] leading-relaxed
                    animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2
                  "
                  sideOffset={8}
                  onPointerDownOutside={(e) => e.preventDefault()}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="h-4 w-4 text-red-500 dark:text-red-400" />
                    <span className="font-semibold text-foreground">Medical Assistant</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Get personalized first aid kit recommendations
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Chat Dialog inspired by ChatBot.com */}
      <Dialog open={chatState.isOpen} onOpenChange={toggleChat}>
        <DialogContent 
          className={`
            fixed ${isMobile ? 'inset-4 top-auto' : 'bottom-6 right-6 top-auto left-auto'} 
            ${isMobile ? 'w-auto' : 'w-[400px]'} max-w-[calc(100vw-3rem)] 
            ${isMobile ? 'h-[calc(100vh-8rem)]' : 'h-[650px]'} max-h-[calc(100vh-3rem)] 
            p-0 gap-0 translate-x-0 translate-y-0 
            overflow-hidden [&>button]:hidden
            border border-border/30 shadow-2xl
            bg-background/98 backdrop-blur-xl
            ${isMobile ? 'rounded-2xl' : 'rounded-3xl'}
            animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4
            duration-300
          `}
        >
          {/* Modern Chat Header inspired by ChatBot.com */}
          <DialogHeader className={`${isMobile ? 'p-3 pb-2' : 'p-4 pb-3'} border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white/90 to-gray-50/90 dark:from-gray-900/90 dark:to-gray-800/90 flex-shrink-0 ${isMobile ? 'rounded-t-2xl' : 'rounded-t-3xl'} backdrop-blur-sm`}>
            <div className="flex items-center justify-between">
              <DialogTitle className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'} text-base font-semibold truncate`}>
                <div className="relative">
                  <Avatar className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full ring-2 ring-red-500/20 dark:ring-red-400/20 ring-offset-2 ring-offset-background`}>
                    <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 text-white rounded-full">
                      <Bot className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className={`truncate ${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 dark:text-white`}>Medical Assistant</span>
                  <div className="flex items-center gap-2">
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-300`}>
                      {chatState.isTyping ? 'Typing...' : 'Ready to help'}
                    </span>
                  </div>
                </div>
              </DialogTitle>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChatHistory}
                  className={`${isMobile ? 'h-8 w-8' : 'h-9 w-9'} p-0 hover:bg-muted/60 rounded-full transition-all duration-200 hover:scale-105`}
                  title="Clear chat history"
                >
                  <MoreHorizontal className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground hover:text-foreground`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleChat}
                  className={`${isMobile ? 'h-8 w-8' : 'h-9 w-9'} p-0 hover:bg-muted/60 rounded-full transition-all duration-200 hover:scale-105`}
                  aria-label="Close chat"
                >
                  <X className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground hover:text-foreground`} />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Removed the isMinimized conditional wrapper */}
          <div className="flex flex-col h-full min-h-0">
            {/* Quick Actions - Show when no messages or just welcome message */}
            {messages.length <= 1 && (
              <div className="p-4 pb-2">
                <div className="text-xs text-muted-foreground mb-2 font-medium">Quick Start:</div>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleQuickAction(action.query)}
                      className="
                        p-2 text-xs bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700
                        rounded-xl transition-all duration-200 text-left
                        border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600
                        shadow-sm hover:shadow-md
                        group relative overflow-hidden
                      "
                      disabled={isLoading}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      <div className="font-medium text-gray-900 dark:text-gray-100 relative z-10">{action.label}</div>
                    </motion.button>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            )}

            {/* Enhanced Messages Area */}
            <ScrollArea className="flex-1 min-h-0">
              <div className={`${isMobile ? 'p-3 space-y-3 pb-3' : 'p-4 space-y-4 pb-4'}`}>
                <AnimatePresence mode="popLayout">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                      <div className={`flex items-start ${isMobile ? 'gap-2' : 'gap-3'} ${isMobile ? 'max-w-[95%]' : 'max-w-[85%]'} min-w-0`}>
                        {message.type === 'bot' && (
                          <Avatar className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} mt-1 flex-shrink-0 ring-1 ring-border/20`}>
                            <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              <Bot className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                            </AvatarFallback>
                          </Avatar>
                        )}
                          
                        <div
                          className={`
                              ${isMobile ? 'px-3 py-2' : 'px-4 py-3'} ${isMobile ? 'text-sm' : 'text-sm'} leading-relaxed ${isMobile ? 'rounded-xl' : 'rounded-2xl'} shadow-sm
                              ${message.type === 'user' 
                                ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-md border border-primary/20' 
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-md border border-gray-200 dark:border-gray-700'
                              }
                              ${message.status === 'error' ? 'border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20' : ''}
                              backdrop-blur-sm
                            `}
                        >
                          <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere font-medium">
                            {message.content}
                          </div>
                            
                          {/* Enhanced Kit Preview */}
                          {message.kit && (
                            <motion.div 
                              className="mt-4 space-y-3"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              transition={{ delay: 0.2 }}
                            >
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <Package2 className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Medical Kit: {message.kit.name}</span>
                                </div>
                                  
                                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
                                  <div className="flex items-center gap-1">
                                    <Package className="h-3 w-3" />
                                    <span>{message.kit.items.length} items</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>${message.kit.totalPrice.toFixed(2)}</span>
                                  </div>
                                </div>
                                  
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {message.kit.items.slice(0, 3).map((item, index) => (
                                    <Badge 
                                      key={index} 
                                      variant="secondary" 
                                      className="text-xs truncate max-w-[100px] rounded-full" 
                                      title={item.product_name}
                                    >
                                      {item.product_name}
                                    </Badge>
                                  ))}
                                  {message.kit.items.length > 3 && (
                                    <Badge variant="outline" className="text-xs flex-shrink-0 rounded-full">
                                      +{message.kit.items.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                                  
                                <div className="flex gap-2 mb-3">
                                  <motion.div
                                    className="flex-1"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Button
                                      size="sm"
                                      onClick={() => handleBuildKit(message.kit!)}
                                      className="
                                        w-full text-xs h-8 bg-primary hover:bg-primary/90 rounded-lg
                                        transition-all duration-200 hover:shadow-md
                                        relative overflow-hidden group
                                      "
                                    >
                                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                      <ExternalLink className="h-3 w-3 mr-2 flex-shrink-0 relative z-10" />
                                      <span className="truncate relative z-10">Build This Kit</span>
                                    </Button>
                                  </motion.div>
                                </div>
                                
                                {/* Kit Customization Options */}
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Customize this kit:</div>
                                  <div className="flex gap-1 flex-wrap">
                                    <motion.div
                                      className="flex-1 min-w-[80px]"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full h-7 text-xs hover:bg-green-50 hover:border-green-200 hover:text-green-700 dark:hover:bg-green-950/20 transition-all duration-200"
                                        onClick={() => handleCustomizeKit(message.kit!, 'add')}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Item
                                      </Button>
                                    </motion.div>
                                    <motion.div
                                      className="flex-1 min-w-[80px]"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full h-7 text-xs hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 dark:hover:bg-blue-950/20 transition-all duration-200"
                                        onClick={() => {
                                          // Show kit items for quantity adjustment
                                          toast.info('In a full implementation, this would show item quantity controls');
                                        }}
                                      >
                                        <Settings className="h-3 w-3 mr-1" />
                                        Adjust
                                      </Button>
                                    </motion.div>
                                  </div>
                                </div>
                                
                                {/* Feedback Collection */}
                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">How was this recommendation?</div>
                                  <div className="flex gap-1">
                                    <motion.div
                                      className="flex-1"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full h-7 text-xs hover:bg-green-50 hover:border-green-200 hover:text-green-700 dark:hover:bg-green-950/20 transition-all duration-200"
                                        onClick={() => handleFeedback(message.id, 'helpful')}
                                      >
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Helpful
                                      </Button>
                                    </motion.div>
                                    <motion.div
                                      className="flex-1"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full h-7 text-xs hover:bg-red-50 hover:border-red-200 hover:text-red-700 dark:hover:bg-red-950/20 transition-all duration-200"
                                        onClick={() => handleFeedback(message.id, 'not-helpful')}
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Not Helpful
                                      </Button>
                                    </motion.div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                            
                          {/* Message Metadata */}
                          <div className="flex items-center justify-between mt-2 pt-1">
                            <div className="text-xs opacity-60">
                              {message.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                              
                            <div className="flex items-center gap-1">
                              {message.status === 'delivered' && message.type === 'user' && (
                                <CheckCircle2 className="h-3 w-3 text-primary" />
                              )}
                              {message.status === 'error' && (
                                <AlertCircle className="h-3 w-3 text-destructive" />
                              )}
                            </div>
                          </div>
                        </div>
                          
                        {message.type === 'user' && (
                          <Avatar className="h-7 w-7 mt-1 flex-shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                  
                {/* Enhanced Typing Indicator with Progress */}
                {(isLoading || chatState.isTyping || progressState.isActive) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start gap-2">
                      <Avatar className="h-7 w-7 mt-1 flex-shrink-0">
                        <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          <Bot className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="chat-message-bot p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                        {(isLoading || progressState.isActive) ? (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {progressState.isActive ? (progressState.message || 'Processing...') : 'Creating your first aid kit...'}
                              </span>
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 ml-4">
                                {progressState.isActive ? `${progressState.progress}%` : '0%'}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden mt-3">
                              <div 
                                className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                                style={{ 
                                  width: progressState.isActive ? `${progressState.progress}%` : '0%',
                                  animation: progressState.isActive ? 'none' : 'pulse 2s infinite'
                                }}
                              />
                            </div>
                            {progressState.stage && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Stage: {progressState.stage}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="chat-typing">
                              <div className="chat-typing-dot"></div>
                              <div className="chat-typing-dot"></div>
                              <div className="chat-typing-dot"></div>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Typing...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
                  
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Modern Input Area inspired by ChatBot.com */}
            <div className={`${isMobile ? 'p-4' : 'p-6'} border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0`}>
              <div className={`flex ${isMobile ? 'gap-2' : 'gap-3'} items-end`}>
                <div className="flex-1 min-w-0 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about first aid kits, medical supplies..."
                    disabled={isLoading}
                    className={`
                      ${isMobile ? 'text-sm' : 'text-sm'} resize-none border-border/30 
                      focus:border-primary/50 transition-all duration-200
                      bg-white dark:bg-gray-800
                      ${isMobile ? 'rounded-lg' : 'rounded-xl'} ${isMobile ? 'px-3 py-2' : 'px-4 py-3'} pr-12
                      shadow-sm hover:shadow-md
                      focus:ring-2 focus:ring-primary/20
                      placeholder:text-gray-500 dark:placeholder:text-gray-400
                      ${isMobile ? 'min-h-[40px]' : 'min-h-[44px]'}
                    `}
                    maxLength={500}
                    aria-label="Chat input"
                  />
                  {/* Character count indicator */}
                  <div className={`absolute ${isMobile ? 'right-2 top-1/2' : 'right-3 top-1/2'} -translate-y-1/2`}>
                    <span className={`text-xs transition-colors ${
                      inputValue.length > 450 
                        ? 'text-amber-500' 
                        : inputValue.length > 400 
                        ? 'text-muted-foreground' 
                        : 'text-muted-foreground/50'
                    }`}>
                      {inputValue.length > 400 && `${inputValue.length}/500`}
                    </span>
                  </div>
                </div>
                  
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    size="sm"
                    className={`
                      ${isMobile ? 'h-10 w-10' : 'h-11 w-11'} p-0 flex-shrink-0 ${isMobile ? 'rounded-lg' : 'rounded-xl'}
                      bg-gradient-to-br from-primary to-primary/90
                      hover:from-primary/90 hover:to-primary
                      shadow-md hover:shadow-lg
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      disabled:hover:scale-100
                      relative overflow-hidden
                      before:absolute before:inset-0 before:bg-white/20
                      before:opacity-0 hover:before:opacity-100
                      before:transition-opacity before:duration-200
                    `}
                    aria-label="Send message"
                  >
                    <motion.div
                      animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                      transition={isLoading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                    >
                      {isLoading ? (
                        <Loader2 className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                      ) : (
                        <Send className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                      )}
                    </motion.div>
                  </Button>
                </motion.div>
              </div>
                
              <div className={`flex items-center justify-between ${isMobile ? 'mt-2' : 'mt-3'} ${isMobile ? 'text-xs' : 'text-xs'}`}>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Bot className={`${isMobile ? 'h-3 w-3' : 'h-3 w-3'}`} />
                  <span>Powered by AI</span>
                </div>
                {!isMobile && (
                  <div className="text-gray-500 dark:text-gray-500">
                    Press Enter to send
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatBot;