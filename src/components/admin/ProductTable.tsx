import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Edit, Trash2 } from "lucide-react";
import { ProductData } from "./types";

interface ProductTableProps {
  products: ProductData[];
  selectedProducts: Set<string>;
  handleSelectProduct: (productId: string, checked: boolean) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  handleSelectAll: (checked: boolean) => void;
  openEditDialog: (product: ProductData) => void;
  handleDeleteProduct: (productId: string) => void;
  getMinPrice: (offers: any[] | undefined) => number | null;
  productForm: any;
  setProductForm: React.Dispatch<React.SetStateAction<any>>;
  handleUpdateProduct: () => void;
  handleAffiliateLinkChange: (url: string) => void;
  isLoadingProductInfo: boolean;
  categories: string[];
  brands: string[];
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
  isLoadingProductInfo,
  categories,
  brands
}) => {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                ref={(el) => {
                  if (el) (el as HTMLInputElement).indeterminate = isIndeterminate;
                }}
              />
            </TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="hidden lg:table-cell">Material</TableHead>
            <TableHead className="hidden xl:table-cell">Qty</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const minPrice = getMinPrice(product.vendor_offers);
            return (
              <TableRow key={product.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedProducts.has(product.id)}
                    onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.dimensions && `${product.dimensions} • `}
                        {product.weight}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{product.category}</Badge>
                </TableCell>
                <TableCell>{product.brand}</TableCell>
                <TableCell>
                  {product.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {product.rating}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {product.vendor_offers && product.vendor_offers.length > 0
                    ? `$${product.vendor_offers.reduce((min, p) => p.price < min ? p.price : min, product.vendor_offers[0].price).toFixed(2)}`
                    : product.price ? `$${product.price.toFixed(2)}` : 'N/A'}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {product.material || 'N/A'}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {product.weight || 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Product</DialogTitle>
                          <DialogDescription>
                            Update product information.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label htmlFor="edit-affiliate_link">Amazon Affiliate Link</Label>
                            <div className="flex gap-2">
                              <Input
                                id="edit-affiliate_link"
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
                          <div className="col-span-2">
                            <Label htmlFor="edit-name">Product Name *</Label>
                            <Input
                              id="edit-name"
                              value={productForm.name}
                              onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-category">Category *</Label>
                            <Input
                              id="edit-category"
                              value={productForm.category}
                              onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-brand">Brand *</Label>
                            <Input
                              id="edit-brand"
                              value={productForm.brand}
                              onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-rating">Rating (0-5)</Label>
                            <Input
                              id="edit-rating"
                              type="number"
                              min="0"
                              max="5"
                              step="0.1"
                              value={productForm.rating}
                              onChange={(e) => setProductForm(prev => ({ ...prev, rating: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-price">Price ($)</Label>
                            <Input
                              id="edit-price"
                              type="number"
                              min="0"
                              step="0.01"
                              value={productForm.price}
                              onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                              placeholder="29.99"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-dimensions">Dimensions</Label>
                            <Input
                              id="edit-dimensions"
                              value={productForm.dimensions}
                              onChange={(e) => setProductForm(prev => ({ ...prev, dimensions: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-weight">Qty</Label>
                            <Input
                              id="edit-weight"
                              value={productForm.weight}
                              onChange={(e) => setProductForm(prev => ({ ...prev, weight: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-material">Material</Label>
                            <Input
                              id="edit-material"
                              value={productForm.material}
                              onChange={(e) => setProductForm(prev => ({ ...prev, material: e.target.value }))}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label htmlFor="edit-features">Features (one per line)</Label>
                            <Textarea
                              id="edit-features"
                              value={productForm.features}
                              onChange={(e) => setProductForm(prev => ({ ...prev, features: e.target.value }))}
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-image_url">Image URL</Label>
                            <Input
                              id="edit-image_url"
                              value={productForm.image_url}
                              onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-asin">ASIN</Label>
                            <Input
                              id="edit-asin"
                              value={productForm.asin}
                              onChange={(e) => setProductForm(prev => ({ ...prev, asin: e.target.value }))}
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
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};