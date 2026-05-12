import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: get Hubtel credentials from database
async function getHubtelCredentials() {
  const username = await db.siteSetting.findUnique({ where: { key: 'hubtel_username' } })
  const clientSecret = await db.siteSetting.findUnique({ where: { key: 'hubtel_client_secret' } })
  const merchantNumber = await db.siteSetting.findUnique({ where: { key: 'hubtel_merchant_number' } })
  const merchantId = await db.siteSetting.findUnique({ where: { key: 'hubtel_merchant_id' } })

  // Use merchant_number if available, fallback to merchant_id
  const merchant = merchantNumber?.value || merchantId?.value || ''
  const clientId = username?.value || merchantId?.value || ''
  const clientSecretVal = clientSecret?.value || ''

  const missing: string[] = []
  if (!clientId) missing.push('API Username')
  if (!clientSecretVal) missing.push('API Key (Secret)')
  if (!merchant) missing.push('Merchant Account Number')

  if (missing.length > 0) {
    return { error: `Missing Hubtel credentials: ${missing.join(', ')}. Please configure them in Admin Settings.` }
  }

  return {
    basicAuth: Buffer.from(`${clientId}:${clientSecretVal}`).toString('base64'),
    merchantNumber: merchant,
    clientId,
    hasCredentials: true,
  }
}

// Get the base URL for callbacks — with fallback to request headers
function getBaseUrl(request?: NextRequest): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  if (request) {
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
    if (host) return `${protocol}://${host}`
  }
  return ''
}

// Map user-friendly network names to Hubtel channel codes
function getNetworkChannel(network: string): string {
  const map: Record<string, string> = {
    'mtn': 'mtn-gh',
    'mtn-gh': 'mtn-gh',
    'vodafone': 'vodafone-gh',
    'vodafone-gh': 'vodafone-gh',
    'telecel': 'vodafone-gh',
    'airteltigo': 'airteltigo-gh',
    'airteltigo-gh': 'airteltigo-gh',
    'tigo': 'tigo-gh',
    'tigo-gh': 'tigo-gh',
    'atl': 'airteltigo-gh',
    'at': 'airteltigo-gh',
  }
  return map[network.toLowerCase()] || 'mtn-gh'
}

// Format phone number to international format
function formatMsisdn(phone: string): string {
  if (!phone) return ''
  let msisdn = phone.trim()
  if (msisdn.startsWith('0')) {
    msisdn = '233' + msisdn.substring(1)
  } else if (msisdn.startsWith('+')) {
    msisdn = msisdn.substring(1)
  }
  msisdn = msisdn.replace(/[\s-]/g, '')
  if (!msisdn.match(/^233\d{9}$/)) return ''
  return msisdn
}

// Helper to create a fetch with timeout
function fetchWithTimeout(url: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const { timeoutMs = 30000, ...fetchOptions } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  return fetch(url, {
    ...fetchOptions,
    signal: options.signal || controller.signal,
  }).finally(() => clearTimeout(timeoutId))
}

