export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // AI brief endpoint
    if (url.pathname === '/api/brief' && request.method === 'POST') {
      const apiKey = env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const body = await request.json();
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: body.messages,
        }),
      });

      const result = await response.text();
      return new Response(result, {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // ArcGIS proxy (existing behavior)
    const target = url.searchParams.get('url');
    if (!target) return new Response('Missing url param', { status: 400 });

    const response = await fetch(decodeURIComponent(target), {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0',
      }
    });

    const body = await response.text();

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: response.status,
        body: body.substring(0, 500)
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(body, {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
