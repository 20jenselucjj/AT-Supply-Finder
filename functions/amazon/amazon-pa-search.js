import 'dotenv/config';
import ProductAdvertisingAPIv1 from 'paapi5-nodejs-sdk';

// PA API credentials from environment variables
const PA_ACCESS_KEY = process.env.AMAZON_PA_ACCESS_KEY;
const PA_SECRET_KEY = process.env.AMAZON_PA_SECRET_KEY;
const PA_PARTNER_TAG = process.env.AMAZON_PA_PARTNER_TAG;

// Debug logging
console.log('PA API SDK Configuration:');
console.log('Access Key present:', !!PA_ACCESS_KEY);
console.log('Secret Key present:', !!PA_SECRET_KEY);
console.log('Partner Tag:', PA_PARTNER_TAG);

// Map first aid categories to Amazon search terms
const CATEGORY_SEARCH_TERMS = {
  'wound-care-dressings': ['bandages', 'gauze', 'wound care', 'medical tape'],
  'tapes-wraps': ['medical tape', 'elastic bandage', 'ace bandage', 'wraps'],
  'antiseptics-ointments': ['antiseptic', 'ointment', 'hydrogen peroxide', 'alcohol swabs'],
  'pain-relief': ['pain relief', 'ibuprofen', 'acetaminophen', 'aspirin'],
  'instruments-tools': ['medical scissors', 'tweezers', 'thermometer', 'medical tools'],
  'trauma-emergency': ['emergency kit', 'first aid kit', 'emergency supplies', 'trauma supplies'],
  'ppe': ['nitrile gloves', 'face mask', 'safety goggles', 'ppe'],
  'information-essentials': ['first aid manual', 'emergency guide', 'medical reference'],
  'hot-cold-therapy': ['ice pack', 'heat pack', 'hot cold therapy', 'compress'],
  'hydration-nutrition': ['electrolyte drink', 'hydration tablets', 'energy bar', 'sports drink'],
  'miscellaneous': ['medical supplies', 'first aid supplies', 'health supplies']
};

// Initialize the API client
const getApiClient = () => {
  if (!PA_ACCESS_KEY || !PA_SECRET_KEY || !PA_PARTNER_TAG) {
    throw new Error('Missing Amazon PA API credentials');
  }

  const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;
  
  // Set credentials
  defaultClient.accessKey = PA_ACCESS_KEY;
  defaultClient.secretKey = PA_SECRET_KEY;
  
  // Set host and region for US locale
  defaultClient.host = 'webservices.amazon.com';
  defaultClient.region = 'us-east-1';
  
  return new ProductAdvertisingAPIv1.DefaultApi(defaultClient);
};

// Search for products using PA API 5.0 SDK
const searchProductsInternal = (keywords, searchIndex = 'All', itemCount = 10) => {
  return new Promise((resolve, reject) => {
    try {
      const api = getApiClient();
      
      // Create search request
      const searchItemsRequest = new ProductAdvertisingAPIv1.SearchItemsRequest();
      
      // Set required parameters
      searchItemsRequest.PartnerTag = PA_PARTNER_TAG;
      searchItemsRequest.PartnerType = 'Associates';
      searchItemsRequest.Keywords = keywords;
      searchItemsRequest.SearchIndex = searchIndex;
      searchItemsRequest.ItemCount = itemCount;
      
      // Set resources to return
      searchItemsRequest.Resources = [
        'ItemInfo.Title',
        'ItemInfo.Features',
        'ItemInfo.ProductInfo',
        'ItemInfo.ByLineInfo',
        'ItemInfo.ContentInfo',
        'ItemInfo.TechnicalInfo',
        'ItemInfo.ExternalIds',
        'Offers.Listings.Price',
        'Images.Primary.Small',
        'Images.Primary.Medium',
        'Images.Primary.Large',
        'BrowseNodeInfo.BrowseNodes'
      ];

      console.log('Making PA API SearchItems request:');
      console.log('Keywords:', keywords);
      console.log('SearchIndex:', searchIndex);
      console.log('ItemCount:', itemCount);

      // Make the API call using callback
      api.searchItems(searchItemsRequest, (error, data, response) => {
        if (error) {
          console.error('PA API Error details:');
          console.error('Status:', error.status);
          console.error('Message:', error.message);
          if (error.response) {
            console.error('Response body:', error.response.text);
          }
          reject(error);
        } else {
          console.log('PA API Response received successfully');
          resolve(data);
        }
      });
      
    } catch (error) {
      console.error('PA API Error details:');
      console.error('Status:', error.status);
      console.error('Message:', error.message);
      if (error.response) {
        console.error('Response body:', error.response.text);
      }
      reject(error);
    }
  });
};

