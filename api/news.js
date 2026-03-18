export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { region, query } = req.body || {};
  if (!query) return res.status(400).json({ error: 'Missing query' });

  const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: `You are a business news editor. Use web search to find today's top business news.
Respond ONLY with a valid JSON object. No markdown, no explanation before or after.
All content must be in Spanish. Avoid apostrophes and double-quotes inside string values.`,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Today is ${today}. Search and find the most important business news for: "${query}".

Respond with ONLY valid JSON, no other text:
{"headline":{"title":"Titular principal aqui","summary":"Resumen frase uno. Frase dos. Frase tres.","category":"Mercados","region":"Global","impact":"Alto"},"sidebar":[{"title":"Segunda noticia","summary":"Resumen breve aqui.","category":"Economia"},{"title":"Tercera noticia","summary":"Resumen breve aqui.","category":"Tecnologia"},{"title":"Cuarta noticia","summary":"Resumen breve aqui.","category":"Energia"}],"cards":[{"title":"Noticia 5","summary":"Resumen frase uno. Frase dos.","category":"Fusiones","region":"EE.UU."},{"title":"Noticia 6","summary":"Resumen frase uno. Frase dos.","category":"Mercados","region":"Europa"},{"title":"Noticia 7","summary":"Resumen frase uno. Frase dos.","category":"Tecnologia","region":"Asia"},{"title":"Noticia 8","summary":"Resumen frase uno. Frase dos.","category":"Economia","region":"Global"},{"title":"Noticia 9","summary":"Resumen frase uno. Frase dos.","category":"Energia","region":"Global"},{"title":"Noticia 10","summary":"Resumen frase uno. Frase dos.","category":"Mercados","region":"Latam"}]}

Use real news. Titles max 70 chars. Summaries max 120 chars. No apostrophes or inner quotes.`
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const txt = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
    res.status(200).json({ text: txt });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
