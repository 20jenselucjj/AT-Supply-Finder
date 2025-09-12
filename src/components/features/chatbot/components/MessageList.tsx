import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, CheckCircle2, AlertCircle, Package, DollarSign, Package2, ExternalLink, Plus, Settings, CheckCircle2 as CheckIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message, ProgressState, QuickAction } from '../types/chat-types';
import { useIsMobile } from '@/hooks/use-mobile';
import KitPreview from './KitPreview';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  chatState: any;
  progressState: ProgressState;
  handleQuickAction: (query: string) => void;
  handleBuildKit: (kit: any) => void;
  handleCustomizeKit: (kit: any, action: 'add' | 'remove' | 'update', productId?: string, newQuantity?: number) => void;
  handleFeedback: (messageId: string, feedback: 'helpful' | 'not-helpful') => void;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Basic First Aid Kit', query: 'Create a basic first aid kit for home use' },
  { label: 'Travel First Aid Kit', query: 'Create a compact travel first aid kit' },
  { label: 'Workplace Kit', query: 'Create a first aid kit for my workplace' },
  { label: 'Outdoor Adventure Kit', query: 'Create a first aid kit for hiking and camping' }
];

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  chatState,
  progressState,
  handleQuickAction,
  handleBuildKit,
  handleCustomizeKit,
  handleFeedback
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Scroll to bottom of messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
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
                      <KitPreview
                        kit={message.kit}
                        handleBuildKit={handleBuildKit}
                        handleCustomizeKit={handleCustomizeKit}
                        handleFeedback={handleFeedback}
                        messageId={message.id}
                        isMobile={isMobile}
                      />
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
    </>
  );
};

export default MessageList;