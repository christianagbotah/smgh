'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Upload, ImageIcon, Link2, X, Search, Grid3X3, Check,
  FolderOpen, Loader2, AlertCircle, ChevronUp, ChevronDown, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

interface MultiMediaPickerProps {
  value: string[]
  onChange: (urls: string[]) => void
  label?: string
  accept?: string
}

export default function MultiMediaPicker({
  value,
  onChange,
  label = 'Images',
  accept = 'image/*',
}: MultiMediaPickerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'browse' | 'upload' | 'url'>('browse')
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [urlInput, setUrlInput] = useState('')
  const [selectedInDialog, setSelectedInDialog] = useState<Set<string>>(new Set())
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  // Initialize selectedInDialog from current value when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      setSelectedInDialog(new Set(value))
    }
  }, [dialogOpen, value])

  // Upload multiple files
  const uploadFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files)
    if (fileList.length === 0) return

    setUploading(true)
    setUploadProgress({ current: 0, total: fileList.length })

    const uploadedUrls: string[] = []
    let successCount = 0
    let failCount = 0

    for (const file of fileList) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('alt', label)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (res.ok) {
          const data = await res.json()
          uploadedUrls.push(data.url)
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
      setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }))
    }

    if (successCount > 0) {
      const newUrls = [...value, ...uploadedUrls]
      onChange(newUrls)
      toast({
        title: `${successCount} image${successCount > 1 ? 's' : ''} uploaded`,
        ...(failCount > 0 && {
          description: `${failCount} file${failCount > 1 ? 's' : ''} failed to upload`,
        }),
      })
    } else {
      toast({
        title: 'Upload failed',
        description: `${failCount} file${failCount > 1 ? 's' : ''} could not be uploaded`,
        variant: 'destructive',
      })
    }

    setUploading(false)
    setUploadProgress({ current: 0, total: 0 })
    // Refresh media library
    fetchMedia()
  }

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) uploadFiles(files)
    e.target.value = ''
  }

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) uploadFiles(files)
  }

  // Toggle selection in browse tab
  const toggleSelectMedia = (url: string) => {
    setSelectedInDialog(prev => {
      const next = new Set(prev)
      if (next.has(url)) {
        next.delete(url)
      } else {
        next.add(url)
      }
      return next
    })
  }

  // Confirm selection from browse tab
  const confirmBrowseSelection = () => {
    onChange(Array.from(selectedInDialog))
    toast({
      title: `${selectedInDialog.size} image${selectedInDialog.size !== 1 ? 's' : ''} selected`,
    })
    setDialogOpen(false)
  }

  // Handle URL tab submit
  const handleUrlSubmit = () => {
    const urls = urlInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (urls.length === 0) {
      toast({ title: 'Please enter at least one URL', variant: 'destructive' })
      return
    }

    // Add URLs, avoiding duplicates
    const newUrls = [...value]
    let addedCount = 0
    for (const url of urls) {
      if (!newUrls.includes(url)) {
        newUrls.push(url)
        addedCount++
      }
    }

    onChange(newUrls)
    toast({
      title: `${addedCount} URL${addedCount !== 1 ? 's' : ''} added`,
      ...(addedCount < urls.length && {
        description: `${urls.length - addedCount} duplicate URL(s) skipped`,
      }),
    })
    setDialogOpen(false)
    setUrlInput('')
  }

  // Reorder: move item up
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= value.length) return
    const newUrls = [...value]
    const temp = newUrls[index]
    newUrls[index] = newUrls[newIndex]
    newUrls[newIndex] = temp
    onChange(newUrls)
  }

  // Remove item
  const removeItem = (index: number) => {
    const newUrls = [...value]
    newUrls.splice(index, 1)
    onChange(newUrls)
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

      {/* Preview Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
        {value.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="relative group rounded-xl overflow-hidden border border-gray-700 bg-white/5"
          >
            <div className="aspect-square">
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const el = e.target as HTMLImageElement
                  el.style.display = 'none'
                  const parent = el.parentElement
                  if (parent && !parent.querySelector('.fallback-icon')) {
                    const fallback = document.createElement('div')
                    fallback.className = 'fallback-icon flex items-center justify-center h-full text-gray-500'
                    fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
                    parent.appendChild(fallback)
                  }
                }}
              />
            </div>

            {/* Remove button */}
            <button
              onClick={() => removeItem(index)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </button>

            {/* Index badge */}
            <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] font-medium">
              {index + 1}
            </div>

            {/* Reorder buttons */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0}
                className="w-5 h-5 rounded bg-black/60 text-white flex items-center justify-center disabled:opacity-30 hover:bg-white/20 transition-colors"
                title="Move up"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => moveItem(index, 'down')}
                disabled={index === value.length - 1}
                className="w-5 h-5 rounded bg-black/60 text-white flex items-center justify-center disabled:opacity-30 hover:bg-white/20 transition-colors"
                title="Move down"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {/* Add button */}
        <button
          onClick={() => {
            setDialogOpen(true)
            setUrlInput('')
          }}
          className="aspect-square rounded-xl border-2 border-dashed border-gray-700 hover:border-green-500/40 bg-white/5 flex flex-col items-center justify-center gap-1 transition-colors group"
        >
          <Plus className="w-6 h-6 text-gray-500 group-hover:text-green-400 transition-colors" />
          <span className="text-[10px] text-gray-500 group-hover:text-gray-300 transition-colors">
            {value.length === 0 ? 'Add Images' : 'Add More'}
          </span>
        </button>
      </div>

      {/* Count */}
      {value.length > 0 && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500 text-xs">{value.length} image{value.length !== 1 ? 's' : ''} selected</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange([])}
            className="text-gray-500 hover:text-red-400 h-6 text-xs px-2"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* ─── MULTI-MEDIA PICKER DIALOG ─── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) {
          setSearchQuery('')
          setActiveTab('browse')
          setSelectedInDialog(new Set())
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden bg-[#1a1a1a] border-gray-800 text-white flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-green-400" />
              Select Multiple Images
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose images from your media library, upload new ones, or paste external URLs.
            </DialogDescription>
          </DialogHeader>

          {/* Tab buttons */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl mt-2">
            {[
              { key: 'browse' as const, label: 'Media Library', icon: FolderOpen },
              { key: 'upload' as const, label: 'Upload Files', icon: Upload },
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
                    {mediaFiles.map(file => {
                      const isSelected = selectedInDialog.has(file.url)
                      return (
                        <button
                          key={file.id}
                          onClick={() => toggleSelectMedia(file.url)}
                          className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] ${
                            isSelected
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

                          {/* Selected overlay with checkmark */}
                          {isSelected && (
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
                      )
                    })}
                  </div>
                )}

                {/* Selection count bar */}
                {selectedInDialog.size > 0 && (
                  <div className="sticky bottom-0 mt-4 pt-3 border-t border-gray-700/50 bg-[#1a1a1a]/95 backdrop-blur-sm">
                    <Button
                      onClick={confirmBrowseSelection}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Select {selectedInDialog.size} file{selectedInDialog.size !== 1 ? 's' : ''}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* UPLOAD TAB */}
            {activeTab === 'upload' && (
              <div className="flex flex-col items-center justify-center py-8">
                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full max-w-md border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
                    dragOver
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-gray-700 hover:border-green-500/40'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto mb-4" />
                      <p className="text-gray-300 mb-2">
                        Uploading {uploadProgress.current} of {uploadProgress.total}...
                      </p>
                      {/* Progress bar */}
                      <div className="w-full bg-white/10 rounded-full h-2 max-w-xs mx-auto">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: uploadProgress.total > 0
                              ? `${(uploadProgress.current / uploadProgress.total) * 100}%`
                              : '0%',
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-300 mb-1">Click or drag files here to upload</p>
                      <p className="text-gray-500 text-sm">
                        Select multiple images to upload at once
                      </p>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  multiple
                  className="hidden"
                  onChange={handleUploadChange}
                  disabled={uploading}
                />

                <p className="text-gray-500 text-xs mt-4">
                  Accepted: JPG, PNG, GIF, WebP, SVG, MP4, WebM, MOV (max 10MB each)
                </p>
              </div>
            )}

            {/* URL TAB */}
            {activeTab === 'url' && (
              <div className="flex flex-col items-center justify-center py-8">
                <Link2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-300 mb-6">Paste external image URLs, one per line</p>

                <div className="w-full max-w-md">
                  <Textarea
                    placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    rows={5}
                    className="bg-white/5 border-gray-700 text-white resize-none"
                  />
                  <Button
                    onClick={handleUrlSubmit}
                    disabled={!urlInput.trim()}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Add All URLs
                  </Button>
                </div>

                {/* URL previews */}
                {urlInput.trim() && (
                  <div className="mt-4 w-full max-w-md">
                    <p className="text-gray-500 text-xs mb-2">Preview:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {urlInput
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0)
                        .map((url, i) => (
                          <div key={i} className="relative rounded-lg overflow-hidden border border-gray-700 aspect-square">
                            <img
                              src={url}
                              alt={`Preview ${i + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                                const parent = (e.target as HTMLImageElement).parentElement
                                if (parent && !parent.querySelector('.url-fallback')) {
                                  const fb = document.createElement('div')
                                  fb.className = 'url-fallback flex items-center justify-center h-full text-gray-500'
                                  fb.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
                                  parent.appendChild(fb)
                                }
                              }}
                            />
                          </div>
                        ))}
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
