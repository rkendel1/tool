# Code Server Extensions

This directory contains VS Code extensions that are bundled with code-server for enhanced functionality.

## Available Extensions

### AI Code Completion (`ai-completion/`)

An AI-powered code completion extension with support for multiple backend services including Dyad models and custom AI services.

**Features:**
- Universal completion provider for all file types
- Configurable backend API (local Dyad, remote Dyad cloud, or custom AI)
- Real-time code suggestions
- Comprehensive error handling
- Dyad integration hooks for collaborative features

**Quick Start:**
```bash
cd extensions/ai-completion
npm install
npm run build
```

See [ai-completion/README.md](ai-completion/README.md) for full documentation.

See [ai-completion/INSTALLATION.md](ai-completion/INSTALLATION.md) for installation instructions.

## Extension Development

### Adding a New Extension

1. Create a new directory under `extensions/`
2. Initialize with `package.json` and VS Code extension structure
3. Follow VS Code extension guidelines
4. Ensure TypeScript compilation outputs to the same directory
5. Document installation and usage

### Building All Extensions

```bash
for ext in extensions/*/; do
  if [ -f "$ext/package.json" ]; then
    echo "Building $ext..."
    (cd "$ext" && npm install && npm run build)
  fi
done
```

### Extension Structure

Each extension should follow this structure:

```
extension-name/
├── package.json          # Extension manifest
├── tsconfig.json         # TypeScript configuration
├── extension.ts          # Main extension code
├── extension.js          # Compiled output (committed)
├── README.md             # User documentation
├── INSTALLATION.md       # Installation guide (optional)
├── .gitignore           # Ignore node_modules, etc.
└── .vscodeignore        # Files to exclude from packaging
```

## Installation

Extensions can be installed using:

```bash
# Using code-server CLI
code-server --install-extension extensions/extension-name

# Or symlink for development
ln -s "$(pwd)/extensions/extension-name" ~/.local/share/code-server/extensions/
```

## Contributing

When contributing extensions:

1. Ensure the extension is self-contained
2. Include comprehensive documentation
3. Add error handling for all network operations
4. Follow VS Code extension best practices
5. Test with code-server (not just desktop VS Code)
6. Include example configurations

## Why Bundle Extensions?

Extensions are bundled in the repository to:

1. **Version Control**: Keep extensions synchronized with code-server versions
2. **Deployment**: Simplify deployment with everything in one place
3. **Customization**: Maintain custom extensions specific to this deployment
4. **Collaboration**: Share extensions across the team
5. **Integration**: Deep integration with code-server features

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
