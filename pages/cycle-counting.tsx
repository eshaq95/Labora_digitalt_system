import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLayout } from '@/components/layout/page-layout'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { motion } from 'framer-motion'
import { 
  Plus, ClipboardList, CheckCircle, Clock, AlertCircle, 
  Calendar, User, MapPin, Package, TrendingUp
} from 'lucide-react'

type CycleCountingSession = {
  id: string
  name: string
  description?: string
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED'
  plannedDate: string
  startedAt?: string
  completedAt?: string
  approvedAt?: string
  totalItems: number
  countedItems: number
  discrepancies: number
  location?: { name: string }
  category?: { name: string }
  department?: { name: string }
  planner: { name: string }
  counter?: { name: string }
  approver?: { name: string }
}

export default function CycleCountingPage() {
  const [sessions, setSessions] = useState<CycleCountingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    locationId: '',
    categoryId: '',
    departmentId: '',
    plannedDate: new Date().toISOString().split('T')[0],
    plannedBy: 'cm4gvr9sg0001i6yp0g2q8ey5' // I ekte app: fra session
  })
  const [locations, setLocations] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const { showToast } = useToast()

  useEffect(() => {
    fetchSessions()
    fetchReferenceData()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/cycle-counting')
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error('Kunne ikke hente varetellinger:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReferenceData = async () => {
    try {
      const [locationsRes, categoriesRes, departmentsRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/categories'),
        fetch('/api/departments')
      ])

      if (locationsRes.ok) {
        const locationsData = await locationsRes.json()
        setLocations(locationsData)
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }

      if (departmentsRes.ok) {
        const departmentsData = await departmentsRes.json()
        setDepartments(departmentsData)
      }
    } catch (error) {
      console.error('Kunne ikke hente referansedata:', error)
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showToast('error', 'Navn er påkrevd')
      return
    }

    try {
      const response = await fetch('/api/cycle-counting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          locationId: formData.locationId || undefined,
          categoryId: formData.categoryId || undefined,
          departmentId: formData.departmentId || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke opprette varetelling')
      }

      showToast('success', `Varetelling opprettet: ${data.totalItems} items`)
      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        locationId: '',
        categoryId: '',
        departmentId: '',
        plannedDate: new Date().toISOString().split('T')[0],
        plannedBy: 'cm4gvr9sg0001i6yp0g2q8ey5'
      })
      fetchSessions()

    } catch (error: any) {
      console.error('Feil ved opprettelse av varetelling:', error)
      showToast('error', error.message || 'Kunne ikke opprette varetelling')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNED': return <Clock className="w-4 h-4 text-blue-500" />
      case 'IN_PROGRESS': return <TrendingUp className="w-4 h-4 text-yellow-500" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'APPROVED': return <CheckCircle className="w-4 h-4 text-green-600" />
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'Planlagt'
      case 'IN_PROGRESS': return 'Pågår'
      case 'COMPLETED': return 'Fullført'
      case 'APPROVED': return 'Godkjent'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface rounded w-1/4"></div>
          <div className="h-32 bg-surface rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <PageLayout
      title="Varetelling"
      subtitle="Strukturert telling og justering av lagerbeholdning"
      actions={
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ny varetelling
        </Button>
      }
    >
      {/* Sessions Count */}
      <div className="text-sm text-text-secondary mb-6">
        {sessions.length} varetellinger totalt
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ClipboardList className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Ingen varetellinger</h3>
              <p className="text-text-secondary mb-4">Opprett din første varetelling for å begynne.</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Opprett varetelling
              </Button>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(session.status)}
                        <h3 className="text-lg font-semibold text-text-primary">
                          {session.name}
                        </h3>
                        <span className="text-sm text-text-secondary">
                          ({getStatusText(session.status)})
                        </span>
                      </div>
                      
                      {session.description && (
                        <p className="text-text-secondary mb-3">{session.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-text-tertiary" />
                          <span className="text-text-secondary">
                            {new Date(session.plannedDate).toLocaleDateString('nb-NO')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-text-tertiary" />
                          <span className="text-text-secondary">
                            {session.planner.name}
                          </span>
                        </div>

                        {session.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-text-tertiary" />
                            <span className="text-text-secondary">
                              {session.location.name}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-text-tertiary" />
                          <span className="text-text-secondary">
                            {session.totalItems} items
                          </span>
                        </div>
                      </div>

                      {/* Progress */}
                      {session.status !== 'PLANNED' && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-text-secondary">Fremdrift</span>
                            <span className="text-text-secondary">
                              {session.countedItems}/{session.totalItems}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ 
                                width: `${session.totalItems > 0 ? (session.countedItems / session.totalItems) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                          {session.discrepancies > 0 && (
                            <div className="text-sm text-amber-600 mt-1">
                              {session.discrepancies} avvik funnet
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/cycle-counting/${session.id}`, '_blank')}
                      >
                        Åpne
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Session Modal */}
      <Modal
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Opprett ny varetelling"
        size="md"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Navn <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="F.eks. Månedstelling Januar 2025"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Beskrivelse
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-bg-primary text-text-primary focus:ring-2 focus:ring-labora focus:border-transparent resize-none"
              placeholder="Beskrivelse av tellingen..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Lokasjon
              </label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg-primary text-text-primary focus:ring-2 focus:ring-labora focus:border-transparent"
              >
                <option value="">Alle lokasjoner</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Kategori
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg-primary text-text-primary focus:ring-2 focus:ring-labora focus:border-transparent"
              >
                <option value="">Alle kategorier</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Avdeling
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg-primary text-text-primary focus:ring-2 focus:ring-labora focus:border-transparent"
              >
                <option value="">Alle avdelinger</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Planlagt dato <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.plannedDate}
              onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateForm(false)}
            >
              Avbryt
            </Button>
            <Button type="submit">
              Opprett varetelling
            </Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  )
}
