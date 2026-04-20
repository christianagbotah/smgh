'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

interface ConfirmOptions {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

interface ConfirmState extends ConfirmOptions {
  open: boolean
  _resolve: ((value: boolean) => void) | null
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    _resolve: null,
  })

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: options.title || 'Are you sure?',
        description: options.description || 'This action cannot be undone.',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'danger',
        _resolve: resolve,
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setState((prev) => {
      prev._resolve?.(true)
      return { ...prev, open: false, _resolve: null }
    })
  }, [])

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setState((prev) => {
        prev._resolve?.(false)
        return { ...prev, open: false, _resolve: null }
      })
    }
  }, [])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={state.open}
        onOpenChange={handleOpenChange}
        title={state.title}
        description={state.description}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        variant={state.variant}
        onConfirm={handleConfirm}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
