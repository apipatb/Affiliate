import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-6">
      {/* Home */}
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-primary dark:hover:text-blue-400 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">หน้าแรก</span>
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-slate-400" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-primary dark:hover:text-blue-400 transition-colors font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 dark:text-white font-semibold">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}
