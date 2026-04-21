'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Upload, ImageIcon, Link2, X, Search, Grid3X3, Check,
  FolderOpen, Loader2, AlertCircle, Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface MediaFile {
  id: string
  filename: string
  url: string
  mimeType: string
  size: number
  alt: string | null
  createdAt: string
}

interface MediaPickerProps {
  value: string
  onChange: (url: string) => void
  label?: string
  /** Preview height class - default h-32 */
  previewHeight?: string
  /** Accept file types for upload, default 'image/*' */
  accept?: string
}

export default function MediaPicker({
  value,
  onChange,
  label = 'Image',
  previewHeight = 'h-32',
  accept = 'image/*',
}: MediaPickerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'browse' | 'upload' | 'url'>('browse')
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const { toast } = useToast()

  // Fetch media library when dialog opens
  const fetchMedia = useCallback(async (search = '') => {
    setLoadingMedia(true)
    try {
      const params = new URLSearchParams({ limit: '60' })
      if (search) params.set('search', search)
      if (accept === 'image/*') params.set('type', 'image')
      const res = await fetch(`/api/media?${params}`)
      const data = await res.json()
      setMediaFiles(data.files || [])
    } catch {
      toast({ title: 'Failed to load media library', variant: 'destructive' })
    } finally {
      setLoadingMedia(false)
    }
  }, [accept, toast])

  useEffect(() => {
    if (dialogOpen && activeTab === 'browse') {
      fetchMedia()
    }
  }, [dialogOpen, activeTab, fetchMedia])

  // Search debounce
  useEffect(() => {
    if (!dialogOpen || activeTab !== 'browse') return
    const timer = setTimeout(() => {
      fetchMedia(searchQuery)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery, dialogOpen, activeTab, fetchMedia])

  // Upload handler
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', label)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        onChange(data.url)
        toast({ title: 'Image uploaded and selected' })
        setDialogOpen(false)
        // Refresh media library
        fetchMedia()
      } else {
        toast({ title: 'Upload failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // Select from library
  const handleSelectMedia = (file: MediaFile) => {
    onChange(file.url)
    toast({ title: 'Image selected' })
    setDialogOpen(false)
  }

  // Submit external URL
  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast({ title: 'Please enter a URL', variant: 'destructive' })
      return
    }
    onChange(urlInput.trim())
    toast({ title: 'Image selected from URL' })
    setDialogOpen(false)
    setUrlInput('')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div>
      {/* Label */}
      {label && (
        <label className="text-gray-400 text-xs mb-2 block">{label}</label>
      )}

      {/* Current Preview + Trigger */}
      <div className="flex items-start gap-3">
        {/* Preview area */}
        <div className={`relative ${previewHeight} flex-1 rounded-xl overflow-hidden border border-gray-700 bg-white/5 group`}>
          {value ? (
            <>
              <img
                src={value}
                alt={label}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                  ;(e.target as HTMLImageElement).parentElement!.innerHTML = `
                    <div class="flex items-center justify-center h-full text-gray-500">
                      <div class="text-center">
                        <AlertCircle class="w-6 h-6 mx-auto mb-1" />
                        <p class="text-xs">Image not found</p>
                      </div>
                    </div>
                  `
                }}
              />
              {/* Remove button */}
              <button
                onClick={() => onChange('')}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600">
              <div className="text-center">
                <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                <p className="text-xs opacity-50">No image selected</p>
              </div>
            </div>
          )}
        </div>

        {/* URL display + Open picker */}
        <div className="flex flex-col gap-2 w-52 flex-shrink-0">
          <Input
            placeholder="Image URL"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-white/5 border-gray-700 text-white text-xs h-8"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDialogOpen(true)
              setUrlInput(value)
            }}
            className="border-gray-700 text-gray-300 hover:text-white hover:bg-white/10 h-8 text-xs gap-1.5"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            Select Media
          </Button>
        </div>
      </div>

      {/* ─── MEDIA PICKER DIALOG ─── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) {
          setSearchQuery('')
          setActiveTab('browse')
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden bg-[#1a1a1a] border-gray-800 text-white flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-green-400" />
              Select Media
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose an image from your media library, upload a new one, or paste an external URL.
            </DialogDescription>
          </DialogHeader>

          {/* Tab buttons */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl mt-2">
            {[
              { key: 'browse' as const, label: 'Media Library', icon: FolderOpen },
              { key: 'upload' as const, label: 'Upload File', icon: Upload },
              { key: 'url' as const, label: 'From URL', icon: Link2 },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto mt-2 min-h-0">
            {/* BROWSE TAB */}
            {activeTab === 'browse' && (
              <div>
                {/* Search bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search files by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-gray-700 text-white"
                  />
                </div>

                {/* Loading */}
                {loadingMedia ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                  </div>
                ) : mediaFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FolderOpen className="w-12 h-12 text-gray-600 mb-3" />
                    <p className="text-gray-400 mb-1">
                      {searchQuery ? 'No files match your search' : 'Your media library is empty'}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {searchQuery
                        ? 'Try a different search term'
                        : 'Upload files to build your media library'}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={() => setActiveTab('upload')}
                        variant="outline"
                        className="mt-4 border-gray-700 text-gray-300"
                      >
                        <Upload className="w-4 h-4 mr-2" /> Upload Files
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {mediaFiles.map(file => (
                      <button
                        key={file.id}
                        onClick={() => handleSelectMedia(file)}
                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] ${
                          value === file.url
                            ? 'border-green-500 ring-2 ring-green-500/20'
                            : 'border-gray-700 hover:border-gray-500'
                        }`}
                        title={file.filename}
                      >
                        {file.mimeType.startsWith('image/') ? (
                          <img
                            src={file.url}
                            alt={file.alt || file.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-500" />
                          </div>
                        )}

                        {/* Selected overlay */}
                        {value === file.url && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}

                        {/* Hover info */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-end">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 w-full">
                            <p className="text-white text-xs truncate">{file.filename}</p>
                            <p className="text-gray-400 text-[10px]">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* UPLOAD TAB */}
            {activeTab === 'upload' && (
              <div className="flex flex-col items-center justify-center py-12">
                <label className="cursor-pointer w-full max-w-md">
                  <div className="border-2 border-dashed border-gray-700 hover:border-green-500/40 rounded-2xl p-12 text-center transition-colors">
                    {uploading ? (
                      <>
                        <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto mb-4" />
                        <p className="text-gray-300">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-300 mb-1">Click to upload a file</p>
                        <p className="text-gray-500 text-sm">
                          Images will be uploaded and automatically selected
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>
                <p className="text-gray-500 text-xs mt-4">
                  Accepted: images (JPG, PNG, GIF, WebP, SVG)
                </p>
              </div>
            )}

            {/* URL TAB */}
            {activeTab === 'url' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Link2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-300 mb-6">Paste an external image URL</p>
                <div className="flex gap-3 w-full max-w-md">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                    className="bg-white/5 border-gray-700 text-white"
                  />
                  <Button
                    onClick={handleUrlSubmit}
                    disabled={!urlInput.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                  >
                    Select
                  </Button>
                </div>
                {/* URL preview */}
                {urlInput.trim() && (
                  <div className="mt-4 w-full max-w-md">
                    <div className="relative rounded-xl overflow-hidden border border-gray-700 h-40">
                      <img
                        src={urlInput.trim()}
                        alt="URL preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
