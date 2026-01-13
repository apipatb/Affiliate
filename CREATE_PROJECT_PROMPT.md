# 🚀 Prompt สร้างเว็บไซต์ Affiliate ใหม่ตั้งแต่ต้น

---

## 🌟 ต้องการผู้เชี่ยวชาญช่วยเหลือ? / Need a Specialist to Help You?

> **ถ้าคุณต้องการ:**
> - 👨‍🏫 ผู้เชี่ยวชาญคอยช่วยเหลือจนสร้างเสร็จ
> - 📦 Template สำเร็จรูปสำหรับโปรเจกต์นี้และอื่นๆ
> - ⚡ เรียนรู้ n8n AI Automation แบบ Plug-and-Play
> - 🤖 สร้าง AI Chat Agent, Content อัตโนมัติ, AI Trading
> - 🤝 เข้าร่วม Community รับงาน & ขาย Workflow
>
> **เข้าร่วม BoomBigNose+ ได้เลย!**
>
> 🔗 **https://www.skool.com/boombignose-8034/about**
>
> ✅ VIP Support ตอบไวภายใน 24 ชม.
> ✅ Workflow พรีเมียม (มูลค่า 25,000 บ.)
> ✅ อัปเดตฟรีตลอดปี
> ✅ Lifetime Community ไม่ทิ้งกัน

---

> ก๊อป Prompt แต่ละขั้นตอนไปใช้กับ AI (เช่น Claude, ChatGPT, Cursor)
> 
> Copy each prompt step by step to an AI assistant.

---

## ⚠️ ก่อนเริ่ม / Before You Start

### ต้องติดตั้ง Node.js ก่อน! / Install Node.js First!

1. ไปที่ / Go to: **https://nodejs.org/**
2. ดาวน์โหลดเวอร์ชัน **LTS** / Download **LTS** version
3. ติดตั้งตามขั้นตอน / Install it
4. รีสตาร์ทคอม / Restart computer

ตรวจสอบ / Check:
```bash
node --version
# ต้องขึ้นเลข เช่น v20.10.0
# Should show version like v20.10.0
```

---

# 📋 Prompts ทีละขั้นตอน (ก๊อปทีละอัน)

---

## Step 1: Project Setup - ตั้งค่าโปรเจกต์

```
Create a new Next.js 16 project with:
- TypeScript
- Tailwind CSS 4
- ESLint
- App Router
- src directory

Install these packages:
- @prisma/client, prisma
- bcryptjs, @types/bcryptjs
- jose
- framer-motion
- lucide-react
- clsx, tailwind-merge
- next-themes
- tsx

Set up basic configuration files.
```

---

## Step 2: Database Setup - ตั้งค่าฐานข้อมูล

```
Set up Prisma with SQLite database.

Create these models:

1. User
   - id (cuid, primary key)
   - email (unique)
   - password (hashed)
   - role (enum: USER, ADMIN)
   - createdAt

2. Product
   - id (cuid, primary key)
   - title
   - description
   - price (float)
   - affiliateUrl
   - imageUrl
   - mediaType (enum: IMAGE, VIDEO)
   - categoryId (relation to Category)
   - clicks (default 0)
   - featured (boolean)
   - createdAt
   - updatedAt

3. Category
   - id (cuid, primary key)
   - name (unique)
   - slug (unique)
   - products (relation)

Create seed scripts:
- seed.ts: Create sample categories, products, and admin user
- seed-admin.ts: Create only admin user

Use environment variables for admin credentials:
- ADMIN_EMAIL (default: admin@example.com)
- ADMIN_PASSWORD (default: admin123)

Add npm scripts:
- db:push
- db:seed
- db:seed:admin
- db:studio
```

---

## Step 3: Authentication - ระบบ Login

```
Create JWT-based authentication system:

1. Create auth.ts in lib folder with:
   - hashPassword (using bcryptjs)
   - verifyPassword
   - createToken (using jose)
   - verifyToken
   - createSession (HttpOnly cookie)
   - getSession
   - destroySession
   - authenticate function

2. Session duration: 7 days
3. Cookie name: admin_jwt_session
4. Use JWT_SECRET from environment variable

Create middleware.ts to:
- Protect /admin routes (except /admin/login)
- Redirect unauthenticated users to /admin/login
- Redirect authenticated users from /admin/login to /admin
```

---

## Step 4: Auth API Routes - สร้าง API Login

