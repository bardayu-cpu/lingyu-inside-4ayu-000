/* =====================================================================
   灵屿 2.0 试用版外壳：学生端 + 机构端切换、两端联动、意见采集
===================================================================== */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const FR = { 学生端: null, 机构端: null };
const ST = { dock: store.get('ly_dock', 'right'), side: store.get('ly_side', '学生端'), name: store.get('ly_name', ''), fb: null, mine: store.get('ly_fb_' + VER, []), panel: null, ctxWait: {} };
const TYPES = ['看不懂', '不好用', '出错了', '建议', '其他'];

/* ---------- 顶栏与切换 ---------- */
function bar() {
  const q = ST.mine.filter(x => !x.sent).length;
  $('#tb').innerHTML = `<div class="lg"><img src="${MASCOT}" alt=""><span>灵屿 2.0 试用版 <small>${VER}</small></span></div>
    <div class="seg">${['学生端', '机构端'].map(s => `<button class="${ST.side === s ? 'on' : ''}" data-side="${s}">${s}</button>`).join('')}</div>
    <span class="fic">演示数据，全部为虚构</span><span class="sp"></span>
    ${ST.name ? `<span class="who">试用人：<b>${esc(ST.name)}</b><button class="lnk" data-do="rename">改</button></span>` : ''}
    <button class="btn" data-do="mine">我的意见 ${ST.mine.length}${q ? `（${q} 条待发送）` : ''}</button>
    ${ST.collect ? `<button class="btn on" data-do="stop">✓ 结束提意见</button>` : '<button class="btn pri" data-do="fb">💬 提意见</button>'}`;
  /* v1.16（U12）：左右各一个提意见入口；面板可以放左边或右边，不挡要点的地方 */
  let f = $('#fabs'); if (!f) { document.body.insertAdjacentHTML('beforeend', '<div id="fabs"></div>'); f = $('#fabs'); }
  f.innerHTML = ST.collect ? '' : '<button class="fab l" data-do="fbL" title="提意见（面板在左边）">提意见</button><button class="fab r" data-do="fbR" title="提意见（面板在右边）">提意见</button>';
}
function show(side) { ST.side = side; store.set('ly_side', side); Object.entries(FR).forEach(([k, f]) => f.classList.toggle('on', k === side)); bar(); if (ST.collect) { keepText(); pickOn(); panel('fb'); } }
function post(side, m) { const f = FR[side]; if (f && f.contentWindow) f.contentWindow.postMessage(Object.assign({ ly: 1, to: side }, m), '*'); }

