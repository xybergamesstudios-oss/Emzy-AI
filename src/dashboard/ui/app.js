document.getElementById('saveToken').onclick = () => {
  const token = (document.getElementById('token') as HTMLInputElement).value;
  localStorage.setItem('owner_token', token);
  alert('Token saved locally. Use it when calling the API.');
};

async function getToken() {
  return localStorage.getItem('owner_token') || prompt('Enter owner token (x-owner-token):');
}

document.getElementById('applySettings').onclick = async () => {
  const token = await getToken();
  const antiLink = (document.getElementById('antiLink') as HTMLInputElement).checked;
  const viewOnce = (document.getElementById('viewOnce') as HTMLInputElement).checked;
  const warnLimit = parseInt((document.getElementById('warnLimit') as HTMLInputElement).value, 10);
  const res = await fetch('/dashboard/broadcast-settings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-owner-token': token }, body: JSON.stringify({ anti_link: antiLink, view_once_save: viewOnce, warn_limit: warnLimit }) });
  const j = await res.json();
  document.getElementById('settingsResult').innerText = JSON.stringify(j, null, 2);
};

document.getElementById('refreshPairings').onclick = async () => {
  const token = await getToken();
  const res = await fetch('/dashboard/pairings', { headers: { 'x-owner-token': token } });
  const j = await res.json();
  document.getElementById('pairings').innerText = JSON.stringify(j, null, 2);
};

document.getElementById('refreshTraining').onclick = async () => {
  const token = await getToken();
  const res = await fetch('/dashboard/training_examples', { headers: { 'x-owner-token': token } });
  const j = await res.json();
  document.getElementById('training').innerText = JSON.stringify(j, null, 2);
};

document.getElementById('refreshViewOnce').onclick = async () => {
  const token = await getToken();
  const res = await fetch('/dashboard/viewonce-files', { headers: { 'x-owner-token': token } });
  const j = await res.json();
  document.getElementById('viewonce').innerText = JSON.stringify(j, null, 2);
};

let es: EventSource | null = null;
document.getElementById('connectStream').onclick = async () => {
  const token = await getToken();
  if (es) { es.close(); es = null; document.getElementById('streamLog').innerText = '(disconnected)'; return; }
  es = new EventSource('/dashboard/stream?token=' + encodeURIComponent(token));
  es.onmessage = (e) => {
    const el = document.getElementById('streamLog');
    el.innerText = (el.innerText || '') + '\n' + e.data;
  };
  es.onerror = (e) => { document.getElementById('streamLog').innerText = 'Stream error'; };
  document.getElementById('streamLog').innerText = 'Connected';
};
