#!/usr/bin/env bash

# This script runs after npm install on EAS Build servers
# It converts old Android Support libraries to AndroidX

set -e

echo "🔧 Running jetifier to convert Android Support libraries to AndroidX..."
npx jetifier
echo "✅ Jetifier completed successfully"
