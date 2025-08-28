import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { databases, account } from '@/lib/appwrite';
import { toast } from 'sonner';
import { useRBAC } from '@/hooks/use-rbac';
import { logger } from '@/lib/logger';
import { Package, Plus, Trash2, Edit, Star, DollarSign, ExternalLink, Trash, Upload, Download, Filter, Search, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { fuzzySearch, generateSuggestions } from '@/lib/fuzzy-search';
import { ProductData, ProductManagementProps, AdvancedFilters } from './types';
import { ProductTable } from './ProductTable';
import { ProductCard } from './ProductCard';
import { ProductForm } from './ProductForm';
import { Filters } from './Filters';
import { SearchAndActions } from './SearchAndActions';

export const ProductManagementRefactored: React.FC<ProductManagementProps> = ({ totalProducts, onProductCountChange }) => {
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
  const [brands, setBrands] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'price'>('created_at');
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
    image_url: '',
    asin: '',
    affiliate_link: ''
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
          // For multiple terms, create search conditions
          const searchConditions = searchTerms.map(term => 
            `name LIKE '%${term}%' OR brand LIKE '%${term}%' OR category LIKE '%${term}%' OR material LIKE '%${term}%'`
          ).join(' OR ');
          
          queries.push(JSON.stringify({ method: 'search', values: [searchConditions] }));
        } else {
          // For single term, use broader matching
          const searchCondition = `name LIKE '%${search}%' OR brand LIKE '%${search}%' OR category LIKE '%${search}%' OR material LIKE '%${search}%'`;
          queries.push(JSON.stringify({ method: 'search', values: [searchCondition] }));
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
        queries.push(JSON.stringify({ method: 'search', attribute: 'brand', values: [`%${advancedFilters.brand}%`] }));
      }
      
      if (advancedFilters.material) {
        queries.push(JSON.stringify({ method: 'search', attribute: 'material', values: [`%${advancedFilters.material}%`] }));
      }
      
      if (advancedFilters.weight) {
        queries.push(JSON.stringify({ method: 'search', attribute: 'weight', values: [`%${advancedFilters.weight}%`] }));
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

      // Also get total count for pagination
      const countResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        []
      );

      const transformedProducts = response.documents?.map((product: any) => ({
        id: product.$id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        rating: product.rating,
        price: product.price,
        dimensions: product.dimensions,
        weight: product.weight,
        material: product.material,
        features: product.features,
        image_url: product.imageUrl,
        asin: product.asin,
        affiliate_link: product.affiliateLink,
        created_at: product.$createdAt,
        updated_at: product.$updatedAt
      })) || [];

      setProducts(transformedProducts);
      setTotalPages(Math.ceil((countResponse.total || 0) / productsPerPage));
      onProductCountChange(countResponse.total || 0);
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
        []
      );
      
      const uniqueCategories = [...new Set(response.documents.map((item: any) => item.category).filter(Boolean))];
      setCategories(uniqueCategories);
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
        []
      );
      
      const uniqueBrands = [...new Set(response.documents.map((item: any) => item.brand).filter(Boolean))];
      setBrands(uniqueBrands);
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
        []
      );
      
      const uniqueMaterials = [...new Set(response.documents.map((item: any) => item.material).filter(Boolean))];
      setMaterials(uniqueMaterials);
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
      image_url: '',
      asin: '',
      affiliate_link: ''
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
      
      // Fetch product names before deletion for audit logging
      const productData = [];
      for (const productId of productIds) {
        try {
          const product = await databases.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'products',
            productId
          );
          productData.push({
            id: product.$id,
            name: product.name,
            category: product.category,
            brand: product.brand
          });
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error);
        }
      }

      // Delete products
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
          count: productIds.length,
          products: productData
        }
      });

      toast.success(`Successfully deleted ${productIds.length} product${productIds.length > 1 ? 's' : ''}`);
      setSelectedProducts(new Set());
      fetchProducts(currentPage, searchTerm, selectedCategory);
    } catch (error: any) {
      await logger.auditLog({
        action: 'BULK_DELETE_PRODUCTS_FAILED',
        entity_type: 'PRODUCT',
        details: {
          count: productIds.length,
          error: error.message
        }
      });
      console.error('Error deleting products:', error);
      toast.error(`Failed to delete products: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportProducts = async () => {
    try {
      // Fetch all products for export
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        []
      );
      
      const data = response.documents.map((product: any) => ({
        id: product.$id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        rating: product.rating,
        price: product.price,
        dimensions: product.dimensions,
        weight: product.weight,
        material: product.material,
        features: product.features,
        image_url: product.imageUrl,
        asin: product.asin,
        affiliate_link: product.affiliateLink,
        created_at: product.$createdAt,
        updated_at: product.$updatedAt
      }));

      if (data.length === 0) {
        await logger.auditLog({
          action: 'EXPORT_ALL_PRODUCTS_FAILED',
          entity_type: 'PRODUCT',
          details: {
            error: 'No products found'
          }
        });
        toast.error('No products found for export');
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
    } catch (error: any) {
      await logger.auditLog({
        action: 'EXPORT_ALL_PRODUCTS_FAILED',
        entity_type: 'PRODUCT',
        details: {
          error: error.message
        }
      });
      console.error('Error exporting products:', error);
      toast.error(`Failed to export products: ${error.message}`);
    }
  };

  const handleBulkExport = async () => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    try {
      // Fetch selected products for export
      const productIds = Array.from(selectedProducts);
      const data = [];
      
      for (const productId of productIds) {
        try {
          const product = await databases.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            'products',
            productId
          );
          
          data.push({
            id: product.$id,
            name: product.name,
            category: product.category,
            brand: product.brand,
            rating: product.rating,
            price: product.price,
            dimensions: product.dimensions,
            weight: product.weight,
            material: product.material,
            features: product.features,
            image_url: product.imageUrl,
            asin: product.asin,
            affiliate_link: product.affiliateLink,
            created_at: product.$createdAt,
            updated_at: product.$updatedAt
          });
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error);
        }
      }
      
      if (data.length === 0) {
        await logger.auditLog({
          action: 'EXPORT_SELECTED_PRODUCTS_FAILED',
          entity_type: 'PRODUCT',
          details: {
            count: selectedProducts.size,
            error: 'No products found'
          }
        });
        toast.error('No products found for export');
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
    } catch (error: any) {
      await logger.auditLog({
        action: 'EXPORT_SELECTED_PRODUCTS_FAILED',
        entity_type: 'PRODUCT',
        details: {
          count: selectedProducts.size,
          error: error.message
        }
      });
      console.error('Error exporting selected products:', error);
      toast.error(`Failed to export selected products: ${error.message}`);
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
      updateData.updatedAt = new Date().toISOString();

      // Update selected products
      const productIds = Array.from(selectedProducts);
      const updatePromises = productIds.map(productId =>
        databases.updateDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'products',
          productId,
          updateData
        )
      );
      
      await Promise.all(updatePromises);

      toast.success(`${selectedProducts.size} product${selectedProducts.size > 1 ? 's' : ''} updated successfully`);
      
      // Reset bulk update data
      setBulkUpdateData({ category: '', brand: '' });
      
      // Refresh product list
      fetchProducts(currentPage, searchTerm, selectedCategory);
    } catch (error: any) {
      console.error('Error updating products:', error);
      toast.error(`Failed to update products: ${error.message}`);
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
            product[header] = value ? value.split(';').map(f => f.trim()) : [];
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
      const insertPromises = productsToImport.map(product =>
        databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          'products',
          'unique()',
          {
            name: product.name,
            category: product.category,
            brand: product.brand,
            rating: product.rating,
            price: product.price,
            dimensions: product.dimensions,
            weight: product.weight,
            material: product.material,
            features: product.features,
            imageUrl: product.image_url,
            asin: product.asin,
            affiliateLink: product.affiliate_link
          }
        )
      );
      
      await Promise.all(insertPromises);

      toast.success(`Successfully imported ${productsToImport.length} product${productsToImport.length > 1 ? 's' : ''}`);
      
      // Refresh product list
      fetchProducts(currentPage, searchTerm, selectedCategory);
      fetchCategories();
      fetchBrands();
      fetchMaterials();
      
      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Error importing CSV:', error);
      toast.error(`Failed to import products from CSV: ${error.message}`);
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
    setProductForm(prev => ({ ...prev, affiliate_link: url }));
    
    if (!url.trim()) return;
    
    const asin = extractASINFromLink(url);
    if (!asin) {
      toast.error('Could not extract ASIN from the provided link');
      return;
    }
    
    setIsLoadingProductInfo(true);
    
    try {
      // Call our scraping API to get product information
      const response = await fetch('http://localhost:3001/api/scrape-amazon-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to scrape product information');
      }
      
      if (result.success && result.data) {
        const productData = result.data;
        
        // Auto-populate the form with scraped data
        setProductForm(prev => ({
          ...prev,
          name: productData.name || prev.name,
          brand: productData.brand || prev.brand,
          category: productData.category || prev.category,
          image_url: productData.image_url || prev.image_url,
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

      const productData = {
        name: productForm.name,
        category: productForm.category,
        brand: productForm.brand,
        rating: productForm.rating ? parseFloat(productForm.rating) : null,
        price: productForm.price ? parseFloat(productForm.price) : null,
        dimensions: productForm.dimensions || null,
        weight: productForm.weight || null,
        material: productForm.material || null,
        features: productForm.features ? productForm.features.split('\n').filter(f => f.trim()) : null,
        imageUrl: productForm.image_url || null,
        asin: productForm.asin || null,
        affiliateLink: productForm.affiliate_link || null
      };

      const response = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        'unique()',
        productData
      );

      // Log successful product creation
      await logger.auditLog({
        action: 'CREATE_PRODUCT',
        entity_type: 'PRODUCT',
        entity_id: response.$id,
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
    } catch (error: any) {
      await logger.auditLog({
        action: 'CREATE_PRODUCT_FAILED',
        entity_type: 'PRODUCT',
        details: {
          product_name: productForm.name,
          error: error.message
        }
      });
      console.error('Error creating product:', error);
      toast.error(`Failed to create product: ${error.message}`);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      const productData = {
        name: productForm.name,
        category: productForm.category,
        brand: productForm.brand,
        rating: productForm.rating ? parseFloat(productForm.rating) : null,
        price: productForm.price ? parseFloat(productForm.price) : null,
        dimensions: productForm.dimensions || null,
        weight: productForm.weight || null,
        material: productForm.material || null,
        features: productForm.features ? productForm.features.split('\n').filter(f => f.trim()) : null,
        imageUrl: productForm.image_url || null,
        asin: productForm.asin || null,
        affiliateLink: productForm.affiliate_link || null,
        updatedAt: new Date().toISOString()
      };

      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        editingProduct.id,
        productData
      );

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
    } catch (error: any) {
      await logger.auditLog({
        action: 'UPDATE_PRODUCT_FAILED',
        entity_type: 'PRODUCT',
        entity_id: editingProduct.id,
        details: {
          product_name: productForm.name,
          error: error.message
        }
      });
      console.error('Error updating product:', error);
      toast.error(`Failed to update product: ${error.message}`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      // Fetch product data before deletion for audit logging
      const product = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        productId
      );
      
      const productData = {
        name: product.name,
        category: product.category,
        brand: product.brand
      };
      
      await databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        productId
      );

      // Log successful product deletion
      await logger.auditLog({
        action: 'DELETE_PRODUCT',
        entity_type: 'PRODUCT',
        entity_id: productId,
        details: {
          product_name: productData.name,
          category: productData.category,
          brand: productData.brand
        }
      });

      toast.success('Product deleted successfully');
      fetchProducts(currentPage, searchTerm, selectedCategory);
    } catch (error: any) {
      await logger.auditLog({
        action: 'DELETE_PRODUCT_FAILED',
        entity_type: 'PRODUCT',
        entity_id: productId,
        details: {
          error: error.message
        }
      });
      console.error('Error deleting product:', error);
      toast.error(`Failed to delete product: ${error.message}`);
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
      image_url: product.image_url || '',
      asin: product.asin || '',
      affiliate_link: product.affiliate_link || ''
    });
  };

  const getMinPrice = (offers: any[] = []) => {
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
              <h2 className="text-2xl font-bold">Product Management</h2>
              <p className="text-muted-foreground">Manage your product catalog</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SearchAndActions
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            handleSearch={handleSearch}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            hasActiveFilters={hasActiveFilters}
            sortBy={sortBy}
            sortOrder={sortOrder}
            setSortBy={setSortBy as any}
            setSortOrder={setSortOrder as any}
            selectedProducts={selectedProducts}
            isDeleting={isDeleting}
            handleBulkDelete={handleBulkDelete}
            handleBulkExport={handleBulkExport}
            handleExportProducts={handleExportProducts}
            isAddProductOpen={isAddProductOpen}
            setIsAddProductOpen={setIsAddProductOpen}
            isImportProductsOpen={isImportProductsOpen}
            setIsImportProductsOpen={setIsImportProductsOpen}
            handleCSVImport={handleCSVImport}
          />
          
          {/* Advanced Filters Panel */}
          {showFilters && (
            <Filters
              advancedFilters={advancedFilters}
              setAdvancedFilters={setAdvancedFilters}
              brands={brands}
              resetFilters={resetFilters}
              applyFilters={applyFilters}
            />
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <ProductTable
                products={products}
                selectedProducts={selectedProducts}
                handleSelectProduct={handleSelectProduct}
                isAllSelected={isAllSelected}
                isIndeterminate={isIndeterminate}
                handleSelectAll={handleSelectAll}
                openEditDialog={openEditDialog}
                handleDeleteProduct={handleDeleteProduct}
                getMinPrice={getMinPrice}
                productForm={productForm}
                setProductForm={setProductForm}
                handleUpdateProduct={handleUpdateProduct}
                handleAffiliateLinkChange={handleAffiliateLinkChange}
                isLoadingProductInfo={isLoadingProductInfo}
                categories={categories}
                brands={brands}
              />

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

                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProducts.has(product.id)}
                    handleSelectProduct={handleSelectProduct}
                    openEditDialog={openEditDialog}
                    handleDeleteProduct={handleDeleteProduct}
                    getMinPrice={getMinPrice}
                    productForm={productForm}
                    setProductForm={setProductForm}
                    handleUpdateProduct={handleUpdateProduct}
                    handleAffiliateLinkChange={handleAffiliateLinkChange}
                    isLoadingProductInfo={isLoadingProductInfo}
                  />
                ))}
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

export default ProductManagementRefactored;