import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Product = { id: string; name: string; stock: number }

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState('')
  const [stock, setStock] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/products', { cache: 'no-store' })
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError('Could not load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function addProduct(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, stock: Number(stock) }),
      })
      if (!res.ok) throw new Error('Failed to add')
      setName('')
      setStock(0)
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function removeProduct(id: string) {
    if (!confirm('Delete this product?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-800">
            Labora – Inventory
          </h1>
          <p className="text-gray-500">
            Manage products, stock and supply with clarity
          </p>
        </header>

        {/* Card for adding new product */}
        <Card className="shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Add Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={addProduct}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Input
                placeholder="Product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Stock"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                required
                className="w-32"
              />
              <Button
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                Add
              </Button>
            </form>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </CardContent>
        </Card>

        {/* Product Table */}
        <Card className="shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Product List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : products.length === 0 ? (
              <p className="text-gray-500">No products yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">{p.stock}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeProduct(p.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
