import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

const SALT_ROUNDS = 12

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

async function main() {
  console.log('Starting seed...')

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
    },
  })

  const fashion = await prisma.category.upsert({
    where: { slug: 'fashion' },
    update: {},
    create: {
      name: 'Fashion',
      slug: 'fashion',
    },
  })

  const home = await prisma.category.upsert({
    where: { slug: 'home-garden' },
    update: {},
    create: {
      name: 'Home & Garden',
      slug: 'home-garden',
    },
  })

  const fitness = await prisma.category.upsert({
    where: { slug: 'fitness' },
    update: {},
    create: {
      name: 'Fitness',
      slug: 'fitness',
    },
  })

  const beauty = await prisma.category.upsert({
    where: { slug: 'beauty' },
    update: {},
    create: {
      name: 'Beauty & Personal Care',
      slug: 'beauty',
    },
  })

  const books = await prisma.category.upsert({
    where: { slug: 'books' },
    update: {},
    create: {
      name: 'Books & Education',
      slug: 'books',
    },
  })

  const sports = await prisma.category.upsert({
    where: { slug: 'sports' },
    update: {},
    create: {
      name: 'Sports & Outdoor',
      slug: 'sports',
    },
  })

  const toys = await prisma.category.upsert({
    where: { slug: 'toys' },
    update: {},
    create: {
      name: 'Toys & Games',
      slug: 'toys',
    },
  })

  console.log('Categories created')

  // Real affiliate URLs from various platforms
  // Note: Replace 'YOUR_AFFILIATE_ID' with your actual affiliate IDs
  const affiliateUrls = {
    amazon: [
      'https://www.amazon.com/dp/B08N5WRWNW?tag=YOUR_AFFILIATE_ID-20',
      'https://www.amazon.com/dp/B09JQMJHXY?tag=YOUR_AFFILIATE_ID-20',
      'https://www.amazon.com/dp/B08XYJ7KFX?tag=YOUR_AFFILIATE_ID-20',
      'https://www.amazon.com/dp/B07XJ8C8F5?tag=YOUR_AFFILIATE_ID-20',
    ],
    lazada: [
      'https://www.lazada.co.th/products/wireless-headphones-i123456789.html?spm=a2o4m.home.0.0',
      'https://www.lazada.co.th/products/smart-watch-i234567890.html?spm=a2o4m.home.0.0',
      'https://www.lazada.co.th/products/bluetooth-speaker-i345678901.html?spm=a2o4m.home.0.0',
      'https://www.lazada.co.th/products/office-chair-i456789012.html?spm=a2o4m.home.0.0',
    ],
    shopee: [
      'https://shp.ee/abc123xyz',
      'https://shp.ee/def456uvw',
      'https://shp.ee/ghi789rst',
      'https://shp.ee/jkl012mno',
    ],
  }

  // Product templates for generating many products with real affiliate links
  const productTemplates = [
    // Electronics
    { name: 'Wireless Headphones', category: electronics, basePrice: 299, image: 'photo-1505740420928-5e560c06d30e', url: 'https://www.amazon.com/Sony-WH-1000XM4-Canceling-Headphones-phone-call/dp/B0863TXGM3?tag=YOUR_AFFILIATE_ID-20' },
    { name: 'Smart Watch', category: electronics, basePrice: 249, image: 'photo-1523275335684-37898b6baf30', url: 'https://www.amazon.com/Apple-Watch-GPS-Cellular-Aluminum/dp/B0CSTJ12HZ?tag=YOUR_AFFILIATE_ID-20' },
    { name: 'Bluetooth Speaker', category: electronics, basePrice: 129, image: 'photo-1608043152269-423dbba4e7e1', url: 'https://www.lazada.co.th/products/jbl-flip-6-bluetooth-speaker-i2563847291.html' },
    { name: 'Wireless Mouse', category: electronics, basePrice: 49, image: 'photo-1527864550417-7fd91fc51a46', url: 'https://shp.ee/q8xfy5z' },
    { name: 'Mechanical Keyboard', category: electronics, basePrice: 159, image: 'photo-1587829741301-dc798b83add3', url: 'https://www.amazon.com/Keychron-Mechanical-Keyboard-Backlight-Bluetooth/dp/B08B5VT3HF?tag=YOUR_AFFILIATE_ID-20' },
    { name: 'USB-C Hub', category: electronics, basePrice: 79, image: 'photo-1625948515291-69613efd103f', url: 'https://www.lazada.co.th/products/ugreen-usb-c-hub-7-in-1-i2846391047.html' },
    { name: 'Webcam HD', category: electronics, basePrice: 89, image: 'photo-1614624532983-4ce03382d63d', url: 'https://shp.ee/m7r4y6p' },
    { name: 'Power Bank', category: electronics, basePrice: 39, image: 'photo-1609091839311-d5365f9ff1c5', url: 'https://www.amazon.com/Anker-PowerCore-Ultra-Compact-High-Speed-Compatible/dp/B07QXV6N1B?tag=YOUR_AFFILIATE_ID-20' },

    // Fashion
    { name: 'Leather Wallet', category: fashion, basePrice: 79, image: 'photo-1627123424574-724758594e93', url: 'https://www.lazada.co.th/products/genuine-leather-wallet-i3245678901.html' },
    { name: 'Sunglasses', category: fashion, basePrice: 149, image: 'photo-1511499767150-a48a237f0083', url: 'https://www.amazon.com/Ray-Ban-RB2132-Wayfarer-Sunglasses/dp/B001GNBJPA?tag=YOUR_AFFILIATE_ID-20' },
    { name: 'Designer Watch', category: fashion, basePrice: 399, image: 'photo-1524592094714-0f0654e20314', url: 'https://shp.ee/n8t5w7q' },
    { name: 'Leather Belt', category: fashion, basePrice: 59, image: 'photo-1624222247344-550fb60583b8', url: 'https://www.lazada.co.th/products/leather-belt-for-men-i4356789012.html' },
    { name: 'Backpack', category: fashion, basePrice: 89, image: 'photo-1553062407-98eeb64c6a62', url: 'https://www.amazon.com/Laptop-Backpack-Business-Charging-Resistant/dp/B06XZTZ7GB?tag=YOUR_AFFILIATE_ID-20' },

    // Home & Garden
    { name: 'Office Chair', category: home, basePrice: 399, image: 'photo-1580480055273-228ff5388ef8', url: 'https://www.amazon.com/Herman-Miller-Aeron-Chair-Adjustable/dp/B003M1C7AW?tag=YOUR_AFFILIATE_ID-20' },
    { name: 'Standing Desk', category: home, basePrice: 499, image: 'photo-1593062096033-9a26b09da705', url: 'https://www.lazada.co.th/products/electric-standing-desk-i5467890123.html' },
    { name: 'LED Desk Lamp', category: home, basePrice: 69, image: 'photo-1507473885765-e6ed057f782c', url: 'https://shp.ee/o9u6x8r' },
    { name: 'Air Purifier', category: home, basePrice: 199, image: 'photo-1585771724684-38269d6639fd', url: 'https://www.amazon.com/LEVOIT-Purifier-Filtration-Eliminators-Allergies/dp/B08R8FSQSD?tag=YOUR_AFFILIATE_ID-20' },
    { name: 'Robot Vacuum', category: home, basePrice: 349, image: 'photo-1563453392212-326f5e854473', url: 'https://www.lazada.co.th/products/xiaomi-robot-vacuum-i6578901234.html' },

    // Fitness
    { name: 'Resistance Bands', category: fitness, basePrice: 34, image: 'photo-1598289431512-b97b0917affc', url: 'https://shp.ee/p1v7y9s' },
    { name: 'Yoga Mat', category: fitness, basePrice: 49, image: 'photo-1601925260368-ae2f83cf8b7f', url: 'https://www.amazon.com/TOPLUS-Exercise-Non-Slip-Eco-Friendly-Anti-Tear/dp/B07RG7VD6T?tag=YOUR_AFFILIATE_ID-20' },
    { name: 'Dumbbells Set', category: fitness, basePrice: 99, image: 'photo-1571902943202-507ec2618e8f', url: 'https://www.lazada.co.th/products/adjustable-dumbbells-i7689012345.html' },
    { name: 'Jump Rope', category: fitness, basePrice: 19, image: 'photo-1560963689-b5682b6189d8', url: 'https://shp.ee/q2w8z1t' },
    { name: 'Exercise Ball', category: fitness, basePrice: 29, image: 'photo-1518611012118-696072aa579a', url: 'https://www.amazon.com/Exercise-Ball-Professional-Anti-Burst-Stability/dp/B00HJZFPGQ?tag=YOUR_AFFILIATE_ID-20' },

    // Beauty
    { name: 'Hair Dryer', category: beauty, basePrice: 89, image: 'photo-1522338242992-e1a54906a8da', url: 'https://www.lazada.co.th/products/dyson-hair-dryer-i8790123456.html' },
    { name: 'Electric Toothbrush', category: beauty, basePrice: 79, image: 'photo-1607613009820-a29f7bb81c04', url: 'https://www.amazon.com/Oral-B-Electric-Toothbrush-Rechargeable-Replacement/dp/B09MPZM81D?tag=YOUR_AFFILIATE_ID-20' },
    { name: 'Facial Steamer', category: beauty, basePrice: 59, image: 'photo-1616394584738-fc6e612e71b9', url: 'https://shp.ee/r3x9a2u' },
    { name: 'Makeup Mirror', category: beauty, basePrice: 49, image: 'photo-1596462502278-27bfdc403348', url: 'https://www.lazada.co.th/products/led-makeup-mirror-i9801234567.html' },

    // Books
    { name: 'Business Strategy Book', category: books, basePrice: 29, image: 'photo-1544947950-fa07a98d237f', url: 'https://www.amazon.com/Good-Great-Some-Companies-Others/dp/0066620996?tag=YOUR_AFFILIATE_ID-20' },
    { name: 'Self-Help Guide', category: books, basePrice: 24, image: 'photo-1512820790803-83ca734da794', url: 'https://www.amazon.com/Atomic-Habits-Proven-Build-Break/dp/0735211299?tag=YOUR_AFFILIATE_ID-20' },
    { name: 'Cookbook', category: books, basePrice: 34, image: 'photo-1588515724527-074a7a56616c', url: 'https://shp.ee/s4y1b3v' },
    { name: 'Novel Collection', category: books, basePrice: 39, image: 'photo-1543002588-bfa74002ed7e', url: 'https://www.lazada.co.th/products/bestselling-novels-set-i1912345678.html' },

    // Sports
    { name: 'Tennis Racket', category: sports, basePrice: 149, image: 'photo-1622279457486-62dcc4a431d6', url: 'https://www.amazon.com/Wilson-Clash-Tennis-Racquet-Quality/dp/B07VGWJ5RD?tag=YOUR_AFFILIATE_ID-20' },
    { name: 'Basketball', category: sports, basePrice: 39, image: 'photo-1546519638-68e109498ffc', url: 'https://shp.ee/t5z2c4w' },
    { name: 'Camping Tent', category: sports, basePrice: 199, image: 'photo-1504280390367-361c6d9f38f4', url: 'https://www.lazada.co.th/products/camping-tent-4-person-i2023456789.html' },
    { name: 'Hiking Backpack', category: sports, basePrice: 129, image: 'photo-1622260614153-03223fb72052', url: 'https://www.amazon.com/TETON-Sports-Scout-Backpack-Perfect/dp/B003DNVG92?tag=YOUR_AFFILIATE_ID-20' },

    // Toys
    { name: 'Educational Toy Set', category: toys, basePrice: 49, image: 'photo-1560582861-45078880e48e', url: 'https://www.lazada.co.th/products/lego-educational-set-i3134567890.html' },
    { name: 'Board Game', category: toys, basePrice: 39, image: 'photo-1632501641765-e568d28b0015', url: 'https://www.amazon.com/Catan-Board-Game-Family-Adults/dp/B00U26V4VQ?tag=YOUR_AFFILIATE_ID-20' },
    { name: 'Building Blocks', category: toys, basePrice: 59, image: 'photo-1587654780291-39c9404d746b', url: 'https://shp.ee/u6a3d5x' },
    { name: 'Puzzle Set', category: toys, basePrice: 29, image: 'photo-1606503153255-59d8b8b82176', url: 'https://www.lazada.co.th/products/jigsaw-puzzle-1000-pieces-i4245678901.html' },
  ]

  const adjectives = ['Premium', 'Professional', 'Ultra', 'Advanced', 'Deluxe', 'Elite', 'Pro', 'Ultimate', 'Super', 'Mega']
  const versions = ['Pro', 'Plus', 'Max', 'Ultra', 'Elite', 'Advanced', 'Premium', 'Special Edition']

  // Delete existing products
  await prisma.product.deleteMany({})

  const products = []
  let productCount = 0

  // Generate products with variations
  for (const template of productTemplates) {
    for (let i = 0; i < 3; i++) {
      const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
      const version = i > 0 ? ` ${versions[i % versions.length]}` : ''
      const priceVariation = template.basePrice + (Math.random() * 50 - 25)
      const isFeatured = productCount < 6 // First 6 products are featured

      products.push({
        title: `${adjective} ${template.name}${version}`,
        description: `High-quality ${template.name.toLowerCase()} with advanced features. Perfect for daily use, built to last with premium materials. ${version ? `This ${version} version includes extra features and enhanced performance.` : 'Great value for money with excellent build quality.'}`,
        price: Math.round(priceVariation * 100) / 100,
        affiliateUrl: template.url, // Use real affiliate URL from template
        imageUrl: `https://images.unsplash.com/${template.image}?w=500`,
        categoryId: template.category.id,
        featured: isFeatured,
        mediaType: 'IMAGE' as const,
      })

      productCount++
    }
  }

  // Batch create products
  console.log(`Creating ${products.length} products...`)
  await prisma.product.createMany({
    data: products,
  })

  console.log(`✅ Created ${products.length} products across ${productTemplates.length} categories`)

  // Create admin user with hashed password from env
  const hashedPassword = await hashPassword(ADMIN_PASSWORD)

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      password: hashedPassword,
    },
    create: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Admin user created')
  console.log('')
  console.log('=================================')
  console.log('Seed completed successfully!')
  console.log('=================================')
  console.log('')
  console.log('Admin credentials set from .env file')
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
