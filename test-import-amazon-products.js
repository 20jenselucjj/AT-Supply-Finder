import fetch from 'node-fetch';

async function testImportAmazonProducts() {
  console.log('🧪 Testing import-amazon-products endpoint...');
  
  try {
    // First, search for Amazon products
    console.log('Searching for Amazon products...');
    const searchResponse = await fetch('http://localhost:3001/api/import-amazon-products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedCategories: ['wound-care-dressings', 'tapes-wraps'],
        productsPerCategory: 3
      })
    });
    
    const searchData = await searchResponse.json();
    console.log('Search response status:', searchResponse.status);
    console.log('Response structure:', JSON.stringify(searchData, null, 2).substring(0, 500) + '...');
    
    // Check if the response has the expected structure
    if (!searchData.success && searchData.error) {
      throw new Error(`Search failed: ${searchData.error || 'Unknown error'}`);
    }
    
    // Get the products from the response - handle different possible structures
    const products = searchData.data?.products || 
                    searchData.createdProducts || 
                    searchData.documents || 
                    [];
    
    console.log(`Found ${products.length} products in the response`);
    
    // Extract and format products to match the add product form fields
    const formattedProducts = products.map(product => {
      // Extract features as an array and join with newlines for display
      const features = Array.isArray(product.features) 
        ? product.features.join('\n') 
        : (typeof product.features === 'string' ? product.features : '');
      
      // Format the product according to the add product form fields
      // Note: qty information might be included in the dimensions field
      return {
        name: product.name || '',
        category: product.category || '',
        brand: product.brand || '',
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
        price: product.price || 0,
        dimensions: product.dimensions || '',
        material: product.material || '',
        features: features,
        imageUrl: product.imageUrl || '',
        asin: product.asin || ''
      };
    });
    
    console.log('Formatted products:');
    formattedProducts.forEach((product, index) => {
      console.log(`\nProduct ${index + 1}:`);
      console.log(`Product Name: ${product.name}`);
      console.log(`Category: ${product.category}`);
      console.log(`Brand: ${product.brand}`);
      console.log(`Rating (0-5): ${product.rating}`);
      console.log(`Review Count: ${product.reviewCount}`);
      console.log(`Price ($): ${product.price}`);
      console.log(`Dimensions: ${product.dimensions}`);
      console.log(`Material: ${product.material}`);
      console.log(`Features:\n${product.features}`);
      console.log(`Image URL: ${product.imageUrl}`);
      console.log(`ASIN: ${product.asin}`);
    });
    
    console.log(`\nSuccessfully processed ${formattedProducts.length} products`);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testImportAmazonProducts();