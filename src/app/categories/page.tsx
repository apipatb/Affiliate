import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Metadata } from 'next'
import { ArrowRight, FolderOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'หมวดหมู่ - แอฟฟิลิเอทพรีเมียม',
  description: 'เรียกดูสินค้าตามหมวดหมู่ ค้นหาอิเล็กทรอนิกส์ แฟชั่น ของใช้ในบ้าน และอื่นๆ',
}

async function getCategories() {
  return prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
      products: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: {
          imageUrl: true,
          mediaType: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-black">เรียกดูตามหมวดหมู่</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            สำรวจคอลเลกชันที่คัดสรรมาอย่างดีจากหลากหลายหมวดหมู่
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {category.products[0] ? (
                <div className="aspect-video bg-slate-100 overflow-hidden">
                  {category.products[0].mediaType === 'VIDEO' ? (
                    <video
                      src={category.products[0].imageUrl}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={category.products[0].imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-slate-100 flex items-center justify-center">
                  <FolderOpen className="w-12 h-12 text-slate-400" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-black group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {category._count.products} สินค้า
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-16 bg-slate-50 rounded-xl">
            <p className="text-xl text-slate-600">ยังไม่มีหมวดหมู่</p>
          </div>
        )}
      </div>
    </div>
  )
}
