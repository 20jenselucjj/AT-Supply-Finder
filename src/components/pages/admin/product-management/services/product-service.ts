import { databases } from '@/lib/api/appwrite';
import { logger } from '@/lib/utils/logger';
import { ProductData } from '../types';

export const productService = {
  fetchProducts: async (
    page: number,
    productsPerPage: number,
    search: string,
    category: string,
    sortBy: string,
    sortOrder: 'asc' | 'desc',
    advancedFilters: any
  ) => {
    try {
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
        imageUrl: product.imageUrl,
        asin: product.asin,
        affiliateLink: product.affiliateLink,
        createdAt: product.$createdAt,
        updatedAt: product.$updatedAt
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

      const mappedProducts = transformedProducts.map(product => ({
        ...product,
        category: categoryMapping[product.category] || product.category
      }));

      return {
        products: mappedProducts,
        totalPages: Math.ceil((countResponse.total || 0) / productsPerPage),
        totalProducts: countResponse.total || 0
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  fetchCategories: async () => {
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
      
      return mappedCategories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  fetchBrands: async () => {
    try {
      // Fetch all products and extract unique brands
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        []
      );
      
      const uniqueBrands = [...new Set(response.documents.map((item: any) => item.brand).filter(Boolean))];
      return uniqueBrands;
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  },

  fetchMaterials: async () => {
    try {
      // Fetch all products and extract unique materials
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        []
      );
      
      const uniqueMaterials = [...new Set(response.documents.map((item: any) => item.material).filter(Boolean))];
      return uniqueMaterials;
    } catch (error) {
      console.error('Error fetching materials:', error);
      throw error;
    }
  },

  createProduct: async (productData: any) => {
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

      const data = {
        name: productData.name,
        category: reverseCategoryMapping[productData.category] || productData.category,
        brand: productData.brand,
        rating: productData.rating ? parseFloat(productData.rating) : null,
        price: productData.price ? parseFloat(productData.price) : null,
        dimensions: productData.dimensions || null,
        weight: productData.weight || null,
        material: productData.material || null,
        features: productData.features || null,
        imageUrl: productData.image_url || null,
        asin: productData.asin || null,
        affiliateLink: productData.affiliate_link || null
      };

      const response = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        'unique()',
        data
      );

      // Log successful product creation
      await logger.auditLog({
        action: 'CREATE_PRODUCT',
        entityType: 'PRODUCT',
        entityId: response.$id,
        details: {
          product_name: productData.name,
          category: productData.category,
          brand: productData.brand
        }
      });

      return response;
    } catch (error: any) {
      await logger.auditLog({
        action: 'CREATE_PRODUCT_FAILED',
        entityType: 'PRODUCT',
        details: {
          product_name: productData.name,
          error: error.message
        }
      });
      throw error;
    }
  },

  updateProduct: async (productId: string, productData: any) => {
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

      const data = {
        name: productData.name,
        category: reverseCategoryMapping[productData.category] || productData.category,
        brand: productData.brand,
        rating: productData.rating ? parseFloat(productData.rating) : null,
        price: productData.price ? parseFloat(productData.price) : null,
        dimensions: productData.dimensions || null,
        weight: productData.weight || null,
        material: productData.material || null,
        features: productData.features || null,
        imageUrl: productData.image_url || null,
        asin: productData.asin || null,
        affiliateLink: productData.affiliate_link || null
      };

      const response = await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        'products',
        productId,
        data
      );

      // Log successful product update
      await logger.auditLog({
        action: 'UPDATE_PRODUCT',
        entityType: 'PRODUCT',
        entityId: productId,
        details: {
          product_name: productData.name,
          category: productData.category,
          brand: productData.brand
        }
      });

      return response;
    } catch (error: any) {
      await logger.auditLog({
        action: 'UPDATE_PRODUCT_FAILED',
        entityType: 'PRODUCT',
        entityId: productId,
        details: {
          product_name: productData.name,
          error: error.message
        }
      });
      throw error;
    }
  },

  deleteProduct: async (productId: string) => {
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

      return true;
    } catch (error: any) {
      await logger.auditLog({
        action: 'DELETE_PRODUCT_FAILED',
        entityType: 'PRODUCT',
        entityId: productId,
        details: {
          error: error.message
        }
      });
      throw error;
    }
  },

  bulkDeleteProducts: async (productIds: string[]) => {
    try {
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

      return true;
    } catch (error: any) {
      await logger.auditLog({
        action: 'BULK_DELETE_PRODUCTS_FAILED',
        entityType: 'PRODUCT',
        details: {
          count: productIds.length,
          error: error.message
        }
      });
      throw error;
    }
  },

  exportProducts: async () => {
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
        throw new Error('No products found for export');
      }

      return data;
    } catch (error: any) {
      await logger.auditLog({
        action: 'EXPORT_ALL_PRODUCTS_FAILED',
        entityType: 'PRODUCT',
        details: {
          error: error.message
        }
      });
      throw error;
    }
  },

  exportSelectedProducts: async (productIds: string[]) => {
    try {
      // Fetch selected products for export
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
            count: productIds.length,
            error: 'No products found'
          }
        });
        throw new Error('No products found for export');
      }

      return data;
    } catch (error: any) {
      await logger.auditLog({
        action: 'EXPORT_SELECTED_PRODUCTS_FAILED',
        entityType: 'PRODUCT',
        details: {
          count: productIds.length,
          error: error.message
        }
      });
      throw error;
    }
  }
};