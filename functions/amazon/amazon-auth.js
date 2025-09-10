import 'dotenv/config';
import axios from 'axios';

export default async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // Only accept refresh_token from client - client_secret is server-side only
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({ error: 'refresh_token is required' });
    }

    // Get sensitive credentials from server environment variables only
    const client_id = process.env.AMAZON_CLIENT_ID;
    const client_secret = process.env.AMAZON_CLIENT_SECRET;

    if (!client_id || !client_secret) {
        console.error('Missing Amazon API credentials in server environment');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const response = await axios.post('https://api.amazon.com/auth/o2/token', {
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
            client_id: client_id,
            client_secret: client_secret
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return res.status(200).json(response.data);
    } catch (error) {
        console.error('Amazon auth error:', error.response?.data || error.message);
        return res.status(error.response?.status || 500).json({
            error: 'Authentication failed',
            message: error.response?.data?.error_description || error.message
        });
    }
};