// GET handler — health check
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const mode = url.searchParams.get('mode')

  if (mode === 'verify' || mode === 'webhook') {
    return NextResponse.json({ status: 'ok', message: 'Hubtel webhook endpoint is active' })
  }

  return NextResponse.json({ status: 'ok', service: 'hubtel-payment', timestamp: new Date().toISOString() })
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
      InvoiceId,
      TransactionId,
    } = body

    const baseUrl = getBaseUrl(request)

    // ── Test Hubtel Connection ───────────────────────────────────────
    if (action === 'test-connection') {
      const creds = await getHubtelCredentials()
      if (!creds || 'error' in creds) {
        return NextResponse.json({
          success: false,
          error: creds?.error || 'Hubtel credentials not configured',
          details: 'Go to Admin → Settings → Payment Settings → Hubtel Keys and enter your credentials.',
        }, { status: 400 })
      }

      try {
        const testUrl = `https://api.hubtel.com/v1/merchantaccount/merchants/${creds.merchantNumber}`
        const response = await fetchWithTimeout(testUrl, {
          headers: {
            'Authorization': `Basic ${creds.basicAuth}`,
          },
          timeoutMs: 10000,
        })

        if (response.ok || response.status === 200) {
          return NextResponse.json({
            success: true,
            message: 'Hubtel credentials are valid! Connection successful.',
            merchant: creds.merchantNumber,
          })
        }

        // Fallback: test with Online Checkout endpoint
        const checkoutResponse = await fetchWithTimeout('https://payproxyapi.hubtel.com/items/initiate', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${creds.basicAuth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            totalAmount: 0.01,
            description: 'Connection Test',
            callbackUrl: `${baseUrl}/api/hubtel`,
            returnUrl: `${baseUrl}/donate`,
            merchantAccountNumber: creds.merchantNumber,
            clientReference: `test-${Date.now()}`,
          }),
          timeoutMs: 10000,
        })

        if (checkoutResponse.status === 400 || checkoutResponse.status === 401 || checkoutResponse.status === 403) {
          const errData = await checkoutResponse.json().catch(() => ({}))
          return NextResponse.json({
            success: false,
            error: `Hubtel API rejected the credentials (HTTP ${checkoutResponse.status}).`,
            details: JSON.stringify(errData).substring(0, 200),
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: 'Hubtel API is reachable. Your credentials appear to be configured.',
          merchant: creds.merchantNumber,
        })
      } catch (fetchError) {
        return NextResponse.json({
          success: false,
          error: 'Could not connect to Hubtel API.',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        }, { status: 502 })
      }
    }

    // ── Handle Hubtel webhook callback ──────────────────────────────
    if (!action && (Status || Data || body.Status || body.TransactionId)) {
      const txStatus = Status || Data?.Status || body.Status
      const txData = Data || body
      const meta = txData?.Metadata || txData?.metadata || txData?.Meta || {}
      const invoiceId = InvoiceId || txData?.InvoiceId || ''
      const clientRef = ClientReference || txData?.ClientReference || ''

      console.log('Hubtel webhook received:', JSON.stringify({ Status: txStatus, ClientReference: clientRef, InvoiceId: invoiceId, TransactionId }).substring(0, 500))

      // Extract donationId from InvoiceId (format: SMGH-<donationId>) or from metadata
      let webhookDonationId = meta?.donationId || ''
      if (!webhookDonationId && invoiceId && invoiceId.startsWith('SMGH-')) {
        webhookDonationId = invoiceId.replace('SMGH-', '')
      }

      if (txStatus === 'Completed' || txStatus === 'Success') {
        if (webhookDonationId) {
          await db.donation.update({
            where: { id: webhookDonationId },
            data: { status: 'completed', paymentMethod: 'hubtel', paymentProvider: 'hubtel' },
          }).catch(() => {})
        }
        if (meta?.orderId) {
          await db.order.update({
            where: { id: meta.orderId },
            data: { paymentStatus: 'paid', status: 'confirmed' },
          }).catch(() => {})
        }
        if (clientRef) {
          const order = await db.order.findUnique({ where: { id: clientRef } })
          if (order) {
            await db.order.update({
              where: { id: clientRef },
              data: { paymentStatus: 'paid', status: 'confirmed', paymentProvider: 'hubtel' },
            })
          }
          const donation = await db.donation.findUnique({ where: { id: clientRef } })
          if (donation) {
            await db.donation.update({
              where: { id: clientRef },
              data: { status: 'completed', paymentMethod: 'hubtel', paymentProvider: 'hubtel' },
            })
          }
        }
      } else if (txStatus === 'Failed' || txStatus === 'Cancelled' || txStatus === 'Timeout' || txStatus === 'Declined') {
        if (webhookDonationId) {
          await db.donation.update({
            where: { id: webhookDonationId },
            data: { status: 'failed' },
          }).catch(() => {})
        }
        if (clientRef) {
          const donation = await db.donation.findUnique({ where: { id: clientRef } })
          if (donation) {
            await db.donation.update({
              where: { id: clientRef },
              data: { status: 'failed' },
            })
          }
        }
      }

      return NextResponse.json({ received: true })
    }

    // ── Initialize Mobile Money payment (direct API) ────────────────
    if (action === 'initialize') {
      if (!amount || Number(amount) <= 0) {
        return NextResponse.json({ error: 'A valid amount is required' }, { status: 400 })
      }

      const creds = await getHubtelCredentials()
      if (!creds || 'error' in creds) {
        return NextResponse.json({ error: creds?.error || 'Hubtel not configured.' }, { status: 500 })
      }

      const clientRef = donationId || orderId || `smgh-${Date.now()}`
      const description = donationId ? 'SMGH Donation' : 'SMGH Order'
      const msisdn = formatMsisdn(phone || '')
      const channel = getNetworkChannel(network || 'mtn')

      const url = `https://api.hubtel.com/v1/merchantaccount/merchants/${creds.merchantNumber}/receive/mobilemoney`

      const fields: Record<string, unknown> = {
        CustomerName: name || 'Donor',
        Channel: channel,
        Amount: String(amount),
        PrimaryCallbackUrl: `${baseUrl}/api/hubtel`,
        Description: description,
        ClientReference: clientRef,
        Metadata: { donationId, orderId } as Record<string, string | undefined>,
      }

      if (msisdn) fields.CustomerMsisdn = msisdn
      if (email) fields.CustomerEmail = email

      console.log('Hubtel Mobile Money request:', JSON.stringify({ url, clientRef, amount, channel, merchantNumber: creds.merchantNumber, hasPhone: !!msisdn }))

      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${creds.basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fields),
        timeoutMs: 30000,
      })

      const data = await response.json() as Record<string, unknown>
      console.log('Hubtel Mobile Money response:', JSON.stringify({ status: response.status, data }).substring(0, 500))

      if (!response.ok) {
        const errMsg = data?.Message || data?.Description || data?.message || 'Unknown error'
        return NextResponse.json({ error: `Hubtel payment error: ${errMsg}` }, { status: response.status })
      }

      if (donationId) {
        await db.donation.update({
          where: { id: donationId },
          data: { reference: clientRef, paymentMethod: 'hubtel', paymentProvider: 'hubtel' },
        }).catch(() => {})
      }
      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: { paymentRef: clientRef, paymentProvider: 'hubtel' },
        }).catch(() => {})
      }

      return NextResponse.json({
        success: true,
        data,
        reference: clientRef,
        message: 'Mobile money payment initiated. Check your phone for the prompt.',
      })
    }

    // ── Onsite Checkout (Hubtel Online Checkout) ───────────────────
    // Using the EXACT Hubtel API format from their documentation
    // Endpoint: POST https://payproxyapi.hubtel.com/items/initiate
    if (action === 'onsite-checkout') {
      if (!amount || Number(amount) <= 0) {
        return NextResponse.json({ error: 'A valid amount is required' }, { status: 400 })
      }
      if (!donationId) {
        return NextResponse.json({ error: 'Donation ID is required' }, { status: 400 })
      }

      const creds = await getHubtelCredentials()
      if (!creds || 'error' in creds) {
        return NextResponse.json({ error: creds?.error || 'Hubtel not configured.' }, { status: 500 })
      }

      const callbackUrl = `${baseUrl}/api/hubtel`
      const returnUrl = `${baseUrl}/donate?status=success&ref=SMGH-${donationId}`
      const cancelUrl = `${baseUrl}/donate?status=cancelled&ref=SMGH-${donationId}`

      if (!baseUrl) {
        console.error('Hubtel Onsite Checkout: NEXT_PUBLIC_BASE_URL is not configured.')
        return NextResponse.json(
          { error: 'Server configuration error: Base URL is not set. Please contact the administrator.' },
          { status: 500 }
        )
      }

      // Build request body matching Hubtel's exact API format (camelCase)
      // Reference: https://docs.hubtel.com/docs/online-checkout
      const clientRef = `SMGH-${donationId}`

      const requestBody = {
        // Required fields — exact camelCase format from Hubtel API
        totalAmount: Number(amount),
        description: `SMGH Donation - ${name || 'Donor'}`,
        callbackUrl: callbackUrl,
        returnUrl: returnUrl,
        cancellationUrl: cancelUrl,
        merchantAccountNumber: creds.merchantNumber,
        clientReference: clientRef,

        // Optional customer info
        ...(name ? { clientName: name } : {}),
        ...(email ? { clientEmail: email } : {}),
      }

      console.log('Hubtel Onsite Checkout request:', JSON.stringify({
        ...requestBody,
        callbackUrl,
        returnUrl,
      }))

      let response: Response
      try {
        response = await fetchWithTimeout('https://payproxyapi.hubtel.com/items/initiate', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${creds.basicAuth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          timeoutMs: 30000,
        })
      } catch (fetchError) {
        const errMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error'
        console.error('Hubtel Onsite Checkout: Network error', errMessage)
        return NextResponse.json(
          { error: `Could not connect to Hubtel: ${errMessage}` },
          { status: 502 }
        )
      }

      // Read response
      const responseText = await response.text()
      console.log('Hubtel Onsite Checkout response:', JSON.stringify({
        status: response.status,
        bodyPreview: responseText.substring(0, 500),
      }))

      if (!responseText.trim()) {
        console.error('Hubtel Onsite Checkout: Empty response')
        return NextResponse.json(
          { error: `Hubtel returned an empty response (HTTP ${response.status}). Check your API credentials.` },
          { status: 502 }
        )
      }

      let data: Record<string, unknown>
      try {
        data = JSON.parse(responseText) as Record<string, unknown>
      } catch {
        console.error('Hubtel Onsite Checkout: Non-JSON response:', responseText.substring(0, 200))
        return NextResponse.json(
          { error: `Hubtel returned an invalid response (HTTP ${response.status}).` },
          { status: 502 }
        )
      }

      if (!response.ok) {
        const errMsg = data?.Message || data?.message || data?.Description || JSON.stringify(data)
        console.error('Hubtel Onsite Checkout API error:', response.status, errMsg)

        let guidance = ''
        if (response.status === 401 || response.status === 403) {
          guidance = ' Your API Username or API Key is incorrect.'
        } else if (response.status === 400) {
          guidance = ' The request format was rejected. Check merchant account number and credentials.'
        }

        return NextResponse.json(
          { error: `Hubtel error (${response.status}): ${errMsg}.${guidance}` },
          { status: response.status }
        )
      }

      // Extract checkout URL from response — Hubtel returns camelCase
      // Response: { checkoutUrl: "https://...", responseCode: "00", ... }
      const checkoutUrl = data?.checkoutUrl
        || data?.CheckoutUrl
        || data?.data?.checkoutUrl
        || data?.Data?.CheckoutUrl
        || data?.data?.checkoutUrl
        || ''

      if (!checkoutUrl) {
        console.error('Hubtel Onsite Checkout: No checkoutUrl in response', JSON.stringify(data).substring(0, 300))
        const responseCode = data?.responseCode || data?.ResponseCode || 'unknown'
        const responseMsg = data?.message || data?.Message || 'No message from Hubtel'

        return NextResponse.json(
          { error: `Hubtel did not return a payment link. (Code: ${responseCode} - ${responseMsg})` },
          { status: 500 }
        )
      }

      // Save reference on donation
      await db.donation.update({
        where: { id: donationId },
        data: { reference: clientRef, paymentMethod: 'hubtel', paymentProvider: 'hubtel' },
      }).catch(() => {})

      return NextResponse.json({
        success: true,
        checkoutUrl: checkoutUrl as string,
        reference: clientRef,
        message: 'Redirecting to Hubtel checkout page...',
      })
    }

    // ── Verify a transaction ────────────────────────────────────────
    if (action === 'verify') {
      if (!reference) {
        return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
      }

      const creds = await getHubtelCredentials()
      if (!creds || 'error' in creds) {
        return NextResponse.json({ error: creds?.error || 'Hubtel not configured' }, { status: 500 })
      }

      const response = await fetchWithTimeout(`https://api.hubtel.com/v1/merchant/transactions/${reference}`, {
        headers: { 'Authorization': `Basic ${creds.basicAuth}` },
        timeoutMs: 15000,
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
            data: { status: 'completed', reference, paymentMethod: 'hubtel', paymentProvider: 'hubtel' },
          })
        }
        return NextResponse.json({ success: true, data })
      }

      return NextResponse.json({ success: false, data }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "initialize", "onsite-checkout", "verify", or "test-connection".' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Hubtel route error:', error)
    const message = error instanceof Error ? error.message : 'Payment processing failed'
    return NextResponse.json(
      { error: `Payment error: ${message}` },
      { status: 500 }
    )
  }
}
