import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { Plus, User, Mail, Phone, Star, Edit, Trash2 } from 'lucide-react'

type ContactPerson = {
  id: string
  name: string
  role?: string | null
  email?: string | null
  phone?: string | null
  isPrimary: boolean
}

type Props = {
  supplierId: string
  contacts: ContactPerson[]
  onUpdate: () => void
}

export function SupplierContacts({ supplierId, contacts, onUpdate }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<ContactPerson | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    isPrimary: false
  })
  const { showToast } = useToast()

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      email: '',
      phone: '',
      isPrimary: false
    })
    setEditingContact(null)
  }

  const openCreate = () => {
    resetForm()
    setShowModal(true)
  }

  const openEdit = (contact: ContactPerson) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name,
      role: contact.role || '',
      email: contact.email || '',
      phone: contact.phone || '',
      isPrimary: contact.isPrimary
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingContact 
        ? `/api/suppliers/${supplierId}/contacts/${editingContact.id}`
        : `/api/suppliers/${supplierId}/contacts`
      
      const method = editingContact ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error()

      showToast('success', editingContact ? 'Kontakt oppdatert' : 'Kontakt opprettet')
      setShowModal(false)
      resetForm()
      onUpdate()
    } catch {
      showToast('error', 'Kunne ikke lagre kontakt')
    }
  }

  const handleDelete = async (contactId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne kontakten?')) return

    try {
      const response = await fetch(`/api/suppliers/${supplierId}/contacts/${contactId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error()

      showToast('success', 'Kontakt slettet')
      onUpdate()
    } catch {
      showToast('error', 'Kunne ikke slette kontakt')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Kontaktpersoner</h3>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Legg til kontakt
        </Button>
      </div>

      <div className="space-y-2">
        {contacts.length === 0 ? (
          <p className="text-gray-500 text-sm">Ingen kontaktpersoner registrert</p>
        ) : (
          contacts.map(contact => (
            <div key={contact.id} className="border rounded-lg p-3 bg-white dark:bg-gray-800">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{contact.name}</span>
                    {contact.isPrimary && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  {contact.role && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {contact.role}
                    </p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm">
                    {contact.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => openEdit(contact)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(contact.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingContact ? 'Rediger kontakt' : 'Ny kontakt'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Navn *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Fornavn Etternavn"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Rolle</label>
            <Input
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              placeholder="F.eks. Salgsansvarlig, Teknisk support"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">E-post</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="navn@firma.no"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telefon</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+47 123 45 678"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={formData.isPrimary}
              onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="isPrimary" className="text-sm">
              Primær kontaktperson
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {editingContact ? 'Oppdater' : 'Opprett'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
            >
              Avbryt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
