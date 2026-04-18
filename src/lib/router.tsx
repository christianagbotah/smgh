'use client'

import NextLink from 'next/link'
import { ComponentPropsWithoutRef } from 'react'

// Custom Link component that accepts `to` prop (SMGH codebase convention)
// Falls back to Next.js Link internally
interface LinkProps extends Omit<ComponentPropsWithoutRef<typeof NextLink>, 'href'> {
  to: string
}

export function Link({ to, ...props }: LinkProps) {
  return <NextLink href={to} {...props} />
}
