import axios from 'axios';
import * as cheerio from 'cheerio';

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

// Helper function to extract price
function extractPrice(priceText) {
  if (!priceText) return null;
  const match = priceText.match(/\$?([0-9,]+\.?[0-9]*)/);  
  return match ? parseFloat(match[1].replace(/,/g, '')) : null;
}

export default async function handler(req, res) {
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
    
    for (const selector of titleSelectors) {
      const title = $(selector).first().text();
      if (title) {
        productData.name = cleanText(title);
        break;
      }
    }

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

    console.log('Extracted product data:', productData);

    // Return the extracted data
    return res.status(200).json({
      success: true,
      data: productData
    });

  } catch (error) {
    console.error('Error scraping Amazon product:', error.message);
    
    // Return error with some helpful information
    return res.status(500).json({ 
      error: 'Failed to scrape product information',
      details: error.message,
      suggestion: 'The product page might be protected or the URL format is not supported'
    });
  }
}