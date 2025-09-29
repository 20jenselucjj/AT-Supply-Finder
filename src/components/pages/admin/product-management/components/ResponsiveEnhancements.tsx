import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu,
  Filter,
  Search,
  MoreHorizontal,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Eye,
  Settings
} from 'lucide-react';
import { ProductData } from '../types';

// Mobile-optimized search component
export const MobileSearch: React.FC<{
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}> = ({ searchTerm, setSearchTerm, onSearch, placeholder = "Search products..." }) => {
  return (
    <div className="md:hidden sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button onClick={onSearch} size="sm" className="px-4">
          Go
        </Button>
      </div>
    </div>
  );
};

// Mobile-optimized filter toggle
export const MobileFilterToggle: React.FC<{
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  hasActiveFilters: boolean;
}> = ({ showFilters, setShowFilters, hasActiveFilters }) => {
  return (
    <div className="md:hidden">
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                !
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {/* Filter content would go here */}
            <p className="text-sm text-muted-foreground">Filter options will be implemented here</p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// View toggle component for switching between grid and list views
export const ViewToggle: React.FC<{
  viewMode: 'grid' | 'list' | 'table';
  setViewMode: (mode: 'grid' | 'list' | 'table') => void;
}> = ({ viewMode, setViewMode }) => {
  return (
    <div className="hidden md:flex items-center border rounded-lg p-1 bg-muted/50">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('grid')}
        className="h-8 w-8 p-0"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('list')}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Mobile product quick actions
export const MobileProductActions: React.FC<{
  product: ProductData;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}> = ({ product, onEdit, onDelete, onView }) => {
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle className="text-left">
              {product.name}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <Button onClick={onView} variant="outline" className="w-full justify-start gap-2">
              <Eye className="h-4 w-4" />
              View Details
            </Button>
            <Button onClick={onEdit} variant="outline" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Edit Product
            </Button>
            <Button
              onClick={onDelete}
              variant="destructive"
              className="w-full justify-start gap-2"
            >
              Delete Product
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// Responsive product grid for mobile
export const ResponsiveProductGrid: React.FC<{
  products: ProductData[];
  isLoading?: boolean;
}> = ({ products, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-muted rounded-lg h-48 mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:hidden">
      {products.map((product) => (
        <Card key={product.id} className="group hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-sm text-muted-foreground">No Image</span>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
                <span className="font-semibold text-sm">
                  ${product.price?.toFixed(2) || 'N/A'}
                </span>
              </div>

            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Responsive table for mobile
export const ResponsiveProductTable: React.FC<{
  products: ProductData[];
  selectedProducts: Set<string>;
  onSelectProduct: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}> = ({ products, selectedProducts, onSelectProduct, onSelectAll, isAllSelected, isIndeterminate }) => {
  return (
    <div className="md:hidden">
      <div className="space-y-2">
        {/* Mobile table header */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg text-sm font-medium">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="rounded"
          />
          <span className="flex-1">Product</span>
          <span className="w-20 text-right">Price</span>
        </div>

        {/* Mobile table rows */}
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedProducts.has(product.id)}
                onChange={(e) => onSelectProduct(product.id, e.target.checked)}
                className="rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm truncate">{product.name}</h3>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {product.category}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{product.brand}</span>
                  <span className="font-medium">
                    ${product.price?.toFixed(2) || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Responsive pagination
export const ResponsivePagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPages?: number;
}> = ({ currentPage, totalPages, onPageChange, showPages = 5 }) => {
  const getVisiblePages = () => {
    const delta = Math.floor(showPages / 2);
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, currentPage + delta);

    if (end - start + 1 < showPages) {
      if (start === 1) {
        end = Math.min(totalPages, start + showPages - 1);
      } else {
        start = Math.max(1, end - showPages + 1);
      }
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          ‹
        </Button>

        {getVisiblePages().map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="h-8 w-8 p-0 min-w-[32px]"
          >
            {page}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          ›
        </Button>
      </div>
    </div>
  );
};