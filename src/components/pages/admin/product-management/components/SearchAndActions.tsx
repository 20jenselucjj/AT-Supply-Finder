import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  Filter, 
  Search,
  ChevronDown
} from 'lucide-react';

interface SearchAndActionsProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  categories: string[];
  handleSearch: () => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  hasActiveFilters: () => boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSortBy: (value: string) => void;
  setSortOrder: (value: 'asc' | 'desc') => void;
  selectedProducts: Set<string>;
  isDeleting: boolean;
  handleBulkDelete: () => void;
  handleBulkExport: () => void;
  handleExportProducts: () => void;
  isAddProductOpen: boolean;
  setIsAddProductOpen: (value: boolean) => void;
  isImportProductsOpen: boolean;
  setIsImportProductsOpen: (value: boolean) => void;
  handleCSVImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  productForm: any;
  setProductForm: (value: any) => void;
  handleAffiliateLinkChange: (url: string) => void;
  handleEnhanceWithAI: () => void;
  isLoadingProductInfo: boolean;
  handleAddProduct: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
}

export const SearchAndActions: React.FC<SearchAndActionsProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  handleSearch,
  showFilters,
  setShowFilters,
  hasActiveFilters,
  sortBy,
  sortOrder,
  setSortBy,
  setSortOrder,
  selectedProducts,
  isDeleting,
  handleBulkDelete,
  handleBulkExport,
  handleExportProducts,
  isAddProductOpen,
  setIsAddProductOpen,
  isImportProductsOpen,
  setIsImportProductsOpen,
  handleCSVImport,
  productForm,
  setProductForm,
  handleAffiliateLinkChange,
  handleEnhanceWithAI,
  isLoadingProductInfo,
  handleAddProduct,
  handleKeyPress
}) => {
  return (
    <div className="space-y-4">
      {/* Search and Primary Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyPress}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          </div>
          <Button onClick={handleSearch} className="w-full md:w-auto">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {selectedProducts.size > 0 ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : `Delete (${selectedProducts.size})`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkExport}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export Selected
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters() && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-primary"></span>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportProducts}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export All
              </Button>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  className="hidden"
                />
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import CSV
                </Button>
              </label>
              <Button
                size="sm"
                onClick={() => setIsAddProductOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Category Filter and Sorting */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="w-full md:w-64">
          <Label htmlFor="category" className="text-sm font-medium mb-2 block">
            Category
          </Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-4">
          <div className="w-48">
            <Label htmlFor="sort-by" className="text-sm font-medium mb-2 block">
              Sort By
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sort-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$createdAt">Date Created</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-36">
            <Label htmlFor="sort-order" className="text-sm font-medium mb-2 block">
              Order
            </Label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger id="sort-order">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};