# Scripts Directory

Helper scripts for the mono-web-ide environment.

## Available Scripts

### test-dyad-integration.sh

Tests the Dyad integration and Docker environment.

**Usage:**
```bash
./test-dyad-integration.sh
```

**What it tests:**
- Code Server health
- Dyad test server health
- Completion endpoint functionality
- Docker service status
- Volume persistence

**Requirements:**
- Docker Compose must be running
- Services must be healthy

### start-app1.sh

Starts the React app (app1) development server.

**Usage:**
```bash
./start-app1.sh
```

**What it does:**
- Navigates to app-code/app1
- Installs dependencies if needed
- Starts the development server on port 3000

### start-app2.sh

Starts the Express API (app2) development server.

**Usage:**
```bash
./start-app2.sh
```

**What it does:**
- Navigates to app-code/app2
- Installs dependencies if needed
- Starts the development server on port 3001

### start-all-apps.sh

Starts all apps in separate tmux windows.

**Usage:**
```bash
./start-all-apps.sh
```

**What it does:**
- Creates a tmux session named "mono-web-ide-apps"
- Starts app1 in window 0
- Starts app2 in window 1
- Provides a terminal window for general commands

**Tmux Commands:**
```bash
# Attach to session
tmux attach -t mono-web-ide-apps

# Switch windows
Ctrl+b then 0  # app1
Ctrl+b then 1  # app2
Ctrl+b then 2  # terminal

# Detach from session
Ctrl+b then d

# Kill session
tmux kill-session -t mono-web-ide-apps
```

## Running Scripts

All scripts are executable. Run them from the scripts directory:

```bash
cd mono-web-ide/scripts
./script-name.sh
```

Or from anywhere:

```bash
./mono-web-ide/scripts/script-name.sh
```

## Creating Custom Scripts

Add your own helper scripts to this directory:

```bash
#!/bin/bash
# Your custom script
echo "Hello from custom script"
```

Make it executable:
```bash
chmod +x your-script.sh
```

## Tips

- Run scripts from within Code Server terminal for best results
- Scripts assume you're in the scripts directory or adjust paths accordingly
- For background processes, consider using tmux or screen
- Check script exit codes: `echo $?` after running

## Troubleshooting

### Permission Denied

```bash
chmod +x script-name.sh
```

### Script Not Found

Make sure you're in the correct directory:
```bash
cd /home/coder/project/mono-web-ide/scripts
```

### Tmux Not Available

Install tmux in the Code Server container:
```bash
sudo apt-get update && sudo apt-get install -y tmux
```

Or run apps manually in separate terminal tabs.
