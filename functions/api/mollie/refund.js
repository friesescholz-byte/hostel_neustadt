/**
 * Cloudflare Pages Function: /api/mollie/refund
 * Initiates a refund for an existing payment via official Mollie REST API
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { paymentId, amount, description } = body;

    if (!paymentId) {
      return new Response(JSON.stringify({ success: false, error: 'Payment ID (Mollie Transaktions-ID) fehlt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const apiKey = env.MOLLIE_API_KEY || env.VITE_MOLLIE_API_KEY || 'test_Bf8wMeDwtf9jmmqSBEdqPDMADEd5eh';

    // If it's a simulated or manual test transaction id that doesn't start with tr_
    if (!paymentId.startsWith('tr_')) {
      return new Response(JSON.stringify({
        success: true,
        refundId: `re_sim_${Date.now().toString(36)}`,
        status: 'refunded',
        amount: { currency: 'EUR', value: Number(amount || 0).toFixed(2) },
        simulated: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const refundPayload = {
      description: description || 'Hostel Neustadt Buchungsstornierung'
    };

    if (amount !== undefined && amount !== null && Number(amount) > 0) {
      refundPayload.amount = {
        currency: 'EUR',
        value: Number(amount).toFixed(2)
      };
    }

    const mollieRes = await fetch(`https://api.mollie.com/v2/payments/${paymentId}/refunds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'HostelNeustadt/1.0'
      },
      body: JSON.stringify(refundPayload)
    });

    const data = await mollieRes.json();

    if (!mollieRes.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: data.detail || 'Mollie Rückerstattungsfehler',
        mollieData: data
      }), {
        status: mollieRes.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      refundId: data.id,
      status: data.status,
      amount: data.amount,
      createdAt: data.createdAt
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Interner Serverfehler bei Mollie-Rückerstattung'
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
