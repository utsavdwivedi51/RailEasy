const API_ENABLED = true;
const API_BASE = '/api/trains-between';
async function renderResults(){
  const { from, to, cls } = searchState;
  const wrap = qs('#results');
  wrap.innerHTML = '<div class="pill">Searching trains…</div>';

  if (API_ENABLED) {
    try {
      const list = await fetchTrainsFromAPI(from, to, searchState.date);
      if (!list || list.length === 0) return renderFromMock(wrap, from, to, cls);
      return renderFromAPIList(wrap, list, cls);
    } catch {
      return renderFromMock(wrap, from, to, cls);
    }
  } else {
    return renderFromMock(wrap, from, to, cls);
  }
}
async function fetchTrainsFromAPI(from, to, date){
  const url = `${API_BASE}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`;
  const r = await fetch(url, { headers: { 'Accept': 'application/json' }});
  if (!r.ok) throw new Error('API error');
  const data = await r.json();

  return (data.Trains || []).map(t => ({
    number: t.TrainNo,
    name: t.TrainName,
    depart: t.DepartureTime,
    arrive: t.ArrivalTime,
    duration: (t.TravelTime || '').replace('H','h ').replace('M','m'),
    from, to,
    // placeholder prices/availability for UI only
    classes: { SL: 500, 3A: 1200, 2A: 1600, 1A: 2600, CC: 900 },
    available: { SL: 100, 3A: 40, 2A: 20, 1A: 6, CC: 25 },
    days: 'S M T W T F S'
  }));
}

function renderFromAPIList(wrap, list, cls){
  wrap.innerHTML = '';
  list.filter(t => t.classes[cls]).forEach(t => {
    const fare = t.classes[cls];
    const left = t.available[cls] ?? 0;
    const el = document.createElement('div');
    el.className = 'result';
    el.innerHTML = `
      <div>
        <div class="name">${t.number} · ${t.name}</div>
        <div class="badge">${t.days}</div>
      </div>
      <div><div style="font-weight:600">${t.depart}</div><div class="sub">Departure</div></div>
      <div><div style="font-weight:600">${t.arrive}</div><div class="sub">Arrival</div></div>
      <div><div>${t.duration}</div><div class="sub">Duration</div></div>
      <div><div>${formatINR(fare)}</div><div class="sub">Base Fare (${searchState.cls})</div></div>
      <div style="display:flex;gap:8px;align-items:center;justify-content:end">
        <button class="btn" data-track>Track</button>
        <button class="btn primary" data-select>Select</button>
      </div>`;
    el.querySelector('[data-select]').addEventListener('click', ()=>{
      selectedTrain = t; passengers = []; qs('#passengers').innerHTML = ''; addPassengerRow(); updateFare();
      qs('#selTrainPill').textContent = `${t.number} ${t.name} · ${t.depart} → ${t.arrive}`;
      setStep(2); qs('#bookingSection').style.display='block';
    });
    el.querySelector('[data-track]').addEventListener('click', ()=> openWIMT(t));
    wrap.appendChild(el);
  });
}

function renderFromMock(wrap, from, to, cls){
  const matches = MOCK_TRAINS.filter(t => t.from===from && t.to===to && t.classes[cls]!==undefined);
  if(matches.length===0){
    wrap.innerHTML = `<div class="pill">No trains found for ${from} → ${to}. Try enabling the API.</div>`;
    return;
  }
  wrap.innerHTML = '';
  matches.forEach(t => {
    const fare = t.classes[cls];
    const left = t.available[cls] ?? 0;
    const el = document.createElement('div');
    el.className = 'result';
    el.innerHTML = `
      <div>
        <div class="name">${t.number} · ${t.name}</div>
        <div class="badge">${t.days}</div>
      </div>
      <div><div style="font-weight:600">${t.depart}</div><div class="sub">Departure</div></div>
      <div><div style="font-weight:600">${t.arrive}</div><div class="sub">Arrival</div></div>
      <div><div>${t.duration}</div><div class="sub">Duration</div></div>
      <div><div>${formatINR(fare)}</div><div class="sub">Base Fare (${searchState.cls})</div></div>
      <div style="display:flex;gap:8px;align-items:center;justify-content:end">
        <span class="badge">${left>0? left+' seats':'WL'}</span>
        <button class="btn" data-track>Track</button>
        <button class="btn primary" data-select>Select</button>
      </div>`;
    el.querySelector('[data-select]').addEventListener('click', ()=>{
      selectedTrain = t; passengers=[]; qs('#passengers').innerHTML=''; addPassengerRow(); updateFare();
      qs('#selTrainPill').textContent = `${t.number} ${t.name} · ${t.depart} → ${t.arrive}`;
      setStep(2); qs('#bookingSection').style.display='block';
    });
    el.querySelector('[data-track]').addEventListener('click', ()=> openWIMT(t));
    wrap.appendChild(el);
  });
}
