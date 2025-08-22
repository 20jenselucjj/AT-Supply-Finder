import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { supabaseAdmin } from '@/lib/supabase';

const AdminProducts = () => {
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    // Fetch initial product count
    const fetchProductCount = async () => {
      try {
        const { count } = await supabaseAdmin
          .from('products')
          .select('*', { count: 'exact', head: true });
        setProductCount(count || 0);
      } catch (error) {
        console.error('Error fetching product count:', error);
      }
    };

    fetchProductCount();
  }, []);

  return (
    <>
      <Helmet>
        <title>Product Management | Admin Dashboard</title>
        <meta name="description" content="Manage products and inventory" />
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
          <p className="text-muted-foreground">Manage products, inventory, and catalog data</p>
        </div>
        
        <ProductManagement
          totalProducts={productCount}
          onProductCountChange={setProductCount}
        />
      </div>
    </>
  );
};

export default AdminProducts;