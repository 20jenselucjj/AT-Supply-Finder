import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Download } from 'lucide-react';

interface BulkActionsProps {
  selectedProducts: Set<string>;
  isDeleting: boolean;
  handleBulkDelete: () => void;
  handleBulkExport: () => void;
  handleBulkUpdate: () => void;
  bulkUpdateData: any;
  setBulkUpdateData: (value: any) => void;
  categories: string[];
  brands: string[];
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedProducts,
  isDeleting,
  handleBulkDelete,
  handleBulkExport,
  handleBulkUpdate,
  bulkUpdateData,
  setBulkUpdateData,
  categories,
  brands
}) => {
  const handleBulkUpdateChange = (field: string, value: string) => {
    setBulkUpdateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="border rounded-lg p-5 mb-5 bg-muted/50">
      <h3 className="text-lg font-medium mb-5">Bulk Actions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-2">
          <Label htmlFor="bulk-category" className="text-sm font-medium">Update Category</Label>
          <Select 
            value={bulkUpdateData.category} 
            onValueChange={(value) => handleBulkUpdateChange('category', value)}
          >
            <SelectTrigger id="bulk-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bulk-brand" className="text-sm font-medium">Update Brand</Label>
          <Select 
            value={bulkUpdateData.brand} 
            onValueChange={(value) => handleBulkUpdateChange('brand', value)}
          >
            <SelectTrigger id="bulk-brand">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end">
          <Button 
            onClick={handleBulkUpdate}
            disabled={!bulkUpdateData.category && !bulkUpdateData.brand}
            className="w-full"
          >
            Apply Updates
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 mt-5">
        <Button
          variant="destructive"
          onClick={handleBulkDelete}
          disabled={isDeleting || selectedProducts.size === 0}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? 'Deleting...' : `Delete (${selectedProducts.size})`}
        </Button>
        <Button
          variant="outline"
          onClick={handleBulkExport}
          disabled={selectedProducts.size === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export Selected
        </Button>
      </div>
    </div>
  );
};