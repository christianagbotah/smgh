'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Info, Trash2 } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  icon?: React.ReactNode
  onConfirm: () => void
  loading?: boolean
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      icon: <Trash2 className="w-5 h-5 text-red-500" />,
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500" />,
      confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  }

  const style = variantStyles[variant]

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
              {icon || style.icon}
            </div>
            <AlertDialogTitle className="text-white text-lg">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-400 text-sm leading-relaxed pl-[52px]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-4">
          <AlertDialogCancel
            disabled={loading}
            className="border-gray-700 text-gray-300 hover:text-white hover:bg-white/10 bg-transparent"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={loading}
            className={style.confirmClass}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
