import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/auth-middleware'
import { NextResponse, NextRequest } from 'next/server'

// Get current inventory status with filtering options
export const GET = requireAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')
    const locationId = searchParams.get('locationId')
    const lowStock = searchParams.get('lowStock') === 'true'
    const expiringSoon = searchParams.get('expiringSoon') === 'true'
    const search = searchParams.get('search')
    
    const where: any = {
      quantity: { gt: 0 }, // Only show items with stock
    }
    
    if (itemId) {
      where.itemId = itemId
    }
    
    if (locationId) {
      where.locationId = locationId
    }
    
    if (expiringSoon) {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      where.expiryDate = {
        lte: thirtyDaysFromNow,
        not: null,
      }
    }

    // Add search functionality
    if (search) {
      where.OR = [
        { item: { name: { contains: search, mode: 'insensitive' } } },
        { item: { sku: { contains: search, mode: 'insensitive' } } },
        { location: { name: { contains: search, mode: 'insensitive' } } },
        { lotNumber: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = (page - 1) * limit
    
    let inventoryLots: any[] = []
    let totalCount = 0
    
    // Handle low stock filtering differently - filter first, then paginate
    if (lowStock) {
      // Calculate total stock per item to identify low stock items
      const itemTotals = new Map<string, number>()
      const allLots = await prisma.inventoryLot.findMany({
        where: { quantity: { gt: 0 } },
        include: { item: { select: { id: true, minStock: true } } }
      })
      
      allLots.forEach(lot => {
        const current = itemTotals.get(lot.item.id) || 0
        itemTotals.set(lot.item.id, current + lot.quantity)
      })
      
      // Get IDs of items with low total stock
      const lowStockItemIds: string[] = []
      allLots.forEach(lot => {
        const totalStock = itemTotals.get(lot.item.id) || 0
        if (totalStock <= lot.item.minStock && !lowStockItemIds.includes(lot.item.id)) {
          lowStockItemIds.push(lot.item.id)
        }
      })
      
      console.log(`🔍 Debug inventory: Found ${lowStockItemIds.length} low stock items`)
      
      // Add low stock filter to where clause
      where.itemId = { in: lowStockItemIds }
      
      // Now get total count and paginated results with the low stock filter applied
      totalCount = await prisma.inventoryLot.count({ where })
      
      inventoryLots = await prisma.inventoryLot.findMany({
        where,
        skip,
        take: limit,
        include: {
          item: {
            select: {
              id: true,
              sku: true,
              name: true,
              barcode: true,
              category: { select: { name: true } },
              minStock: true,
              expiryTracking: true,
              hazardous: true,
              barcodes: {
                select: {
                  barcode: true,
                  type: true,
                  isPrimary: true
                }
              }
            }
          },
          location: {
            select: {
              id: true,
              name: true,
              type: true,
            }
          }
        },
        orderBy: [
          { expiryDate: 'asc' },
          { item: { name: 'asc' } },
        ]
      })
      
      console.log(`📊 Debug inventory: Total low stock lots: ${totalCount}, Showing: ${inventoryLots.length}`)
      
      // For low stock, we need to calculate total units across ALL lots, not just current page
      const allFilteredLots = await prisma.inventoryLot.findMany({
        where,
        select: { quantity: true }
      })
      const totalUnitsAllPages = allFilteredLots.reduce((sum, lot) => sum + lot.quantity, 0)
      
      return NextResponse.json({
        lots: inventoryLots,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1,
          totalUnits: totalUnitsAllPages
        }
      })
    } else {
      // Normal flow for non-low-stock requests
      totalCount = await prisma.inventoryLot.count({ where })
      
      inventoryLots = await prisma.inventoryLot.findMany({
        where,
        skip,
        take: limit,
        include: {
          item: {
            select: {
              id: true,
              sku: true,
              name: true,
              barcode: true,
              category: { select: { name: true } },
              minStock: true,
              expiryTracking: true,
              hazardous: true,
              barcodes: {
                select: {
                  barcode: true,
                  type: true,
                  isPrimary: true
                }
              }
            }
          },
          location: {
            select: {
              id: true,
              name: true,
              type: true,
            }
          }
        },
        orderBy: [
          { expiryDate: 'asc' },
          { item: { name: 'asc' } },
        ]
      })
      
      // For normal requests, calculate total units across ALL lots
      const allFilteredLots = await prisma.inventoryLot.findMany({
        where,
        select: { quantity: true }
      })
      const totalUnitsAllPages = allFilteredLots.reduce((sum, lot) => sum + lot.quantity, 0)
      
      return NextResponse.json({
        lots: inventoryLots,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1,
          totalUnits: totalUnitsAllPages
        }
      })
    }
  } catch (error) {
    console.error('Error fetching inventory:', error)
      return NextResponse.json({
        error: 'Kunne ikke hente lagerstatus'
      }, { status: 500 })
  }
})
