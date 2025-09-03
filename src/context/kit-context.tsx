import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, VendorOffer } from '@/lib/types';
import { useAuth } from './auth-context';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { convertToDatabaseCategory, convertToBuildPageCategory } from '@/lib/utils'; // Import conversion functions

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
  // For authenticated users, we'll load the kit from Appwrite when needed
  useEffect(() => {
    const loadUserKit = async () => {
      if (user !== null && !authLoading) {
        try {
          // Try to load the user's current kit from Appwrite
          const response = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'userKits',
            [Query.equal('userId', user.$id)]
          );
          
          if (response.documents && response.documents.length > 0) {
            const userKitDoc = response.documents[0];
            if (userKitDoc.kitData) {
              setKit(JSON.parse(userKitDoc.kitData));
            }
          }
        } catch (error) {
          console.error('Error loading user kit:', error);
          // Fall back to localStorage if Appwrite fails
          const savedKit = localStorage.getItem('wrap-wizard-kit');
          if (savedKit) {
            try {
              setKit(JSON.parse(savedKit));
            } catch (e) {
              console.error('Failed to parse saved kit', e);
            }
          }
        }
        setLoading(false);
      } else if (user === null && !authLoading) {
        const savedKit = localStorage.getItem('wrap-wizard-kit');
        if (savedKit) {
          try {
            setKit(JSON.parse(savedKit));
          } catch (e) {
            console.error('Failed to parse saved kit', e);
          }
        }
        setLoading(false);
      }
    };
    
    loadUserKit();
  }, [user, authLoading]);
  
  // Save kit to localStorage for anonymous users or to Appwrite for authenticated users
  useEffect(() => {
    const saveKitData = async () => {
      if (user !== null && !authLoading) {
        try {
          // Save to Appwrite for authenticated users
          const response = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'userKits',
            [Query.equal('userId', user.$id)]
          );
          
          const kitDataString = JSON.stringify(kit);
          
          if (response.documents && response.documents.length > 0) {
            // Update existing kit document
            const kitDocId = response.documents[0].$id;
            await databases.updateDocument(
              import.meta.env.VITE_APPWRITE_DATABASE_ID,
              'userKits',
              kitDocId,
              {
                kitData: kitDataString
              }
            );
          } else {
            // Create new kit document
            await databases.createDocument(
              import.meta.env.VITE_APPWRITE_DATABASE_ID,
              'userKits',
              'unique()',
              {
                userId: user.$id,
                name: 'Current Kit', // Default name for auto-saved kit
                description: 'Auto-saved current kit',
                kitData: kitDataString,
                isPublic: false
              }
            );
          }
        } catch (error) {
          console.error('Error saving user kit to Appwrite:', error);
          // Fall back to localStorage if Appwrite fails
          localStorage.setItem('wrap-wizard-kit', JSON.stringify(kit));
        }
      } else if (user === null && !authLoading) {
        // Save to localStorage for anonymous users
        localStorage.setItem('wrap-wizard-kit', JSON.stringify(kit));
      }
    };
    
    // Debounce the save operation
    const timeoutId = setTimeout(saveKitData, 1000);
    return () => clearTimeout(timeoutId);
  }, [kit, user, authLoading]);

  const addToKit = (product: Product, quantity: number = 1) => {
    // Create a utility function to normalize image properties
    const normalizeProductImage = (product: Product): string => {
      // Try all possible image property names that might be used
      return product.imageUrl || 
             (product as any).product_image_url || 
             product.image_url || 
             (product as any).imageURL || 
             (product as any).productImageURL ||
             (product as any).image ||
             (product as any).img ||
             (product as any).photo ||
             (product as any).picture ||
             '';
    };

    // Convert product category to build page category system
    const productWithConvertedCategory = {
      ...product,
      category: convertToBuildPageCategory(product.category),
      // Ensure imageUrl is properly set - preserve existing imageUrl if it exists
      // Also handle product_image_url from AI-generated kits and other variations
      imageUrl: product.imageUrl || normalizeProductImage(product),
      // Ensure offers array is properly structured with valid URLs
      offers: product.offers && product.offers.length > 0 
        ? product.offers.map(offer => ({
            ...offer,
            url: offer.url && offer.url !== '#' ? offer.url : `https://www.amazon.com/dp/${product.asin || 'B0'}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`
          }))
        : product.price 
          ? [{
              name: 'Direct',
              price: product.price,
              url: product.affiliateLink && product.affiliateLink !== '#' 
                ? product.affiliateLink 
                : `https://www.amazon.com/dp/${product.asin || 'B0'}/ref=nosim?tag=YOUR_ASSOCIATE_TAG`,
              lastUpdated: (product as any).updatedAt || new Date().toISOString()
            }]
          : []
    };
    
    setKit(prevKit => {
      const existingItem = prevKit.find(item => item.id === productWithConvertedCategory.id);
      if (existingItem) {
        const updated = prevKit.map(item =>
          item.id === productWithConvertedCategory.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        const live = document.getElementById('live-region');
        if (live) live.textContent = `${quantity} added: ${productWithConvertedCategory.name} (total ${existingItem.quantity + quantity})`;
        return updated;
      } else {
        const updated = [...prevKit, { ...productWithConvertedCategory, quantity }];
        const live = document.getElementById('live-region');
        if (live) live.textContent = `${productWithConvertedCategory.name} added to kit`;
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
      // For each item, iterate through its offers (with safety check)
      const offers = item.offers || [];
      offers.forEach(offer => {
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
      const kitData = {
        userId: user.$id,
        name,
        description,
        kitData: JSON.stringify(kit),
        isPublic: isPublic
      };

      // Add permissions using the correct Appwrite format
      const permissions = [
        `read("user:${user.$id}")`,  // Grant read permission to the current user
        `update("user:${user.$id}")`, // Grant update permission to the current user
        `delete("user:${user.$id}")`  // Grant delete permission to the current user
      ];
      
      if (isPublic) {
        permissions.push('read("any")'); // If the kit is public, allow anyone to read it
      }

      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'userKits', // Make sure this collection exists in Appwrite
        'unique()',
        kitData,
        permissions // Add permissions parameter
      );
      
      // Refresh saved kits list
      await getUserKits();
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
      const kitData = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'userKits',
        kitId
      );
      
      // Verify that the kit belongs to the current user or is public
      if (kitData.userId !== user.$id && !kitData.is_public) {
        throw new Error('You do not have permission to access this kit');
      }
      
      if (kitData) {
        setKit(kitData.kitData ? JSON.parse(kitData.kitData) : []);
      }
    } catch (error: any) {
      console.error('Error loading kit:', error);
      // Provide more specific error message for permission issues
      if (error.code === 401) {
        throw new Error('You do not have permission to access this kit');
      }
      throw error;
    }
  };

  // Get all user's saved kits
  const getUserKits = async (): Promise<SavedKit[]> => {
    if (!user) {
      return [];
    }

    try {
      // Use Appwrite SDK with proper query formatting
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'userKits',
        [
          Query.equal('userId', user.$id)
        ]
      );
      
      const kits = response.documents.map(doc => ({
        id: doc.$id,
        name: doc.name,
        description: doc.description,
        kit_data: doc.kitData ? JSON.parse(doc.kitData) : [],
        is_public: doc.isPublic,
        created_at: doc.$createdAt,
        updated_at: doc.$updatedAt
      })) || [];
      setSavedKits(kits);
      return kits;
    } catch (error: any) {
      console.error('Error fetching user kits:', error);
      // Add more specific error handling
      if (error.code === 401) {
        console.error('Permission denied: User lacks access to the userKits collection');
      }
      return [];
    }
  };

  // Delete a saved kit
  const deleteKit = async (kitId: string) => {
    if (!user) {
      throw new Error('User must be logged in to delete kit');
    }

    try {
      // First, check if the user has permission to delete this kit
      const kitData = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'userKits',
        kitId
      );
      
      // Verify ownership - only the creator can delete a kit
      if (kitData.userId !== user.$id) {
        throw new Error('You do not have permission to delete this kit');
      }
      
      await databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'userKits',
        kitId
      );
      
      // Refresh saved kits list
      await getUserKits();
    } catch (error: any) {
      console.error('Error deleting kit:', error);
      // Provide more specific error message for permission issues
      if (error.code === 401) {
        throw new Error('You do not have permission to delete this kit');
      }
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