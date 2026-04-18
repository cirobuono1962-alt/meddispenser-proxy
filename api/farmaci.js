export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const q = req.query.q;
  if (!q || q.length < 2) {
    res.status(400).json({ error: 'Query too short', results: [] });
    return;
  }

  const sys = 'You are an expert on Italian AIFA drugs. Reply ONLY with a JSON array. Fields: name, principle, producer, dose, forma, cat. Max 10 results. Pure JSON only, no markdown.';

  try {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: sys,
      messages: [{ role: 'user', content: 'Italian drugs for: ' + q }]
    });

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: body
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      throw new Error('Claude ' + claudeRes.status + ': ' + err.substring(0, 100));
    }

    const data = await claudeRes.json();
    const text = data.content[0].text.replace(/```json|```/g, '').trim();
    const results = JSON.parse(text);
    res.status(200).json({ results: Array.isArray(results) ? results : [], source: 'AI' });
  } catch(e) {
    res.status(500).json({ error: e.message, results: [] });
  }
}
