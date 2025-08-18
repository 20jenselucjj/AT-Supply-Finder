import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { supabase } from '@/lib/supabase';

interface FavoritesContextType {
  favorites: string[]; // Array of product IDs
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  // Load user's favorites when user changes
  useEffect(() => {
    if (user && !authLoading) {
      loadFavorites();
    } else if (!user) {
      // For anonymous users, load from localStorage
      const savedFavorites = localStorage.getItem('wrap-wizard-favorites');
      if (savedFavorites) {
        try {
          setFavorites(JSON.parse(savedFavorites));
        } catch (e) {
          console.error('Failed to parse saved favorites', e);
        }
      }
      setLoading(false);
    }
  }, [user, authLoading]);

  // Save favorites to localStorage for anonymous users
  useEffect(() => {
    if (!user && !authLoading) {
      localStorage.setItem('wrap-wizard-favorites', JSON.stringify(favorites));
    }
  }, [favorites, user, authLoading]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_favorites')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const favoriteIds = data?.map(item => item.product_id) || [];
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      // For anonymous users, just update local state
      setFavorites(prev => 
        prev.includes(productId) 
          ? prev.filter(id => id !== productId)
          : [...prev, productId]
      );
      return;
    }

    try {
      const { data, error } = await supabase.rpc('toggle_favorite', {
        product_uuid: productId
      });

      if (error) throw error;

      // Update local state based on the result
      setFavorites(prev => 
        data // true means added, false means removed
          ? [...prev.filter(id => id !== productId), productId]
          : prev.filter(id => id !== productId)
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  const isFavorite = (productId: string): boolean => {
    return favorites.includes(productId);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        loading
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};