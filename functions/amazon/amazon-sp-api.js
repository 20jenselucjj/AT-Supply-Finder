import 'dotenv/config';
import axios from 'axios';

// Shared function to get access token using LWA refresh token
const getAccessToken = async () => {
    const { AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET, AMZN_SANDBOX_REFRESH_TOKEN } = process.env;
    
    if (!AMAZON_CLIENT_ID || !AMAZON_CLIENT_SECRET || !AMZN_SANDBOX_REFRESH_TOKEN) {
        throw new Error('Missing Amazon API credentials in server environment');
    }
    
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', AMZN_SANDBOX_REFRESH_TOKEN);
    params.append('client_id', AMAZON_CLIENT_ID);
    params.append('client_secret', AMAZON_CLIENT_SECRET);

    try {
        const tokenResponse = await axios.post('https://api.amazon.com/auth/o2/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return tokenResponse.data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error.response?.data || error.message);
        throw new Error('Could not retrieve access token');
    }
};

// Shared CORS setup
export default async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { action, keywords, category, maxResults = 20, marketplaceId = 'ATVPDKIKX0DER', asins, asin, includedData } = req.query;

    if (!action) {
        return res.status(400).json({ error: 'Action is required (search, pricing, details)' });
    }

    try {
        const accessToken = await getAccessToken();
        const headers = {
            'x-amz-access-token': accessToken,
            'User-Agent': 'WrapWizardFinder/1.0 (Language=JavaScript)',
            'host': 'sellingpartnerapi-na.amazon.com'  // Default to production; override for sandbox if needed
        };

        if (action === 'search') {
            if (!keywords) {
                return res.status(400).json({ error: 'Keywords are required for search' });
            }
            
            // Use sandbox for search as in original
            const endpoint = 'https://sandbox.sellingpartnerapi-na.amazon.com';
            headers.host = 'sandbox.sellingpartnerapi-na.amazon.com';
            
            const queryParams = new URLSearchParams();
            queryParams.append('keywords', keywords);
            queryParams.append('marketplaceIds', marketplaceId);
            queryParams.append('pageSize', Math.min(maxResults, 20).toString());
            queryParams.append('includedData', 'attributes,dimensions,identifiers,images,productTypes,relationships,salesRanks,summaries,vendorDetails');
            
            const path = '/catalog/2022-04-01/items';
            const url = `${endpoint}${path}?${queryParams.toString()}`;

            console.log('Making search request:', url);
            
            const catalogResponse = await axios.get(url, {
                headers,
                timeout: 30000
            });

            // Transform response for search
            const items = catalogResponse.data.items || [];
            const transformedItems = items.map(item => {
                const attributes = item.attributes || {};
                const images = item.images || [];
                const summaries = item.summaries || [];
                const summary = summaries[0] || {};
                
                return {
                    asin: item.asin,
                    title: summary.itemName || attributes.item_name?.[0]?.value || 'Unknown Product',
                    brand: summary.brandName || attributes.brand?.[0]?.value,
                    category: attributes.item_type_name?.[0]?.value,
                    imageUrl: images[0]?.images?.[0]?.link,
                    features: attributes.feature_bullets?.map(f => f.value) || [],
                    dimensions: item.dimensions || attributes.item_dimensions?.[0]?.value,
                    weight: attributes.item_weight?.[0]?.value,
                    material: attributes.material_type?.[0]?.value,
                    manufacturer: summary.manufacturer,
                    modelNumber: summary.modelNumber,
                    colorName: summary.colorName,
                    sizeName: summary.sizeName
                };
            });

            return res.status(200).json({
                items: transformedItems,
                pagination: catalogResponse.data.pagination || {}
            });
        } else if (action === 'pricing') {
            if (!asins) {
                return res.status(400).json({ error: 'ASINs are required for pricing' });
            }
            
            const asinArray = asins.split(',').map(a => a.trim());
            
            const pricingResponse = await axios.get('https://sellingpartnerapi-na.amazon.com/products/pricing/v0/items', {
                headers,
                params: {
                    MarketplaceId: marketplaceId,
                    ItemType: 'Asin',
                    Asins: asinArray.join(',')
                },
                timeout: 30000
            });

            // Transform pricing data
            const pricingData = {};
            if (pricingResponse.data && pricingResponse.data.payload) {
                pricingResponse.data.payload.forEach(item => {
                    if (item.ASIN && item.Product && item.Product.Offers && item.Product.Offers.length > 0) {
                        const offer = item.Product.Offers[0];
                        if (offer.BuyingPrice && offer.BuyingPrice.Amount) {
                            pricingData[item.ASIN] = parseFloat(offer.BuyingPrice.Amount);
                        }
                    }
                });
            }

            return res.status(200).json(pricingData);
        } else if (action === 'details') {
            if (!asin) {
                return res.status(400).json({ error: 'ASIN is required for details' });
            }
            
            const queryParams = new URLSearchParams();
            queryParams.append('marketplaceIds', marketplaceId);
            queryParams.append('includedData', includedData || 'attributes,images,productTypes,relationships,dimensions');

            const path = `/catalog/2022-04-01/items/${asin}`;
            const url = `https://sellingpartnerapi-na.amazon.com${path}?${queryParams.toString()}`;

            const productResponse = await axios.get(url, {
                headers,
                timeout: 30000
            });

            // Transform product details
            const product = productResponse.data;
            const attributes = product.attributes || {};
            const images = product.images || [];
            
            const transformedProduct = {
                asin: product.asin,
                title: attributes.item_name?.[0]?.value || 'Unknown Product',
                brand: attributes.brand?.[0]?.value,
                category: attributes.item_type_name?.[0]?.value,
                imageUrl: images[0]?.images?.[0]?.link,
                features: attributes.feature_bullets?.map(f => f.value) || [],
                dimensions: attributes.item_dimensions?.[0]?.value,
                weight: attributes.item_weight?.[0]?.value,
                material: attributes.material_type?.[0]?.value,
                productTypes: product.productTypes || [],
                relationships: product.relationships || []
            };

            return res.status(200).json(transformedProduct);
        } else {
            return res.status(400).json({ error: 'Invalid action. Use: search, pricing, details' });
        }
    } catch (error) {
        console.error(`Error in ${action} action:`, error.response?.data || error.message);
        
        if (action === 'details' && error.response?.status === 404) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Fallback for search (as in original)
        if (action === 'search') {
            try {
                const fallbackParams = new URLSearchParams();
                fallbackParams.append('keywords', 'samsung,tv');
                fallbackParams.append('marketplaceIds', marketplaceId);
                fallbackParams.append('pageSize', Math.min(maxResults, 20).toString());
                fallbackParams.append('includedData', 'attributes,dimensions,identifiers,images,productTypes,relationships,salesRanks,summaries,vendorDetails');
                
                const endpoint = 'https://sandbox.sellingpartnerapi-na.amazon.com';
                const fallbackPath = '/catalog/2022-04-01/items';
                const fallbackUrl = `${endpoint}${fallbackPath}?${fallbackParams.toString()}`;
                
                const fallbackResponse = await axios.get(fallbackUrl, {
                    headers,
                    timeout: 30000
                });
                
                const items = fallbackResponse.data.items || [];
                const transformedItems = items.map(item => {
                    const attributes = item.attributes || {};
                    const images = item.images || [];
                    const summaries = item.summaries || [];
                    const summary = summaries[0] || {};
                    return {
                        asin: item.asin,
                        title: summary.itemName || attributes.item_name?.[0]?.value || 'Unknown Product',
                        brand: summary.brandName || attributes.brand?.[0]?.value,
                        category: attributes.item_type_name?.[0]?.value,
                        imageUrl: images[0]?.images?.[0]?.link,
                        features: attributes.feature_bullets?.map(f => f.value) || [],
                        dimensions: item.dimensions || attributes.item_dimensions?.[0]?.value,
                        weight: attributes.item_weight?.[0]?.value,
                        material: attributes.material_type?.[0]?.value,
                        manufacturer: summary.manufacturer,
                        modelNumber: summary.modelNumber,
                        colorName: summary.colorName,
                        sizeName: summary.sizeName
                    };
                });
                
                return res.status(200).json({
                    items: transformedItems,
                    pagination: fallbackResponse.data.pagination || {},
                    note: 'Using fallback search due to original query failure'
                });
            } catch (fallbackError) {
                console.warn('Fallback search also failed:', fallbackError.response?.data || fallbackError.message);
            }
        }
        
        return res.status(500).json({ 
            error: `Failed to perform ${action} action`,
            details: error.response?.data || error.message
        });
    }
};