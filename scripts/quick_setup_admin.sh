#!/bin/bash

# Run from repo root so .env, .git, sql/, and python module imports resolve
cd "$(dirname "$0")/.." || exit 1
# Quick setup script for admin PIN

echo "🔧 Admin PIN Setup"
echo "=================="
echo ""
echo "Step 1: Get your Clerk User ID"
echo "  1. Go to http://localhost:3000 and sign in with Clerk"
echo "  2. Open browser console (F12 or Cmd+Option+I)"
echo "  3. Type: window.Clerk?.user?.id"
echo "  4. Copy the ID (starts with 'user_')"
echo ""
read -p "Enter your Clerk User ID: " CLERK_ID

if [ -z "$CLERK_ID" ]; then
    echo "❌ Clerk User ID is required"
    exit 1
fi

echo ""
read -p "Enter a 6-digit PIN (or press Enter to auto-generate): " PIN

if [ -z "$PIN" ]; then
    echo "Generating PIN..."
    python3 -m scripts.setup_admin_pin "$CLERK_ID"
else
    if [[ ! "$PIN" =~ ^[0-9]{6}$ ]]; then
        echo "❌ Error: PIN must be exactly 6 digits"
        exit 1
    fi
    python3 -m scripts.setup_admin_pin "$CLERK_ID" "$PIN"
fi

echo ""
echo "✅ Setup complete! You can now login with your PIN."