/* ---------- 两端联动：比较前后两次状态，推导出事件 ---------- */
const last = { 学生端: null, 机构端: null };
function syncNote(t) { if (!t) return; const n = $('#sync'); n.textContent = '已联动 · ' + t; n.classList.add('on'); clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove('on'), 4200); }
function fromStu(p, c) {
  if (!p || p.inst !== c.inst || p.scen !== c.scen) return [];
  const ev = [], a = p.bk, b = c.bk, core = c.core, same = (x, y) => x && y && x.cid === y.cid && x.date === y.date && x.ti === y.ti;
  if (b && (b.st === '待确认' || b.st === '已确认' && !b.moved && b.kind === '预咨询') && !b.pend && (!a || !same(a, b))) ev.push({ t: 'book', core, cid: b.cid, date: b.date, ti: b.ti, mode: b.mode, kind: b.kind, inv: b.inv });
  if (b && b.pend && !(a && a.pend)) ev.push({ t: 'req', core, type: b.pend.type, date: b.pend.date, ti: b.pend.ti });
  if (a && !b && a.st === '待确认' && !a.pend) ev.push({ t: 'cancel', core });
  if (a && b && same(a, b) && a.st === '待确认' && b.st === '已确认') ev.push({ t: 'ok', core });
  if (c.cb && !p.cb) ev.push({ t: 'callback', core });
  if (c.crisis && !p.crisis) ev.push({ t: 'crisis', core });
  c.done.filter(x => !p.done.includes(x)).forEach(x => ev.push({ t: 'done', core, task: x }));
  const da = p.decl || [], db = c.decl || []; db.filter(x => !da.includes(x)).forEach(x => ev.push({ t: 'decl', core, task: x, on: true })); da.filter(x => !db.includes(x)).forEach(x => ev.push({ t: 'decl', core, task: x, on: false }));
  const ia = a && a.intake, ib = b && b.intake;
  if (ib && ['sent', 'skipped'].includes(ib.st) && (!ia || ia.st !== ib.st || ia.ver !== ib.ver)) ev.push({ t: 'intake', core, intake: ib });
  const ra = (p.inv || []), rb = (c.inv || []); rb.forEach(v => { const o = ra.find(x => x.id === v.id); if (v.rv > ((o && o.rv) || 0)) ev.push({ t: 'invReply', core, id: v.id, r: v.r, slots: v.slots, why: v.why, ver: v.ver }); });
  return ev;
}
function fromAdm(p, c) {
  if (!p) return []; const ev = [];
  Object.keys(c).forEach(k => { if (k === '__cfg' || k === '__no' || k === '__inv') return; const a = p[k], b = c[k]; if (!a) return; if (b && b.id === a.id && !a.iv && b.iv) ev.push({ t: 'intakeViewed', core: k }); const moved = b && (a.day !== b.day || a.t !== b.t);
    if (a.st === 'confirm' && b && b.id === a.id && b.st === 'ok') ev.push(moved ? { t: 'move', core: k, date: b.date, ti: b.t } : { t: 'confirm', core: k });
    else if (a.st === 'confirm' && !b) ev.push({ t: 'decline', core: k });
    else if (a.st === 'ok' && !b && c.__no && c.__no[k]) ev.push({ t: 'decline', core: k });
    else if (a.st === 'change' && b && b.id === a.id && b.st === 'ok') ev.push(moved ? { t: 'agree', core: k } : { t: 'deny', core: k });
    else if (a.st === 'change' && !b) ev.push({ t: 'agree', core: k });
    else if (a.st === 'ok' && b && b.st === 'ok' && b.id === a.id && moved) ev.push({ t: 'move', core: k, date: b.date, ti: b.t }); });
  const ia = p.__inv || {}; Object.entries(c.__inv || {}).forEach(([k, L]) => L.forEach(v => { const o = (ia[k] || []).find(x => x.id === v.id);
    if (!o) ev.push({ t: 'invite', core: k, inv: v }); else if (o.st !== v.st || o.ver !== v.ver || o.start !== v.start) ev.push({ t: 'invUpd', core: k, inv: v }); }));
  return ev;
}
window.addEventListener('message', e => {
  const d = e.data; if (!d || !d.ly || !d.side) return;
  if (d.t === 'snap') { const p = d.init ? null : last[d.side]; last[d.side] = d.snap;
    if (d.side === '学生端') fromStu(p, d.snap).forEach(ev => post('机构端', { t: 'ev', ev }));
    else { const core = last['学生端'] && last['学生端'].core; fromAdm(p, d.snap).filter(ev => ev.core === core).forEach(ev => post('学生端', { t: 'ev', ev })); }
    const iv = last['机构端'] && last['机构端'].__inv, sc = last['学生端'];
    if (iv && sc && (d.side === '学生端' ? d.init || (p && (p.scen !== d.snap.scen || p.inst !== d.snap.inst)) : !p)) post('学生端', { t: 'ev', ev: { t: 'invSync', invs: iv[sc.core] || [] } });
    const cf = last['机构端'] && last['机构端'].__cfg, pc = d.side === '机构端' && p && p.__cfg;
    if (cf && (d.side === '学生端' ? d.init : !pc || JSON.stringify(pc) !== JSON.stringify(cf))) post('学生端', { t: 'ev', ev: Object.assign({ t: 'cfg' }, cf) }); }
  else if (d.t === 'applied') syncNote(d.msg ? `${d.side === '机构端' ? '学生端 → 机构端' : '机构端 → 学生端'}：${d.msg}` : '');
  else if (d.t === 'picked' && ST.collect) { keepText(); ST.fb = Object.assign(ST.fb || {}, { el: d.el, ctx: d.ctx, side: d.side }); panel('fb'); }
  else if (d.t === 'pickCancel' && ST.collect) { keepText(); if (ST.fb) { delete ST.fb.el; delete ST.fb.ctx; } panel('fb'); }
  else if (d.t === 'ctx' && ST.ctxWait[d.id]) { ST.ctxWait[d.id](d.ctx); delete ST.ctxWait[d.id]; }
});
const askCtx = side => new Promise(res => { const id = Math.random().toString(36).slice(2); ST.ctxWait[id] = res; post(side, { t: 'ctx', id }); setTimeout(() => { if (ST.ctxWait[id]) { delete ST.ctxWait[id]; res({ 端: side }); } }, 800); });

