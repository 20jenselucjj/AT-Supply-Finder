import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Edit, 
  Trash2, 
  Star, 
  DollarSign,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { ProductData } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProductForm } from '@/components/pages/admin/ProductForm';

interface ProductTableProps {
  products: ProductData[];
  selectedProducts: Set<string>;
  handleSelectProduct: (productId: string, checked: boolean) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  handleSelectAll: (checked: boolean) => void;
  openEditDialog: (product: ProductData) => void;
  handleDeleteProduct: (productId: string) => void;
  getMinPrice: (offers: any[]) => number | null;
  productForm: any;
  setProductForm: (value: any) => void;
  handleUpdateProduct: () => void;
  handleAffiliateLinkChange: (url: string) => void;
  handleEnhanceWithAI: () => void;
  isLoadingProductInfo: boolean;
  categories: string[];
  brands: string[];
  updateProduct: (id: string, data: any) => Promise<void>;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  selectedProducts,
  handleSelectProduct,
  isAllSelected,
  isIndeterminate,
  handleSelectAll,
  openEditDialog,
  handleDeleteProduct,
  getMinPrice,
  productForm,
  setProductForm,
  handleUpdateProduct,
  handleAffiliateLinkChange,
  handleEnhanceWithAI,
  isLoadingProductInfo,
  categories,
  brands,
  updateProduct
}) => {
  const [editingField, setEditingField] = useState<{id: string, field: string} | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEditingProduct, setCurrentEditingProduct] = useState<ProductData | null>(null);
  const [editProductForm, setEditProductForm] = useState<any>({});

  const handleEditClick = (product: ProductData) => {
    setCurrentEditingProduct(product);
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
    if (!currentEditingProduct) return;
    
    try {
      await updateProduct(currentEditingProduct.id, editProductForm);
      setIsEditDialogOpen(false);
      setCurrentEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleFieldChange = (productId: string, field: string, value: string) => {
    setProductForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="hidden md:block border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="w-12 p-4">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                ref={(el) => {
                  if (el) (el as HTMLInputElement).indeterminate = isIndeterminate;
                }}
              />
            </th>
            <th className="p-4 text-left">Product</th>
            <th className="p-4 text-left">Category</th>
            <th className="p-4 text-left">Brand</th>
            <th className="p-4 text-left">Rating</th>
            <th className="p-4 text-left">Price</th>
            <th className="p-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b hover:bg-muted/50">
              <td className="p-4">
                <Checkbox
                  checked={selectedProducts.has(product.id)}
                  onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                />
              </td>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">No Image</span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ASIN: {product.asin || 'N/A'}
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                  {product.category}
                </div>
              </td>
              <td className="p-4">{product.brand}</td>
              <td className="p-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span>{product.rating || 'N/A'}</span>
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{product.price !== null ? product.price.toFixed(2) : 'N/A'}</span>
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(product)}
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
                  {product.affiliateLink && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a href={product.affiliateLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {currentEditingProduct && (
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};