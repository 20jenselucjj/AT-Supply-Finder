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
        const tokenResponse = await axios.post('https://api.amazon.com/auth/o2/token', params);
        return tokenResponse.data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error);
        throw new Error('Could not retrieve access token');
    }
};

export default async (req, res) => {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { asins } = req.query;

    if (!asins) {
        return res.status(400).json({ error: 'ASINs are required' });
    }

    try {
        const accessToken = await getAccessToken();
        const pricingResponse = await axios.get('https://sellingpartnerapi-na.amazon.com/products/pricing/v0/items', {
            headers: {
                'x-amz-access-token': accessToken,
                'Content-Type': 'application/json'
            },
            params: {
                MarketplaceId: 'ATVPDKIKX0DER', // US marketplace
                ItemType: 'Asin',
                Asins: asins
            }
        });

        return res.status(200).json(pricingResponse.data);
    } catch (error) {
        console.error('Error fetching pricing data:', error);
        return res.status(500).json({ error: 'Failed to fetch pricing data' });
    }
};