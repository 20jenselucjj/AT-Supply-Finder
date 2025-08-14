import 'dotenv/config';
import axios from 'axios';

export default async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { grant_type, refresh_token, client_id, client_secret } = req.body;

    if (!grant_type || !refresh_token || !client_id || !client_secret) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const params = new URLSearchParams();
        params.append('grant_type', grant_type);
        params.append('refresh_token', refresh_token);
        params.append('client_id', client_id);
        params.append('client_secret', client_secret);

        const tokenResponse = await axios.post('https://api.amazon.com/auth/o2/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return res.status(200).json(tokenResponse.data);
    } catch (error) {
        console.error('Error getting access token:', error.response?.data || error.message);
        return res.status(500).json({ 
            error: 'Failed to get access token',
            details: error.response?.data || error.message
        });
    }
};