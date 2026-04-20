'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface PageLoadingOverlayProps {
  visible: boolean
  message?: string
}

export default function PageLoadingOverlay({ visible, message = 'Processing...' }: PageLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Loading card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="relative bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl min-w-[200px]"
          >
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-green-400 animate-spin" />
            </div>
            <p className="text-white text-sm font-medium">{message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
