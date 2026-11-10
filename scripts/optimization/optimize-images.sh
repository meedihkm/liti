#!/bin/bash

# Image optimization script for production build
# Requires: sharp-cli (npm install -g sharp-cli)

echo "🖼️  Optimizing images..."

# Optimize product images
if command -v sharp &> /dev/null; then
  echo "Optimizing public/images/products..."
  find public/images/products -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -exec sharp {} -o {}.webp --webp \;
  
  echo "Optimizing public/images/fabrics..."
  find public/images/fabrics -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -exec sharp {} -o {}.webp --webp \;
  
  echo "✅ Images optimized!"
else
  echo "⚠️  sharp-cli not found. Skipping image optimization."
  echo "   Install with: npm install -g sharp-cli"
fi
