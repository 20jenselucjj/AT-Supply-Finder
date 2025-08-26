import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface ProductFormProps {
  productForm: any;
  setProductForm: React.Dispatch<React.SetStateAction<any>>;
  handleAffiliateLinkChange: (url: string) => void;
  isLoadingProductInfo: boolean;
  handleSubmit: () => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  productForm,
  setProductForm,
  handleAffiliateLinkChange,
  isLoadingProductInfo,
  handleSubmit,
  onCancel,
  isEditing = false
}) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="affiliate_link">Amazon Affiliate Link</Label>
          <div className="flex gap-2">
            <Input
              id="affiliate_link"
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
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={productForm.name}
            onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter product name"
          />
        </div>
        <div>
          <Label htmlFor="category">Category *</Label>
          <Input
            id="category"
            value={productForm.category}
            onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
            placeholder="e.g., Athletic Tape"
          />
        </div>
        <div>
          <Label htmlFor="brand">Brand *</Label>
          <Input
            id="brand"
            value={productForm.brand}
            onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
            placeholder="e.g., Mueller"
          />
        </div>
        <div>
          <Label htmlFor="rating">Rating (0-5)</Label>
          <Input
            id="rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={productForm.rating}
            onChange={(e) => setProductForm(prev => ({ ...prev, rating: e.target.value }))}
            placeholder="4.5"
          />
        </div>
        <div>
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={productForm.price}
            onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
            placeholder="29.99"
          />
        </div>
        <div>
          <Label htmlFor="dimensions">Dimensions</Label>
          <Input
            id="dimensions"
            value={productForm.dimensions}
            onChange={(e) => setProductForm(prev => ({ ...prev, dimensions: e.target.value }))}
            placeholder="e.g., 1.5in x 15yd"
          />
        </div>
        <div>
          <Label htmlFor="weight">Weight</Label>
          <Input
            id="weight"
            value={productForm.weight}
            onChange={(e) => setProductForm(prev => ({ ...prev, weight: e.target.value }))}
            placeholder="e.g., 3.2 lbs"
          />
        </div>
        <div>
          <Label htmlFor="material">Material</Label>
          <Input
            id="material"
            value={productForm.material}
            onChange={(e) => setProductForm(prev => ({ ...prev, material: e.target.value }))}
            placeholder="e.g., Cotton blend"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="features">Features (one per line)</Label>
          <Textarea
            id="features"
            value={productForm.features}
            onChange={(e) => setProductForm(prev => ({ ...prev, features: e.target.value }))}
            placeholder="High tensile strength
Hypoallergenic adhesive
Easy tear"
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="image_url">Image URL</Label>
          <Input
            id="image_url"
            value={productForm.image_url}
            onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <div>
          <Label htmlFor="asin">ASIN</Label>
          <Input
            id="asin"
            value={productForm.asin}
            onChange={(e) => setProductForm(prev => ({ ...prev, asin: e.target.value }))}
            placeholder="Amazon ASIN"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {isEditing ? 'Update Product' : 'Create Product'}
        </Button>
      </DialogFooter>
    </>
  );
};