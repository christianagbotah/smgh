'use client'

import { RouterProvider } from '@/lib/router'
import { PageShell } from '@/components/pages/PageShell'

export default function Home() {
  return (
    <RouterProvider>
      <PageShell />
    </RouterProvider>
  )
}
