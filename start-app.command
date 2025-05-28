#!/bin/bash

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Starting Wardley Maps Standalone..."
echo "Directory: $DIR"

# Change to app directory
cd "$DIR"

# Check if node_modules exists and has content
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "Installing dependencies (this will take a few minutes on first run)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error installing dependencies. Please check your internet connection."
        read -p "Press any key to exit..."
        exit 1
    fi
fi

# Check if react-scripts is installed
if [ ! -f "node_modules/.bin/react-scripts" ]; then
    echo "react-scripts not found. Installing dependencies..."
    rm -rf node_modules package-lock.json
    npm install
    if [ $? -ne 0 ]; then
        echo "Error installing dependencies."
        read -p "Press any key to exit..."
        exit 1
    fi
fi

# Start the application
echo "Starting application..."
npm start

# Keep window open if error
if [ $? -ne 0 ]; then
    read -p "Press any key to exit..."
fi