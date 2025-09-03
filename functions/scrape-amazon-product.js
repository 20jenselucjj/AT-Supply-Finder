import axios from 'axios';
import * as cheerio from 'cheerio';
import { enhanceProductWithAI } from './utils/ai-product-enhancer.js';

// Helper function to extract ASIN from Amazon URL
function extractASINFromURL(url) {
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
}

// Helper function to clean text
function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

// Helper function to create concise product names
function createConciseName(title, brand) {
  if (!title) return '';
  
  // Remove brand name if it's at the beginning
  let conciseTitle = title;
  if (brand) {
    const brandRegex = new RegExp('^' + brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i');
    conciseTitle = title.replace(brandRegex, '');
  }
  
  // Remove common phrases that make titles too long
  const phrasesToRemove = [
    'First Aid and Wound Care Supplies',
    'First Aid Supplies',
    'Wound Care Supplies',
    'Wound Care',
    'All-One Size',
    'Assorted Sizes',
    'Various Sizes',
    'Multi-Pack',
    'Multipack',
    'Count',
    'Pack of',
    'Package of',
    'Set of',
    'Assorted',
    'Flexible',
    'Adhesive',
    'Fabric',
    'Plastic',
    'Disposable',
    'Single Use',
    'Sterile',
    'Non-Sterile',
    'Latex Free',
    'Latex-Free',
    'Hypoallergenic',
    'for ',
    'with ',
    'and ',
    'Individually Wrapped',
    'Individually Packed',
    'Bulk',
    'Economy',
    'Value Pack',
    // Add more specific phrases to remove
    '100 Count',
    '200 Count',
    '50 Count',
    '30 Count',
    '10 Count',
    'Each',
    'per Pack',
    'per Box'
  ];
  
  for (const phrase of phrasesToRemove) {
    const regex = new RegExp('\\s*[,\\-\\(\\)]*\\s*' + phrase.replace(/[.*+?^${}()|[\\]\\-]/g, '\\$&') + '[\\s\\,\\-\\(\\)]*', 'gi');
    conciseTitle = conciseTitle.replace(regex, ' ');
  }
  
  // Remove extra spaces and trim
  conciseTitle = conciseTitle.replace(/\s+/g, ' ').trim();
  
  // If the title is still long, try to extract the core product name
  if (conciseTitle.length > 50) {
    // Try to find the main product type
    const productTypes = [
      'Bandages', 'Bandage', 'Tape', 'Gauze', 'Wipes', 'Gloves', 'Thermometer',
      'Pack', 'Kit', 'Set', 'Pads', 'Dressings', 'Dressing', 'Wraps', 'Wrap',
      'Tablets', 'Capsules', 'Gel', 'Cream', 'Solution', 'Spray', 'Ointment',
      'Shears', 'Scissors', 'Tweezers', 'Pins', 'Mask', 'Sanitizer', 'Blanket',
      'Antiseptic', 'Hydrogen Peroxide', 'Alcohol', 'Cleanser', 'Wash',
      // Add more specific product types
      'Adhesive Bandages', 'Fabric Bandages', 'Foam Dressings', 'Gel Dressings',
      'Medical Tape', 'Athletic Tape', 'Elastic Bandage', 'Compression Bandage'
    ];
    
    let bestTitle = conciseTitle; // Default to original if no better option found
    let foundProductType = false;
    
    for (const type of productTypes) {
      const typeIndex = conciseTitle.toLowerCase().indexOf(type.toLowerCase());
      if (typeIndex !== -1) {
        foundProductType = true;
        
        // If product type is near the beginning, preserve the beginning
        if (typeIndex <= 30) {
          // Take a substring starting from the beginning
          const end = Math.min(conciseTitle.length, 57);
          bestTitle = conciseTitle.substring(0, end).trim() + (end < conciseTitle.length ? '...' : '');
        } else {
          // Product type is further in, so extract context around it
          // But make sure we don't start too far in
          const start = Math.max(0, typeIndex - 20);
          // Don't start too far in as we want to preserve meaningful content
          if (start > 20) {
            // If we're starting too far in, prefer the beginning of the title
            const end = Math.min(conciseTitle.length, 57);
            bestTitle = conciseTitle.substring(0, end).trim() + (end < conciseTitle.length ? '...' : '');
          } else {
            const end = Math.min(conciseTitle.length, start + 57);
            bestTitle = conciseTitle.substring(start, end).trim() + (end < conciseTitle.length ? '...' : '');
          }
        }
        break;
      }
    }
    
    // If no product type was found, just truncate from the beginning
    if (!foundProductType) {
      bestTitle = conciseTitle.substring(0, 57) + '...';
    }
    
    conciseTitle = bestTitle;
  }
  
  // Add brand back if it was removed and the title is very short
  if (brand && conciseTitle.length < 10) {
    conciseTitle = brand + ' ' + conciseTitle;
  }
  
  // Ensure the title fits in build categories (max 60 characters)
  if (conciseTitle.length > 60) {
    conciseTitle = conciseTitle.substring(0, 57) + '...';
  }
  
  // Ensure we always return a valid name
  const finalTitle = conciseTitle.trim();
  if (!finalTitle || finalTitle.length === 0) {
    return 'Unnamed Product';
  }
  
  return finalTitle;
}

// Helper function to extract price
function extractPrice(priceText) {
  if (!priceText) return null;
  const match = priceText.match(/\$?([0-9,]+\.?[0-9]*)/);  
  return match ? parseFloat(match[1].replace(/,/g, '')) : null;
}

export default async function scrapeAmazonProduct(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Extract ASIN from URL
    const asin = extractASINFromURL(url);
    if (!asin) {
      return res.status(400).json({ error: 'Could not extract ASIN from URL' });
    }

    // Create a clean Amazon product URL
    const cleanUrl = `https://www.amazon.com/dp/${asin}`;
    
    console.log('Scraping Amazon product:', cleanUrl);

    // Make request with realistic headers to avoid blocking
    const response = await axios.get(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    
    // Extract product information using various selectors
    const productData = {
      asin,
      name: '',
      brand: '',
      category: '',
      image_url: '',
      price: null,
      rating: null,
      features: [],
      dimensions: '',
      weight: '',
      material: ''
    };

    // Extract product title
    const titleSelectors = [
      '#productTitle',
      '.product-title',
      '[data-automation-id="product-title"]',
      '.a-size-large.product-title-word-break'
    ];
    
    let fullTitle = '';
    for (const selector of titleSelectors) {
      const title = $(selector).first().text();
      if (title) {
        fullTitle = cleanText(title);
        break;
      }
    }
    
    // Create a concise name from the full title
    productData.name = createConciseName(fullTitle, productData.brand);

    // Extract brand
    const brandSelectors = [
      '#bylineInfo',
      '.a-link-normal[data-attribute="brand"]',
      '[data-automation-id="brand-name"]',
      '.po-brand .po-break-word'
    ];
    
    for (const selector of brandSelectors) {
      const brand = $(selector).first().text();
      if (brand) {
        productData.brand = cleanText(brand.replace(/^(by|Brand:|Visit the|Store)\s*/i, ''));
        break;
      }
    }

    // Extract main product image
    const imageSelectors = [
      '#landingImage',
      '.a-dynamic-image',
      '[data-automation-id="product-image"]',
      '.imgTagWrapper img'
    ];
    
    for (const selector of imageSelectors) {
      const imgSrc = $(selector).first().attr('src') || $(selector).first().attr('data-src');
      if (imgSrc && imgSrc.includes('amazon.com')) {
        // Get higher resolution image
        productData.image_url = imgSrc.replace(/\._[A-Z0-9,_]+_/, '._AC_SL1500_');
        break;
      }
    }

    // Extract price
    const priceSelectors = [
      '.a-price-whole',
      '.a-price .a-offscreen',
      '[data-automation-id="price"]',
      '.a-price-range .a-price .a-offscreen'
    ];
    
    for (const selector of priceSelectors) {
      const priceText = $(selector).first().text();
      if (priceText) {
        const price = extractPrice(priceText);
        if (price) {
          productData.price = price;
          break;
        }
      }
    }

    // Extract rating
    const ratingSelectors = [
      '.a-icon-alt',
      '[data-automation-id="average-star-rating"]',
      '.reviewCountTextLinkedHistogram .a-icon-alt'
    ];
    
    for (const selector of ratingSelectors) {
      const ratingText = $(selector).first().text();
      if (ratingText && ratingText.includes('out of')) {
        const match = ratingText.match(/([0-9.]+)\s*out of/);
        if (match) {
          productData.rating = parseFloat(match[1]);
          break;
        }
      }
    }

    // Extract features/bullet points
    const featureSelectors = [
      '#feature-bullets ul li span',
      '.a-unordered-list.a-vertical .a-list-item',
      '[data-automation-id="feature-list"] li'
    ];
    
    for (const selector of featureSelectors) {
      const features = [];
      $(selector).each((i, el) => {
        const feature = cleanText($(el).text());
        if (feature && feature.length > 10 && !feature.toLowerCase().includes('make sure')) {
          features.push(feature);
        }
      });
      if (features.length > 0) {
        productData.features = features.slice(0, 5); // Limit to 5 features
        break;
      }
    }

    // Extract category from breadcrumbs
    const categorySelectors = [
      '#wayfinding-breadcrumbs_feature_div a',
      '.a-breadcrumb a',
      '[data-automation-id="breadcrumb"] a'
    ];
    
    for (const selector of categorySelectors) {
      const categories = [];
      $(selector).each((i, el) => {
        const category = cleanText($(el).text());
        if (category && !category.toLowerCase().includes('amazon')) {
          categories.push(category);
        }
      });
      if (categories.length > 0) {
        productData.category = categories[categories.length - 1]; // Use the most specific category
        break;
      }
    }
    
    // Map Amazon categories to our first aid categories (using the new build page category system)
    const categoryMapping = {
      'Medical Supplies': 'wound-care-dressings',
      'Wound Care Supplies': 'wound-care-dressings',
      'Bandages': 'wound-care-dressings',
      'First Aid': 'wound-care-dressings',
      'Tape': 'tapes-wraps',
      'Bandaging Supplies': 'tapes-wraps',
      'Elastic Bandages': 'tapes-wraps',
      'Ace Bandages': 'tapes-wraps',
      'Athletic Tape': 'tapes-wraps',
      'Medical Tape': 'tapes-wraps',
      'Antiseptics': 'antiseptics-ointments',
      'Hydrogen Peroxide': 'antiseptics-ointments',
      'Alcohol': 'antiseptics-ointments',
      'Antibiotic Ointment': 'antiseptics-ointments', // Specific mapping for antibiotic ointments
      'Ointment': 'antiseptics-ointments', // General mapping for ointments
      'Burn Gel': 'antiseptics-ointments', // Specific mapping for burn gels
      'Antiseptic Wipes': 'antiseptics-ointments', // Specific mapping for antiseptic wipes
      'Pain Relievers': 'pain-relief',
      'Pain Relief': 'pain-relief',
      'Medication': 'pain-relief',
      'Allergy': 'pain-relief',
      'Antihistamines': 'pain-relief',
      'Thermometers': 'instruments-tools',
      'Health Monitoring': 'instruments-tools',
      'Medical Instruments': 'instruments-tools',
      'First Aid Tools': 'instruments-tools',
      'Scissors': 'instruments-tools',
      'Tweezers': 'instruments-tools',
      'Gloves': 'instruments-tools',
      'Safety Equipment': 'instruments-tools',
      'Emergency Supplies': 'trauma-emergency',
      'Emergency Blankets': 'trauma-emergency',
      'Splints': 'trauma-emergency',
      'Tourniquets': 'trauma-emergency',
      'Protective Equipment': 'ppe',
      'Masks': 'ppe',
      'Sanitizers': 'ppe',
      'First Aid Books': 'information-essentials',
      'Instructional Materials': 'information-essentials',
      'Hot Cold Therapy': 'hot-cold-therapy',
      'Heat Packs': 'hot-cold-therapy',
      'Cold Packs': 'hot-cold-therapy',
      'Electrolytes': 'hydration-nutrition',
      'Energy Gels': 'hydration-nutrition',
      'Nutritional Supplements': 'hydration-nutrition'
    };
    
    // Try to map the extracted category to our system
    if (productData.category) {
      const lowerCategory = productData.category.toLowerCase();
      for (const [amazonCategory, firstAidCategory] of Object.entries(categoryMapping)) {
        if (lowerCategory.includes(amazonCategory.toLowerCase())) {
          productData.category = firstAidCategory;
          break;
        }
      }
    }
    
    // Additional check for antibiotic ointments in the product title
    const fullTitleLower = fullTitle.toLowerCase();
    if (fullTitleLower.includes('antibiotic ointment') || fullTitleLower.includes('triple antibiotic')) {
      productData.category = 'antiseptics-ointments';
    }
    // Additional check for other ointments
    else if (fullTitleLower.includes('ointment') && !productData.category) {
      productData.category = 'antiseptics-ointments';
    }
    // Additional check for antiseptic products
    else if ((fullTitleLower.includes('antiseptic') || fullTitleLower.includes('burn gel')) && !productData.category) {
      productData.category = 'antiseptics-ointments';
    }
    // Additional check for pain relief products
    else if (!productData.category && (
      fullTitleLower.includes('pain') || 
      fullTitleLower.includes('relief') || 
      fullTitleLower.includes('ibuprofen') || 
      fullTitleLower.includes('acetaminophen') ||
      fullTitleLower.includes('antihistamine')
    )) {
      productData.category = 'pain-relief';
    }

    // Extract dimensions and weight from product details
    const detailRows = $('#productDetails_detailBullets_sections1 tr, #productDetails_techSpec_section_1 tr');
    detailRows.each((i, row) => {
      const label = $(row).find('td:first-child').text().toLowerCase();
      const value = cleanText($(row).find('td:last-child').text());
      
      if (label.includes('dimensions') && !productData.dimensions) {
        productData.dimensions = value;
      } else if (label.includes('weight') && !productData.weight) {
        productData.weight = value;
      } else if (label.includes('material') && !productData.material) {
        productData.material = value;
      }
    });
    
    // Additional material extraction from product description and features
    if (!productData.material) {
      // Look for material information in features
      const featuresText = Array.isArray(productData.features) ? productData.features.join(' ') : '';
      
      // Common material terms to look for
      const materialTerms = [
        'adhesive', 'latex-free', 'latex free', 'sterile', 'foam', 'gel', 'plastic',
        'fabric', 'cotton', 'polyester', 'silicone', 'rubber', 'vinyl', 'metal',
        'aluminum', 'steel', 'nylon', 'neoprene', 'microfiber', 'gauze'
      ];
      
      for (const term of materialTerms) {
        if (fullTitle.toLowerCase().includes(term) || featuresText.toLowerCase().includes(term)) {
          // Capitalize the first letter
          productData.material = term.charAt(0).toUpperCase() + term.slice(1);
          break;
        }
      }
      
      // If still no material found, check for more specific combinations
      if (!productData.material) {
        const materialCombinations = [
          'latex-free adhesive',
          'sterile gauze',
          'medical grade',
          'non-woven',
          'non woven'
        ];
        
        for (const combination of materialCombinations) {
          if (fullTitle.toLowerCase().includes(combination) || featuresText.toLowerCase().includes(combination)) {
            productData.material = combination.split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            break;
          }
        }
      }
    }
    
    console.log('Extracted product data:', productData);

    // Enhance product data with AI if API key is available
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (openRouterApiKey) {
      try {
        console.log('Enhancing product data with AI...');
        const enhancedProductData = await enhanceProductWithAI({
          ...productData,
          title: fullTitle, // Pass the full title for better AI processing
          features: productData.features, // Ensure features are passed correctly
          dimensions: productData.dimensions, // Pass dimensions for sizing information
          weight: productData.weight // Pass weight information
        }, openRouterApiKey);
        
        // Merge enhanced data with original data
        Object.assign(productData, enhancedProductData);
        console.log('Product data enhanced with AI:', productData);
      } catch (enhanceError) {
        console.error('Error enhancing product with AI:', enhanceError.message);
        // Continue with original data if AI enhancement fails
      }
    }

    // Validate required fields
    if (!productData.name || productData.name.trim() === '') {
      console.error('Product name is missing or empty');
      return res.status(500).json({ 
        error: 'Failed to extract product name',
        details: 'Product name is required but was not found or is empty',
        suggestion: 'The product page might be protected or the URL format is not supported'
      });
    }

    // Return the extracted data
    return res.status(200).json({
      success: true,
      data: productData
    });

  } catch (error) {
    console.error('Error scraping Amazon product:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return error with more detailed information
    return res.status(500).json({ 
      error: 'Failed to scrape product information',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      suggestion: 'The product page might be protected, the URL format may not be supported, or the product may be unavailable.'
    });
  }
}