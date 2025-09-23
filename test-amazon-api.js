import 'dotenv/config';
import { searchProducts } from './functions/amazon/amazon-pa-search.js';

async function testAmazonAPI() {
  console.log('Testing Amazon PA API...');
  console.log('Environment variables:');
  console.log('AMAZON_PA_ACCESS_KEY:', process.env.AMAZON_PA_ACCESS_KEY ? 'Set' : 'Not set');
  console.log('AMAZON_PA_SECRET_KEY:', process.env.AMAZON_PA_SECRET_KEY ? 'Set' : 'Not set');
  console.log('AMAZON_PA_PARTNER_TAG:', process.env.AMAZON_PA_PARTNER_TAG || 'Not set');

  try {
    console.log('\nTesting searchProducts function...');
    const result = await searchProducts('wound-care-dressings', 3);
    
    console.log('Success! Found products:');
    if (result.SearchResult && result.SearchResult.Items) {
      console.log(`Total items: ${result.SearchResult.Items.length}`);
      result.SearchResult.Items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.ItemInfo?.Title?.DisplayValue || 'No title'}`);
        console.log(`   ASIN: ${item.ASIN}`);
        console.log(`   Price: ${item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'N/A'}`);
      });
    } else {
      console.log('No items found in response');
      console.log('Response structure:', Object.keys(result));
    }
    
  } catch (error) {
    console.error('Error testing Amazon API:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAmazonAPI();