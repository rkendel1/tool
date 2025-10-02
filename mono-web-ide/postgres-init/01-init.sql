-- Initialize database for mono-web-ide
-- This script is automatically executed when Postgres container starts for the first time

-- Create users table for auth service
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sample items table for demo purposes
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  value INTEGER DEFAULT 0,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table (optional, for session management)
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(512) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert seed data for items table
INSERT INTO items (name, description, value) VALUES
  ('Sample Item 1', 'This is a sample item from database', 100),
  ('Sample Item 2', 'Another sample item with description', 200),
  ('Sample Item 3', 'Third sample item for testing', 300),
  ('Product A', 'High quality product', 500),
  ('Product B', 'Budget-friendly option', 150),
  ('Service X', 'Premium service package', 1000);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Grant permissions (already handled by POSTGRES_USER in docker-compose)
-- Additional permissions can be added here if needed
