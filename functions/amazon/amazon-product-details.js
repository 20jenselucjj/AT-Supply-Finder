import 'dotenv/config';
import axios from 'axios';

const getAccessToken = async () => {
    const { AMZN_CLIENT_ID, AMZN_CLIENT_SECRET, AMZN_SANDBOX_REFRESH_TOKEN } = process.env;
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', AMZN_SANDBOX_REFRESH_TOKEN);
    params.append('client_id', AMZN_CLIENT_ID);
    params.append('client_secret', AMZN_CLIENT_SECRET);

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

export default async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // Extract ASIN from the URL path
    const pathParts = req.url.split('/');
    const asin = pathParts[pathParts.length - 1].split('?')[0];

    if (!asin) {
        return res.status(400).json({ error: 'ASIN is required' });
    }

    const { marketplaceIds, includedData } = req.query;

    try {
        const accessToken = await getAccessToken();
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('marketplaceIds', marketplaceIds || 'ATVPDKIKX0DER');
        queryParams.append('includedData', includedData || 'attributes,images,productTypes,relationships,dimensions');

        const endpoint = 'https://sellingpartnerapi-na.amazon.com';
        const path = `/catalog/2022-04-01/items/${asin}`;
        const url = `${endpoint}${path}?${queryParams.toString()}`;

        // Prepare headers for AWS Signature V4 signing (no Content-Type for GET requests)
        const headers = {
            'x-amz-access-token': accessToken,
            'User-Agent': 'WrapWizardFinder/1.0 (Language=JavaScript)',
            'host': 'sellingpartnerapi-na.amazon.com'
        };

        const productResponse = await axios.get(url, {
            headers,
            timeout: 30000
        });

        // Transform the response to match our expected format
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
    } catch (error) {
        console.error('Error getting product details:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        return res.status(500).json({ 
            error: 'Failed to get product details',
            details: error.response?.data || error.message
        });
    }
};