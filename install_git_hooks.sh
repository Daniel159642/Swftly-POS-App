#!/bin/bash
# Install git hooks so SQL files run automatically after git pull

echo "Installing git hooks for automatic database updates..."
echo ""

# Copy post-merge hook
if [ -f ".git/hooks/post-merge" ]; then
    echo "⚠️  post-merge hook already exists. Backing up..."
    cp .git/hooks/post-merge .git/hooks/post-merge.backup
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy our post-merge hook
cp .git/hooks/post-merge .git/hooks/post-merge.installed 2>/dev/null || true

# Make it executable
chmod +x .git/hooks/post-merge

echo "✓ Git hooks installed!"
echo ""
echo "Now when you run 'git pull', SQL files will automatically run to update the database."
echo ""
