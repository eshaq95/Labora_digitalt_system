import { AlertTriangle, ArrowRight } from 'lucide-react'

type UnitConverterProps = {
  orderQuantity: number
  orderUnit: string
  baseUnit: string
  conversionFactor: number
  className?: string
}

export function UnitConverter({ 
  orderQuantity, 
  orderUnit, 
  baseUnit, 
  conversionFactor, 
  className = '' 
}: UnitConverterProps) {
  const baseQuantity = orderQuantity * conversionFactor
  const isConversionNeeded = orderUnit !== baseUnit && conversionFactor !== 1

  if (!isConversionNeeded) {
    return (
      <div className={`text-sm text-text-secondary ${className}`}>
        {orderQuantity} {baseUnit.toLowerCase()}
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Conversion Display */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <div className="font-medium text-blue-800 dark:text-blue-200">
            {orderQuantity} {orderUnit.toLowerCase()}
          </div>
          <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <div className="font-semibold text-blue-900 dark:text-blue-100">
            {baseQuantity} {baseUnit.toLowerCase()}
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="text-xs text-text-tertiary">
        Konvertering: 1 {orderUnit.toLowerCase()} = {conversionFactor} {baseUnit.toLowerCase()}
      </div>
    </div>
  )
}

type UnitWarningProps = {
  message: string
  className?: string
}

export function UnitWarning({ message, className = '' }: UnitWarningProps) {
  return (
    <div className={`flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg ${className}`}>
      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
      <div className="text-sm text-amber-800 dark:text-amber-200">
        <div className="font-medium mb-1">Vær oppmerksom på enheter</div>
        <div className="text-amber-700 dark:text-amber-300">
          {message}
        </div>
      </div>
    </div>
  )
}
