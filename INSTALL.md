# Quick Installation Guide

## For End Users

### Option 1: Clone and Install (Recommended)

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/bobooooo/asciiflow-mcp.git
cd asciiflow-mcp

# Install dependencies
npm install

# Install globally
npm install -g .
```

### Option 2: Use with npx

```bash
npx -y github:bobooooo/asciiflow-mcp
```

## For Developers

### First Time Setup

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/bobooooo/asciiflow-mcp.git
cd asciiflow-mcp

# Install dependencies
npm install

# Build
npm run build

# Link for local testing
npm link
```

### If You Already Cloned Without Submodules

```bash
cd asciiflow-mcp
git submodule update --init --recursive
npm install
npm run build
```

### Development Workflow

```bash
# Make changes to src/
# Rebuild
npm run build

# Test
npm test

# Test the MCP server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | asciiflow-mcp
```

## Troubleshooting

### Submodule Not Initialized

If you see build errors about missing files:

```bash
git submodule update --init --recursive
```

### Permission Issues

If you get EACCES errors:

```bash
sudo chown -R $(id -u):$(id -g) ~/.npm
npm cache clean --force
```

### Command Not Found

After global install, if `asciiflow-mcp` is not found:

```bash
# Check if it's installed
npm list -g asciiflow-mcp

# Reinstall
npm install -g .
```
