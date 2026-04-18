import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

interface ActivityItem {
  type: string
  message: string
  time: string
  icon: string
}

export async function GET() {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const [
      eventCount,
      galleryCount,
      artistCount,
      donationStats,
      messageStats,
      subscriberCount,
      unreadMessages,
      recentDonations,
      recentMessages,
      recentSubscribers,
      recentRSVPs,
      recentOrders,
      ordersGrouped,
      eventsGrouped,
      totalOrders,
      totalRSVPs,
    ] = await Promise.all([
      db.event.count(),
      db.galleryItem.count(),
      db.artist.count(),
      db.donation.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: 'completed' },
      }),
      db.contactMessage.count(),
      db.newsletterSubscriber.count({ where: { active: true } }),
      db.contactMessage.count({ where: { read: false } }),

      // Last 5 completed donations
      db.donation.findMany({
        where: { status: 'completed' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { name: true, amount: true, createdAt: true },
      }),

      // Recent contact messages
      db.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { name: true, createdAt: true },
      }),

      // Recent newsletter subscribers
      db.newsletterSubscriber.findMany({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { email: true, createdAt: true },
      }),

      // Recent RSVPs
      db.eventRSVP.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { name: true, createdAt: true },
      }),

      // Recent orders
      db.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { orderNumber: true, status: true, createdAt: true },
      }),

      // Orders grouped by status
      db.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Events grouped by status
      db.event.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Total orders count
      db.order.count(),

      // Total RSVPs count
      db.eventRSVP.count(),
    ])

    // Build recent activity from all sources
    const activity: ActivityItem[] = [
      ...recentMessages.map((m) => ({
        type: 'message',
        message: `Message from ${m.name}`,
        time: m.createdAt.toISOString(),
        icon: 'message',
      })),
      ...recentSubscribers.map((s) => ({
        type: 'subscriber',
        message: `${s.email} subscribed`,
        time: s.createdAt.toISOString(),
        icon: 'mail',
      })),
      ...recentRSVPs.map((r) => ({
        type: 'rsvp',
        message: `${r.name} RSVP'd to event`,
        time: r.createdAt.toISOString(),
        icon: 'calendar',
      })),
      ...recentOrders.map((o) => ({
        type: 'order',
        message: `Order #${o.orderNumber} - ${o.status}`,
        time: o.createdAt.toISOString(),
        icon: 'shopping-bag',
      })),
      ...recentDonations.map((d) => ({
        type: 'donation',
        message: `Donation of ₵${d.amount} from ${d.name}`,
        time: d.createdAt.toISOString(),
        icon: 'heart',
      })),
    ]

    // Sort all activity by time descending and take first 8
    activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    const recentActivity = activity.slice(0, 8)

    // Build ordersByStatus map
    const ordersByStatus: Record<string, number> = {}
    for (const group of ordersGrouped) {
      ordersByStatus[group.status] = group._count.status
    }

    // Build eventsByStatus map
    const eventsByStatus: Record<string, number> = {}
    for (const group of eventsGrouped) {
      eventsByStatus[group.status] = group._count.status
    }

    return NextResponse.json({
      events: eventCount,
      gallery: galleryCount,
      artists: artistCount,
      donations: {
        total: donationStats._sum.amount || 0,
        count: donationStats._count,
      },
      messages: messageStats,
      unreadMessages,
      subscribers: subscriberCount,
      recentActivity: recentActivity.map(({ type, message, time }) => ({ type, message, time })),
      recentDonations: recentDonations.map((d) => ({
        name: d.name,
        amount: d.amount,
        createdAt: d.createdAt.toISOString(),
      })),
      ordersByStatus,
      eventsByStatus,
      totalOrders,
      totalRSVPs,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
