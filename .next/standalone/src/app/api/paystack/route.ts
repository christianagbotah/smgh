import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Initialize a Paystack transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, reference, amount, email, donationId } = body

    if (action === 'verify') {
      // Verify an existing transaction
      if (!reference) {
        return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
      }

      const paystackSecret = await db.siteSetting.findUnique({ where: { key: 'paystack_secret_key' } })
      if (!paystackSecret?.value) {
        return NextResponse.json({ error: 'Paystack not configured' }, { status: 500 })
      }

      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${paystackSecret.value}`,
        },
      })

      const data = await response.json() as {
        status: boolean
        data: {
          status: string
          amount: number
          reference: string
          customer: { email: string }
          metadata?: { donationId?: string; paymentMethod?: string }
        }
      }

      if (data.status && data.data?.status === 'success') {
        if (data.data.metadata?.donationId) {
          await db.donation.update({
            where: { id: data.data.metadata.donationId },
            data: {
              status: 'completed',
              reference: data.data.reference,
              paymentMethod: data.data.metadata.paymentMethod || 'paystack',
            },
          })
        }
        return NextResponse.json({ success: true, data: data.data })
      }

      return NextResponse.json({ success: false, data }, { status: 400 })
    }

    if (action === 'initialize') {
      // Create a new Paystack checkout session
      if (!amount || !email || !donationId) {
        return NextResponse.json({ error: 'Amount, email and donationId are required' }, { status: 400 })
      }

      const paystackSecret = await db.siteSetting.findUnique({ where: { key: 'paystack_secret_key' } })
      if (!paystackSecret?.value) {
        return NextResponse.json({ error: 'Paystack not configured. Please contact the administrator.' }, { status: 500 })
      }

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecret.value}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100), // Paystack expects amount in kobo/cpesewas
          currency: 'GHS',
          metadata: {
            donationId,
            paymentMethod: 'paystack',
          },
          channels: ['mobile_money', 'card', 'bank_transfer'],
        }),
      })

      const data = await response.json() as {
        status: boolean
        data: { authorization_url: string; access_code: string; reference: string }
        message: string
      }

      if (data.status && data.data?.authorization_url) {
        return NextResponse.json({
          success: true,
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
          reference: data.data.reference,
        })
      }

      return NextResponse.json({ error: data.message || 'Failed to initialize transaction' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Invalid action. Use "initialize" or "verify".' }, { status: 400 })
  } catch (error) {
    console.error('Paystack error:', error)
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 })
  }
}
