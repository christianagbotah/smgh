'use client'

import { useState, useEffect } from 'react'

export default function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const [css, setCss] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(settings => {
        const overrides: string[] = []
        if (settings.brand_green) overrides.push(`--brand-green: ${settings.brand_green}`)
        if (settings.brand_green_dark) overrides.push(`--brand-green-dark: ${settings.brand_green_dark}`)
        if (settings.brand_green_light) overrides.push(`--brand-green-light: ${settings.brand_green_light}`)
        if (settings.brand_green_lighter) overrides.push(`--brand-green-lighter: ${settings.brand_green_lighter}`)
        if (settings.brand_red) overrides.push(`--brand-red: ${settings.brand_red}`)
        if (settings.brand_red_dark) overrides.push(`--brand-red-dark: ${settings.brand_red_dark}`)
        if (settings.brand_red_light) overrides.push(`--brand-red-light: ${settings.brand_red_light}`)
        if (settings.brand_gold) overrides.push(`--brand-gold: ${settings.brand_gold}`)
        if (overrides.length > 0) {
          setCss(`:root { ${overrides.join('; ')} }`)
        }
      })
      .catch(() => {})
  }, [])

  if (!css) return <>{children}</>

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </>
  )
}
