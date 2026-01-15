import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Star, ShieldCheck, Truck, RefreshCw, TrendingUp, Eye, Users, Heart } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import BuyButton from '@/components/BuyButton'
import StickyBuyButton from '@/components/StickyBuyButton'
import type { Product, Category } from '@prisma/client'

type MediaType = 'IMAGE' | 'VIDEO'

type ProductWithCategory = Product & {
  category: Category
  mediaType: MediaType
  rating?: number
  reviewCount?: number
}


interface PageProps {
  params: Promise<{ id: string }>
}

async function getProduct(id: string): Promise<ProductWithCategory | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  })
  return product as ProductWithCategory | null
}

async function getRelatedProducts(categoryId: string, currentId: string): Promise<ProductWithCategory[]> {
  const products = await prisma.product.findMany({
    where: {
      categoryId,
      id: { not: currentId },
    },
    include: { category: true },
    take: 3,
  })
  return products as ProductWithCategory[]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return { title: 'ไม่พบสินค้า' }
  }

  return {
    title: `${product.title} - กอล์ฟรีวิว`,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: [product.imageUrl],
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  const relatedProducts = await getRelatedProducts(product.categoryId, product.id)

  const productAny = product


  const isPopular = product.clicks > 50
  const isTrending = product.clicks > 20
  const viewersToday = Math.floor(product.clicks * 0.3) + Math.floor(Math.random() * 10) // Simulate today's viewers

  return (
    <div className="py-12 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปหน้าสินค้า
        </Link>

        {/* Product Detail */}
        <div className="grid lg:grid-cols-5 gap-8 mb-16">
          {/* Media */}
          <div className={`lg:col-span-2 ${productAny.mediaType === 'VIDEO' ? 'aspect-[9/16] max-h-[450px]' : 'aspect-square max-h-[450px]'} bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl overflow-hidden relative mx-auto w-full shadow-xl border-2 border-slate-200 dark:border-slate-700`}>
            {productAny.mediaType === 'VIDEO' ? (
              <video
                src={productAny.imageUrl}
                className="w-full h-full object-contain bg-black"
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
              />
            ) : (
              <img
                src={productAny.imageUrl}
                alt={productAny.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            )}

            {/* Badges Container */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              {productAny.featured && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg animate-pulse">
                  <Star className="w-4 h-4 fill-white" />
                  แนะนำ
                </div>
              )}
              {isPopular && (
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg">
                  <Heart className="w-4 h-4 fill-white" />
                  ยอดนิยม
                </div>
              )}
              {isTrending && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg">
                  <TrendingUp className="w-4 h-4" />
                  กำลังมาแรง
                </div>
              )}
            </div>
          </div>



          {/* Details */}
          <div className="lg:col-span-3">
            <Link
              href={`/products?category=${product.category.slug}`}
              className="inline-block text-sm font-bold text-primary dark:text-blue-400 uppercase tracking-wider hover:underline mb-3 px-3 py-1 bg-primary/10 dark:bg-blue-500/10 rounded-full"
            >
              {product.category.name}
            </Link>

            <h1 className="text-4xl lg:text-5xl font-extrabold mt-2 mb-4 text-slate-900 dark:text-white leading-tight">{product.title}</h1>

            {/* Social Proof Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Eye className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-semibold">{product.clicks.toLocaleString('th-TH')} ครั้ง</span>
              </div>
              {viewersToday > 0 && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Users className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-semibold">{viewersToday} คนกำลังดู</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => {
                  const rating = product.rating || 4.8
                  return (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : i < Math.ceil(rating)
                          ? 'text-yellow-400 fill-yellow-400 opacity-50'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  )
                })}
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">
                  ({(product.rating || 4.8).toFixed(1)})
                </span>
                {product.reviewCount && product.reviewCount > 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-500 ml-1">
                    {product.reviewCount.toLocaleString('th-TH')} รีวิว
                  </span>
                )}
              </div>
            </div>

            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6 font-medium">
              {product.description}
            </p>

            {/* Price Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 mb-6 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-extrabold text-primary dark:text-blue-400">
                  ฿{product.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
                {isPopular && (
                  <span className="text-sm font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                    ราคาพิเศษ!
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                <Truck className="w-4 h-4" />
                ส่งฟรี เมื่อซื้อผ่าน Shopee
              </p>
            </div>

            {/* CTA Button */}
            <BuyButton productId={product.id} affiliateUrl={product.affiliateUrl} />

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t-2 border-slate-200 dark:border-slate-700">
              <div className="text-center group">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">คุณภาพรับรอง</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">100% แท้</p>
              </div>
              <div className="text-center group">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Truck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">จัดส่งรวดเร็ว</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ส่งฟรี</p>
              </div>
              <div className="text-center group">
                <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <RefreshCw className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">คืนสินค้าง่าย</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">7 วัน</p>
              </div>
            </div>
          </div>
        </div>

        {/* Semantic Section for AI (GEO) */}
        <div className="grid md:grid-cols-2 gap-12 py-12 border-t border-slate-200 dark:border-slate-700 mb-16">
          <div>
            <h2 className="text-2xl font-bold mb-6 text-black dark:text-slate-100">ทำไมต้องเลือก {product.title}?</h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              <p>
                {product.title} เป็นสินค้าในหมวด <strong>{product.category.name}</strong> ที่เราคัดสรรมาแล้วว่าคุ้มค่าที่สุด
                ด้วยราคาเพียง <strong>฿{product.price.toFixed(2)}</strong> คุณจะได้รับคุณภาพระดับพรีเมียมและการรับรองจากทีมงานของเรา
              </p>
              <ul className="mt-4 space-y-2">
                <li>✅ ตรวจสอบคุณภาพแล้ว 100%</li>
                <li>✅ ดีไซน์ทันสมัย ใช้งานง่าย</li>
                <li>✅ คุ้มค่าแก่การลงทุน</li>
              </ul>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6 text-black dark:text-slate-100">คำถามที่พบบ่อย (FAQ)</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-black dark:text-slate-100 mb-1">สินค้านี้เหมาะกับใคร?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">เหมาะสำหรับผู้ที่มองหา {product.category.name} คุณภาพสูงในราคาที่เข้าถึงได้</p>
              </div>
              <div>
                <h3 className="font-bold text-black dark:text-slate-100 mb-1">สั่งซื้อได้ที่ไหน?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">คุณสามารถคลิกปุ่ม &quot;ซื้อเลย&quot; เพื่อไปยังหน้าร้านค้าอย่างเป็นทางการได้ทันที</p>
              </div>
            </div>
          </div>
        </div>

        {/* Structured Data (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: product.title,
              image: product.imageUrl,
              description: product.description,
              brand: {
                '@type': 'Brand',
                name: 'กอล์ฟรีวิว',
              },
              offers: {
                '@type': 'Offer',
                url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://boombignose.com'}/products/${product.id}`,
                priceCurrency: 'THB',
                price: product.price,
                availability: 'https://schema.org/InStock',
              },
            }),
          }}
        />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-3xl font-extrabold mb-8 text-slate-900 dark:text-white">สินค้าที่คุณอาจชอบ</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Buy Button */}
      <StickyBuyButton
        productId={product.id}
        productTitle={product.title}
        price={product.price}
        imageUrl={product.imageUrl}
      />
    </div>
  )
}
