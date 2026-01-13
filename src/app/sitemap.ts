import { prisma } from '@/lib/prisma'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://boombignose.com'

    // Fetch all products
    const products = await prisma.product.findMany({
        select: { id: true, updatedAt: true },
    })

    // Fetch all categories
    const categories = await prisma.category.findMany({
        select: { slug: true },
    })

    const productUrls = products.map((product) => ({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: product.updatedAt,
    }))

    const categoryUrls = categories.map((cat) => ({
        url: `${baseUrl}/categories?category=${cat.slug}`,
        lastModified: new Date(),
    }))

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/products`,
            lastModified: new Date(),
        },
        ...productUrls,
        ...categoryUrls,
    ]
}