/* ---------- 名字 ---------- */
function askName(force) {
  if (ST.name && !force) return;
  $('#ov').innerHTML = `<div class="ov"><div class="card"><h3>${force ? '修改名字' : '欢迎试用灵屿 2.0'}</h3><p>${force ? '' : '这是给咨询中心看的演示版，里面的学生和数据全部是虚构的。<br>试用中觉得哪里看不懂、不好用、出错了，随时点右上角「提意见」。<br><br>'}请先写下你的名字，方便我们区分每个人的意见。</p>
    <input class="in" id="nm" placeholder="你的名字" value="${esc(ST.name)}" maxlength="30"><div class="err" id="nmErr"></div>
    <div class="row">${force ? '<button class="btn" data-do="ovClose">取消</button>' : ''}<button class="btn pri" data-do="nameOk">${force ? '保存' : '开始试用'}</button></div></div></div>`;
  setTimeout(() => $('#nm') && $('#nm').focus(), 30);
}
function nameOk() { const v = ($('#nm').value || '').trim(); if (!v) { $('#nmErr').textContent = '请写下你的名字'; return; } ST.name = v; store.set('ly_name', v); $('#ov').innerHTML = ''; bar(); }

/* ---------- 提意见：点「提意见」进入采集模式，点页面任意位置 → 写一句 → 回车，连续提 ---------- */
function fbPanel() { const f = ST.fb || (ST.fb = {}), n = ST.mine.filter(x => x._s === ST.sess).length;
  return `<div class="pn ${ST.dock}"><div class="ph"><b>提意见</b><span class="cnt">本次已提 ${n} 条</span><button class="lnk dk" data-do="dock" title="面板挡住了要点的地方？换到另一边">⇆ 放到${ST.dock === 'left' ? '右' : '左'}边</button><button class="x" data-do="stop" title="结束提意见">×</button></div><div class="pb">
    <div class="tip"><b>${ST.paused ? '已暂停点选' : '点页面上任意位置'}</b>，写一句，按 <kbd>回车</kbd> 提交，接着点下一处。<br>${ST.paused ? '现在可以正常操作页面。' : '需要先操作页面（切换页面、打开弹窗）时，点「暂停点选」。'}</div>
    <span class="lbl">位置</span>
    ${f.el ? `<div class="where">「${esc(f.el.text || '（无文字的区域）')}」<small>${esc(f.side)} · ${esc([f.ctx && f.ctx.页面, f.ctx && (f.ctx.账号 || f.ctx.场景)].filter(Boolean).join(' · '))}</small></div>` : `<div class="where" style="color:#8a8170">还没点选位置（也可以不点，直接写）</div>`}
    <span class="lbl">意见</span><textarea class="in" id="fbTxt" placeholder="写下你的想法，回车提交（Shift + 回车换行）">${esc(f.text || '')}</textarea>
    <span class="lbl">类型（可不选）</span><div class="chips">${TYPES.map(t => `<button class="${f.type === t ? 'on' : ''}" data-type="${t}">${t}</button>`).join('')}</div>
    <div class="err" id="fbErr"></div>
    <div class="row" style="justify-content:space-between"><button class="btn" data-do="pause">${ST.paused ? '👆 继续点选' : '⏸ 暂停点选'}</button><button class="btn pri" data-do="send">提交（回车）</button></div>
    <div class="row" style="justify-content:flex-start;margin-top:18px"><button class="lnk" data-do="stop">结束提意见</button></div>
    <p class="ctx">每条会自动附上：你的名字、学生端还是机构端、正在用的账号或场景、页面、时间和版本号。</p></div></div>`; }
