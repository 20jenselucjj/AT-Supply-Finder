import React, { createContext, useContext, useCallback, useState } from 'react';

interface ProductRefreshContextType {
  refreshTrigger: number;
  triggerProductRefresh: () => void;
}

const ProductRefreshContext = createContext<ProductRefreshContextType | undefined>(undefined);

export const useProductRefresh = () => {
  const context = useContext(ProductRefreshContext);
  if (context === undefined) {
    throw new Error('useProductRefresh must be used within a ProductRefreshProvider');
  }
  return context;
};

interface ProductRefreshProviderProps {
  children: React.ReactNode;
}

export const ProductRefreshProvider: React.FC<ProductRefreshProviderProps> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerProductRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const value = {
    refreshTrigger,
    triggerProductRefresh
  };

  return (
    <ProductRefreshContext.Provider value={value}>
      {children}
    </ProductRefreshContext.Provider>
  );
};