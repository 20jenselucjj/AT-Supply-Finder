import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatState } from '../types/chat-types';

interface ChatButtonProps {
  chatState: ChatState;
  toggleChat: () => void;
  isMobile: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({ chatState, toggleChat, isMobile }) => {
  const [showFeatureTooltip, setShowFeatureTooltip] = useState(true);

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
    </>
  );
};

export default ChatButton;