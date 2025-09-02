import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap } from "lucide-react";

interface ProductFormProps {
  productForm: any;
  setProductForm: React.Dispatch<React.SetStateAction<any>>;
  handleAffiliateLinkChange: (url: string) => void;
  handleEnhanceWithAI?: () => void;
  isLoadingProductInfo: boolean;
  handleSubmit: () => void;
  onCancel: () => void;
  isEditing?: boolean;
}

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

export const ProductForm: React.FC<ProductFormProps> = ({
  productForm,
  setProductForm,
  handleAffiliateLinkChange,
  handleEnhanceWithAI,
  isLoadingProductInfo,
  handleSubmit,
  onCancel,
  isEditing = false
}) => {
  // Get the category ID for the current category name
  const currentCategoryId = getCategoryIdByName(productForm.category || "");
  
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="affiliateLink">Amazon Affiliate Link</Label>
          <div className="flex gap-2">
            <Input
              id="affiliateLink"
              value={productForm.affiliateLink}
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
          <Select 
            value={currentCategoryId} 
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
                      {FIRST_AID_CATEGORIES.find(cat => cat.name === productForm.category)?.icon}
                    </span>
                    <span>{productForm.category}</span>
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
          <Label htmlFor="weight">Qty</Label>
          <Input
            id="weight"
            value={productForm.weight}
            onChange={(e) => setProductForm(prev => ({ ...prev, weight: e.target.value }))}
            placeholder="e.g., 100 ct"
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
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            value={productForm.imageUrl}
            onChange={(e) => setProductForm(prev => ({ ...prev, imageUrl: e.target.value }))}
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