'use client'

import { useState, useEffect } from 'react'
import { Mail, Trash2, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface Subscriber {
  id: string
  email: string
  active: boolean
  createdAt: string
}

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [addEmail, setAddEmail] = useState('')
  const { toast } = useToast()

  const fetchSubscribers = () => {
    fetch('/api/newsletter')
      .then(res => res.json())
      .then(data => { setSubscribers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchSubscribers() }, [])

  const handleAdd = async () => {
    if (!addEmail || !addEmail.includes('@')) {
      toast({ title: 'Enter a valid email', variant: 'destructive' })
      return
    }
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail }),
      })
      toast({ title: 'Subscriber added' })
      setAddEmail('')
      fetchSubscribers()
    } catch {
      toast({ title: 'Failed to add', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this subscriber?')) return
    try {
      await fetch(`/api/newsletter?id=${id}`, { method: 'DELETE' })
      toast({ title: 'Removed' })
      fetchSubscribers()
    } catch {
      toast({ title: 'Failed to remove', variant: 'destructive' })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Newsletter</h1>
          <p className="text-gray-400 text-sm">{subscribers.filter(s => s.active).length} active subscribers</p>
        </div>
      </div>

      {/* Add Subscriber */}
      <div className="glass rounded-xl p-4 mb-6 flex gap-3">
        <Input
          placeholder="Add subscriber email"
          value={addEmail}
          onChange={e => setAddEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="flex-1 bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
        />
        <Button onClick={handleAdd} className="gradient-teal text-black">
          <UserPlus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="glass rounded-xl p-4 animate-pulse h-14" />)}</div>
      ) : subscribers.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No subscribers yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subscribers.map(sub => (
            <div key={sub.id} className="glass rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${sub.active ? 'bg-green-400' : 'bg-gray-500'}`} />
                <div>
                  <p className="text-white text-sm">{sub.email}</p>
                  <p className="text-gray-500 text-xs">{new Date(sub.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(sub.id)} className="text-gray-400 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
