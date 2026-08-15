// Updater UI panel
const updaterPanel = `
  <div class="panel">
    <h2>Updater</h2>
    <label>GitHub repo (owner/repo)</label>
    <input id="updaterRepo" placeholder="owner/repo" />
    <label>Branch</label>
    <input id="updaterBranch" placeholder="main" />
    <button id="runUpdater">Download & Extract</button>
    <pre id="updaterResult">(none)</pre>
    <h3>Available updates</h3>
    <button id="listUpdates">List updates</button>
    <pre id="updatesList">(none)</pre>
  </div>
`;

// append into DOM
const container = document.getElementById('app');
container.innerHTML = container.innerHTML + updaterPanel;

document.getElementById('runUpdater').onclick = async () => {
  const token = await getToken();
  const repo = (document.getElementById('updaterRepo') as HTMLInputElement).value;
  const branch = (document.getElementById('updaterBranch') as HTMLInputElement).value || 'main';
  const res = await fetch('/dashboard/updater', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-owner-token': token }, body: JSON.stringify({ repo, branch }) });
  const j = await res.json();
  document.getElementById('updaterResult').innerText = JSON.stringify(j, null, 2);
};

document.getElementById('listUpdates').onclick = async () => {
  const token = await getToken();
  const res = await fetch('/dashboard/updates', { headers: { 'x-owner-token': token } });
  const j = await res.json();
  document.getElementById('updatesList').innerText = JSON.stringify(j, null, 2);
};
`;

// Insert after existing scripts
const script = document.createElement('script');
script.innerText = updaterPanel + '\n' + document.querySelector('script').innerText;

// Note: For simplicity we appended updater UI into existing static app.js logic above by concatenation during build time.
