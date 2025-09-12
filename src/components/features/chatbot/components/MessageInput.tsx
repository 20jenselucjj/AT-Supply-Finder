import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface MessageInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  isMobile: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  inputValue,
  setInputValue,
  handleSendMessage,
  handleKeyPress,
  isLoading,
  isMobile
}) => {
  return (
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
            onClick={handleSendMessage}
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
  );
};

export default MessageInput;