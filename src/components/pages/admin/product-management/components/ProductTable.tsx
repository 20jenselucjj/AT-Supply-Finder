import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Edit,
  Trash2,
  Star,
  DollarSign,
  ExternalLink,
  ChevronDown,
  MoreVertical,
  Eye,
  Copy,
  Archive,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ProductData;
    direction: 'asc' | 'desc';
  }>({ key: 'name', direction: 'asc' });

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

  const handleSort = (key: keyof ProductData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof ProductData) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  const handleQuickActions = (action: string, product: ProductData) => {
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
    <div className="hidden md:block">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(el) => {
                    if (el) (el as HTMLInputElement).indeterminate = isIndeterminate;
                  }}
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('name')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Product
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('category')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Category
                  {getSortIcon('category')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('brand')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Brand
                  {getSortIcon('brand')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('rating')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Rating
                  {getSortIcon('rating')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('price')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Price
                  {getSortIcon('price')}
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow
                key={product.id}
                className="group hover:bg-muted/30 transition-colors"
              >
                <TableCell>
                  <Checkbox
                    checked={selectedProducts.has(product.id)}
                    onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg ring-1 ring-border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center ring-1 ring-border">
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
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">
                        {product.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ASIN: {product.asin || 'N/A'}
                      </div>
                      {product.affiliateLink && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Amazon
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="w-fit">
                      {product.category}
                    </Badge>
                    {product.material && (
                      <span className="text-xs text-muted-foreground">
                        {product.material}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{product.brand}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{product.rating || 'N/A'}</span>
                    </div>
                    <StatusBadge rating={product.rating} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {product.price !== null ? `$${product.price.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
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
                      <DropdownMenuItem onClick={() => handleEditClick(product)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Product
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleQuickActions('duplicate', product)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleQuickActions('view', product)}>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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