#!/bin/bash

# Script to start all apps in parallel using tmux
# Usage: ./start-all-apps.sh

echo "Starting all apps in separate terminals..."
echo ""

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "tmux is not installed. Please install it first:"
    echo "  sudo apt-get install tmux"
    exit 1
fi

# Create a new tmux session
SESSION_NAME="mono-web-ide-apps"

# Kill existing session if it exists
tmux kill-session -t $SESSION_NAME 2>/dev/null

# Create new session with first window for app1
tmux new-session -d -s $SESSION_NAME -n "app1"
tmux send-keys -t $SESSION_NAME:0 "cd ../app-code/app1" C-m
tmux send-keys -t $SESSION_NAME:0 "npm install" C-m
tmux send-keys -t $SESSION_NAME:0 "npm start" C-m

# Create second window for app2
tmux new-window -t $SESSION_NAME -n "app2"
tmux send-keys -t $SESSION_NAME:1 "cd ../app-code/app2" C-m
tmux send-keys -t $SESSION_NAME:1 "npm install" C-m
tmux send-keys -t $SESSION_NAME:1 "npm run dev" C-m

# Create a third window for general commands
tmux new-window -t $SESSION_NAME -n "terminal"
tmux send-keys -t $SESSION_NAME:2 "cd ../app-code" C-m

echo "All apps started in tmux session: $SESSION_NAME"
echo ""
echo "To attach to the session:"
echo "  tmux attach -t $SESSION_NAME"
echo ""
echo "To switch between windows:"
echo "  Ctrl+b then 0 (app1)"
echo "  Ctrl+b then 1 (app2)"
echo "  Ctrl+b then 2 (terminal)"
echo ""
echo "To detach from session:"
echo "  Ctrl+b then d"
echo ""
echo "To kill session:"
echo "  tmux kill-session -t $SESSION_NAME"
echo ""
