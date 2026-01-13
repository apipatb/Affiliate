import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary/20">404</h1>
        <h2 className="text-2xl font-bold mt-4 mb-2 text-black">ไม่พบหน้านี้</h2>
        <p className="text-slate-600 mb-8">
          หน้าที่คุณกำลังค้นหาไม่มีอยู่หรือถูกย้ายไปแล้ว
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="btn-primary flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            กลับหน้าแรก
          </Link>
          <Link
            href="/products"
            className="flex items-center gap-2 px-4 py-2 font-medium text-black hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            ดูสินค้า
          </Link>
        </div>
      </div>
    </div>
  )
}
