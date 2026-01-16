# 📦 เครื่องมือดึงรูปภาพจาก Shopee

ระบบสมบูรณ์สำหรับดึงรูปภาพและวิดีโอจากสินค้า Shopee มาใส่ในเว็บไซต์ Affiliate

---

## 🎯 Quick Start (30 วินาทีเริ่มได้)

```bash
# 1. ติดตั้ง (ครั้งแรกครั้งเดียว)
npm install --save-dev playwright
npx playwright install chromium

# 2. รัน Script
node scripts/fetch-shopee-with-playwright.js your-products.csv output.csv --headless

# เสร็จแล้ว! รูปทั้งหมดอยู่ใน public/products/
```

📖 [อ่านคู่มือ Quick Start](SHOPEE_QUICK_START.md)

---

## 📚 ไฟล์ที่สำคัญ

### Scripts

| ไฟล์ | คำอธิบาย | เมื่อไหร่ใช้ |
|------|----------|-------------|
| `fetch-shopee-with-playwright.js` | ⭐ **อัตโนมัติ 100%** ใช้ Playwright | แนะนำ - ใช้ทุกครั้ง |
| `download-images-from-urls.js` | ดาวน์โหลดจาก URL ใน CSV | เมื่อมี URL แล้ว |
| `fetch-shopee-media-v2.js` | ทดลอง API (ใช้ไม่ได้) | ไม่ใช้ |

### เครื่องมือ

| ไฟล์ | คำอธิบาย | วิธีใช้ |
|------|----------|---------|
| `public/shopee-image-extractor.html` | Bookmarklet Tool | เปิด localhost:3000/shopee-image-extractor.html |

### คู่มือ

| ไฟล์ | เนื้อหา |
|------|---------|
| `SHOPEE_QUICK_START.md` | 🚀 เริ่มต้นใช้งานด่วน 5 นาที |
| `SHOPEE_IMAGE_GUIDE.md` | 📖 คู่มือฉบับสมบูรณ์ทุกวิธี |
| `README_SHOPEE_TOOLS.md` | 📦 ไฟล์นี้ - สรุปทุกอย่าง |

---

## 🎨 วิธีการทั้งหมด (เลือกได้ตามความชอบ)

### 1. 🤖 Playwright (แนะนำ)
**อัตโนมัติเต็มรูปแบบ - เปิด browser → ดึงรูป → ดาวน์โหลด**

```bash
node scripts/fetch-shopee-with-playwright.js products.csv output.csv --headless
```

✅ ดึงได้หลายรูป
✅ รองรับวิดีโอ  
✅ อัตโนมัติ 100%

### 2. 🔖 Bookmarklet
**Manual แต่ไม่ต้องติดตั้งอะไร**

1. เปิด `localhost:3000/shopee-image-extractor.html`
2. ลาก Bookmarklet → Bookmark Bar
3. เปิด Shopee → กด Bookmarklet
4. คัดลอก URL มาใส่ CSV

✅ ไม่ต้องติดตั้ง
✅ ใช้งานง่าย
❌ ต้อง manual

### 3. ⌨️ Interactive Script
**กึ่งอัตโนมัติ - Terminal ถามทีละสินค้า**

```bash
node scripts/download-images-from-urls.js products.csv output.csv --interactive
```

✅ ควบคุมได้เอง
❌ ต้องใส่ URL ด้วยตนเอง

### 4. 📝 CSV with URLs
**มี URL รูปแล้ว - แค่ดาวน์โหลด**

```bash
node scripts/download-images-from-urls.js products-with-urls.csv output.csv
```

✅ เร็วที่สุด (ถ้ามี URL)
❌ ต้องหา URL เอง

---

## 📊 CSV Format

### Input (ต้องมี)
```csv
รหัสสินค้า,ชื่อสินค้า,ลิงก์สินค้า
2594805678,น้ำยาทำความสะอาดรองเท้า,https://shopee.co.th/product/28794063/2594805678
```

### Output (Script จะเพิ่มให้)
```csv
รหัสสินค้า,ชื่อสินค้า,ลิงก์สินค้า,imageUrls,downloadedImages,imagesCount,mediaStatus
2594805678,น้ำยาทำความสะอาดรองเท้า,https://shopee.co.th/product/28794063/2594805678,https://...|https://...,/products/2594805678/image-1.jpg|/products/2594805678/image-2.jpg,2,success
```

---

## 🎯 Use Cases

### สถานการณ์ 1: มี CSV จาก Shopee Affiliate
```bash
node scripts/fetch-shopee-with-playwright.js shopee-export.csv final.csv --headless
```

### สถานการณ์ 2: ทดสอบสินค้าใหม่ 3 ตัว
```bash
node scripts/fetch-shopee-with-playwright.js new-products.csv test.csv --limit=3
```

### สถานการณ์ 3: Shopee rate limit
```bash
node scripts/fetch-shopee-with-playwright.js products.csv output.csv --delay=5000 --headless
```

### สถานการณ์ 4: ไม่ต้องการติดตั้งอะไร
```bash
npm run dev
# เปิด localhost:3000/shopee-image-extractor.html
# ใช้ Bookmarklet
```

---

## 🔧 Installation

