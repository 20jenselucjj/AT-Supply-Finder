import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Search, 
  Star, 
  Package, 
  DollarSign, 
  ExternalLink,
  Edit,
  Save,
  X,
  Plus,
  Loader2
} from 'lucide-react';
import { useRBAC } from '@/hooks/use-rbac';
import { functions } from '@/lib/api/appwrite';
import { ProductApprovalModal } from './ProductApprovalModal';

interface AmazonProduct {
  asin: string;
  title: string;
  price?: string;
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

interface EditableProduct extends AmazonProduct {
  isEditing?: boolean;
  editedTitle?: string;
  editedPrice?: string;
  editedDescription?: string;
  editedCategory?: string;
  editedDimensions?: string;
  editedMaterial?: string;
  editedQty?: number;
}

interface SearchAmazonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductsAdded?: () => void;
}

export const SearchAmazonModal: React.FC<SearchAmazonModalProps> = ({
  open,
  onOpenChange,
  onProductsAdded
}) => {
  const { isAdmin } = useRBAC();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<EditableProduct[]>([]);
  
  // Selected products for approval
  const [selectedProducts, setSelectedProducts] = useState<AmazonProduct[]>([]);
  
  // Approval modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }
  
    if (!isAdmin) {
      toast.error('You do not have permission to search Amazon products');
      return;
    }
  
    try {
      setIsSearching(true);
      setSearchResults([]);
  
      // Call the Amazon PA API function with correct parameters
      const response = await functions.createExecution(
        import.meta.env.VITE_APPWRITE_AMAZON_PA_API_FUNCTION_ID,
        JSON.stringify({
          action: 'search',
          keywords: searchQuery.trim(), // Send as string to match backend and PA API expectations
          itemCount: 10, // PA API max per page is 10
          itemPage: 1,
          searchIndex: 'All' // Add searchIndex for broader search if needed
        })
      );
  
      if (response.responseStatusCode !== 200) {
        throw new Error('Failed to search Amazon products');
      }
  
      const result = JSON.parse(response.responseBody);
      
      if (result.error) {
        throw new Error(result.error);
      }
  
      if (result.products && result.products.length > 0) {
        // Convert to editable format
        const editableProducts: EditableProduct[] = result.products.map((product: any) => {
          // Extract price properly
          let price = '';
          if (product.Offers?.Listings?.[0]?.Price?.DisplayAmount) {
            price = product.Offers.Listings[0].Price.DisplayAmount;
          } else if (product.Offers?.Listings?.[0]?.Price?.Amount) {
            price = `$${product.Offers.Listings[0].Price.Amount}`;
          }

          // Extract features properly
          const features = product.ItemInfo?.Features?.DisplayValues || [];

          // Extract dimensions and other product info
          const dimensions = product.ItemInfo?.ProductInfo?.ItemDimensions?.DisplayValue || '';
          const weight = product.ItemInfo?.ProductInfo?.ItemDimensions?.Weight?.DisplayValue || '';
          
          // Extract material from features if available
          let material = '';
          const materialKeywords = ['made of', 'material', 'cotton', 'polyester', 'nylon', 'latex', 'plastic', 'fabric', 'blend'];
          for (const feature of features) {
            const lowerFeature = feature.toLowerCase();
            if (materialKeywords.some(keyword => lowerFeature.includes(keyword))) {
              material = feature.substring(0, 100);
              break;
            }
          }

          // Extract quantity information
          let qty = 1;
          const title = product.ItemInfo?.Title?.DisplayValue || '';
          const quantityMatch = title.match(/(\d+)\s*(?:Count|Pack|Pack of|Packaging|Pieces|Ct|Pc)/i);
          if (quantityMatch) {
            qty = parseInt(quantityMatch[1]);
          }

          return {
            asin: product.ASIN,
            title: title || 'No title',
            price: price || undefined,
            imageUrl: product.Images?.Primary?.Large?.URL || product.Images?.Primary?.Medium?.URL || undefined,
            detailPageURL: product.DetailPageURL || undefined,
            category: 'General', // Default category for manual search
            description: features.join('. ') || '',
            features: features,
            brand: product.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || undefined,
            availability: product.Offers?.Listings?.[0]?.Availability?.Message || 'Available',
            dimensions: dimensions,
            weight: weight,
            material: material,
            qty: qty,
            isEditing: false
          };
        });
  
        setSearchResults(editableProducts);
        toast.success(`Found ${editableProducts.length} products`);
      } else {
        toast.info('No products found for your search');
      }
  
    } catch (error: any) {
      console.error('Error searching Amazon products:', error);
      toast.error(`Search failed: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle edit toggle
  const toggleEdit = (asin: string) => {
    setSearchResults(prev => prev.map(product => {
      if (product.asin === asin) {
        return {
          ...product,
          isEditing: !product.isEditing,
          editedTitle: product.editedTitle || product.title,
          editedPrice: product.editedPrice || product.price,
          editedDescription: product.editedDescription || product.description,
          editedCategory: product.editedCategory || product.category
        };
      }
      return product;
    }));
  };

  // Handle save edit
  const saveEdit = (asin: string) => {
    setSearchResults(prev => prev.map(product => {
      if (product.asin === asin && product.isEditing) {
        return {
          ...product,
          title: product.editedTitle || product.title,
          price: product.editedPrice || product.price,
          description: product.editedDescription || product.description,
          category: product.editedCategory || product.category,
          isEditing: false
        };
      }
      return product;
    }));
    toast.success('Product updated');
  };

  // Handle field updates during editing
  const updateEditField = (asin: string, field: string, value: string) => {
    setSearchResults(prev => prev.map(product => {
      if (product.asin === asin) {
        return {
          ...product,
          [`edited${field.charAt(0).toUpperCase() + field.slice(1)}`]: value
        };
      }
      return product;
    }));
  };

  // Add product to selection
  const addToSelection = (product: EditableProduct) => {
    // Convert back to AmazonProduct format
    const amazonProduct: AmazonProduct = {
      asin: product.asin,
      title: product.title,
      price: product.price,
      reviewCount: product.reviewCount,
      imageUrl: product.imageUrl,
      detailPageURL: product.detailPageURL,
      category: product.category,
      description: product.description,
      features: product.features,
      brand: product.brand,
      availability: product.availability
    };

    // Check if already selected
    if (selectedProducts.some(p => p.asin === product.asin)) {
      toast.info('Product already selected');
      return;
    }

    setSelectedProducts(prev => [...prev, amazonProduct]);
    toast.success('Product added to selection');
  };

  // Remove from selection
  const removeFromSelection = (asin: string) => {
    setSelectedProducts(prev => prev.filter(p => p.asin !== asin));
    toast.success('Product removed from selection');
  };

  // Open approval modal
  const openApprovalModal = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    setShowApprovalModal(true);
  };

  // Handle products approved
  const handleProductsApproved = (approvedProducts: AmazonProduct[]) => {
    // Remove approved products from selection
    const approvedAsins = new Set(approvedProducts.map(p => p.asin));
    setSelectedProducts(prev => prev.filter(p => !approvedAsins.has(p.asin)));
    setShowApprovalModal(false);
    onProductsAdded?.();
  };

  // Reset and close modal
  const handleCancel = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedProducts([]);
    onOpenChange(false);
  };

  // Format price display
  const formatPrice = (price?: string) => {
    if (!price) return 'N/A';
    return price.startsWith('$') ? price : `$${price}`;
  };



  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Amazon Products
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="search-query">Search for products</Label>
                <Input
                  id="search-query"
                  placeholder="Enter product name, keywords, or ASIN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching || !isAdmin}
                  className="gap-2"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Selection Summary */}
            {selectedProducts.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected for approval
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProducts([])}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    size="sm"
                    onClick={openApprovalModal}
                    className="gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Review & Approve
                  </Button>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Search Results</h3>
                  <Badge variant="outline">{searchResults.length} products found</Badge>
                </div>
                
                <ScrollArea className="h-[500px] w-full">
                  <div className="space-y-4 pr-4">
                    {searchResults.map((product) => {
                      const isSelected = selectedProducts.some(p => p.asin === product.asin);
                      
                      return (
                        <Card key={product.asin} className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start space-x-3">
                              {product.imageUrl && (
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="w-20 h-20 object-cover rounded-md border"
                                />
                              )}
                              
                              <div className="flex-1 min-w-0 space-y-3">
                                {/* Title */}
                                {product.isEditing ? (
                                  <div>
                                    <Label htmlFor={`title-${product.asin}`}>Title</Label>
                                    <Input
                                      id={`title-${product.asin}`}
                                      value={product.editedTitle || ''}
                                      onChange={(e) => updateEditField(product.asin, 'title', e.target.value)}
                                    />
                                  </div>
                                ) : (
                                  <CardTitle className="text-base line-clamp-2">
                                    {product.title}
                                  </CardTitle>
                                )}

                                {/* Price and Category in Edit Mode */}
                                {product.isEditing && (
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label htmlFor={`price-${product.asin}`}>Price</Label>
                                      <Input
                                        id={`price-${product.asin}`}
                                        value={product.editedPrice || ''}
                                        onChange={(e) => updateEditField(product.asin, 'price', e.target.value)}
                                        placeholder="$0.00"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`category-${product.asin}`}>Category</Label>
                                      <Input
                                        id={`category-${product.asin}`}
                                        value={product.editedCategory || ''}
                                        onChange={(e) => updateEditField(product.asin, 'category', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Description in Edit Mode */}
                                {product.isEditing && (
                                  <div>
                                    <Label htmlFor={`description-${product.asin}`}>Description</Label>
                                    <Textarea
                                      id={`description-${product.asin}`}
                                      value={product.editedDescription || ''}
                                      onChange={(e) => updateEditField(product.asin, 'description', e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                )}

                                {/* Product Info Badges */}
                                {!product.isEditing && (
                                  <div className="flex flex-wrap gap-2 text-sm">
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
                                )}
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex flex-col gap-2">
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
                                
                                {product.isEditing ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => saveEdit(product.asin)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleEdit(product.asin)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                {isSelected ? (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeFromSelection(product.asin)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => addToSelection(product)}
                                    className="h-8 w-8 p-0"
                                    disabled={product.isEditing}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          
                          {/* Description (non-edit mode) */}
                          {!product.isEditing && product.description && (
                            <CardContent className="pt-0">
                              <Separator className="mb-3" />
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {product.description}
                              </p>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Close
            </Button>
            {selectedProducts.length > 0 && (
              <Button onClick={openApprovalModal} className="gap-2">
                <Package className="h-4 w-4" />
                Review {selectedProducts.length} Selected Product{selectedProducts.length !== 1 ? 's' : ''}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Approval Modal */}
      <ProductApprovalModal
        open={showApprovalModal}
        onOpenChange={setShowApprovalModal}
        products={selectedProducts}
        onProductsApproved={handleProductsApproved}
        title="Approve Selected Products"
      />
    </>
  );
};