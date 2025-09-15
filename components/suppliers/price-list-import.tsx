import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface PriceListImportProps {
  supplierId: string
  supplierName: string
  onImportComplete?: () => void
}

export function PriceListImport({ supplierId, supplierName, onImportComplete }: PriceListImportProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [updateExisting, setUpdateExisting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<any>(null)
  const { showToast } = useToast()

  const expectedColumns = [
    { name: 'SKU', required: true, description: 'Produktkode/SKU (påkrevd)' },
    { name: 'Varenavn', required: true, description: 'Navn på produktet (påkrevd)' },
    { name: 'Pris', required: true, description: 'Forhandlet pris i NOK (påkrevd)' },
    { name: 'Listepris', required: false, description: 'Veiledende pris før rabatt' },
    { name: 'Avtale-referanse', required: false, description: 'F.eks. "Labforum 2025"' },
    { name: 'Rabattkode', required: false, description: 'Kode som må oppgis ved bestilling' },
    { name: 'Min. antall', required: false, description: 'Minimum bestillingsantall' },
    { name: 'Gyldig til', required: false, description: 'Når prisen utløper (DD.MM.YYYY)' },
    { name: 'Primær leverandør', required: false, description: 'Ja/Nei - om dette er hovedleverandør' },
    { name: 'Sist verifisert', required: false, description: 'Når prisen sist ble bekreftet' },
    { name: 'Notater', required: false, description: 'Tilleggsnotater' }
  ]

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) return

    setImporting(true)
    setImportResults(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('supplierId', supplierId)
      formData.append('updateExisting', updateExisting.toString())

      const response = await fetch('/api/supplier-items/import', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setImportResults(result)
        showToast('success', result.message)
        if (onImportComplete) {
          onImportComplete()
        }
      } else {
        showToast('error', result.error || 'Import feilet')
        setImportResults(result)
      }
    } catch (error) {
      showToast('error', 'Kunne ikke importere prisliste')
    } finally {
      setImporting(false)
    }
  }

  function resetForm() {
    setSelectedFile(null)
    setUpdateExisting(false)
    setImportResults(null)
  }

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Upload className="w-4 h-4" />
        Importer prisliste
      </Button>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          resetForm()
        }}
        title={`Importer prisliste - ${supplierName}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Slik importerer du prislister effektivt
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                  <p>
                    <strong>1. Be leverandøren om Excel/CSV-format:</strong> I stedet for PDF, 
                    be om prislisten i Excel eller CSV-format for rask import.
                  </p>
                  <p>
                    <strong>2. Strukturer dataene:</strong> Sørg for at filen har riktige kolonnenavn 
                    (se tabellen under).
                  </p>
                  <p>
                    <strong>3. Inkluder avtaleinfo:</strong> Legg til avtale-referanse og utløpsdato 
                    for automatisk varsling.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Expected columns */}
          <div>
            <h4 className="font-semibold mb-3">Forventede kolonner i Excel/CSV-filen:</h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {expectedColumns.map((col, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className={`font-mono px-2 py-1 rounded text-xs ${
                      col.required 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {col.name}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">
                      {col.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Import form */}
          {!importResults ? (
            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Velg Excel/CSV-fil
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".xlsx,.xls,.csv"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Støttede formater: Excel (.xlsx, .xls) og CSV (.csv)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="updateExisting"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="updateExisting" className="text-sm">
                  Oppdater eksisterende priser (overskriver eksisterende data)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setModalOpen(false)
                    resetForm()
                  }}
                >
                  Avbryt
                </Button>
                <Button type="submit" disabled={importing || !selectedFile}>
                  {importing ? 'Importerer...' : 'Start import'}
                </Button>
              </div>
            </form>
          ) : (
            /* Import results */
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold">Import fullført</h4>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {importResults.results?.created || 0}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Nye priser
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResults.results?.updated || 0}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Oppdaterte
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {importResults.results?.processed || 0}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Totalt behandlet
                  </div>
                </div>
              </div>

              {importResults.results?.errors?.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <h5 className="font-medium text-red-800 dark:text-red-200">
                      Feil under import ({importResults.results.errors.length})
                    </h5>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {importResults.results.errors.map((error: string, index: number) => (
                      <div key={index} className="text-sm text-red-700 dark:text-red-300">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  onClick={() => {
                    setModalOpen(false)
                    resetForm()
                  }}
                >
                  Ferdig
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
