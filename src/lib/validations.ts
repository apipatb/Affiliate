import { z } from 'zod'

// Product validation schema
export const productSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description is too long'),
  price: z.union([
    z.number().positive('Price must be positive'),
    z.string().transform((val) => {
      const parsed = parseFloat(val)
      if (isNaN(parsed)) throw new Error('Invalid price format')
      if (parsed <= 0) throw new Error('Price must be positive')
      return parsed
    })
  ]),
  affiliateUrl: z.string().url('Invalid affiliate URL').min(1, 'Affiliate URL is required'),
  imageUrl: z.string().min(1, 'Image URL is required'),
  categoryId: z.string().cuid('Invalid category ID'),
  featured: z.boolean().optional().default(false),
  mediaType: z.enum(['IMAGE', 'VIDEO']).optional().default('IMAGE'),
})

export const productUpdateSchema = productSchema.partial()

// Category validation schema
export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
})

export const categoryUpdateSchema = categorySchema.partial()

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
})

// Helper function to validate and return formatted errors
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors: Record<string, string[]> = {}
  result.error.errors.forEach((err) => {
    const path = err.path.join('.')
    if (!errors[path]) {
      errors[path] = []
    }
    errors[path].push(err.message)
  })

  return { success: false, errors }
}
