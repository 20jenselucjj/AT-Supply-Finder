import 'dotenv/config';
import axios from 'axios';
import { createSignature } from './utils/aws-signature.js';
import { mockAthleticProducts, transformMockItems } from './utils/mock-products.js';

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { keywords, category, maxResults = 20, marketplaceIds } = req.query;

    if (!keywords) {
        return res.status(400).json({ error: 'Keywords are required' });
    }

    // Since the sandbox has limited functionality, provide mock data for athletic training products
    if (keywords.toLowerCase().includes('athletic') || keywords.toLowerCase().includes('training') || 
        keywords.toLowerCase().includes('tape') || keywords.toLowerCase().includes('bandage')) {
        
        console.log('Returning mock athletic training products for search:', keywords);
        
        const transformedItems = transformMockItems(mockAthleticProducts, maxResults);

        return res.status(200).json({
            items: transformedItems,
            pagination: { totalResults: mockAthleticProducts.length }
        });
    }

    try {
        const accessToken = await getAccessToken();
        console.log('Access token obtained:', accessToken ? 'Yes' : 'No');
        console.log('Attempting real API call for keywords:', keywords);
        
        // Build query parameters - try with actual keywords first
        const queryParams = new URLSearchParams();
        // Use the actual search keywords instead of hardcoded values
        queryParams.append('keywords', keywords);
        queryParams.append('marketplaceIds', marketplaceIds || 'ATVPDKIKX0DER');
        queryParams.append('pageSize', Math.min(maxResults, 20).toString());
        queryParams.append('includedData', 'attributes,dimensions,identifiers,images,productTypes,relationships,salesRanks,summaries,vendorDetails');
        
        console.log('Using search parameters: keywords=', keywords, 'marketplaceIds=', marketplaceIds || 'ATVPDKIKX0DER');

        const endpoint = 'https://sandbox.sellingpartnerapi-na.amazon.com';
        const path = '/catalog/2022-04-01/items';
        const url = `${endpoint}${path}?${queryParams.toString()}`;

        // Prepare headers for AWS Signature V4 signing
        const headers = {
            'x-amz-access-token': accessToken,
            'User-Agent': 'WrapWizardFinder/1.0 (Language=JavaScript)',
            'host': 'sandbox.sellingpartnerapi-na.amazon.com'
        };

        // AWS Signature V4 signing - temporarily disabled for testing
        // const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
        // if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
        //     const signatureData = createSignature(
        //         'GET',
        //         path,
        //         queryParams.toString(),
        //         headers,
        //         '', // Empty body for GET request
        //         AWS_ACCESS_KEY_ID,
        //         AWS_SECRET_ACCESS_KEY,
        //         'us-east-1',
        //         'execute-api'
        //     );

        //     headers['x-amz-date'] = signatureData.date;
        //     headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${AWS_ACCESS_KEY_ID}/${signatureData.credentialScope}, SignedHeaders=${signatureData.signedHeaders}, Signature=${signatureData.signature}`;
        // }
        console.log('Making request without AWS signing, using only LWA token');
        console.log('Request URL:', url);
        console.log('Request headers:', JSON.stringify(headers, null, 2));

        const catalogResponse = await axios.get(url, {
            headers,
            timeout: 30000
        });

        // Transform the response to match our expected format
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
    } catch (error) {
        console.error('Error searching catalog:', error.response?.data || error.message);

        // Fallback 1: Try static sandbox required parameters once to see if it returns mock data
        try {
            const fallbackParams = new URLSearchParams();
            fallbackParams.append('keywords', 'samsung,tv');
            fallbackParams.append('marketplaceIds', 'ATVPDKIKX0DER');
            fallbackParams.append('pageSize', Math.min(maxResults, 20).toString());
            fallbackParams.append('includedData', 'attributes,dimensions,identifiers,images,productTypes,relationships,salesRanks,summaries,vendorDetails');
        
            const endpoint = 'https://sandbox.sellingpartnerapi-na.amazon.com';
            const path = '/catalog/2022-04-01/items';
            const fallbackUrl = `${endpoint}${path}?${fallbackParams.toString()}`;
            console.log('Attempting fallback static sandbox call:', fallbackUrl);
        
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
                pagination: fallbackResponse.data.pagination || {}
            });
        } catch (fallbackError) {
            console.warn('Fallback static sandbox call also failed:', fallbackError.response?.data || fallbackError.message);
        }

        // Fallback 2: If everything fails, return the same mock athletic products as a last resort
        const transformedItems = transformMockItems(mockAthleticProducts, maxResults);

        return res.status(200).json({
            items: transformedItems,
            pagination: { totalResults: mockAthleticProducts.length },
            note: 'Returned mock athletic products due to sandbox/search failure'
        });
    }
};