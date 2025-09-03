import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AdvancedFilters } from "./types";

interface FiltersProps {
  advancedFilters: AdvancedFilters;
  setAdvancedFilters: React.Dispatch<React.SetStateAction<AdvancedFilters>>;
  resetFilters: () => void;
  applyFilters: () => void;
}

export const Filters: React.FC<FiltersProps> = ({
  advancedFilters,
  setAdvancedFilters,
  resetFilters,
  applyFilters
}) => {
  return (
    <Card className="mb-4 p-4 bg-muted/50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Simplified filters - only essential ones */}
        
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
        
        {/* Simplified actions */}
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