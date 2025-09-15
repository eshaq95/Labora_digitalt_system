import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { motion } from 'framer-motion'
import { 
  Upload, FileText, Download, Trash2, Calendar, 
  AlertTriangle, CheckCircle, ExternalLink, Plus,
  File, FileSpreadsheet, Image
} from 'lucide-react'

type Attachment = {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  description?: string
  category: 'CONTRACT' | 'PRICE_LIST' | 'CERTIFICATE' | 'MANUAL' | 'OTHER'
  validUntil?: string
  agreementReference?: string
  uploader?: {
    name: string
    email: string
  }
  createdAt: string
}

interface SupplierAttachmentsProps {
  supplierId: string
}

const categoryLabels = {
  CONTRACT: 'Kontrakt/Avtale',
  PRICE_LIST: 'Prisliste',
  CERTIFICATE: 'Sertifikat',
  MANUAL: 'Manual',
  OTHER: 'Annet'
}

const categoryColors = {
  CONTRACT: 'bg-blue-100 text-blue-800 border-blue-200',
  PRICE_LIST: 'bg-green-100 text-green-800 border-green-200',
  CERTIFICATE: 'bg-purple-100 text-purple-800 border-purple-200',
  MANUAL: 'bg-orange-100 text-orange-800 border-orange-200',
  OTHER: 'bg-gray-100 text-gray-800 border-gray-200'
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-600" />
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-5 h-5 text-green-600" />
  if (mimeType.includes('image')) return <Image className="w-5 h-5 text-blue-600" />
  return <File className="w-5 h-5 text-gray-600" />
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function isExpiringSoon(validUntil?: string): boolean {
  if (!validUntil) return false
  const expiryDate = new Date(validUntil)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date()
}

function isExpired(validUntil?: string): boolean {
  if (!validUntil) return false
  return new Date(validUntil) < new Date()
}

export function SupplierAttachments({ supplierId }: SupplierAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { showToast } = useToast()

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('OTHER')
  const [validUntil, setValidUntil] = useState('')
  const [agreementReference, setAgreementReference] = useState('')

  useEffect(() => {
    loadAttachments()
  }, [supplierId])

  async function loadAttachments() {
    setLoading(true)
    try {
      const response = await fetch(`/api/suppliers/${supplierId}/attachments`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      }
    } catch (error) {
      showToast('error', 'Kunne ikke laste vedlegg')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('description', description)
      formData.append('category', category)
      if (validUntil) formData.append('validUntil', validUntil)
      if (agreementReference) formData.append('agreementReference', agreementReference)

      const response = await fetch(`/api/suppliers/${supplierId}/attachments`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        showToast('success', 'Vedlegg lastet opp')
        setUploadModalOpen(false)
        resetForm()
        await loadAttachments()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Kunne ikke laste opp vedlegg')
      }
    } catch (error) {
      showToast('error', 'Kunne ikke laste opp vedlegg')
    } finally {
      setUploading(false)
    }
  }

  function resetForm() {
    setSelectedFile(null)
    setDescription('')
    setCategory('OTHER')
    setValidUntil('')
    setAgreementReference('')
  }

  async function deleteAttachment(id: string) {
    if (!confirm('Er du sikker på at du vil slette dette vedlegget?')) return

    try {
      const response = await fetch(`/api/suppliers/${supplierId}/attachments/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        showToast('success', 'Vedlegg slettet')
        await loadAttachments()
      } else {
        showToast('error', 'Kunne ikke slette vedlegg')
      }
    } catch (error) {
      showToast('error', 'Kunne ikke slette vedlegg')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Avtaler og Dokumenter</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last opp kontrakter, prislister og andre viktige dokumenter
          </p>
        </div>
        <Button onClick={() => setUploadModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Last opp dokument
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      ) : attachments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Ingen dokumenter ennå
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              Last opp avtaler, prislister og andre viktige dokumenter for denne leverandøren.
            </p>
            <Button onClick={() => setUploadModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Last opp første dokument
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {attachments.map((attachment, index) => (
            <motion.div
              key={attachment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`${
                isExpired(attachment.validUntil) 
                  ? 'border-red-200 bg-red-50 dark:bg-red-900/10' 
                  : isExpiringSoon(attachment.validUntil)
                  ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/10'
                  : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getFileIcon(attachment.mimeType)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {attachment.originalName}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                            categoryColors[attachment.category]
                          }`}>
                            {categoryLabels[attachment.category]}
                          </span>
                        </div>
                        
                        {attachment.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {attachment.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatFileSize(attachment.size)}</span>
                          <span>Lastet opp {new Date(attachment.createdAt).toLocaleDateString('no-NO')}</span>
                          {attachment.uploader && (
                            <span>av {attachment.uploader.name}</span>
                          )}
                        </div>
                        
                        {attachment.agreementReference && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              Avtale: {attachment.agreementReference}
                            </span>
                          </div>
                        )}
                        
                        {attachment.validUntil && (
                          <div className="flex items-center gap-1 mt-2">
                            <Calendar className="w-3 h-3" />
                            <span className={`text-xs ${
                              isExpired(attachment.validUntil)
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : isExpiringSoon(attachment.validUntil)
                                ? 'text-amber-600 dark:text-amber-400 font-medium'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {isExpired(attachment.validUntil) 
                                ? 'Utløpt ' 
                                : isExpiringSoon(attachment.validUntil)
                                ? 'Utløper snart: '
                                : 'Gyldig til: '
                              }
                              {new Date(attachment.validUntil).toLocaleDateString('no-NO')}
                            </span>
                            {isExpired(attachment.validUntil) && (
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                            )}
                            {isExpiringSoon(attachment.validUntil) && !isExpired(attachment.validUntil) && (
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(attachment.url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAttachment(attachment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        open={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false)
          resetForm()
        }}
        title="Last opp dokument"
        size="lg"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Velg fil
            </label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Tillatte formater: PDF, Word, Excel, CSV, JPEG, PNG (maks 10MB)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Beskrivelse (valgfri)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivelse av dokumentet..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Avtale-referanse (valgfri)
            </label>
            <Input
              value={agreementReference}
              onChange={(e) => setAgreementReference(e.target.value)}
              placeholder="F.eks. 'Labforum 2025', 'Rammeavtale VWR'"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Gyldig til (valgfri)
            </label>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUploadModalOpen(false)
                resetForm()
              }}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={uploading || !selectedFile}>
              {uploading ? 'Laster opp...' : 'Last opp'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
