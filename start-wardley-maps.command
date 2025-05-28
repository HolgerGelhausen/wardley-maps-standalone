#!/bin/bash

# Navigate to the wardley maps directory
cd "$(dirname "$0")"

# Start the application
echo "Starting Wardley Maps Application..."
npm start

# Keep terminal open if there's an error
read -p "Press any key to close..."