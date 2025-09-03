import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Edit, Trash2, Zap } from "lucide-react";
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
  handleEnhanceWithAI?: () => void;
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
  handleEnhanceWithAI,
  isLoadingProductInfo
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const minPrice = getMinPrice(product.vendor_offers);
  
  const handleOpenEditDialog = (product: ProductData) => {
    openEditDialog(product);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
  };

  // Map database category names to friendly names
  const mapDatabaseCategoryToFriendlyName = (databaseCategory: string): string => {
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
    
    return categoryMapping[databaseCategory] || databaseCategory;
  };

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
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            {product.affiliateLink ? (
              <a 
                href={product.affiliateLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-sm leading-tight mb-1 line-clamp-2 text-blue-600 hover:underline"
              >
                {product.name}
              </a>
            ) : (
              <h3 className="font-medium text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
            )}
            <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">{mapDatabaseCategoryToFriendlyName(product.category)}</Badge>
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
            <Label className="text-xs text-muted-foreground">Qty</Label>
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
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                onClick={() => handleOpenEditDialog(product)}
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
                  {handleEnhanceWithAI && (
                    <div className="mt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        onClick={handleEnhanceWithAI}
                        disabled={isLoadingProductInfo}
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        {isLoadingProductInfo ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                            Enhancing with AI...
                          </>
                        ) : (
                          'Enhance with AI'
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        AI will optimize product name, features, category, and extract quantity/material
                      </p>
                    </div>
                  )}
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
                  <Select 
                    value={getCategoryIdByName(mapDatabaseCategoryToFriendlyName(productForm.category || ""))} 
                    onValueChange={(value) => {
                      const categoryName = getCategoryNameById(value);
                      setProductForm(prev => ({ ...prev, category: categoryName }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category">
                        {productForm.category && (
                          <div className="flex items-center">
                            <span className="mr-2">
                              {FIRST_AID_CATEGORIES.find(cat => cat.name === mapDatabaseCategoryToFriendlyName(productForm.category))?.icon}
                            </span>
                            <span>{mapDatabaseCategoryToFriendlyName(productForm.category)}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {FIRST_AID_CATEGORIES.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center">
                            <span className="mr-2">{category.icon}</span>
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Button variant="outline" onClick={handleCloseEditDialog}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  handleUpdateProduct();
                  handleCloseEditDialog();
                }}>
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

// Define the list of valid first aid categories with their icons
const FIRST_AID_CATEGORIES = [
  { id: "wound-care-dressings", name: "Wound Care & Dressings", icon: "🩹" },
  { id: "tapes-wraps", name: "Tapes & Wraps", icon: "🧵" },
  { id: "antiseptics-ointments", name: "Antiseptics & Ointments", icon: "🧴" },
  { id: "pain-relief", name: "Pain & Symptom Relief", icon: "💊" },
  { id: "instruments-tools", name: "Instruments & Tools", icon: "🛠️" },
  { id: "trauma-emergency", name: "Trauma & Emergency", icon: "🚨" },
  { id: "ppe", name: "Personal Protection Equipment (PPE)", icon: "🛡️" },
  { id: "information-essentials", name: "First Aid Information & Essentials", icon: "📋" },
  { id: "hot-cold-therapy", name: "Hot & Cold Therapy", icon: "🧊" },
  { id: "hydration-nutrition", name: "Hydration & Nutrition", icon: "💧" },
  { id: "miscellaneous", name: "Miscellaneous & General", icon: "📦" }
];

// Map category IDs to their display names
const getCategoryNameById = (id: string): string => {
  const category = FIRST_AID_CATEGORIES.find(cat => cat.id === id);
  return category ? category.name : id;
};

// Map category names to their IDs
const getCategoryIdByName = (name: string): string => {
  const category = FIRST_AID_CATEGORIES.find(cat => cat.name === name);
  return category ? category.id : name;
};

