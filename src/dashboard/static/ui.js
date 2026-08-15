(function(){
  const tokenInput = document.getElementById('token');
  const statsBtn = document.getElementById('statsBtn');
  const snapshotBtn = document.getElementById('snapshotBtn');
  const runSamplesBtn = document.getElementById('runSamplesBtn');
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('search');
  const categoryFilter = document.getElementById('categoryFilter');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const pageInfo = document.getElementById('pageInfo');
  const tbody = document.querySelector('#commandsTable tbody');
  const previewModal = document.getElementById('previewModal');
  const previewTrigger = document.getElementById('previewTrigger');
  const previewResponse = document.getElementById('previewResponse');
  const closePreview = document.getElementById('closePreview');
  const toggleEnable = document.getElementById('toggleEnable');

  let page = 1, limit = 50, lastQuery = '', lastCategory = '';
  let lastPreview = null;

  function headers() {
    const t = tokenInput.value;
    return t ? { 'x-owner-token': t, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }

  async function fetchStats() {
    const r = await fetch('/dashboard/api/stats', { headers: headers() });
    if (!r.ok) return alert('Stats fetch failed: ' + r.statusText);
    const js = await r.json();
    const s = document.getElementById('stats');
    s.innerText = `Total: ${js.total}  Enabled: ${js.enabled}`;
    // populate categories
    categoryFilter.innerHTML = '<option value="">All categories</option>' + js.byCategory.map(c=>`<option value="${c.category}">${c.category} (${c.cnt})</option>`).join('');
  }

  async function loadCommands() {
    const q = encodeURIComponent(lastQuery);
    const cat = encodeURIComponent(lastCategory);
    const url = `/dashboard/api/commands?page=${page}&limit=${limit}&q=${q}&category=${cat}`;
    const r = await fetch(url, { headers: headers() });
    if (!r.ok) return alert('Load failed');
    const js = await r.json();
    tbody.innerHTML = js.rows.map(row=>`<tr><td>${row.trigger}</td><td>${row.category}</td><td>${row.enabled?'<b>enabled</b>':'disabled'}</td><td><button data-trigger="${row.trigger}" class="previewBtn">Preview</button> <button data-trigger="${row.trigger}" class="toggleBtn">Toggle</button></td></tr>`).join('');
    pageInfo.innerText = `Page ${js.page} — ${js.total} results`;
    attachTableHandlers();
  }

  function attachTableHandlers(){
    document.querySelectorAll('.previewBtn').forEach(b=>b.addEventListener('click', async (ev)=>{
      const trg = ev.target.getAttribute('data-trigger');
      const r = await fetch(`/dashboard/api/commands?page=1&limit=1&q=${encodeURIComponent(trg)}`, { headers: headers() });
      const js = await r.json();
      const row = js.rows[0];
      lastPreview = row;
      previewTrigger.innerText = row.trigger;
      previewResponse.innerText = row.response;
      previewModal.classList.remove('hidden');
    }));
    document.querySelectorAll('.toggleBtn').forEach(b=>b.addEventListener('click', async (ev)=>{
      const trg = ev.target.getAttribute('data-trigger');
      const pdb = confirm('Toggle enabled for ' + trg + '?');
      if (!pdb) return;
      await fetch('/dashboard/api/command/enable', { method: 'POST', headers: headers(), body: JSON.stringify({ trigger: trg, enabled: true }) });
      loadCommands();
    }));
  }

  statsBtn.addEventListener('click', fetchStats);
  snapshotBtn.addEventListener('click', async ()=>{
    const r = await fetch('/dashboard/api/snapshot', { method: 'POST', headers: headers() });
    if (!r.ok) return alert('Snapshot failed');
    const js = await r.json();
    alert('Snapshot written: ' + js.file);
  });
  runSamplesBtn.addEventListener('click', async ()=>{
    const r = await fetch('/dashboard/api/run-samples', { method: 'POST', headers: headers(), body: JSON.stringify({ count: 10 }) });
    const js = await r.json();
    alert('Sample count: ' + js.samples.length);
  });
  searchBtn.addEventListener('click', ()=>{ lastQuery = searchInput.value; page = 1; loadCommands(); });
  categoryFilter.addEventListener('change', ()=>{ lastCategory = categoryFilter.value; page = 1; loadCommands(); });
  prevBtn.addEventListener('click', ()=>{ if (page>1) { page--; loadCommands(); } });
  nextBtn.addEventListener('click', ()=>{ page++; loadCommands(); });
  closePreview.addEventListener('click', ()=> previewModal.classList.add('hidden'));
  toggleEnable.addEventListener('click', async ()=>{
    if (!lastPreview) return;
    const trg = lastPreview.trigger;
    const newEnabled = !lastPreview.enabled;
    await fetch('/dashboard/api/command/enable', { method: 'POST', headers: headers(), body: JSON.stringify({ trigger: trg, enabled: newEnabled }) });
    previewModal.classList.add('hidden');
    loadCommands();
  });

  // initial load
  fetchStats();
  loadCommands();
})();
