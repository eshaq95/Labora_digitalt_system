import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageLayout } from '@/components/layout/page-layout'
import { useToast } from '@/components/ui/toast'
import { Building2, MapPin, Mail, Phone, Globe } from 'lucide-react'

type CompanySettings = {
  id: string
  companyName: string
  organizationNumber?: string | null
  deliveryAddress?: string | null
  deliveryPostalCode?: string | null
  deliveryCity?: string | null
  deliveryCountry?: string | null
  invoiceAddress?: string | null
  invoicePostalCode?: string | null
  invoiceCity?: string | null
  invoiceCountry?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    companyName: '',
    organizationNumber: '',
    deliveryAddress: '',
    deliveryPostalCode: '',
    deliveryCity: '',
    deliveryCountry: 'Norge',
    invoiceAddress: '',
    invoicePostalCode: '',
    invoiceCity: '',
    invoiceCountry: 'Norge',
    phone: '',
    email: '',
    website: ''
  })

  async function loadSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/company-settings')
      const data = await res.json()
      setSettings(data)
      setFormData({
        companyName: data.companyName || '',
        organizationNumber: data.organizationNumber || '',
        deliveryAddress: data.deliveryAddress || '',
        deliveryPostalCode: data.deliveryPostalCode || '',
        deliveryCity: data.deliveryCity || '',
        deliveryCountry: data.deliveryCountry || 'Norge',
        invoiceAddress: data.invoiceAddress || '',
        invoicePostalCode: data.invoicePostalCode || '',
        invoiceCity: data.invoiceCity || '',
        invoiceCountry: data.invoiceCountry || 'Norge',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || ''
      })
    } catch {
      showToast('error', 'Kunne ikke laste innstillinger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSettings() }, [])

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    
    try {
      const res = await fetch('/api/company-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        showToast('success', 'Innstillinger lagret')
        await loadSettings()
      } else {
        showToast('error', 'Kunne ikke lagre innstillinger')
      }
    } catch {
      showToast('error', 'Noe gikk galt')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageLayout title="Bedriftsinnstillinger" subtitle="Administrer bedriftsinformasjon">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout 
      title="Bedriftsinnstillinger" 
      subtitle="Administrer bedriftsinformasjon og adresser"
    >
      <form onSubmit={saveSettings} className="space-y-6">
        {/* Grunnleggende bedriftsinformasjon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Bedriftsinformasjon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bedriftsnavn</label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Labora Digital"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Organisasjonsnummer</label>
                <Input
                  value={formData.organizationNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizationNumber: e.target.value }))}
                  placeholder="123 456 789"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leveringsadresse */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Leveringsadresse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Adresse</label>
              <Input
                value={formData.deliveryAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                placeholder="Laboratorieveien 1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Postnummer</label>
                <Input
                  value={formData.deliveryPostalCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryPostalCode: e.target.value }))}
                  placeholder="0123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Poststed</label>
                <Input
                  value={formData.deliveryCity}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryCity: e.target.value }))}
                  placeholder="Oslo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Land</label>
                <Input
                  value={formData.deliveryCountry}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryCountry: e.target.value }))}
                  placeholder="Norge"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fakturaadresse */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Fakturaadresse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Adresse</label>
              <Input
                value={formData.invoiceAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceAddress: e.target.value }))}
                placeholder="Laboratorieveien 1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Postnummer</label>
                <Input
                  value={formData.invoicePostalCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoicePostalCode: e.target.value }))}
                  placeholder="0123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Poststed</label>
                <Input
                  value={formData.invoiceCity}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceCity: e.target.value }))}
                  placeholder="Oslo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Land</label>
                <Input
                  value={formData.invoiceCountry}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceCountry: e.target.value }))}
                  placeholder="Norge"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kontaktinformasjon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Kontaktinformasjon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Telefon</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+47 12 34 56 78"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">E-post</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="post@labora.no"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nettside</label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://labora.no"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lagre-knapp */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="min-w-32">
            {saving ? 'Lagrer...' : 'Lagre innstillinger'}
          </Button>
        </div>
      </form>
    </PageLayout>
  )
}
