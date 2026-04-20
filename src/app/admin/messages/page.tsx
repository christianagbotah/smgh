'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Trash2, Eye, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useConfirm } from '@/hooks/useConfirm'

interface ContactMessage {
  id: string
  name: string
  phone: string
  email: string | null
  message: string
  read: boolean
  createdAt: string
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const fetchMessages = () => {
    fetch('/api/contact')
      .then(res => res.json())
      .then(data => { setMessages(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchMessages() }, [])

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read: true }),
      })
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, read: true } : null)
    } catch {
      // handle error
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Message',
      description: 'Are you sure you want to delete this message? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await fetch(`/api/contact?id=${id}`, { method: 'DELETE' })
      toast({ title: 'Deleted' })
      fetchMessages()
      if (selected?.id === id) setSelected(null)
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  const unread = messages.filter(m => !m.read).length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-gray-400 text-sm">Contact form submissions{unread > 0 && ` · ${unread} unread`}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* List */}
        <div className="md:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {loading ? (
            [...Array(5)].map((_, i) => <div key={i} className="glass rounded-xl p-3 animate-pulse h-16" />)
          ) : messages.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No messages yet</p>
            </div>
          ) : (
            messages.map(msg => (
              <button
                key={msg.id}
                onClick={() => { setSelected(msg); if (!msg.read) handleMarkRead(msg.id) }}
                className={`w-full text-left glass rounded-xl p-3 transition-colors ${selected?.id === msg.id ? 'border-smgh-teal/30' : ''} ${!msg.read ? 'border-l-2 border-l-smgh-teal' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm ${!msg.read ? 'text-white font-semibold' : 'text-gray-300'}`}>{msg.name}</p>
                  <p className="text-gray-500 text-xs">{new Date(msg.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-gray-400 text-xs truncate">{msg.message}</p>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="md:col-span-2">
          {selected ? (
            <div className="glass rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold text-lg">{selected.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selected.phone}</span>
                    {selected.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{selected.email}</span>}
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{new Date(selected.createdAt).toLocaleString()}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(selected.id)} className="text-gray-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-gray-200 leading-relaxed">{selected.message}</p>
              </div>
            </div>
          ) : (
            <div className="glass rounded-xl p-12 text-center">
              <Eye className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Select a message to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
