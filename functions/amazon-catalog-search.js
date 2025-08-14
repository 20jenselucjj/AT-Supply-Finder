import 'dotenv/config';
import axios from 'axios';
import CryptoJS from 'crypto-js';

// AWS Signature Version 4 signing process
function createSignature(method, uri, queryString, headers, payload, accessKey, secretKey, region, service) {
    const algorithm = 'AWS4-HMAC-SHA256';
    const date = new Date().toISOString().replace(/[:\-]|\..\d{3}/g, '');
    const dateStamp = date.substr(0, 8);
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    
    // Create canonical request
    const canonicalHeaders = Object.keys(headers)
        .sort()
        .map(key => `${key.toLowerCase()}:${headers[key]}\n`)
        .join('');
    
    const signedHeaders = Object.keys(headers)
        .sort()
        .map(key => key.toLowerCase())
        .join(';');
    
    const payloadHash = CryptoJS.SHA256(payload).toString();
    
    const canonicalRequest = [
        method,
        uri,
        queryString,
        canonicalHeaders,
        signedHeaders,
        payloadHash
    ].join('\n');
    
    // Create string to sign
    const stringToSign = [
        algorithm,
        date,
        credentialScope,
        CryptoJS.SHA256(canonicalRequest).toString()
    ].join('\n');
    
    // Calculate signature
    const kDate = CryptoJS.HmacSHA256(dateStamp, `AWS4${secretKey}`);
    const kRegion = CryptoJS.HmacSHA256(region, kDate);
    const kService = CryptoJS.HmacSHA256(service, kRegion);
    const kSigning = CryptoJS.HmacSHA256('aws4_request', kService);
    const signature = CryptoJS.HmacSHA256(stringToSign, kSigning).toString();
    
    return {
        signature,
        date,
        credentialScope,
        signedHeaders
    };
}

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
        
        const mockItems = [
            {
                asin: 'B07MOCK001',
                title: 'Mueller Athletic Tape - White Zinc Oxide Tape for Sports Injuries',
                brand: 'Mueller',
                category: 'Athletic Training',
                imageUrl: 'https://via.placeholder.com/300x300?text=Athletic+Tape',
                features: ['Zinc oxide adhesive', 'Strong support', 'Easy tear', 'Water resistant'],
                dimensions: '1.5" x 15 yards',
                weight: '0.5 lbs',
                material: 'Cotton blend with zinc oxide adhesive'
            },
            {
                asin: 'B07MOCK002', 
                title: 'Kinesiology Tape - Elastic Sports Tape for Muscle Support',
                brand: 'KT Tape',
                category: 'Athletic Training',
                imageUrl: 'https://via.placeholder.com/300x300?text=Kinesiology+Tape',
                features: ['Elastic support', 'Water resistant', 'Latex free', '24/7 wear'],
                dimensions: '2" x 16.4 feet',
                weight: '0.3 lbs',
                material: '97% cotton, 3% spandex'
            },
            {
                asin: 'B07MOCK003',
                title: 'Pre-Wrap Athletic Tape Underwrap - Foam Padding',
                brand: 'Cramer',
                category: 'Athletic Training', 
                imageUrl: 'https://via.placeholder.com/300x300?text=Pre-Wrap',
                features: ['Soft foam padding', 'Protects skin', 'Easy application', 'Lightweight'],
                dimensions: '2.75" x 30 yards',
                weight: '0.2 lbs',
                material: 'Polyurethane foam'
            },
            {
                asin: 'B07MOCK004',
                title: 'Elastic Bandage Wrap - Compression Support for Injuries',
                brand: 'ACE',
                category: 'Athletic Training',
                imageUrl: 'https://via.placeholder.com/300x300?text=Elastic+Bandage',
                features: ['Adjustable compression', 'Reusable', 'Breathable', 'Easy application'],
                dimensions: '4" x 5 yards',
                weight: '0.4 lbs', 
                material: 'Cotton and elastic blend'
            },
            {
                asin: 'B07MOCK005',
                title: 'Cohesive Bandage - Self-Adhesive Athletic Wrap',
                brand: 'Coban',
                category: 'Athletic Training',
                imageUrl: 'https://via.placeholder.com/300x300?text=Cohesive+Bandage',
                features: ['Self-adhesive', 'No clips needed', 'Flexible', 'Sweat resistant'],
                dimensions: '2" x 5 yards',
                weight: '0.3 lbs',
                material: 'Non-woven fabric with cohesive adhesive'
            }
        ];

        const transformedItems = mockItems.slice(0, maxResults).map(item => ({
            asin: item.asin,
            title: item.title,
            brand: item.brand,
            category: item.category,
            imageUrl: item.imageUrl,
            features: item.features,
            dimensions: item.dimensions,
            weight: item.weight,
            material: item.material,
            manufacturer: item.brand,
            modelNumber: `${item.brand}-${item.asin.slice(-3)}`,
            colorName: 'White',
            sizeName: 'Standard'
        }));

        return res.status(200).json({
            items: transformedItems,
            pagination: { totalResults: mockItems.length }
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
        const mockItems = [
            {
                asin: 'B07MOCK001',
                title: 'Mueller Athletic Tape - White Zinc Oxide Tape for Sports Injuries',
                brand: 'Mueller',
                category: 'Athletic Training',
                imageUrl: 'https://via.placeholder.com/300x300?text=Athletic+Tape',
                features: ['Zinc oxide adhesive', 'Strong support', 'Easy tear', 'Water resistant'],
                dimensions: '1.5" x 15 yards',
                weight: '0.5 lbs',
                material: 'Cotton blend with zinc oxide adhesive'
            }
        ];

        return res.status(200).json({
            items: mockItems,
            pagination: { totalResults: mockItems.length },
            note: 'Returned mock athletic products due to sandbox/search failure'
        });
    }
};