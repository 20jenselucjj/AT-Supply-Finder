import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, MoreHorizontal, Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChatState } from '../types/chat-types';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatWindowProps {
  chatState: ChatState;
  toggleChat: () => void;
  clearChatHistory: () => void;
  children: React.ReactNode;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  chatState, 
  toggleChat, 
  clearChatHistory, 
  children 
}) => {
  const isMobile = useIsMobile();

  return (
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
        <div className={`${isMobile ? 'p-3 pb-2' : 'p-4 pb-3'} border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white/90 to-gray-50/90 dark:from-gray-900/90 dark:to-gray-800/90 flex-shrink-0 ${isMobile ? 'rounded-t-2xl' : 'rounded-t-3xl'} backdrop-blur-sm`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-base font-semibold truncate">
              <div className="relative">
                <Avatar className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full ring-2 ring-red-500/20 dark:ring-red-400/20 ring-offset-2 ring-offset-background`}>
                  <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 text-white rounded-full">
                    <Bot className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 dark:text-white`}>Medical Assistant</span>
                <div className="flex items-center gap-2">
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-300`}>
                    {chatState.isTyping ? 'Typing...' : 'Ready to help'}
                  </span>
                </div>
              </div>
            </div>
            
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
        </div>

        {/* Chat Content */}
        <div className="flex flex-col h-full min-h-0">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatWindow;