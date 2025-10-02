require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'devdb',
  user: process.env.POSTGRES_USER || 'devuser',
  password: process.env.POSTGRES_PASSWORD || 'devpass',
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('⚠️  Database connection error:', err.message);
    console.log('   Falling back to in-memory storage');
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// In-memory data store (fallback when database is not available)
let dataStore = [
  { id: 1, name: 'Sample Item 1', value: 100 },
  { id: 2, name: 'Sample Item 2', value: 200 },
  { id: 3, name: 'Sample Item 3', value: 300 },
];

// Auth middleware (optional)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continue without auth (optional auth)
  }

  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:4000';
    const response = await axios.post(`${authServiceUrl}/api/auth/verify`, { token });
    req.user = response.data.user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// Routes

// Welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Welcome to App2 - Express API with Database Integration',
    version: '2.0.0',
    features: ['PostgreSQL Integration', 'Auth Service Integration', 'CRUD Operations'],
    endpoints: {
      status: '/api/status',
      data: '/api/data',
      dataFromDb: '/api/data/db',
      items: '/api/items (database)',
      health: '/api/health',
      auth: '/api/auth/test',
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
    database: pool.totalCount > 0 ? 'connected' : 'disconnected',
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbHealth = 'unknown';
  try {
    await pool.query('SELECT 1');
    dbHealth = 'healthy';
  } catch (error) {
    dbHealth = 'unhealthy';
  }

  res.json({
    status: 'healthy',
    message: 'Server is running smoothly',
    database: dbHealth,
  });
});

// Get all data (in-memory)
app.get('/api/data', (req, res) => {
  res.json({
    success: true,
    source: 'in-memory',
    count: dataStore.length,
    data: dataStore,
  });
});

// Get all items from database
app.get('/api/items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY id');
    res.json({
      success: true,
      source: 'database',
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database query failed',
      error: error.message,
      fallback: 'Use /api/data for in-memory data',
    });
  }
});

// Get single item from database
app.get('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    res.json({
      success: true,
      source: 'database',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database query failed',
      error: error.message,
    });
  }
});

// Add new item to database
app.post('/api/items', async (req, res) => {
  try {
    const { name, description, value } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    const result = await pool.query(
      'INSERT INTO items (name, description, value) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, value || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      source: 'database',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database insert failed',
      error: error.message,
    });
  }
});

// Update item in database
app.put('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, value } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (value !== undefined) {
      updates.push(`value = $${paramCount++}`);
      values.push(value);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE items SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    res.json({
      success: true,
      message: 'Item updated successfully',
      source: 'database',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database update failed',
      error: error.message,
    });
  }
});

// Delete item from database
app.delete('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    res.json({
      success: true,
      message: 'Item deleted successfully',
      source: 'database',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database delete failed',
      error: error.message,
    });
  }
});

// Test auth service integration
app.get('/api/auth/test', authenticateToken, (req, res) => {
  if (req.user) {
    res.json({
      success: true,
      message: 'Authentication successful',
      user: req.user,
    });
  } else {
    res.json({
      success: true,
      message: 'No authentication provided (authentication is optional)',
      hint: 'Send Authorization: Bearer <token> header to authenticate',
    });
  }
});

// Get all data (in-memory) - legacy endpoints
app.get('/api/data', (req, res) => {
  res.json({
    success: true,
    source: 'in-memory',
    count: dataStore.length,
    data: dataStore,
  });
});

// Get single item (in-memory)
app.get('/api/data/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const item = dataStore.find(item => item.id === id);
  
  if (item) {
    res.json({
      success: true,
      source: 'in-memory',
      data: item,
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Item not found',
    });
  }
});

// Add new data (in-memory)
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
    source: 'in-memory',
    data: newItem,
  });
});

// Update data (in-memory)
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
    source: 'in-memory',
    data: dataStore[itemIndex],
  });
});

// Delete data (in-memory)
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
    source: 'in-memory',
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
  console.log('🚀 App2 - Express API Server with Database Integration');
  console.log('='.repeat(60));
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET    http://localhost:${PORT}/`);
  console.log(`  GET    http://localhost:${PORT}/api/status`);
  console.log(`  GET    http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('In-Memory Data Endpoints:');
  console.log(`  GET    http://localhost:${PORT}/api/data`);
  console.log(`  GET    http://localhost:${PORT}/api/data/:id`);
  console.log(`  POST   http://localhost:${PORT}/api/data`);
  console.log(`  PUT    http://localhost:${PORT}/api/data/:id`);
  console.log(`  DELETE http://localhost:${PORT}/api/data/:id`);
  console.log('');
  console.log('Database Endpoints (requires PostgreSQL):');
  console.log(`  GET    http://localhost:${PORT}/api/items`);
  console.log(`  GET    http://localhost:${PORT}/api/items/:id`);
  console.log(`  POST   http://localhost:${PORT}/api/items`);
  console.log(`  PUT    http://localhost:${PORT}/api/items/:id`);
  console.log(`  DELETE http://localhost:${PORT}/api/items/:id`);
  console.log('');
  console.log('Auth Test Endpoint:');
  console.log(`  GET    http://localhost:${PORT}/api/auth/test`);
  console.log('='.repeat(60));
});
