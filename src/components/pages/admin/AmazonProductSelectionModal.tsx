import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useRBAC } from '@/hooks/use-rbac';
import { useProductRefresh } from '@/context/product-refresh-context';
import { productService } from '@/components/pages/admin/product-management/services/product-service';
import { ProductApprovalModal } from './ProductApprovalModal';

// Amazon Product interface for approval
interface AmazonProduct {
  asin: string;
  title: string;
  price?: string;
  rating?: number;
  reviewCount?: number;
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

interface AmazonProductSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductsImported?: () => void;
}

// Define the 11 first aid categories from the existing system
const FIRST_AID_CATEGORIES = [
  { id: 'wound-care-dressings', name: 'Wound Care & Dressings', icon: '🩹' },
  { id: 'tapes-wraps', name: 'Tapes & Wraps', icon: '🧵' },
  { id: 'antiseptics-ointments', name: 'Antiseptics & Ointments', icon: '🧴' },
  { id: 'pain-relief', name: 'Pain & Symptom Relief', icon: '💊' },
  { id: 'instruments-tools', name: 'Instruments & Tools', icon: '🛠️' },
  { id: 'trauma-emergency', name: 'Trauma & Emergency', icon: '🚨' },
  { id: 'ppe', name: 'Personal Protection Equipment (PPE)', icon: '🛡️' },
  { id: 'information-essentials', name: 'First Aid Information & Essentials', icon: '📋' },
  { id: 'hot-cold-therapy', name: 'Hot & Cold Therapy', icon: '🧊' },
  { id: 'hydration-nutrition', name: 'Hydration & Nutrition', icon: '💧' },
  { id: 'miscellaneous', name: 'Miscellaneous & General', icon: '📦' },
];

