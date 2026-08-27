'use strict';

const $ = (id) => document.getElementById(id);

const scannerState = { running:false, markets:[], configured:[], selectedSymbol:'R_100' };

function renderScanner() {
  const host = $('market-scanner-container');
  if (!host) return;
  const markets = scannerState.markets || [];
  const configured = new Set(scannerState.configured || []);
  host.innerHTML = `<section class="market-scanner-panel" aria-label="Market Scanner"><header><h2>Market Scanner</h2><div class="market-scanner-toolbar"><button id="scanner-start" ${scannerState.running?'disabled':''}>Start</button><button id="scanner-stop" ${scannerState.running?'':'disabled'}>Stop</button><button id="scanner-refresh" class="secondary">Refresh</button></div></header><div class="market-scanner-status">${scannerState.running?'Running':'Stopped'}</div><div class="card" style="margin-top:12px"><label>Markets</label><div class="market-options">${['R_50','R_75','R_100','R_200'].map(s=>`<label><input type="checkbox" data-market value="${s}" ${configured.has(s)?'checked':''}> ${s}</label>`).join('')}</div><div class="market-config-actions"><button id="scanner-apply">Apply</button><button id="scanner-reset" class="secondary">Reset</button></div></div><table><thead><tr><th>Rank</th><th>Market</th><th>Price</th><th>Score</th><th>Confidence</th><th>Signal</th></tr></thead><tbody>${markets.map((m,i)=>`<tr><td>${m.rank??i+1}</td><td>${m.symbol??''}</td><td>${m.lastTick?.quote??''}</td><td>${m.ranking?.score??m.score??''}</td><td>${m.ranking?.confidence??m.confidence??''}</td><td>${m.signal??m.dominantSignal??''}</td></tr>`).join('')||'<tr><td colspan="6">No markets configured</td></tr>'}</tbody></table></section>`;
  $('scanner-start')?.addEventListener('click', async()=>{ try { await window.derivAnalytics.scanner.start(); await refreshScanner(); } catch(e){ showError(e); } });
  $('scanner-stop')?.addEventListener('click', async()=>{ try { await window.derivAnalytics.scanner.stop(); await refreshScanner(); } catch(e){ showError(e); } });
  $('scanner-refresh')?.addEventListener('click', refreshScanner);
  $('scanner-apply')?.addEventListener('click', async()=>{ try { const selected=[...host.querySelectorAll('[data-market]:checked')].map(x=>x.value); if(!selected.length) throw new Error('Select at least one market'); await window.derivAnalytics.scanner.configuration.set(selected); await refreshScanner(); } catch(e){ showError(e); } });
  $('scanner-reset')?.addEventListener('click', async()=>{ try { await window.derivAnalytics.scanner.configuration.reset(); await refreshScanner(); } catch(e){ showError(e); } });
}

async function refreshScanner() {
  if (!window.derivAnalytics?.scanner) return;
  try {
    const [status, markets, configured] = await Promise.all([window.derivAnalytics.scanner.getStatus(), window.derivAnalytics.scanner.getMarkets(), window.derivAnalytics.scanner.configuration.get()]);
    scannerState.running=Boolean(status?.running); scannerState.markets=Array.isArray(markets)?markets:[]; scannerState.configured=Array.isArray(configured)?configured:[];
    renderScanner();
  } catch(e){ showError(e); }
}

function setupSidebar() {
  const host=$('sidebar-container'); if(!host) return;
  const symbols=[['R_50','Volatility 50'],['R_75','Volatility 75'],['R_100','Volatility 100'],['R_200','Volatility 200']];
  const panels=[['dashboard','Dashboard'],['market-scanner','Market Scanner']];
  host.innerHTML=`<div class="sidebar"><h2>Deriv Analytics</h2><div class="sidebar-section"><label for="symbol-selector">Market</label><select id="symbol-selector">${symbols.map(([v,n])=>`<option value="${v}" ${v===scannerState.selectedSymbol?'selected':''}>${n}</option>`).join('')}</select></div><div class="sidebar-section"><label>View</label><div class="panel-list">${panels.map(([id,n],i)=>`<button class="sidebar-item ${i===0?'active':''}" data-panel="${id}">${n}</button>`).join('')}</div></div></div>`;
  $('symbol-selector').addEventListener('change', async(e)=>{ scannerState.selectedSymbol=e.target.value; $('symbol').textContent=e.target.value; try { await window.derivAnalytics.scanner.configuration.set([e.target.value]); await refreshScanner(); } catch(err){ showError(err); } });
  host.querySelectorAll('[data-panel]').forEach(btn=>btn.addEventListener('click',()=>{ host.querySelectorAll('[data-panel]').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); const scanner=btn.dataset.panel==='market-scanner'; $('dashboard-panel').style.display=scanner?'none':'block'; $('scanner-panel').style.display=scanner?'block':'none'; if(scanner) refreshScanner(); }));
}

function showError(error) { const node=$('error'); if(node) node.textContent=error?.message||String(error); }

async function refreshStatus() {
  try { const status=await window.derivAnalytics.getStatus(); $('version').textContent=`v${status.version}`; $('db').textContent=status.databaseConnected?'Connected':'Unavailable'; $('symbol').textContent=status.analytics?.symbol||scannerState.selectedSymbol; $('ticks').textContent=status.analytics?.tickCount??0; $('confidence').textContent=`${status.analytics?.confidence??0}%`; } catch(e){ showError(e); }
}
async function refreshReplay(){ try { const status=await window.derivAnalytics.replay.status(); $('replay').textContent=JSON.stringify(status,null,2); await refreshStatus(); } catch(e){ showError(e); } }
async function refreshSessions(){ try { $('sessions').textContent=JSON.stringify(await window.derivAnalytics.sessions.list(),null,2); } catch(e){ $('sessions').textContent=e.message; } }

$('demo').addEventListener('click',async()=>{ const ticks=Array.from({length:40},(_,i)=>({value:100+Math.sin(i/3)*2+(i%10)/100,timestamp:Date.now()+i*50})); try{await window.derivAnalytics.replay.start(ticks,'R_100');await refreshReplay();}catch(e){showError(e);}});
$('pause').addEventListener('click',async()=>{await window.derivAnalytics.replay.pause();await refreshReplay();});
$('resume').addEventListener('click',async()=>{await window.derivAnalytics.replay.resume();await refreshReplay();});
$('stop').addEventListener('click',async()=>{await window.derivAnalytics.replay.stop();await refreshReplay();});
$('refresh').addEventListener('click',refreshSessions);

setupSidebar();
if(window.AlertCenter&&$('alert-center')){window.alertCenter=new window.AlertCenter($('alert-center'),window.derivAnalytics.alerts);window.alertCenter.initialize();}
window.derivAnalytics?.scanner?.on?.('market-tick',()=>refreshScanner());
window.derivAnalytics?.scanner?.on?.('analysis-updated',()=>refreshScanner());
window.derivAnalytics?.scanner?.on?.('markets-changed',()=>refreshScanner());
refreshStatus(); refreshSessions(); refreshScanner();
setInterval(refreshStatus,1000); setInterval(refreshReplay,1000);
