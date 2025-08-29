import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

type ImportResult = {
  success: boolean
  message: string
  results: {
    suppliers: number
    locations: number
    items: number
    errors: string[]
  }
}

type Props = {
  onImportComplete: () => void
}

export function ExcelImport({ onImportComplete }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      showToast('error', 'Kun Excel-filer (.xlsx, .xls) er støttet')
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        showToast('success', data.message)
        onImportComplete()
      } else {
        showToast('error', data.error || 'Import feilet')
      }
    } catch (error) {
      showToast('error', 'Kunne ikke laste opp fil')
      setResult({
        success: false,
        message: 'Upload failed',
        results: { suppliers: 0, locations: 0, items: 0, errors: ['Upload failed'] }
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function closeModal() {
    setModalOpen(false)
    setResult(null)
  }

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        variant="outline"
        className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
      >
        <Upload className="w-4 h-4 mr-2" />
        Import Excel
      </Button>

      <Modal open={modalOpen} onClose={closeModal} title="Import fra Excel" size="lg">
        <div className="space-y-6">
          {!result ? (
            <>
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <FileSpreadsheet className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Last opp Excel-fil</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  Filen skal ha kolonner: Varenavn, Leverandør, Lokasjon, Min. beholdning
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {uploading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                      />
                      Laster opp...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Velg Excel-fil
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Støtter .xlsx og .xls filer
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <h3 className="font-semibold">
                    {result.success ? 'Import fullført!' : 'Import feilet'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {result.message}
                  </p>
                </div>
              </div>

              {result.success && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Resultater:</h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• {result.results.items} varer importert</li>
                    <li>• {result.results.suppliers} leverandører opprettet</li>
                    <li>• {result.results.locations} lokasjoner opprettet</li>
                  </ul>
                </div>
              )}

              {result.results.errors.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Advarsler:</h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 max-h-40 overflow-y-auto">
                    {result.results.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={closeModal} className="flex-1">
                  Lukk
                </Button>
                <Button
                  onClick={() => {
                    setResult(null)
                    fileInputRef.current?.click()
                  }}
                  variant="outline"
                >
                  Import mer
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
