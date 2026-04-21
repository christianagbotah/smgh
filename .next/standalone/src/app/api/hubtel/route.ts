import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: get Hubtel credentials
async function getHubtelCredentials() {
  const username = await db.siteSetting.findUnique({ where: { key: 'hubtel_username' } })
  const clientSecret = await db.siteSetting.findUnique({ where: { key: 'hubtel_client_secret' } })
  const merchantNumber = await db.siteSetting.findUnique({ where: { key: 'hubtel_merchant_number' } })
  const merchantId = await db.siteSetting.findUnique({ where: { key: 'hubtel_merchant_id' } })

  // Use merchant_number if available, fallback to merchant_id
  const merchant = merchantNumber?.value || merchantId?.value || ''
  const clientId = username?.value || merchantId?.value || ''
  const clientSecretVal = clientSecret?.value || ''

  if (!clientId || !clientSecretVal || !merchant) return null

  return {
    basicAuth: Buffer.from(`${clientId}:${clientSecretVal}`).toString('base64'),
    merchantNumber: merchant,
  }
}

// Map user-friendly network names to Hubtel channel codes
function getNetworkChannel(network: string): string {
  const map: Record<string, string> = {
    'mtn': 'mtn-gh',
    'mtn-gh': 'mtn-gh',
    'vodafone': 'vodafone-gh',
    'vodafone-gh': 'vodafone-gh',
    'airteltigo': 'airteltigo-gh',
    'airteltigo-gh': 'airteltigo-gh',
    'tigo': 'tigo-gh',
    'tigo-gh': 'tigo-gh',
    'atl': 'airteltigo-gh',
  }
  return map[network.toLowerCase()] || 'mtn-gh'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      action,
      reference,
      amount,
      email,
      phone,
      name,
      network,
      donationId,
      orderId,
      Status,
      Data,
      ClientReference,
    } = body

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''

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
          const order = await db.order.findUnique({ where: { id: ClientReference } })
          if (order) {
            await db.order.update({
              where: { id: ClientReference },
              data: { paymentStatus: 'paid', status: 'confirmed' },
            })
          }
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

    // ── Initialize Mobile Money payment (direct API) ────────────────
    if (action === 'initialize') {
      if (!amount) {
        return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
      }

      const creds = await getHubtelCredentials()
      if (!creds) {
        return NextResponse.json({ error: 'Hubtel not configured. Please contact the administrator.' }, { status: 500 })
      }

      const clientRef = donationId || orderId || `smgh-${Date.now()}`
      const description = donationId
        ? 'SMGH Donation'
        : `SMGH Order`

      // Format phone number: remove leading 0, add 233 prefix
      let msisdn = phone || '233240000000'
      if (msisdn.startsWith('0')) {
        msisdn = '233' + msisdn.substring(1)
      } else if (msisdn.startsWith('+')) {
        msisdn = msisdn.substring(1)
      }

      const channel = getNetworkChannel(network || 'mtn')

      const url = `https://api.hubtel.com/v1/merchantaccount/merchants/${creds.merchantNumber}/receive/mobilemoney`

      const fields = {
        CustomerName: name || 'Donor',
        CustomerMsisdn: msisdn,
        CustomerEmail: email || '',
        Channel: channel,
        Amount: String(amount),
        PrimaryCallbackUrl: `${baseUrl}/api/hubtel`,
        Description: description,
        ClientReference: clientRef,
      }

      console.log('Hubtel Mobile Money request:', JSON.stringify({ url, ...fields, merchantNumber: creds.merchantNumber }))

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${creds.basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fields),
      })

      const data = await response.json() as Record<string, unknown>
      console.log('Hubtel Mobile Money response:', JSON.stringify({ status: response.status, data }))

      if (!response.ok) {
        console.error('Hubtel API error:', response.status, JSON.stringify(data))
        return NextResponse.json(
          { error: `Hubtel API error: ${data?.Message || data?.Description || data?.message || 'Unknown error'}` },
          { status: response.status }
        )
      }

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
        data,
        reference: clientRef,
        message: 'Mobile money payment initiated. Please check your phone for the prompt.',
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
