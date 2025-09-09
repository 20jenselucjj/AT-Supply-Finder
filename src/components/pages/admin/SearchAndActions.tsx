import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Search, Filter, Upload, Download, Edit, Trash } from "lucide-react";
import { ProductForm } from "./ProductForm";

interface SearchAndActionsProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  categories: string[];
  handleSearch: () => void;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  hasActiveFilters: () => boolean;
  sortBy: string;
  sortOrder: string;
  setSortBy: React.Dispatch<React.SetStateAction<any>>;
  setSortOrder: React.Dispatch<React.SetStateAction<any>>;
  selectedProducts: Set<string>;
  isDeleting: boolean;
  handleBulkDelete: () => void;
  handleBulkExport: () => void;
  handleExportProducts: () => void;
  isAddProductOpen: boolean;
  setIsAddProductOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isImportProductsOpen: boolean;
  setIsImportProductsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleCSVImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  productForm: any;
  setProductForm: React.Dispatch<React.SetStateAction<any>>;
  handleAffiliateLinkChange: (url: string) => void;
  handleEnhanceWithAI?: () => void;
  isLoadingProductInfo: boolean;
  handleAddProduct: () => void;
  handleKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void; // Add this new prop
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
  handleKeyPress // Add this new prop
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-9"
        />
      </div>
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map(category => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {hasActiveFilters() && (
          <span className="ml-2 h-2 w-2 rounded-full bg-primary"></span>
        )}
      </Button>
      <Select 
        value={`${sortBy}-${sortOrder}`} 
        onValueChange={(value) => {
          const [field, order] = value.split('-');
          setSortBy(field);
          setSortOrder(order);
        }}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="$createdAt-desc">Newest First</SelectItem>
          <SelectItem value="$createdAt-asc">Oldest First</SelectItem>
        </SelectContent>
      </Select>
      <Dialog open={isImportProductsOpen} onOpenChange={setIsImportProductsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Products</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple products at once
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div 
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => document.getElementById('csv-upload')?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                CSV file with product data
              </p>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCSVImport}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportProductsOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Button variant="outline" onClick={handleExportProducts}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Add Product
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product manually or use an Amazon affiliate link.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ProductForm
              productForm={productForm}
              setProductForm={setProductForm}
              handleAffiliateLinkChange={handleAffiliateLinkChange}
              handleEnhanceWithAI={handleEnhanceWithAI}
              isLoadingProductInfo={isLoadingProductInfo}
              handleSubmit={handleAddProduct}
              onCancel={() => setIsAddProductOpen(false)}
              isEditing={false}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {selectedProducts.size > 0 && (
        <div className="flex flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash className="h-4 w-4 mr-2" />
                Delete Selected ({selectedProducts.size})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Products</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedProducts.size} selected product{selectedProducts.size > 1 ? 's' : ''}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button variant="outline" onClick={handleBulkExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Selected
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Bulk Update
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Update Products</DialogTitle>
                <DialogDescription>
                  Update properties for {selectedProducts.size} selected product{selectedProducts.size > 1 ? 's' : ''}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-center text-muted-foreground">
                  Bulk update form will be rendered here
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline">
                  Cancel
                </Button>
                <Button>Apply Updates</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};