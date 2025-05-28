#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the app directory
cd "$SCRIPT_DIR"

# Always install dependencies to ensure they're correct
echo "Checking dependencies..."
npm install

# Start the application
echo "Starting Wardley Maps Application..."
npm start