function panel(k) {
  ST.panel = k; if (!k) { $('#pn').innerHTML = ''; return; }
  if (k === 'fb') { $('#pn').innerHTML = fbPanel(); const t = $('#fbTxt'); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }
  if (k === 'mine') { const q = ST.mine.filter(x => !x.sent).length;
    $('#pn').innerHTML = `<div class="pn ${ST.dock}"><div class="ph"><b>我的意见（${ST.mine.length}）</b><button class="x" data-do="close">×</button></div><div class="pb">
      ${q ? `<p class="where" style="margin:0 0 10px">有 ${q} 条还没发送出去${FB_URL ? '，联网后会自动重试' : '（意见表还没接通）'}。也可以点下面「下载」把文件发给项目组。</p>` : ''}
      ${ST.mine.slice().reverse().map(x => `<div class="item"><b>${esc(x.类型)}</b><span class="st ${x.sent ? 'ok' : 'q'}">${x.sent ? '已提交' : '待发送'}</span><div>${esc(x.意见)}</div><small>${esc(x.端)} · ${esc(x.页面 || '')}${x.位置 ? ' · 「' + esc(x.位置.slice(0, 30)) + '」' : ''} · ${esc(String(x.时间).slice(5, 16).replace('T', ' '))}</small></div>`).join('') || '<p style="color:#8a8170">还没有提过意见。</p>'}
      <div class="row" style="justify-content:space-between">${FB_URL ? `<button class="btn pri" data-do="resend" ${ST.mine.length ? '' : 'disabled'}>发送到 Google 表单</button>` : '<span></span>'}<button class="btn" data-do="export" ${ST.mine.length ? '' : 'disabled'}>下载</button></div>
      ${FB_URL ? '<p class="ctx">「发送到 Google 表单」会把上面全部意见再发一次，表格里已有的不会重复记录。</p>' : ''}</div></div>`; }
}
const keepText = () => { if (ST.fb && $('#fbTxt')) ST.fb.text = $('#fbTxt').value; };
function pickOn() { ['学生端', '机构端'].forEach(s => post(s, { t: s === ST.side && ST.collect && !ST.paused ? 'pick' : 'unpick', keep: 1 })); $('#picking').classList.toggle('on', ST.collect && !ST.paused); }
function startCollect() { if (!ST.name) return askName(); ST.collect = true; ST.paused = false; ST.sess = Date.now(); ST.fb = {}; panel('fb'); pickOn(); bar(); }
function stopCollect() { keepText(); if (ST.fb && ST.fb.text && ST.fb.text.trim() && !confirm('还有一条没提交的意见，确定结束吗？')) return; ST.collect = false; ST.fb = null; pickOn(); panel(null); bar(); }
function togglePause() { keepText(); ST.paused = !ST.paused; pickOn(); panel('fb'); }
async function send() {
  const f = ST.fb || {}, text = ($('#fbTxt').value || '').trim();
  if (!text) { $('#fbErr').textContent = '先写一句意见再提交'; return $('#fbTxt').focus(); }
  const side = f.el ? f.side : ST.side, ctx = f.ctx || await askCtx(side);
  const rec = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), 时间: (d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`)(new Date()), 试用人: ST.name, 版本: VER, 端: side, 类型: f.type || '未分类', 意见: text,
    位置: f.el ? f.el.text : '', 元素路径: f.el ? f.el.path : '', 账号或场景: ctx.账号 || ctx.场景 || '', 页面: ctx.页面 || '', 上下文: JSON.stringify(ctx), 屏幕: `${innerWidth}×${innerHeight}`, sent: false, _s: ST.sess };
  ST.mine.push(rec); store.set('ly_fb_' + VER, ST.mine); ST.fb = {}; post(side, { t: 'clearSel' });
  if (ST.collect) panel('fb'); else panel(null); bar(); flush(true);
}
async function flush(toastIt, all) {
  const q = all ? ST.mine.slice() : ST.mine.filter(x => !x.sent);
  if (!q.length) return;
  if (!FB_URL) { if (toastIt) syncNote2('已保存在本机。意见表接通后会自动发送'); return; }
  for (const r of q) { try { const { sent, ...body } = r; await fetch(FB_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }); r.sent = true; } catch (e) { break; } }
  store.set('ly_fb_' + VER, ST.mine); bar(); if (ST.panel === 'mine') panel('mine');
  if (toastIt) syncNote2(q.every(x => x.sent) ? (all ? `已把 ${q.length} 条意见发送到 Google 表单` : `已提交第 ${ST.mine.filter(x => x._s === ST.sess).length || 1} 条，接着点下一处`) : '网络不通，意见已保存在本机，稍后会自动重试');
}
function syncNote2(t) { const n = $('#sync'); n.textContent = t; n.classList.add('on'); clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove('on'), 3200); }
function exportMine() {
  const cols = ['时间', '试用人', '版本', '端', '类型', '意见', '位置', '账号或场景', '页面', '元素路径', '上下文', '屏幕'];
  const csv = '﻿' + [cols.join(',')].concat(ST.mine.map(r => cols.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `灵屿试用意见-${ST.name || '未署名'}-${VER}.csv`; a.click();
}

/* ---------- 事件 ---------- */
document.addEventListener('click', e => {
  const s = e.target.closest('[data-side]'); if (s) return show(s.dataset.side);
  const t = e.target.closest('[data-type]'); if (t) { keepText(); ST.fb.type = ST.fb.type === t.dataset.type ? '' : t.dataset.type; return panel('fb'); }
  const d = e.target.closest('[data-do]'); if (!d) return;
  const dk = v => { ST.dock = v; store.set('ly_dock', v); };
  ({ fbL: () => { dk('left'); startCollect(); }, fbR: () => { dk('right'); startCollect(); }, dock: () => { keepText(); dk(ST.dock === 'left' ? 'right' : 'left'); panel(ST.panel); }, rename: () => askName(true), ovClose: () => $('#ov').innerHTML = '', nameOk, fb: startCollect, stop: stopCollect, pause: togglePause, unpick: togglePause,
    mine: () => { if (ST.collect) stopCollect(); if (!ST.collect) panel(ST.panel === 'mine' ? null : 'mine'); }, close: () => panel(null), send, retry: () => flush(true), resend: () => flush(true, true), export: exportMine })[d.dataset.do]();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'nm') nameOk();
  if (e.key === 'Enter' && e.target.id === 'fbTxt' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); send(); }
});
function boot() {
  [['学生端', APP_STU], ['机构端', APP_ADM]].forEach(([k, html]) => { const f = document.createElement('iframe'); f.title = k; f.srcdoc = html; $('#stage').appendChild(f); FR[k] = f; });
  show(ST.side); askName(); setTimeout(() => flush(false), 1500); setInterval(() => flush(false), 60000);
}
