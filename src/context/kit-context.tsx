import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Product, VendorOffer } from '@/components/products/ProductCard';

export interface KitItem extends Product {
  quantity: number;
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
  getVendorTotals: () => { vendor: string; total: number; url: string }[];
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
  const [kit, setKit] = useState<KitItem[]>(() => {
    const savedKit = localStorage.getItem('wrap-wizard-kit');
    return savedKit ? JSON.parse(savedKit) : [];
  });

  // Save kit to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wrap-wizard-kit', JSON.stringify(kit));
  }, [kit]);

  const addToKit = (product: Product, quantity: number = 1) => {
    setKit(prevKit => {
      const existingItem = prevKit.find(item => item.id === product.id);
      if (existingItem) {
        return prevKit.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevKit, { ...product, quantity }];
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

  return (
    <KitContext.Provider
      value={{
        kit,
        addToKit,
        removeFromKit,
        updateQuantity,
        clearKit,
        kitCount,
        getVendorTotals
      }}
    >
      {children}
    </KitContext.Provider>
  );
};