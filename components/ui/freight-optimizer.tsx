import { Truck, CheckCircle, TrendingUp } from 'lucide-react'

interface FreightOptimizerProps {
  orderTotal: number
  supplier: {
    name: string
    freeShippingThreshold?: number | null
    standardShippingCost?: number | null
    shippingNotes?: string | null
  }
}

export function FreightOptimizer({ orderTotal, supplier }: FreightOptimizerProps) {
  const threshold = supplier.freeShippingThreshold ? Number(supplier.freeShippingThreshold) : null
  const shippingCost = supplier.standardShippingCost ? Number(supplier.standardShippingCost) : null

  if (!threshold) {
    return supplier.shippingNotes ? (
      <div className="p-3 text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Truck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium mb-1">Fraktinformasjon</p>
            <p>{supplier.shippingNotes}</p>
          </div>
        </div>
      </div>
    ) : null
  }

  if (orderTotal >= threshold) {
    return (
      <div className="p-4 text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold">✅ Gratis frakt oppnådd!</p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Ordresum {orderTotal.toFixed(2)} kr ≥ {threshold.toFixed(2)} kr
              {shippingCost && ` (Spart: ${shippingCost.toFixed(2)} kr)`}
            </p>
          </div>
        </div>
        {supplier.shippingNotes && (
          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
            {supplier.shippingNotes}
          </div>
        )}
      </div>
    )
  }

  const remaining = threshold - orderTotal
  const costText = shippingCost ? `${shippingCost.toFixed(2)} kr` : 'Ukjent kostnad'
  const savingsPercentage = shippingCost && remaining > 0 ? Math.round((shippingCost / remaining) * 100) : 0

  return (
    <div className="p-4 text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold mb-2">💡 Fraktoptimalisering</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Nåværende ordresum:</span>
              <span className="font-mono font-medium">{orderTotal.toFixed(2)} kr</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Gratis frakt fra:</span>
              <span className="font-mono font-medium">{threshold.toFixed(2)} kr</span>
            </div>
            <div className="border-t border-blue-200 dark:border-blue-700 pt-2">
              <div className="flex items-center justify-between font-medium">
                <span>Kjøp for <strong>{remaining.toFixed(2)} kr</strong> mer</span>
                <span className="text-blue-600 dark:text-blue-400">
                  Spar {costText}
                  {savingsPercentage > 0 && ` (${savingsPercentage}%)`}
                </span>
              </div>
            </div>
          </div>
          
          {supplier.shippingNotes && (
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-800/30 rounded text-xs">
              <strong>Fraktinfo:</strong> {supplier.shippingNotes}
            </div>
          )}
          
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            💡 Vurder å legge til flere varer for å optimalisere frakten
          </p>
        </div>
      </div>
    </div>
  )
}
