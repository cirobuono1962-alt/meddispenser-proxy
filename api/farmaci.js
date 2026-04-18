module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const q = req.query.q;
  if (!q || q.length < 2) { 
    res.status(400).json({ error: 'Query troppo corta' }); 
    return; 
  }

  try {
    const url = 'https://medicinali.aifa.gov.it/aifa-services/rest/getSearchResult?searchString=' 
      + encodeURIComponent(q) + '&start=0&count=20&lang=IT';
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        'Accept': 'application/json',
        'Referer': 'https://medicinali.aifa.gov.it/'
      }
    });

    if (!response.ok) throw new Error('AIFA error: ' + response.status);

    const data = await response.json();
    const results = (data.items || []).map(item => ({
      name:      item.denominazione || '',
      dose:      item.confezione || '',
      principle: item.principioAttivo || '',
      producer:  item.titolareAIC || '',
      forma:     item.formaFarmaceutica || 'Compressa',
      cat:       item.atcDescrizione || ''
    })).filter(r => r.name.length > 0);

    res.status(200).json({ results, source: 'AIFA' });

  } catch(e) {
    // Fallback Claude AI
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
          system: 'Sei un esperto di farmaci italiani. Rispondi SOLO con un array JSON valido. Ogni oggetto ha: name, principle, producer, dose, forma, cat. Max 10 risultati. Nessun testo extra.',
          messages: [{ role: 'user', content: 'Farmaci italiani: ' + q }]
        })
      });
      const cd = await claudeRes.json();
      const text = cd.content[0].text.replace(/```json|```/g,'').trim();
      const results = JSON.parse(text);
      res.status(200).json({ results, source: 'AI' });
    } catch(e2) {
      res.status(500).json({ error: e.message, results: [] });
    }
  }
}
