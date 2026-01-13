import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Star, ShieldCheck, Truck, RefreshCw } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import BuyButton from '@/components/BuyButton'
import type { Product, Category } from '@prisma/client'

type MediaType = 'IMAGE' | 'VIDEO'

type ProductWithCategory = Product & { category: Category; mediaType: MediaType }


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


  return (
    <div className="py-12 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปหน้าสินค้า
        </Link>

        {/* Product Detail */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Media */}
          <div className={`${productAny.mediaType === 'VIDEO' ? 'aspect-[9/16] max-h-[500px]' : 'aspect-square'} bg-slate-100 rounded-2xl overflow-hidden relative mx-auto`}>
            {productAny.mediaType === 'VIDEO' ? (
              <video
                src={productAny.imageUrl}
                className="w-full h-full object-contain bg-black"
                autoPlay
                muted
                loop
                playsInline
                controls
              />
            ) : (
              <img
                src={productAny.imageUrl}
                alt={productAny.title}
                className="w-full h-full object-cover"
              />
            )}
            {productAny.featured && (
              <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1">
                <Star className="w-4 h-4 fill-white" />
                แนะนำ
              </div>
            )}
          </div>



          {/* Details */}
          <div>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="text-sm font-bold text-primary dark:text-blue-400 uppercase tracking-wider hover:underline"
            >
              {product.category.name}
            </Link>

            <h1 className="text-4xl font-bold mt-2 mb-4 text-black dark:text-slate-100">{product.title}</h1>

            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              {product.description}
            </p>

            <div className="text-4xl font-bold text-primary dark:text-blue-400 mb-8">
              ฿{product.price.toFixed(2)}
            </div>

            {/* CTA Button */}
            <BuyButton productId={product.id} affiliateUrl={product.affiliateUrl} />

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <ShieldCheck className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-black dark:text-slate-300">คุณภาพรับรอง</p>
              </div>
              <div className="text-center">
                <Truck className="w-6 h-6 text-primary dark:text-blue-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-black dark:text-slate-300">จัดส่งรวดเร็ว</p>
              </div>
              <div className="text-center">
                <RefreshCw className="w-6 h-6 text-accent dark:text-yellow-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-black dark:text-slate-300">คืนสินค้าง่าย</p>
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
            <h2 className="text-2xl font-bold mb-8 text-black dark:text-slate-100">สินค้าที่คุณอาจชอบ</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