```
Create authentication API routes:

POST /api/auth/login
- Accept email and password
- Validate credentials
- Create session on success
- Return user info or error

POST /api/auth/logout
- Destroy session
- Clear cookie
- Return success

GET /api/auth/session
- Check if user is authenticated
- Return user info if authenticated
- Return 401 if not authenticated
```

---

## Step 5: Products API Routes - สร้าง API สินค้า

```
Create products API routes:

GET /api/products
- List all products
- Support query params: search, category, featured, sort
- Include category relation
- Return products array

POST /api/products
- Create new product
- Require: title, description, price, affiliateUrl, imageUrl, categoryId
- Optional: mediaType, featured
- Return created product

GET /api/products/[id]
- Get single product by ID
- Include category relation
- Return 404 if not found

PUT /api/products/[id]
- Update existing product
- Return updated product
- Return 404 if not found

DELETE /api/products/[id]
- Delete product by ID
- Return success message
- Return 404 if not found

POST /api/products/[id]/click
- Increment clicks count by 1
- Return updated clicks and affiliateUrl
```

---

## Step 6: Categories API Routes - สร้าง API หมวดหมู่

```
Create categories API routes:

GET /api/categories
- List all categories
- Include product count (_count)
- Return categories array

POST /api/categories
- Create new category
- Require: name, slug
- Return created category

GET /api/categories/[id]
- Get single category by ID
- Include products relation
- Return 404 if not found

PUT /api/categories/[id]
- Update existing category
- Return updated category

DELETE /api/categories/[id]
- Delete category by ID
- Return success message
```

---

## Step 7: Upload API - สร้าง API อัพโหลด

```
Create upload API route:

POST /api/upload
- Accept multipart/form-data
- Accept image files (jpg, png, gif, webp) and video files (mp4, webm)
- Save files to public/uploads folder
- Generate unique filename
- Return file URL
```

---

## Step 8: Components - สร้าง Components

```
Create reusable components:

1. Navbar
   - Logo and site name
   - Navigation links: Home, Products, Categories, About
   - Mobile hamburger menu
   - Responsive design

2. ProductCard
   - Product image (support video)
   - Title
   - Price
   - Category badge
   - Buy button
   - Hover animations with Framer Motion

3. ProductFilters
   - Search input
   - Category dropdown
   - Sort dropdown (price, date, popularity)
   - Featured filter

4. BuyButton
   - Track clicks by calling /api/products/[id]/click
   - Open affiliate URL in new tab
   - Show loading state
```

---

## Step 9: Public Pages - หน้าสาธารณะ

```
Create public pages:

1. Homepage (/)
   - Hero section with gradient background
   - Featured products section
   - Categories section
   - Call to action

2. Products page (/products)
   - ProductFilters component
   - Products grid
   - Loading state
   - Empty state

3. Product detail page (/products/[id])
   - Large product image/video
   - Title, description, price
   - Category
   - Buy button
   - Click count

4. Categories page (/categories)
   - Categories grid
   - Product count per category
   - Link to products filtered by category

5. About page (/about)
   - About content
   - Mission/vision
```

---

## Step 10: Admin Pages - หน้า Admin

```
Create admin pages:

1. Admin login (/admin/login)
   - Email input
   - Password input
   - Login button
   - Error message display
   - Redirect to /admin on success

2. Admin dashboard (/admin)
   - Welcome message
   - Statistics cards: Total Products, Categories, Clicks
   - Quick links to management pages

3. Products management (/admin/products)
   - Products table with: image, title, price, category, clicks, actions
   - Add new product button
   - Modal/form for create/edit product
   - Delete confirmation
   - Image/video upload

4. Categories management (/admin/categories)
   - Categories table with: name, slug, product count, actions
   - Add new category button
   - Modal/form for create/edit category
   - Delete confirmation

Create admin layout with:
- Sidebar navigation
- Logout button
- Responsive design
```

---

## Step 11: SEO & Polish - SEO และตกแต่ง

```
Add SEO and final polish:

1. Create robots.ts for robots.txt
2. Create sitemap.ts for sitemap.xml
3. Create not-found.tsx for 404 page
4. Add meta tags to layout.tsx
5. Add Framer Motion animations:
   - Page transitions
   - Card hover effects
   - Button interactions
6. Style with Tailwind CSS:
   - Primary color: #3b82f6
   - Clean, modern design
   - Glass morphism effects
   - Responsive grid
   - Large readable text
```

---

## Step 12: Testing with Testsprite MCP - ทดสอบด้วย Testsprite

