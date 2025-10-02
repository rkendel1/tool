const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Middleware
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'devdb',
  user: process.env.POSTGRES_USER || 'devuser',
  password: process.env.POSTGRES_PASSWORD || 'devpass',
});

// In-memory user store (fallback if DB is not available)
const inMemoryUsers = new Map();

// Initialize database
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create default admin user if not exists
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', 'admin@example.com', adminPassword]);
    
    // Create default demo user if not exists
    const demoPassword = await bcrypt.hash('demo123', 10);
    await pool.query(`
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
    `, ['demo', 'demo@example.com', demoPassword]);
    
    console.log('✅ Database initialized successfully');
    console.log('   Default users created:');
    console.log('   - Username: admin, Password: admin123');
    console.log('   - Username: demo, Password: demo123');
  } catch (error) {
    console.error('⚠️  Database initialization failed:', error.message);
    console.log('   Falling back to in-memory storage');
    // Add default users to in-memory store
    const adminPassword = await bcrypt.hash('admin123', 10);
    const demoPassword = await bcrypt.hash('demo123', 10);
    inMemoryUsers.set('admin', {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      password_hash: adminPassword,
    });
    inMemoryUsers.set('demo', {
      id: 2,
      username: 'demo',
      email: 'demo@example.com',
      password_hash: demoPassword,
    });
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.json({ 
      status: 'healthy',
      database: 'disconnected (using in-memory storage)',
      timestamp: new Date().toISOString(),
    });
  }
});

// Welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🔐 Auth Service API',
    version: '1.0.0',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      verify: 'POST /api/auth/verify',
      logout: 'POST /api/auth/logout',
      me: 'GET /api/auth/me',
      health: 'GET /health',
    },
  });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required',
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    try {
      // Try to insert into database
      const result = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
        [username, email, passwordHash]
      );
      
      const user = result.rows[0];
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (dbError) {
      if (dbError.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Username or email already exists',
        });
      }
      
      // Fallback to in-memory storage
      if (inMemoryUsers.has(username)) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists',
        });
      }
      
      const newUser = {
        id: inMemoryUsers.size + 1,
        username,
        email,
        password_hash: passwordHash,
      };
      
      inMemoryUsers.set(username, newUser);
      
      const token = jwt.sign(
        { id: newUser.id, username: newUser.username, email: newUser.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully (in-memory)',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        },
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }
    
    let user = null;
    
    try {
      // Try to fetch from database
      const result = await pool.query(
        'SELECT id, username, email, password_hash FROM users WHERE username = $1',
        [username]
      );
      
      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    } catch (dbError) {
      // Fallback to in-memory storage
      user = inMemoryUsers.get(username);
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Verify token endpoint
app.post('/api/auth/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.body.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({
      success: true,
      message: 'Token is valid',
      user: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
});

// Get current user endpoint (requires token)
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({
      success: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
});

// Logout endpoint (stateless - just a confirmation)
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful (client should discard token)',
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
  });
});

// Start server
async function start() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🔐 Auth Service');
    console.log('='.repeat(60));
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  POST   http://localhost:${PORT}/api/auth/register`);
    console.log(`  POST   http://localhost:${PORT}/api/auth/login`);
    console.log(`  POST   http://localhost:${PORT}/api/auth/verify`);
    console.log(`  GET    http://localhost:${PORT}/api/auth/me`);
    console.log(`  POST   http://localhost:${PORT}/api/auth/logout`);
    console.log(`  GET    http://localhost:${PORT}/health`);
    console.log('='.repeat(60));
  });
}

start();
