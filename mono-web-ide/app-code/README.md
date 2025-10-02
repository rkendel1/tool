# App Code Directory

This directory contains all your application projects. Each subdirectory is a separate project/app.

## Structure

```
app-code/
├── app1/          # Example React application
├── app2/          # Example Node.js Express application
└── README.md      # This file
```

## Example Apps

### App1 - React Application

A simple React application demonstrating front-end development.

**Quick Start:**
```bash
cd app1
npm install
npm start
```

Access at: http://localhost:3000

### App2 - Node.js Express API

A simple Express API server demonstrating back-end development.

**Quick Start:**
```bash
cd app2
npm install
npm start
```

Access at: http://localhost:3001

## Creating New Apps

### React App

```bash
cd /home/coder/project/app-code
npx create-react-app my-new-app
cd my-new-app
npm start
```

### Next.js App

```bash
cd /home/coder/project/app-code
npx create-next-app@latest my-next-app
cd my-next-app
npm run dev
```

### Node.js Express App

```bash
cd /home/coder/project/app-code
mkdir my-express-app
cd my-express-app
npm init -y
npm install express
```

Create `index.js`:
```javascript
const express = require('express');
const app = express();
const port = 3002;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
```

Run:
```bash
node index.js
```

### Vue.js App

```bash
cd /home/coder/project/app-code
npm create vue@latest my-vue-app
cd my-vue-app
npm install
npm run dev
```

## Running Multiple Apps Simultaneously

Each app can run on a different port:

**Terminal 1:**
```bash
cd app1
npm start  # Port 3000
```

**Terminal 2:**
```bash
cd app2
npm start  # Port 3001
```

**Terminal 3:**
```bash
cd app3
npm run dev -- --port 3002  # Port 3002
```

## Available Ports

The following ports are exposed and available for your apps:
- 3000
- 3001
- 3002
- 3003
- 3004
- 3005

## Git Integration

### Initialize Git Repository

```bash
cd /home/coder/project/app-code
git init
git add .
git commit -m "Initial commit"
```

### Connect to GitHub

```bash
git remote add origin https://github.com/username/repo.git
git branch -M main
git push -u origin main
```

### Best Practices

- Create a `.gitignore` file:
```
node_modules/
.env
.DS_Store
dist/
build/
*.log
```

- Keep each app in its own subdirectory
- Use meaningful commit messages
- Commit frequently

## Development Tips

### Installing Dependencies

```bash
# Install a package
npm install package-name

# Install as dev dependency
npm install --save-dev package-name

# Install globally
npm install -g package-name
```

### Environment Variables

Create a `.env` file in your app directory:

```env
REACT_APP_API_URL=http://localhost:5000
NODE_ENV=development
```

**Important:** Never commit `.env` files with secrets to git!

### Debugging

- Use Chrome DevTools for front-end apps
- Use `console.log()` or Node.js debugger for back-end
- VS Code has built-in debugging support

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Building for Production

```bash
# Build React/Vue apps
npm run build

# Start production Node.js server
NODE_ENV=production node index.js
```

## Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm start
# or
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

## Persistent Data

All files in this directory are persisted on your host machine at:
```
mono-web-ide/app-code/
```

This means:
- ✅ Your code survives container restarts
- ✅ You can edit files from outside the container
- ✅ Easy to backup (just copy the directory)
- ✅ Can be version controlled with git

## Troubleshooting

### Port Already in Use

If you see "Port 3000 is already in use":

```bash
# Kill the process using the port
lsof -i :3000
kill -9 <PID>

# Or use a different port
npm start -- --port 3002
```

### Node Modules Issues

```bash
# Remove and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Permission Issues

```bash
# Fix permissions
sudo chown -R coder:coder /home/coder/project/app-code
```

## AI Code Completion

The AI code completion extension works across all your apps. Just start typing and you'll get intelligent suggestions based on:

- Current file context
- Programming language
- Common patterns
- Your coding style

Press `Tab` to accept suggestions, `Esc` to dismiss.

## Additional Resources

- [React Documentation](https://reactjs.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express Documentation](https://expressjs.com/)
- [Vue.js Documentation](https://vuejs.org/)
- [Node.js Documentation](https://nodejs.org/docs)
- [npm Documentation](https://docs.npmjs.com/)
