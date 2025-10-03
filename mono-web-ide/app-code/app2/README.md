# App2 - Node.js Express API

A full-featured Express API server with PostgreSQL database integration and authentication support.

## Quick Start

```bash
npm install
npm start
```

The API will be available at http://localhost:3001

## What's Included

- Express.js server
- PostgreSQL database integration
- Auth service integration
- RESTful API endpoints (both in-memory and database)
- CORS enabled for frontend integration
- AI code completion enabled
- Hot reload with nodemon
- Environment variable support

## Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server (with hot reload)
npm run dev

# Start production server
npm start

# Run tests
npm test
```

## Two Versions Available

### 1. Standard Version (index.js)
Simple in-memory data storage - works without database.

### 2. Enhanced Version with Database (index-with-db.js)
Full database and auth integration. To use:

```bash
# Rename or copy the enhanced version
mv index.js index-simple.js
mv index-with-db.js index.js

# Or just run it directly
node index-with-db.js
```

## API Endpoints

### General Endpoints
- `GET /` - Welcome message with API documentation
- `GET /api/status` - Server status and database connection info
- `GET /api/health` - Health check endpoint

### In-Memory Data Endpoints (Standard Version)
- `GET /api/data` - Get all data (in-memory)
- `GET /api/data/:id` - Get single item
- `POST /api/data` - Add new data
- `PUT /api/data/:id` - Update data
- `DELETE /api/data/:id` - Delete data

### Database Endpoints (Enhanced Version)
- `GET /api/items` - Get all items from database
- `GET /api/items/:id` - Get single item from database
- `POST /api/items` - Add new item to database
- `PUT /api/items/:id` - Update item in database
- `DELETE /api/items/:id` - Delete item from database

### Auth Test Endpoint
- `GET /api/auth/test` - Test authentication (optional auth header)

## Database Integration

The enhanced version connects to PostgreSQL automatically:

```javascript
// Database configuration (from .env)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=devdb
POSTGRES_USER=devuser
POSTGRES_PASSWORD=devpass
```

### Sample Database Operations

```bash
# Get all items from database
curl http://localhost:3001/api/items

# Add new item to database
curl -X POST http://localhost:3001/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"New Product","description":"A great product","value":500}'

# Update item
curl -X PUT http://localhost:3001/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","value":750}'

# Delete item
curl -X DELETE http://localhost:3001/api/items/1
```

## Authentication Integration

The API integrates with the auth service for optional authentication:

```bash
# First, login to get a token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# Use the token in requests
curl http://localhost:3001/api/auth/test \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Testing the API

### Using curl

```bash
# Get status
curl http://localhost:3001/api/status

# Get data
curl http://localhost:3001/api/data

# Post data
curl -X POST http://localhost:3001/api/data \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","value":123}'
```

### Using Browser

Open http://localhost:3001 in your browser to see the welcome message.

## Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
PORT=3001
NODE_ENV=development
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=devdb
POSTGRES_USER=devuser
POSTGRES_PASSWORD=devpass
AUTH_SERVICE_URL=http://auth-service:4000
```

## Project Structure

```
app2/
├── index.js              # Simple version (in-memory)
├── index-with-db.js      # Enhanced version (database + auth)
├── package.json
├── .env.example          # Environment variables template
└── README.md
```

## Features to Try

1. **Hot Reload**: Edit index.js and see the server restart automatically
2. **AI Completion**: Type Express code and get intelligent suggestions
3. **Database Operations**: Test CRUD operations with PostgreSQL
4. **Auth Integration**: Test authentication with JWT tokens
5. **API Integration**: Connect this API to app1 (React app)

## Connecting to Database

When running inside the Docker environment, the database is automatically available at `postgres:5432`. You can also access it using pgAdmin at http://localhost:5050.

### Default Credentials
- Username: admin@example.com
- Password: admin

## Next Steps

- Implement user-specific data (with user_id foreign key)
- Add input validation and sanitization
- Implement rate limiting
- Add API documentation with Swagger
- Create automated tests
- Deploy to production
