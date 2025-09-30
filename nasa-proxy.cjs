// Simple CORS proxy for NASA API
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-API-Key']
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'NASA Proxy Server is running', port: PORT });
});

// NASA API proxy endpoint
app.post('/nasa-analysis', async (req, res) => {
  try {
    console.log('🚀 Proxying NASA API request...');
    console.log('Request body size:', JSON.stringify(req.body).length, 'bytes');
    
    const NASA_API_ENDPOINT = "https://amine759--nasa-habitat-validator-api.modal.run/agent";
    const NASA_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.";
    
    const response = await fetch(NASA_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': NASA_API_KEY
      },
      body: JSON.stringify(req.body)
    });
    
    console.log('NASA API Response Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('NASA API Error:', errorText);
      return res.status(response.status).json({
        error: `NASA API Error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }
    
    const result = await response.json();
    console.log('✅ NASA API Success - Rules checked:', result.results?.length || 0);
    
    // Return the NASA API response directly
    res.json(result);
    
  } catch (error) {
    console.error('❌ Proxy Error:', error.message);
    res.status(500).json({
      error: 'Proxy Server Error',
      message: error.message,
      details: 'Failed to connect to NASA API through proxy'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🌌 NASA API Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to NASA Modal API`);
  console.log(`🛡️  CORS enabled for browser access`);
});