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

    const { asins, marketplaceId } = req.query;

    if (!asins) {
        return res.status(400).json({ error: 'ASINs are required' });
    }

    try {
        const accessToken = await getAccessToken();
        const asinArray = asins.split(',').map(asin => asin.trim());
        
        // Prepare headers for AWS Signature V4 signing (no Content-Type for GET requests)
        const headers = {
            'x-amz-access-token': accessToken,
            'User-Agent': 'WrapWizardFinder/1.0 (Language=JavaScript)',
            'host': 'sellingpartnerapi-na.amazon.com'
        };

        const pricingResponse = await axios.get('https://sellingpartnerapi-na.amazon.com/products/pricing/v0/items', {
            headers,
            params: {
                MarketplaceId: marketplaceId || 'ATVPDKIKX0DER',
                ItemType: 'Asin',
                Asins: asinArray.join(',')
            },
            timeout: 30000
        });

        // Transform pricing data to a simple ASIN -> price mapping
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
    } catch (error) {
        console.error('Error fetching pricing data:', error.response?.data || error.message);
        return res.status(500).json({ 
            error: 'Failed to fetch pricing data',
            details: error.response?.data || error.message
        });
    }
};