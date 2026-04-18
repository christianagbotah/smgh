'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Event {
  id: string
  title: string
  date: string
  description: string
  category?: string
}

interface HomePageProps {
  events?: Event[] | null
}

export default function HomePage({ events }: HomePageProps) {
  // Safety check: ensure events is a valid array before filtering
  const safeEvents = Array.isArray(events) ? events.filter(Boolean) : []

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">SMGH</h1>
          <p className="text-muted-foreground mt-2">
            St. Mary&apos;s Ghana Hub
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {safeEvents.length > 0 ? (
            safeEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    {event.category && (
                      <Badge variant="secondary">{event.category}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {event.date}
                  </p>
                  <p className="text-sm">{event.description}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No upcoming events</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground mt-auto">
        © {new Date().getFullYear()} SMGH. All rights reserved.
      </footer>
    </div>
  )
}
