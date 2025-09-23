import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { databases } from '@/lib/api/appwrite';
import { Query } from 'appwrite';
import { Product } from '@/lib/types/types';

interface FavoritesContextType {
  favorites: string[]; // Array of product IDs
  favoriteProducts: Product[]; // Array of actual product objects
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  loading: boolean;
  refreshFavorites: () => Promise<void>;
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
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
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
      // Query user_favorites collection in Appwrite
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'userFavorites', // Make sure this collection exists in Appwrite
        [Query.equal('userId', user.$id)]
      );

      const favoriteIds = response.documents?.map((item: any) => item.productId) || [];
      setFavorites(favoriteIds);
      
      // Load actual product data for favorites
      if (favoriteIds.length > 0) {
        const productResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'products',
          [Query.equal('$id', favoriteIds)]
        );
        
        setFavoriteProducts(productResponse.documents.map(doc => ({
          id: doc.$id,
          name: doc.name,
          category: doc.category,
          brand: doc.brand,
          rating: doc.rating,
          price: doc.price,
          dimensions: doc.dimensions,
          weight: doc.weight,
          material: doc.material,
          features: doc.features ? doc.features.split('..') : [],
          imageUrl: doc.imageUrl,
          asin: doc.asin,
          affiliateLink: doc.affiliateLink,
          description: doc.description,
          offers: [] // We'll need to populate this separately
        })));
      } else {
        setFavoriteProducts([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavoriteProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshFavorites = async () => {
    if (user) {
      await loadFavorites();
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
      // Check if the favorite already exists
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'userFavorites',
        [
          Query.equal('userId', user.$id),
          Query.equal('productId', productId)
        ]
      );

      if (response.documents && response.documents.length > 0) {
        // Favorite exists, remove it
        const favoriteId = response.documents[0].$id;
        await databases.deleteDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'userFavorites',
          favoriteId
        );
        
        // Update local state
        setFavorites(prev => prev.filter(id => id !== productId));
      } else {
        // Favorite doesn't exist, add it
        await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'userFavorites',
          'unique()',
          {
            userId: user.$id,
            productId: productId
          }
        );
        
        // Update local state
        setFavorites(prev => [...prev, productId]);
      }
      
      // Refresh the favorites list
      await refreshFavorites();
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
        favoriteProducts,
        toggleFavorite,
        isFavorite,
        loading,
        refreshFavorites
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};