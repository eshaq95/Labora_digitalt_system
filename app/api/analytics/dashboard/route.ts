import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-nextauth-middleware'
import { prisma } from '@/lib/prisma'

export const GET = requireAuth(async (req) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Parallel queries for better performance
    const [
      totalItems,
      totalInventoryValue,
      lowStockItems,
      expiringSoonItems,
      recentReceipts,
      recentConsumption,
      topCategories,
      inventoryTurnover,
      monthlyTrends,
      departmentUsage,
    ] = await Promise.all([
      // Total items count
      prisma.item.count({ where: { isActive: true } }),

      // Total inventory value
      prisma.inventoryLot.aggregate({
        _sum: { quantity: true },
        where: { quantity: { gt: 0 } },
      }),

      // Low stock items
      prisma.item.count({
        where: {
          isActive: true,
          lots: {
            some: {
              quantity: { gt: 0 },
            },
          },
          OR: [
            {
              lots: {
                every: {
                  quantity: { lte: prisma.item.fields.minStock },
                },
              },
            },
          ],
        },
      }),

      // Items expiring in next 30 days
      prisma.inventoryLot.count({
        where: {
          quantity: { gt: 0 },
          expiryDate: {
            gte: now,
            lte: thirtyDaysAgo,
          },
        },
      }),

      // Recent receipts (last 7 days)
      prisma.receipt.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
      }),

      // Recent consumption (last 7 days)
      prisma.inventoryTransaction.count({
        where: {
          type: 'CONSUMPTION',
          createdAt: { gte: sevenDaysAgo },
        },
      }),

      // Top categories by item count
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          color: true,
          _count: {
            select: {
              items: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: {
          items: {
            _count: 'desc',
          },
        },
        take: 5,
      }),

      // Inventory turnover calculation
      prisma.inventoryTransaction.groupBy({
        by: ['type'],
        _sum: {
          quantity: true,
        },
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // Monthly trends (last 6 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          type,
          COUNT(*) as count,
          SUM(quantity) as total_quantity
        FROM inventory_transactions 
        WHERE created_at >= ${new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE_TRUNC('month', created_at), type
        ORDER BY month DESC
      `,

      // Department usage
      prisma.department.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              items: true,
              consumptions: {
                where: {
                  createdAt: { gte: thirtyDaysAgo },
                },
              },
            },
          },
        },
        orderBy: {
          consumptions: {
            _count: 'desc',
          },
        },
        take: 10,
      }),
    ])

    // Calculate inventory turnover rate
    const receipts = inventoryTurnover.find(t => t.type === 'RECEIPT')?._sum.quantity || 0
    const consumption = inventoryTurnover.find(t => t.type === 'CONSUMPTION')?._sum.quantity || 0
    const turnoverRate = receipts > 0 ? (consumption / receipts) * 100 : 0

    // Process monthly trends
    const processedTrends = (monthlyTrends as any[]).reduce((acc, trend) => {
      const month = new Date(trend.month).toISOString().slice(0, 7) // YYYY-MM format
      if (!acc[month]) {
        acc[month] = { month, receipts: 0, consumption: 0, adjustments: 0 }
      }
      acc[month][trend.type.toLowerCase()] = Number(trend.total_quantity)
      return acc
    }, {})

    const dashboard = {
      overview: {
        totalItems,
        totalInventoryValue: totalInventoryValue._sum.quantity || 0,
        lowStockItems,
        expiringSoonItems,
        turnoverRate: Math.round(turnoverRate * 100) / 100,
      },
      recentActivity: {
        receipts: recentReceipts,
        consumption: recentConsumption,
        period: '7 days',
      },
      topCategories: topCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        itemCount: cat._count.items,
      })),
      monthlyTrends: Object.values(processedTrends),
      departmentUsage: departmentUsage.map(dept => ({
        id: dept.id,
        name: dept.name,
        itemCount: dept._count.items,
        consumptionCount: dept._count.consumptions,
      })),
      alerts: {
        lowStock: lowStockItems,
        expiringSoon: expiringSoonItems,
        criticalAlerts: lowStockItems + expiringSoonItems,
      },
    }

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Dashboard analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    )
  }
})
