#!/bin/bash

# Test the application is using port 3000
if nc -zv localhost 3000 2>/dev/null; then
    echo "✅ Port 3000 is open and the application is running."
else
    echo "❌ Port 3000 is not open. The application might not be running."
    exit 1
fi

# Test the /health/status it is returning 200
status_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health/status)
if [ "$status_code" -eq 200 ]; then
    echo "✅ /health/status is returning 200."
else
    echo "❌ /health/status is not returning 200. Status code: $status_code"
    exit 1
fi

# Test the /health/db it is returning 200
db_status_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health/db)
if [ "$db_status_code" -eq 200 ]; then
    echo "✅ /health/db is returning 200."
else
    echo "❌ /health/db is not returning 200. Status code: $db_status_code"
    exit 1
fi