import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AdvancedFilters } from "./types";

interface FiltersProps {
  advancedFilters: AdvancedFilters;
  setAdvancedFilters: React.Dispatch<React.SetStateAction<AdvancedFilters>>;
  brands: string[];
  resetFilters: () => void;
  applyFilters: () => void;
}

export const Filters: React.FC<FiltersProps> = ({
  advancedFilters,
  setAdvancedFilters,
  brands,
  resetFilters,
  applyFilters
}) => {
  return (
    <Card className="mb-4 p-4 bg-muted/50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Price Range */}
        <div>
          <Label htmlFor="min-price">Min Price</Label>
          <Input
            id="min-price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={advancedFilters.minPrice ?? ''}
            onChange={(e) => setAdvancedFilters(prev => ({
              ...prev,
              minPrice: e.target.value ? parseFloat(e.target.value) : undefined
            }))}
          />
        </div>
        <div>
          <Label htmlFor="max-price">Max Price</Label>
          <Input
            id="max-price"
            type="number"
            min="0"
            step="0.01"
            placeholder="1000.00"
            value={advancedFilters.maxPrice ?? ''}
            onChange={(e) => setAdvancedFilters(prev => ({
              ...prev,
              maxPrice: e.target.value ? parseFloat(e.target.value) : undefined
            }))}
          />
        </div>
        
        {/* Rating Range */}
        <div>
          <Label htmlFor="min-rating">Min Rating</Label>
          <Input
            id="min-rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            placeholder="0.0"
            value={advancedFilters.minRating ?? ''}
            onChange={(e) => setAdvancedFilters(prev => ({
              ...prev,
              minRating: e.target.value ? parseFloat(e.target.value) : undefined
            }))}
          />
        </div>
        <div>
          <Label htmlFor="max-rating">Max Rating</Label>
          <Input
            id="max-rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            placeholder="5.0"
            value={advancedFilters.maxRating ?? ''}
            onChange={(e) => setAdvancedFilters(prev => ({
              ...prev,
              maxRating: e.target.value ? parseFloat(e.target.value) : undefined
            }))}
          />
        </div>
        
        {/* Brand Filter */}
        <div>
          <Label htmlFor="brand-filter">Brand</Label>
          <Select 
            value={advancedFilters.brand || ''} 
            onValueChange={(value) => setAdvancedFilters(prev => ({
              ...prev,
              brand: value === 'all' ? '' : value
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map(brand => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Material Filter */}
        <div>
          <Label htmlFor="material-filter">Material</Label>
          <Input
            id="material-filter"
            placeholder="e.g., Cotton, Neoprene"
            value={advancedFilters.material || ''}
            onChange={(e) => setAdvancedFilters(prev => ({
              ...prev,
              material: e.target.value
            }))}
          />
        </div>
        
        {/* Weight Filter */}
        <div>
          <Label htmlFor="weight-filter">Qty</Label>
          <Input
            id="weight-filter"
            placeholder="e.g., 2 lbs, 500g"
            value={advancedFilters.weight || ''}
            onChange={(e) => setAdvancedFilters(prev => ({
              ...prev,
              weight: e.target.value
            }))}
          />
        </div>
        
        {/* Filter Actions */}
        <div className="flex items-end gap-2">
          <Button 
            variant="outline" 
            onClick={resetFilters}
            className="w-full"
          >
            Reset
          </Button>
          <Button 
            onClick={applyFilters}
            className="w-full"
          >
            Apply
          </Button>
        </div>
      </div>
    </Card>
  );
};