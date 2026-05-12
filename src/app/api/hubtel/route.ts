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
  if (!merchant) missing.push('Merchant Number / Merchant ID')

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
function formatMsisdn(phone: string, fallback = '233240000000'): string {
  if (!phone) return fallback
  let msisdn = phone.trim()
  if (msisdn.startsWith('0')) {
    msisdn = '233' + msisdn.substring(1)
  } else if (msisdn.startsWith('+')) {
    msisdn = msisdn.substring(1)
  }
  // Remove any spaces or dashes
  msisdn = msisdn.replace(/[\s-]/g, '')
  return msisdn
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''

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
        // Test with a minimal API call to verify credentials
        const testUrl = `https://api.hubtel.com/v1/merchantaccount/merchants/${creds.merchantNumber}`
        const response = await fetch(testUrl, {
          headers: {
            'Authorization': `Basic ${creds.basicAuth}`,
          },
          signal: AbortSignal.timeout(10000), // 10s timeout
        })

        if (response.ok || response.status === 200) {
          return NextResponse.json({
            success: true,
            message: 'Hubtel credentials are valid! Connection successful.',
            merchant: creds.merchantNumber,
          })
        }

        // Try the Online Checkout endpoint as fallback test
        const checkoutTestUrl = 'https://payproxyapi.hubtel.com/items/initiate'
        const checkoutResponse = await fetch(checkoutTestUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${creds.basicAuth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ TotalAmount: 0.01, Description: 'Test' }),
          signal: AbortSignal.timeout(10000),
        })

        if (checkoutResponse.status === 400 || checkoutResponse.status === 401 || checkoutResponse.status === 403) {
          const errData = await checkoutResponse.json().catch(() => ({}))
          return NextResponse.json({
            success: false,
            error: `Hubtel API rejected the credentials (HTTP ${checkoutResponse.status}). Please verify your API Username and API Key are correct.`,
            details: JSON.stringify(errData).substring(0, 200),
          }, { status: 400 })
        }

        // If we get here, the credentials might work for one API but not the other
        return NextResponse.json({
          success: true,
          message: 'Hubtel API is reachable. Your credentials appear to be configured.',
          merchant: creds.merchantNumber,
          note: 'The actual payment will verify full connectivity.',
        })
      } catch (fetchError) {
        return NextResponse.json({
          success: false,
          error: 'Could not connect to Hubtel API. Please check your internet connection and try again.',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        }, { status: 502 })
      }
    }

    // ── Handle Hubtel webhook callback ──────────────────────────────
    // Handles both Direct Mobile Money and Onsite Checkout webhook formats
    if (!action && (Status || Data || body.Status || body.TransactionId)) {
      const creds = await getHubtelCredentials()
      if (!creds || 'error' in creds) {
        // Still process webhook even without credentials - log but don't fail
        console.log('Hubtel webhook received but credentials not configured:', JSON.stringify(body).substring(0, 500))
        return NextResponse.json({ received: true })
      }

      // Direct Mobile Money format: { Status, Data, ClientReference }
      // Onsite Checkout format: { TransactionId, ClientReference, InvoiceId, Status, Amount, ... }
      const txStatus = Status || Data?.Status || body.Status
      const txData = Data || body
      const meta = txData?.Metadata || txData?.metadata || {}
      const invoiceId = InvoiceId || txData?.InvoiceId || ''
      const clientRef = ClientReference || txData?.ClientReference || ''

      console.log('Hubtel webhook received:', JSON.stringify({ Status: txStatus, ClientReference: clientRef, InvoiceId: invoiceId, TransactionId }).substring(0, 500))

      // Extract donationId from InvoiceId (format: SMGH-<donationId>) or from metadata
      let webhookDonationId = meta?.donationId || ''
      if (!webhookDonationId && invoiceId && invoiceId.startsWith('SMGH-')) {
        webhookDonationId = invoiceId.replace('SMGH-', '')
      }

      if (txStatus === 'Completed' || txStatus === 'Success') {
        // Update donation by metadata donationId
        if (webhookDonationId) {
          await db.donation.update({
            where: { id: webhookDonationId },
            data: { status: 'completed', paymentMethod: 'hubtel', paymentProvider: 'hubtel' },
          }).catch(() => { /* record may not exist */ })
        }
        // Update order by metadata orderId
        if (meta?.orderId) {
          await db.order.update({
            where: { id: meta.orderId },
            data: { paymentStatus: 'paid', status: 'confirmed' },
          }).catch(() => { /* record may not exist */ })
        }
        // Update by ClientReference (matches donation.id or order.id)
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
        // Mark donation/order as failed for non-completed statuses
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
        return NextResponse.json({ error: creds?.error || 'Hubtel not configured. Please contact the administrator.' }, { status: 500 })
      }

      const clientRef = donationId || orderId || `smgh-${Date.now()}`
      const description = donationId ? 'SMGH Donation' : 'SMGH Order'

      const msisdn = formatMsisdn(phone || '')
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
        Metadata: { donationId, orderId } as Record<string, string | undefined>,
      }

      console.log('Hubtel Mobile Money request:', JSON.stringify({ url, clientRef, amount, channel, merchantNumber: creds.merchantNumber }))

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${creds.basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fields),
        signal: AbortSignal.timeout(30000),
      })

      const data = await response.json() as Record<string, unknown>
      console.log('Hubtel Mobile Money response:', JSON.stringify({ status: response.status, data }).substring(0, 500))

      if (!response.ok) {
        const errMsg = data?.Message || data?.Description || data?.message || data?.ResponseDescription || 'Unknown error'
        console.error('Hubtel API error:', response.status, errMsg)
        return NextResponse.json(
          { error: `Hubtel payment error: ${errMsg}` },
          { status: response.status }
        )
      }

      // Save reference on donation/order
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
        message: 'Mobile money payment initiated. Please check your phone for the prompt.',
      })
    }

    // ── Onsite Checkout (Hubtel Online Checkout Invoice) ───────────
    if (action === 'onsite-checkout') {
      if (!amount || Number(amount) <= 0) {
        return NextResponse.json({ error: 'A valid amount is required' }, { status: 400 })
      }
      if (!donationId) {
        return NextResponse.json({ error: 'Donation ID is required' }, { status: 400 })
      }

      const creds = await getHubtelCredentials()
      if (!creds || 'error' in creds) {
        return NextResponse.json({ error: creds?.error || 'Hubtel not configured. Please contact the administrator.' }, { status: 500 })
      }

      const msisdn = formatMsisdn(phone || '', '')

      const invoiceId = `SMGH-${donationId}`
      const callbackUrl = `${baseUrl}/api/hubtel`

      const requestBody = {
        InvoiceId: invoiceId,
        TotalAmount: Number(amount),
        Description: `SMGH Donation - ${name || 'Donor'}`,
        CustomerName: name || '',
        CustomerEmail: email || '',
        CustomerMsisdn: msisdn,
        PrimaryCallbackUrl: callbackUrl,
        SecondaryCallbackUrl: callbackUrl,
        ReturnUrl: `${baseUrl}/donate?status=success&ref=${invoiceId}`,
        CancellationUrl: `${baseUrl}/donate?status=cancelled&ref=${invoiceId}`,
        Metadata: {
          donationId,
          source: 'smgh-donation',
        } as Record<string, string>,
      }

      console.log('Hubtel Onsite Checkout request:', JSON.stringify({
        ...requestBody,
        CustomerMsisdn: msisdn ? msisdn.substring(0, 4) + '****' : '(empty)',
      }))

      let response: Response
      try {
        response = await fetch('https://payproxyapi.hubtel.com/items/initiate', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${creds.basicAuth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(30000),
        })
      } catch (fetchError) {
        console.error('Hubtel Onsite Checkout: Network error', fetchError)
        return NextResponse.json(
          { error: 'Could not connect to Hubtel payment service. Please check your internet connection and try again.' },
          { status: 502 }
        )
      }

      // Read response as text first to handle non-JSON or empty responses
      const responseText = await response.text()
      console.log('Hubtel Onsite Checkout response:', JSON.stringify({ status: response.status, bodyLength: responseText.length, bodyPreview: responseText.substring(0, 300) }))

      if (!responseText.trim()) {
        console.error('Hubtel Onsite Checkout: Empty response from API')
        return NextResponse.json(
          { error: `Hubtel returned an empty response (HTTP ${response.status}). This usually means invalid API credentials. Please verify your Hubtel API Username and API Key in Admin Settings.` },
          { status: 502 }
        )
      }

      let data: Record<string, unknown>
      try {
        data = JSON.parse(responseText) as Record<string, unknown>
      } catch {
        console.error('Hubtel Onsite Checkout: Non-JSON response:', responseText.substring(0, 200))
        return NextResponse.json(
          { error: `Hubtel returned an invalid response (HTTP ${response.status}). The API credentials may be incorrect or the service is temporarily unavailable.` },
          { status: 502 }
        )
      }

      if (!response.ok) {
        const errMsg = data?.Message || data?.Description || data?.message || data?.ResponseCode || JSON.stringify(data)
        console.error('Hubtel Onsite Checkout API error:', response.status, errMsg)

        // Provide specific guidance based on HTTP status codes
        let guidance = ''
        if (response.status === 401 || response.status === 403) {
          guidance = ' Your API Username or API Key is incorrect. Please check your Hubtel Online Checkout credentials in Admin Settings.'
        } else if (response.status === 400) {
          guidance = ' The request was rejected by Hubtel. Please verify all credentials and try again.'
        }

        return NextResponse.json(
          { error: `Hubtel payment error (${response.status}): ${errMsg}.${guidance}` },
          { status: response.status }
        )
      }

      // Extract checkout URL from response
      // Response format can vary:
      // v1: { ResponseCode: '00', Data: { CheckoutUrl: '...' } }
      // v2: { checkoutUrl: '...' } or { data: { checkoutUrl: '...' } }
      const responseData = data?.Data as Record<string, unknown> | null
      const checkoutUrl = responseData?.CheckoutUrl as string
        || responseData?.checkoutUrl as string
        || data?.CheckoutUrl as string
        || data?.checkoutUrl as string
        || (data?.data as Record<string, unknown>)?.CheckoutUrl as string
        || (data?.data as Record<string, unknown>)?.checkoutUrl as string
        || ''

      if (!checkoutUrl) {
        console.error('Hubtel Onsite Checkout: No CheckoutUrl in response', JSON.stringify(data).substring(0, 300))
        const responseCode = data?.ResponseCode || data?.responseCode || 'unknown'
        const responseMsg = data?.Message || data?.message || 'No message from Hubtel'

        return NextResponse.json(
          { error: `Hubtel did not return a payment link. (Response: ${responseCode} - ${responseMsg}). Please check your Hubtel account settings and ensure Online Checkout is enabled.` },
          { status: 500 }
        )
      }

      // Save reference on donation
      await db.donation.update({
        where: { id: donationId },
        data: { reference: invoiceId, paymentMethod: 'hubtel', paymentProvider: 'hubtel' },
      }).catch(() => {})

      return NextResponse.json({
        success: true,
        checkoutUrl,
        reference: invoiceId,
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

      const response = await fetch(`https://api.hubtel.com/v1/merchant/transactions/${reference}`, {
        headers: { 'Authorization': `Basic ${creds.basicAuth}` },
        signal: AbortSignal.timeout(15000),
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
