import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { databases } from '@/lib/api/appwrite';
import { Query } from 'appwrite';
import { ShoppingCart, Package, DollarSign, Users, ChevronLeft, ChevronRight } from 'lucide-react';

// Enhanced Product Showcase with grid layout and interactive hover effects
const ProductShowcase: React.FC<{ products: SelectedProduct[] }> = ({ products }) => {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [currentMainImage, setCurrentMainImage] = useState(0);

  // Auto-rotate main image when not hovering
  useEffect(() => {
    if (products.length <= 1 || hoveredProduct) return;
    const interval = setInterval(() => {
      setCurrentMainImage((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [products.length, hoveredProduct]);

  if (products.length === 0) {
    return (
      <div className="relative w-full h-48 bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <span className="text-sm text-muted-foreground">No products in this kit</span>
        </div>
      </div>
    );
  }

  // Show different layouts based on product count
  if (products.length === 1) {
    const product = products[0];
    return (
      <div className="relative w-full h-48 bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden group">
        <div className="absolute inset-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-product.svg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-3 left-3 right-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="font-medium text-sm truncate">{product.name}</p>
          <p className="text-xs text-white/80">{product.brand}</p>
        </div>
      </div>
    );
  }

  if (products.length === 2) {
    return (
      <div className="relative w-full h-48 rounded-lg overflow-hidden">
        <div className="flex h-full gap-1">
          {products.map((product, index) => (
            <div 
              key={product.productId}
              className="relative flex-1 bg-gradient-to-br from-muted to-muted/50 overflow-hidden group cursor-pointer"
              onMouseEnter={() => setHoveredProduct(product.productId)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-product.svg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="font-medium text-xs truncate">{product.name}</p>
                <p className="text-xs text-white/80">{product.brand}</p>
              </div>
              {product.quantity > 1 && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {product.quantity}x
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // For 3+ products: Main image with thumbnail grid
  return (
    <div className="relative w-full h-48 rounded-lg overflow-hidden">
      <div className="flex h-full gap-1">
        {/* Main featured image (2/3 width) */}
        <div className="relative flex-[2] bg-gradient-to-br from-muted to-muted/50 overflow-hidden group">
          {products[currentMainImage]?.imageUrl ? (
            <img
              src={products[currentMainImage].imageUrl}
              alt={products[currentMainImage].name}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-product.svg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-3 left-3 right-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="font-medium text-sm truncate">{products[currentMainImage]?.name}</p>
            <p className="text-xs text-white/80">{products[currentMainImage]?.brand}</p>
          </div>
          {products[currentMainImage]?.quantity > 1 && (
            <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
              {products[currentMainImage].quantity}x
            </div>
          )}
        </div>

        {/* Thumbnail grid (1/3 width) */}
        <div className="flex-1 flex flex-col gap-1">
          {products.slice(0, 4).map((product, index) => {
            if (index === currentMainImage && products.length > 4) return null;
            
            return (
              <div 
                key={product.productId}
                className="relative flex-1 bg-gradient-to-br from-muted to-muted/50 overflow-hidden group cursor-pointer"
                onMouseEnter={() => {
                  setHoveredProduct(product.productId);
                  setCurrentMainImage(index);
                }}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-product.svg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                {product.quantity > 1 && (
                  <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-1 py-0.5 rounded font-medium">
                    {product.quantity}x
                  </div>
                )}
                {index === currentMainImage && (
                  <div className="absolute inset-0 ring-2 ring-primary ring-inset" />
                )}
              </div>
            );
          })}
          
          {/* Show "+X more" if there are more than 4 products */}
          {products.length > 4 && (
            <div className="relative flex-1 bg-gradient-to-br from-primary/20 to-primary/10 overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <span className="text-xs font-medium text-foreground">+{products.length - 4}</span>
                <p className="text-xs text-foreground/70">more</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product count indicator */}
      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
        {products.length} products
      </div>
    </div>
  );
};

interface StarterKitTemplate {
  $id: string;
  name: string;
  description: string;
  category: string;
  estimatedCost: number;
  products: string; // JSON string of selected products
  isActive: boolean;
  is_visible_on_home: boolean;
  $createdAt: string;
  $updatedAt: string;
}

interface SelectedProduct {
  productId: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  asin?: string;
  isRequired: boolean;
  notes?: string;
}

interface Product {
  $id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  imageUrl?: string;
  asin?: string;
  description?: string;
  specifications?: string;
  tags?: string[];
}

const StarterKitDisplay: React.FC = () => {
  const [templates, setTemplates] = useState<StarterKitTemplate[]>([]);
  const [templatesWithProducts, setTemplatesWithProducts] = useState<(StarterKitTemplate & { enrichedProducts: SelectedProduct[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadVisibleTemplates();
  }, []);

  const loadVisibleTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await databases.listDocuments(
        'atSupplyFinder',
        'starterKitTemplates',
        [
          Query.equal('isActive', true),
          Query.equal('is_visible_on_home', true),
          Query.orderDesc('$createdAt'),
          Query.limit(6) // Show max 6 starter kits on home page
        ]
      );

      console.log('StarterKitDisplay - loaded templates:', response.documents);
      
      // Properly map and parse the documents
      const loadedTemplates: StarterKitTemplate[] = response.documents.map((doc: any) => ({
        $id: doc.$id,
        name: doc.name,
        description: doc.description,
        category: doc.category,
        estimatedCost: doc.estimatedCost || 0,
        products: doc.products, // Keep as JSON string for now
        isActive: doc.isActive,
        is_visible_on_home: doc.is_visible_on_home,
        $createdAt: doc.$createdAt,
        $updatedAt: doc.$updatedAt
      }));
      
      setTemplates(loadedTemplates);

      // Enrich templates with live product data
      const enrichedTemplates = await Promise.all(
        loadedTemplates.map(async (template) => {
          // Parse the products JSON string to get the actual product array
          const parsedProducts: SelectedProduct[] = template.products ? JSON.parse(template.products) : [];
          const enrichedProducts = await enrichProductsWithLiveData(parsedProducts);
          return { ...template, enrichedProducts };
        })
      );

      setTemplatesWithProducts(enrichedTemplates);
    } catch (err) {
      console.error('Error loading starter kit templates:', err);
      setError('Failed to load starter kit templates');
    } finally {
      setLoading(false);
    }
  };

  const parseProducts = (productsJson: string): SelectedProduct[] => {
    try {
      const parsed = JSON.parse(productsJson || '[]');
      console.log('parseProducts - input JSON:', productsJson);
      console.log('parseProducts - parsed result:', parsed);
      return parsed;
    } catch (error) {
      console.error('parseProducts - error parsing JSON:', error, 'input:', productsJson);
      return [];
    }
  };

  const enrichProductsWithLiveData = async (templateProducts: SelectedProduct[]): Promise<SelectedProduct[]> => {
    try {
      // Extract product IDs from template
      const productIds = templateProducts.map(p => p.productId);
      
      if (productIds.length === 0) {
        return templateProducts;
      }

      // Fetch live product data from database
      const productPromises = productIds.map(async (productId) => {
        try {
          const productDoc = await databases.getDocument(
            'atSupplyFinder',
            'products',
            productId
          );
          return productDoc as unknown as Product;
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error);
          return null;
        }
      });

      const liveProducts = await Promise.all(productPromises);
      
      // Merge template data with live product data
      const enrichedProducts = templateProducts.map((templateProduct) => {
        const liveProduct = liveProducts.find(p => p && p.$id === templateProduct.productId);
        
        if (liveProduct) {
          return {
            ...templateProduct,
            name: liveProduct.name,
            brand: liveProduct.brand,
            category: liveProduct.category,
            price: liveProduct.price,
            imageUrl: liveProduct.imageUrl, // This is the key field we need!
            asin: liveProduct.asin
          };
        }
        
        // Fallback to template data if live product not found
        return templateProduct;
      });

      console.log('enrichProductsWithLiveData - enriched products:', enrichedProducts);
      return enrichedProducts;
    } catch (error) {
      console.error('Error enriching products with live data:', error);
      return templateProducts;
    }
  };

  const handleBuildKit = (template: StarterKitTemplate & { enrichedProducts?: SelectedProduct[] }) => {
    // Navigate to build page with pre-selected products from the template
    const products = template.enrichedProducts || parseProducts(template.products);
    
    // Store template info in sessionStorage for the build page to use
    sessionStorage.setItem('starterKitTemplate', JSON.stringify({
      id: template.$id,
      name: template.name,
      products: products,
      isTemplate: true
    }));
    
    navigate('/build');
  };

  if (loading) {
    return (
      <section className="container mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-80">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container mx-auto py-16 px-4">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </section>
    );
  }

  if (templatesWithProducts.length === 0 && !loading) {
    return null; // Don't show section if no templates are visible
  }

  return (
    <section className="container mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
          Ready-Made Starter Kits
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          Get started quickly with our expertly curated starter kit templates. 
          Each kit is designed for specific needs and can be customized to your requirements.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templatesWithProducts.map((template) => {
          const products = template.enrichedProducts;
          
          return (
            <Card key={template.$id} className="group hover:shadow-xl hover:shadow-primary/10 dark:hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border border-border/50 shadow-md bg-gradient-to-br from-background to-background/80 dark:from-background dark:to-background/90">
              <CardContent className="p-0">
                {/* Enhanced Product Showcase */}
                <div className="relative overflow-hidden">
                  <ProductShowcase products={products} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Content Section with Better Spacing */}
                <div className="p-6 space-y-4">
                  {/* Header with Title and Category */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors duration-300">
                        {template.name}
                      </h3>
                      <Badge variant="outline" className="text-xs shrink-0 border-primary/30 text-foreground bg-primary/10 dark:border-primary/40 dark:bg-primary/15 dark:text-foreground">
                        {template.category}
                      </Badge>
                    </div>
                    
                    {/* Description if available */}
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Price Section */}
                  <div className="flex items-center gap-2 py-2 px-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-700/50">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-xl font-bold text-green-700 dark:text-green-300">
                      ${template.estimatedCost.toFixed(2)}
                    </span>
                    <span className="text-sm text-green-600 dark:text-green-400/80">estimated total</span>
                  </div>

                  {/* Stats Section */}
                  <div className="flex justify-between items-center py-3 px-4 bg-muted/40 dark:bg-muted/20 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">{products.length}</span>
                      <span className="text-muted-foreground">products</span>
                    </div>
                    <div className="w-px h-6 bg-border/60"></div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">{products.reduce((sum, product) => sum + product.quantity, 0)}</span>
                      <span className="text-muted-foreground">total items</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]"
                    onClick={() => handleBuildKit(template)}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Build This Kit
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <Button 
          variant="outline" 
          onClick={() => navigate('/catalog')}
          className="hover:bg-primary hover:text-primary-foreground transition-colors border-primary/30 text-primary hover:border-primary"
        >
          <Package className="h-4 w-4 mr-2" />
          Browse All Products
        </Button>
      </div>
    </section>
  );
};

export default StarterKitDisplay;