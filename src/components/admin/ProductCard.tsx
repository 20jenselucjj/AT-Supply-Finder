import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Edit, Trash2 } from "lucide-react";
import { ProductData } from "./types";

interface ProductCardProps {
  product: ProductData;
  isSelected: boolean;
  handleSelectProduct: (productId: string, checked: boolean) => void;
  openEditDialog: (product: ProductData) => void;
  handleDeleteProduct: (productId: string) => void;
  getMinPrice: (offers: any[] | undefined) => number | null;
  productForm: any;
  setProductForm: React.Dispatch<React.SetStateAction<any>>;
  handleUpdateProduct: () => void;
  handleAffiliateLinkChange: (url: string) => void;
  isLoadingProductInfo: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected,
  handleSelectProduct,
  openEditDialog,
  handleDeleteProduct,
  getMinPrice,
  productForm,
  setProductForm,
  handleUpdateProduct,
  handleAffiliateLinkChange,
  isLoadingProductInfo
}) => {
  const minPrice = getMinPrice(product.vendor_offers);
  
  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header with checkbox and product info */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
            className="mt-1 flex-shrink-0"
          />
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-16 h-16 object-cover rounded flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
            <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">{product.category}</Badge>
              <span>{product.brand}</span>
            </div>
          </div>
        </div>

        {/* Product details */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <Label className="text-xs text-muted-foreground">Price</Label>
            <div className="font-medium">
              {product.vendor_offers && product.vendor_offers.length > 0
                ? `$${product.vendor_offers.reduce((min, p) => p.price < min ? p.price : min, product.vendor_offers[0].price).toFixed(2)}`
                : product.price ? `$${product.price.toFixed(2)}` : 'N/A'}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Rating</Label>
            <div className="flex items-center gap-1">
              {product.rating ? (
                <>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{product.rating}</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">N/A</span>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Material</Label>
            <div className="font-medium">
              {product.material || 'N/A'}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Weight</Label>
            <div className="font-medium">
              {product.weight || 'N/A'}
            </div>
          </div>
        </div>

        {/* Dimensions */}
        {product.dimensions && (
          <div className="text-xs text-muted-foreground">
            Dimensions: {product.dimensions}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                onClick={() => openEditDialog(product)}
              >
                <Edit className="h-4 w-4 mr-2" />
                <span className="text-xs">Edit</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update product information.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <Label htmlFor="mobile-edit-affiliate_link">Amazon Affiliate Link</Label>
                  <div className="flex gap-2">
                    <Input
                      id="mobile-edit-affiliate_link"
                      value={productForm.affiliate_link}
                      onChange={(e) => handleAffiliateLinkChange(e.target.value)}
                      placeholder="Paste Amazon affiliate link to auto-populate product info"
                      disabled={isLoadingProductInfo}
                    />
                    {isLoadingProductInfo && (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Paste an Amazon product link to automatically extract the ASIN and help populate product details
                  </p>
                </div>
                <div className="col-span-full">
                  <Label htmlFor="mobile-edit-name">Product Name *</Label>
                  <Input
                    id="mobile-edit-name"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="mobile-edit-category">Category *</Label>
                  <Input
                    id="mobile-edit-category"
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="mobile-edit-brand">Brand *</Label>
                  <Input
                    id="mobile-edit-brand"
                    value={productForm.brand}
                    onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  // Reset form when closing
                }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateProduct}>
                  Update Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 h-9">
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="text-xs">Delete</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{product.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteProduct(product.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
};