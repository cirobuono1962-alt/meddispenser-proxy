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

  // Database fisso farmaci comuni con dati reali verificati
  const KNOWN = [
    {name:'Eliquis 2.5mg',principle:'Apixaban',producer:'Bristol-Myers Squibb',dose:'2.5mg',forma:'Compressa',cat:'Anticoagulante',shape:'oval',color:'pink',score:false},
    {name:'Eliquis 5mg',principle:'Apixaban',producer:'Bristol-Myers Squibb',dose:'5mg',forma:'Compressa',cat:'Anticoagulante',shape:'oval',color:'pink',score:false},
    {name:'Xarelto 10mg',principle:'Rivaroxaban',producer:'Bayer',dose:'10mg',forma:'Compressa',cat:'Anticoagulante',shape:'round',color:'red',score:false},
    {name:'Xarelto 15mg',principle:'Rivaroxaban',producer:'Bayer',dose:'15mg',forma:'Compressa',cat:'Anticoagulante',shape:'round',color:'red',score:false},
    {name:'Xarelto 20mg',principle:'Rivaroxaban',producer:'Bayer',dose:'20mg',forma:'Compressa',cat:'Anticoagulante',shape:'oval',color:'brown',score:false},
    {name:'Ramilolo 5mg',principle:'Ramipril',producer:'Menarini',dose:'5mg',forma:'Compressa',cat:'ACE-inibitore',shape:'oval',color:'yellow',score:true},
    {name:'Ramilolo 2.5mg',principle:'Ramipril',producer:'Menarini',dose:'2.5mg',forma:'Compressa',cat:'ACE-inibitore',shape:'oval',color:'white',score:true},
    {name:'Ramipril 2.5mg',principle:'Ramipril',producer:'Generico',dose:'2.5mg',forma:'Compressa',cat:'ACE-inibitore',shape:'oval',color:'white',score:true},
    {name:'Ramipril 5mg',principle:'Ramipril',producer:'Generico',dose:'5mg',forma:'Compressa',cat:'ACE-inibitore',shape:'oval',color:'white',score:true},
    {name:'Ramipril 10mg',principle:'Ramipril',producer:'Generico',dose:'10mg',forma:'Compressa',cat:'ACE-inibitore',shape:'oval',color:'white',score:true},
    {name:'Ezetimibe 10mg',principle:'Ezetimibe',producer:'MSD',dose:'10mg',forma:'Compressa',cat:'Ipolipemizzante',shape:'oval',color:'white',score:false},
    {name:'Atorvastatina 10mg',principle:'Atorvastatina',producer:'Generico',dose:'10mg',forma:'Compressa',cat:'Statina',shape:'oval',color:'white',score:false},
    {name:'Atorvastatina 20mg',principle:'Atorvastatina',producer:'Generico',dose:'20mg',forma:'Compressa',cat:'Statina',shape:'oval',color:'white',score:false},
    {name:'Atorvastatina 40mg',principle:'Atorvastatina',producer:'Generico',dose:'40mg',forma:'Compressa',cat:'Statina',shape:'oval',color:'white',score:false},
    {name:'Aspirina 100mg',principle:'Acido Acetilsalicilico',producer:'Bayer',dose:'100mg',forma:'Compressa',cat:'Antiaggregante',shape:'round',color:'white',score:true},
    {name:'Cardioaspirin 100mg',principle:'Acido Acetilsalicilico',producer:'Bayer',dose:'100mg',forma:'Compressa',cat:'Antiaggregante',shape:'round',color:'white',score:false},
    {name:'Tachipirina 500mg',principle:'Paracetamolo',producer:'Angelini',dose:'500mg',forma:'Compressa',cat:'Analgesico',shape:'oblong',color:'white',score:true},
    {name:'Tachipirina 1000mg',principle:'Paracetamolo',producer:'Angelini',dose:'1000mg',forma:'Compressa',cat:'Analgesico',shape:'oblong',color:'white',score:true},
    {name:'Lasix 25mg',principle:'Furosemide',producer:'Sanofi',dose:'25mg',forma:'Compressa',cat:'Diuretico',shape:'round',color:'white',score:true},
    {name:'Lasix 500mg',principle:'Furosemide',producer:'Sanofi',dose:'500mg',forma:'Compressa',cat:'Diuretico',shape:'oblong',color:'white',score:true},
    {name:'Eutirox 25mcg',principle:'Levotiroxina',producer:'Merck',dose:'25mcg',forma:'Compressa',cat:'Tiroide',shape:'round',color:'white',score:true},
    {name:'Eutirox 50mcg',principle:'Levotiroxina',producer:'Merck',dose:'50mcg',forma:'Compressa',cat:'Tiroide',shape:'round',color:'white',score:true},
    {name:'Eutirox 75mcg',principle:'Levotiroxina',producer:'Merck',dose:'75mcg',forma:'Compressa',cat:'Tiroide',shape:'round',color:'white',score:true},
    {name:'Eutirox 100mcg',principle:'Levotiroxina',producer:'Merck',dose:'100mcg',forma:'Compressa',cat:'Tiroide',shape:'round',color:'white',score:true},
    {name:'Norvasc 5mg',principle:'Amlodipina',producer:'Pfizer',dose:'5mg',forma:'Compressa',cat:'Calcio-antagonista',shape:'oblong',color:'white',score:true},
    {name:'Norvasc 10mg',principle:'Amlodipina',producer:'Pfizer',dose:'10mg',forma:'Compressa',cat:'Calcio-antagonista',shape:'oblong',color:'white',score:true},
    {name:'Concor 2.5mg',principle:'Bisoprololo',producer:'Merck',dose:'2.5mg',forma:'Compressa',cat:'Beta-bloccante',shape:'oval',color:'white',score:true},
    {name:'Concor 5mg',principle:'Bisoprololo',producer:'Merck',dose:'5mg',forma:'Compressa',cat:'Beta-bloccante',shape:'oval',color:'yellow',score:true},
    {name:'Concor 10mg',principle:'Bisoprololo',producer:'Merck',dose:'10mg',forma:'Compressa',cat:'Beta-bloccante',shape:'oval',color:'orange',score:true},
    {name:'Cardicor 1.25mg',principle:'Bisoprololo fumarato',producer:'Recordati',dose:'1.25mg',forma:'Compressa',cat:'Beta-bloccante',shape:'round',color:'white',score:true},
    {name:'Cardicor 2.5mg',principle:'Bisoprololo fumarato',producer:'Recordati',dose:'2.5mg',forma:'Compressa',cat:'Beta-bloccante',shape:'round',color:'white',score:true},
    {name:'Cardicor 5mg',principle:'Bisoprololo fumarato',producer:'Recordati',dose:'5mg',forma:'Compressa',cat:'Beta-bloccante',shape:'round',color:'yellow',score:true},
    {name:'Cardicor 10mg',principle:'Bisoprololo fumarato',producer:'Recordati',dose:'10mg',forma:'Compressa',cat:'Beta-bloccante',shape:'round',color:'orange',score:true},
    {name:'Cordarone 200mg',principle:'Amiodarone',producer:'Sanofi',dose:'200mg',forma:'Compressa',cat:'Antiaritmico',shape:'round',color:'white',score:true},
    {name:'Plavix 75mg',principle:'Clopidogrel',producer:'Sanofi',dose:'75mg',forma:'Compressa',cat:'Antiaggregante',shape:'round',color:'pink',score:false},
    {name:'Coumadin 5mg',principle:'Warfarin',producer:'Bristol-Myers Squibb',dose:'5mg',forma:'Compressa',cat:'Anticoagulante',shape:'round',color:'pink',score:true},
    {name:'Omeprazolo 20mg',principle:'Omeprazolo',producer:'Generico',dose:'20mg',forma:'Capsula',cat:'Gastroprotettore',shape:'oval',color:'purple',score:false},
    {name:'Nexium 20mg',principle:'Esomeprazolo',producer:'AstraZeneca',dose:'20mg',forma:'Capsula',cat:'Gastroprotettore',shape:'oval',color:'pink',score:false},
    {name:'Nexium 40mg',principle:'Esomeprazolo',producer:'AstraZeneca',dose:'40mg',forma:'Capsula',cat:'Gastroprotettore',shape:'oval',color:'purple',score:false},
    {name:'Entresto 24/26mg',principle:'Sacubitril/Valsartan',producer:'Novartis',dose:'24/26mg',forma:'Compressa',cat:'Scompenso cardiaco',shape:'oval',color:'yellow',score:false},
    {name:'Entresto 49/51mg',principle:'Sacubitril/Valsartan',producer:'Novartis',dose:'49/51mg',forma:'Compressa',cat:'Scompenso cardiaco',shape:'oval',color:'pink',score:false},
    {name:'Metformina 500mg',principle:'Metformina',producer:'Generico',dose:'500mg',forma:'Compressa',cat:'Antidiabetico',shape:'oblong',color:'white',score:true},
    {name:'Metformina 1000mg',principle:'Metformina',producer:'Generico',dose:'1000mg',forma:'Compressa',cat:'Antidiabetico',shape:'oblong',color:'white',score:true},
    {name:'Jardiance 10mg',principle:'Empagliflozin',producer:'Boehringer/Lilly',dose:'10mg',forma:'Compressa',cat:'Antidiabetico',shape:'oval',color:'yellow',score:false},
    {name:'Jardiance 25mg',principle:'Empagliflozin',producer:'Boehringer/Lilly',dose:'25mg',forma:'Compressa',cat:'Antidiabetico',shape:'oval',color:'yellow',score:false},
    {name:'Voltaren 50mg',principle:'Diclofenac',producer:'Novartis',dose:'50mg',forma:'Compressa',cat:'FANS',shape:'round',color:'yellow',score:false},
    {name:'Brufen 400mg',principle:'Ibuprofene',producer:'Abbott',dose:'400mg',forma:'Compressa',cat:'FANS',shape:'oval',color:'white',score:true},
    {name:'Crestor 5mg',principle:'Rosuvastatina',producer:'AstraZeneca',dose:'5mg',forma:'Compressa',cat:'Statina',shape:'round',color:'yellow',score:false},
    {name:'Crestor 10mg',principle:'Rosuvastatina',producer:'AstraZeneca',dose:'10mg',forma:'Compressa',cat:'Statina',shape:'round',color:'pink',score:false},
    {name:'Crestor 20mg',principle:'Rosuvastatina',producer:'AstraZeneca',dose:'20mg',forma:'Compressa',cat:'Statina',shape:'round',color:'pink',score:false},
    {name:'Pradaxa 110mg',principle:'Dabigatran',producer:'Boehringer Ingelheim',dose:'110mg',forma:'Capsula',cat:'Anticoagulante',shape:'oval',color:'blue',score:false},
    {name:'Pradaxa 150mg',principle:'Dabigatran',producer:'Boehringer Ingelheim',dose:'150mg',forma:'Capsula',cat:'Anticoagulante',shape:'oval',color:'blue',score:false},
    {name:'Tavor 1mg',principle:'Lorazepam',producer:'Wyeth',dose:'1mg',forma:'Compressa',cat:'Ansiolitico',shape:'round',color:'white',score:true},
    {name:'Zoloft 50mg',principle:'Sertralina',producer:'Pfizer',dose:'50mg',forma:'Compressa',cat:'Antidepressivo',shape:'oblong',color:'white',score:true},
    {name:'Deltacortene 5mg',principle:'Prednisone',producer:'Pfizer',dose:'5mg',forma:'Compressa',cat:'Corticosteroide',shape:'round',color:'white',score:true},
    {name:'Omnic 0.4mg',principle:'Tamsulosina',producer:'Astellas',dose:'0.4mg',forma:'Capsula',cat:'Alfa-bloccante',shape:'oval',color:'orange',score:false},
  ];

  // Cerca nel database fisso
  const ql = q.toLowerCase();
  const known = KNOWN.filter(f =>
    f.name.toLowerCase().includes(ql) ||
    f.principle.toLowerCase().includes(ql)
  );

  if (known.length > 0) {
    return res.status(200).json({ results: known, source: 'DB' });
  }

  // Farmaco non trovato nel DB - usa AI senza dati visivi
  try {
    const payload = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: 'Sei un esperto di farmaci italiani AIFA. Cerca: ' + q + '. Elenca ogni dosaggio separatamente. Rispondi SOLO con JSON array. Campi: name (nome+dosaggio), principle, producer, dose, forma (Compressa/Capsula/Fiala/Gocce/Spray/Cerotto/Sciroppo), cat (categoria italiana). Max 10 risultati. Solo JSON puro.'
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

    if (!claudeRes.ok) throw new Error('Claude ' + claudeRes.status);
    const data = await claudeRes.json();
    const text = data.content[0].text.replace(/```json|```/g, '').trim();
    const results = JSON.parse(text);
    res.status(200).json({ results: Array.isArray(results) ? results : [], source: 'AI' });
  } catch(e) {
    res.status(500).json({ error: e.message, results: [] });
  }
}
