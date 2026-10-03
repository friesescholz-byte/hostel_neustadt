/**
 * Cloudflare Pages Function: /api/store
 * Synchronizes booking, inventory and pricing data with Cloudflare KV
 * KV Namespace Binding: HOSTEL_KV
 */

export async function onRequestGet(context) {
  try {
    if (context.env && context.env.HOSTEL_KV) {
      const data = await context.env.HOSTEL_KV.get('hostel_store_v1', 'json');
      if (data) {
        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    // Return empty if KV not yet populated
    return new Response(JSON.stringify(null), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    if (context.env && context.env.HOSTEL_KV) {
      await context.env.HOSTEL_KV.put('hostel_store_v1', JSON.stringify(payload));
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
