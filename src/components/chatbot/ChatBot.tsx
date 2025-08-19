import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, Send, X, Loader2, Package, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { GeminiService, type GeneratedKit } from '@/lib/gemini-service';
// Kit context no longer needed for direct manipulation
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/types';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  kit?: GeneratedKit;
}

interface ChatBotProps {
  apiKey: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ apiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hi! I\'m your athletic training kit assistant. Tell me about your sport, training goals, or what kind of equipment you need, and I\'ll create a personalized kit for you!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const geminiService = new GeminiService({ apiKey });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Search for relevant products using RAG
      const relevantProducts = await geminiService.searchProducts(inputValue, products);
      
      // Generate kit using Gemini 2.5 Flash
      const generatedKit = await geminiService.generateTrainingKit({
        userQuery: inputValue,
        availableProducts: relevantProducts.slice(0, 50) // Limit for API efficiency
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `I've created a personalized training kit for you: **${generatedKit.name}**\n\n${generatedKit.description}\n\n**Kit includes ${generatedKit.items.length} items** with a total value of $${generatedKit.totalPrice.toFixed(2)}\n\n${generatedKit.reasoning}`,
        timestamp: new Date(),
        kit: generatedKit
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating kit:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'I apologize, but I encountered an error while creating your kit. Please try rephrasing your request or try again later.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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
    setIsOpen(false);
    toast.success(`Generated kit with ${kit.items.length} items! Opening Build page...`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="fixed bottom-6 right-6 top-auto left-auto w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] p-0 gap-0 translate-x-0 translate-y-0 overflow-hidden [&>button]:hidden"
        >
          <DialogHeader className="p-4 pb-2 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold truncate">
                <Package className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">Kit Assistant</span>
              </DialogTitle>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8 p-0"
                  title={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? '□' : '−'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {!isMinimized && (
            <div className="flex flex-col h-full min-h-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4 min-h-0">
                <div className="space-y-4 pb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] min-w-0 rounded-lg p-3 ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                          {message.content}
                        </div>
                        {message.kit && (
                          <div className="mt-3 space-y-2">
                            <div className="flex flex-wrap gap-1 max-w-full">
                              {message.kit.items.slice(0, 3).map((item, index) => (
                                <Badge key={index} variant="secondary" className="text-xs truncate max-w-[120px]" title={item.product_name}>
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
                              className="w-full text-xs h-8"
                              variant="default"
                            >
                              <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">Build This Kit</span>
                            </Button>
                          </div>
                        )}
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Creating your kit...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe your training needs..."
                    disabled={isLoading}
                    className="flex-1 min-w-0 text-sm"
                    maxLength={500}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="sm"
                    className="h-9 w-9 p-0 flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-2 truncate">
                  Powered by Gemini 2.5 Flash • {inputValue.length}/500
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