### ครั้งแรก (Once)
```bash
# Clone/Download โปรเจค
cd Affiliate_Website_Project

# ติดตั้ง dependencies
npm install

# ติดตั้ง Playwright (สำหรับ automation)
npm install --save-dev playwright
npx playwright install chromium
```

### ทุกครั้งที่ใช้
```bash
# แค่รัน script
node scripts/fetch-shopee-with-playwright.js your-file.csv output.csv
```

---

## 🎓 Advanced

### Options ทั้งหมด

```bash
node scripts/fetch-shopee-with-playwright.js <input> <output> [options]

Options:
  --headless          ไม่แสดง browser (เร็วกว่า)
  --limit=N           จำกัดจำนวนสินค้า
  --delay=MS          หน่วงเวลาระหว่างสินค้า (ms)
  --skip-download     ดึงแค่ URL ไม่ดาวน์โหลด
```

### ตัวอย่าง

```bash
# Production - เร็วที่สุด
node scripts/fetch-shopee-with-playwright.js products.csv output.csv --headless --delay=2000

# Development - ดูว่าเกิดอะไรขึ้น
node scripts/fetch-shopee-with-playwright.js products.csv output.csv --limit=5

# Extract URLs only
node scripts/fetch-shopee-with-playwright.js products.csv urls.csv --skip-download

# Slow mode (ป้องกัน rate limit)
node scripts/fetch-shopee-with-playwright.js products.csv output.csv --delay=10000 --headless
```

---

## 📁 โครงสร้างไฟล์

```
Affiliate_Website_Project/
├── scripts/
│   ├── fetch-shopee-with-playwright.js  ⭐ ใช้อันนี้
│   ├── download-images-from-urls.js
│   └── fetch-shopee-media-v2.js
├── public/
│   ├── shopee-image-extractor.html      🔖 Bookmarklet tool
│   └── products/                         📁 รูปที่ดาวน์โหลด
│       ├── 2594805678/
│       │   ├── image-1.jpg
│       │   └── image-2.jpg
│       └── 54103031406/
│           └── image-1.jpg
├── SHOPEE_QUICK_START.md                🚀 เริ่มต้นด่วน
├── SHOPEE_IMAGE_GUIDE.md                📖 คู่มือเต็ม
└── README_SHOPEE_TOOLS.md               📦 ไฟล์นี้
```

---

## 🐛 Troubleshooting

### ปัญหา: "browser not installed"
```bash
npx playwright install chromium
```

### ปัญหา: "No images found"
```bash
# รันแบบไม่ headless เพื่อดู
node scripts/fetch-shopee-with-playwright.js products.csv output.csv

# หรือเพิ่ม delay
node scripts/fetch-shopee-with-playwright.js products.csv output.csv --delay=5000
```

### ปัญหา: "Permission denied"
```bash
chmod +x scripts/*.js
```

### ปัญหา: "Shopee rate limit"
```bash
# ใช้ delay มากขึ้น
node scripts/fetch-shopee-with-playwright.js products.csv output.csv --delay=10000

# หรือรันทีละน้อย
node scripts/fetch-shopee-with-playwright.js products.csv output.csv --limit=10
```

---

## 💡 Tips & Best Practices

1. **ทดสอบก่อนเสมอ** - ใช้ `--limit=3` ทดสอบก่อนรันเต็ม
2. **ใช้ headless** - เร็วกว่าและประหยัด resources
3. **ตั้ง delay** - ป้องกัน rate limit จาก Shopee (แนะนำ 2-3 วินาที)
4. **Backup CSV** - เก็บ CSV เดิมไว้ก่อนรัน script
5. **Check output** - ตรวจสอบ `public/products/` ว่ามีรูปครบ

---

## ❓ FAQ

**Q: ต้องติดตั้งอะไรบ้าง?**
A: Node.js + Playwright (ติดตั้งครั้งเดียว)

**Q: ใช้ได้กับ Shopee ประเทศอื่นไหม?**
A: ได้ แค่เปลี่ยน URL (shopee.co.th → shopee.sg, shopee.com.my ฯลฯ)

**Q: ดึงวิดีโอได้ไหม?**
A: ได้ Script จะดึงวิดีโอที่เจอโดยอัตโนมัติ

**Q: ปลอดภัยไหม?**
A: ใช่ script แค่เปิด browser ปกติเหมือนคนเข้าดู ไม่ hack หรือทำอะไรผิดกฎ

**Q: ใช้เวลานานไหม?**
A: ขึ้นกับจำนวนสินค้า ประมาณ 5-10 วินาทีต่อสินค้า (ถ้าใช้ headless + delay 2 วินาที)

**Q: CSV ต้องเป็นภาษาไทยไหม?**
A: ไม่จำเป็น รองรับทั้ง `รหัสสินค้า` และ `productId` / `ลิงก์สินค้า` และ `productLink`

---

## 📝 License

เครื่องมือนี้เป็นส่วนหนึ่งของโปรเจค AffiliatePremium
สร้างเพื่อใช้งานส่วนตัว ไม่มีการรับประกัน

---

## 🤝 Contributing

พบ bug หรือต้องการฟีเจอร์เพิ่ม?
- เปิด Issue
- หรือส่ง Pull Request

---

**เวอร์ชัน:** 1.0.0
**สร้างเมื่อ:** 2026-01-16
**ผู้พัฒนา:** Claude Code + Golf

**Happy Scraping! 🎉**
