# App2 - Node.js Express API

A simple Express API server to demonstrate backend development in mono-web-ide.

## Quick Start

```bash
npm install
npm start
```

The API will be available at http://localhost:3001

## What's Included

- Express.js server
- RESTful API endpoints
- CORS enabled for frontend integration
- AI code completion enabled
- Hot reload with nodemon

## Development

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Start production server
npm start

# Run tests
npm test
```

## API Endpoints

- `GET /` - Welcome message
- `GET /api/status` - Server status
- `GET /api/data` - Sample data
- `POST /api/data` - Add new data
- `GET /api/health` - Health check

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

## Project Structure

```
app2/
├── index.js        # Main server file
├── package.json
└── README.md
```

## Features to Try

1. **Hot Reload**: Edit index.js and see the server restart automatically
2. **AI Completion**: Type Express code and get intelligent suggestions
3. **API Integration**: Connect this API to app1 (React app)

## Next Steps

- Add database integration (MongoDB, PostgreSQL)
- Implement authentication
- Add more routes and controllers
- Connect to app1 frontend
- Deploy to production
