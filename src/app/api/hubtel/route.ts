import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: get Hubtel credentials
async function getHubtelCredentials() {
  const username = await db.siteSetting.findUnique({ where: { key: 'hubtel_username' } })
  const clientSecret = await db.siteSetting.findUnique({ where: { key: 'hubtel_client_secret' } })
  const merchantId = await db.siteSetting.findUnique({ where: { key: 'hubtel_merchant_id' } })

  const apiUser = username?.value || merchantId?.value || ''
  const apiKey = clientSecret?.value || ''
  const merchant = merchantId?.value || ''

  if (!apiUser || !apiKey || !merchant) return null

  return {
    basicAuth: Buffer.from(`${apiUser}:${apiKey}`).toString('base64'),
    merchantAccount: merchant,
  }
}

// Hubtel Unified Pay — creates a checkout URL for redirect
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, reference, amount, email, phone, donationId, orderId, Status, Data, ClientReference } = body

    // ── Handle Hubtel webhook callback ──────────────────────────────
    if (!action && (Status || Data)) {
      const creds = await getHubtelCredentials()
      if (!creds) {
        return NextResponse.json({ error: 'Hubtel not configured' }, { status: 500 })
      }

      const txStatus = Status || Data?.Status
      const txData = Data || body
      const meta = txData?.Metadata || txData?.metadata || {}

      console.log('Hubtel webhook received:', JSON.stringify({ Status: txStatus, ClientReference, meta }))

      if (txStatus === 'Completed') {
        if (meta?.donationId) {
          await db.donation.update({
            where: { id: meta.donationId },
            data: { status: 'completed', paymentMethod: 'hubtel' },
          })
        }
        if (meta?.orderId) {
          await db.order.update({
            where: { id: meta.orderId },
            data: { paymentStatus: 'paid', status: 'confirmed' },
          })
        }
        if (ClientReference) {
          // Try to find as order
          const order = await db.order.findUnique({ where: { id: ClientReference } })
          if (order) {
            await db.order.update({
              where: { id: ClientReference },
              data: { paymentStatus: 'paid', status: 'confirmed' },
            })
          }
          // Try to find as donation
          const donation = await db.donation.findUnique({ where: { id: ClientReference } })
          if (donation) {
            await db.donation.update({
              where: { id: ClientReference },
              data: { status: 'completed', paymentMethod: 'hubtel' },
            })
          }
        }
      }

      return NextResponse.json({ received: true })
    }

    // ── Create checkout URL (redirect-based) ────────────────────────
    if (action === 'initialize') {
      if (!amount) {
        return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
      }

      const creds = await getHubtelCredentials()
      if (!creds) {
        return NextResponse.json({ error: 'Hubtel not configured. Please contact the administrator.' }, { status: 500 })
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
      const clientRef = donationId || orderId || `smgh-${Date.now()}`

      // Build the Hubtel Unified Pay URL
      const params = new URLSearchParams({
        amount: String(amount),
        purchaseDescription: donationId
          ? 'SMGH Donation'
          : `SMGH Order - ₵${amount}`,
        customerPhoneNumber: phone ? phone.replace(/^0/, '233') : '233240000000',
        clientReference: clientRef,
        callbackUrl: `${baseUrl}/api/hubtel`,
        returnUrl: donationId
          ? `${baseUrl}/#/donate?status=success`
          : `${baseUrl}/#/shop?status=success&order=${orderId}`,
        cancellationUrl: donationId
          ? `${baseUrl}/#/donate?status=cancelled`
          : `${baseUrl}/#/shop?status=cancelled`,
        merchantAccount: creds.merchantAccount,
        basicAuth: `Basic ${creds.basicAuth}`,
      })

      const checkoutUrl = `https://unified-pay.hubtel.com/pay?${params.toString()}`

      // Save reference on donation/order
      if (donationId) {
        await db.donation.update({
          where: { id: donationId },
          data: { reference: clientRef, paymentMethod: 'hubtel', paymentProvider: 'hubtel' },
        })
      }
      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: { paymentRef: clientRef, paymentProvider: 'hubtel' },
        })
      }

      return NextResponse.json({
        success: true,
        checkout_url: checkoutUrl,
        reference: clientRef,
      })
    }

    // ── Verify a transaction ────────────────────────────────────────
    if (action === 'verify') {
      if (!reference) {
        return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
      }

      const creds = await getHubtelCredentials()
      if (!creds) {
        return NextResponse.json({ error: 'Hubtel not configured' }, { status: 500 })
      }

      const response = await fetch(`https://api.hubtel.com/v1/merchant/transactions/${reference}`, {
        headers: { 'Authorization': `Basic ${creds.basicAuth}` },
      })

      const data = await response.json() as {
        status: string
        amount: number
        metadata?: { donationId?: string; paymentMethod?: string }
      }

      if (data.status === 'Completed') {
        if (data.metadata?.donationId) {
          await db.donation.update({
            where: { id: data.metadata.donationId },
            data: { status: 'completed', reference, paymentMethod: 'hubtel' },
          })
        }
        return NextResponse.json({ success: true, data })
      }

      return NextResponse.json({ success: false, data }, { status: 400 })
    }

    return NextResponse.json({ error: 'Invalid action. Use "initialize" or "verify".' }, { status: 400 })
  } catch (error) {
    console.error('Hubtel error:', error)
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 })
  }
}