```
Use Testsprite MCP to create API tests for:

1. TC001: Login admin with valid credentials
   - POST /api/auth/login with valid email/password
   - Verify JWT cookie is created
   - Verify success response

2. TC002: Logout admin user
   - POST /api/auth/logout
   - Verify cookie is cleared
   - Verify success response

3. TC003: Get session status
   - GET /api/auth/session when authenticated
   - Verify user info returned
   - Test 401 when not authenticated

4. TC004: Get all products with filters
   - GET /api/products
   - Test search, category, featured filters
   - Verify response structure

5. TC005: Create new product
   - POST /api/products with valid data
   - Verify product created
   - Test missing required fields returns 400

6. TC006: Get single product
   - GET /api/products/[id]
   - Verify product details
   - Test 404 for invalid ID

7. TC007: Update product
   - PUT /api/products/[id]
   - Verify update success
   - Test 404 for invalid ID

8. TC008: Delete product
   - DELETE /api/products/[id]
   - Verify deletion
   - Test 404 for invalid ID

9. TC009: Track affiliate click
   - POST /api/products/[id]/click
   - Verify clicks incremented
   - Verify affiliateUrl returned

10. TC010: Get all categories
    - GET /api/categories
    - Verify categories with product counts
```

---

# ▶️ หลังสร้างเสร็จ / After Project Created

รันคำสั่งเหล่านี้ / Run these commands:

```bash
# ติดตั้ง packages / Install packages
npm install

# สร้างฐานข้อมูล / Setup database
npx prisma generate
npm run db:push
npm run db:seed

# รันเว็บไซต์ / Run website
npm run dev

# เปิด Browser / Open browser
# http://localhost:3000
```

---

# 🔐 หน้า Admin และการ Login / Admin Page & Login

### URL หน้า Admin / Admin Page URL

```
http://localhost:3000/admin/login
```

### ข้อมูล Login เริ่มต้น / Default Login Credentials

| ข้อมูล / Field | ค่าเริ่มต้น / Default Value |
|----------------|----------------------------|
| **Email** | `admin@example.com` |
| **Password** | `admin123` |

---

# ⚙️ เปลี่ยน Email/Password ของ Admin / Change Admin Credentials

ถ้าต้องการเปลี่ยน Email หรือ Password ของ Admin:

If you want to change Admin Email or Password:

### ขั้นตอน / Steps:

1. **สร้างไฟล์ `.env`** ในโฟลเดอร์หลัก
   
   Create `.env` file in the project root folder

2. **ใส่ข้อมูลในไฟล์ `.env`:**

```
ADMIN_EMAIL=your-new-email@example.com
ADMIN_PASSWORD=your-new-password
```

**ตัวอย่าง / Example:**
```
ADMIN_EMAIL=myemail@gmail.com
ADMIN_PASSWORD=MySecurePassword123
```

3. **รันคำสั่ง / Run command:**

```bash
npm run db:seed:admin
```

4. **Login ด้วยข้อมูลใหม่ / Login with new credentials**

ไปที่ `http://localhost:3000/admin/login` แล้วใช้ Email และ Password ใหม่

---

# 📌 สรุป / Summary

| สิ่งที่ต้องรู้ / What to Know | ค่า / Value |
|-------------------------------|-------------|
| หน้าเว็บ / Website | `http://localhost:3000` |
| หน้า Admin / Admin Page | `http://localhost:3000/admin/login` |
| Email เริ่มต้น / Default Email | `admin@example.com` |
| Password เริ่มต้น / Default Password | `admin123` |
| วิธีเปลี่ยน Admin / Change Admin | สร้างไฟล์ `.env` แล้วรัน `npm run db:seed:admin` |

---

# 🌟 ต้องการความช่วยเหลือเพิ่มเติม? / Need More Help?

> **เข้าร่วม BoomBigNose+ Community!**
> 
> 🔗 **https://www.skool.com/boombignose-8034/about**
>
> สิ่งที่คุณจะได้:
> - ✅ ผู้เชี่ยวชาญคอยช่วยเหลือจนสร้างเสร็จ
> - ✅ Template สำเร็จรูปสำหรับทุกโปรเจกต์
> - ✅ เรียนรู้ n8n AI Automation
> - ✅ AI Chat Agent, Content อัตโนมัติ, AI Trading
> - ✅ VIP Support ตอบไวภายใน 24 ชม.
> - ✅ Community รับงาน & ขาย Workflow
>
> **👉 สมัครเลย: https://www.skool.com/boombignose-8034/about**

---

*สร้างด้วย ❤️ โดย BoomBigNose*
