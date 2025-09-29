import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Check, 
  X, 
  Star, 
  Package, 
  DollarSign, 
  ExternalLink,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react';
import { useRBAC } from '@/hooks/use-rbac';
import { useProductRefresh } from '@/context/product-refresh-context';

interface Product {
  asin: string;
  title: string;
  price?: string;
  imageUrl?: string;
  detailPageURL?: string;
  category?: string;
  description?: string;
  features?: string[];
  brand?: string;
  availability?: string;
  dimensions?: string;
  weight?: string;
  material?: string;
  qty?: number;
}

interface ProductApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onProductsApproved?: (approvedProducts: Product[]) => void;
  title?: string;
}

export const ProductApprovalModal: React.FC<ProductApprovalModalProps> = ({
  open,
  onOpenChange,
  products,
  onProductsApproved,
  title = "Review Products for Approval"
}) => {
  const { isAdmin } = useRBAC();
  const { triggerProductRefresh } = useProductRefresh();
  
  // State for selected products for approval
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  
  // State for processing approval
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for expanded product details
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // Handle product selection
  const handleProductSelection = (asin: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(asin);
    } else {
      newSelected.delete(asin);
    }
    setSelectedProducts(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(products.map(p => p.asin)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  // Toggle product details expansion
  const toggleProductDetails = (asin: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(asin)) {
      newExpanded.delete(asin);
    } else {
      newExpanded.add(asin);
    }
    setExpandedProducts(newExpanded);
  };

  // Handle approval and add to database
  const handleApproveProducts = async () => {
    if (!isAdmin) {
      toast.error('You do not have permission to approve products');
      return;
    }

    if (selectedProducts.size === 0) {
      toast.error('Please select at least one product to approve');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Filter approved products
      const approvedProducts = products.filter(p => selectedProducts.has(p.asin));
      
      // Convert Amazon products to our product format and add to database
      const { productService } = await import('@/components/pages/admin/product-management/services/product-service');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const product of approvedProducts) {
        try {
          // Convert Amazon product to our format
          // Convert features array to string format with proper length limit
          let featuresString = '';
          if (product.features && Array.isArray(product.features)) {
            featuresString = product.features.join('..').substring(0, 1000);
          } else if (typeof product.features === 'string') {
            featuresString = (product.features as string).substring(0, 1000);
          }

          const productData = {
            name: product.title,
            price: product.price ? parseFloat(product.price.replace(/[^0-9.]/g, '')) : 0,
            category: product.category || 'Uncategorized',
            description: product.description || '',
            image_url: product.imageUrl || '',
            affiliate_link: product.detailPageURL || '',
            brand: product.brand || '',
            availability: product.availability || 'Available',
            features: featuresString,
            asin: product.asin,
            dimensions: product.dimensions || '',
            material: product.material || '',
            qty: product.qty || 1
          };
          
          await productService.createProduct(productData);
          successCount++;
        } catch (error) {
          console.error(`Error adding product ${product.title}:`, error);
          errorCount++;
        }
      }
      
      // Show results
      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} product${successCount > 1 ? 's' : ''}`);
        triggerProductRefresh();
        
        if (onProductsApproved) {
          onProductsApproved(approvedProducts);
        }
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to add ${errorCount} product${errorCount > 1 ? 's' : ''}`);
      }
      
      // Close modal if all successful
      if (errorCount === 0) {
        handleCancel();
      }
      
    } catch (error: any) {
      console.error('Error approving products:', error);
      toast.error(`Failed to approve products: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset and close modal
  const handleCancel = () => {
    setSelectedProducts(new Set());
    setExpandedProducts(new Set());
    onOpenChange(false);
  };

  // Format price display
  const formatPrice = (price?: string) => {
    if (!price) return 'N/A';
    return price.startsWith('$') ? price : `$${price}`;
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title}
          </DialogTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{products.length} products found</span>
            <span>{selectedProducts.size} selected for approval</span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select All Controls */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedProducts.size === products.length && products.length > 0}
                onCheckedChange={handleSelectAll}
                id="select-all-products"
              />
              <label htmlFor="select-all-products" className="text-sm font-medium cursor-pointer">
                Select All Products
              </label>
            </div>
            <Badge variant="outline">
              {selectedProducts.size} of {products.length} selected
            </Badge>
          </div>

          {/* Products List */}
          <ScrollArea className="h-[500px] w-full">
            <div className="space-y-4 pr-4">
              {products.map((product) => {
                const isSelected = selectedProducts.has(product.asin);
                const isExpanded = expandedProducts.has(product.asin);
                
                return (
                  <Card key={product.asin} className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleProductSelection(product.asin, checked as boolean)}
                          className="mt-1"
                        />
                        
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded-md border"
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base line-clamp-2 mb-2">
                            {product.title}
                          </CardTitle>
                          
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            {product.price && (
                              <Badge variant="secondary" className="gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatPrice(product.price)}
                              </Badge>
                            )}
                            

                            
                            {product.category && (
                              <Badge variant="outline">
                                {product.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {product.detailPageURL && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(product.detailPageURL, '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleProductDetails(product.asin)}
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="pt-0">
                        <Separator className="mb-3" />
                        <div className="space-y-3 text-sm">
                          {product.description && (
                            <div>
                              <h4 className="font-medium mb-1">Description</h4>
                              <p className="text-muted-foreground">{product.description}</p>
                            </div>
                          )}
                          
                          {product.features && product.features.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-1">Features</h4>
                              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                {product.features.map((feature, index) => (
                                  <li key={index}>{feature}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            {product.brand && <span><strong>Brand:</strong> {product.brand}</span>}
                            {product.availability && <span><strong>Availability:</strong> {product.availability}</span>}
                            <span><strong>ASIN:</strong> {product.asin}</span>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleApproveProducts}
            disabled={selectedProducts.size === 0 || isProcessing || !isAdmin}
            className="gap-2"
          >
            {isProcessing ? (
              'Processing...'
            ) : (
              <>
                <Check className="h-4 w-4" />
                Approve & Add {selectedProducts.size} Product{selectedProducts.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};