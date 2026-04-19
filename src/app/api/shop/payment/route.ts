import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, orderId, amount, email, phone, provider } = body

    if (provider === 'paystack') {
      const paystackSecret = await db.siteSetting.findUnique({ where: { key: 'paystack_secret_key' } })
      if (!paystackSecret?.value) {
        return NextResponse.json({ error: 'Paystack not configured' }, { status: 500 })
      }

      if (action === 'initialize') {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackSecret.value}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            amount: Math.round(amount * 100),
            currency: 'GHS',
            metadata: { orderId, type: 'shop_order' },
            channels: ['mobile_money', 'card', 'bank_transfer'],
          }),
        })

        const data = await response.json() as any
        if (data.status && data.data?.authorization_url) {
          // Update order with payment ref
          await db.order.update({
            where: { id: orderId },
            data: { paymentRef: data.data.reference, paymentProvider: 'paystack' },
          })
          return NextResponse.json({ success: true, authorization_url: data.data.authorization_url, reference: data.data.reference })
        }
        return NextResponse.json({ error: data.message || 'Failed to initialize Paystack' }, { status: 400 })
      }

      if (action === 'verify') {
        const { reference } = body
        if (!reference) return NextResponse.json({ error: 'Reference required' }, { status: 400 })

        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { Authorization: `Bearer ${paystackSecret.value}` },
        })
        const data = await response.json() as any

        if (data.status && data.data?.status === 'success') {
          const orderId = data.data.metadata?.orderId
          if (orderId) {
            await db.order.update({
              where: { id: orderId },
              data: { paymentStatus: 'paid', status: 'confirmed', paymentRef: data.data.reference },
            })
          }
          return NextResponse.json({ success: true, data: data.data })
        }
        return NextResponse.json({ success: false, data }, { status: 400 })
      }
    }

    if (provider === 'hubtel') {
      const hubtelUsername = await db.siteSetting.findUnique({ where: { key: 'hubtel_username' } })
      const hubtelMerchantId = await db.siteSetting.findUnique({ where: { key: 'hubtel_merchant_id' } })
      const hubtelMerchantNumber = await db.siteSetting.findUnique({ where: { key: 'hubtel_merchant_number' } })
      const hubtelSecret = await db.siteSetting.findUnique({ where: { key: 'hubtel_client_secret' } })
      const apiUser = hubtelUsername?.value || hubtelMerchantId?.value || ''
      const merchant = hubtelMerchantNumber?.value || hubtelMerchantId?.value || ''
      if (!apiUser || !hubtelSecret?.value || !merchant) {
        return NextResponse.json({ error: 'Hubtel not configured' }, { status: 500 })
      }

      const basicAuth = Buffer.from(`${apiUser}:${hubtelSecret.value}`).toString('base64')
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''

      if (action === 'initialize') {
        // Hubtel Mobile Money Direct API
        const { name, network } = body
        const channel = (network === 'vodafone' || network === 'vodafone-gh') ? 'vodafone-gh'
          : (network === 'airteltigo' || network === 'airteltigo-gh') ? 'airteltigo-gh'
          : 'mtn-gh'

        let msisdn = phone || '233240000000'
        if (msisdn.startsWith('0')) msisdn = '233' + msisdn.substring(1)
        else if (msisdn.startsWith('+')) msisdn = msisdn.substring(1)

        const url = `https://api.hubtel.com/v1/merchantaccount/merchants/${merchant}/receive/mobilemoney`
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            CustomerName: name || 'Customer',
            CustomerMsisdn: msisdn,
            CustomerEmail: email || '',
            Channel: channel,
            Amount: String(amount),
            PrimaryCallbackUrl: `${baseUrl}/api/hubtel`,
            Description: `SMGH Order`,
            ClientReference: orderId,
          }),
        })

        const data = await response.json() as Record<string, unknown>
        if (!response.ok) {
          return NextResponse.json({ error: `Hubtel API error: ${(data as any).Message || 'Unknown'}` }, { status: response.status })
        }

        await db.order.update({
          where: { id: orderId },
          data: { paymentRef: orderId, paymentProvider: 'hubtel' },
        })

        return NextResponse.json({
          success: true,
          data,
          reference: orderId,
          message: 'Mobile money payment initiated. Check your phone for the prompt.',
        })
      }

      if (action === 'verify') {
        const { reference } = body
        if (!reference) return NextResponse.json({ error: 'Reference required' }, { status: 400 })

        const response = await fetch(`https://api.hubtel.com/v1/merchant/transactions/${reference}`, {
          headers: { Authorization: `Basic ${basicAuth}` },
        })
        const data = await response.json() as any

        if (data.status === 'Completed') {
          if (orderId) {
            await db.order.update({
              where: { id: orderId },
              data: { paymentStatus: 'paid', status: 'confirmed' },
            })
          }
          return NextResponse.json({ success: true, data })
        }
        return NextResponse.json({ success: false, data }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Invalid provider or action' }, { status: 400 })
  } catch (error) {
    console.error('Shop payment error:', error)
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 })
  }
}