// Get item details using PA API SDK
const getItemDetails = (itemIds) => {
  return new Promise((resolve, reject) => {
    try {
      const api = getApiClient();
      
      // Create get items request
      const getItemsRequest = new ProductAdvertisingAPIv1.GetItemsRequest();
      
      // Set required parameters
      getItemsRequest.PartnerTag = PA_PARTNER_TAG;
      getItemsRequest.PartnerType = 'Associates';
      getItemsRequest.ItemIds = Array.isArray(itemIds) ? itemIds : [itemIds];
      
      // Set resources to return
      getItemsRequest.Resources = [
        'ItemInfo.Title',
        'ItemInfo.Features',
        'ItemInfo.ProductInfo',
        'ItemInfo.ByLineInfo',
        'ItemInfo.ContentInfo',
        'ItemInfo.TechnicalInfo',
        'ItemInfo.ExternalIds',
        'Offers.Listings.Price',
        'Offers.Listings.SavingBasis',
        'Offers.Listings.Promotions',
        'Images.Primary.Small',
        'Images.Primary.Medium',
        'Images.Primary.Large',
        'Images.Variants.Small',
        'Images.Variants.Medium',
        'Images.Variants.Large',
        'BrowseNodeInfo.BrowseNodes'
      ];

      console.log('Making PA API GetItems request for:', itemIds);

      // Make the API call using callback
      api.getItems(getItemsRequest, (error, data, response) => {
        if (error) {
          console.error('PA API GetItems Error details:');
          console.error('Status:', error.status);
          console.error('Message:', error.message);
          if (error.response) {
            console.error('Response body:', error.response.text);
          }
          reject(error);
        } else {
          console.log('PA API GetItems response received successfully');
          resolve(data);
        }
      });
      
    } catch (error) {
      console.error('PA API GetItems Error details:');
      console.error('Status:', error.status);
      console.error('Message:', error.message);
      if (error.response) {
        console.error('Response body:', error.response.text);
      }
      reject(error);
    }
  });
};

// Search products by category or keywords
export const searchProducts = async (keywordsOrCategory, searchIndex = 'HealthPersonalCare', itemCount = 10) => {
  // Check if first parameter is a category or keywords
  let keywords;
  let actualSearchIndex = searchIndex;
  
  if (CATEGORY_SEARCH_TERMS[keywordsOrCategory]) {
    // It's a category - pick a random search term
    const searchTerms = CATEGORY_SEARCH_TERMS[keywordsOrCategory];
    keywords = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    console.log(`Searching for category: ${keywordsOrCategory}, using keywords: ${keywords}`);
  } else {
    // It's keywords - use directly
    keywords = keywordsOrCategory;
    console.log(`Searching with keywords: ${keywords}`);
  }
  
  try {
    const response = await searchProductsInternal(keywords, actualSearchIndex, itemCount);
    return response;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Default export for Netlify function compatibility
export default async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { category, asin, keywords, searchIndex, itemCount = 10 } = req.query || req.body || {};

    let result;
    
    if (asin) {
      result = await getItemDetails(asin);
    } else if (keywords) {
      result = await searchProductsInternal(keywords, searchIndex, itemCount);
    } else if (category) {
      result = await searchProducts(category, itemCount);
    } else {
      return res.status(400).json({ 
        error: 'Please provide either category, asin, or keywords parameter' 
      });
    }

    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Function error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch Amazon products',
      details: error.message 
    });
  }
};
