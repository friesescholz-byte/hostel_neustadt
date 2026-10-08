/**
 * Cloudflare Pages Function: /api/mollie/create-payment
 * Creates an authorized payment session via official Mollie REST API
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { amount, description, redirectUrl, metadata, method } = body;

    const apiKey = env.MOLLIE_API_KEY || env.VITE_MOLLIE_API_KEY || 'test_Bf8wMeDwtf9jmmqSBEdqPDMADEd5eh';

    const numAmount = Number(amount || 0).toFixed(2);

    const molliePayload = {
      amount: {
        currency: 'EUR',
        value: numAmount
      },
      description: description || 'Hostel Neustadt Zimmerbuchung',
      redirectUrl: redirectUrl || 'https://hostel-neustadt.pages.dev/buchen?payment_status=check',
      metadata: metadata || {}
    };

    if (method && method.startsWith('mollie_')) {
      const cleanMethod = method.replace('mollie_', '');
      if (['card', 'creditcard', 'paypal', 'klarna', 'giropay', 'applepay'].includes(cleanMethod)) {
        if (cleanMethod === 'card' || cleanMethod === 'creditcard') {
          molliePayload.method = 'creditcard';
        } else {
          molliePayload.method = cleanMethod;
        }
      }
    }

    const mollieRes = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'HostelNeustadt/1.0'
      },
      body: JSON.stringify(molliePayload)
    });

    const data = await mollieRes.json();

    if (!mollieRes.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: data.detail || data.title || 'Mollie API Fehler',
        mollieData: data
      }), {
        status: mollieRes.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      paymentId: data.id,
      status: data.status,
      checkoutUrl: data._links?.checkout?.href || null,
      mode: data.mode
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Interner Serverfehler bei Mollie-Zahlungserstellung'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
