import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Edit, 
  Trash2, 
  Star, 
  DollarSign,
  ExternalLink
} from 'lucide-react';
import { ProductData } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductForm } from '@/components/pages/admin/ProductForm';

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
      imageUrl: product.imageUrl || '',
      asin: product.asin || '',
      affiliateLink: product.affiliateLink || ''
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

  return (
    <>
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
              className="mt-1"
            />
            <div className="flex items-center gap-3">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No Image</span>
                </div>
              )}
              <div>
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  ASIN: {product.asin || 'N/A'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditClick}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteProduct(product.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Category</div>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
              {product.category}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Brand</div>
            <div className="text-sm">{product.brand}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Rating</div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm">{product.rating || 'N/A'}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{product.price !== null ? `$${product.price.toFixed(2)}` : 'N/A'}</span>
            </div>
          </div>
        </div>
        
        {product.affiliateLink && (
          <div className="mt-4">
            <Button variant="outline" size="sm" asChild>
              <a href={product.affiliateLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Amazon
              </a>
            </Button>
          </div>
        )}
      </div>

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