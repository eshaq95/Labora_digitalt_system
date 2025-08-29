import { AlertTriangle, Info } from 'lucide-react'

interface OrderInstructionsAlertProps {
  codes: (string | null | undefined)[]
  instructions?: string | null
  supplierName: string
}

export function OrderInstructionsAlert({ codes, instructions, supplierName }: OrderInstructionsAlertProps) {
  const validCodes = codes.filter((code): code is string => Boolean(code?.trim()))

  if (validCodes.length === 0 && !instructions?.trim()) return null

  return (
    <div className="p-4 mb-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-r-lg" role="alert">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-red-900 dark:text-red-100">
            ⚠️ VIKTIG: Instruksjoner for {supplierName}
          </p>
          
          {instructions?.trim() && (
            <div className="mt-2 p-2 bg-red-100 dark:bg-red-800/30 rounded text-sm">
              <Info className="w-4 h-4 inline mr-1" />
              {instructions}
            </div>
          )}
          
          {validCodes.length > 0 && (
            <div className="mt-3">
              <p className="font-medium mb-2">Husk å oppgi følgende koder/referanser:</p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                {validCodes.map((code, index) => (
                  <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <code className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {code}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
