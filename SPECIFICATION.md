# Product Specification Document

## AffiliatePremium - Affiliate Marketing Platform

**Version:** 1.1.0
**Last Updated:** December 25, 2025
**Status:** Production Ready

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Database Schema](#3-database-schema)
4. [API Reference](#4-api-reference)
5. [Authentication System](#5-authentication-system)
6. [Frontend Pages](#6-frontend-pages)
7. [Admin Dashboard](#7-admin-dashboard)
8. [Component Library](#8-component-library)
9. [Configuration](#9-configuration)
10. [Deployment Guide](#10-deployment-guide)
11. [Security Considerations](#11-security-considerations)

---

## 1. Project Overview

### 1.1 Description

AffiliatePremium is a high-performance, SEO-optimized affiliate marketing website designed to showcase curated product recommendations with a premium user experience and an intuitive admin management system.

### 1.2 Key Features

| Feature | Description |
|---------|-------------|
| Product Catalog | Browse and search curated products with category filtering |
| Click Tracking | Track affiliate link clicks for analytics |
| Admin Dashboard | Full CRUD operations for products and categories |
| Authentication | Secure JWT-based admin authentication |
| Responsive Design | Mobile-first design with Tailwind CSS |
| SEO Optimized | Server-side rendering with metadata |

### 1.3 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.1.1 |
| Language | TypeScript | 5.x |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | 4.x |
| Database | SQLite (dev) / PostgreSQL (prod) | - |
| ORM | Prisma | 6.19.1 |
| Authentication | Custom JWT (jose + bcryptjs) | - |
| Icons | Lucide React | 0.562.0 |
| Animation | Framer Motion | 12.23.26 |

---

## 2. Technical Architecture

### 2.1 Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin dashboard pages
│   │   ├── categories/           # Category management
│   │   ├── login/                # Admin login
│   │   ├── products/             # Product management
│   │   ├── layout.tsx            # Admin layout with sidebar
│   │   └── page.tsx              # Dashboard home
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   └── session/
│   │   ├── categories/           # Category CRUD
│   │   │   ├── [id]/
│   │   │   └── route.ts
│   │   └── products/             # Product CRUD
│   │       ├── [id]/
│   │       │   ├── click/        # Click tracking
│   │       │   └── route.ts
│   │       └── route.ts
│   ├── categories/               # Public categories page
│   ├── products/                 # Public products pages
│   │   ├── [id]/                 # Individual product
│   │   └── page.tsx              # Product listing
│   ├── about/                    # About page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── not-found.tsx             # 404 page
│   └── page.tsx                  # Home page
├── components/                   # Reusable components
│   ├── BuyButton.tsx
│   ├── Navbar.tsx
│   ├── ProductCard.tsx
│   └── ProductFilters.tsx
├── lib/                          # Utilities
│   ├── auth.ts                   # Authentication utilities
│   ├── prisma.ts                 # Prisma client
│   └── utils.ts                  # Helper functions
└── middleware.ts                 # Route protection

prisma/
├── schema.prisma                 # Database schema
├── seed.ts                       # Seed data script
└── dev.db                        # SQLite database (dev)
```

### 2.2 Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js    │────▶│   Prisma    │
│   Client    │◀────│  Server     │◀────│   + SQLite  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       └───────────▶│ Middleware  │
                    │ (Auth Check)│
                    └─────────────┘
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │       │   Product    │       │   Category   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ email        │       │ title        │◀──────│ name         │
│ password     │       │ description  │       │ slug         │
│ role         │       │ price        │       │ products[]   │
│ createdAt    │       │ affiliateUrl │       └──────────────┘
└──────────────┘       │ imageUrl     │
                       │ mediaType    │
                       │ categoryId(FK)│
                       │ clicks       │
                       │ featured     │
                       │ createdAt    │
                       │ updatedAt    │
                       └──────────────┘
```

### 3.2 Model Definitions

#### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String                        // bcrypt hashed
  role      Role     @default(USER)
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
}
```

#### Product Model
```prisma
model Product {
  id           String    @id @default(cuid())
  title        String
  description  String
  price        Float
  affiliateUrl String
  imageUrl     String
  mediaType    MediaType @default(IMAGE)
  category     Category  @relation(fields: [categoryId], references: [id])
  categoryId   String
  clicks       Int       @default(0)
  featured     Boolean   @default(false)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

enum MediaType {
  IMAGE
  VIDEO
}
```

#### Category Model
```prisma
model Category {
  id       String    @id @default(cuid())
  name     String    @unique
  slug     String    @unique
  products Product[]
}
```

---

## 4. API Reference

### 4.1 Authentication Endpoints

#### POST /api/auth/login
Authenticate admin user and create session.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

**Response (401):**
```json
{
  "error": "Invalid email or password",
  "remainingAttempts": 4
}
```

**Response (429):**
```json
{
  "error": "Too many login attempts. Please try again later.",
  "lockoutEnds": "2025-12-24T12:30:00.000Z"
}
```

#### POST /api/auth/logout
Destroy current session.

**Response (200):**
```json
{
  "success": true
}
```

#### GET /api/auth/session
Check current authentication status.

**Response (200):**
```json
{
  "authenticated": true,
  "user": {
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

**Response (401):**
```json
{
  "authenticated": false
}
```

---

### 4.2 Product Endpoints

#### GET /api/products
Retrieve all products with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category slug |
| search | string | Search in title/description |
| featured | boolean | Filter featured products |

**Response (200):**
```json
[
  {
    "id": "clx123...",
    "title": "Premium Wireless Headphones",
    "description": "Experience crystal-clear audio...",
    "price": 299.00,
    "affiliateUrl": "https://example.com/headphones",
    "imageUrl": "https://images.unsplash.com/...",
    "mediaType": "IMAGE",
    "categoryId": "clx456...",
    "category": {
      "id": "clx456...",
      "name": "Electronics",
      "slug": "electronics"
    },
    "clicks": 42,
    "featured": true,
    "createdAt": "2025-12-24T10:00:00.000Z",
    "updatedAt": "2025-12-24T10:00:00.000Z"
  }
]
```

#### POST /api/products
Create a new product.

**Request:**
```json
{
  "title": "New Product",
  "description": "Product description",
  "price": 99.99,
  "affiliateUrl": "https://example.com/product",
  "imageUrl": "https://images.unsplash.com/...",
  "mediaType": "IMAGE",
  "categoryId": "clx456...",
  "featured": false
}
```

**Note:** `mediaType` accepts `"IMAGE"` (default) or `"VIDEO"`. When set to `VIDEO`, the `imageUrl` should contain a video URL.

**Response (201):**
```json
{
  "id": "clx789...",
  "title": "New Product",
  ...
}
```

#### GET /api/products/[id]
Retrieve a single product by ID.

#### PUT /api/products/[id]
Update a product.

#### DELETE /api/products/[id]
Delete a product.

#### POST /api/products/[id]/click
Track a click on product's affiliate link.

**Response (200):**
```json
{
  "success": true,
  "affiliateUrl": "https://example.com/product",
  "clicks": 43
}
```

---

### 4.3 Category Endpoints

#### GET /api/categories
Retrieve all categories with product counts.

**Response (200):**
```json
[
  {
    "id": "clx456...",
    "name": "Electronics",
    "slug": "electronics",
    "_count": {
      "products": 3
    }
  }
]
```

#### POST /api/categories
Create a new category.

**Request:**
```json
{
  "name": "New Category"
}
```

**Response (201):**
```json
{
  "id": "clx789...",
  "name": "New Category",
  "slug": "new-category"
}
```

#### GET /api/categories/[id]
Retrieve a single category with its products.

#### PUT /api/categories/[id]
Update a category.

#### DELETE /api/categories/[id]
Delete a category (only if empty).

**Response (400):**
```json
{
  "error": "Cannot delete category with products. Remove products first."
}
```

---

## 5. Authentication System

### 5.1 Overview

The authentication system uses JWT tokens stored in HttpOnly cookies for secure session management.

### 5.2 Security Features

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcryptjs with 12 salt rounds |
| Token Algorithm | HS256 (HMAC-SHA256) |
| Token Library | jose (Edge-compatible) |
| Cookie Security | HttpOnly, Secure (prod), SameSite=Lax |
| Session Duration | 7 days |
| Rate Limiting | 5 attempts, 15-min lockout |

### 5.3 Authentication Flow

```
┌─────────┐      POST /api/auth/login      ┌─────────┐
│  User   │ ──────────────────────────────▶│  Server │
│         │        {email, password}       │         │
└─────────┘                                └────┬────┘
                                                │
                                                ▼
                                    ┌───────────────────┐
                                    │ 1. Find user      │
                                    │ 2. Verify password│
                                    │ 3. Check role     │
                                    │ 4. Create JWT     │
                                    │ 5. Set cookie     │
                                    └───────────────────┘
                                                │
┌─────────┐      Set-Cookie: admin_session     │
│  User   │ ◀──────────────────────────────────┘
│         │        {success: true}
└─────────┘

Subsequent Requests:
┌─────────┐     Cookie: admin_session      ┌─────────┐
│  User   │ ──────────────────────────────▶│Middleware│
│         │                                │         │
└─────────┘                                └────┬────┘
                                                │
                                    ┌───────────────────┐
                                    │ Verify JWT token  │
                                    │ Check expiration  │
                                    │ Validate role     │
                                    └───────────────────┘
                                                │
                                    ┌───────────────────┐
                                    │ ✓ Allow access    │
                                    │ ✗ Redirect login  │
                                    └───────────────────┘
```

### 5.4 Protected Routes

| Route Pattern | Access |
|---------------|--------|
| `/admin/*` (except login) | Requires ADMIN role |
| `/admin/login` | Public (redirects if authenticated) |
| `/api/auth/*` | Public |
| All other routes | Public |

---

## 6. Frontend Pages

### 6.1 Public Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `page.tsx` | Home page with hero, features, featured products |
| `/products` | `products/page.tsx` | Product listing with search/filters |
| `/products/[id]` | `products/[id]/page.tsx` | Individual product detail |
| `/categories` | `categories/page.tsx` | Browse all categories |
| `/about` | `about/page.tsx` | About page with review methodology |

### 6.2 Page Features

#### Home Page (`/`)
- Hero section with gradient background
- Trust badge ("Trusted by 10,000+ shoppers")
- Features grid (Verified Quality, Best Deals, Easy Shopping)
- Featured products from database
- Call-to-action buttons

#### Products Page (`/products`)
- Sidebar with category filters
- Search functionality
- Product count display
- Responsive grid layout
- Real-time filtering via URL params

#### Product Detail (`/products/[id]`)
- Large product image or video (based on mediaType)
- Video playback with autoplay, loop, and controls for VIDEO type
- Category breadcrumb
- Price display
- Buy Now button with click tracking
- Trust badges (Verified, Shipping, Returns)
- FAQ section with semantic markup for GEO optimization
- JSON-LD structured data for SEO
- Related products section

---

## 7. Admin Dashboard

### 7.1 Admin Pages

| Route | Description |
|-------|-------------|
| `/admin/login` | Login page with rate limiting |
| `/admin` | Dashboard with statistics |
| `/admin/products` | Product CRUD management |
| `/admin/categories` | Category CRUD management |

### 7.2 Dashboard Statistics

- Total products count
- Total categories count
- Total affiliate clicks
- Top 5 performing products

### 7.3 Product Management

| Action | Method | Description |
|--------|--------|-------------|
| List | GET | Table view with all products |
| Create | Modal | Form with all fields |
| Edit | Modal | Pre-filled form |
| Delete | Confirm | With confirmation dialog |

**Product Form Fields:**
- Title (required)
- Description (textarea, required)
- Price (number, required)
- Category (select, required)
- Media Type (select: IMAGE/VIDEO, default: IMAGE)
- Image/Video URL (url, required)
- Affiliate URL (url, required)
- Featured (checkbox)

### 7.4 Category Management

| Action | Method | Description |
|--------|--------|-------------|
| List | Grid | Cards with product counts |
| Create | Modal | Name input only |
| Edit | Modal | Update name |
| Delete | Confirm | Only if no products |

---

## 8. Component Library

### 8.1 Core Components

#### Navbar (`components/Navbar.tsx`)
```tsx
// Fixed navigation bar with:
// - Logo with gradient
// - Navigation links (Products, Categories, About)
// - Search button
// - Admin Panel link
// - Mobile menu button
```

#### ProductCard (`components/ProductCard.tsx`)
```tsx
interface ProductCardProps {
  product: {
    id: string
    title: string
    description: string
    price: number
    affiliateUrl: string
    imageUrl: string
    mediaType: 'IMAGE' | 'VIDEO'
    category: Category
    featured: boolean
  }
}
// Features:
// - Hover effects
// - Featured badge
// - Category link
// - Click tracking on Buy Now
// - Video/Image display based on mediaType
```

#### ProductFilters (`components/ProductFilters.tsx`)
```tsx
interface ProductFiltersProps {
  categories: Category[]
  currentCategory?: string
  currentSearch?: string
}
// Features:
// - Search input
// - Category list with counts
// - Clear filters button
// - URL-based state
```

#### BuyButton (`components/BuyButton.tsx`)
```tsx
interface BuyButtonProps {
  productId: string
  affiliateUrl: string
}
// Features:
// - Click tracking API call
// - Opens affiliate link in new tab
```

### 8.2 Design System

#### Colors
```css
--primary: #3b82f6    /* Blue */
--secondary: #0f172a  /* Dark Slate */
--accent: #f59e0b     /* Amber */
--muted: #64748b      /* Slate */
```

#### Custom Classes
```css
.glass          /* Glassmorphic backdrop blur effect */
.premium-card   /* Product card with hover effects */
.btn-primary    /* Primary button styling */
```

---

## 9. Configuration

### 9.1 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Yes |
| `NODE_ENV` | Environment (development/production) | No |

### 9.2 Example `.env`

```env
# Database (SQLite for development)
# For production, use PostgreSQL:
# DATABASE_URL="postgresql://user:pass@host:5432/db"

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-chars"
```

### 9.3 NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start development server |
| `build` | `next build` | Build for production |
| `start` | `next start` | Start production server |
| `lint` | `eslint` | Run ESLint |
| `db:push` | `prisma db push` | Push schema to database |
| `db:seed` | `npx tsx prisma/seed.ts` | Seed database |
| `db:studio` | `prisma studio` | Open Prisma Studio |

---

## 10. Deployment Guide

### 10.1 Prerequisites

- Node.js 18+
- PostgreSQL database (for production)
- Vercel account (recommended) or any Node.js hosting

### 10.2 Production Setup

1. **Update Database Provider**

   Change `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Set Environment Variables**
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database"
   JWT_SECRET="<generate-secure-random-string>"
   ```

3. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **Push Schema to Database**
   ```bash
   npx prisma db push
   ```

5. **Seed Initial Data**
   ```bash
   npm run db:seed
   ```

6. **Build and Deploy**
   ```bash
   npm run build
   npm start
   ```

### 10.3 Vercel Deployment

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Add build command: `npx prisma generate && next build`
4. Deploy

---

## 11. Security Considerations

### 11.1 Implemented Security Measures

| Measure | Implementation |
|---------|---------------|
| Password Hashing | bcrypt with 12 rounds |
| JWT Security | HS256, HttpOnly cookies |
| CSRF Protection | SameSite=Lax cookies |
| XSS Prevention | HttpOnly cookies, React escaping |
| Rate Limiting | 5 attempts, 15-min lockout |
| SQL Injection | Prisma ORM (parameterized queries) |
| Input Validation | Server-side validation |

### 11.2 Production Recommendations

1. **JWT Secret**: Generate a cryptographically secure random string
   ```bash
   openssl rand -base64 32
   ```

2. **HTTPS**: Always use HTTPS in production

3. **Environment Variables**: Never commit `.env` to version control

4. **Database**: Use PostgreSQL with SSL in production

5. **Admin Password**: Change default admin password immediately

6. **Content Security Policy**: Add CSP headers for additional XSS protection

### 11.3 Default Credentials

> **WARNING**: Change these immediately in production!

| Field | Value |
|-------|-------|
| Email | admin@example.com |
| Password | admin123 |

---

## Appendix A: Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Appendix B: Changelog

### Version 1.1.0 (December 25, 2025)

- Added `mediaType` field to Product model (IMAGE/VIDEO support)
- Product detail page now supports video playback for VIDEO media type
- Fixed TypeScript type annotations for proper Prisma client types
- Fixed ESLint errors (unused imports, unescaped entities)
- Improved type safety with `ProductWithCategory` type definition

### Version 1.0.0 (December 24, 2025)

- Initial release
- Full product and category CRUD
- Admin authentication with JWT
- Click tracking analytics
- Responsive design
- SEO optimization

---

*Document generated for AffiliatePremium v1.1.0*
