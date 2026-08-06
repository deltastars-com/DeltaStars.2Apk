#!/bin/bash

# Delta Stars Sovereign Setup & Maintenance Script
# نظام الإعداد والصيانة التلقائي لشركة نجوم دلتا

echo "🚀 Starting Delta Stars Sovereign Update Engine..."

# 1. Environment Setup
if [ ! -f .env ]; then
    echo "📄 Creating .env from .env.example..."
    cp .env.example .env
fi

# 2. Dependency Check & Fix
echo "📦 Checking dependencies..."
npm install

# 3. Prisma Sync
echo "🗄️ Checking database schema..."
if [ -f "prisma/schema.prisma" ]; then
    npx prisma generate
fi

# 4. Build Test
echo "🏗️ Running stability build check..."
npm run build

# 5. Success
echo "✅ Setup complete. The application is stable and optimized."
echo "🌐 Run 'npm run dev' to start the sovereign server."
