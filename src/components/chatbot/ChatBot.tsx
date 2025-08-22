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
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { GeminiService, type GeneratedKit } from '@/lib/gemini-service';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/types';

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
}

interface ChatState {
  isOpen: boolean;
  isMinimized: boolean;
  isTyping: boolean;
  connectionStatus: 'online' | 'offline' | 'connecting';
  unreadCount: number;
  hasNotification: boolean;
}

const QUICK_ACTIONS = [
  { label: 'Basketball Kit', query: 'I need a complete basketball training kit for intermediate level' },
  { label: 'Home Gym', query: 'Help me build a home gym setup for strength training' },
  { label: 'Running Gear', query: 'I want gear for marathon training and running' },
  { label: 'Recovery Kit', query: 'Show me recovery and injury prevention equipment' }
];

interface ChatBotProps {
  apiKey: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ apiKey }) => {
  // Initialize chat state from storage
  const [chatState, setChatState] = useState<ChatState>(() => {
    const defaultState = {
      isOpen: false,
      isMinimized: false,
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
        content: 'Hi! I\'m your athletic training kit assistant. Tell me about your sport, training goals, or what kind of equipment you need, and I\'ll create a personalized kit for you!',
        timestamp: new Date(),
        status: 'delivered'
      }
    ];
  });
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const geminiService = new GeminiService({ apiKey });

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
        content: 'Hi! I\'m your athletic training kit assistant. Tell me about your sport, training goals, or what kind of equipment you need, and I\'ll create a personalized kit for you!',
        timestamp: new Date(),
        status: 'delivered' as const
      }
    ];
    setMessages(defaultMessages);
    updateChatState({ unreadCount: 0, hasNotification: false });
    try {
      localStorage.removeItem('chatbot-messages');
    } catch (error) {
      console.warn('Failed to clear chat history:', error);
    }
  }, [updateChatState]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem('chatbot-messages', JSON.stringify(messages));
      } catch (error) {
        console.warn('Failed to save chat history:', error);
      }
    }
  }, [messages]);

  // Save chat state to localStorage whenever it changes
  useEffect(() => {
    try {
      const stateToSave = {
        isMinimized: chatState.isMinimized,
        unreadCount: chatState.unreadCount,
        hasNotification: chatState.hasNotification
      };
      localStorage.setItem('chatbot-state', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save chat state:', error);
    }
  }, [chatState.isMinimized, chatState.unreadCount, chatState.hasNotification]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor_offers (*)
        `);
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputValue.trim();
    if (!content || isLoading) return;

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
      
      // Search for relevant products using RAG
      const relevantProducts = await geminiService.searchProducts(content, products);
      
      // Generate kit using Gemini 2.5 Flash
      const generatedKit = await geminiService.generateTrainingKit({
        userQuery: content,
        availableProducts: relevantProducts.slice(0, 50) // Limit for API efficiency
      });

      updateChatState({ connectionStatus: 'online' });

      const botMessage = addMessage({
        type: 'bot',
        content: `I've created a personalized training kit for you: **${generatedKit.name}**\n\n${generatedKit.description}\n\n**Kit includes ${generatedKit.items.length} items** with a total value of $${generatedKit.totalPrice.toFixed(2)}\n\n${generatedKit.reasoning}`,
        status: 'delivered',
        kit: generatedKit
      });

      // Show notification if chat is closed
      if (!chatState.isOpen) {
        updateChatState({ hasNotification: true, unreadCount: chatState.unreadCount + 1 });
        toast.success('Your training kit is ready!');
      }
      
    } catch (error) {
      console.error('Error generating kit:', error);
      updateChatState({ connectionStatus: 'offline' });
      
      addMessage({
        type: 'bot',
        content: 'I apologize, but I encountered an error while creating your kit. Please try rephrasing your request or try again later.',
        status: 'error'
      });
      
      toast.error('Failed to generate training kit');
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
      image: item.product_image_url,
      price: item.price,
      quantity: item.quantity,
      description: `${item.product_name} - ${item.reasoning}`
    }));

    // Create deep link URL with kit data
    const kitParam = encodeURIComponent(JSON.stringify(kitData));
    const buildUrl = `/build?kit=${kitParam}&ai=true`;
    
    // Navigate to build page with kit data
    navigate(buildUrl);
    updateChatState({ isOpen: false });
    toast.success(`Generated kit with ${kit.items.length} items! Opening Build page...`);
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

  const toggleMinimize = () => {
    updateChatState({ isMinimized: !chatState.isMinimized });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Enhanced Floating Chat Button */}
      <AnimatePresence>
        {!chatState.isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="relative">
              <Button
                onClick={toggleChat}
                size="lg"
                className={`
                  h-16 w-16 rounded-full shadow-lg hover:shadow-xl 
                  chat-button transition-all duration-300 
                  ${chatState.hasNotification ? 'chat-button-pulse' : ''}
                `}
                aria-label="Open chat assistant"
              >
                <motion.div
                  animate={chatState.hasNotification ? {
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  } : {}}
                  transition={{
                    duration: 0.6,
                    repeat: chatState.hasNotification ? Infinity : 0,
                    repeatDelay: 2
                  }}
                >
                  <MessageCircle className="h-7 w-7" />
                </motion.div>
              </Button>
              
              {/* Notification Badge */}
              {chatState.unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
                >
                  {chatState.unreadCount > 9 ? '9+' : chatState.unreadCount}
                </motion.div>
              )}
              
              {/* Connection Status Indicator */}
              <div className="absolute -bottom-1 -right-1">
                {chatState.connectionStatus === 'online' && (
                  <div className="h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm" 
                       title="Online" />
                )}
                {chatState.connectionStatus === 'offline' && (
                  <div className="h-4 w-4 bg-red-500 rounded-full border-2 border-white shadow-sm" 
                       title="Offline" />
                )}
                {chatState.connectionStatus === 'connecting' && (
                  <div className="h-4 w-4 bg-yellow-500 rounded-full border-2 border-white shadow-sm animate-pulse" 
                       title="Connecting" />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Chat Dialog */}
      <Dialog open={chatState.isOpen} onOpenChange={toggleChat}>
        <DialogContent 
          className="
            fixed bottom-6 right-6 top-auto left-auto 
            w-96 max-w-[calc(100vw-3rem)] 
            h-[600px] max-h-[calc(100vh-3rem)] 
            p-0 gap-0 translate-x-0 translate-y-0 
            overflow-hidden [&>button]:hidden
            border-2 border-border/50 shadow-2xl
            bg-background/95 backdrop-blur-md
          "
        >
          {/* Enhanced Chat Header */}
          <DialogHeader className="p-4 pb-3 border-b bg-muted/30 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3 text-base font-semibold truncate">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  {/* Status indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5">
                    {chatState.connectionStatus === 'online' && (
                      <Wifi className="h-3 w-3 text-green-500" />
                    )}
                    {chatState.connectionStatus === 'offline' && (
                      <WifiOff className="h-3 w-3 text-red-500" />
                    )}
                    {chatState.connectionStatus === 'connecting' && (
                      <Loader2 className="h-3 w-3 text-yellow-500 animate-spin" />
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="truncate text-sm font-semibold">Kit Assistant</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {chatState.connectionStatus === 'online' && 'Online'}
                    {chatState.connectionStatus === 'offline' && 'Offline'}
                    {chatState.connectionStatus === 'connecting' && 'Connecting...'}
                    {chatState.isTyping && 'Typing...'}
                  </span>
                </div>
              </DialogTitle>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChatHistory}
                  className="h-8 w-8 p-0 hover:bg-muted"
                  title="Clear chat history"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMinimize}
                  className="h-8 w-8 p-0 hover:bg-muted"
                  title={chatState.isMinimized ? "Maximize" : "Minimize"}
                >
                  {chatState.isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleChat}
                  className="h-8 w-8 p-0 hover:bg-muted"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {!chatState.isMinimized && (
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
                        onClick={() => handleQuickAction(action.query)}
                        className="
                          p-2 text-xs bg-muted hover:bg-muted/80 
                          rounded-lg transition-colors text-left
                          border border-border/50 hover:border-border
                        "
                        disabled={isLoading}
                      >
                        <div className="font-medium text-foreground">{action.label}</div>
                      </motion.button>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                </div>
              )}

              {/* Enhanced Messages Area */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 space-y-4 pb-4">
                  <AnimatePresence mode="popLayout">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex items-start gap-2 max-w-[85%] min-w-0">
                          {message.type === 'bot' && (
                            <Avatar className="h-7 w-7 mt-1 flex-shrink-0">
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                <Bot className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div
                            className={`
                              p-3 text-sm leading-relaxed
                              ${message.type === 'user' 
                                ? 'chat-message-user text-primary-foreground' 
                                : 'chat-message-bot'
                              }
                              ${message.status === 'error' ? 'border-l-4 border-red-500' : ''}
                            `}
                          >
                            <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere">
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
                                <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Package2 className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-sm">{message.kit.name}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
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
                                        className="text-xs truncate max-w-[100px]" 
                                        title={item.product_name}
                                      >
                                        {item.product_name}
                                      </Badge>
                                    ))}
                                    {message.kit.items.length > 3 && (
                                      <Badge variant="outline" className="text-xs flex-shrink-0">
                                        +{message.kit.items.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <Button
                                    size="sm"
                                    onClick={() => handleBuildKit(message.kit!)}
                                    className="w-full text-xs h-8 bg-primary hover:bg-primary/90"
                                  >
                                    <ExternalLink className="h-3 w-3 mr-2 flex-shrink-0" />
                                    <span className="truncate">Build This Kit</span>
                                  </Button>
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
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                )}
                                {message.status === 'error' && (
                                  <AlertCircle className="h-3 w-3 text-red-500" />
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
                  
                  {/* Enhanced Typing Indicator */}
                  {(isLoading || chatState.isTyping) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-start gap-2">
                        <Avatar className="h-7 w-7 mt-1 flex-shrink-0">
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            <Bot className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="chat-message-bot p-3">
                          <div className="flex items-center gap-2">
                            <div className="chat-typing">
                              <div className="chat-typing-dot"></div>
                              <div className="chat-typing-dot"></div>
                              <div className="chat-typing-dot"></div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {isLoading ? 'Creating your kit...' : 'Typing...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Enhanced Input Area */}
              <div className="p-4 border-t bg-background/50 flex-shrink-0">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 min-w-0">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Describe your training needs..."
                      disabled={isLoading}
                      className="
                        text-sm resize-none border-border/50 
                        focus:border-primary transition-colors
                        bg-background/50
                      "
                      maxLength={500}
                      aria-label="Chat input"
                    />
                  </div>
                  
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    size="sm"
                    className="h-10 w-10 p-0 flex-shrink-0 rounded-full"
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Powered by Gemini 2.5 Flash</span>
                    <div className="flex items-center gap-1">
                      {chatState.connectionStatus === 'online' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                      {chatState.connectionStatus === 'offline' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                      )}
                      {chatState.connectionStatus === 'connecting' && (
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                  <span className={inputValue.length > 450 ? 'text-orange-500' : ''}>
                    {inputValue.length}/500
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatBot;