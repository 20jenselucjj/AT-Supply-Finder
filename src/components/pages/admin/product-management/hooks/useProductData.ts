import { useState, useEffect } from 'react';
import { productService } from '../services/product-service';
import { ProductData } from '../types';
import { toast } from 'sonner';
import { useProductRefresh } from '@/context/product-refresh-context';

export const useProductData = (productsPerPage: number) => {
  const { triggerProductRefresh } = useProductRefresh();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);

  const fetchProducts = async (page = 1, search = '', category = 'all', sortBy = '$createdAt', sortOrder: 'asc' | 'desc' = 'desc', advancedFilters = {}) => {
    try {
      setLoading(true);
      const result = await productService.fetchProducts(page, productsPerPage, search, category, sortBy, sortOrder, advancedFilters);
      setProducts(result.products);
      setTotalPages(result.totalPages);
      return result.totalProducts;
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await productService.fetchCategories();
      setCategories(result);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const result = await productService.fetchBrands();
      setBrands(result);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const result = await productService.fetchMaterials();
      setMaterials(result);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const createProduct = async (productData: any) => {
    try {
      await productService.createProduct(productData);
      toast.success('Product created successfully');
      fetchProducts(currentPage);
      fetchCategories();
      triggerProductRefresh();
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(`Failed to create product: ${error.message}`);
    }
  };

  const updateProduct = async (productId: string, productData: any) => {
    try {
      await productService.updateProduct(productId, productData);
      toast.success('Product updated successfully');
      fetchProducts(currentPage);
      fetchCategories();
      triggerProductRefresh();
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(`Failed to update product: ${error.message}`);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await productService.deleteProduct(productId);
      toast.success('Product deleted successfully');
      fetchProducts(currentPage);
      triggerProductRefresh();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(`Failed to delete product: ${error.message}`);
    }
  };

  const bulkDeleteProducts = async (productIds: string[]) => {
    try {
      await productService.bulkDeleteProducts(productIds);
      toast.success(`Successfully deleted ${productIds.length} product${productIds.length > 1 ? 's' : ''}`);
      fetchProducts(currentPage);
      triggerProductRefresh();
    } catch (error: any) {
      console.error('Error deleting products:', error);
      toast.error(`Failed to delete products: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchMaterials();
  }, []);

  return {
    products,
    loading,
    currentPage,
    setCurrentPage,
    totalPages,
    categories,
    brands,
    materials,
    fetchProducts,
    fetchCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkDeleteProducts
  };
};