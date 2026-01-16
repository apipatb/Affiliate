# 🚀 Deployment Guide - Vercel

## ✅ Pre-Deployment Checklist

- [x] Database: PostgreSQL (Neon) configured
- [x] Environment variables: Ready in .env
- [x] Playwright: Disabled on production
- [x] .gitignore: Configured
- [x] Build test: Passed locally

---

## 📋 Environment Variables Required

Add these to Vercel Dashboard → Settings → Environment Variables:

```env
# Database (Neon PostgreSQL)
POSTGRES_PRISMA_URL=your_pooled_url_here
POSTGRES_URL_NON_POOLING=your_direct_url_here

# Authentication
JWT_SECRET=your_secret_here

# Optional (if using Vercel Postgres instead of Neon)
POSTGRES_URL=your_url_here
POSTGRES_HOST=your_host_here
POSTGRES_USER=your_user_here
POSTGRES_PASSWORD=your_password_here
POSTGRES_DATABASE=your_database_here
```

---

## 🎯 Deployment Steps

### Method 1: Vercel CLI (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel

# 4. Follow prompts and confirm settings
```

### Method 2: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from Git repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Build Command:** `next build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`
5. Add Environment Variables (see above)
6. Click "Deploy"

---

## 🗄️ Database Setup

### After First Deployment:

```bash
# Push Prisma schema to production database
npx prisma db push --skip-generate

# Seed admin user
npx prisma db seed
```

Or run from Vercel Dashboard → Deployments → [Select deployment] → Functions:
- Navigate to your deployment URL + `/api/admin/seed` (if you create this endpoint)

---

## ⚙️ Vercel Configuration

File: `vercel.json` (optional, but recommended)

```json
{
  "buildCommand": "prisma generate && next build",
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "api/**/*.{js,ts}": {
      "maxDuration": 60
    }
  }
}
```

---

## 🔧 Post-Deployment Setup

### 1. Run Database Migrations

```bash
# Connect to production database
vercel env pull .env.production

# Push schema
npx prisma db push

# Seed admin account
npx prisma db seed
```

### 2. Test Admin Login

- Go to: `https://your-domain.vercel.app/admin/login`
- Email: `admin@example.com`
- Password: `admin123`

**⚠️ IMPORTANT:** Change default password immediately!

### 3. Import Products

- Go to: Admin → Import CSV
- Upload your Shopee product CSV
- **Note:** Playwright image fetching is disabled on Vercel
  - Either include `imageUrl` column in CSV
  - Or use placeholder images

---

## 📝 Important Notes

### Playwright Limitations

❌ **Playwright does NOT work on Vercel** (serverless environment)

**Solutions:**
1. Run `fetch-shopee-with-playwright.js` script locally before deployment
2. Include `imageUrl` column in CSV with direct image URLs
3. Use placeholder images (automatic by category)

### File Uploads

- Uploaded images go to `/public/products/`
- On Vercel, use Vercel Blob or external storage for persistence
- Current setup uses placeholder images (works without uploads)

### Database

- Using PostgreSQL (Neon) - ✅ Production ready
- SQLite won't work on Vercel (serverless)

---

## 🐛 Troubleshooting

### Build Fails

```bash
# Test build locally first
npm run build

# Check logs
vercel logs your-deployment-url
```

### Database Connection Issues

```bash
# Verify environment variables
vercel env ls

# Test connection
npx prisma db push --preview-feature
```

### "Module not found" errors

```bash
# Clear cache
vercel --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 🎉 Done!

Your site should be live at: `https://your-project.vercel.app`

### Next Steps:

1. ✅ Test all features
2. ✅ Change admin password
3. ✅ Import products
4. ✅ Configure custom domain (optional)
5. ✅ Set up analytics (optional)

---

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs

**Project:** AffiliatePremium - Thai Shopee Affiliate Website
**Version:** 1.0.0
**Last Updated:** 2026-01-16
