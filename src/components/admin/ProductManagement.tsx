import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { databases, account } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { toast } from 'sonner';
import { useRBAC } from '@/hooks/use-rbac';
import { logger } from '@/lib/logger';
import { Package, Plus, Trash2, Edit, Star, DollarSign, ExternalLink, Trash, Upload, Download, Filter, Search, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { fuzzySearch, generateSuggestions } from '@/lib/fuzzy-search';
import { ProductData, VendorOffer, ProductManagementProps, AdvancedFilters } from './types';
import { ProductForm } from './ProductForm';

// Helper function to map Appwrite product data to frontend format
const mapAppwriteProductToFrontend = (product: any): ProductData => ({
  id: product.$id,
  name: product.name || 'No name',
  category: product.category || 'Uncategorized',
  brand: product.brand || 'Unknown',
  rating: product.rating,
  price: product.price,
  dimensions: product.dimensions,
  weight: product.weight,
  material: product.material,
  // Fix the features parsing to handle both string and array formats properly
  features: product.features ? 
    (Array.isArray(product.features) ? 
      product.features : 
      (typeof product.features === 'string' ? 
        product.features.split(',').map(f => f.trim()).filter(f => f.length > 0) : 
        [])
    ) : [],
  imageUrl: product.imageUrl,
  asin: product.asin,
  affiliateLink: product.affiliateLink,
  createdAt: product.$createdAt,
  updatedAt: product.$updatedAt,
  vendor_offers: product.vendor_offers || []
});

// Helper function to map frontend product data to Appwrite format
const mapFrontendProductToAppwrite = (product: any) => ({
  name: product.name,
  category: product.category,
  brand: product.brand,
  rating: product.rating ? parseFloat(product.rating) : null,
  price: product.price ? parseFloat(product.price) : null,
  dimensions: product.dimensions || null,
  weight: product.weight || null,
  material: product.material || null,
  // Ensure features is a string with max 1000 characters
  features: product.features ? 
    (Array.isArray(product.features) ? 
      product.features.join(', ').substring(0, 1000) : 
      product.features.toString().substring(0, 1000)
    ) : null,
  imageUrl: product.imageUrl || null,
  asin: product.asin || null,
  affiliateLink: product.affiliateLink || null
});

export const ProductManagement: React.FC<ProductManagementProps> = ({ totalProducts, onProductCountChange }) => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]); // New state for brands
  const [materials, setMaterials] = useState<string[]>([]); // New state for materials
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'$createdAt' | 'name' | 'price'>('$createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isImportProductsOpen, setIsImportProductsOpen] = useState(false);
  
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    minPrice: undefined,
    maxPrice: undefined,
    minRating: undefined,
    maxRating: undefined,
    brand: '',
    material: '',
    weight: ''
  });
  
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    brand: '',
    rating: '',
    price: '',
    dimensions: '',
    weight: '',
    material: '',
    features: '',
    imageUrl: '',
    asin: '',
    affiliateLink: ''
  });
  
  // Bulk update state
  const [bulkUpdateData, setBulkUpdateData] = useState({
    category: '',
    brand: ''
  });
  
  const [isLoadingProductInfo, setIsLoadingProductInfo] = useState(false);
  const { isEditorOrAdmin } = useRBAC();
  
  const productsPerPage = 10;

  const fetchProducts = async (page = 1, search = '', category = 'all') => {
    try {
      setLoading(true);
      
      // Build query with filters for Appwrite
      let queries: string[] = [];

      // Apply search term filter
      if (search) {
        // Enhanced search with multiple matching strategies
        const searchTerms = search.split(' ').filter(term => term.length > 0);
        
        if (searchTerms.length > 0) {
          // For multiple terms, we'll search in name, brand, category, and material
          // Appwrite doesn't support OR queries directly, so we'll search each field separately
          // and combine results on the client side
          queries.push(JSON.stringify({ method: 'search', attribute: 'name', values: [search] }));
        } else {
          // For single term, use broader matching
          queries.push(JSON.stringify({ method: 'search', attribute: 'name', values: [search] }));
        }
      }

      // Apply category filter
      if (category !== 'all') {
        queries.push(JSON.stringify({ method: 'equal', attribute: 'category', values: [category] }));
      }

      // Apply advanced filters
      if (advancedFilters.minPrice !== undefined) {
        queries.push(JSON.stringify({ method: 'greaterThanEqual', attribute: 'price', values: [advancedFilters.minPrice] }));
      }
      
      if (advancedFilters.maxPrice !== undefined) {
        queries.push(JSON.stringify({ method: 'lessThanEqual', attribute: 'price', values: [advancedFilters.maxPrice] }));
      }
      
      if (advancedFilters.minRating !== undefined) {
        queries.push(JSON.stringify({ method: 'greaterThanEqual', attribute: 'rating', values: [advancedFilters.minRating] }));
      }
      
      if (advancedFilters.maxRating !== undefined) {
        queries.push(JSON.stringify({ method: 'lessThanEqual', attribute: 'rating', values: [advancedFilters.maxRating] }));
      }
      
      if (advancedFilters.brand) {
        queries.push(JSON.stringify({ method: 'search', attribute: 'brand', values: [advancedFilters.brand] }));
      }
      
      if (advancedFilters.material) {
        queries.push(JSON.stringify({ method: 'search', attribute: 'material', values: [advancedFilters.material] }));
      }
      
      if (advancedFilters.weight) {
        queries.push(JSON.stringify({ method: 'search', attribute: 'weight', values: [advancedFilters.weight] }));
      }

      // Apply sorting
      if (sortBy) {
        if (sortOrder === 'asc') {
          queries.push(JSON.stringify({ method: 'orderAsc', attribute: sortBy }));
        } else {
          queries.push(JSON.stringify({ method: 'orderDesc', attribute: sortBy }));
        }
      }

      // Apply pagination
      const offset = (page - 1) * productsPerPage;
      queries.push(JSON.stringify({ method: 'limit', values: [productsPerPage] }));
      queries.push(JSON.stringify({ method: 'offset', values: [offset] }));

      // Fetch products from Appwrite 'products' collection
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        queries
      );

      // Transform the data to match our ProductData interface
      const transformedProducts = response.documents?.map(mapAppwriteProductToFrontend) || [];

      setProducts(transformedProducts);
      setTotalPages(Math.ceil((response.total || 0) / productsPerPage));
      onProductCountChange(response.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Fetch all products and extract unique categories
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        [JSON.stringify({ method: 'limit', values: [1000] })]
      );
      
      if (response.documents) {
        const uniqueCategories = [...new Set(response.documents
          .map((item: any) => item.category)
          .filter(Boolean))] as string[];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch brands for filter dropdown
  const fetchBrands = async () => {
    try {
      // Fetch all products and extract unique brands
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        [JSON.stringify({ method: 'limit', values: [1000] })]
      );
      
      if (response.documents) {
        const uniqueBrands = [...new Set(response.documents
          .map((item: any) => item.brand)
          .filter(Boolean))] as string[];
        setBrands(uniqueBrands);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  // Fetch materials for filter dropdown
  const fetchMaterials = async () => {
    try {
      // Fetch all products and extract unique materials
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        [JSON.stringify({ method: 'limit', values: [1000] })]
      );
      
      if (response.documents) {
        const uniqueMaterials = [...new Set(response.documents
          .map((item: any) => item.material)
          .filter(Boolean))] as string[];
        setMaterials(uniqueMaterials);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      category: '',
      brand: '',
      rating: '',
      price: '',
      dimensions: '',
      weight: '',
      material: '',
      features: '',
      imageUrl: '',
      asin: '',
      affiliateLink: ''
    });
  };

  // Bulk selection functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(products.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    try {
      setIsDeleting(true);
      const productIds = Array.from(selectedProducts);
      
      // Delete products from Appwrite
      const deletePromises = productIds.map(productId => 
        databases.deleteDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'products',
          productId
        )
      );
      
      await Promise.all(deletePromises);

      // Log successful bulk deletion
      await logger.auditLog({
        action: 'BULK_DELETE_PRODUCTS',
        entity_type: 'PRODUCT',
        details: {
          count: productIds.length
        }
      });

      toast.success(`Successfully deleted ${productIds.length} product${productIds.length > 1 ? 's' : ''}`);
      setSelectedProducts(new Set());
      fetchProducts(currentPage, searchTerm, selectedCategory);
    } catch (error) {
      console.error('Error deleting products:', error);
      toast.error('Failed to delete products');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportProducts = async () => {
    try {
      // Fetch all products for export
      // Fetch all products for export
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        [JSON.stringify({ method: 'limit', values: [1000] })]
      );
      
      const data = response.documents || [];
      const error = response.total === 0 ? { message: 'No products found' } : null;
      
      if (error) {
        await logger.auditLog({
          action: 'EXPORT_ALL_PRODUCTS_FAILED',
          entity_type: 'PRODUCT',
          details: {
            error: error.message
          }
        });
        toast.error('Failed to fetch products for export');
        return;
      }

      // Convert to CSV
      const csvHeaders = Object.keys(data[0] || {}).join(',');
      const csvRows = data.map(product => 
        Object.values(product).map(value => 
          typeof value === 'object' ? JSON.stringify(value) : value
        ).join(',')
      );
      
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Log successful export
      await logger.auditLog({
        action: 'EXPORT_ALL_PRODUCTS',
        entity_type: 'PRODUCT',
        details: {
          count: data.length
        }
      });
      
      toast.success('Products exported successfully');
    } catch (error) {
      console.error('Error exporting products:', error);
      toast.error('Failed to export products');
    }
  };

  const handleBulkExport = async () => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    try {
      // Fetch selected products for export
      const queries = [
        JSON.stringify({ method: 'contains', attribute: '$id', values: Array.from(selectedProducts) }),
        JSON.stringify({ method: 'limit', values: [selectedProducts.size] })
      ];
      
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        queries
      );
      
      const data = response.documents || [];
      const error = response.total === 0 ? { message: 'No products found' } : null;
      
      if (error) {
        await logger.auditLog({
          action: 'EXPORT_SELECTED_PRODUCTS_FAILED',
          entity_type: 'PRODUCT',
          details: {
            count: selectedProducts.size,
            error: error.message
          }
        });
        toast.error('Failed to fetch selected products for export');
        return;
      }

      // Convert to CSV
      const csvHeaders = Object.keys(data[0] || {}).join(',');
      const csvRows = data.map(product => 
        Object.values(product).map(value => 
          typeof value === 'object' ? JSON.stringify(value) : value
        ).join(',')
      );

      // Log successful export
      await logger.auditLog({
        action: 'EXPORT_SELECTED_PRODUCTS',
        entity_type: 'PRODUCT',
        details: {
          count: data.length
        }
      });
      
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `selected-products-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${selectedProducts.size} product${selectedProducts.size > 1 ? 's' : ''} exported successfully`);
    } catch (error) {
      console.error('Error exporting selected products:', error);
      toast.error('Failed to export selected products');
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    if (!bulkUpdateData.category && !bulkUpdateData.brand) {
      toast.error('Please select at least one field to update');
      return;
    }

    try {
      // Prepare update data
      const updateData: any = {};
      if (bulkUpdateData.category) updateData.category = bulkUpdateData.category;
      if (bulkUpdateData.brand) updateData.brand = bulkUpdateData.brand;

      // Update selected products
      let error = null;
      for (const productId of Array.from(selectedProducts)) {
        try {
          await databases.updateDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'products',
            productId,
            updateData
          );
        } catch (updateError) {
          error = updateError;
          break;
        }
      }
      
      if (error) {
        toast.error('Failed to update products');
        return;
      }

      toast.success(`${selectedProducts.size} product${selectedProducts.size > 1 ? 's' : ''} updated successfully`);
      
      // Reset bulk update data
      setBulkUpdateData({ category: '', brand: '' });
      
      // Refresh product list
      fetchProducts(currentPage, searchTerm, selectedCategory);
    } catch (error) {
      console.error('Error updating products:', error);
      toast.error('Failed to update products');
    }
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        toast.error('CSV file is empty or invalid');
        return;
      }

      // Parse CSV headers
      const headers = lines[0].split(',').map(header => header.trim());
      
      // Parse data rows
      const productsToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length !== headers.length) continue;
        
        const product: any = {};
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          const value = values[j]?.trim() || '';
          
          // Convert numeric values
          if (header === 'price' || header === 'rating') {
            const numValue = parseFloat(value);
            product[header] = isNaN(numValue) ? null : numValue;
          } else if (header === 'features') {
            // Ensure features is a string with max 1000 characters
            product[header] = value ? value.substring(0, 1000) : null;
          } else {
            product[header] = value || null;
          }
        }
        
        // Validate required fields
        if (product.name && product.category && product.brand) {
          productsToImport.push(product);
        }
      }

      if (productsToImport.length === 0) {
        toast.error('No valid products found in CSV');
        return;
      }

      // Insert products
      let error = null;
      try {
        for (const product of productsToImport) {
          await databases.createDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'products',
            'unique()',
            product
          );
        }
      } catch (insertError) {
        error = insertError;
      }
      
      if (error) {
        toast.error(`Failed to import products: ${error.message}`);
        return;
      }

      toast.success(`Successfully imported ${productsToImport.length} product${productsToImport.length > 1 ? 's' : ''}`);
      
      // Refresh product list
      fetchProducts(currentPage, searchTerm, selectedCategory);
      fetchCategories();
      fetchBrands();
      fetchMaterials();
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Failed to import products from CSV');
    }
  };

  const isAllSelected = products.length > 0 && selectedProducts.size === products.length;
  const isIndeterminate = selectedProducts.size > 0 && selectedProducts.size < products.length;

  // Extract ASIN from Amazon affiliate link
  const extractASINFromLink = (url: string): string | null => {
    try {
      // Common Amazon URL patterns
      const patterns = [
        /\/dp\/([A-Z0-9]{10})/i,
        /\/gp\/product\/([A-Z0-9]{10})/i,
        /\/product\/([A-Z0-9]{10})/i,
        /asin=([A-Z0-9]{10})/i,
        /\/([A-Z0-9]{10})(?:\/|\?|$)/i
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    } catch (error) {
      console.error('Error extracting ASIN:', error);
      return null;
    }
  };

  // Generate search suggestions
  const generateSearchSuggestions = (query: string) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      return;
    }
    
    const suggestions = generateSuggestions(
      products,
      query,
      ['name', 'brand', 'category', 'material'],
      5
    );
    
    setSearchSuggestions(suggestions);
  };

  // Handle search input with suggestions
  const handleSearchInput = (value: string) => {
    setSearchTerm(value);
    generateSearchSuggestions(value);
    
    if (value) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Select a suggestion
  const selectSuggestion = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    setCurrentPage(1);
    fetchProducts(1, suggestion, selectedCategory);
  };

  // Auto-populate product information from affiliate link
  const handleAffiliateLinkChange = async (url: string) => {
    setProductForm(prev => ({ ...prev, affiliateLink: url }));
    
    if (!url.trim()) return;
    
    const asin = extractASINFromLink(url);
    if (!asin) {
      toast.error('Could not extract ASIN from the provided link');
      return;
    }
    
    setIsLoadingProductInfo(true);
    
    try {
      console.log('Processing affiliate link:', url);
      // Call our scraping API to get product information
      const response = await fetch('http://localhost:3001/api/scrape-amazon-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      console.log('Scraping API response status:', response.status);
      
      const result = await response.json();
      
      console.log('Scraping API response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to scrape product information');
      }
      
      if (result.success && result.data) {
        const productData = result.data;
        
        console.log('Scraped product data:', productData);
        
        // Auto-populate the form with scraped data
        setProductForm(prev => ({
          ...prev,
          name: productData.name || prev.name,
          brand: productData.brand || prev.brand,
          category: productData.category || prev.category,
          imageUrl: productData.image_url || prev.imageUrl,
          asin: productData.asin || prev.asin,
          rating: productData.rating ? productData.rating.toString() : prev.rating,
          price: productData.price ? productData.price.toString() : prev.price,
          dimensions: productData.dimensions || prev.dimensions,
          weight: productData.weight || prev.weight,
          material: productData.material || prev.material,
          features: productData.features ? productData.features.join('\n') : prev.features
        }));
        
        toast.success('Product information extracted successfully!');
      } else {
        // Fallback to just extracting ASIN
        setProductForm(prev => ({ ...prev, asin }));
        toast.success(`ASIN extracted: ${asin}. Please fill in the remaining product details manually.`);
      }
      
    } catch (error) {
      console.error('Error processing affiliate link:', error);
      // Fallback to just extracting ASIN
      setProductForm(prev => ({ ...prev, asin }));
      toast.error(`Failed to auto-populate product info: ${error.message}. ASIN extracted: ${asin}`);
    } finally {
      setIsLoadingProductInfo(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      if (!productForm.name || !productForm.category || !productForm.brand) {
        toast.error('Name, category, and brand are required');
        return;
      }

      const productData = mapFrontendProductToAppwrite(productForm);

      let data = null;
      let error = null;
      
      try {
        const response = await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'products',
          'unique()',
          productData
        );
        data = [response];
      } catch (insertError) {
        error = insertError;
      }

      if (error) {
        await logger.auditLog({
          action: 'CREATE_PRODUCT_FAILED',
          entity_type: 'PRODUCT',
          details: {
            product_name: productForm.name,
            error: error.message
          }
        });
        toast.error(`Failed to create product: ${error.message}`);
        return;
      }

      // Log successful product creation
      await logger.auditLog({
        action: 'CREATE_PRODUCT',
        entity_type: 'PRODUCT',
        entity_id: data?.[0]?.$id,
        details: {
          product_name: productForm.name,
          category: productForm.category,
          brand: productForm.brand
        }
      });

      toast.success('Product created successfully');
      setIsAddProductOpen(false);
      resetForm();
      fetchProducts(currentPage, searchTerm, selectedCategory);
      fetchCategories();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      const productData = mapFrontendProductToAppwrite(productForm);

      let error = null;
      try {
        await databases.updateDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'products',
          editingProduct.id,
          productData
        );
      } catch (updateError) {
        error = updateError;
      }

      if (error) {
        await logger.auditLog({
          action: 'UPDATE_PRODUCT_FAILED',
          entity_type: 'PRODUCT',
          entity_id: editingProduct.id,
          details: {
            product_name: productForm.name,
            error: error.message
          }
        });
        toast.error(`Failed to update product: ${error.message}`);
        return;
      }

      // Log successful product update
      await logger.auditLog({
        action: 'UPDATE_PRODUCT',
        entity_type: 'PRODUCT',
        entity_id: editingProduct.id,
        details: {
          product_name: productForm.name,
          category: productForm.category,
          brand: productForm.brand
        }
      });

      toast.success('Product updated successfully');
      setEditingProduct(null);
      resetForm();
      fetchProducts(currentPage, searchTerm, selectedCategory);
      fetchCategories();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      let productData = null;
      let fetchError = null;
      let error = null;
      
      try {
        productData = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'products',
          productId
        );
      } catch (fetchErr) {
        fetchError = fetchErr;
      }
      
      try {
        await databases.deleteDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'products',
          productId
        );
      } catch (deleteError) {
        error = deleteError;
      }
      
      if (error) {
        await logger.auditLog({
          action: 'DELETE_PRODUCT_FAILED',
          entity_type: 'PRODUCT',
          entity_id: productId,
          details: {
            error: error.message
          }
        });
        toast.error(`Failed to delete product: ${error.message}`);
        return;
      }

      // Log successful product deletion
      await logger.auditLog({
        action: 'DELETE_PRODUCT',
        entity_type: 'PRODUCT',
        entity_id: productId,
        details: {
          product_name: productData?.name,
          category: productData?.category,
          brand: productData?.brand
        }
      });

      toast.success('Product deleted successfully');
      fetchProducts(currentPage, searchTerm, selectedCategory);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const openEditDialog = (product: ProductData) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      brand: product.brand,
      rating: product.rating?.toString() || '',
      price: product.price?.toString() || '',
      dimensions: product.dimensions || '',
      weight: product.weight || '',
      material: product.material || '',
      features: product.features?.join('\n') || '',
      imageUrl: product.imageUrl || '',
      asin: product.asin || '',
      affiliateLink: product.affiliateLink || ''
    });
  };

  const getMinPrice = (offers: VendorOffer[] = []) => {
    if (offers.length === 0) return null;
    return Math.min(...offers.map(offer => offer.price));
  };

  useEffect(() => {
    fetchProducts(currentPage, searchTerm, selectedCategory);
  }, [currentPage, selectedCategory, sortBy, sortOrder, advancedFilters]);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchMaterials();
    
    // Appwrite doesn't have the same real-time subscription model as Supabase
    // We'll rely on manual refreshes for now
    // TODO: Implement Appwrite real-time functionality if needed
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProducts(1, searchTerm, selectedCategory);
  };

  // Check if any advanced filters are active
  const hasActiveFilters = () => {
    return (
      advancedFilters.minPrice !== undefined ||
      advancedFilters.maxPrice !== undefined ||
      advancedFilters.minRating !== undefined ||
      advancedFilters.maxRating !== undefined ||
      !!advancedFilters.brand ||
      !!advancedFilters.material ||
      !!advancedFilters.weight
    );
  };

  // Reset all filters
  const resetFilters = () => {
    setAdvancedFilters({
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      maxRating: undefined,
      brand: '',
      material: '',
      weight: ''
    });
    setCurrentPage(1);
  };

  // Apply filters (trigger refetch)
  const applyFilters = () => {
    setCurrentPage(1);
    fetchProducts(1, searchTerm, selectedCategory);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>

            </div>
            <div className="flex gap-2">
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
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Upload a CSV file with product data
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Required columns: name, category, brand
                      </p>
                      <Button className="mt-4" variant="outline">
                        Choose File
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" onClick={handleExportProducts}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                      Create a new product manually.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <ProductForm
                    productForm={productForm}
                    setProductForm={setProductForm}
                    handleAffiliateLinkChange={handleAffiliateLinkChange}
                    isLoadingProductInfo={isLoadingProductInfo}
                    handleSubmit={handleAddProduct}
                    onCancel={() => {
                      setIsAddProductOpen(false);
                      resetForm();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => searchTerm && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-9"
              />
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
                      onMouseDown={() => selectSuggestion(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
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
            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>
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
                const [field, order] = value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$createdAt-desc">Newest First</SelectItem>
                <SelectItem value="$createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="price-asc">Price Low-High</SelectItem>
                <SelectItem value="price-desc">Price High-Low</SelectItem>
              </SelectContent>
            </Select>
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
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="bulk-category">Category</Label>
                        <Select onValueChange={(value) => setBulkUpdateData(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="bulk-brand">Brand</Label>
                        <Select onValueChange={(value) => setBulkUpdateData(prev => ({ ...prev, brand: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map(brand => (
                              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => console.log('Cancel bulk update')}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkUpdate}>
                        Apply Updates
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Import Products from CSV</DialogTitle>
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
                      <Button variant="outline" onClick={() => console.log('Cancel CSV import')}>
                        Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
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
                  <Label htmlFor="weight-filter">Weight</Label>
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
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          ref={(el) => {
                            if (el) (el as HTMLInputElement).indeterminate = isIndeterminate;
                          }}
                        />
                      </TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="hidden lg:table-cell">Material</TableHead>
                      <TableHead className="hidden xl:table-cell">Weight</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const minPrice = getMinPrice(product.vendor_offers);
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.has(product.id)}
                              onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.imageUrl && (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {product.dimensions && `${product.dimensions} • `}
                                  {product.weight}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell>{product.brand}</TableCell>
                          <TableCell>
                            {product.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-primary text-primary" />
                                {product.rating}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.vendor_offers && product.vendor_offers.length > 0
                              ? `$${product.vendor_offers.reduce((min, p) => p.price < min ? p.price : min, product.vendor_offers[0].price).toFixed(2)}`
                              : product.price ? `$${product.price.toFixed(2)}` : 'N/A'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {product.material || 'N/A'}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {product.weight || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(product)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Edit Product</DialogTitle>
                                  <DialogDescription>
                                    Update product information.
                                  </DialogDescription>
                                </DialogHeader>
                                <ProductForm
                                  productForm={productForm}
                                  setProductForm={setProductForm}
                                  handleAffiliateLinkChange={handleAffiliateLinkChange}
                                  isLoadingProductInfo={isLoadingProductInfo}
                                  handleSubmit={handleUpdateProduct}
                                  onCancel={() => {
                                    setEditingProduct(null);
                                    resetForm();
                                  }}
                                  isEditing={true}
                                />
                              </DialogContent>
                            </Dialog>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {/* Mobile Select All */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    ref={(el) => {
                      if (el) (el as HTMLInputElement).indeterminate = isIndeterminate;
                    }}
                  />
                  <Label className="text-sm font-medium">Select All</Label>
                </div>
                {selectedProducts.size > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {selectedProducts.size} selected
                  </span>
                )}
              </div>

              {products.map((product) => {
                const minPrice = getMinPrice(product.vendor_offers);
                return (
                  <Card key={product.id} className="p-4">
                    <div className="space-y-3">
                      {/* Header with checkbox and product info */}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                          className="mt-1 flex-shrink-0"
                        />
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                          <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{product.category}</Badge>
                            <span>{product.brand}</span>
                          </div>
                        </div>
                      </div>

                      {/* Product details */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <Label className="text-xs text-muted-foreground">Price</Label>
                          <div className="font-medium">
                            {product.vendor_offers && product.vendor_offers.length > 0
                              ? `$${product.vendor_offers.reduce((min, p) => p.price < min ? p.price : min, product.vendor_offers[0].price).toFixed(2)}`
                              : product.price ? `$${product.price.toFixed(2)}` : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Rating</Label>
                          <div className="flex items-center gap-1">
                            {product.rating ? (
                              <>
                                <Star className="h-3 w-3 fill-primary text-primary" />
                                <span className="text-xs font-medium">{product.rating}</span>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Material</Label>
                          <div className="font-medium">
                            {product.material || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Weight</Label>
                          <div className="font-medium">
                            {product.weight || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Dimensions */}
                      {product.dimensions && (
                        <div className="text-xs text-muted-foreground">
                          Dimensions: {product.dimensions}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-9"
                              onClick={() => openEditDialog(product)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              <span className="text-xs">Edit</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Product</DialogTitle>
                              <DialogDescription>
                                Update product information.
                              </DialogDescription>
                            </DialogHeader>
                            <ProductForm
                              productForm={productForm}
                              setProductForm={setProductForm}
                              handleAffiliateLinkChange={handleAffiliateLinkChange}
                              isLoadingProductInfo={isLoadingProductInfo}
                              handleSubmit={handleUpdateProduct}
                              onCancel={() => setEditingProduct(null)}
                              isEditing={true}
                            />
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 h-9">
                              <Trash2 className="h-4 w-4 mr-2" />
                              <span className="text-xs">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{product.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProduct(product.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductManagement;