import ProductAdvertisingAPIv1 from 'paapi5-nodejs-sdk';
import { Client, Databases, Query, ID } from 'node-appwrite';

// NOTE: This code uses node-appwrite v9.0.0 which has a known bug with regional endpoints
// (like https://nyc.cloud.appwrite.io/v1) where ALL GET requests (listCollections, listDocuments, etc.)
// incorrectly send a request body, causing "request cannot have request body" errors.
// We've worked around this by skipping GET-based database tests and proceeding directly to
// POST/PUT operations (create/update) which work correctly.

// Enhanced first aid category mapping with specific search terms and validation
export const FIRST_AID_CATEGORIES = {
  'wound-care-dressings': {
    searchTerms: [
      'adhesive bandages', 'band aid', 'gauze pads', 'sterile gauze', 'non-adherent pads',
      'eye pads sterile', 'rolled gauze', 'liquid bandage', 'skin adhesive', 'wound dressing',
      'medical bandages', 'first aid bandages', 'sterile pads', 'wound care pads'
    ],
    requiredKeywords: ['bandage', 'gauze', 'pad', 'dressing', 'sterile', 'wound', 'adhesive bandage'],
    specificItems: [
      'band-aid', 'bandaid', 'adhesive bandage', 'gauze pad', 'sterile gauze', 'non-adherent pad',
      'eye pad', 'rolled gauze', 'liquid bandage', 'skin adhesive', 'knuckle bandage', 'fingertip bandage',
      'wound dressing', 'sterile pad', 'medical bandage', 'first aid bandage', 'butterfly bandage',
      'fabric bandage', 'plastic bandage', 'waterproof bandage', 'transparent bandage', 'island dressing'
    ],
    exclusions: [
      'tape measure', 'duct tape', 'electrical tape', 'packaging tape', 'scotch tape', 'masking tape',
      'scissors', 'tweezers', 'thermometer', 'tools', 'instruments', 'shears', 'probe',
      'medical tape', 'athletic tape', 'elastic bandage', 'ace bandage', 'cohesive wrap',
      'compression wrap', 'kinesiology tape', 'pre-wrap', 'self-adhering wrap'
    ]
  },
  'tapes-wraps': {
    searchTerms: [
      'medical tape', 'elastic bandage', 'ace bandage', 'cohesive wrap', 'athletic tape',
      'pre-wrap', 'self-adhering bandage', 'medical wrap', 'compression bandage', 'kinesiology tape'
    ],
    requiredKeywords: ['tape', 'wrap', 'elastic', 'cohesive', 'athletic', 'compression', 'self-adhering'],
    specificItems: [
      'medical tape', 'adhesive tape', 'elastic bandage', 'ace bandage', 'cohesive wrap', 'athletic tape',
      'pre-wrap', 'self-adhering wrap', 'compression wrap', 'medical wrap', 'kinesiology tape',
      'sports tape', 'zinc oxide tape', 'cloth tape', 'paper tape', 'silk tape', 'elastic wrap',
      'compression bandage', 'self-adhesive wrap', 'cohesive bandage', 'vet wrap'
    ],
    exclusions: [
      'duct tape', 'electrical tape', 'packaging tape', 'scotch tape', 'masking tape', 'painter tape',
      'scissors', 'tweezers', 'thermometer', 'shears', 'tools', 'instruments', 'probe',
      'adhesive bandage', 'band-aid', 'bandaid', 'gauze pad', 'sterile gauze', 'wound dressing',
      'sterile pad', 'non-adherent pad', 'eye pad', 'liquid bandage', 'skin adhesive'
    ]
  },
  'antiseptics-ointments': {
    searchTerms: [
      'antibiotic ointment', 'antiseptic wipes', 'alcohol prep pads', 'hydrogen peroxide',
      'burn gel', 'hydrocortisone cream', 'wound wash', 'antiseptic towelettes', 'first aid ointment',
      'triple antibiotic', 'neosporin', 'bacitracin', 'povidone iodine', 'benzalkonium chloride'
    ],
    requiredKeywords: ['antiseptic', 'ointment', 'alcohol', 'hydrogen peroxide', 'burn', 'hydrocortisone', 'antibiotic', 'cream', 'gel', 'wipe'],
    specificItems: [
      'antibiotic ointment', 'antiseptic wipe', 'alcohol prep pad', 'hydrogen peroxide',
      'burn gel', 'burn cream', 'hydrocortisone cream', 'wound wash', 'antiseptic towelette',
      'triple antibiotic ointment', 'neosporin', 'bacitracin', 'povidone iodine', 'benzalkonium chloride',
      'isopropyl alcohol', 'rubbing alcohol', 'wound cleanser', 'saline wound wash', 'betadine',
      'first aid cream', 'topical antibiotic', 'antimicrobial gel', 'wound care gel', 'healing ointment'
    ],
    exclusions: [
      'cosmetic cream', 'beauty product', 'hair product', 'shampoo', 'conditioner', 'lotion',
      'scissors', 'tweezers', 'thermometer', 'tools', 'instruments', 'shears', 'probe',
      'bandage', 'gauze', 'tape', 'wrap', 'adhesive bandage', 'medical tape', 'elastic bandage',
      'sunscreen', 'moisturizer', 'face cream', 'body cream', 'anti-aging cream'
    ]
  },
  'pain-relief': {
    searchTerms: [
      'ibuprofen', 'acetaminophen', 'aspirin', 'antihistamine', 'antacid', 'pain reliever',
      'oral rehydration salts', 'sting relief', 'bite relief', 'allergy relief', 'tylenol', 'advil',
      'benadryl', 'diphenhydramine', 'loratadine', 'cetirizine', 'famotidine', 'ranitidine'
    ],
    requiredKeywords: ['ibuprofen', 'acetaminophen', 'aspirin', 'antihistamine', 'antacid', 'pain', 'relief', 'medication', 'tablet', 'capsule'],
    specificItems: [
      'ibuprofen', 'acetaminophen', 'aspirin', 'antihistamine', 'antacid', 'pain reliever',
      'oral rehydration', 'sting relief', 'bite relief', 'allergy relief', 'tylenol', 'advil',
      'benadryl', 'diphenhydramine', 'loratadine', 'cetirizine', 'famotidine', 'ranitidine',
      'pain medication', 'allergy medication', 'anti-inflammatory', 'fever reducer', 'headache relief',
      'muscle pain relief', 'joint pain relief', 'oral medication', 'over-the-counter medication'
    ],
    exclusions: [
      'prescription', 'controlled substance', 'narcotic', 'opioid', 'prescription medication',
      'scissors', 'tweezers', 'thermometer', 'tools', 'instruments', 'shears', 'probe',
      'bandage', 'gauze', 'tape', 'wrap', 'ointment', 'cream', 'gel', 'topical',
      'cold pack', 'hot pack', 'compress', 'heating pad', 'ice pack'
    ]
  },
  'instruments-tools': {
    searchTerms: [
      'trauma shears', 'medical scissors', 'tweezers fine point', 'safety pins', 'splinter probe',
      'digital thermometer', 'penlight', 'flashlight medical', 'CPR face shield', 'resuscitation mask',
      'emt scissors', 'surgical scissors', 'first aid scissors', 'medical tweezers', 'splinter remover'
    ],
    requiredKeywords: ['scissors', 'tweezers', 'thermometer', 'flashlight', 'penlight', 'shears', 'probe', 'shield', 'instrument', 'tool', 'medical tool'],
    specificItems: [
      'trauma shears', 'medical scissors', 'surgical scissors', 'emt scissors', 'first aid scissors',
      'tweezers', 'fine-point tweezers', 'medical tweezers', 'precision tweezers', 'splinter tweezers',
      'safety pins', 'splinter probe', 'splinter remover', 'tick remover', 'lancet', 'blood lancet',
      'digital thermometer', 'medical thermometer', 'infrared thermometer', 'forehead thermometer',
      'penlight', 'medical flashlight', 'pupil light', 'diagnostic light', 'examination light',
      'CPR face shield', 'resuscitation mask', 'pocket mask', 'rescue breathing mask',
      'medical tools', 'first aid tools', 'emergency scissors', 'bandage scissors', 'nurse scissors',
      'stethoscope', 'blood pressure cuff', 'pulse oximeter', 'otoscope', 'ophthalmoscope'
    ],
    exclusions: [
      'kitchen scissors', 'craft scissors', 'hair scissors', 'nail scissors', 'office scissors',
      'tape', 'bandage', 'wrap', 'adhesive tape', 'medical tape', 'elastic bandage', 'gauze',
      'ointment', 'cream', 'gel', 'antiseptic', 'alcohol', 'hydrogen peroxide', 'wipe',
      'adhesive bandage', 'band-aid', 'sterile pad', 'wound dressing', 'cohesive wrap',
      'compression wrap', 'kinesiology tape', 'athletic tape', 'pre-wrap'
    ]
  },
  'trauma-emergency': {
    searchTerms: [
      'instant cold pack', 'emergency blanket', 'triangular bandage', 'sam splint', 'tourniquet',
      'emergency supplies', 'trauma kit', 'shock blanket', 'hypothermia blanket', 'sling bandage',
      'emergency splint', 'trauma bandage', 'hemostatic agent', 'quick clot', 'combat gauze'
    ],
    requiredKeywords: ['cold pack', 'emergency', 'triangular', 'splint', 'tourniquet', 'trauma', 'shock', 'hypothermia', 'hemostatic', 'combat'],
    specificItems: [
      'instant cold pack', 'emergency blanket', 'triangular bandage', 'sam splint', 'tourniquet',
      'shock blanket', 'hypothermia blanket', 'emergency sling', 'trauma bandage', 'israeli bandage',
      'emergency splint', 'finger splint', 'wrist splint', 'ankle splint', 'cervical collar',
      'hemostatic agent', 'quick clot', 'combat gauze', 'hemostatic gauze', 'blood stopper',
      'emergency tourniquet', 'tactical tourniquet', 'trauma shears', 'emergency scissors',
      'space blanket', 'mylar blanket', 'survival blanket', 'rescue blanket'
    ],
    exclusions: [
      'camping gear', 'hiking equipment', 'outdoor recreation', 'sleeping bag', 'tent',
      'regular scissors', 'craft scissors', 'office supplies', 'household items',
      'adhesive bandage', 'band-aid', 'gauze pad', 'medical tape', 'elastic bandage',
      'ointment', 'cream', 'antiseptic', 'alcohol', 'hydrogen peroxide', 'wipe',
      'thermometer', 'tweezers', 'safety pins', 'splinter probe'
    ]
  },
  'ppe': {
    searchTerms: [
      'nitrile gloves', 'vinyl gloves', 'medical face mask', 'hand sanitizer', 'biohazard bags',
      'disposable gloves', 'medical gloves', 'safety gloves', 'protective equipment', 'latex gloves',
      'surgical mask', 'n95 mask', 'face shield', 'safety goggles', 'protective gown'
    ],
    requiredKeywords: ['gloves', 'mask', 'sanitizer', 'biohazard', 'protective', 'safety', 'medical', 'disposable', 'ppe'],
    specificItems: [
      'nitrile gloves', 'vinyl gloves', 'latex gloves', 'medical gloves', 'disposable gloves',
      'examination gloves', 'surgical gloves', 'powder-free gloves', 'sterile gloves',
      'medical mask', 'face mask', 'surgical mask', 'n95 mask', 'kn95 mask', 'respirator mask',
      'face shield', 'protective face shield', 'safety goggles', 'protective eyewear',
      'hand sanitizer', 'alcohol sanitizer', 'sanitizing gel', 'hand disinfectant',
      'biohazard bag', 'medical waste bag', 'specimen bag', 'infectious waste bag',
      'protective gown', 'isolation gown', 'disposable gown', 'medical apron',
      'shoe covers', 'boot covers', 'hair net', 'bouffant cap', 'surgical cap'
    ],
    exclusions: [
      'fashion mask', 'costume mask', 'decorative mask', 'cloth mask', 'bandana',
      'work gloves', 'gardening gloves', 'winter gloves', 'leather gloves', 'cotton gloves',
      'scissors', 'tweezers', 'thermometer', 'tools', 'instruments', 'shears',
      'bandage', 'gauze', 'tape', 'wrap', 'ointment', 'cream', 'gel', 'antiseptic',
      'sunglasses', 'reading glasses', 'prescription glasses', 'fashion eyewear'
    ]
  },
  'information-essentials': {
    searchTerms: [
      'first aid guide', 'first aid manual', 'emergency contact cards', 'waterproof paper',
      'medical log', 'first aid booklet', 'emergency reference', 'medical reference',
      'emergency procedures', 'cpr instructions', 'medical forms', 'emergency cards'
    ],
    requiredKeywords: ['guide', 'manual', 'booklet', 'reference', 'emergency', 'first aid', 'medical', 'instructions', 'procedures'],
    specificItems: [
      'first aid guide', 'first aid manual', 'emergency guide', 'medical reference',
      'first aid booklet', 'emergency contact', 'waterproof paper', 'medication log',
      'emergency procedures', 'cpr instructions', 'medical forms', 'emergency cards',
      'first aid instructions', 'emergency reference card', 'medical information card',
      'allergy alert card', 'medical id card', 'emergency contact card', 'medical bracelet',
      'waterproof notepad', 'emergency log', 'incident report forms', 'medical history forms'
    ],
    exclusions: [
      'textbook', 'novel', 'fiction', 'entertainment', 'magazine', 'newspaper',
      'scissors', 'tweezers', 'thermometer', 'tools', 'instruments', 'shears',
      'bandage', 'gauze', 'tape', 'wrap', 'ointment', 'cream', 'gel', 'antiseptic',
      'medication', 'pills', 'tablets', 'capsules', 'gloves', 'mask', 'sanitizer',
      'cookbook', 'recipe book', 'travel guide', 'phone book'
    ]
  },
  'hot-cold-therapy': {
    searchTerms: [
      'instant cold compress', 'reusable gel pack', 'hot cold pack', 'topical analgesic',
      'heat wrap', 'cold therapy', 'hot therapy', 'gel compress', 'ice pack', 'heating pack'
    ],
    requiredKeywords: ['cold', 'hot', 'compress', 'gel pack', 'therapy', 'analgesic', 'heat', 'ice pack', 'thermal'],
    specificItems: [
      'instant cold compress', 'reusable gel pack', 'hot cold pack', 'topical analgesic',
      'heat wrap', 'cold compress', 'gel compress', 'ice pack', 'instant ice pack',
      'reusable ice pack', 'gel ice pack', 'cold pack', 'instant cold pack',
      'heating pack', 'heat pack', 'thermal pack', 'hot pack', 'instant heat pack',
      'microwaveable heat pack', 'self-heating pack', 'chemical heat pack',
      'cold therapy pack', 'hot therapy pack', 'thermal therapy', 'cryotherapy pack'
    ],
    exclusions: [
      'heating pad', 'electric blanket', 'space heater', 'electric heating pad',
      'scissors', 'tweezers', 'thermometer', 'tools', 'instruments', 'shears',
      'bandage', 'gauze', 'tape', 'wrap', 'ointment', 'cream', 'gel', 'antiseptic',
      'medication', 'pills', 'tablets', 'capsules', 'ibuprofen', 'acetaminophen',
      'cooler', 'refrigerator', 'freezer', 'ice maker'
    ]
  },
  'hydration-nutrition': {
    searchTerms: [
      'electrolyte powder', 'energy gel packets', 'emergency water tablets', 'glucose tablets',
      'hydration tablets', 'electrolyte drink', 'emergency nutrition', 'rehydration salts',
      'oral rehydration solution', 'emergency food', 'survival food', 'energy bars'
    ],
    requiredKeywords: ['electrolyte', 'energy', 'glucose', 'hydration', 'water', 'emergency', 'nutrition', 'rehydration', 'survival'],
    specificItems: [
      'electrolyte powder', 'energy gel', 'water tablets', 'glucose tablets',
      'hydration tablets', 'rehydration salts', 'emergency nutrition', 'emergency food',
      'oral rehydration solution', 'electrolyte drink mix', 'hydration drink mix',
      'emergency water purification', 'water purification tablets', 'emergency rations',
      'survival food bars', 'energy bars', 'emergency energy', 'glucose gel',
      'dextrose tablets', 'emergency glucose', 'hypoglycemia treatment'
    ],
    exclusions: [
      'protein powder', 'vitamin supplement', 'meal replacement', 'diet supplement',
      'weight loss supplement', 'bodybuilding supplement', 'whey protein', 'creatine',
      'scissors', 'tweezers', 'thermometer', 'tools', 'instruments', 'shears',
      'bandage', 'gauze', 'tape', 'wrap', 'ointment', 'cream', 'gel', 'antiseptic',
      'regular food', 'snacks', 'candy', 'soda', 'juice', 'coffee', 'tea'
    ]
  },
  'miscellaneous': {
    searchTerms: [
      'first aid kit bag', 'disposable towels', 'plastic waste bags', 'emergency whistle',
      'medical supplies', 'first aid supplies', 'emergency supplies', 'medical kit case',
      'first aid organizer', 'emergency kit bag', 'medical storage'
    ],
    requiredKeywords: ['first aid', 'medical', 'emergency', 'disposable', 'whistle', 'supplies', 'kit', 'bag', 'case'],
    specificItems: [
      'first aid bag', 'medical bag', 'disposable towels', 'waste bags', 'emergency whistle',
      'medical supplies', 'first aid supplies', 'first aid kit case', 'medical kit bag',
      'emergency kit bag', 'first aid organizer', 'medical storage bag', 'trauma bag',
      'emt bag', 'medical case', 'first aid pouch', 'emergency pouch', 'medical organizer',
      'disposable wipes', 'cleaning wipes', 'disinfectant wipes', 'medical waste container',
      'sharps container', 'emergency blanket storage', 'first aid kit refill'
    ],
    exclusions: [
      'regular towels', 'bath towels', 'kitchen towels', 'sports whistle', 'toy whistle',
      'scissors', 'tweezers', 'thermometer', 'tools', 'instruments', 'shears',
      'bandage', 'gauze', 'tape', 'wrap', 'ointment', 'cream', 'gel', 'antiseptic',
      'medication', 'pills', 'tablets', 'capsules', 'gloves', 'mask', 'sanitizer',
      'backpack', 'suitcase', 'luggage', 'purse', 'wallet', 'regular bag'
    ]
  }
};

