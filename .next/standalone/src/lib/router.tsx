'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'

interface RouterState {
  path: string
  params: Record<string, string>
}

interface RouterContextType extends RouterState {
  navigate: (path: string) => void
  back: () => void
}

const RouterContext = createContext<RouterContextType>({
  path: '/',
  params: {},
  navigate: () => {},
  back: () => {},
})

export function useRouter() {
  return useContext(RouterContext)
}

function parseHash(hash: string): RouterState {
  const raw = hash.replace(/^#\/?/, '') || '/'
  // Strip query parameters from the path segment
  const cleanRaw = raw.split('?')[0]
  const segments = cleanRaw.split('/').filter(Boolean)

  let path = '/'
  const params: Record<string, string> = {}

  if (segments.length === 0) {
    path = '/'
  } else if (segments[0] === 'events' && segments.length === 2) {
    path = '/events/:slug'
    params.slug = segments[1]
  } else if (segments[0] === 'events' && segments.length === 1) {
    path = '/events'
  } else if (segments[0] === 'track-order' && segments.length === 1) {
    path = '/track-order'
  } else {
    path = '/' + segments[0]
  }

  return { path, params }
}

const initialState: RouterState = { path: '/', params: {} }

export function Link({ to, children, className, onClick }: {
  to: string
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
}) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    window.location.hash = to
    onClick?.(e)
  }, [to, onClick])

  return (
    <a
      href={`#${to}`}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  )
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RouterState>(initialState)
  const initializedRef = useRef(false)

  const handleHashChange = useCallback(() => {
    const newState = parseHash(window.location.hash)
    setState(newState)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // Set initial state from current hash using rAF to avoid synchronous setState in effect
    const hash = window.location.hash
    if (hash && hash !== '#') {
      requestAnimationFrame(() => {
        setState(parseHash(hash))
      })
    } else {
      window.location.hash = '#/'
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [handleHashChange])

  const navigate = useCallback((path: string) => {
    window.location.hash = path
  }, [])

  const back = useCallback(() => {
    window.history.back()
  }, [])

  const value = useMemo(() => ({ ...state, navigate, back }), [state, navigate, back])

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  )
}
