import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useRBAC } from '@/hooks/use-rbac';

interface AmazonProductSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Define the 11 first aid categories from the existing system
const FIRST_AID_CATEGORIES = [
  { id: 'wound-care-dressings', name: 'Wound Care & Dressings', icon: '🩹' },
  { id: 'tapes-wraps', name: 'Tapes & Wraps', icon: '🧵' },
  { id: 'antiseptics-ointments', name: 'Antiseptics & Ointments', icon: '🧴' },
  { id: 'pain-relief', name: 'Pain & Symptom Relief', icon: '💊' },
  { id: 'instruments-tools', name: 'Instruments & Tools', icon: '🛠️' },
  { id: 'trauma-emergency', name: 'Trauma & Emergency', icon: '🚨' },
  { id: 'ppe', name: 'Personal Protection Equipment (PPE)', icon: '🛡️' },
  { id: 'information-essentials', name: 'First Aid Information & Essentials', icon: '📋' },
  { id: 'hot-cold-therapy', name: 'Hot & Cold Therapy', icon: '🧊' },
  { id: 'hydration-nutrition', name: 'Hydration & Nutrition', icon: '💧' },
  { id: 'miscellaneous', name: 'Miscellaneous & General', icon: '📦' },
];

export const AmazonProductSelectionModal: React.FC<AmazonProductSelectionModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { isAdmin } = useRBAC();
  // State for selected categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // State for products per category
  const [productsPerCategory, setProductsPerCategory] = useState<number>(5);
  
  // State for loading
  const [isImporting, setIsImporting] = useState(false);

  // Handle category selection
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryId]);
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    }
  };

  // Handle select all categories
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(FIRST_AID_CATEGORIES.map(cat => cat.id));
    } else {
      setSelectedCategories([]);
    }
  };

  // Validate and submit form
  const handleSubmit = async () => {
    // Check if user has admin permissions
    if (!isAdmin) {
      toast.error('You do not have permission to import Amazon products');
      return;
    }
    
    // Validation
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    if (productsPerCategory < 1 || productsPerCategory > 10) {
      toast.error('Products per category must be between 1 and 10');
      return;
    }
    
    try {
      setIsImporting(true);
      toast.info('Importing products from Amazon...');
      
      // Call the API endpoint to import products
      const response = await fetch('http://localhost:3001/api/import-amazon-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedCategories,
          productsPerCategory
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to import products');
      }
      
      if (result.success) {
        toast.success(result.message);
        handleCancel();
      } else {
        throw new Error(result.error || 'Failed to import products');
      }
    } catch (error: any) {
      console.error('Error importing Amazon products:', error);
      toast.error(`Failed to import products: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Reset form and close modal
  const handleCancel = () => {
    setSelectedCategories([]);
    setProductsPerCategory(5);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Amazon Products</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Select First Aid Categories
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedCategories.length === FIRST_AID_CATEGORIES.length}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <Label htmlFor="select-all" className="text-sm">
                  Select All
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4">
              {FIRST_AID_CATEGORIES.map((category) => (
                <div key={category.id} className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50">
                  <Checkbox
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                    id={category.id}
                  />
                  <Label htmlFor={category.id} className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-lg">{category.icon}</span>
                    <span>{category.name}</span>
                  </Label>
                </div>
              ))}
            </div>

            {selectedCategories.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedCategories.length} of {FIRST_AID_CATEGORIES.length} categories selected
              </p>
            )}
          </div>

          <Separator />

          {/* Products Per Category Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="products-per-category" className="text-base font-semibold">
                Products Per Category
              </Label>
              <span className="text-sm text-muted-foreground">
                Current: {productsPerCategory}
              </span>
            </div>

            <div className="space-y-2">
              <Input
                id="products-per-category"
                type="number"
                min="1"
                max="10"
                value={productsPerCategory}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    // Ensure value is within range
                    if (value < 1) {
                      setProductsPerCategory(1);
                    } else if (value > 10) {
                      setProductsPerCategory(10);
                    } else {
                      setProductsPerCategory(value);
                    }
                  }
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Minimum: 1</span>
                <span>Maximum: 10</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Specify how many products to create for each selected category.
                Default is 5 products per category.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedCategories.length === 0 || isImporting || !isAdmin}
          >
            {isImporting ? 'Importing...' : 'Create Products'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};