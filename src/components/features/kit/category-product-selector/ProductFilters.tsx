import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, ChevronDown } from "lucide-react";
import { ProductFiltersProps } from "./types";

export const ProductFilters = ({
  searchTerm,
  setSearchTerm,
  brandFilter,
  setBrandFilter,
  priceRange,
  setPriceRange,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  availableBrands,
  clearAllFilters,
  products,
  filteredProducts,
  filtersExpanded,
  setFiltersExpanded
}: ProductFiltersProps) => {
  return (
    <Card className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-hidden flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </div>
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
          </button>
        </CardTitle>
      </CardHeader>
      {filtersExpanded && (
        <CardContent className="flex-1 overflow-y-auto space-y-6">
          {/* Brand Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Brand</label>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All brands</SelectItem>
                {availableBrands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Price Range</label>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Min price"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Max price"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              />
            </div>
          </div>
          

          
          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="w-full"
              size="sm"
            >
              Clear All Filters
            </Button>
            <div className="text-center">
              <Badge variant="outline">
                {filteredProducts.length} of {products.length} products
              </Badge>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};