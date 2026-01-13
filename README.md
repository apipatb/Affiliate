# AffiliatePremium - Thai Affiliate Marketing Website

A modern, full-stack affiliate marketing website built with Next.js 16 App Router, featuring a public product showcase and protected admin panel for managing products and categories.

## Features

### Public Features
- 🏠 **Homepage** with featured products and categories
- 🛍️ **Product Catalog** with filtering, search, and pagination
- 📂 **Category browsing** with product counts
- 📱 **Responsive Design** with mobile-friendly navigation
- 🎨 **Modern UI** with Framer Motion animations
- 🔍 **SEO Optimized** with sitemap, robots.txt, and structured data

### Admin Features
- 🔐 **Secure JWT-based Authentication** with HTTP-only cookies
- ✏️ **Product Management** (Create, Read, Update, Delete)
- 📋 **Category Management** with slug generation
- 🖼️ **Media Upload** with image and video support
- 📊 **Click Tracking** for affiliate links
- 🛡️ **Role-based Access Control** (Admin only)

### Security Features
- 🔒 JWT authentication with secure cookies
- 🚦 Rate limiting on all API endpoints
- ✅ Input validation with Zod
- 📝 File upload validation (type, size)
- 🔐 Protected API routes with middleware

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: SQLite via [Prisma ORM](https://www.prisma.io/)
- **Authentication**: Custom JWT with [jose](https://github.com/panva/jose)
- **Validation**: [Zod](https://github.com/colinhacks/zod)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Password Hashing**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js)

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Affiliate_Website_Project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

   Generate a secure JWT secret:
   ```bash
   openssl rand -base64 32
   ```

   Update `.env` with your generated secret:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-generated-secret-here"
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="change-this-password"
   NODE_ENV="development"
   ```

4. **Set up the database**
   ```bash
   # Push schema to database
   npm run db:push

   # Seed with sample data
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**

   Visit [http://localhost:3000](http://localhost:3000)

## Available Scripts

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

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/          # Public routes (/, /products, /categories, /about)
│   │   ├── admin/             # Protected admin panel routes
│   │   └── api/               # REST API endpoints
│   │       ├── auth/          # Authentication endpoints (login, logout, session)
│   │       ├── products/      # Product CRUD operations
│   │       ├── categories/    # Category CRUD operations
│   │       └── upload/        # File upload endpoint
│   ├── components/            # Reusable React components
│   └── lib/                   # Utility libraries
│       ├── auth.ts            # JWT authentication helpers
│       ├── prisma.ts          # Prisma client singleton
│       ├── validations.ts     # Zod validation schemas
│       ├── rate-limit.ts      # API rate limiting
│       └── utils.ts           # Utility functions
├── prisma/                    # Database schema & migrations
│   ├── schema.prisma          # Prisma schema
│   └── seed.ts                # Database seeder
├── public/                    # Static files
│   └── uploads/               # User-uploaded media
├── .env.example               # Environment variable template
└── CLAUDE.md                  # Project documentation for AI assistants
```

## API Routes

### Authentication
- `POST /api/auth/login` - Admin login (rate-limited: 5 attempts per 15 min)
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/session` - Get current session

### Products (Admin Protected)
- `GET /api/products` - List products (with pagination, filtering)
  - Query params: `page`, `limit`, `category`, `search`, `featured`
- `POST /api/products` - Create product (requires auth)
- `GET /api/products/[id]` - Get product details
- `PUT /api/products/[id]` - Update product (requires auth)
- `DELETE /api/products/[id]` - Delete product (requires auth)
- `POST /api/products/[id]/click` - Track affiliate click

### Categories (Admin Protected)
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category (requires auth)
- `GET /api/categories/[id]` - Get category details
- `PUT /api/categories/[id]` - Update category (requires auth)
- `DELETE /api/categories/[id]` - Delete category (requires auth)

### Upload (Admin Protected)
- `POST /api/upload` - Upload image/video (requires auth, rate-limited)
  - Accepts: JPEG, PNG, WebP, GIF, MP4, WebM
  - Max size: 10MB

## Authentication Flow

1. Admin logs in via `/admin/login`
2. Server validates credentials and creates JWT token
3. Token stored as HTTP-only cookie (`admin_jwt_session`)
4. Middleware at `src/middleware.ts` protects `/admin/*` routes
5. API routes use `requireAuth()` helper to verify admin access

## Default Admin Credentials

After running `npm run db:seed`:

- **Email**: `admin@example.com`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change these credentials in production!

## Rate Limiting

Rate limits are enforced on sensitive endpoints:

- **Login**: 5 attempts per 15 minutes
- **File Upload**: 10 requests per minute
- **Product/Category mutations**: 30 requests per minute

## Database Schema

- **User**: Admin users with bcrypt-hashed passwords
- **Product**: Affiliate products with click tracking
- **Category**: Product categories with unique slugs
- **Enums**: Role (USER, ADMIN), MediaType (IMAGE, VIDEO)

## Deployment

### Environment Variables for Production

Ensure these are set in your production environment:

```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-secure-random-secret"
ADMIN_EMAIL="your-admin-email"
ADMIN_PASSWORD="your-secure-password"
NODE_ENV="production"
```

### Build & Deploy

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Deployment Platforms

- **Vercel**: Zero-config deployment for Next.js
- **Railway/Render**: For full-stack deployment with database
- **Docker**: Dockerfile can be added for containerized deployment

## Security Best Practices

1. ✅ **Environment Variables**: Never commit `.env` files
2. ✅ **JWT Secret**: Use a strong, random secret (32+ characters)
3. ✅ **Password Hashing**: Passwords hashed with bcrypt (12 rounds)
4. ✅ **HTTP-Only Cookies**: JWT stored securely, not accessible to JavaScript
5. ✅ **Rate Limiting**: Prevents brute force and abuse
6. ✅ **Input Validation**: All inputs validated with Zod schemas
7. ✅ **File Upload Security**: Type and size validation enforced

## Development Notes

- **Path Alias**: `@/*` maps to `./src/*`
- **Database**: SQLite for simplicity (switch to PostgreSQL for production)
- **Prisma Studio**: Run `npm run db:studio` to view/edit database visually
- **Hot Reload**: Changes auto-refresh in development mode

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues or questions, please check the documentation files:
- `CLAUDE.md` - Project overview and commands
- `SETUP_GUIDE_TH.md` - Thai language setup guide
- `SPECIFICATION.md` - Detailed specifications

---

Built with ❤️ using Next.js 16
