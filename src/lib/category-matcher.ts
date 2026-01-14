/**
 * Auto-categorize products based on product title
 */

interface CategoryRule {
  slug: string
  keywords: string[]
}

const categoryRules: CategoryRule[] = [
  {
    slug: 'fashion',
    keywords: [
      'เสื้อ', 'กางเกง', 'แจ็ค', 'โค้ท', 'ลองจอน', 'ฮีทเทค', 'กันหนาว',
      'ชุด', 'เครื่องแต่งกาย', 'เสื้อผ้า', 'แฟชั่น', 'jacket', 'coat',
      'Adidas', 'Nike', 'uniqlo', 'ฮู้ด', 'cardigan', 'เลกกิ้ง',
      'กางเกงใน', 'กางเกงยีนส์', 'คาร์ดิแกน', 'ขนเป็ด', 'ยีนส์',
      'เสื้อยืด', 'เสื้อกันหนาว', 'hoodie', 'polo', 'sweatshirt'
    ]
  },
  {
    slug: 'shoes-bags',
    keywords: [
      'รองเท้า', 'กระเป๋า', 'แตะ', 'รองท้าว', 'bag', 'shoes', 'กระเป๋าเดินทาง'
    ]
  },
  {
    slug: 'beauty',
    keywords: [
      'ความงาม', 'โทนเนอร์', 'กันแดด', 'เซรั่ม', 'ครีม', 'La Roche',
      'beauty', 'serum', 'กัวซา', 'Guasha', 'มีดโกน', 'Gillette',
      'แชมพู', 'ครีมนวด', 'ARAYA', 'VISTRA', 'Jabs', 'laglace',
      'The Skin Collection', 'ผลิตภัณฑ์ความงาม', 'ยาสีฟัน'
    ]
  },
  {
    slug: 'electronics',
    keywords: [
      'iPhone', 'iPad', 'Apple', 'AirPods', 'Samsung', 'กล้อง',
      'พาวเวอร์แบงค์', 'แบตสํารอง', 'สายชาร์จ', 'หูฟัง', 'camera',
      'powerbank', 'กล้องวงจรปิด', 'CCTV', 'TP-Link', 'Xiaomi',
      'DJI', 'Insta360', 'กล้องติดรถ', 'dash cam', 'smart watch',
      'นาฬิกา', 'HUAWEI', 'ลำโพง', 'คอมพิวเตอร์', 'จอ', 'monitor',
      'printer', 'เครื่องพิมพ์', 'ทีวี', 'TV', 'กล่องแอนดรอยด์',
      'โทรศัพท์', 'มือถือ', 'หูฟังบลูทูธ', 'Bluetooth', 'wireless',
      'charger', 'cable', 'adapter', 'โน๊ตบุ๊ค', 'laptop', 'tablet'
    ]
  },
  {
    slug: 'home',
    keywords: [
      'ของใช้ในบ้าน', 'ปลั๊กไฟ', 'ไฟ', 'แก้ว', 'กระปุก', 'ผ้าเช็ด',
      'ทิชชู่', 'น้ำหอมรถ', 'ถ้วย', 'แก้วกาแฟ', 'tumbler', 'ไม้ถูพื้น',
      'ทำความสะอาด', 'เครื่องใช้ไฟฟ้า', 'โคมไฟ', 'ม่าน', 'ถัง',
      'ชั้นวาง', 'เก้าอี้', 'โต๊ะ', 'ตู้', 'เตียง', 'ห้องครัว', 'kitchen',
      'หม้อ', 'กระทะ', 'จาน', 'ชาม', 'ช้อน', 'ส้อม', 'มีด'
    ]
  },
  {
    slug: 'sports',
    keywords: [
      'กีฬา', 'แคมป์ปิ้ง', 'เก้าอี้สนาม', 'ถุงนอน', 'เคตเทิล', 'ลู่วิ่ง',
      'จักรยาน', 'กลางแจ้ง', 'outdoor', 'camping', 'fitness', 'gym',
      'เทรก', 'ปีนเขา', 'kettlebell', 'โต๊ะแคมป์', 'นาฬิกากีฬา',
      'COROS', 'DongC', 'NorthMarch', 'เต็นท์'
    ]
  },
  {
    slug: 'care-cleaning',
    keywords: [
      'ROCKER', 'ดาวน์นี่', 'Downy', 'น้ำยาซักผ้า', 'น้ำยาปรับผ้า',
      'ผงซักผ้า', 'น้ำยาทำความสะอาด', 'Magiclean', 'JOYBOS',
      'ทำความสะอาด', 'cleaner', 'น้ำยาล้าง', 'สเปรย์', 'ไม้ถู',
      'Comfort', 'Withat', 'Lamoon', 'มาจิคลีน', 'ผงสลัด'
    ]
  },
]

export function autoCategorizeBulk(productTitle: string, availableCategories: { id: string; name: string; slug: string }[]): string {
  const titleLower = productTitle.toLowerCase()

  // Try to match with category rules
  for (const rule of categoryRules) {
    for (const keyword of rule.keywords) {
      if (titleLower.includes(keyword.toLowerCase())) {
        const category = availableCategories.find(c => c.slug === rule.slug)
        if (category) {
          return category.id
        }
      }
    }
  }

  // Default to first category if no match
  return availableCategories[0]?.id || ''
}

export function suggestCategory(productTitle: string): string {
  const titleLower = productTitle.toLowerCase()

  for (const rule of categoryRules) {
    for (const keyword of rule.keywords) {
      if (titleLower.includes(keyword.toLowerCase())) {
        return rule.slug
      }
    }
  }

  return 'home' // default
}
