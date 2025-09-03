import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [brands, setBrands] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'$createdAt'>('$createdAt');
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

      // Apply search term filter - using contains method which doesn't require fulltext index
      if (search) {
        queries.push(JSON.stringify({ 
          method: 'contains', 
          attribute: 'name', 
          values: [search] 
        }));
      }

      // Apply category filter
      if (category !== 'all') {
        // Map friendly category names back to database format for filtering
        const reverseCategoryMapping: Record<string, string> = {
          "Wound Care & Dressings": "First Aid & Wound Care",
          "Antiseptics & Ointments": "Antiseptics & Ointments",
          "Tapes & Wraps": "Taping & Bandaging",
          "Instruments & Tools": "Instruments & Tools",
          "Pain & Symptom Relief": "Over-the-Counter Medication",
          "Trauma & Emergency": "Emergency Care",
          "Personal Protection Equipment (PPE)": "Personal Protection Equipment (PPE)",
          "First Aid Information & Essentials": "Documentation & Communication",
          "Hot & Cold Therapy": "Hot & Cold Therapy",
          "Hydration & Nutrition": "Hydration & Nutrition",
          "Miscellaneous & General": "Miscellaneous & General"
        };
        
        const databaseCategory = reverseCategoryMapping[category] || category;
        
        queries.push(JSON.stringify({ 
          method: 'equal', 
          attribute: 'category', 
          values: [databaseCategory] 
        }));
      }

      // Apply only the most essential advanced filters to avoid schema issues
      if (advancedFilters.minPrice !== undefined) {
        queries.push(JSON.stringify({ 
          method: 'greaterThanEqual', 
          attribute: 'price', 
          values: [advancedFilters.minPrice] 
        }));
      }
      
      if (advancedFilters.maxPrice !== undefined) {
        queries.push(JSON.stringify({ 
          method: 'lessThanEqual', 
          attribute: 'price', 
          values: [advancedFilters.maxPrice] 
        }));
      }

      // Apply sorting
      if (sortBy === '$createdAt') {
        if (sortOrder === 'asc') {
          queries.push(JSON.stringify({ 
            method: 'orderAsc', 
            attribute: '$createdAt' 
          }));
        } else {
          queries.push(JSON.stringify({ 
            method: 'orderDesc', 
            attribute: '$createdAt' 
          }));
        }
      }

      // Apply pagination
      const offset = (page - 1) * productsPerPage;
      queries.push(JSON.stringify({ 
        method: 'limit', 
        values: [productsPerPage] 
      }));
      queries.push(JSON.stringify({ 
        method: 'offset', 
        values: [offset] 
      }));

      // Fetch products from Appwrite 'products' collection
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        queries
      );

      // Also get total count for pagination
      const countQueries = queries.filter(q => {
        const queryObj = JSON.parse(q);
        return queryObj.method !== 'limit' && queryObj.method !== 'offset';
      });
      
      const countResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        countQueries
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
        features: Array.isArray(product.features) 
          ? product.features 
          : typeof product.features === 'string' 
            ? product.features.split('\n').filter((f: string) => f.trim()) 
            : [],
        image_url: product.imageUrl,
        asin: product.asin,
        affiliateLink: product.affiliateLink,
        created_at: product.$createdAt,
        updated_at: product.$updatedAt
      })) || [];

      // Map database categories to friendly names
      const categoryMapping: Record<string, string> = {
        "First Aid & Wound Care": "Wound Care & Dressings",
        "Antiseptics & Ointments": "Antiseptics & Ointments",
        "Taping & Bandaging": "Tapes & Wraps",
        "Instruments & Tools": "Instruments & Tools",
        "Over-the-Counter Medication": "Pain & Symptom Relief",
        "Emergency Care": "Trauma & Emergency",
        "Personal Protection Equipment (PPE)": "Personal Protection Equipment (PPE)",
        "Documentation & Communication": "First Aid Information & Essentials",
        "Hot & Cold Therapy": "Hot & Cold Therapy",
        "Hydration & Nutrition": "Hydration & Nutrition",
        "Miscellaneous & General": "Miscellaneous & General"
      };

      setProducts(transformedProducts.map(product => ({
        ...product,
        category: categoryMapping[product.category] || product.category,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      })));
      setTotalPages(Math.ceil((countResponse.total || 0) / productsPerPage));
      onProductCountChange(countResponse.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products. Please try again.');
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
      
      // Map database categories to friendly names
      const categoryMapping: Record<string, string> = {
        "First Aid & Wound Care": "Wound Care & Dressings",
        "Antiseptics & Ointments": "Antiseptics & Ointments",
        "Taping & Bandaging": "Tapes & Wraps",
        "Instruments & Tools": "Instruments & Tools",
        "Over-the-Counter Medication": "Pain & Symptom Relief",
        "Emergency Care": "Trauma & Emergency",
        "Personal Protection Equipment (PPE)": "Personal Protection Equipment (PPE)",
        "Documentation & Communication": "First Aid Information & Essentials",
        "Hot & Cold Therapy": "Hot & Cold Therapy",
        "Hydration & Nutrition": "Hydration & Nutrition",
        "Miscellaneous & General": "Miscellaneous & General"
      };
      
      const mappedCategories = uniqueCategories.map(category => 
        categoryMapping[category] || category
      );
      
      setCategories(mappedCategories);
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
      
      // Map database categories to friendly names
      const categoryMapping: Record<string, string> = {
        "First Aid & Wound Care": "Wound Care & Dressings",
        "Antiseptics & Ointments": "Antiseptics & Ointments",
        "Taping & Bandaging": "Tapes & Wraps",
        "Instruments & Tools": "Instruments & Tools",
        "Over-the-Counter Medication": "Pain & Symptom Relief",
        "Emergency Care": "Trauma & Emergency",
        "Personal Protection Equipment (PPE)": "Personal Protection Equipment (PPE)",
        "Documentation & Communication": "First Aid Information & Essentials",
        "Hot & Cold Therapy": "Hot & Cold Therapy",
        "Hydration & Nutrition": "Hydration & Nutrition",
        "Miscellaneous & General": "Miscellaneous & General"
      };
      
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
            category: categoryMapping[product.category] || product.category,
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
        entityType: 'PRODUCT',
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
        entityType: 'PRODUCT',
        details: {
          count: selectedProducts.size,
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
      
      // Map database categories to friendly names
      const categoryMapping: Record<string, string> = {
        "First Aid & Wound Care": "Wound Care & Dressings",
        "Taping & Bandaging": "Tapes & Wraps",
        "Instruments & Tools": "Instruments & Tools",
        "Over-the-Counter Medication": "Pain & Symptom Relief",
        "Emergency Care": "Trauma & Emergency",
        "Personal Protection Equipment (PPE)": "Personal Protection Equipment (PPE)",
        "Documentation & Communication": "First Aid Information & Essentials",
        "Hot & Cold Therapy": "Hot & Cold Therapy",
        "Hydration & Nutrition": "Hydration & Nutrition",
        "Miscellaneous & General": "Miscellaneous & General"
      };
      
      const data = response.documents.map((product: any) => ({
        id: product.$id,
        name: product.name,
        category: categoryMapping[product.category] || product.category,
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
          entityType: 'PRODUCT',
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
        entityType: 'PRODUCT',
        details: {
          count: data.length
        }
      });
      
      toast.success('Products exported successfully');
    } catch (error: any) {
      await logger.auditLog({
        action: 'EXPORT_ALL_PRODUCTS_FAILED',
        entityType: 'PRODUCT',
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
      
      // Map database categories to friendly names
      const categoryMapping: Record<string, string> = {
        "First Aid & Wound Care": "Wound Care & Dressings",
        "Taping & Bandaging": "Tapes & Wraps",
        "Instruments & Tools": "Instruments & Tools",
        "Over-the-Counter Medication": "Pain & Symptom Relief",
        "Emergency Care": "Trauma & Emergency",
        "Personal Protection Equipment (PPE)": "Personal Protection Equipment (PPE)",
        "Documentation & Communication": "First Aid Information & Essentials",
        "Hot & Cold Therapy": "Hot & Cold Therapy",
        "Hydration & Nutrition": "Hydration & Nutrition",
        "Miscellaneous & General": "Miscellaneous & General"
      };
      
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
            category: categoryMapping[product.category] || product.category,
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
          entityType: 'PRODUCT',
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

      // Log successful export
      await logger.auditLog({
        action: 'EXPORT_SELECTED_PRODUCTS',
        entityType: 'PRODUCT',
        details: {
          count: data.length
        }
      });
      
      toast.success(`Successfully exported ${data.length} product${data.length > 1 ? 's' : ''}`);
    } catch (error: any) {
      await logger.auditLog({
        action: 'EXPORT_SELECTED_PRODUCTS_FAILED',
        entityType: 'PRODUCT',
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
      // Note: Appwrite automatically manages updatedAt with $updatedAt

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
            product[header] = value || null;
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
            features: product.features ? (Array.isArray(product.features) ? product.features.join(', ') : product.features) : null,
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

  // Enhance product information using AI
  const handleEnhanceWithAI = async () => {
    setIsLoadingProductInfo(true);
    
    try {
      // Get OpenRouter API key from environment
      const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      
      if (!openRouterApiKey) {
        toast.error('OpenRouter API key not configured');
        return;
      }
      
      // Import the AI enhancement function
      const { enhanceProductWithAI } = await import('../../../functions/utils/ai-product-enhancer');
      
      // Map friendly category names back to database format for AI processing
      const reverseCategoryMapping: Record<string, string> = {
        "Wound Care & Dressings": "First Aid & Wound Care",
        "Tapes & Wraps": "Taping & Bandaging",
        "Antiseptics & Ointments": "Antiseptics & Ointments",
        "Instruments & Tools": "Instruments & Tools",
        "Pain & Symptom Relief": "Over-the-Counter Medication",
        "Trauma & Emergency": "Emergency Care",
        "Personal Protection Equipment (PPE)": "Personal Protection Equipment (PPE)",
        "First Aid Information & Essentials": "Documentation & Communication",
        "Hot & Cold Therapy": "Hot & Cold Therapy",
        "Hydration & Nutrition": "Hydration & Nutrition",
        "Miscellaneous & General": "Miscellaneous & General"
      };

      // Prepare product data for AI enhancement
      const productData = {
        title: productForm.name,
        brand: productForm.brand,
        category: reverseCategoryMapping[productForm.category] || productForm.category,
        features: productForm.features ? productForm.features.split('\n') : [],
        dimensions: productForm.dimensions,
        weight: productForm.weight,
        material: productForm.material
      };
      
      // Call the AI enhancement function
      const enhancedData = await enhanceProductWithAI(productData, openRouterApiKey);
      
      // Map database category names to friendly names
      const categoryMapping: Record<string, string> = {
        "First Aid & Wound Care": "Wound Care & Dressings",
        "Taping & Bandaging": "Tapes & Wraps",
        "Antiseptics & Ointments": "Antiseptics & Ointments",
        "Instruments & Tools": "Instruments & Tools",
        "Over-the-Counter Medication": "Pain & Symptom Relief",
        "Emergency Care": "Trauma & Emergency",
        "Personal Protection Equipment (PPE)": "Personal Protection Equipment (PPE)",
        "Documentation & Communication": "First Aid Information & Essentials",
        "Hot & Cold Therapy": "Hot & Cold Therapy",
        "Hydration & Nutrition": "Hydration & Nutrition",
        "Miscellaneous & General": "Miscellaneous & General"
      };
      
      // Update form with AI-enhanced data
      setProductForm(prev => ({
        ...prev,
        name: enhancedData.name || prev.name,
        category: categoryMapping[enhancedData.category] || enhancedData.category || prev.category,
        material: enhancedData.material || prev.material,
        // If quantity is found, we might want to use it instead of weight
        weight: enhancedData.quantity || prev.weight,
        features: enhancedData.features || prev.features
      }));
      
      toast.success('Product information enhanced with AI successfully!');
    } catch (error: any) {
      console.error('Error enhancing product with AI:', error);
      toast.error(`Failed to enhance product with AI: ${error.message}`);
    } finally {
      setIsLoadingProductInfo(false);
    }
  };

  const handleCreateProduct = async () => {
    try {
      // Map friendly category names back to database format
      const reverseCategoryMapping: Record<string, string> = {
        "Wound Care & Dressings": "First Aid & Wound Care",
        "Tapes & Wraps": "Taping & Bandaging",
        "Instruments & Tools": "Instruments & Tools",
        "Pain & Symptom Relief": "Over-the-Counter Medication",
        "Trauma & Emergency": "Emergency Care",
        "Personal Protection Equipment (PPE)": "Personal Protection Equipment (PPE)",
        "First Aid Information & Essentials": "Documentation & Communication",
        "Hot & Cold Therapy": "Hot & Cold Therapy",
        "Hydration & Nutrition": "Hydration & Nutrition",
        "Miscellaneous & General": "Miscellaneous & General"
      };

      const productData = {
        name: productForm.name,
        category: reverseCategoryMapping[productForm.category] || productForm.category,
        brand: productForm.brand,
        rating: productForm.rating ? parseFloat(productForm.rating) : null,
        price: productForm.price ? parseFloat(productForm.price) : null,
        dimensions: productForm.dimensions || null,
        weight: productForm.weight || null,
        material: productForm.material || null,
        features: productForm.features || null,
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
        entityType: 'PRODUCT',
        entityId: response.$id,
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
        entityType: 'PRODUCT',
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
      // Map friendly category names back to database format
      const reverseCategoryMapping: Record<string, string> = {
        "Wound Care & Dressings": "First Aid & Wound Care",
        "Tapes & Wraps": "Taping & Bandaging",
        "Instruments & Tools": "Instruments & Tools",
        "Pain & Symptom Relief": "Over-the-Counter Medication",
        "Trauma & Emergency": "Emergency Care",
        "Personal Protection Equipment (PPE)": "Personal Protection Equipment (PPE)",
        "First Aid Information & Essentials": "Documentation & Communication",
        "Hot & Cold Therapy": "Hot & Cold Therapy",
        "Hydration & Nutrition": "Hydration & Nutrition",
        "Miscellaneous & General": "Miscellaneous & General"
      };

      const productData = {
        name: productForm.name,
        category: reverseCategoryMapping[productForm.category] || productForm.category,
        brand: productForm.brand,
        rating: productForm.rating ? parseFloat(productForm.rating) : null,
        price: productForm.price ? parseFloat(productForm.price) : null,
        dimensions: productForm.dimensions || null,
        weight: productForm.weight || null,
        material: productForm.material || null,
        features: productForm.features || null,
        imageUrl: productForm.image_url || null,
        asin: productForm.asin || null,
        affiliateLink: productForm.affiliate_link || null
        // Note: Appwrite automatically manages updatedAt with $updatedAt
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
        entityType: 'PRODUCT',
        entityId: editingProduct.id,
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
        entityType: 'PRODUCT',
        entityId: editingProduct.id,
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
      
      // Map database categories to friendly names
      const categoryMapping: Record<string, string> = {
        "First Aid & Wound Care": "Wound Care & Dressings",
        "Taping & Bandaging": "Tapes & Wraps",
        "Instruments & Tools": "Instruments & Tools",
        "Over-the-Counter Medication": "Pain & Symptom Relief",
        "Emergency Care": "Trauma & Emergency",
        "Personal Protection Equipment (PPE)": "Personal Protection Equipment (PPE)",
        "Documentation & Communication": "First Aid Information & Essentials",
        "Hot & Cold Therapy": "Hot & Cold Therapy",
        "Hydration & Nutrition": "Hydration & Nutrition",
        "Miscellaneous & General": "Miscellaneous & General"
      };
      
      const productData = {
        name: product.name,
        category: categoryMapping[product.category] || product.category,
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
        entityType: 'PRODUCT',
        entityId: productId,
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
        entityType: 'PRODUCT',
        entityId: productId,
        details: {
          error: error.message
        }
      });
      console.error('Error deleting product:', error);
      toast.error(`Failed to delete product: ${error.message}`);
    }
  };

  const openEditDialog = (product: ProductData) => {
    // Map database category names to friendly names
    const categoryMapping: Record<string, string> = {
      "First Aid & Wound Care": "Wound Care & Dressings",
      "Taping & Bandaging": "Tapes & Wraps",
      "Instruments & Tools": "Instruments & Tools",
      "Over-the-Counter Medication": "Pain & Symptom Relief",
      "Emergency Care": "Trauma & Emergency",
      "Personal Protection Equipment (PPE)": "Personal Protection Equipment (PPE)",
      "Documentation & Communication": "First Aid Information & Essentials",
      "Hot & Cold Therapy": "Hot & Cold Therapy",
      "Hydration & Nutrition": "Hydration & Nutrition",
      "Miscellaneous & General": "Miscellaneous & General"
    };

    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: categoryMapping[product.category] || product.category,
      brand: product.brand,
      rating: product.rating?.toString() || '',
      price: product.price?.toString() || '',
      dimensions: product.dimensions || '',
      weight: product.weight || '',
      material: product.material || '',
      features: Array.isArray(product.features) 
        ? product.features.join(', ') 
        : typeof product.features === 'string' 
          ? product.features 
          : '',
      image_url: product.imageUrl || '',
      asin: product.asin || '',
      affiliate_link: product.affiliateLink || ''
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

  // Add debounce to search to avoid too many API calls
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Create debounced search function
  const debouncedSearch = React.useCallback(
    debounce((searchTerm: string) => {
      setCurrentPage(1);
      fetchProducts(1, searchTerm, selectedCategory);
    }, 500),
    [selectedCategory]
  );

  // Handle search input change
  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setCurrentPage(1);
      fetchProducts(1, searchTerm, selectedCategory);
    }
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

  // Handle adding a new product
  const handleAddProduct = async () => {
    await handleCreateProduct();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <SearchAndActions
            searchTerm={searchTerm}
            setSearchTerm={handleSearchInputChange}
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
            productForm={productForm}
            setProductForm={setProductForm}
            handleAffiliateLinkChange={handleAffiliateLinkChange}
            handleEnhanceWithAI={handleEnhanceWithAI}
            isLoadingProductInfo={isLoadingProductInfo}
            handleAddProduct={handleAddProduct}
            handleKeyPress={handleKeyPress} // Add this new prop
          />
          
          {/* Advanced Filters Panel */}
          {showFilters && (
            <Filters
              advancedFilters={advancedFilters}
              setAdvancedFilters={setAdvancedFilters}
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
                handleEnhanceWithAI={handleEnhanceWithAI}
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
                    handleEnhanceWithAI={handleEnhanceWithAI}
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

export default ProductManagement;