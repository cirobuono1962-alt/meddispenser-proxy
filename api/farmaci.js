export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const q = req.query.q;
  if (!q || q.length < 2) {
    res.status(400).json({ error: 'Query troppo corta', results: [] });
    return;
  }

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: 'Sei un esperto di farmaci italiani autorizzati da AIFA. Rispondi SOLO con un array JSON valido, senza testo aggiuntivo, senza markdown. Ogni oggetto ha questi campi: name (nome commerciale completo con dosaggio es. "Cardicor 5mg"), principle (principio attivo), producer (azienda produttrice italiana), dose (dosaggio), forma (Compressa/Capsula/Fiala/Gocce/Spray/Cerotto/Sciroppo), cat (categoria terapeutica breve). Includi originale e generici se esistono. Massimo 10 risultati.',
        messages: [{ role: 'user', content: 'Farmaci italiani per: ' + q }]
      })
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      throw new Error('Claude error: ' + claudeRes.status + ' ' + err);
    }

    const claudeData = await claudeRes.json();
    const text = claudeData.content[0].text.replace(/```json|```/g, '').trim();
    const results = JSON.parse(text);

    if (Array.isArray(results)) {
      res.status(200).json({ results, source: 'AI', total: results.length });
    } else {
      throw new Error('Risposta non valida');
    }
  } catch(e) {
    res.status(500).json({ error: e.message, results: [] });
  }
}