// Legacy mapping for backward compatibility
const CATEGORY_SEARCH_TERMS = Object.fromEntries(
  Object.entries(FIRST_AID_CATEGORIES).map(([key, value]) => [key, value.searchTerms])
);

// Initialize the API client
const getApiClient = () => {
  const PA_ACCESS_KEY = process.env.AMAZON_PA_ACCESS_KEY;
  const PA_SECRET_KEY = process.env.AMAZON_PA_SECRET_KEY;
  const PA_PARTNER_TAG = process.env.AMAZON_PA_PARTNER_TAG;

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
const searchProductsInternal = (keywords, searchIndex = 'All', itemCount = 10, itemPage = 1) => {
  return new Promise((resolve, reject) => {
    try {
      const api = getApiClient();
      
      // Create search request
      const searchItemsRequest = new ProductAdvertisingAPIv1.SearchItemsRequest();
      
      // Set required parameters
      searchItemsRequest.PartnerTag = process.env.AMAZON_PA_PARTNER_TAG;
      searchItemsRequest.PartnerType = 'Associates';
      searchItemsRequest.Keywords = keywords;
      searchItemsRequest.SearchIndex = searchIndex;
      searchItemsRequest.ItemCount = itemCount;
      searchItemsRequest.ItemPage = itemPage;
      
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
      getItemsRequest.PartnerTag = process.env.AMAZON_PA_PARTNER_TAG;
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
const searchProducts = async (keywordsOrCategory, searchIndex = 'HealthPersonalCare', itemCount = 10, itemPage = 1) => {
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
    const response = await searchProductsInternal(keywords, actualSearchIndex, itemCount, itemPage);
    return response;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Import Amazon products to Appwrite database
const importAmazonProducts = async (selectedCategories, productsPerCategory) => {
  try {
    console.log('🔄 Starting Amazon product import process');
    console.log('📂 Selected categories:', selectedCategories);
    console.log('🔢 Products per category:', productsPerCategory);

    // Validate request parameters
    if (!selectedCategories || !Array.isArray(selectedCategories) || selectedCategories.length === 0) {
      console.error('❌ Validation failed: No selected categories');
      return {
        success: false,
        error: 'Selected categories are required'
      };
    }

    if (!productsPerCategory || productsPerCategory < 1 || productsPerCategory > 10) {
      console.error('❌ Validation failed: Invalid products per category:', productsPerCategory);
      return {
        success: false,
        error: 'Products per category must be between 1 and 10'
      };
    }

    // Validate required environment variables
    const databaseId = process.env.APPWRITE_FUNCTION_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
    if (!databaseId) {
      console.error('❌ Missing required environment variable: APPWRITE_FUNCTION_DATABASE_ID or APPWRITE_DATABASE_ID');
      return {
        success: false,
        error: 'Database ID is not configured'
      };
    }

    console.log('✅ Request validation passed');
    
    // Initialize Appwrite client
    console.log('Initializing Appwrite client...');
    let endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    
    // Clean endpoint URL - remove backticks and extra quotes
    endpoint = endpoint.replace(/[`"']/g, '').trim();
    
    // Validate endpoint format
    if (!endpoint.startsWith('http')) {
      console.error('❌ Invalid endpoint format:', endpoint);
      console.error('Endpoint must start with http:// or https://');
      return {
        success: false,
        error: 'Invalid Appwrite endpoint format'
      };
    }
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    
    console.log('Endpoint:', endpoint);
    console.log('Project ID:', projectId);
    console.log('API Key exists:', !!apiKey);
    
    if (!projectId) {
      console.error('❌ Missing required environment variable: APPWRITE_FUNCTION_PROJECT_ID or APPWRITE_PROJECT_ID');
      return {
        success: false,
        error: 'Project ID is not configured'
      };
    }
    
    if (!apiKey) {
      console.error('❌ Missing required environment variable: APPWRITE_API_KEY');
      return {
        success: false,
        error: 'API Key is not configured'
      };
    }
    
    const client = new Client();
    
    try {
      client
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);
    } catch (clientError) {
      console.error('❌ Failed to initialize Appwrite client:', clientError.message);
      return {
        success: false,
        error: `Client initialization failed: ${clientError.message}`
      };
    }

    const databases = new Databases(client);
    
    // Test database connection before proceeding
    try {
      console.log('Testing database connection...');
      console.log('Using database ID:', databaseId);
      console.log('Endpoint:', endpoint);
      
      const collections = await databases.listCollections(databaseId);
      console.log('✅ Database connection successful. Found collections:', collections.total);
      
    } catch (testError) {
      console.error('Database connection test failed:', testError.message);
      console.error('Full error details:', testError);
      if (testError.code) {
        console.error('Error code:', testError.code);
      }
      
      // Check if it's a 404 error which might indicate wrong endpoint
      if (testError.message.includes('404') || testError.message.includes('Route not found')) {
        console.error('⚠️  The Appwrite endpoint appears to be invalid or unavailable.');
        console.error('Please check your APPWRITE_FUNCTION_API_ENDPOINT or APPWRITE_ENDPOINT environment variable.');
        console.error('Current endpoint:', endpoint);
        console.error('Make sure the endpoint does not contain backticks or extra quotes');
      }
      
      return {
        success: false,
        error: `Database connection failed: ${testError.message}`
      };
    }
    
    // Collect all products
    const allProducts = [];
    const errors = [];

    // Get existing products from database first to check for duplicates during search
    console.log(`Using database ID: ${databaseId}`);
    let existingProductsResponse;
    
    try {
      console.log('Fetching existing products from collection: products');
      existingProductsResponse = await databases.listDocuments(
        databaseId,
        'products',
        [Query.limit(1000)] // Get all products to check for duplicates
      );
      console.log(`Found ${existingProductsResponse.documents.length} existing products`);
    } catch (dbError) {
      console.error('Error fetching existing products:', dbError.message);
      // If it's the old bug error, assume no products to avoid failure, but log it
      if (dbError.message.includes('request cannot have request body')) {
        console.warn('⚠️  Encountered request body error; assuming no existing products and proceeding with import');
        existingProductsResponse = {
          documents: [],
          total: 0
        };
      } else {
        throw new Error(`Failed to fetch existing products: ${dbError.message}`);
      }
    }
    
    const existingProducts = existingProductsResponse.documents;
    const existingASINs = new Set(existingProducts.map(p => p.asin).filter(Boolean));
    const existingNames = new Set(existingProducts.map(p => p.name).filter(Boolean));
    
    console.log(`Found ${existingASINs.size} existing ASINs and ${existingNames.size} existing product names`);

    // Enhanced function to search for alternative products when duplicates are found
    const searchAlternativeProducts = async (categoryId, searchTerms, targetCount, existingASINs, existingNames, allFoundProducts) => {
      const productsForCategory = [];
      const maxAttempts = 50; // Maximum search attempts to find unique products
      let attempts = 0;
      
      // Extended search terms for deeper searching
      const extendedSearchTerms = [
        ...searchTerms,
        // Add variations and related terms
        ...searchTerms.map(term => `${term} supplies`),
        ...searchTerms.map(term => `${term} kit`),
        ...searchTerms.map(term => `medical ${term}`),
        ...searchTerms.map(term => `first aid ${term}`),
        // Add brand-specific searches for more variety
        'Johnson & Johnson', 'Band-Aid', '3M', 'Medline', 'Curad', 'Nexcare'
      ];
      
      console.log(`🔍 Enhanced search for category ${categoryId} with ${extendedSearchTerms.length} search terms`);
      
      for (const searchTerm of extendedSearchTerms) {
        if (productsForCategory.length >= targetCount || attempts >= maxAttempts) break;
        
        let page = 1;
        const maxPages = 10; // Search deeper pages for each term
        
        while (page <= maxPages && productsForCategory.length < targetCount && attempts < maxAttempts) {
          console.log(`🔎 Searching "${searchTerm}" page ${page} for category ${categoryId} (attempt ${attempts + 1}/${maxAttempts})`);
          attempts++;
          
          try {
            const searchResult = await searchProducts(searchTerm, 'HealthPersonalCare', 10, page);
            
            if (searchResult?.SearchResult?.Items) {
              let foundNewProducts = false;
              
              // Add products to our collection, avoiding duplicates
              for (const item of searchResult.SearchResult.Items) {
                // Check if we already have this product (by ASIN or name)
                const asinExists = existingASINs.has(item.ASIN) || 
                                 productsForCategory.some(p => p.ASIN === item.ASIN) || 
                                 allFoundProducts.some(p => p.ASIN === item.ASIN);
                
                const productName = item.ItemInfo?.Title?.DisplayValue;
                const nameExists = productName && (existingNames.has(productName) || 
                                 productsForCategory.some(p => p.ItemInfo?.Title?.DisplayValue === productName) ||
                                 allFoundProducts.some(p => p.ItemInfo?.Title?.DisplayValue === productName));
                
                if (!asinExists && !nameExists && productsForCategory.length < targetCount) {
                  // Enhanced validation - ensure product is relevant to category AND appropriate for first aid
                  const isRelevant = checkProductRelevance(item, categoryId);
                  const isValidFirstAid = validateFirstAidProduct(item);
                  const matchesCategoryItems = validateCategorySpecificProduct(item, categoryId);
                  
                  if (isRelevant && isValidFirstAid && matchesCategoryItems) {
                    productsForCategory.push(item);
                    foundNewProducts = true;
                    console.log(`✅ Found valid first aid product: ${productName} (ASIN: ${item.ASIN})`);
                  } else {
                    let reason = 'unknown';
                    if (!isRelevant) reason = 'category relevance';
                    else if (!isValidFirstAid) reason = 'first aid validation';
                    else if (!matchesCategoryItems) reason = 'category-specific validation';
                    console.log(`⚠️  Skipping product due to failed ${reason}: ${productName}`);
                  }
                }
              }
              
              // If no new products found on this page, try next page but with less priority
              if (!foundNewProducts) {
                console.log(`No new unique products found on page ${page} for "${searchTerm}"`);
              }
            } else {
              // No more results on this page, stop paging this term
              console.log(`No results found for "${searchTerm}" page ${page}`);
              break;
            }
          } catch (searchError) {
            console.warn(`Search failed for term "${searchTerm}" page ${page}:`, searchError.message);
            // Continue with next term instead of breaking
            break;
          }
          
          page++;
          
          // Add small delay to avoid rate limiting
          if (attempts % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
      
      console.log(`🎯 Found ${productsForCategory.length} unique products for category ${categoryId} after ${attempts} search attempts`);
      return productsForCategory;
    };

    // Enhanced function to check if a product is relevant to the specific first aid category
    const checkProductRelevance = (product, categoryId) => {
      const title = product.ItemInfo?.Title?.DisplayValue || '';
      const features = product.ItemInfo?.Features?.DisplayValues || [];
      const description = [title, ...features].join(' ').toLowerCase();
      
      // Get category configuration
      const categoryConfig = FIRST_AID_CATEGORIES[categoryId];
      if (!categoryConfig) {
        console.warn(`Unknown category: ${categoryId}`);
        return false;
      }
      
      // Check for exclusions first - if any exclusion keyword is found, reject the product
      const hasExclusions = categoryConfig.exclusions.some(exclusion => 
        description.includes(exclusion.toLowerCase())
      );
      
      if (hasExclusions) {
        console.log(`❌ Product excluded due to exclusion keywords: ${title}`);
        return false;
      }
      
      // Check for required keywords - at least 2 must match for strong relevance
      const requiredMatches = categoryConfig.requiredKeywords.filter(keyword => 
        description.includes(keyword.toLowerCase())
      ).length;
      
      // Check for specific item matches - these are high-confidence matches
      const specificMatches = categoryConfig.specificItems.filter(item => 
        description.includes(item.toLowerCase())
      ).length;
      
      // Product is relevant if:
      // 1. It has at least 1 specific item match, OR
      // 2. It has at least 2 required keyword matches
      const isRelevant = specificMatches >= 1 || requiredMatches >= 2;
      
      if (!isRelevant) {
        console.log(`⚠️ Product failed relevance check: ${title} (specific: ${specificMatches}, required: ${requiredMatches})`);
      } else {
        console.log(`✅ Product passed relevance check: ${title} (specific: ${specificMatches}, required: ${requiredMatches})`);
      }
      
      return isRelevant;
    };
    
    // Additional function to validate product against first aid context
    const validateFirstAidProduct = (product, categoryId) => {
      const title = product.ItemInfo?.Title?.DisplayValue || '';
      const features = product.ItemInfo?.Features?.DisplayValues || [];
      const description = [title, ...features].join(' ').toLowerCase();
      
      // General first aid context keywords that should be present
      const firstAidContextKeywords = [
        'first aid', 'medical', 'emergency', 'health', 'safety', 'care', 'treatment',
        'wound', 'injury', 'trauma', 'rescue', 'hospital', 'clinic', 'sterile',
        'disposable', 'single use', 'professional', 'healthcare'
      ];
      
      // Check if the product has any first aid context
      const hasFirstAidContext = firstAidContextKeywords.some(keyword => 
        description.includes(keyword)
      );
      
      // Additional validation for medical/health product indicators
      const medicalIndicators = [
        'fda', 'medical grade', 'hospital', 'clinical', 'sterile', 'latex free',
        'hypoallergenic', 'antimicrobial', 'antiseptic', 'pharmaceutical'
      ];
      
      const hasMedicalIndicators = medicalIndicators.some(indicator => 
        description.includes(indicator)
      );
      
      // Product should have either first aid context OR medical indicators
      const isValidFirstAidProduct = hasFirstAidContext || hasMedicalIndicators;
      
      if (!isValidFirstAidProduct) {
        console.log(`❌ Product failed first aid validation: ${title}`);
      }
      
      return isValidFirstAidProduct;
    };

    // Comprehensive validation function to ensure products match typical items for their category
    const validateCategorySpecificProduct = (product, categoryId) => {
      const title = product.ItemInfo?.Title?.DisplayValue || '';
      const features = product.ItemInfo?.Features?.DisplayValues || [];
      const description = [title, ...features].join(' ').toLowerCase();
      
      // Category-specific validation patterns based on typical items
      const categoryValidation = {
        'wound-care-dressings': {
          mustHave: ['bandage', 'gauze', 'pad', 'dressing', 'adhesive', 'wound', 'sterile'],
          typicalItems: [
            'band-aid', 'band aid', 'adhesive bandage', 'gauze pad', 'sterile pad',
            'non-adherent pad', 'eye pad', 'rolled gauze', 'liquid bandage',
            'skin adhesive', 'wound dressing', 'medical tape'
          ],
          exclude: ['toy', 'costume', 'decoration', 'craft', 'art']
        },
        'tapes-wraps': {
          mustHave: ['tape', 'wrap', 'bandage', 'elastic', 'cohesive', 'athletic'],
          typicalItems: [
            'medical tape', 'adhesive tape', 'elastic bandage', 'ace bandage',
            'cohesive wrap', 'self-adhering', 'athletic tape', 'pre-wrap',
            'compression wrap', 'support bandage'
          ],
          exclude: ['duct tape', 'electrical tape', 'packaging tape', 'craft tape']
        },
        'antiseptics-ointments': {
          mustHave: ['antiseptic', 'ointment', 'cream', 'gel', 'wipe', 'alcohol', 'hydrogen'],
          typicalItems: [
            'antibiotic ointment', 'antiseptic wipe', 'alcohol pad', 'prep pad',
            'hydrogen peroxide', 'wound wash', 'burn gel', 'burn cream',
            'hydrocortisone', 'neosporin', 'bacitracin', 'iodine'
          ],
          exclude: ['cosmetic', 'beauty', 'lotion', 'moisturizer', 'perfume']
        },
        'pain-relief': {
          mustHave: ['pain', 'relief', 'ibuprofen', 'acetaminophen', 'aspirin', 'antihistamine'],
          typicalItems: [
            'ibuprofen', 'acetaminophen', 'aspirin', 'tylenol', 'advil', 'motrin',
            'antihistamine', 'benadryl', 'antacid', 'tums', 'pepto', 'oral rehydration',
            'sting relief', 'bite relief', 'pain reliever'
          ],
          exclude: ['prescription', 'controlled', 'narcotic', 'supplement', 'vitamin']
        },
        'instruments-tools': {
          mustHave: ['scissor', 'tweezer', 'thermometer', 'tool', 'instrument', 'medical'],
          typicalItems: [
            'trauma shears', 'medical scissors', 'tweezers', 'fine-point tweezers',
            'safety pins', 'splinter probe', 'lancet', 'digital thermometer',
            'flashlight', 'penlight', 'cpr mask', 'face shield', 'resuscitation'
          ],
          exclude: ['kitchen', 'craft', 'hobby', 'beauty', 'nail', 'hair']
        },
        'trauma-emergency': {
          mustHave: ['emergency', 'trauma', 'cold pack', 'blanket', 'splint', 'tourniquet'],
          typicalItems: [
            'instant cold pack', 'emergency blanket', 'shock blanket', 'hypothermia',
            'triangular bandage', 'sling', 'splint', 'sam splint', 'tourniquet',
            'emergency tape', 'duct tape', 'trauma kit'
          ],
          exclude: ['camping', 'outdoor', 'survival', 'hiking', 'sports']
        },
        'ppe': {
          mustHave: ['glove', 'mask', 'protection', 'ppe', 'sanitizer', 'biohazard'],
          typicalItems: [
            'nitrile gloves', 'vinyl gloves', 'medical gloves', 'face mask',
            'surgical mask', 'hand sanitizer', 'biohazard bag', 'waste bag',
            'protective equipment', 'disposable gloves'
          ],
          exclude: ['fashion', 'costume', 'cleaning', 'household', 'industrial']
        },
        'information-essentials': {
          mustHave: ['guide', 'manual', 'book', 'card', 'information', 'reference'],
          typicalItems: [
            'first aid guide', 'first aid manual', 'emergency guide', 'reference card',
            'instruction booklet', 'emergency contact', 'medication log',
            'waterproof paper', 'emergency pen'
          ],
          exclude: ['novel', 'fiction', 'entertainment', 'game', 'puzzle']
        },
        'hot-cold-therapy': {
          mustHave: ['cold', 'hot', 'therapy', 'compress', 'pack', 'gel', 'heat'],
          typicalItems: [
            'instant cold compress', 'cold pack', 'hot pack', 'gel pack',
            'reusable pack', 'heat wrap', 'topical analgesic', 'cooling gel',
            'heating pad', 'ice pack'
          ],
          exclude: ['food', 'beverage', 'cooking', 'kitchen', 'appliance']
        },
        'hydration-nutrition': {
          mustHave: ['electrolyte', 'hydration', 'energy', 'glucose', 'water', 'nutrition'],
          typicalItems: [
            'electrolyte powder', 'electrolyte packet', 'energy gel', 'glucose tablets',
            'emergency water', 'water tablets', 'rehydration salts', 'sports drink',
            'energy bar', 'nutrition bar'
          ],
          exclude: ['candy', 'snack', 'junk food', 'soda', 'alcohol', 'coffee']
        }
      };
      
      const validation = categoryValidation[categoryId];
      if (!validation) return true; // Allow if no specific validation defined
      
      // Check if product has at least one required term
      const hasRequiredTerm = validation.mustHave.some(term => 
        description.includes(term.toLowerCase())
      );
      
      // Check if product matches typical items
      const matchesTypicalItem = validation.typicalItems.some(item => 
        description.includes(item.toLowerCase())
      );
      
      // Check for exclusions
      const hasExclusions = validation.exclude.some(exclusion => 
        description.includes(exclusion.toLowerCase())
      );
      
      // Product is valid if it has required terms OR matches typical items, AND has no exclusions
      const isValid = (hasRequiredTerm || matchesTypicalItem) && !hasExclusions;
      
      if (!isValid) {
        console.log(`❌ Product "${title}" failed category validation for ${categoryId}`);
        console.log(`   Required term: ${hasRequiredTerm}, Typical item: ${matchesTypicalItem}, Exclusions: ${hasExclusions}`);
      }
      
      return isValid;
    };

    // Process each category with enhanced duplicate handling and alternative product search
    for (const categoryId of selectedCategories) {
      try {
        const searchTerms = CATEGORY_SEARCH_TERMS[categoryId] || ['medical supplies'];
        
        console.log(`🚀 Processing category: ${categoryId} (target: ${productsPerCategory} products)`);
        
        // Use enhanced search function to find alternative products
        const productsForCategory = await searchAlternativeProducts(
          categoryId, 
          searchTerms, 
          productsPerCategory, 
          existingASINs, 
          existingNames, 
          allProducts
        );
        
        // Add found products to the main collection
        allProducts.push(...productsForCategory);
        console.log(`✅ Final count for category ${categoryId}: ${productsForCategory.length} products`);
        
        // If we didn't find enough products, log a warning
        if (productsForCategory.length < productsPerCategory) {
          console.warn(`⚠️  Only found ${productsForCategory.length}/${productsPerCategory} unique products for category ${categoryId}`);
        }
        
      } catch (categoryError) {
        console.error(`❌ Error processing category ${categoryId}:`, categoryError);
        errors.push(`Error processing category ${categoryId}: ${categoryError.message}`);
      }
    }
    
    console.log(`Found ${allProducts.length} products from Amazon`);
    
    // Since we already filtered duplicates during search, all products should be unique
    const uniqueProducts = allProducts;
    console.log(`Found ${uniqueProducts.length} unique products to import`);
    
    // Get detailed product information using GetItems
    let detailedProducts = uniqueProducts;
    if (uniqueProducts.length > 0) {
      try {
        console.log('🔍 Fetching detailed product information...');
        const asins = uniqueProducts.map(p => p.ASIN).filter(Boolean);
        
        if (asins.length > 0) {
          const detailedResponse = await getItemDetails(asins);
          
          if (detailedResponse?.ItemsResult?.Items) {
            console.log(`✅ Got detailed information for ${detailedResponse.ItemsResult.Items.length} products`);
            detailedProducts = detailedResponse.ItemsResult.Items;
          } else {
            console.warn('⚠️  GetItems response did not contain detailed product data, using original search results');
          }
        }
      } catch (detailError) {
        console.warn('⚠️  Failed to get detailed product information:', detailError.message);
        console.warn('Proceeding with original search results');
      }
    }
    
    // Map Amazon data fields to local product fields
    const productsToCreate = detailedProducts.map(product => {
      // Extract category from the selected categories based on search terms
      // This is a simplified approach - in a real implementation, you might want to use browse nodes
      let category = 'Miscellaneous & General'; // Default category
      
      // Enhanced category matching using the comprehensive first aid category system
      const title = product.ItemInfo?.Title?.DisplayValue || '';
      const features = product.ItemInfo?.Features?.DisplayValues || [];
      const description = [title, ...features].join(' ').toLowerCase();
      
      // Map to the friendly category names used in the UI
      const friendlyCategoryMap = {
        'wound-care-dressings': 'Wound Care & Dressings',
        'tapes-wraps': 'Tapes & Wraps',
        'antiseptics-ointments': 'Antiseptics & Ointments',
        'pain-relief': 'Pain & Symptom Relief',
        'instruments-tools': 'Instruments & Tools',
        'trauma-emergency': 'Trauma & Emergency',
        'ppe': 'Personal Protection Equipment (PPE)',
        'information-essentials': 'First Aid Information & Essentials',
        'hot-cold-therapy': 'Hot & Cold Therapy',
        'hydration-nutrition': 'Hydration & Nutrition',
        'miscellaneous': 'Miscellaneous & General'
      };
      
      // Try to find the best matching category using enhanced logic
      let bestMatch = { categoryId: 'miscellaneous', score: 0 };
      let categoryScores = [];
      
      for (const [categoryId, categoryConfig] of Object.entries(FIRST_AID_CATEGORIES)) {
        let score = 0;
        let specificMatches = 0;
        let requiredMatches = 0;
        let hasExclusions = false;
        
        // Check for exclusions first (disqualifies the category completely)
        hasExclusions = categoryConfig.exclusions.some(exclusion => 
          description.includes(exclusion.toLowerCase())
        );
        
        if (hasExclusions) {
          console.log(`❌ Category ${categoryId} excluded for "${title}" due to exclusion keywords`);
          continue; // Skip this category entirely
        }
        
        // Check specific items (highest weight - these are exact matches)
        const matchedSpecificItems = categoryConfig.specificItems.filter(item => 
          description.includes(item.toLowerCase())
        );
        specificMatches = matchedSpecificItems.length;
        
        // Give very high score for specific item matches
        score += specificMatches * 50;
        
        // Check required keywords (lower weight)
        const matchedRequiredKeywords = categoryConfig.requiredKeywords.filter(keyword => 
          description.includes(keyword.toLowerCase())
        );
        requiredMatches = matchedRequiredKeywords.length;
        score += requiredMatches * 5;
        
        // Bonus points for multiple specific matches (indicates strong relevance)
        if (specificMatches > 1) {
          score += 25;
        }
        
        // Bonus points if the product title contains category-specific terms
        const titleLower = title.toLowerCase();
        const titleSpecificMatches = categoryConfig.specificItems.filter(item => 
          titleLower.includes(item.toLowerCase())
        ).length;
        score += titleSpecificMatches * 30; // Title matches are very important
        
        categoryScores.push({
          categoryId,
          score,
          specificMatches,
          requiredMatches,
          titleSpecificMatches,
          matchedItems: matchedSpecificItems,
          matchedKeywords: matchedRequiredKeywords
        });
        
        // Update best match if this category scores higher
        if (score > bestMatch.score) {
          bestMatch = { categoryId, score };
        }
      }
      
      // Log detailed scoring for debugging
      if (categoryScores.length > 0) {
        console.log(`🔍 Category scoring for "${title}":`);
        categoryScores
          .sort((a, b) => b.score - a.score)
          .slice(0, 3) // Show top 3 matches
          .forEach(cat => {
            console.log(`   ${cat.categoryId}: ${cat.score} pts (specific: ${cat.specificMatches}, required: ${cat.requiredMatches}, title: ${cat.titleSpecificMatches})`);
            if (cat.matchedItems.length > 0) {
              console.log(`     Matched items: ${cat.matchedItems.join(', ')}`);
            }
          });
      }
      
      // Only assign a specific category if we have a good match (score > 25)
      // With the new scoring system: 1 specific match = 50 pts, title match = 30 pts
      if (bestMatch.score > 25) {
        category = friendlyCategoryMap[bestMatch.categoryId];
        console.log(`📂 Categorized "${title}" as "${category}" (score: ${bestMatch.score})`);
      } else {
        console.log(`📂 Product "${title}" assigned to Miscellaneous (low score: ${bestMatch.score})`);
      }
      
      // Extract features from the product
      const productFeatures = product.ItemInfo?.Features?.DisplayValues || [];
      
      // Extract price (use the lowest price if multiple offers)
      let price = null;
      if (product.Offers?.Listings && product.Offers.Listings.length > 0) {
        const prices = product.Offers.Listings
          .map(listing => listing.Price?.Amount)
          .filter(Boolean);
        if (prices.length > 0) {
          price = Math.min(...prices);
        }
      }
      
      // Extract image URL (use the medium image if available)
      const imageUrl = product.Images?.Primary?.Medium?.URL || 
                      product.Images?.Primary?.Large?.URL || 
                      product.Images?.Primary?.Small?.URL || 
                      null;
      

      
      // Extract dimensions and weight
      let dimensions = product.ItemInfo?.ProductInfo?.ItemDimensions?.DisplayValue || null;
      const weight = product.ItemInfo?.ProductInfo?.PackageDimensions?.Weight?.DisplayValue || null;
      
      // Extract quantity information but we'll store it in dimensions if needed
      let quantity = null;
      
      // Try to extract quantity from title (common patterns like "100 Count", "Pack of 50", etc.)
      const productTitle = product.ItemInfo?.Title?.DisplayValue || '';
      const quantityMatch = productTitle.match(/(\d+)\s*(?:Count|Pack|Pack of|Packaging|Pieces|Ct|Pc)/i);
      if (quantityMatch) {
        quantity = parseInt(quantityMatch[1]);
      }
      
      // If not found in title, try to get from product info
      if (!quantity && product.ItemInfo?.ProductInfo?.PackageDimensions?.DisplayValue) {
        const packageInfo = product.ItemInfo.ProductInfo.PackageDimensions.DisplayValue;
        const packageQuantityMatch = packageInfo.match(/(\d+)\s*(?:Count|Pack|Pieces)/i);
        if (packageQuantityMatch) {
          quantity = parseInt(packageQuantityMatch[1]);
        }
      }
      
      // Map Amazon data to our product structure
      // Handle brand data properly - it comes as an object with DisplayValue
      const brandData = product.ItemInfo?.ByLineInfo?.Brand;
      const brandString = brandData?.DisplayValue ? String(brandData.DisplayValue).substring(0, 100) : 'Unknown Brand';
      
      // Extract material information from features or description
      let material = '';
      const materialKeywords = ['made of', 'material', 'cotton', 'polyester', 'nylon', 'latex', 'plastic', 'fabric', 'blend'];
      
      // Look for material information in features
      for (const feature of productFeatures) {
        const lowerFeature = feature.toLowerCase();
        if (materialKeywords.some(keyword => lowerFeature.includes(keyword))) {
          // Extract the sentence containing material info
          material = feature.substring(0, 100);
          break;
        }
      }
      
      // Extract quantity information and add to dimensions if needed
      if (quantity && !dimensions) {
        dimensions = `${quantity} ct`;
      }

      // Create the product object - only include attributes that exist in database schema
      return {
        name: productTitle.substring(0, 255),
        description: productFeatures.join('; ').substring(0, 2000), // Updated to match schema limit
        category: category,
        price: price,
        imageUrl: imageUrl,
        brand: brandString,
        material: material,
        dimensions: dimensions,
        weight: weight,

        asin: product.ASIN,
        affiliateLink: `https://www.amazon.com/dp/${product.ASIN}?tag=${process.env.AMAZON_PA_PARTNER_TAG}`,
        features: productFeatures.slice(0, 3).join('; ').substring(0, 1000), // Add features field
        qty: quantity || 1 // Default quantity to 1 if not found
      };
    });
    
    console.log(`Prepared ${productsToCreate.length} products for database insertion`);
    
    // Insert products into database
    const createdProducts = [];
    const creationErrors = [];
    
    for (const product of productsToCreate) {
      try {
        console.log(`Creating product: ${product.name} in database: ${databaseId}`);
        console.log('Database ID:', databaseId);
        console.log('Collection ID: products');
        console.log('Document ID:', 'ID.unique()');
        console.log('Product data keys:', Object.keys(product));

        
        const createdProduct = await databases.createDocument(
          databaseId,
          'products',
          ID.unique(),
          product
        );
        console.log(`✅ Successfully created product: ${product.name}`);
        
        createdProducts.push(createdProduct);
        console.log(`Created product: ${product.name} (${product.asin})`);
      } catch (error) {
        console.error(`❌ Error creating product ${product.name}:`, error.message);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        if (error.code) {
          console.error('Error code:', error.code);
        }
        if (error.response) {
          console.error('Error response:', error.response);
        }
        creationErrors.push({
          product: product.name,
          error: error.message
        });
      }
    }
    
    console.log(`Successfully imported ${createdProducts.length} products`);
    
    return {
      success: true,
      data: {
        totalFound: allProducts.length,
        totalUnique: uniqueProducts.length,
        totalCreated: createdProducts.length,
        errors: [...errors, ...creationErrors]
      }
    };
  } catch (error) {
    console.error('Error importing Amazon products:', error);
    return {
      success: false,
      error: 'Failed to import Amazon products',
      message: error.message
    };
  }
};

// Main function handler for Appwrite
export default async ({ req, res, log, error }) => {
  // Enable CORS
  if (req.method === 'OPTIONS') {
    return res.json({
      status: 'ok'
    }, 200);
  }

  try {
    // Parse request body
    const body = req.bodyJson || {};
    const { action, category, asin, keywords, searchIndex, itemCount = 10, selectedCategories, productsPerCategory } = body;

    log('Received request with action:', action);
    
    let result;
    
    switch (action) {
      case 'search':
        if (keywords) {
          result = await searchProductsInternal(keywords, searchIndex, itemCount);
        } else if (category) {
          result = await searchProducts(category, searchIndex, itemCount);
        } else {
          return res.json({ 
            error: 'Please provide either category or keywords parameter' 
          }, 400);
        }
        break;
        
      case 'details':
        if (!asin) {
          return res.json({ 
            error: 'ASIN is required for product details' 
          }, 400);
        }
        result = await getItemDetails(asin);
        break;
        
      case 'import':
        if (!selectedCategories || !productsPerCategory) {
          return res.json({ 
            error: 'selectedCategories and productsPerCategory are required for import' 
          }, 400);
        }
        result = await importAmazonProducts(selectedCategories, productsPerCategory);
        break;
        
      default:
        return res.json({ 
          error: 'Invalid action. Supported actions: search, details, import' 
        }, 400);
    }

    return res.json(result, 200);
    
  } catch (err) {
    error('Function error:', err);
    return res.json({ 
      error: 'Failed to process request',
      details: err.message 
    }, 500);
  }
};