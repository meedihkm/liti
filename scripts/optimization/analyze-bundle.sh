#!/bin/bash

# Bundle analysis script
# Requires: @next/bundle-analyzer

echo "📦 Analyzing bundle size..."

ANALYZE=true npm run build

echo "✅ Bundle analysis complete!"
echo "   Check .next/analyze/ for results"
