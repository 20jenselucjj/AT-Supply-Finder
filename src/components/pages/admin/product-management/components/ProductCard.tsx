import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Edit,
  Trash2,
  Star,
  DollarSign,
  ExternalLink,
  MoreVertical,
  Eye,
  Copy,
  Archive
} from 'lucide-react';
import { ProductData } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductForm } from '@/components/pages/admin/ProductForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProductCardProps {
  product: ProductData;
  isSelected: boolean;
  handleSelectProduct: (productId: string, checked: boolean) => void;
  openEditDialog: (product: ProductData) => void;
  handleDeleteProduct: (productId: string) => void;
  getMinPrice: (offers: any[]) => number | null;
  updateProduct: (id: string, data: any) => Promise<void>;
  handleAffiliateLinkChange: (url: string) => void;
  handleEnhanceWithAI: () => void;
  isLoadingProductInfo: boolean;
  categories: string[];
  brands: string[];
}

// Status badge component for product status
const StatusBadge: React.FC<{ status?: string; rating?: number | null }> = ({ status, rating }) => {
  const getStatusColor = () => {
    if (rating && rating >= 4.5) return 'bg-green-100 text-green-800 border-green-200';
    if (rating && rating >= 3.5) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (rating && rating >= 2.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = () => {
    if (rating && rating >= 4.5) return 'Excellent';
    if (rating && rating >= 3.5) return 'Good';
    if (rating && rating >= 2.5) return 'Average';
    return 'Needs Review';
  };

  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${getStatusColor()}`}
    >
      {getStatusText()}
    </Badge>
  );
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected,
  handleSelectProduct,
  openEditDialog,
  handleDeleteProduct,
  getMinPrice,
  updateProduct,
  handleAffiliateLinkChange,
  handleEnhanceWithAI,
  isLoadingProductInfo,
  categories,
  brands
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editProductForm, setEditProductForm] = useState<any>({});

  const handleEditClick = () => {
    // Map database category names to friendly names
    const categoryMapping: Record<string, string> = {
      "First Aid & Wound Care": "Wound Care & Dressings",
      "Taping & Bandaging": "Tapes & Wraps",
      "Instruments & Tools": "Instruments & Tools",
      "Over-the-Counter Medication": "Pain & Symptom Relief",
      "Emergency Care": "Trauma & Emergency",
      "Personal Protection Equipment (PPE)": "Personal Protection Equipment (PPE)",
      "Documentation & Communication": "First Aid Information & Essentials",
      "Hot & Cold Therapy": "Hot & Cold Therapy",
      "Hydration & Nutrition": "Hydration & Nutrition",
      "Miscellaneous & General": "Miscellaneous & General"
    };

    setEditProductForm({
      name: product.name,
      category: categoryMapping[product.category] || product.category,
      brand: product.brand,
      rating: product.rating?.toString() || '',
      price: product.price?.toString() || '',
      dimensions: product.dimensions || '',
      weight: product.weight || '',
      material: product.material || '',
      features: Array.isArray(product.features)
        ? product.features.join(', ')
        : typeof product.features === 'string'
          ? product.features
          : '',
      image_url: product.imageUrl || '',
      asin: product.asin || '',
      affiliate_link: product.affiliateLink || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateProduct(product.id, editProductForm);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleQuickActions = (action: string) => {
    switch (action) {
      case 'duplicate':
        // TODO: Implement duplicate functionality
        break;
      case 'archive':
        // TODO: Implement archive functionality
        break;
      case 'view':
        if (product.affiliateLink) {
          window.open(product.affiliateLink, '_blank');
        }
        break;
    }
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary">
        <CardContent className="p-0">
          {/* Header with selection and quick actions */}
          <div className="p-4 pb-3 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                />
                <div className="flex items-center gap-2">
                  <div className="relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover ring-2 ring-background shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center ring-2 ring-background shadow-sm">
                        <span className="text-xs text-muted-foreground font-medium">No Image</span>
                      </div>
                    )}
                    {product.affiliateLink && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                        <ExternalLink className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        if (product.affiliateLink) {
                          window.open(product.affiliateLink, '_blank');
                        }
                      }}
                    >
                      <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        ASIN: {product.asin || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditClick}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Product
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleQuickActions('duplicate')}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleQuickActions('view')}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Product
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Product details */}
          <div className="p-4 space-y-4">
            {/* Status and key info */}
            <div className="flex items-center justify-between">
              <StatusBadge rating={product.rating} />
              {product.affiliateLink && (
                <Badge variant="secondary" className="text-xs">
                  Amazon
                </Badge>
              )}
            </div>

            {/* Product info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                 <div className="text-xs text-muted-foreground font-medium">Category</div>
                 <div className="flex justify-center">
                   <Badge variant="outline" className="text-xs">
                     {product.category}
                   </Badge>
                 </div>
               </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-medium">Brand</div>
                <div className="font-medium text-xs">{product.brand}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-medium">Rating</div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium">{product.rating || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-medium">Price</div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="font-semibold text-sm">
                    {product.price !== null ? `$${product.price.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Material info if available */}
            {product.material && (
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground font-medium mb-1">Material</div>
                <div className="text-xs text-muted-foreground">{product.material}</div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-3 border-t">
              {product.affiliateLink ? (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-xs"
                >
                  <a href={product.affiliateLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View on Amazon
                  </a>
                </Button>
              ) : (
                <div></div>
              )}

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditClick}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteProduct(product.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductForm
            productForm={editProductForm}
            setProductForm={setEditProductForm}
            handleAffiliateLinkChange={handleAffiliateLinkChange}
            handleEnhanceWithAI={handleEnhanceWithAI}
            isLoadingProductInfo={isLoadingProductInfo}
            handleSubmit={handleSaveEdit}
            onCancel={() => setIsEditDialogOpen(false)}
            isEditing={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};