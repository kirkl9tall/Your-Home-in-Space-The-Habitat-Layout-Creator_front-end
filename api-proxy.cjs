// Simple Node.js proxy server to bypass CORS issues
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Proxy endpoint for NASA API
app.post('/nasa-analysis', async (req, res) => {
  try {
    console.log('Proxying request to NASA API...');
    
    const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.";
    const API_ENDPOINT = "https://amine759--nasa-habitat-validator-api.modal.run/agent";
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(req.body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    res.json(result);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy Error',
      message: error.message,
      details: 'Failed to connect to NASA API'
    });
  }
});

app.listen(PORT, () => {
  console.log(`NASA API Proxy running on http://localhost:${PORT}`);
  console.log('Use this proxy to bypass CORS issues in development');
});