export const AmazonProductSelectionModal: React.FC<AmazonProductSelectionModalProps> = ({
  open,
  onOpenChange,
  onProductsImported,
}) => {
  const { isAdmin } = useRBAC();
  const { triggerProductRefresh } = useProductRefresh();
  // State for selected categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // State for products per category
  const [productsPerCategory, setProductsPerCategory] = useState<number>(5);
  
  // State for loading
  const [isImporting, setIsImporting] = useState(false);

  // State for fetched products and approval modal
  const [fetchedProducts, setFetchedProducts] = useState<AmazonProduct[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Handle category selection
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryId]);
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    }
  };

  // Handle select all categories
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(FIRST_AID_CATEGORIES.map(cat => cat.id));
    } else {
      setSelectedCategories([]);
    }
  };

  // Fetch products for approval
  const handleSubmit = async () => {
    // Check if user has admin permissions
    if (!isAdmin) {
      toast.error('You do not have permission to fetch Amazon products');
      return;
    }
    
    // Validation
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    if (productsPerCategory < 1 || productsPerCategory > 10) {
      toast.error('Products per category must be between 1 and 10');
      return;
    }
    
    try {
      setIsImporting(true);
      toast.info('Fetching products from Amazon for review...');
      
      // Import the functions object from appwrite.ts
      const { functions } = await import('@/lib/api/appwrite');
      
      // Get the function ID from environment variables
      const functionId = import.meta.env.VITE_APPWRITE_AMAZON_PA_API_FUNCTION_ID;
      
      if (!functionId) {
        throw new Error('Missing Appwrite function ID in environment variables');
      }
      
      // Prepare the request data for fetching products (not importing)
      const requestData = {
        selectedCategories,
        productsPerCategory,
        action: 'fetch', // Use the new 'fetch' action for category-based product fetching
        category: selectedCategories[0] // Use first category for now, we'll enhance this later
      };
      
      // Execute the Appwrite function
      const execution = await functions.createExecution(
        functionId,
        JSON.stringify(requestData),
        false // synchronous execution
      );
      
      if (execution.status !== 'completed') {
        throw new Error(`Function execution failed: ${execution.status}`);
      }
      
      // Parse the response
      const result = execution.responseBody ? JSON.parse(execution.responseBody) : {};
      console.log('Amazon PA API response:', result);
      
      // Handle both success and error responses
      if (result.success === false) {
        throw new Error(result.error || result.message || 'Failed to fetch products');
      }
      
      // Check if we have products in the response
      if (result.products && Array.isArray(result.products) && result.products.length > 0) {
        // Transform the products to match our AmazonProduct interface
        const transformedProducts: AmazonProduct[] = result.products.map((product: any) => {
          // Extract price properly
          let price = '';
          if (product.price) {
            price = product.price.toString();
          } else if (product.Offers?.Listings?.[0]?.Price?.DisplayAmount) {
            price = product.Offers.Listings[0].Price.DisplayAmount;
          } else if (product.Offers?.Listings?.[0]?.Price?.Amount) {
            price = `$${product.Offers.Listings[0].Price.Amount}`;
          }

          // Extract features properly
          let features = [];
          if (product.features && Array.isArray(product.features)) {
            features = product.features;
          } else if (product.ItemInfo?.Features?.DisplayValues) {
            features = product.ItemInfo.Features.DisplayValues;
          }

          // Extract dimensions and other product info
          const dimensions = product.dimensions || 
                           product.ItemInfo?.ProductInfo?.ItemDimensions?.DisplayValue || 
                           '';

          const weight = product.weight || 
                        product.ItemInfo?.ProductInfo?.ItemDimensions?.Weight?.DisplayValue || 
                        '';

          const material = product.material || '';

          // Extract quantity information
          let qty = product.qty || 1;
          if (!product.qty && product.name) {
            const quantityMatch = product.name.match(/(\d+)\s*(?:Count|Pack|Pack of|Packaging|Pieces|Ct|Pc)/i);
            if (quantityMatch) {
              qty = parseInt(quantityMatch[1]);
            }
          }

          return {
            asin: product.asin || product.ASIN || '',
            title: product.name || product.title || product.ItemInfo?.Title?.DisplayValue || 'Unknown Product',
            price: price,
            rating: product.rating || 0,
            reviewCount: product.reviewCount || 0,
            imageUrl: product.imageUrl || product.Images?.Primary?.Large?.URL || product.Images?.Primary?.Medium?.URL || '',
            detailPageURL: product.affiliateLink || product.detailPageURL || product.DetailPageURL || '',
            category: product.category || selectedCategories[0] || 'Miscellaneous & General',
            description: product.description || features.join('. ') || '',
            features: features,
            brand: product.brand || product.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || '',
            availability: product.availability || 'Available',
            dimensions: dimensions,
            weight: weight,
            material: material,
            qty: qty
          };
        });
        
        setFetchedProducts(transformedProducts);
        setShowApprovalModal(true);
        toast.success(`Found ${transformedProducts.length} products for review`);
      } else {
        toast.error('No products found for the selected categories');
      }
    } catch (error: any) {
      console.error('Error fetching Amazon products:', error);
      toast.error(`Failed to fetch products: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Handle products approved from the approval modal
  const handleProductsApproved = (approvedProducts: AmazonProduct[]) => {
    // Clear the fetched products and close approval modal
    setFetchedProducts([]);
    setShowApprovalModal(false);
    
    // Trigger product refresh to update the product list
    triggerProductRefresh();
    
    // Call the callback to refresh data
    if (onProductsImported) {
      onProductsImported();
    }
    
    // Close the main modal
    handleCancel();
  };

  // Reset form and close modal
  const handleCancel = () => {
    setSelectedCategories([]);
    setProductsPerCategory(5);
    setFetchedProducts([]);
    setShowApprovalModal(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Amazon Products</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Select First Aid Categories
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedCategories.length === FIRST_AID_CATEGORIES.length}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <Label htmlFor="select-all" className="text-sm">
                  Select All
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4">
              {FIRST_AID_CATEGORIES.map((category) => (
                <div key={category.id} className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50">
                  <Checkbox
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                    id={category.id}
                  />
                  <Label htmlFor={category.id} className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-lg">{category.icon}</span>
                    <span>{category.name}</span>
                  </Label>
                </div>
              ))}
            </div>

            {selectedCategories.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedCategories.length} of {FIRST_AID_CATEGORIES.length} categories selected
              </p>
            )}
          </div>

          <Separator />

          {/* Products Per Category Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="products-per-category" className="text-base font-semibold">
                Products Per Category
              </Label>
              <span className="text-sm text-muted-foreground">
                Current: {productsPerCategory}
              </span>
            </div>

            <div className="space-y-2">
              <Input
                id="products-per-category"
                type="number"
                min="1"
                max="10"
                value={productsPerCategory}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    // Ensure value is within range
                    if (value < 1) {
                      setProductsPerCategory(1);
                    } else if (value > 10) {
                      setProductsPerCategory(10);
                    } else {
                      setProductsPerCategory(value);
                    }
                  }
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Minimum: 1</span>
                <span>Maximum: 10</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Specify how many products to create for each selected category.
                Default is 5 products per category.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedCategories.length === 0 || isImporting || !isAdmin}
          >
            {isImporting ? 'Fetching Products...' : 'Fetch Products for Review'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Product Approval Modal */}
      <ProductApprovalModal
        open={showApprovalModal}
        onOpenChange={setShowApprovalModal}
        products={fetchedProducts}
        onProductsApproved={handleProductsApproved}
        title="Review and Approve Amazon Products"
      />
    </Dialog>
  );
};