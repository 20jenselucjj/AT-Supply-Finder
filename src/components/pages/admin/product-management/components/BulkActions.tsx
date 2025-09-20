import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Trash2,
  Download,
  Edit,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const [isUpdating, setIsUpdating] = useState(false);

  const handleBulkUpdateChange = (field: string, value: string) => {
    setBulkUpdateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyBulkUpdate = async () => {
    if (!bulkUpdateData.category && !bulkUpdateData.brand) {
      return;
    }

    setIsUpdating(true);
    try {
      await handleBulkUpdate();
    } finally {
      setIsUpdating(false);
    }
  };

  const hasChanges = bulkUpdateData.category || bulkUpdateData.brand;
  const canApplyUpdate = hasChanges && !isUpdating;

  return (
    <Card className="border-2 border-primary/20 bg-primary/5 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Bulk Actions</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {selectedProducts.size} Selected
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Update Fields */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Edit className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Update Fields</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-category" className="text-sm font-medium">
                Category
              </Label>
              <Select
                value={bulkUpdateData.category}
                onValueChange={(value) => handleBulkUpdateChange('category', value)}
              >
                <SelectTrigger id="bulk-category" className="h-10">
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
              <Label htmlFor="bulk-brand" className="text-sm font-medium">
                Brand
              </Label>
              <Select
                value={bulkUpdateData.brand}
                onValueChange={(value) => handleBulkUpdateChange('brand', value)}
              >
                <SelectTrigger id="bulk-brand" className="h-10">
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
          </div>

          {hasChanges && (
            <Button
              onClick={handleApplyBulkUpdate}
              disabled={!canApplyUpdate}
              className="w-full md:w-auto gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? 'Applying Updates...' : 'Apply Updates'}
            </Button>
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Actions</Label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeleting || selectedProducts.size === 0}
              className="gap-2 shadow-sm hover:shadow-md transition-shadow"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : `Delete (${selectedProducts.size})`}
            </Button>

            <Button
              variant="outline"
              onClick={handleBulkExport}
              disabled={selectedProducts.size === 0}
              className="gap-2 shadow-sm hover:shadow-md transition-shadow"
            >
              <Download className="h-4 w-4" />
              Export Selected
            </Button>
          </div>
        </div>

        {/* Warning for large selections */}
        {selectedProducts.size > 10 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Large selection detected. This action will affect {selectedProducts.size} products.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};