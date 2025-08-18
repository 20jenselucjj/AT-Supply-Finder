import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, VendorOffer } from '@/lib/types';
import { useAuth } from './auth-context';
import { supabase } from '@/lib/supabase';

export interface KitItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  rating?: number;
  features?: string[];
  offers: VendorOffer[];
  imageUrl?: string;
  asin?: string;
  compatibleWith?: string[];
  dimensions?: string;
  weight?: string;
  material?: string;
  isFavorite?: boolean;
  quantity: number;
}

export interface SavedKit {
  id: string;
  name: string;
  description?: string;
  kit_data: KitItem[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Kit {
  id: string;
  name: string;
  items: KitItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface KitContextType {
  kit: KitItem[];
  addToKit: (product: Product, quantity?: number) => void;
  removeFromKit: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearKit: () => void;
  kitCount: number;
  getProductQuantity: (productId: string) => number;
  getVendorTotals: () => { vendor: string; total: number; url: string }[];
  saveKit: (name: string, description?: string, isPublic?: boolean) => Promise<void>;
  loadKit: (kitId: string) => Promise<void>;
  getUserKits: () => Promise<SavedKit[]>;
  deleteKit: (kitId: string) => Promise<void>;
  loading: boolean;
  savedKits: SavedKit[];
}

const KitContext = createContext<KitContextType | undefined>(undefined);

export const useKit = () => {
  const context = useContext(KitContext);
  if (!context) {
    throw new Error('useKit must be used within a KitProvider');
  }
  return context;
};

interface KitProviderProps {
  children: ReactNode;
}

export const KitProvider: React.FC<KitProviderProps> = ({ children }) => {
  const [kit, setKit] = useState<KitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedKits, setSavedKits] = useState<SavedKit[]>([]);
  const { user, loading: authLoading } = useAuth();
  
  // Initialize kit from localStorage for anonymous users
  useEffect(() => {
    if (user === null && !authLoading) {
      const savedKit = localStorage.getItem('wrap-wizard-kit');
      if (savedKit) {
        try {
          setKit(JSON.parse(savedKit));
        } catch (e) {
          console.error('Failed to parse saved kit', e);
        }
      }
      setLoading(false);
    } else if (user !== null && !authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Save kit to localStorage whenever it changes for anonymous users
  useEffect(() => {
    if (user === null && !authLoading) {
      localStorage.setItem('wrap-wizard-kit', JSON.stringify(kit));
    }
  }, [kit, user, authLoading]);

  const addToKit = (product: Product, quantity: number = 1) => {
    setKit(prevKit => {
      const existingItem = prevKit.find(item => item.id === product.id);
      if (existingItem) {
        const updated = prevKit.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        const live = document.getElementById('live-region');
        if (live) live.textContent = `${quantity} added: ${product.name} (total ${existingItem.quantity + quantity})`;
        return updated;
      } else {
        const updated = [...prevKit, { ...product, quantity }];
        const live = document.getElementById('live-region');
        if (live) live.textContent = `${product.name} added to kit`;
        return updated;
      }
    });
  };

  const removeFromKit = (productId: string) => {
    setKit(prevKit => prevKit.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromKit(productId);
      return;
    }
    
    setKit(prevKit =>
      prevKit.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearKit = () => {
    setKit([]);
  };

  const kitCount = kit.reduce((total, item) => total + item.quantity, 0);

  const getProductQuantity = (productId: string): number => {
    const item = kit.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const getVendorTotals = () => {
    // Create a map of vendor totals
    const vendorTotals = new Map<string, { total: number; url: string }>();
    
    // Iterate through each item in the kit
    kit.forEach(item => {
      // For each item, iterate through its offers
      item.offers.forEach(offer => {
        const vendorName = offer.name;
        const itemTotal = offer.price * item.quantity;
        
        if (vendorTotals.has(vendorName)) {
          const current = vendorTotals.get(vendorName)!;
          vendorTotals.set(vendorName, {
            total: current.total + itemTotal,
            url: offer.url
          });
        } else {
          vendorTotals.set(vendorName, {
            total: itemTotal,
            url: offer.url
          });
        }
      });
    });
    
    // Convert map to array
    return Array.from(vendorTotals.entries()).map(([vendor, data]) => ({
      vendor,
      total: parseFloat(data.total.toFixed(2)),
      url: data.url
    }));
  };

  // Save current kit to user's account
  const saveKit = async (name: string, description?: string, isPublic: boolean = false) => {
    if (!user) {
      throw new Error('User must be logged in to save kit');
    }
    
    if (kit.length === 0) {
      throw new Error('Cannot save empty kit');
    }

    try {
      const { data, error } = await supabase
        .from('user_kits')
        .insert({
          user_id: user.id,
          name,
          description,
          kit_data: kit,
          is_public: isPublic
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh saved kits list
      await getUserKits();
      
      return data;
    } catch (error) {
      console.error('Error saving kit:', error);
      throw error;
    }
  };

  // Load a specific kit by ID
  const loadKit = async (kitId: string) => {
    if (!user) {
      throw new Error('User must be logged in to load kit');
    }

    try {
      const { data, error } = await supabase
        .from('user_kits')
        .select('*')
        .eq('id', kitId)
        .single();

      if (error) throw error;
      
      if (data) {
        setKit(data.kit_data);
      }
    } catch (error) {
      console.error('Error loading kit:', error);
      throw error;
    }
  };

  // Get all user's saved kits
  const getUserKits = async (): Promise<SavedKit[]> => {
    if (!user) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('user_kits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setSavedKits(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching user kits:', error);
      return [];
    }
  };

  // Delete a saved kit
  const deleteKit = async (kitId: string) => {
    if (!user) {
      throw new Error('User must be logged in to delete kit');
    }

    try {
      const { error } = await supabase
        .from('user_kits')
        .delete()
        .eq('id', kitId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Refresh saved kits list
      await getUserKits();
    } catch (error) {
      console.error('Error deleting kit:', error);
      throw error;
    }
  };

  // Load user's saved kits when user changes
  useEffect(() => {
    if (user && !authLoading) {
      getUserKits();
    } else if (!user) {
      setSavedKits([]);
    }
  }, [user, authLoading]);

  return (
    <KitContext.Provider
      value={{
        kit,
        addToKit,
        removeFromKit,
        updateQuantity,
        clearKit,
        kitCount,
        getProductQuantity,
        getVendorTotals,
        saveKit,
        loadKit,
        getUserKits,
        deleteKit,
        loading,
        savedKits
      }}
    >
      {children}
    </KitContext.Provider>
  );
};