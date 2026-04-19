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

  try {
    const payload = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: 'Sei un esperto farmacista italiano. Conosci l aspetto fisico esatto dei farmaci AIFA. Cerca: ' + q + '. Per ogni dosaggio descrivi con precisione il colore reale della compressa/capsula. Esempi noti: Eliquis 2.5mg=ovale rosa, Eliquis 5mg=ovale rosa, Xarelto 10mg=rotonda rossa, Xarelto 20mg=ovale rosso-marrone, Eutirox compresse=bianche rotonde, Tachipirina=bianca ovale, Lasix=bianca rotonda, Aspirina=bianca rotonda. Rispondi SOLO con JSON array. Campi: name (nome+dosaggio), principle, producer, dose, forma (Compressa/Capsula/Fiala/Gocce/Spray/Cerotto/Sciroppo), cat (categoria italiana), shape (oval/round/oblong), color (pink/white/yellow/orange/red/blue/green/purple/beige/brown - il colore REALE e PRECISO per quel dosaggio specifico), score (true/false se ha linea di divisione). Max 10 risultati. Solo JSON puro.'
      }]
    };

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      throw new Error('Status ' + claudeRes.status + ': ' + err.substring(0, 200));
    }

    const data = await claudeRes.json();
    const text = data.content[0].text.replace(/```json|```/g, '').trim();
    const results = JSON.parse(text);
    res.status(200).json({ results: Array.isArray(results) ? results : [], source: 'AI' });
  } catch(e) {
    res.status(500).json({ error: e.message, results: [] });
  }
}
