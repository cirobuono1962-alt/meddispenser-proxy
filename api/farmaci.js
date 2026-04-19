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
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: 'Sei un esperto di farmaci italiani AIFA. Cerca: ' + q + '. Elenca OGNI dosaggio come riga separata. Rispondi SOLO con JSON array. Campi obbligatori: name (nome commerciale + dosaggio es: "Eliquis 2.5mg"), principle (principio attivo in italiano), producer (produttore), dose (es: "2.5mg"), forma (una di: Compressa, Capsula, Fiala, Gocce, Spray, Cerotto, Sciroppo, Soluzione), cat (categoria terapeutica descrittiva in italiano es: Anticoagulante, Beta-bloccante, Diuretico, Antidiabetico, Gastroprotettore, Antidepressivo, Antiaritmico, Analgesico, Corticosteroide, Statina, ACE-inibitore, Calcio-antagonista). Max 10 risultati. Solo JSON puro senza markdown.'
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
