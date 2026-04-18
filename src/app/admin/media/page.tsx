'use client'

import { useState, useCallback, useEffect } from 'react'
import { Upload, Copy, Trash2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import MediaPicker from '@/components/MediaPicker'

interface MediaFile {
  id: string
  filename: string
  url: string
  mimeType: string
  size: number
  alt: string | null
  createdAt: string
}

export default function AdminMedia() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const fetchFiles = useCallback(() => {
    fetch('/api/media?limit=100')
      .then(r => r.json())
      .then(data => setFiles(data.files || []))
  }, [])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        toast({ title: 'File uploaded' })
        fetchFiles()
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }, [toast, fetchFiles])

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({ title: 'URL copied to clipboard' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file?')) return
    try {
      await fetch(`/api/media?id=${id}`, { method: 'DELETE' })
      toast({ title: 'File deleted' })
      fetchFiles()
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Media Library</h1>
          <p className="text-gray-400 text-sm">Upload and manage media files</p>
        </div>
        <label className="cursor-pointer">
          <Button asChild className="gradient-teal text-black">
            <span>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload'}
            </span>
          </Button>
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {/* Upload Area */}
      <div className="glass rounded-xl p-8 mb-6 text-center border-dashed border-2 border-gray-700 hover:border-smgh-teal/30 transition-colors">
        <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400 mb-2">Drag & drop files here or click to upload</p>
        <p className="text-gray-500 text-sm">Supports images and videos</p>
      </div>

      {/* Files Grid */}
      {files.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No media files uploaded yet</p>
          <p className="text-gray-500 text-sm mt-1">Upload your first file using the button above</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <div key={file.id} className="glass rounded-xl overflow-hidden group">
              <div className="aspect-square relative">
                {file.mimeType.startsWith('image/') ? (
                  <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2">
                  <button onClick={() => copyUrl(file.url)} className="p-2 rounded-lg bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(file.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-gray-300 text-xs truncate">{file.filename}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
