# การตั้งค่า Shopee Affiliate API

## ขั้นตอนการเพิ่ม Shopee Affiliate API Credentials

### 1. เพิ่ม Environment Variables ใน Vercel

เข้าไปที่ Vercel Project Settings:
```
https://vercel.com/golf-cts-projects/affiliate-golf-review/settings/environment-variables
```

เพิ่ม environment variables 2 ตัว:

1. **SHOPEE_APP_ID**
   - Value: AppID ที่ได้จาก Shopee Affiliate Dashboard
   - Environments: Production, Preview, Development

2. **SHOPEE_SECRET**
   - Value: ความลับ (Secret) ที่ได้จาก Shopee Affiliate Dashboard
   - Environments: Production, Preview, Development

### 2. เพิ่ม Environment Variables แบบ Command Line

หรือใช้ Vercel CLI:

```bash
# เพิ่ม SHOPEE_APP_ID
vercel env add SHOPEE_APP_ID production

# เพิ่ม SHOPEE_SECRET
vercel env add SHOPEE_SECRET production
```

### 3. เพิ่มใน Local Development

สร้างไฟล์ `.env.local` และเพิ่ม:

```env
SHOPEE_APP_ID=your_app_id_here
SHOPEE_SECRET=your_secret_here
```

## ตัวอย่างการใช้งาน

### Import สินค้าจาก Shopee URL

เมื่อตั้งค่า API credentials แล้ว ระบบจะ:
1. **ดึงข้อมูลจาก Shopee Affiliate API** (รวมค่าคอมมิชชั่น)
2. **สร้าง Affiliate Link** อัตโนมัติ
3. **บันทึกข้อมูลค่าคอมมิชชั่น** ไว้ในระบบ

### ค้นหาสินค้าจาก Shopee Affiliate

```bash
# API endpoint สำหรับค้นหาสินค้า
GET /api/shopee/search?keyword=headphones&limit=20
```

## GraphQL API Schema (ตัวอย่าง)

Shopee Affiliate ใช้ GraphQL API:

### Query: ค้นหาสินค้า

```graphql
query {
  productSearch(keyword: "headphones", limit: 20, offset: 0) {
    products {
      itemId
      shopId
      productName
      productLink
      imageUrl
      price
      commission
      commissionRate
      sales
    }
    totalCount
  }
}
```

### Query: ดึงข้อมูลสินค้า

```graphql
query {
  productInfo(itemId: "123456", shopId: "789012") {
    itemId
    shopId
    productName
    productLink
    imageUrl
    price
    commission
    commissionRate
    sales
  }
}
```

### Mutation: สร้าง Affiliate Link

```graphql
mutation {
  generateAffiliateLink(itemId: "123456", shopId: "789012") {
    shortLink
    longLink
  }
}
```

## หมายเหตุ

- หากไม่ตั้งค่า credentials ระบบจะใช้ Public API (ไม่มีค่าคอมมิชชั่นและ affiliate link)
- Shopee Affiliate API endpoint: `https://open-api.affiliate.shopee.co.th/graphql`
- สำหรับ documentation เพิ่มเติม: https://graphql.org/

## การตรวจสอบว่า API ทำงาน

ตรวจสอบ logs ใน Vercel:
- ถ้าเห็น `"Using Shopee Affiliate API..."` = ใช้ API อย่างเป็นทางการ
- ถ้าเห็น `"Affiliate API failed, falling back..."` = ใช้ Public API
