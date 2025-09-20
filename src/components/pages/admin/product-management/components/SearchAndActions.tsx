import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Upload,
  Download,
  Filter,
  Search,
  ChevronDown,
  X,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const clearSearch = () => {
    setSearchTerm('');
  };

  const hasFilters = hasActiveFilters();

  return (
    <div className="space-y-6">
      {/* Search and Primary Actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-96">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                className="pl-10 pr-10 h-11 bg-background border-2 focus:border-primary/50 transition-colors"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <Button
            onClick={handleSearch}
            className="w-full sm:w-auto h-11 gap-2 font-medium shadow-sm hover:shadow-md transition-shadow"
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedProducts.size > 0 ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedProducts.size} selected
                </span>
                <Badge variant="secondary" className="text-xs">
                  {selectedProducts.size} item{selectedProducts.size > 1 ? 's' : ''}
                </Badge>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MoreHorizontal className="h-4 w-4" />
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleBulkExport} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? 'Deleting...' : 'Delete Selected'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`gap-2 transition-all ${showFilters ? 'bg-primary/10 border-primary/30' : ''}`}
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                    !
                  </Badge>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportProducts}>
                    Export All Products
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <label className="cursor-pointer">
                 <input
                   type="file"
                   accept=".csv"
                   onChange={handleCSVImport}
                   className="hidden"
                   id="csv-import"
                 />
                 <Button
                   variant="outline"
                   size="sm"
                   className="gap-2"
                   onClick={() => {
                     const input = document.getElementById('csv-import') as HTMLInputElement;
                     if (input) {
                       input.click();
                     }
                   }}
                 >
                   <Upload className="h-4 w-4" />
                   Import CSV
                 </Button>
               </label>

              <Button
                size="sm"
                onClick={() => setIsAddProductOpen(true)}
                className="gap-2 font-medium shadow-sm hover:shadow-md transition-shadow"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Category Filter and Sorting */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-muted/30 p-4 rounded-lg">
        <div className="w-full md:w-64">
          <Label htmlFor="category" className="text-sm font-medium mb-2 block">
            Category
          </Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category" className="h-10">
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
              <SelectTrigger id="sort-by" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$createdAt">Date Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-36">
            <Label htmlFor="sort-order" className="text-sm font-medium mb-2 block">
              Order
            </Label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger id="sort-order" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="h-3 w-3" />
                    Descending
                  </div>
                </SelectItem>
                <SelectItem value="asc">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="h-3 w-3 rotate-180" />
                    Ascending
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};