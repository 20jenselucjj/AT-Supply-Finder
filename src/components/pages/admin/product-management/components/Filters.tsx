import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface FiltersProps {
  advancedFilters: any;
  setAdvancedFilters: (value: any) => void;
  resetFilters: () => void;
  applyFilters: () => void;
}

export const Filters: React.FC<FiltersProps> = ({
  advancedFilters,
  setAdvancedFilters,
  resetFilters,
  applyFilters
}) => {
  const handleFilterChange = (field: string, value: string | number | undefined) => {
    setAdvancedFilters({
      ...advancedFilters,
      [field]: value === '' ? undefined : value
    });
  };

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Advanced Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="min-price" className="text-sm font-medium">
            Min Price
          </Label>
          <Input
            id="min-price"
            type="number"
            placeholder="0"
            value={advancedFilters.minPrice || ''}
            onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
          />
        </div>
        
        <div>
          <Label htmlFor="max-price" className="text-sm font-medium">
            Max Price
          </Label>
          <Input
            id="max-price"
            type="number"
            placeholder="1000"
            value={advancedFilters.maxPrice || ''}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
          />
        </div>
        
        <div>
          <Label htmlFor="min-rating" className="text-sm font-medium">
            Min Rating
          </Label>
          <Input
            id="min-rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            placeholder="0"
            value={advancedFilters.minRating || ''}
            onChange={(e) => handleFilterChange('minRating', e.target.value ? parseFloat(e.target.value) : undefined)}
          />
        </div>
        
        <div>
          <Label htmlFor="max-rating" className="text-sm font-medium">
            Max Rating
          </Label>
          <Input
            id="max-rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            placeholder="5"
            value={advancedFilters.maxRating || ''}
            onChange={(e) => handleFilterChange('maxRating', e.target.value ? parseFloat(e.target.value) : undefined)}
          />
        </div>
        
        <div>
          <Label htmlFor="brand-filter" className="text-sm font-medium">
            Brand
          </Label>
          <Input
            id="brand-filter"
            placeholder="Brand name"
            value={advancedFilters.brand}
            onChange={(e) => handleFilterChange('brand', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="material-filter" className="text-sm font-medium">
            Material
          </Label>
          <Input
            id="material-filter"
            placeholder="Material"
            value={advancedFilters.material}
            onChange={(e) => handleFilterChange('material', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="weight-filter" className="text-sm font-medium">
            Weight
          </Label>
          <Input
            id="weight-filter"
            placeholder="Weight"
            value={advancedFilters.weight}
            onChange={(e) => handleFilterChange('weight', e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={resetFilters}>
          Reset
        </Button>
        <Button onClick={applyFilters}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
};