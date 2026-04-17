export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { q } = req.query;
  if (!q || q.length < 2) { res.status(400).json({ error: 'Query troppo corta' }); return; }

  try {
    // Chiama API AIFA
    const url = `https://medicinali.aifa.gov.it/aifa-services/rest/getSearchResult?searchString=${encodeURIComponent(q)}&start=0&count=20&lang=IT`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
        'Referer': 'https://medicinali.aifa.gov.it/'
      }
    });

    if (!response.ok) throw new Error('AIFA non disponibile');

    const data = await response.json();
    
    const results = (data.items || []).map(item => ({
      name:      item.denominazione || item.nome || '',
      dose:      item.confezione || '',
      principle: item.principioAttivo || '',
      producer:  item.titolareAIC || item.ditta || '',
      forma:     item.formaFarmaceutica || 'Compressa',
      cat:       item.atcDescrizione || item.categoria || ''
    })).filter(r => r.name.length > 0);

    res.status(200).json({ results, source: 'AIFA', total: results.length });

  } catch(e) {
    // Fallback: usa Claude API
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
          max_tokens: 800,
          system: 'Sei un esperto di farmaci italiani. Rispondi SOLO con un array JSON. Ogni oggetto: name (nome commerciale con dosaggio), principle (principio attivo), producer (produttore), dose (dosaggio), forma (Compressa/Capsula/Fiala/Gocce/Spray/Cerotto/Sciroppo), cat (categoria terapeutica breve). Max 10 risultati. Solo JSON puro.',
          messages: [{ role: 'user', content: 'Farmaci italiani per: ' + q }]
        })
      });
      const claudeData = await claudeRes.json();
      const text = claudeData.content[0].text.trim().replace(/```json|```/g, '').trim();
      const results = JSON.parse(text);
      res.status(200).json({ results, source: 'AI', total: results.length });
    } catch(e2) {
      res.status(500).json({ error: 'Servizio non disponibile', results: [] });
    }
  }
}
