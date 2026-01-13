# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AffiliatePremium is a Thai-language affiliate marketing website built with Next.js 16 App Router. It features a public product showcase and a protected admin panel for managing products and categories.

## Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000

# Build & Production
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database (Prisma with SQLite)
npm run db:push      # Push schema changes to database
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio GUI
```

## Architecture

### Route Structure
- **Public routes**: `/`, `/products`, `/products/[id]`, `/categories`, `/about`
- **Admin routes**: `/admin/*` - Protected by JWT middleware, requires ADMIN role

### Authentication Flow
Custom JWT-based auth implemented in `src/lib/auth.ts`:
- Sessions stored as HTTP-only cookies (`admin_session`)
- Middleware at `src/middleware.ts` protects `/admin/*` routes
- Uses `jose` library for JWT operations (edge-compatible)

### Database Models (Prisma)
- **User**: Admin users with bcrypt-hashed passwords and role-based access
- **Product**: Affiliate products with title, price, affiliate URL, click tracking
- **Category**: Product categories with unique slugs

### Key Patterns
- **Prisma client singleton**: `src/lib/prisma.ts` prevents multiple instances in development
- **API routes**: REST endpoints at `src/app/api/` for products, categories, and auth
- **Path alias**: `@/*` maps to `./src/*`

### Styling
- Tailwind CSS with custom design system
- Primary blue accent: `#3b82f6`
- Utility functions in `src/lib/utils.ts` (includes `cn()` for class merging)
- Framer Motion for animations

### Default Admin Credentials (from seed)
- Email: `admin@example.com`
- Password: `admin123`
