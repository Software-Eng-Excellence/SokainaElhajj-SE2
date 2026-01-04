#!/bin/bash

# Print a message indicating the app is starting on pm2
echo "🚀 Starting the app on pm2"

# Navigate into the app directory
cd ~/SE2 || exit

# Start the app using pm2 with the production environment
pm2 start ecosystem.config.js --env production

# Save the pm2 process list
pm2 save

# Print the pm2 status
echo "📊 PM2 status:"
pm2 status