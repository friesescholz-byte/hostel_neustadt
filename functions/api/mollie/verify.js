/**
 * Cloudflare Pages Function: /api/mollie/verify
 * Checks payment status from official Mollie API
 */

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const paymentId = url.searchParams.get('id');

    if (!paymentId) {
      return new Response(JSON.stringify({ success: false, error: 'Payment ID fehlt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const apiKey = env.MOLLIE_API_KEY || env.VITE_MOLLIE_API_KEY || 'test_Bf8wMeDwtf9jmmqSBEdqPDMADEd5eh';

    const mollieRes = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'HostelNeustadt/1.0'
      }
    });

    const data = await mollieRes.json();

    if (!mollieRes.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: data.detail || 'Fehler beim Abrufen der Zahlung von Mollie',
        mollieData: data
      }), {
        status: mollieRes.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const isPaid = data.status === 'paid';

    return new Response(JSON.stringify({
      success: true,
      paymentId: data.id,
      status: data.status,
      isPaid,
      amount: data.amount?.value,
      paidAt: data.paidAt || null,
      method: data.method,
      description: data.description,
      metadata: data.metadata || {}
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Interner Serverfehler bei Mollie-Zahlungsüberprüfung'
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
