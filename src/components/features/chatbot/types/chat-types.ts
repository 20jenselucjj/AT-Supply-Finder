import type { GeneratedKit } from '@/lib/ai/openrouter-service';
import type { Product } from '@/lib/types/types';

export interface Message {
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

export interface ChatState {
  isOpen: boolean;
  isTyping: boolean;
  connectionStatus: 'online' | 'offline' | 'connecting';
  unreadCount: number;
  hasNotification: boolean;
}

export interface ProgressState {
  stage: string;
  progress: number;
  message: string;
  isActive: boolean;
}

export interface ChatContext {
  kitType?: string;
  scenario?: string;
  budget?: number;
  groupSize?: number;
  duration?: string;
  specialNeeds?: string[];
}

export interface QuickAction {
  label: string;
  query: string;
}

export interface ChatBotProps {
  apiKey: string;
  onInteraction?: (interactionType: string) => void;
}