import { ArrowRight, Star, ShieldCheck, Zap, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import ProductCarousel from "@/components/ProductCarousel"
import RecentlyViewed from "@/components/RecentlyViewed"

async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { featured: true },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts()

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-white dark:bg-slate-900">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 text-xs font-bold mb-8 animate-fade-in">
            <Star className="w-3 h-3 fill-primary dark:fill-blue-400" />
            <span>ได้รับความไว้วางใจจากนักช้อปกว่า 10,000+ คน</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-slate-900 to-slate-500 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent leading-tight">
            ค้นพบสินค้าที่ดีที่สุด <br /> คัดสรรมาเพื่อคุณ
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-10 leading-relaxed">
            เราคัดสรรสินค้าที่ได้รับคะแนนสูงสุดจากทั่วทุกมุมโลก เพื่อให้คุณไม่ต้องเสียเวลาค้นหาเอง เริ่มต้นช้อปอย่างชาญฉลาดที่นี่
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/products" className="btn-primary flex items-center gap-2 group">
              ดูสินค้าทั้งหมด
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/about" className="px-6 py-3 font-medium text-black dark:text-slate-200 transition-colors hover:text-primary dark:hover:text-blue-400">
              วิธีการรีวิวของเรา
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-primary dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">คุณภาพที่ตรวจสอบแล้ว</h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                ทุกสินค้าผ่านการวิจัยอย่างละเอียดและตรวจสอบคุณภาพและความน่าเชื่อถือ
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-accent dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">ดีลที่ดีที่สุด</h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                เราติดตามประวัติราคาและค้นหาดีลที่ดีที่สุดที่มีอยู่ออนไลน์
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center mb-6">
                <ShoppingBag className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-black dark:text-white">ช้อปง่าย</h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                ลิงก์ตรงไปยังร้านค้าที่น่าเชื่อถือเพื่อประสบการณ์การช้อปปิ้งที่ราบรื่นและปลอดภัย
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">สินค้าแนะนำจากบรรณาธิการ</h2>
            <p className="text-slate-700 dark:text-slate-300">
              สินค้าที่ทีมงานของเราคัดสรรมาอย่างพิถีพิถัน
            </p>
          </div>
          {featuredProducts.length > 0 ? (
            <ProductCarousel products={featuredProducts as any} autoPlay={true} interval={5000} />
          ) : (
            <div className="text-center py-12 text-slate-700 dark:text-slate-300">
              ยังไม่มีสินค้าแนะนำ
            </div>
          )}
          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-primary dark:text-blue-400 font-semibold hover:gap-3 transition-all"
            >
              ดูสินค้าทั้งหมด
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Recently Viewed Products */}
      <section className="py-12 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RecentlyViewed maxItems={6} />
        </div>
      </section>
    </div>
  )
}
