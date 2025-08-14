import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import and use the Amazon API functions
import amazonAuth from './functions/amazon-auth.js';
import amazonCatalogSearch from './functions/amazon-catalog-search.js';
import amazonProductDetails from './functions/amazon-product-details.js';
import amazonPricing from './functions/amazon-pricing.js';
import scrapeAmazonProduct from './functions/scrape-amazon-product.js';

// Amazon Auth endpoint
app.post('/api/amazon-auth', amazonAuth);

// Amazon Catalog Search endpoint
app.get('/api/amazon-catalog-search', amazonCatalogSearch);

// Amazon Product Details endpoint
app.get('/api/amazon-product-details/:asin', amazonProductDetails);

// Amazon Pricing endpoint
app.get('/api/amazon-pricing', amazonPricing);

// Amazon Product Scraping endpoint
app.post('/api/scrape-amazon-product', scrapeAmazonProduct);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Amazon SP-API server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Amazon SP-API server running on http://localhost:${PORT}`);
  console.log('📦 Available endpoints:');
  console.log('  POST /api/amazon-auth');
  console.log('  GET  /api/amazon-catalog-search');
  console.log('  GET  /api/amazon-product-details/:asin');
  console.log('  GET  /api/amazon-pricing');
  console.log('  POST /api/scrape-amazon-product');
  console.log('  GET  /api/health');
});

export default app;