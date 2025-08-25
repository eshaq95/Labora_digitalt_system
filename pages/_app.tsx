// Import global styles
import '@/styles/globals.css'
import type { AppProps } from 'next/app'

// Specify that this route should run on Node.js runtime.
export const runtime = 'nodejs'

// Import Next.js request type and Prisma client instance.
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Define the context type for route handlers, extracting the product ID from params.
type Ctx = { params: { id: string } }

/**
 * PATCH handler to update a product's name or stock.
 * - Reads the product ID from params.
 * - Parses the request body for updated fields.
 * - Updates the product in the database.
 * - Returns the updated product or a 404 error if not found.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = params
  // Parse request body safely.
  const body = await req.json().catch(() => ({}))
  // Prepare update data, only including valid fields.
  const data: { name?: string; stock?: number } = {}
  if (typeof body.name === 'string') data.name = body.name.trim()
  if (typeof body.stock === 'number') data.stock = body.stock

  try {
    // Attempt to update the product in the database.
    const updated = await prisma.product.update({ where: { id }, data })
    return Response.json(updated)
  } catch {
    // Return 404 if product not found.
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

/**
 * DELETE handler to remove a product by ID.
 * - Reads the product ID from params.
 * - Deletes the product from the database.
 * - Returns 204 on success or 404 if not found.
 */
export async function DELETE(_: NextRequest, { params }: Ctx) {
  const { id } = params
  try {
    await prisma.product.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
