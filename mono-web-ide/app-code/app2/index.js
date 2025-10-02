const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data store (for demo purposes)
let dataStore = [
  { id: 1, name: 'Sample Item 1', value: 100 },
  { id: 2, name: 'Sample Item 2', value: 200 },
  { id: 3, name: 'Sample Item 3', value: 300 },
];

// Routes

// Welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Welcome to App2 - Express API',
    version: '1.0.0',
    endpoints: {
      status: '/api/status',
      data: '/api/data',
      health: '/api/health',
    },
    documentation: 'See README.md for API documentation',
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Server is running smoothly',
  });
});

// Get all data
app.get('/api/data', (req, res) => {
  res.json({
    success: true,
    count: dataStore.length,
    data: dataStore,
  });
});

// Get single item
app.get('/api/data/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const item = dataStore.find(item => item.id === id);
  
  if (item) {
    res.json({
      success: true,
      data: item,
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Item not found',
    });
  }
});

// Add new data
app.post('/api/data', (req, res) => {
  const { name, value } = req.body;
  
  if (!name || value === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Name and value are required',
    });
  }
  
  const newItem = {
    id: dataStore.length + 1,
    name,
    value,
  };
  
  dataStore.push(newItem);
  
  res.status(201).json({
    success: true,
    message: 'Item created successfully',
    data: newItem,
  });
});

// Update data
app.put('/api/data/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, value } = req.body;
  const itemIndex = dataStore.findIndex(item => item.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Item not found',
    });
  }
  
  if (name) dataStore[itemIndex].name = name;
  if (value !== undefined) dataStore[itemIndex].value = value;
  
  res.json({
    success: true,
    message: 'Item updated successfully',
    data: dataStore[itemIndex],
  });
});

// Delete data
app.delete('/api/data/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const itemIndex = dataStore.findIndex(item => item.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Item not found',
    });
  }
  
  const deletedItem = dataStore.splice(itemIndex, 1)[0];
  
  res.json({
    success: true,
    message: 'Item deleted successfully',
    data: deletedItem,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 App2 - Express API Server');
  console.log('='.repeat(60));
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET    http://localhost:${PORT}/`);
  console.log(`  GET    http://localhost:${PORT}/api/status`);
  console.log(`  GET    http://localhost:${PORT}/api/health`);
  console.log(`  GET    http://localhost:${PORT}/api/data`);
  console.log(`  GET    http://localhost:${PORT}/api/data/:id`);
  console.log(`  POST   http://localhost:${PORT}/api/data`);
  console.log(`  PUT    http://localhost:${PORT}/api/data/:id`);
  console.log(`  DELETE http://localhost:${PORT}/api/data/:id`);
  console.log('='.repeat(60));
});
