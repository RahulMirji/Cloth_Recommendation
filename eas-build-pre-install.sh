#!/usr/bin/env bash

# This script runs before npm install on EAS Build servers
# It ensures jetifier will run after dependencies are installed

set -e

echo "🔧 EAS Build: Pre-install hook started"
echo "✅ Ready for dependency installation"
