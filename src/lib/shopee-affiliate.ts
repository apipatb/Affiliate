/**
 * Shopee Affiliate GraphQL API Client
 * Documentation: https://graphql.org/
 */

interface ShopeeConfig {
  appId: string
  secret: string
  endpoint: string
}

interface ProductSearchParams {
  keyword?: string
  categoryIds?: number[]
  limit?: number
  offset?: number
}

interface ShopeeProduct {
  itemId: string
  shopId: string
  productName: string
  productLink: string
  imageUrl: string
  price: number
  commission: number
  commissionRate: number
  sales: number
}

class ShopeeAffiliateAPI {
  private config: ShopeeConfig

  constructor() {
    this.config = {
      appId: process.env.SHOPEE_APP_ID || '',
      secret: process.env.SHOPEE_SECRET || '',
      endpoint: 'https://open-api.affiliate.shopee.co.th/graphql',
    }
  }

  /**
   * Generate signature for API authentication
   */
  private generateSignature(timestamp: number): string {
    const crypto = require('crypto')
    const message = `${this.config.appId}${timestamp}${this.config.secret}`
    return crypto.createHash('sha256').update(message).digest('hex')
  }

  /**
   * Search products from Shopee Affiliate
   */
  async searchProducts(params: ProductSearchParams): Promise<ShopeeProduct[]> {
    if (!this.config.appId || !this.config.secret) {
      throw new Error('Shopee Affiliate API credentials not configured')
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const signature = this.generateSignature(timestamp)

    const query = `
      query {
        productSearch(
          keyword: "${params.keyword || ''}"
          limit: ${params.limit || 20}
          offset: ${params.offset || 0}
        ) {
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
    `

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopee-App-Id': this.config.appId,
          'X-Shopee-Timestamp': timestamp.toString(),
          'X-Shopee-Signature': signature,
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`Shopee API error: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.errors) {
        throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`)
      }

      return result.data?.productSearch?.products || []
    } catch (error) {
      console.error('Shopee Affiliate API error:', error)
      throw error
    }
  }

  /**
   * Get product details by URL or product ID
   */
  async getProductByUrl(url: string): Promise<ShopeeProduct | null> {
    // Extract shop_id and item_id from URL
    const urlPattern = /shopee\.co\.th\/.*-i\.(\d+)\.(\d+)/
    const match = url.match(urlPattern)

    if (!match) {
      throw new Error('Invalid Shopee URL format')
    }

    const [, shopId, itemId] = match

    const timestamp = Math.floor(Date.now() / 1000)
    const signature = this.generateSignature(timestamp)

    const query = `
      query {
        productInfo(itemId: "${itemId}", shopId: "${shopId}") {
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
    `

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopee-App-Id': this.config.appId,
          'X-Shopee-Timestamp': timestamp.toString(),
          'X-Shopee-Signature': signature,
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`Shopee API error: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.errors) {
        throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`)
      }

      return result.data?.productInfo || null
    } catch (error) {
      console.error('Shopee Affiliate API error:', error)
      throw error
    }
  }

  /**
   * Generate affiliate link for a product
   */
  async generateAffiliateLink(itemId: string, shopId: string): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = this.generateSignature(timestamp)

    const mutation = `
      mutation {
        generateAffiliateLink(itemId: "${itemId}", shopId: "${shopId}") {
          shortLink
          longLink
        }
      }
    `

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopee-App-Id': this.config.appId,
          'X-Shopee-Timestamp': timestamp.toString(),
          'X-Shopee-Signature': signature,
        },
        body: JSON.stringify({ query: mutation }),
      })

      if (!response.ok) {
        throw new Error(`Shopee API error: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.errors) {
        throw new Error(`GraphQL error: ${JSON.stringify(result.errors)}`)
      }

      return result.data?.generateAffiliateLink?.shortLink || ''
    } catch (error) {
      console.error('Shopee Affiliate API error:', error)
      throw error
    }
  }
}

export const shopeeAPI = new ShopeeAffiliateAPI()
export type { ShopeeProduct, ProductSearchParams }
