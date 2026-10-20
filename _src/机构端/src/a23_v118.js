/* =====================================================================
   v1.18 · Ayu 表格意见（10/19–10/20，见 line3/review/v1.17-ayu表格意见.md）
===================================================================== */
/* ---------- 重置：演示数据存在本机，重置要先确认 ---------- */
const KEEP = lyKeep('ly_keep_adm_' + (typeof LY_VER !== 'undefined' ? LY_VER : ''), Object.assign({
  S: [() => S, v => { S = v; }], NOW: [() => NOW, v => NOW.setTime(+v)], seed: [() => seed, v => { seed = v; }],
  itN: [() => itN, v => { itN = v; }], ivN: [() => ivN, v => { ivN = v; }], xfN: [() => xfN, v => { xfN = v; }] },
  Object.fromEntries(Object.entries({ STU, STAFF, ACCTS, SSO_ID, CORE, AUDIT, BOOK, CRISES, CRISIS_WORDS, ITEMS, INV, XF, TELL, NOTI, PENDING, PLANS, PROMO, PTPL, POSTER_TPL,
    APPROVALS, RULES, PERMS, CONSENT, SCHED, SCHM, DUTY, TALKS, TASKS, FOLLOWER_OF, TT, PRIMARY }).map(([k, v]) => [k, [() => v, null, true]]))));
KEEP.load();
const _rK18 = render; render = function () { const r = _rK18.apply(this, arguments); KEEP.later(); return r; };
const _bootK18 = boot; boot = function () { _bootK18.apply(this, arguments); $('#resetBtn').onclick = () => lyResetAsk(() => { KEEP.clear(); location.reload(); }); };

/* ---------- 工作台 · 消息中心和消息详情（表格 54、55、56） ---------- */
const nUnread = () => myNoti().filter(n => !n.read);
const nGoBtn = n => { if (!n.ref || S.role === 'ADM') return ''; const k = CRISES.find(x => x.id === n.ref), s = !k && SU(n.ref);
  if (k) return `<button class="btn red" data-act="nGo" data-arg="${n.id}">去危机干预</button>`;
  return s ? `<button class="btn pri" data-act="nGo" data-arg="${n.id}">去处理</button>` : ''; };
const msgCenter = () => { const L = myNoti().slice(0, 3), u = nUnread().length;
  return `<div class="card mcen"><div class="mch"><b>${I('bell', 's')}消息中心</b>${u ? `<span class="cnt r">${u} 条未读</span>` : '<span class="note">没有未读</span>'}<span class="sp"></span><button class="lnk" data-act="go" data-arg="noti">全部消息 →</button></div>
    ${L.map(n => `<button class="mci ${n.read ? '' : 'un'}" data-act="nOpen" data-arg="${n.id}"><span class="mct">${esc(n.t)}</span><small>${fmt(n.at)} · ${n.ch}</small></button>`).join('') || '<p class="note" style="margin:6px 0 0">暂无消息</p>'}</div>`; };
const _home18 = PAGES.home; PAGES.home = function () { let h = _home18();
  if (homeView() === 'work') { h = h.replace(/<button class="btn ghost xs" data-act="go" data-arg="noti">[\s\S]*?<\/button>/, ''); h = h.replace(/(<div class="tabs htabs">[\s\S]*?<\/div>)/, '$1' + msgCenter()); }
  return h; };
const _md18 = modal; modal = function () { const [k, id] = (S.mo || '').split(':');
  if (k === 'nDet') { const n = NOTI.find(x => x.id === id); if (!n) return ''; const k2 = CRISES.find(x => x.id === n.ref), s = n.ref && (k2 ? SU(k2.sid) : SU(n.ref)), hide = S.role === 'ADM' && n.to !== me();
    const rows = [['时间', fmt(n.at)], ['收件人', `${ST(n.to).name}${STAFF[n.to] ? ` · ${RN[STAFF[n.to].role] || ''}` : ''}`], ['渠道', n.ch], ['状态', `<span class="pill ${n.st === '已确认' ? 'g' : n.st === '发送中' ? 'w' : ''}">${n.st}</span>`]];
    if (s && !hide) rows.push(['相关学生', `${nm(s)}${S.role === 'L1s' ? '' : ` · ${s.college}`}`]);
    if (k2 && !hide) rows.push(['危机', `${k2.type} · ${({ new: '未接收', recv: '处置中', closed: '已结案' })[k2.st] || k2.st}${k2.st === 'new' ? ` · 剩 ${dur(cLeft(k2))}` : ''}`]);
    return `<div class="ov" data-act="ovClose"><div class="mo"><h3>消息详情</h3><div class="ndet">${hide ? '<p class="note">系统管理员只看送达情况，不显示正文。</p>' : `<p class="nbody">${esc(n.t)}</p>`}<table class="t dense">${rows.map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join('')}</table></div>
      <div class="acts"><button class="btn sec" data-act="moClose">关闭</button>${hide ? '' : nGoBtn(n)}</div></div></div>`; }
  return _md18.apply(this, arguments); };
Object.assign(ACT, { nOpen(id) { const n = NOTI.find(x => x.id === id); if (n && n.to === me()) n.read = true; S.noti = false; S.mo = 'nDet:' + id; },
  nGo(id) { const n = NOTI.find(x => x.id === id); S.mo = null; if (!n) return; const k = CRISES.find(x => x.id === n.ref); if (k) { go('crisis'); S.prev = 'home'; return; }
    const s = SU(n.ref); if (!s) return; if (['L1', 'T'].includes(S.role)) ACT.tkGoS(s.id); else ACT.open(s.id); } });
/* 通知面板和通知页：每条都能点开看详情 */
const _np18 = notiPanel; notiPanel = function () { const L = (S.role === 'L3' && S.tabs.noti === 'all' ? NOTI : myNoti()).slice(0, 30); let i = 0;
  return _np18().replace(/<div class="ni( un)?">/g, m => { const n = L[i++]; return n ? m.replace('<div class="ni', `<div data-act="nOpen" data-arg="${n.id}" class="ni nclk`) : m; }); };
document.addEventListener('click', e => { const td = e.target.closest && e.target.closest('#pg td.ntx'); if (!td || e.target.closest('button')) return; const tr = td.closest('tr'), id = tr && tr.dataset.nid; if (id) { ACT.nOpen(id); render(); } });
const _npg18b = PAGES.noti; PAGES.noti = function () { const all = ['L3', 'ADM'].includes(S.role) && S.tabs.noti2 === 'all', adm = all && S.role === 'ADM', f = S.f, q = (f.nq || '').trim();
  const L = (all ? NOTI : myNoti()).filter(n => (!f.nch || n.ch.includes(f.nch)) && (!f.nst || n.st === f.nst) && (!q || (!adm && n.t.includes(q)) || (all && ST(n.to).name.includes(q))));
  const per = 30, pages = Math.max(1, Math.ceil(L.length / per)), pg = Math.min(S.npg || 1, pages), V = L.slice((pg - 1) * per, pg * per); let i = 0;
  return _npg18b().replace(/<tr class="(un)?">/g, m => { const n = V[i++]; return n ? `<tr class="${m.includes('un') ? 'un ' : ''}nclk" data-nid="${n.id}">` : m; }).replace('点「来源」回到对应的学生或危机。', '点一条消息看详情；点「来源」回到对应的学生或危机。'); };

/* ---------- 危机干预：人数露在菜单上；从工作台进来的页面能返回（表格 61、92） ---------- */
let navClk = false; document.addEventListener('click', e => { navClk = !!(e.target.closest && e.target.closest('aside, .demo')); }, true);
const _go18 = go; go = function (p) { const from = S.page; _go18.apply(this, arguments); S.prev = from === 'home' && p !== 'home' && !navClk ? 'home' : null; };
const _sh18 = shell; shell = function (b) { let h = _sh18(b); const act = CRISES.filter(k => k.st !== 'closed').length, nw = crisisNew().length;
  h = h.replace(/(data-arg="crisis">[\s\S]*?危机干预)(<span class="cnt r">\d+<\/span>)?/, `$1${act ? `<span class="cnt ${nw ? 'r' : 'k'}" title="${nw ? `未接收 ${nw}，` : ''}处置中 ${act - nw}">${act}</span>` : ''}`);
  if (S.prev === 'home' && S.page !== 'home' && S.page !== 'noti') h = h.replace('<div class="page" id="pg">', '<div class="page" id="pg"><p class="nback"><button class="lnk" data-act="go" data-arg="home">← 返回工作台</button></p>');
  return h; };

/* ---------- 今日简报：做成卡片，展开全部 / 收起（表格 91） ---------- */
briefPage = function () { const b = briefData(); S.bexp = S.bexp || {}; S.hx = S.hx || {}; const allX = !!S.bAll;
  const card = (s, i) => { const must = s.red, ex = must || allX || S.bexp[i], shown = ex ? s.items : s.items.slice(0, 2);
    return `<div class="bs bcard ${s.red ? 'red' : ''}"><h4>${s.t}<span class="note"> · ${s.items.length} 条</span></h4>${shown.map((x, j) => { const k = i + '-' + j, m = x.html.match(/<span class="hint">(.*?)<\/span>/), main = x.html.replace(/<span class="hint">.*?<\/span>/, '');
      return `<div class="bi"><div>${main}${m ? (S.hx[k] ? `<span class="hint">${m[1]} <button class="lnk" data-act="hx" data-arg="${k}">收起</button></span>` : ` <button class="lnk" data-act="hx" data-arg="${k}">小屿的提醒</button>`) : ''}</div>${x.act ? `<button class="btn ${s.red ? 'red' : 'sec'} xs" data-act="${x.act}" data-arg="${esc(x.arg)}">${x.btn}</button>` : x.tag ? `<span class="pill g">${x.tag}</span>` : ''}</div>`; }).join('')}
      ${!must && !allX && s.items.length > 2 ? `<button class="lnk more" data-act="bexp" data-arg="${i}">${S.bexp[i] ? '收起' : `展开其余 ${s.items.length - 2} 条`}</button>` : ''}</div>`; };
  return `<div class="bpage"><div class="brief"><div class="bh"><img src="${MASCOT}" alt=""><div class="grow"><b>小屿 · 今日简报</b><small>按 ${fmt(NOW)} 的数据 · 每天 8:30 推送 · 危机即时提醒</small></div><button class="btn sec xs" data-act="bAllT">${allX ? '全部收起' : '展开全部'}</button><button class="btn sec xs" data-act="shareBrief">${I('share', 's')}分享</button></div>
    <p class="greet">${greet()}。${b.lead}</p><div class="bgrid">${b.secs.map(card).join('')}</div><p class="bfoot">${b.foot}</p>
    <div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn pri" data-act="hview" data-arg="work">开始工作 ${I('right', 's')}</button></div></div>
    <div class="aside">${assistBody(true)}</div></div>`; };
ACT.bAllT = () => { S.bAll = !S.bAll; S.bexp = {}; };

/* ---------- 确认等级：理由选填，记住本机最近用过的 3 条（表格 59） ---------- */
const lvWhyGet = () => { try { const v = JSON.parse(localStorage.getItem('ly_lv_why') || '[]'); return Array.isArray(v) ? v.slice(0, 3) : []; } catch (e) { return []; } };
const lvWhyAdd = t => { t = (t || '').trim(); if (!t) return; const L = [t].concat(lvWhyGet().filter(x => x !== t)).slice(0, 3); try { localStorage.setItem('ly_lv_why', JSON.stringify(L)); } catch (e) {} };
const _md18b = modal; modal = function () { let h = _md18b.apply(this, arguments); const [k] = (S.mo || '').split(':');
  if (k === 'conf' && h) { const R = lvWhyGet();
    h = h.replace('等级与初判不同必须写原因；', '原因选填；').replace(/原因（必填）|原因（与初判一致可不填）/, '原因（选填）');
    if (R.length) h = h.replace('<textarea data-bind="form.note"', `<div class="opts rwhy">${R.map(x => `<button data-act="fset" data-arg="note|${esc(x)}" title="用这条">${esc(x.length > 24 ? x.slice(0, 24) + '…' : x)}</button>`).join('')}<small class="note">最近使用的原因，可点击填入</small></div><textarea data-bind="form.note"`); }
  return h; };
const _confOk18 = ACT.confOk; ACT.confOk = function (id) { const F = S.form, had = (F.note || '').trim(); if (!had) F.note = '未写原因'; const r = _confOk18.apply(this, arguments); if (had) lvWhyAdd(had); else if (S.mo) F.note = ''; return r; };

/* ---------- 改派：默认同级，也能选其他层级的人（要写原因），可以给对方留备注（表格 57、58） ---------- */
const LVR = { L1: 'L1 辅导员', L2: 'L2 咨询师', L3: 'L3 中心' };
const stageLv = s => s.stage === 'L1' || (s.stage === 'follow' && !s.owner) ? 'L1' : s.stage === 'L3' ? 'L3' : 'L2';
const peoplePick = (lv, skip) => { const N = Object.keys(W).filter(n => W[n] !== skip && STAFF[W[n]].on !== false), same = N.filter(n => STAFF[W[n]].role === lv), other = N.filter(n => STAFF[W[n]].role !== lv), F = S.form;
  const o = n => `<option value="${n}" ${F.who === n ? 'selected' : ''}>${n} · ${LVR[STAFF[W[n]].role] || ''}</option>`;
  return `<select class="in" style="width:100%" data-bind="form.who" data-rerender><option value="">选择改派给谁</option><optgroup label="同一层级">${same.map(o).join('')}</optgroup><optgroup label="其他层级（要写原因）">${other.map(o).join('')}</optgroup></select>`; };
const _md18c = modal; modal = function () { const [k, id] = (S.mo || '').split(':'), F = S.form;
  if (k === 'reassign' || k === 'moveAll') { const s = k === 'reassign' ? SU(id) : null, lv = s ? stageLv(s) : (ST(id).role === 'L1' ? 'L1' : 'L2'), skip = s ? holder(s) : id, cross = F.who && W[F.who] && STAFF[W[F.who]].role !== lv;
    const its = k === 'moveAll' ? STU.filter(x => holder(x) === id && ['L1', 'L2'].includes(x.stage) && overdue(x)) : null;
    return `<div class="ov" data-act="ovClose"><div class="mo"><h3>${s ? '改派' : `改派 ${ST(id).name} 的超时项`}</h3><p>${s ? `${nm(s)} 目前在 ${ST(skip).name} 手上。` : `共 ${its.length} 人：${its.map(nm).join('、')}。`}改派后时限重新计算，并通知新负责人。默认改派给同一层级的人；改给其他层级要写原因。</p>
      ${fld('改派给', peoplePick(lv, skip))}${cross ? `<p class="note warn">${F.who} 是${LVR[STAFF[W[F.who]].role]}，和现在这一步不同层级：${STAFF[W[F.who]].role === 'L1' ? '学生会回到 L1 核验' : STAFF[W[F.who]].role === 'L2' ? '学生会进 TA 的 L2 待复核' : '学生会进中心负责人的疑难上推'}。</p>` : ''}
      ${fld(cross ? '原因（必填）' : '原因（选填）', ta('why', '例如：本周出差 / 需要更高层级处理'))}${fld('给对方的备注（选填，对方在通知里看到）', `<input class="in" style="width:100%" data-bind="form.memo" value="${esc(F.memo || '')}" placeholder="例如：学生周三下午有课，尽量约周四">`)}
      <div class="acts"><button class="btn sec" data-act="moClose">取消</button><button class="btn pri" data-act="${k}Ok" data-arg="${id}">改派</button></div></div></div>`; }
  return _md18c.apply(this, arguments); };
const reMemo = () => { const F = S.form; return F.memo && F.memo.trim() ? `；备注：${F.memo.trim()}` : ''; };
const _raOk18 = ACT.reassignOk; ACT.reassignOk = function (id) { const s = SU(id), F = S.form, w = W[F.who]; if (!w) return toast('请选择改派给谁');
  const lv = stageLv(s), to = STAFF[w].role, h = holder(s); if (to === lv) { const n0 = NOTI.length; _raOk18.apply(this, arguments); if (NOTI.length > n0 && reMemo()) { const n = NOTI.find(x => x.to === w); if (n) n.t += reMemo(); } if (F.why) log(`改派原因：${F.why}`, s, { k: 'reassign', noTl: 1 }); return; }
  if (!(F.why || '').trim()) return toast('改给其他层级要写原因');
  const src = `${ST(me()).name} 跨层级改派：${F.why.trim()}`;
  if (to === 'L1') move(s, 'L1', 'verify', { follower: w, src }); else if (to === 'L2') move(s, 'L2', 'up', { assignee: w, src }); else move(s, 'L3', 'hard', { src });
  log(`跨层级改派：${ST(h).name} → ${F.who}（${LVR[to]}）；原因：${F.why.trim()}`, s, { k: 'reassign' }); notify(w, '站内 + 短信', `有 1 位学生改派给你（${F.why.trim()}）${reMemo()}`, s.id); if (h) notify(h, '站内', `你名下的 ${nm(s)} 已改派给${F.who}，不用再处理`, s.id);
  S.mo = null; toast(`已改派给${F.who}`); };
const _maOk18 = ACT.moveAllOk; ACT.moveAllOk = function (id) { const F = S.form, w = W[F.who]; if (!w) return toast('请选择改派给谁'); const lv = ST(id).role === 'L1' ? 'L1' : 'L2', to = STAFF[w].role;
  if (to !== lv && !(F.why || '').trim()) return toast('改给其他层级要写原因');
  if (to === lv) { const n0 = NOTI.length; _maOk18.apply(this, arguments); const n = NOTI.slice(0, NOTI.length - n0).find(x => x.to === w); if (n && reMemo()) n.t += reMemo(); return; }
  const its = STU.filter(x => holder(x) === id && ['L1', 'L2'].includes(x.stage) && overdue(x)), src = `${ST(me()).name} 跨层级改派：${F.why.trim()}`;
  its.forEach(s => { if (to === 'L1') move(s, 'L1', 'verify', { follower: w, src }); else if (to === 'L2') move(s, 'L2', 'up', { assignee: w, src }); else move(s, 'L3', 'hard', { src }); log(`跨层级改派：${ST(id).name} → ${F.who}（${LVR[to]}）；原因：${F.why.trim()}`, s, { k: 'reassign' }); });
  notify(w, '站内 + 短信', `有 ${its.length} 位学生改派给你（${F.why.trim()}）${reMemo()}`, null); notify(id, '站内', `你名下 ${its.length} 位超时学生已改派给${F.who}`, null); S.mo = null; toast(`已改派 ${its.length} 人`); };

/* ---------- 搜索框边打边搜：重画后光标留在原处（表格 42） ---------- */
const _rF18 = render; render = function () { const a = document.activeElement, b = a && a.dataset && a.dataset.bind, typ = a && a.tagName === 'INPUT' && /^(text|search|)$/.test(a.type || '');
  const st = typ ? a.selectionStart : null, r = _rF18.apply(this, arguments);
  if (b && typ) { const n = document.querySelector(`input[data-bind="${b}"]`); if (n && n !== document.activeElement) { n.focus(); try { n.setSelectionRange(st, st); } catch (e) {} } }
  return r; };

/* ---------- 谈心 · 待谈心：按学院、进度、状态筛选（表格 94） ---------- */
const tkFil = s => { const f = S.f, L = myItems().filter(x => x.sid === s.id), iv = INV.filter(v => v.sid === s.id && v.by === me());
  if (f.tcol && s.college !== f.tcol) return false;
  if (f.tprog === '没约' && iv.some(ivActive)) return false;
  if (f.tprog === '已约' && !iv.some(ivActive)) return false;
  if (f.tprog === '已超期' && !L.some(itOver)) return false;
  if (f.tst === '新分给你' && !stuTags(s, L).includes('新分给你')) return false;
  if (f.tst === '学生没回复' && !iv.some(v => v.st === 'wait' && v.d === 'ok')) return false;
  if (f.tst === '学生想换时间' && !iv.some(v => v.st === 'change')) return false;
  if (f.tst === '暂停 / 危机' && !L.some(x => ['paused', 'frozen'].includes(x.st))) return false;
  if (f.tst === '最近谈过' && !recent(s)) return false;
  return true; };
const _tkTodo18 = tkTodo; tkTodo = function () { let h = _tkTodo18(); if (!h.includes('<div class="tksplit">')) return h;
  const f = S.f, cols = [...new Set(myItems().map(x => SU(x.sid).college))], on = f.tcol || f.tprog || f.tst; let n = 0, all = 0;
  h = h.replace(/<button class="tkrow[^"]*" data-act="tkX" data-arg="(\w+)">[\s\S]*?<\/button>/g, (m, id) => { all++; if (tkFil(SU(id)) || id === S.tksel && !on) { n++; return m; } return ''; });
  const bar = `<div class="filters tkfil"><label class="flab"><span>学院</span><select data-bind="f.tcol" data-rerender><option value="">全部学院</option>${cols.map(c => `<option ${f.tcol === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
    <label class="flab"><span>进度</span><select data-bind="f.tprog" data-rerender><option value="">全部</option>${['没约', '已约', '已超期'].map(c => `<option ${f.tprog === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
    <label class="flab"><span>状态</span><select data-bind="f.tst" data-rerender><option value="">全部</option>${['新分给你', '学生没回复', '学生想换时间', '暂停 / 危机', '最近谈过'].map(c => `<option ${f.tst === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
    <span class="note">${on ? `${all} 人 · 筛出 <b>${n}</b> 人 <button class="lnk" data-act="tkFilX">清除</button>` : `${all} 人`}</span></div>`;
  if (on && !n) h = h.replace('<div class="tkl">', '<div class="tkl"><p class="note" style="padding:14px">没有符合条件的学生</p>');
  return h.replace('<div class="tksplit">', bar + '<div class="tksplit">'); };
ACT.tkFilX = () => { S.f.tcol = S.f.tprog = S.f.tst = ''; };

/* ---------- 谈心 · 写记录直接在右边展开，左边列表留着（表格 93） ---------- */
const recInline = () => S.rec && !S.rv && S.recIn && (S.tabs.talk || 'todo') === 'todo';
const _tkNew18 = ACT.tkNew; ACT.tkNew = function (sid) { const fromTodo = S.page === 'talk' && (S.tabs.talk || 'todo') === 'todo' && sid; _tkNew18.apply(this, arguments); if (S.rec && fromTodo) { S.recIn = true; S.tksel = sid; } else S.recIn = false; };
const _tkEdit18 = ACT.tkEdit; ACT.tkEdit = function (id) { const fromTodo = S.page === 'talk' && (S.tabs.talk || 'todo') === 'todo'; _tkEdit18.apply(this, arguments); S.recIn = !!(S.rec && fromTodo && S.tksel); };
const _talkPg18 = PAGES.talk; PAGES.talk = function () { if (!recInline()) return _talkPg18();
  const R = S.rec; S.rec = null; let h; try { h = _talkPg18(); } finally { S.rec = R; }
  const form = recPage().replace(/^<div class="card[^"]*">/, '<div class="recin">');
  const i = h.indexOf('<div class="tkr">'), j = h.indexOf('</div></div><p class="note">任务不能删除');
  return i < 0 || j < 0 ? recPage() : h.slice(0, i) + '<div class="tkr tkrin">' + form + h.slice(j + 6); };
const _tkX18 = ACT.tkX; ACT.tkX = function (sid) { if (recInline()) { if (sid === S.tksel) return; if (S.rec.dirty) { S.pendSel = sid; S.mo = 'recLeave:talk'; return; } S.rec = null; S.recIn = false; S.tksel = sid; return; } return _tkX18.apply(this, arguments); };
const _recBack18 = ACT.recBack; ACT.recBack = function () { const r = _recBack18.apply(this, arguments); if (!S.rec) S.recIn = false; return r; };

/* ---------- 谈话记录 · 日期：自己的日历，能下拉选年、月（表格 39） ---------- */
const dpCal = R => { const t = new Date(NOW), cur = R.date ? new Date(R.date + 'T00:00') : t, y = S.dpY || cur.getFullYear(), m = S.dpM != null ? S.dpM : cur.getMonth();
  const first = new Date(y, m, 1), n = new Date(y, m + 1, 0).getDate(), pad0 = (first.getDay() + 6) % 7, ys = []; for (let k = t.getFullYear() - 2; k <= t.getFullYear(); k++) ys.push(k);
  const cell = d => { const dt = new Date(y, m, d), v = ymd(dt), fut = dt > t, sel = R.date === v, td = ymd(t) === v; return `<button class="${sel ? 'on' : ''} ${td ? 'td' : ''}" ${fut ? 'disabled' : `data-act="dpPick" data-arg="${v}"`}>${d}</button>`; };
  return `<div class="dpop"><div class="dph"><button class="btn ghost xs" data-act="dpMv" data-arg="-1">‹</button><select data-dp="y">${ys.map(k => `<option value="${k}" ${k === y ? 'selected' : ''}>${k} 年</option>`).join('')}</select><select data-dp="m">${Array.from({ length: 12 }, (_, k) => `<option value="${k}" ${k === m ? 'selected' : ''} ${new Date(y, k, 1) > t ? 'disabled' : ''}>${k + 1} 月</option>`).join('')}</select><button class="btn ghost xs" data-act="dpMv" data-arg="1" ${new Date(y, m + 1, 1) > t ? 'disabled' : ''}>›</button><span class="sp"></span><button class="lnk" data-act="dpPick" data-arg="${ymd(t)}">今天</button></div>
    <div class="dpw">${['一', '二', '三', '四', '五', '六', '日'].map(x => `<span>${x}</span>`).join('')}</div><div class="dpg">${'<span></span>'.repeat(pad0)}${Array.from({ length: n }, (_, k) => cell(k + 1)).join('')}</div><p class="note" style="margin:6px 0 0">以后的日子不能选</p></div>`; };
const _rp18 = recPage; recPage = function () { const h = _rp18(), R = S.rec;
  return h.replace(/<input class="in" type="date"[^>]*data-rd[^>]*>/, `<span class="dpk"><button class="in dpb" data-act="dpT">${R.date ? `${+R.date.slice(5, 7)}月${+R.date.slice(8, 10)}日${R.date === ymd(NOW) ? '（今天）' : ''}` : '选日期'} ▾</button>${S.dpOpen ? dpCal(R) : ''}</span>`); };
Object.assign(ACT, { dpT() { S.dpOpen = !S.dpOpen; S.dpY = S.dpM = null; }, dpPick(v) { if (new Date(v + 'T00:00') > NOW) return; S.rec.date = v; S.rec.dirty = true; S.dpOpen = false; },
  dpMv(d) { const R = S.rec, cur = R.date ? new Date(R.date + 'T00:00') : new Date(NOW); let y = S.dpY || cur.getFullYear(), m = (S.dpM != null ? S.dpM : cur.getMonth()) + +d; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } if (new Date(y, m, 1) > NOW) return; S.dpY = y; S.dpM = m; } });
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.dp; if (!k || !S.rec) return; const R = S.rec, cur = R.date ? new Date(R.date + 'T00:00') : new Date(NOW);
  if (k === 'y') { S.dpY = +e.target.value; if (S.dpM == null) S.dpM = cur.getMonth(); if (new Date(S.dpY, S.dpM, 1) > NOW) S.dpM = NOW.getMonth(); } else { S.dpM = +e.target.value; if (!S.dpY) S.dpY = cur.getFullYear(); } render(); });
document.addEventListener('click', e => { if (S.dpOpen && !(e.target.closest && e.target.closest('.dpk'))) { S.dpOpen = false; render(); } }, true);

/* ---------- 发邀约：短信 / 消息文案可以改（表格 38） ---------- */
const _md18d = modal; modal = function () { const [k] = (S.mo || '').split(':'), F = S.form; let h = _md18d.apply(this, arguments);
  if ((k === 'tkInv') && h && /<div class="sms">[\s\S]*?<\/div>/.test(h)) { const def = (h.match(/<div class="sms">([\s\S]*?)。/) || [])[1] || '';
    if (F.msgEd) { const bad = /PHQ|GAD|量表|\d+\s*分|[1-5一二三四五]\s*级|等级|危机|风险|普测筛/.test(F.msg || '');
      h = h.replace(/<div class="sms">[\s\S]*?<\/div>/, `<div class="fld"><label>发给学生的文案 <button class="lnk" data-act="msgReset">恢复系统文案</button></label><textarea data-bind="form.msg" data-rerender rows="3">${esc(F.msg != null ? F.msg : def.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"))}</textarea>${bad ? '<p class="note warn">文案里不要写原因、等级、分数或量表名。</p>' : '<small class="note">学生看到的就是这段话；改了时间以后会恢复成系统文案。</small>'}</div>`); }
    else h = h.replace(/(<div class="sms">[\s\S]*?<\/div>)/, '$1<p class="note" style="margin:4px 0 0"><button class="lnk" data-act="msgEdit">改文案</button></p>'); }
  return h; };
Object.assign(ACT, { msgEdit() { S.form.msgEd = true; }, msgReset() { S.form.msgEd = false; S.form.msg = null; } });
const _invGo18 = ACT.tkInvGo; ACT.tkInvGo = function (sid) { const F = S.form, msg = F.msgEd && F.msg != null ? F.msg.trim() : '';
  if (msg && /PHQ|GAD|量表|\d+\s*分|[1-5一二三四五]\s*级|等级|危机|风险|普测筛/.test(msg)) return toast('文案里不要写原因、等级、分数或量表名');
  const n0 = INV.length; _invGo18.apply(this, arguments); if (INV.length > n0 && msg) { const v = INV[INV.length - 1]; v.msg = msg; log(`邀约文案改为：${msg}`, SU(sid), { k: 'talkTask', noTl: 1 }); } };
const _invEd18 = ACT.tkInvEditGo; ACT.tkInvEditGo = function (id) { const v = INV.find(x => x.id === id), t0 = v && +v.start; const r = _invEd18.apply(this, arguments); if (v && +v.start !== t0) v.msg = ''; return r; };
if (typeof LY_in === 'function') { const _lySnap18 = LY_snap; LY_snap = function () { const o = _lySnap18(); Object.values(o.__inv || {}).forEach(L => L.forEach(x => { const v = INV.find(y => y.id === x.id); x.msg = (v && v.msg) || ''; })); return o; }; }

/* ---------- 转给其他老师：点开是下拉名单（表格 40） ---------- */
const _md18e = modal; modal = function () { const [k] = (S.mo || '').split(':'), F = S.form; let h = _md18e.apply(this, arguments);
  if (k === 'tkMove' && h) { const m = h.match(/<input class="in" style="width:100%;margin-bottom:8px" data-bind="form.q"[\s\S]*?<div class="ttpick">[\s\S]*?<\/div><p class="note">想转/);
    if (m) { const s = SU((S.mo || '').split(':')[1]), C = candList(s, F, 1), body = m[0].replace(/<p class="note">想转$/, '').replace(/<div class="ttpick">[\s\S]*<\/div>$/, `<div class="ttpick">${C.map(u => candRow(s, u, F)).join('') || `<p class="note">没有找到 ${hintQ('moveMiss')}</p>`}</div>`), pick = F.to ? `<b>${ST(F.to).name}</b> <span class="pill">${tagOf(F.to)}</span>` : '<span class="note">选择老师</span>';
      h = h.replace(body, `<div class="dd ${F.dd ? 'open' : ''}"><button class="in ddb" data-act="ddT">${pick}<span class="sp"></span>▾</button>${F.dd ? `<div class="ddl">${body}</div>` : ''}</div>`); } }
  return h; };
ACT.ddT = () => { S.form.dd = !S.form.dd; };
const _fset18 = ACT.fset; ACT.fset = function (a) { const r = _fset18.apply(this, arguments); if (S.mo && S.mo.startsWith('tkMove') && a.startsWith('to|')) S.form.dd = false; return r; };

/* =====================================================================
   施测工作（草图 1，表格 62–73）：以方案为单位
   · 顶部页签：进行中 · 未开始 · 草稿箱 · 已结束 · 复盘 · 全部被测学生
   · 方案里四个页签：测试详情 · 施测方案 · 通知设置 · 方案复盘
===================================================================== */
const hasSurvey = () => S.uid && MENUS[S.role].some(m => m[0] === 'survey');
const planBucket = p => p.st === 'run' ? (notStarted(p) ? 'todo' : 'run') : p.st;
const svTop = () => { const cur = S.page === 'students' ? 'all' : (S.tabs.plans || 'run'), n = k => PLANS.filter(p => planBucket(p) === k).length;
  return `<div class="tabs gtabs">${[['run', '进行中'], ['todo', '未开始'], ['draft', '草稿箱'], ['done', '已结束 · 复盘']].map(([k, t]) => `<button class="${cur === k ? 'on' : ''}" data-act="svTop" data-arg="${k}">${t}<i>${n(k)}</i></button>`).join('')}<span class="sp"></span><button class="${cur === 'all' ? 'on' : ''}" data-act="svTop" data-arg="all">全部被测学生</button></div>`; };
ACT.svTop = k => { if (k === 'all') { ACT.go('students'); return; } S.tabs.plans = k; S.plan = null; S.wiz = null; if (S.page !== 'survey') ACT.go('survey'); };
const _sh18b = shell; shell = function (b) { let h = _sh18b(b);
  if (hasSurvey() && (S.page === 'survey' || S.page === 'students') && !S.wiz) h = h.replace(/<div class="tabs gtabs">[\s\S]*?<\/div>/, '').replace('<div class="page" id="pg">', '<div class="page" id="pg">' + (S.plan && S.page === 'survey' ? '' : svTop()));
  return h; };
const _survey18 = survey; survey = function () { if (S.wiz || S.plan) return _survey18();
  const k = S.tabs.plans || 'run', base = k === 'todo' ? 'run' : k; S.tabs.plans = base; let h; try { h = _survey18(); } finally { S.tabs.plans = k; }
  const ids = PLANS.filter(p => planBucket(p) === k).map(p => p.id);
  h = h.replace(/<div class="tabs">[\s\S]*?<\/div>/, '').replace(/<tr class="hov" data-act="(?:planOpen|wzEdit)" data-arg="(\w+)">[\s\S]*?<\/tr>/g, (m, id) => ids.includes(id) ? m : '');
  if (!ids.length) h = h.replace(/<table class="t">[\s\S]*<\/table>/, `<div class="empty"><img src="${MASCOT}" alt="">${k === 'todo' ? '没有未开始的方案' : '暂无'}</div>`);
  return h.replace('<small>创建、查看、复盘每一次施测</small>', `<small>${({ run: '正在收集的方案', todo: '已发布、还没到开始日期的方案', draft: '还没发布的方案', done: '已结束的方案和复盘' })[k]}</small>`); };

/* 方案详情：四个页签 */
const PTABS = [['det', '测试详情'], ['plan', '施测方案'], ['noti', '通知设置'], ['rev', '方案复盘']];
const ptab = p => S.tabs.ptab && S.tabs.ptab[p.id] || (p.st === 'done' ? 'rev' : 'det');
ACT.ptab = a => { const [id, k] = a.split('|'); S.tabs.ptab = S.tabs.ptab || {}; S.tabs.ptab[id] = k; S.side = null; };
const pHead = (p, h) => `<div class="card phead"><h3>${I('list')}${p.name}<span class="sp"></span><small>${scaleTxt(p)} · ${p.start} – ${p.due}</small>${p.st === 'done' ? `<button class="btn sec xs" data-act="wzCopy" data-arg="${p.id}">复制为新方案</button>` : ''}<button class="btn ghost xs" data-act="planBack">${I('left', 's')}返回方案列表</button></h3>
  <div class="tabs">${PTABS.map(([k, n]) => `<button class="${ptab(p) === k ? 'on' : ''}" data-act="ptab" data-arg="${p.id}|${k}">${n}</button>`).join('')}</div>${h}</div>`;
/* 第 1 波的数字：点数字在右侧展开名单（63、68） */
const pendView = () => PENDING.map((x, i) => Object.assign(x, { i, stt: pStat(x) }));
const KSET = { all: ['名单', null], open: ['作答中 / 中断', x => x.st !== '未开始'], none: ['还没打开', x => x.stt === '未打开'], fail: ['送达失败', x => x.stt === '送达失败'], off: ['已退订 / 已拒绝', x => ['已退订', '已拒绝'].includes(x.stt)] };
const sidePanel = () => { const sd = S.side; if (!sd) return ''; let t = '', b = '';
  if (sd.k === 'kpi') { const [n, f] = KSET[sd.v], L = pendView().filter(f || (() => true)); t = `${n} · ${L.length} 人${sd.v === 'all' ? '（未完成的）' : ''}`;
    b = `<table class="t dense"><tr><th>学生</th><th>学院</th><th>状态</th></tr>${L.map(x => `<tr><td><button class="lnk" data-act="pStu" data-arg="${x.i}">${x.name}</button><small>${x.sid}</small></td><td>${x.college}</td><td>${x.stt}</td></tr>`).join('')}</table>`; }
  else if (sd.k === 'stu') { const x = pendView()[sd.v]; t = `${x.name} · ${x.sid}`;
    const log = remLog(x); b = `<div class="kv"><span>学院</span><b>${x.college}</b><span>状态</span><b>${x.stt}${x.st !== '未开始' ? ` · ${x.st}` : ''}</b><span>还差</span><b>${x.left}</b><span>从哪里进入</span><b>${x.via ? chName(x.via) : '—'}</b><span>截止</span><b>${x.due}${x.ext ? `（已延长 ${x.extD || 3} 天）` : ''}</b>${x.fail ? `<span>送达失败</span><b>${x.fail}</b>` : ''}</div>
      <h4 class="qsub">提醒记录（${log.length}）</h4>${log.length ? `<table class="t dense"><tr><th>时间</th><th>渠道</th><th>谁发起</th></tr>${log.map(e => `<tr><td>${fmt(e.at)}</td><td>${e.ch}</td><td>${e.by}</td></tr>`).join('')}</table>` : '<p class="note">还没提醒过</p>'}
      <div class="acts" style="justify-content:flex-start;margin-top:12px">${remindable(x) ? `<button class="btn pri xs" data-act="pRem1" data-arg="${x.i}">提醒这位同学</button>` : ''}${x.ext ? '' : `<button class="btn sec xs" data-act="mo" data-arg="pExt:${x.i}">延期</button>`}</div>
      <p class="note">还没完成普测，没有筛查结果和报告。完成后在「全部被测学生」里能打开完整档案。</p>`; }
  return `<div class="pside"><div class="psh"><b>${t}</b><span class="sp"></span><button class="btn ghost xs" data-act="pSideX">关闭</button></div><div class="psb">${b}</div></div>`; };
/* 每次提醒的日志（67）：已有次数按最近一次往前推算，之后的提醒逐条记 */
const remLog = x => { if (!x.remLog) { x.remLog = []; for (let k = 0; k < (x.rem || 0); k++) x.remLog.push({ at: x.remAt && k === (x.rem - 1) ? new Date(x.remAt) : new Date(new Date(2026, 9, 7, 8).getTime() + k * 2 * 864e5), ch: k ? '短信 + 首页任务卡' : '短信', by: '自动提醒' }); } return x.remLog.slice().reverse(); };
const _remGo18 = ACT.remindGo; ACT.remindGo = function (id) { const chs = (S.form.rch || ['短信']).join(' + '), before = PENDING.map(x => x.remAt && +x.remAt); _remGo18.apply(this, arguments);
  PENDING.forEach((x, i) => { if (x.remAt && +x.remAt !== before[i]) { remLog(x); x.remLog.push({ at: new Date(x.remAt), ch: chs, by: isL1() ? `${ST(me()).name}（以 UCC 名义）` : ST(me()).name }); } }); };
Object.assign(ACT, { pKpi(v) { S.side = { k: 'kpi', v }; }, pStu(i) { S.side = { k: 'stu', v: +i }; }, pSideX() { S.side = null; },
  pRem1(i) { S.rsel = { [i]: true }; S.form = {}; S.mo = 'remind:sel'; },
  pExtGo(i) { const x = PENDING[+i], d = +(S.form.extD || 3); if (x.ext) return; if (!(d >= 1 && d <= 14)) return toast('延期天数填 1–14 天'); const [m, dd] = x.due.split('/').map(Number), nd = new Date(2026, m - 1, dd + d);
    x.ext = true; x.extD = d; x.due = `${pad(nd.getMonth() + 1)}/${pad(nd.getDate())}`; log(`为 ${x.name} 延长截止 ${d} 天，到 ${x.due}`, null, { obj: '普测' }); S.mo = null; toast(`已延长到 ${x.due}`); } });
const _md18f = modal; modal = function () { const [k, id] = (S.mo || '').split(':'), F = S.form;
  if (k === 'pExt') { const x = PENDING[+id]; if (F.extD == null) F.extD = '3';
    return mbox(`延期 · ${x.name}`, `现在的截止日期是 ${x.due}。每人只能延期一次。`, fld('延长几天', `<div class="opts">${['3', '5', '7'].map(d => `<button class="${F.extD === d ? 'on' : ''}" data-act="fset" data-arg="extD|${d}">${d} 天</button>`).join('')}<input class="in" style="width:80px" type="number" min="1" max="14" data-bind="form.extD" value="${esc(F.extD)}"> 天</div><small class="note">默认 3 天，可以改。</small>`), '延期', 'pExtGo', id); }
  return _md18f.apply(this, arguments); };
/* 测试详情：数字、名单（勾选单独提醒、延期、提醒记录）、送达失败名单直接展开 */
const pDetT1 = p => { const L = pendView(), f = S.f, sel = S.rsel || (S.rsel = {}), R = reachData(p), pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '—';
  const kp = [['名单', ROSTER, '人', 'all'], ['已完成', SURV().length, pct(SURV().length, ROSTER), null], ['作答中 / 中断', L.filter(KSET.open[1]).length, '点开看名单', 'open'], ['还没打开', L.filter(KSET.none[1]).length, '点开看名单', 'none'], ['送达失败', L.filter(KSET.fail[1]).length, '不算未打开', 'fail'], ['已退订 / 已拒绝', L.filter(KSET.off[1]).length, '不再提醒', 'off']];
  let pl = L.slice(); if (f.rst) pl = pl.filter(x => x.stt === f.rst); if (f.rcol) pl = pl.filter(x => x.college === f.rcol);
  const per = 12, pages = Math.max(1, Math.ceil(pl.length / per)), pg = Math.min(S.rpg || 1, pages), nsel = Object.values(sel).filter(Boolean).length;
  const tag = x => ({ 未打开: '<span class="pill">未打开</span>', 已打开未完成: `<span class="pill w">${x.st === '中断' ? '中断' : '作答中'}</span>`, 送达失败: `<span class="pill r">送达失败 · ${x.fail}</span>`, 已退订: '<span class="pill">已退订</span>', 已拒绝: '<span class="pill">已拒绝</span>' })[x.stt];
  const fails = L.filter(x => x.fail);
  return `<div class="wave">${TASKS[0].waves.map(x => `<div class="${x.st === 'run' ? 'on' : ''}"><b>${x.name}</b><small class="note">${x.st === 'run' ? `进行中 · ${x.pub} 发布` : x.st === 'pub' ? `已发布 ${x.pub}` : `计划 ${x.pub} · 名单 ${x.roster || '待定'}`}</small></div>`).join('')}</div>
    <div class="grid g6 kpi6" style="margin:14px 0 12px">${kp.map(([n, v, s, k]) => k ? `<button class="kpi kbtn ${S.side && S.side.k === 'kpi' && S.side.v === k ? 'on' : ''}" data-act="pKpi" data-arg="${k}"><small>${n}</small><b>${v}</b><span>${s}</span></button>` : `<div class="kpi"><small>${n}</small><b>${v}</b><span>${s}</span></div>`).join('')}</div>
    <h4 class="qsub">还没完成的人（${L.length}）</h4>
    <div class="filters"><label class="flab"><span>状态</span><select data-bind="f.rst" data-rerender><option value="">全部</option>${['未打开', '已打开未完成', '送达失败', '已退订', '已拒绝'].map(x => `<option ${f.rst === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label class="flab"><span>学院</span><select data-bind="f.rcol" data-rerender><option value="">全部学院</option>${COLLEGES.map(c => `<option ${f.rcol === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label><span class="note">${pl.length} 人</span><span style="flex:1"></span>
      <button class="btn sec xs" data-act="mo" data-arg="remind:sel" ${nsel ? '' : 'disabled'}>提醒所选（${nsel}）</button><button class="btn pri xs" data-act="pRemAll">提醒筛选出的人</button></div>
    <table class="t"><tr><th style="width:32px"><input type="checkbox" data-act="rselAll" ${pl.filter(remindable).length && pl.filter(remindable).every(x => sel[x.i]) ? 'checked' : ''} title="全选这一筛选"></th><th>学生</th><th>学院</th><th>状态</th><th>还差</th><th>已提醒</th><th>截止</th><th style="width:170px"></th></tr>${pl.slice((pg - 1) * per, pg * per).map(x => `<tr><td>${remindable(x) ? `<input type="checkbox" ${sel[x.i] ? 'checked' : ''} data-act="rsel" data-arg="${x.i}">` : ''}</td><td><button class="lnk" data-act="pStu" data-arg="${x.i}"><b>${x.name}</b></button><small>${x.sid}</small></td><td>${x.college}</td><td>${tag(x)}</td><td>${x.left}</td><td><button class="lnk" data-act="pStu" data-arg="${x.i}">${x.rem || 0} 次</button>${quotaFull(x) ? '<small>已达本波上限</small>' : ''}</td><td>${x.due}${x.ext ? `<small>已延长 ${x.extD || 3} 天</small>` : ''}</td>
      <td class="racts">${remindable(x) ? `<button class="btn sec xs" data-act="pRem1" data-arg="${x.i}" ${quotaFull(x) ? 'disabled title="已达本波上限"' : ''}>提醒</button>` : ''}${x.ext ? '' : `<button class="btn sec xs" data-act="mo" data-arg="pExt:${x.i}">延期</button>`}</td></tr>`).join('')}</table>
    <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:8px">${Array.from({ length: pages }, (_, i) => `<button class="btn ${pg === i + 1 ? 'pri' : 'sec'} xs" data-act="rpg" data-arg="${i + 1}">${i + 1}</button>`).join('')}</div>
    <p class="note">点姓名或「已提醒」看这个人的情况和每次提醒的记录。作答中出现危机信号的学生不在这里，会立即进入危机通道。每人只能延期一次，默认 3 天。</p>
    ${fails.length ? `<div class="dbox" style="background:#fff;border-color:var(--crit-line)"><b>送达失败 ${fails.length} 人<span class="sp"></span>${S.role === 'L3' ? `<button class="btn sec xs" data-act="failExp" data-arg="${p.id}">${I('dl', 's')}导出名单（含联系方式）</button>` : '<small class="note">只有中心负责人能导出</small>'}</b>
      <table class="t dense" style="margin-top:8px"><tr><th>学生</th><th>学院</th><th>原因</th></tr>${fails.map(x => `<tr><td><button class="lnk" data-act="pStu" data-arg="${x.i}">${x.name}</button><small>${x.sid}</small></td><td>${x.college}</td><td>${x.fail}</td></tr>`).join('')}</table>
      <p class="note" style="margin:8px 0 0">各学院辅导员在「施测工作 · 普测进度」里能看到本学院「联系方式有误」的学生，用来更正。</p></div>` : ''}`; };
Object.assign(ACT, { pRemAll() { S.form = {}; S.mo = 'remind:all'; }, rselAll() { const f = S.f, sel = S.rsel = S.rsel || {}; let pl = pendView().filter(remindable); if (f.rst) pl = pl.filter(x => x.stt === f.rst); if (f.rcol) pl = pl.filter(x => x.college === f.rcol); const on = !pl.every(x => sel[x.i]); pl.forEach(x => { sel[x.i] = on; }); } });
/* 施测方案：哪些还能改（62） */
const pPlanT1 = p => { const w = TASKS[0].waves, t1 = p.id === 't1';
  return `<p class="note" style="margin:0 0 10px">方案进行中也能改，但只改还没开始的部分：没发布的波次可以改时间和名单；已经发出、已经完成的部分不能改，免得学生收到的和后台对不上。</p>
    ${t1 ? `<table class="t"><tr><th>波次</th><th>状态</th><th>时间</th><th>名单</th><th></th></tr>${w.map(x => `<tr><td><b>${x.name}</b></td><td>${x.st === 'wait' ? '<span class="pill">还没开始</span>' : '<span class="pill g">已发出</span>'}</td><td>${x.st === 'wait' ? `计划 ${x.pub}` : `${x.pub} 发布`}</td><td>${x.roster || '待定'}</td><td>${x.st === 'wait' ? `${can(10) ? `<button class="btn sec xs" data-act="mo" data-arg="waveEd:${x.n}">改时间</button> <button class="btn sec xs" data-act="mo" data-arg="wave:${x.n}">产能检查并发布</button>` : ''}` : `<span class="note">${I('lock', 's')} 已发出，不能改</span>`}</td></tr>`).join('')}</table>` : ''}
    <div class="kv" style="margin-top:12px"><span>第一责任人</span><b>${ST(p.owner).name}</b><span>人群</span><b>${p.target || wizTarget(p)}</b><span>量表顺序</span><b>${t1 ? 'PHQ-9 → GAD-7（14 天内做过可沿用）' : scaleTxt(p)}</b><span>小屿访谈</span><b>${p.ai === '不做' ? '不做' : `${p.ai} · 排在量表之后`}</b><span>时间</span><b>${p.start} – ${p.due} · 发出后 ${p.valid} 天内有效</b><span>分波次</span><b>${p.waveTxt || '—'}${t1 ? '；每波发布前检查产能' : ''}</b>${t1 ? `<span>知情同意书</span><b>${CONSENT.ver} · ${CONSENT.l1}</b>` : ''}</div>
    <p class="note">${I('lock', 's')} 量表、访谈和知情同意书在第一波发出后就不能改了；要改请复制为新方案。</p>`; };
const _md18g = modal; modal = function () { const [k, id] = (S.mo || '').split(':'), F = S.form;
  if (k === 'waveEd') { const x = TASKS[0].waves.find(y => String(y.n) === id); if (F.wd == null) F.wd = x.pub;
    return mbox(`改时间 · ${x.name}`, `这一波还没发布，可以改。已经发出的波次不受影响。`, fld('计划发布日期（月/日）', `<input class="in" style="width:120px" data-bind="form.wd" value="${esc(F.wd)}" placeholder="例如 10/26">`), '保存', 'waveEdGo', id); }
  return _md18g.apply(this, arguments); };
ACT.waveEdGo = n => { const x = TASKS[0].waves.find(y => String(y.n) === n), v = (S.form.wd || '').trim(); if (x.st !== 'wait') return toast('这一波已经发出，不能改'); if (!/^\d{1,2}\/\d{1,2}$/.test(v)) return toast('日期写成「月/日」，例如 10/26');
  const was = x.pub; x.pub = v; log(`改第 ${x.n} 波计划发布日期：${was} → ${v}`, null, { cat: '配置', obj: '施测方案' }); S.mo = null; toast('已保存，已记入操作记录'); };
/* 通知设置：渠道效果、自动提醒、提醒素材（70、71） */
const pNoti = p => { const h = reachPanel(p), a = h.indexOf('<table class="t"><tr><th>渠道</th>'), b = h.indexOf('<div class="dbox autobox">'), c = h.indexOf('<div class="assets">'), d = h.indexOf('<h4 style="margin:18px 0 8px">还没完成的人');
  const chT = a >= 0 ? h.slice(a, h.indexOf('</table>', a) + 8) : '', note = a >= 0 ? (h.slice(h.indexOf('</table>', a) + 8).match(/^\s*<p class="note">[\s\S]*?<\/p>/) || [''])[0] : '', auto = b >= 0 ? h.slice(b, c) : '';
  const ch = p.ch || defCh(), A = [['copyEd', 'edit', '短信 / 邮件文案', '中 · 英两种语言；邮件要复制后到集体邮箱发', `data-act="mo" data-arg="copyEd:${p.id}"`]];
  if (ch.mail && ch.mail.on) A.push(['mail', 'msg', '邮件预览', '看学生收到的样子，一键复制', `data-act="mo" data-arg="mailPrev:${p.id}"`]);
  if (ch.poster && ch.poster.on) A.push(['poster', 'edit', `宣传海报（${POSTER_TPL[(p.poster || defPoster(p)).tpl][0]}）`, '改文字、换底图、下载', `data-act="mo" data-arg="poster:${p.id}"`]);
  if (ch.qr && ch.qr.on) A.push(['qr', 'dl', '二维码', '下载后放在海报或课件里', `data-act="qrDl" data-arg="${p.id}"`]);
  if (ch.pack && ch.pack.on) A.push(['pack', 'users', '辅导员转发包', '给辅导员转发到班级群', `data-act="mo" data-arg="packPrev:${p.id}"`]);
  return `<h4 class="qsub" style="margin-top:0">提醒素材</h4><div class="mats">${A.map(([k, ic, n, s, at]) => `<button class="mat" ${at}>${I(ic)}<b>${n}</b><small>${s}</small></button>`).join('')}</div>
    <h4 class="qsub">各渠道的效果</h4>${chT}${note}${auto}`; };
const MAILTIP = '由于功能限制，请复制文案后前往集体邮箱发送。';
const _md18h = modal; modal = function () { const [k, id] = (S.mo || '').split(':'); let h = _md18h.apply(this, arguments);
  if (k === 'copyEd' && h) h = h.replace('双语短信通常超过一条的长度', `<b>邮件：</b>${MAILTIP}<br>双语短信通常超过一条的长度`);
  if (k === 'mailPrev' && h) h = h.replace('<div class="acts"><button class="btn sec" data-act="moClose">关闭</button>', `<p class="note warn">${MAILTIP}</p><div class="acts"><button class="btn sec" data-act="moClose">关闭</button><button class="btn pri" data-act="mailCopy" data-arg="${id}">复制邮件文案</button>`);
  return h; };
ACT.mailCopy = id => { const p = planX(planOf(id)), c = p.copy, t = `${c.mailT} | ${c.mailTEn}\n\n${c.mail}\n\n———\n\n${c.mailEn}`; try { navigator.clipboard.writeText(t); } catch (e) {} log('复制普测邮件文案', null, { obj: '施测方案' }); toast('已复制，请到集体邮箱粘贴发送'); };
/* 方案复盘：进行中的方案先看目前的数字，结束后自动生成复盘 */
const pRev = p => { if (p.st === 'done') return review(p).replace(/^<div class="card"><h3>[\s\S]*?<\/h3>/, '').replace(/<\/div>$/, '');
  const t1 = p.id === 't1', done = t1 ? SURV().length : p.done || 0, ros = t1 ? ROSTER : p.roster || 0, cols = t1 ? COLLEGES.map(c => { const d = SURV().filter(s => s.college === c).length, n = d + PENDING.filter(x => x.college === c).length; return [c, n ? Math.round(d / n * 100) : 0, d, n]; }) : [];
  const R = t1 ? reachData(p) : null;
  return `<p class="note" style="margin:0 0 10px">方案还在进行中，下面是目前的数字；结束后会自动生成完整复盘（等级分布、平均用时、危机接收），可以写复盘笔记。</p>
    <div class="grid g3" style="margin-bottom:14px">${[['名单', ros], ['已完成', `${done}（${ros ? Math.round(done / ros * 100) : 0}%）`], ['还剩', `${Math.max(0, ros - done)} 人`]].map(k => `<div class="kpi"><small>${k[0]}</small><b style="font-size:20px">${k[1]}</b></div>`).join('')}</div>
    ${t1 ? `<div class="grid g2"><div class="card" style="margin:0"><h3>各学院完成率</h3>${cols.map(([c, v, d, n]) => `<div class="hb"><span>${c}</span><span class="bar"><i style="width:${v}%"></i></span><span>${v}% · ${d}/${n}</span></div>`).join('')}</div>
      <div class="card" style="margin:0"><h3>各渠道带来的完成</h3>${R.rows.map(r => `<div class="hb"><span>${r.n}</span><span class="bar"><i style="width:${R.done ? Math.round(r.done / R.done * 100) : 0}%"></i></span><span>${r.done} 人</span></div>`).join('')}</div></div>` : ''}`; };
const planPage18 = p => { const k = ptab(p), t1 = p.id === 't1';
  let body = k === 'det' ? (t1 ? pDetT1(p) : `<div class="grid g3" style="margin-top:4px">${[['名单', p.roster], ['已完成', p.done], ['完成率', Math.round(p.done / p.roster * 100) + '%']].map(x => `<div class="kpi"><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}</div><p class="note">${ST(p.owner).name}发起的方案，名单在发起人那里管理。</p>`)
    : k === 'plan' ? pPlanT1(p) : k === 'noti' ? pNoti(p) : pRev(p);
  return pHead(p, body) + (k === 'det' ? sidePanel() : ''); };
const _survey18b = survey; survey = function () { if (S.wiz || !S.plan) return _survey18b(); const p = planOf(S.plan); if (!p || p.st === 'draft') return _survey18b(); return planPage18(p); };
PAGES.survey = survey;

/* =====================================================================
   权限与设置（草图 4，表格 44–48、85–89、95）：10 个页签收成 5 个
   流转设置 · 权限配置 · 成员管理 · 危机词库 · 操作记录
   值班表、预咨询暂时放在「成员管理」「流转设置」里，等预约那一版挪到预约咨询
===================================================================== */
const SG = [['flow', '流转设置', [['tiers', '流转规则'], ['talkf', '谈心频率'], ['intake', '预咨询']]], ['perm', '权限配置', [['perm', '谁能看什么、做什么']]],
  ['mem', '成员管理', [['mlist', '成员'], ['mcol', '学院负责人'], ['duty', '值班表']]], ['cw', '危机词库', [['cwords', '危机词库']]], ['audit', '操作记录', [['audit', '操作记录']]]];
const memEd = () => isAdm() || S.role === 'L3';
const _st18 = settings; const oldTab = k => { const was = S.tabs.settings; S.tabs.settings = k; let h; try { h = _st18(); } finally { S.tabs.settings = was; }
  if (!h.includes(`class="on" data-act="settab" data-arg="${k}"`)) return null; const t = h.indexOf('<div class="tabs">'), e = h.indexOf('</div>', t) + 6; return h.slice(e, h.lastIndexOf('</div>')); };
const subOk = k => ['mlist', 'mcol'].includes(k) ? memEd() : k === 'cwords' ? memEd() || isAdm() : oldTab(k) != null;
settings = function () { const G = SG.map(([g, n, subs]) => [g, n, subs.filter(([k]) => subOk(k))]).filter(x => x[2].length);
  let cur = ({ members: 'mlist', tmem: 'mlist', map: 'mcol' })[S.tabs.settings] || S.tabs.settings; const gOf = k => G.find(g => g[2].some(s => s[0] === k)); if (!gOf(cur)) cur = G[0][2][0][0]; const g = gOf(cur);
  const mapX = () => { const om = oldTab('map') || '', i = om.indexOf('<div class="card" style="margin-top:14px"><h3>辅导员的管理范围'); return i >= 0 ? om.slice(i) : ''; };   // 原「辅导员分管」里的管理范围和导入，并到学院负责人下面
  const body = cur === 'mlist' ? memList() : cur === 'mcol' ? colResp() + mapX() : cur === 'cwords' ? cwPage2() : oldTab(cur);
  const note = { intake: '预咨询的设置暂时放在这里，预约咨询那一版会挪到「预约咨询 · AI 预咨询」。', duty: '值班表暂时放在这里，预约咨询那一版会和咨询排班一起挪到「预约咨询 · 排班表」。' }[cur];
  return `<div class="card"><div class="tabs">${G.map(([k, n, subs]) => `<button class="${g[0] === k ? 'on' : ''}" data-act="settab" data-arg="${subs[0][0]}">${n}</button>`).join('')}</div>
    ${g[2].length > 1 ? `<div class="stabs">${g[2].map(([k, n]) => `<button class="${cur === k ? 'on' : ''}" data-act="settab" data-arg="${k}">${n}</button>`).join('')}</div>` : ''}${note ? `<p class="note">${I('info', 's')} ${note}</p>` : ''}${body}</div>`; };
PAGES.settings = settings;

/* 成员管理 · 成员：所有人一张表，账号等级决定能看什么，职务只是说明（87、95）；L3 能改每个人（46–48） */
const LVOPT = [['L1', 'L1 · 核验（学院）'], ['L1s', 'L1 · 学生心理委员'], ['T', '谈心（只看派给自己的学生）'], ['L2', 'L2 · 复核'], ['L3', 'L3 · 决策']];
const lvName = r => (LVOPT.find(x => x[0] === r) || [0, RN[r] || r])[1];
const jobOf = u => { const x = STAFF[u]; if (x.job) return x.job; if (x.role === 'L1') return '辅导员'; if (x.role === 'L1s') return '学生心理委员'; if (x.role === 'T') return '任课老师'; if (x.role === 'ADM') return '系统管理员'; return x.title; };
const memCols = u => STAFF[u].role === 'L1s' ? (STAFF[u].cols || ['南洋商学院']) : staffCols(u);
const memRows = () => Object.keys(STAFF).filter(u => RN[STAFF[u].role] && u !== 'stu');
const memList = () => { const ed = memEd(), q = (S.f.mq || '').trim(), fl = S.f.mlv || '', L = memRows().filter(u => (!q || ST(u).name.includes(q) || jobOf(u).includes(q) || (memCols(u) || []).some(c => c.includes(q))) && (!fl || STAFF[u].role === fl));
  return `<p class="intro">${I('info', 's')}<span>能看什么、能做什么由<b>账号等级</b>决定；「职务」（辅导员、任课老师、咨询师…）只是说明，不影响权限。${ed ? '中心负责人、高级咨询师和系统管理员可以修改每个人的信息，改动记入操作记录。' : ''}</span></p>
    <div class="filters"><input class="in" style="width:220px" data-bind="f.mq" data-rerender placeholder="搜姓名、职务或学院" value="${esc(q)}"><label class="flab"><span>账号等级</span><select data-bind="f.mlv" data-rerender><option value="">全部</option>${LVOPT.concat([['ADM', '系统管理员']]).map(([k, n]) => `<option value="${k}" ${fl === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label><span class="note">${L.length} 人</span><span class="sp" style="flex:1"></span>${ed ? `<button class="btn pri xs" data-act="mo" data-arg="memEd:new">${I('plus', 's')}添加成员</button>` : ''}</div>
    <table class="t"><tr><th>姓名</th><th>账号等级</th><th>职务</th><th>负责的学院</th><th>在办事项</th><th>状态</th><th></th></tr>${L.map(u => { const x = STAFF[u], cols = memCols(u);
      return `<tr><td><div style="display:flex;gap:8px;align-items:center">${photo(u)}<b>${fullOf(u)}</b></div></td><td><span class="pill p">${lvName(x.role)}</span>${(ACCTS[u] || []).includes('ADM') && x.role !== 'ADM' ? ' <span class="pill">兼系统管理员</span>' : ''}</td><td>${esc(jobOf(u))}</td><td>${cols ? cols.join('、') || '—' : '心理中心'}</td><td>${['L1', 'T', 'L2', 'L3'].includes(x.role) ? myItems(u).length : '—'}</td><td>${x.on === false ? '<span class="pill">已停用</span>' : '<span class="pill g">在用</span>'}</td><td>${ed && x.role !== 'ADM' ? `<button class="btn sec xs" data-act="mo" data-arg="memEd:${u}">修改</button>` : ''}</td></tr>`; }).join('')}</table>
    <p class="note">停用后不能登录，在办的谈心事项进入「谈心任务总览 · 无人负责」。账号等级为「谈心」的人只看得到派给自己的学生和分享给自己的记录。</p>`; };
const _md18i = modal; modal = function () { const [k, id] = (S.mo || '').split(':'), F = S.form;
  if (k === 'memEd') { const nw = id === 'new', x = nw ? { role: 'T', on: true } : STAFF[id];
    if (F._m !== id) Object.assign(F, { _m: id, mname: nw ? '' : x.name, mlv: x.role, mjob: nw ? '任课老师' : jobOf(id), mcols: nw ? [] : (memCols(id) || []).slice(), mon: x.on !== false });
    const colPick = ['L1', 'L1s', 'T'].includes(F.mlv);
    return mbox(nw ? '添加成员' : `修改 · ${fullOf(id)}`, nw ? '新成员用 NTU SSO 登录，首次登录绑定短信手机。添加后给本人发激活通知。' : '改动立即生效，并记入操作记录。',
      `${fld('姓名', `<input class="in" style="width:100%" data-bind="form.mname" value="${esc(F.mname)}" placeholder="例如：陈老师">`)}
      ${fld('账号等级（决定能看什么、做什么）', `<div class="opts">${LVOPT.map(([v, n]) => `<button class="${F.mlv === v ? 'on' : ''}" data-act="fset" data-arg="mlv|${v}">${n}</button>`).join('')}</div>`)}
      ${fld('职务（只是说明）', `<input class="in" style="width:100%" data-bind="form.mjob" value="${esc(F.mjob)}" placeholder="例如：辅导员、任课老师、初级咨询师">`)}
      ${colPick ? fld(F.mlv === 'L1' ? '负责的学院（这个学院的学生默认由 TA 跟进）' : '所在学院', `<div class="opts">${COLLEGES.map(c => `<button class="${F.mcols.includes(c) ? 'on' : ''}" data-act="mCol" data-arg="${c}">${c}</button>`).join('')}</div>`) : ''}
      ${nw ? '' : fld('状态', `<div class="opts">${[['1', '在用'], ['0', '停用']].map(([v, n]) => `<button class="${String(+F.mon) === v ? 'on' : ''}" data-act="fset" data-arg="mon|${v}">${n}</button>`).join('')}</div>`)}`, nw ? '添加' : '保存', 'memGo', id); }
  return _md18i.apply(this, arguments); };
Object.assign(ACT, { mCol(c) { const a = S.form.mcols; S.form.mcols = a.includes(c) ? a.filter(x => x !== c) : [...a, c]; },
  memGo(id) { const F = S.form, nm2 = (F.mname || '').trim(); if (!nm2) return toast('请填写姓名'); if (['L1', 'L1s', 'T'].includes(F.mlv) && !F.mcols.length) return toast('请选学院');
    if (id === 'new') { const u = 'm' + (Object.keys(STAFF).filter(x => x[0] === 'm').length + 1); STAFF[u] = { name: nm2, role: F.mlv, title: F.mjob || '', job: F.mjob || '', on: true, by: me(), at: new Date(NOW) }; if (['L1', 'L1s', 'T'].includes(F.mlv)) STAFF[u].cols = F.mcols.slice();
      ACCTS[u] = [F.mlv]; SSO_ID[u] = 'staff' + u.slice(1); if (['L2', 'L3', 'L1'].includes(F.mlv)) W[nm2] = u;
      notify(u, '邮件 + 短信', `你的灵屿账号已开通（${lvName(F.mlv)}），请用 NTU SSO 账号 ${SSO_ID[u]} 登录激活`, null); log(`添加成员：${nm2} · ${lvName(F.mlv)} · ${F.mjob || ''}${F.mcols.length ? ` · ${F.mcols.join('、')}` : ''}`, null, { cat: '配置', obj: '成员与账号' }); S.mo = null; return toast(`已添加，已给 ${nm2} 发激活通知`); }
    const x = STAFF[id], ch = []; if (x.name !== nm2) ch.push(`姓名 ${x.name} → ${nm2}`); if (x.role !== F.mlv) ch.push(`账号等级 ${lvName(x.role)} → ${lvName(F.mlv)}`); if (jobOf(id) !== F.mjob) ch.push(`职务 ${jobOf(id)} → ${F.mjob}`);
    const oc = (memCols(id) || []).join('、'), nc = F.mcols.join('、'); if (['L1', 'L1s', 'T'].includes(F.mlv) && oc !== nc) ch.push(`学院 ${oc || '—'} → ${nc}`); if ((x.on !== false) !== !!+F.mon) ch.push(+F.mon ? '启用' : '停用');
    if (!ch.length) return toast('没有改动');
    if (W[x.name] === id && x.name !== nm2) { delete W[x.name]; W[nm2] = id; }
    Object.assign(x, { name: nm2, role: F.mlv, job: F.mjob, on: !!+F.mon }); if (['L1', 'L1s', 'T'].includes(F.mlv)) x.cols = F.mcols.slice(); else delete x.cols;
    if (F.mlv === 'L1') COLLEGES.forEach(c => { if (F.mcols.includes(c)) FOLLOWER_OF[c] = id; });
    ACCTS[id] = [F.mlv].concat((ACCTS[id] || []).includes('ADM') ? ['ADM'] : []);
    log(`修改成员 ${nm2}：${ch.join('；')}`, null, { cat: '配置', obj: '成员与账号' }); S.mo = null; toast('已保存，已记入操作记录'); } });

/* 成员管理 · 学院负责人：每个学院谁在管，按等级分到人（44、45、86） */
const colResp = () => { const ed = memEd(), duty = DUTY[0] ? ST(DUTY[0].who).name : '—';
  return `<p class="intro">${I('info', 's')}<span>每个学院的学生按关注等级分给具体的人：1–3 级由学院跟进人（L1）负责，4 级由学院的对口咨询师（L2）复核，5 级（危机）由当周值班咨询师第一时间接收。改这里会影响之后新进来的学生；已经在办的可以一起转。</span></p>
    <table class="t"><tr><th>学院</th><th>1–3 级 · 学院跟进人（L1）</th><th>4 级 · 对口咨询师（L2）</th><th>5 级 · 危机（本周值班）</th><th>学生数</th><th></th></tr>${COLLEGES.map(c => { const f = FOLLOWER_OF[c], l2 = (RULES.colL2 || {})[c] || l2For({ college: c });
      return `<tr><td><b>${c}</b></td><td>${f ? fullOf(f) : '<span class="warn">没有人</span>'}${c === '南洋商学院' ? '<small>另有授权学生心理委员 林同学</small>' : ''}</td><td>${fullOf(l2)}</td><td>${duty}<small>${RULES.esc} 小时未接收 → 中心负责人</small></td><td>${STU.filter(s => s.college === c).length}</td><td>${ed ? `<button class="btn sec xs" data-act="mo" data-arg="colEd:${c}">调整</button>` : ''}</td></tr>`; }).join('')}</table>
    <p class="note">值班的人在「值班表」里排；2 级、3 级的随访频率在「流转设置 · 流转规则」里改。</p>`; };
const _md18j = modal; modal = function () { const [k, id] = (S.mo || '').split(':'), F = S.form;
  if (k === 'colEd') { const c = id, L1s = Object.keys(STAFF).filter(u => STAFF[u].role === 'L1' && STAFF[u].on !== false), L2s = Object.keys(STAFF).filter(u => STAFF[u].role === 'L2' && STAFF[u].on !== false);
    if (F._c !== c) Object.assign(F, { _c: c, cf: FOLLOWER_OF[c] || '', cl2: (RULES.colL2 || {})[c] || l2For({ college: c }), cmove: '1' });
    const n = STU.filter(s => s.college === c && s.follower === FOLLOWER_OF[c] && s.stage !== 'crisis').length;
    return mbox(`调整 · ${c}`, '改动立即生效，并记入操作记录。', `${fld('1–3 级 · 学院跟进人（L1）', `<div class="opts">${L1s.map(u => `<button class="${F.cf === u ? 'on' : ''}" data-act="fset" data-arg="cf|${u}">${fullOf(u)}</button>`).join('')}</div>`)}
      ${F.cf && F.cf !== FOLLOWER_OF[c] ? fld(`已经在跟进的 ${n} 位学生`, `<div class="opts">${[['1', '一起转给新跟进人'], ['0', '留给原来的人，只改之后的']].map(([v, t]) => `<button class="${F.cmove === v ? 'on' : ''}" data-act="fset" data-arg="cmove|${v}">${t}</button>`).join('')}</div>`) : ''}
      ${fld('4 级 · 对口咨询师（L2）', `<div class="opts">${L2s.map(u => `<button class="${F.cl2 === u ? 'on' : ''}" data-act="fset" data-arg="cl2|${u}">${fullOf(u)}</button>`).join('')}</div>`)}<p class="note">5 级危机首先通知当周值班咨询师；值班安排由心理中心负责人维护。</p>`, '保存', 'colGo', c); }
  return _md18j.apply(this, arguments); };
ACT.colGo = c => { const F = S.form, of = FOLLOWER_OF[c], ol2 = (RULES.colL2 || {})[c] || l2For({ college: c }), ch = [];
  if (F.cf && F.cf !== of) { FOLLOWER_OF[c] = F.cf; ch.push(`跟进人 ${of ? ST(of).name : '—'} → ${ST(F.cf).name}`);
    if (of && STAFF[of].cols) STAFF[of].cols = STAFF[of].cols.filter(x => x !== c); if (STAFF[F.cf].cols && !STAFF[F.cf].cols.includes(c)) STAFF[F.cf].cols.push(c);
    if (F.cmove === '1') { const L = STU.filter(s => s.college === c && s.follower === of && s.stage !== 'crisis'); L.forEach(s => { s.follower = F.cf; }); ch.push(`已在跟进的 ${L.length} 人一起转`); if (L.length) notify(F.cf, '站内', `${c}的 ${L.length} 位学生转由你跟进`, null); } }
  if (F.cl2 && F.cl2 !== ol2) { RULES.colL2 = RULES.colL2 || {}; RULES.colL2[c] = F.cl2; ch.push(`对口咨询师 ${ST(ol2).name} → ${ST(F.cl2).name}`); }
  if (!ch.length) return toast('没有改动'); log(`学院负责人 · ${c}：${ch.join('；')}`, null, { cat: '配置', obj: '成员与账号' }); S.mo = null; toast('已保存，已记入操作记录'); };

/* 危机词库：分级显示、批量导入、临床常用词库、命中等级可改（88） */
const CW_DEF = [['不想活', '高'], ['想死', '高'], ['自杀', '高'], ['结束生命', '高'], ['跳楼', '高'], ['割腕', '高'], ['遗书', '高'], ['安眠药', '高'], ['轻生', '高'], ['去死', '高'], ['结束自己', '高'],
  ['活着没意思', '中'], ['活着没意义', '中'], ['伤害自己', '中'], ['自伤', '中'], ['自残', '中'], ['撑不下去', '中'], ['没有希望', '中'], ['消失就好了', '中'], ['不想醒来', '中'], ['我是负担', '中']];
const cwLv = w => (RULES.cwLv || {})[w] || (CW_DEF.find(x => x[0] === w) || [0, '高'])[1];
const cwPage2 = () => { const ed = S.role === 'L3', F = S.form, grp = l => CRISIS_WORDS.map((w, i) => [w, i]).filter(([w]) => cwLv(w) === l);
  const chips = l => grp(l).map(([w, i]) => `<span class="chip">${esc(w)}${ed ? `<button class="lnk" data-act="cwLvT" data-arg="${i}" title="改成${l === '高' ? '需关注' : '高危'}">${l === '高' ? '↓' : '↑'}</button><button class="lnk" data-act="cwDel" data-arg="${i}" title="删除">×</button>` : ''}</span>`).join('') || '<span class="note">还没有</span>';
  const miss = CW_DEF.filter(([w]) => !CRISIS_WORDS.includes(w)).length;
  return `<p class="intro">${I('info', 's')}<span>谈话记录、追加内容里出现这些词，保存时自动报告紧急情况（草稿只提醒，不报告）。按命中的等级决定确认时限：高危 ${RULES.urgentMin} 分钟内确认，需关注 ${RULES.esc} 小时内确认。词库由心理中心负责人、高级咨询师维护，改动记入操作记录。</span></p>
    <div class="card"><h3>高危 · ${RULES.urgentMin} 分钟内确认（${grp('高').length}）<span class="sp"></span>${ed ? '<small>点 ↓ 改成「需关注」</small>' : ''}</h3><div class="chips cwl">${chips('高')}</div></div>
    <div class="card"><h3>需关注 · ${RULES.esc} 小时内确认（${grp('中').length}）<span class="sp"></span>${ed ? '<small>点 ↑ 改成「高危」</small>' : ''}</h3><div class="chips cwl">${chips('中')}</div></div>
    ${ed ? `<div class="card"><h3>添加<span class="sp"></span>${miss ? `<button class="btn sec xs" data-act="cwDef">补齐临床常用词库（还差 ${miss} 个）</button>` : '<small>临床常用词库已全部包含</small>'}</h3>
      <div class="g2 grid"><div>${fld('加一个词', `<div class="filters" style="margin:0"><input class="in" style="width:200px" data-bind="form.cw" placeholder="例如：撑不下去" value="${esc(F.cw || '')}"><div class="opts">${['高', '中'].map(l => `<button class="${(F.cwl || '高') === l ? 'on' : ''}" data-act="fset" data-arg="cwl|${l}">${l === '高' ? '高危' : '需关注'}</button>`).join('')}</div><button class="btn sec xs" data-act="cwAdd">添加</button></div>`)}</div>
      <div>${fld('批量导入（一行一个词，后面可以写「，高」或「，中」，不写按高危）', `<textarea data-bind="form.cwb" rows="4" placeholder="不想活，高&#10;撑不下去，中">${esc(F.cwb || '')}</textarea><div style="margin-top:6px"><button class="btn sec xs" data-act="cwImp">导入</button></div>`)}</div></div></div>` : '<p class="note">只有心理中心负责人、高级咨询师可以修改。</p>'}
    <div class="card"><h3>危机期间的谈心</h3><div class="prow"><span>恢复冻结的谈心要上级批准<small>学生进危机通道后，谈心事项和邀约自动冻结。启用后，恢复申请须由中心负责人或高级咨询师批准；关闭后，提交申请即恢复。</small></span><span class="sw ${RULES.unfzAppr ? 'on' : ''} ${ed ? '' : 'lk'}" ${ed ? 'data-act="unfzT"' : ''}></span></div></div>`; };
const cwSet = (w, l) => { RULES.cwLv = RULES.cwLv || {}; RULES.cwLv[w] = l; };
const _cwAdd18 = ACT.cwAdd; ACT.cwAdd = function () { const w = (S.form.cw || '').trim(), l = S.form.cwl || '高', n = CRISIS_WORDS.length; _cwAdd18.apply(this, arguments); if (CRISIS_WORDS.length > n) { cwSet(w, l); AUDIT[0] && AUDIT[0].t.includes(w) && (AUDIT[0].t += `（${l === '高' ? '高危' : '需关注'}）`); } };
Object.assign(ACT, {
  cwLvT(i) { const w = CRISIS_WORDS[+i], was = cwLv(w), l = was === '高' ? '中' : '高'; cwSet(w, l); log(`危机词库 ·「${w}」${was === '高' ? '高危' : '需关注'} → ${l === '高' ? '高危' : '需关注'}`, null, { cat: '配置', obj: '危机词库' }); toast('已改，之后保存的记录按新等级'); },
  cwImp() { const L = (S.form.cwb || '').split(/\n+/).map(x => x.trim()).filter(Boolean), add = [], skip = [];
    L.forEach(x => { const m = x.match(/^(.+?)[，,\s]+(高|中)$/), w = (m ? m[1] : x).trim(), l = m ? m[2] : '高'; if (w.length < 2 || CRISIS_WORDS.includes(w)) { skip.push(w); return; } CRISIS_WORDS.push(w); cwSet(w, l); add.push(`${w}（${l === '高' ? '高危' : '需关注'}）`); });
    if (!add.length) return toast(L.length ? '都已经在词库里，或少于两个字' : '请先粘贴要导入的词'); S.form.cwb = ''; log(`危机词库 · 批量导入 ${add.length} 个：${add.join('、')}`, null, { cat: '配置', obj: '危机词库' }); toast(`已导入 ${add.length} 个${skip.length ? `，跳过 ${skip.length} 个（重复或太短）` : ''}`); },
  cwDef() { const add = CW_DEF.filter(([w]) => !CRISIS_WORDS.includes(w)); add.forEach(([w, l]) => { CRISIS_WORDS.push(w); cwSet(w, l); }); log(`危机词库 · 补齐临床常用词库 ${add.length} 个：${add.map(x => x[0]).join('、')}`, null, { cat: '配置', obj: '危机词库' }); toast(`已补齐 ${add.length} 个`); } });
/* 命中的词决定危机时限：有高危词 → 紧急（${RULES.urgentMin} 分钟）；只有需关注的词 → 一般时限 */
let cwHits = []; TALK_RE.test = x => { const t = String(x == null ? '' : x), h = CRISIS_WORDS.filter(w => w && t.includes(w)); if (h.length) cwHits.push(...h); return h.length > 0; };
const _nc18 = newCrisis; newCrisis = function (s, src, type, urgent) { if (urgent && cwHits.length && /谈话记录|追加/.test(src || '') && !cwHits.some(w => cwLv(w) === '高')) urgent = false; return _nc18.call(this, s, src, type, urgent); };
const _rCw18 = render; render = function () { cwHits = []; return _rCw18.apply(this, arguments); };

/* =====================================================================
   数据看板（草图 3，表格 82）：普测数据 · 学生情况 · 老师工作 · 报表与导出
   普测数据 = 这一轮的完成进度；学生情况 = 跨轮次看结果和服务；老师工作 = 每人的工作量（本人看自己，L3 看全部）
===================================================================== */
const VIAN = { home: '个人中心', sms: '短信', qr: '二维码', pack: '新生包', mail: '邮件', poster: '海报' };
/* 上一轮（2026 春季普测）的等级：演示数据。有真实记录的用记录，其余按学号固定生成，约七成学生参加过 */
const prevLv = s => { const h = (s.hist || []).find(x => /春季/.test(x.t)); if (h) return h.lv; let n = 0; for (const c of String(s.id)) n = (n * 31 + c.charCodeAt(0)) % 997; if (n % 10 >= 7) return null; const d = [0, 0, 0, -1, 1, 0, -1, 1, 0, 2][n % 10]; return Math.min(5, Math.max(1, curLv(s) - d)); };
const DTABS = () => S.role === 'L3' ? [['dash', '普测数据'], ['stu', '学生情况'], ['staff', '老师工作'], ['report', '报表与导出']] : S.role === 'ADM' ? [['dash', '普测数据'], ['stu', '学生情况'], ['report', '报表与导出']] : [['staff', '我的工作']];
const _data18 = data; data = function () { const T = DTABS(); let tab = S.tabs.data; if (!T.some(x => x[0] === tab)) tab = T[0][0];
  const adm = S.role === 'ADM', head = `<div class="tabs">${T.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-act="dtabD" data-arg="${k}">${n}</button>`).join('')}<span style="flex:1"></span><span class="note">${tab === 'staff' ? `统计到 ${fmt(NOW)}` : tab === 'stu' ? '范围：参加过普测的学生 · 跨轮次' : '范围：2026 秋季普测 · 第 1 波（试点 4 个学院）'}${adm ? ' · 系统管理员只看汇总' : ''}</span></div>`;
  if (tab === 'staff') return head + staffWork();
  const was = S.tabs.data; S.tabs.data = tab === 'report' ? 'report' : 'dash'; let h; try { h = _data18(); } finally { S.tabs.data = was; }
  const d = document.createElement('div'); d.innerHTML = h; d.querySelector('.tabs').remove(); if (tab === 'report') return head + d.innerHTML;
  const card = n => { const c = [...d.querySelectorAll('.card')].find(x => (x.querySelector('h3') || {}).textContent && x.querySelector('h3').textContent.startsWith(n)); return c ? c.outerHTML : ''; };
  const kpi = d.querySelector('.grid.g4') ? d.querySelector('.grid.g4').outerHTML : '';
  if (tab === 'dash') return head + `${kpi}<div class="grid g3">${card('关注等级分布')}${card('完成人数趋势')}${card('可能的遗漏')}</div><div class="grid g2" style="margin-top:16px">${card('各学院完成率')}${viaCard()}</div>`;
  return head + stuTrend() + `<div class="grid g3" style="margin-top:16px">${card('一般心理问题分布')}${card('精筛方向分布')}${svcCard()}</div>`; };
PAGES.data = data;
const hbar = (rows, tot, col) => rows.map(([k, v]) => `<div class="hb"><span>${k}</span><span class="bar"><i style="width:${tot ? Math.round(v / tot * 100) : 0}%;${col ? 'background:' + col : ''}"></i></span><span>${v}${tot ? ` · ${Math.round(v / tot * 100)}%` : ''}</span></div>`).join('');
const viaCard = () => { const L = SURV(), m = {}; L.forEach(s => { m[s.via] = (m[s.via] || 0) + 1; });
  return `<div class="card"><h3>完成渠道<span class="sp"></span><small>学生从哪里进来做的</small></h3>${hbar(Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => [VIAN[k] || k, v]), L.length, 'var(--pri2)')}<p class="note">名单里还有 ${ROSTER - L.length} 人没完成，可以在施测方案里按渠道再提醒。</p></div>`; };
const stuTrend = () => { const L = SURV(), P = L.map(s => [prevLv(s), curLv(s)]).filter(x => x[0]), up = P.filter(([a, b]) => b > a).length, dn = P.filter(([a, b]) => b < a).length, same = P.length - up - dn;
  const hi = (arr, f) => arr.length ? Math.round(arr.filter(f).length / arr.length * 100) : 0;
  return `<div class="grid g4">${[['两轮都参加', P.length, `本轮 ${L.length} 人中`], ['等级上升', up, `${Math.round(up / (P.length || 1) * 100)}%`], ['持平', same, `${Math.round(same / (P.length || 1) * 100)}%`], ['等级下降', dn, `${Math.round(dn / (P.length || 1) * 100)}%`]].map(([n, v, sub]) => `<div class="kpi"><small>${n}</small><b>${v}</b><span>${sub}</span></div>`).join('')}</div>
    <div class="grid g2" style="margin-top:16px"><div class="card"><h3>等级变化<span class="sp"></span><small>上一轮（2026 春季普测）→ 本轮</small></h3><table class="t"><tr><th>上一轮 \\ 本轮</th>${[1, 2, 3, 4, 5].map(l => `<th>${l} 级</th>`).join('')}<th>合计</th></tr>${[1, 2, 3, 4, 5].map(a => { const r = P.filter(x => x[0] === a);
      return `<tr><td>${lvB(a)}</td>${[1, 2, 3, 4, 5].map(b => { const n = r.filter(x => x[1] === b).length; return `<td style="${n && b > a ? 'color:var(--crit);font-weight:600' : n && b < a ? 'color:var(--pri);font-weight:600' : ''}">${n || '·'}</td>`; }).join('')}<td>${r.length}</td></tr>`; }).join('')}</table><p class="note">红色是等级上升，绿色是下降。只统计两轮都参加的学生，不显示个人。</p></div>
      <div class="card"><h3>各学院 3 级及以上占比<span class="sp"></span><small>上一轮 → 本轮</small></h3><table class="t"><tr><th>学院</th><th>上一轮</th><th>本轮</th><th>变化</th></tr>${COLLEGES.map(c => { const a = P.filter((x, i) => L.filter(s => prevLv(s))[i].college === c), pa = hi(a, x => x[0] >= 3), pb = hi(L.filter(s => s.college === c), s => curLv(s) >= 3), dd = pb - pa;
        return `<tr><td>${c}</td><td>${pa}%</td><td>${pb}%</td><td style="color:${dd > 0 ? 'var(--crit)' : dd < 0 ? 'var(--pri)' : 'inherit'}">${dd > 0 ? '+' : ''}${dd}%</td></tr>`; }).join('')}</table><p class="note">上一轮的数字是演示数据。</p></div></div>`; };
const svcCard = () => { const L = SURV(), done = L.length;
  return `<div class="card"><h3>服务进展<span class="sp"></span><small>谈心、咨询、危机</small></h3>${hbar([['人工确认等级', L.filter(s => s.conf).length], ['有过谈心', new Set(TALKS.map(t => t.sid)).size], ['已邀请预约', L.filter(s => s.invAt || s.queue === 'declined').length], ['已预约咨询', new Set(BOOK.map(b => b.sid)).size], ['完成咨询', BOOK.filter(b => ['done', 'record'].includes(b.st)).length], ['进过危机通道', new Set(CRISES.map(k => k.sid)).size]], done, 'var(--pri2)')}
    <div class="kv" style="margin-top:10px"><span>谈心记录</span><b>${TALKS.length} 次</b><span>危机</span><b>${CRISES.filter(k => k.st !== 'closed').length} 在办 · ${CRISES.filter(k => k.st === 'closed').length} 已结案</b></div></div>`; };
/* 老师工作：每人的谈心、核实、咨询、值班 */
const staffWork = () => { const all = S.role === 'L3', U = all ? Object.keys(STAFF).filter(u => ['L1', 'L1s', 'T', 'L2', 'L3'].includes(STAFF[u].role) && STAFF[u].on !== false) : [me()];
  const d30 = new Date(NOW - 30 * 864e5), row = u => { const tk = TALKS.filter(t => t.by === u), it = ITEMS.filter(x => x.to === u), vf = STU.filter(s => s.stage === 'L1' && s.follower === u), bk = BOOK.filter(b => b.cid === u), du = DUTY.filter(x => x.who === u);
    return { u, t30: tk.filter(t => t.at >= d30).length, tAll: tk.length, open: it.filter(itOpen).length, over: it.filter(itOver).length, vf: vf.length, vfo: vf.filter(overdue).length, rv: STU.filter(s => s.stage === 'L2' && s.assignee === u).length, bk: bk.filter(b => ['ok', 'confirm', 'change'].includes(b.st)).length, bkd: bk.filter(b => ['done', 'record'].includes(b.st)).length, du: du.length, duNext: du.find(x => DUTY.indexOf(x) >= 1) }; };
  const R = U.map(row), n = (v, bad) => v ? `<b style="${bad ? 'color:var(--crit)' : ''}">${v}</b>` : '<span class="note">0</span>';
  return `<p class="intro">${I('info', 's')}<span>${all ? '每位老师的工作量，用来看谁忙、谁有事拖着，方便调配。只统计数量，不显示学生。' : '你自己的工作量。中心负责人和高级咨询师能看到所有人的。'}</span></p>
    ${all ? '' : `<div class="grid g4" style="margin-bottom:16px">${[['近 30 天谈心', R[0].t30, `累计 ${R[0].tAll} 次`], ['在办谈心事项', R[0].open, R[0].over ? `${R[0].over} 件超期` : '没有超期'], ['核实 / 复核', R[0].vf + R[0].rv, R[0].vfo ? `${R[0].vfo} 件超时` : '没有超时'], ['咨询', R[0].bk, `已完成 ${R[0].bkd} 次`]].map(([a, b, c]) => `<div class="kpi"><small>${a}</small><b>${b}</b><span>${c}</span></div>`).join('')}</div>`}
    <div class="card"><table class="t"><tr><th>老师</th><th>谈心 · 近 30 天</th><th>在办谈心</th><th>谈心超期</th><th>核实（L1）</th><th>复核（L2）</th><th>咨询 · 已约 / 完成</th><th>值班</th></tr>${R.map(r => `<tr><td><div style="display:flex;gap:8px;align-items:center">${photo(r.u)}<b>${fullOf(r.u)}</b><small class="note">${jobOf(r.u)}</small></div></td><td>${n(r.t30)}</td><td>${n(r.open)}</td><td>${n(r.over, 1)}</td><td>${r.vf ? `${r.vf}${r.vfo ? ` · <b style="color:var(--crit)">${r.vfo} 超时</b>` : ''}` : n(0)}</td><td>${n(r.rv)}</td><td>${r.bk || r.bkd ? `${r.bk} / ${r.bkd}` : n(0)}</td><td>${r.du ? `${r.du} 周${r.duNext ? `<small>下次 ${r.duNext.wk}</small>` : ''}` : n(0)}</td></tr>`).join('')}</table>
    <p class="note">超期、超时标红。值班按「成员管理 · 值班表」统计，咨询排班等预约那一版加上。</p></div>`; };
['L1', 'L2'].forEach(r => { if (!MENUS[r].some(m => m[0] === 'data')) MENUS[r].push(['data', '我的工作', 'chart']); });

/* =====================================================================
   学生委员（L1）看档案（表格 98、99、41）：看不到的页签直接不显示；
   加「对话摘录（脱敏）」：只放和这次核实有关的几句，姓名、学号、学校打码，打开记入操作记录
===================================================================== */
const EXKW = { 睡眠: /睡/, 学业: /课|学|考|作业|论文/, 情绪: /烦|累|难受|哭|低落|不开心/, 人际: /朋友|室友|同学/, 家庭: /家/, 恋爱: /恋|分手|男朋友|女朋友/, 生涯: /工作|实习|毕业|未来/, 新生适应: /适应|新/ };
const exMask = (s, t) => { let x = String(t); [s.name, s.name && s.name.slice(1), s.sid, s.code].concat(COLLEGES).filter(w => w && w.length > 1).forEach(w => { x = x.split(w).join('**'); }); return x.replace(/NTU|南洋理工(大学)?|南大|[A-Z]\d{7}[A-Z]?|\d{8}/g, '**'); };
const exPick = s => { if (s.walkin) return []; const a = ANS[s.ai] || [], n = Math.min(s.rounds || 0, a.length), re = (s.dirs || []).map(d => EXKW[d]).filter(Boolean);
  let I2 = [...Array(n).keys()].filter(i => re.some(r => r.test(a[i]))); if (!I2.length) I2 = [2, 3].filter(i => i < n); return I2.slice(0, 3); };
const exCard = s => { const L = exPick(s);
  return `<div class="card"><h3>对话摘录（脱敏）<span class="sp"></span><small>${L.length} 段 · 共 ${s.rounds || 0} 轮</small></h3>
    <p class="note">只放和这次核实有关的几句，方便你判断要不要上推；姓名、学号、学校已打码。完整对话只有心理中心老师能看。你打开这一页会记入操作记录。</p>
    ${L.length ? L.map(i => `<div class="msg"><img src="${MASCOT}" alt=""><div class="bb">${esc(exMask(s, SCRIPT[i]))}</div></div><div class="msg me"><div class="bb">${esc(exMask(s, ANS[s.ai][i]))}</div></div>`).join('<div class="note" style="text-align:center;margin:6px 0">……</div>') : '<div class="note">没有访谈记录。</div>'}</div>`; };
const _dtab18 = ACT.dtab; ACT.dtab = function (k) { _dtab18.apply(this, arguments); if (k === 'ex' && S.dw) { const s = SU(S.dw.sid); log('查看对话摘录（脱敏）', s, { cat: '查看', k: 'view' }); } };

/* =====================================================================
   每个账号都有自己的工作台（表格 96）：任课老师（谈心账号）加「工作台」
   派给我的谈心、我发出的邀约、分享给我的记录、要告诉学生的决定、消息中心
===================================================================== */
if (!MENUS.T.some(m => m[0] === 'home')) MENUS.T.unshift(['home', '工作台', 'home']);
const tHome = () => { const it = myItems(), ov = it.filter(itOver), iv = INV.filter(v => v.by === me() && v.st === 'wait'), sh = TALKS.filter(t => (t.shares || []).some(x => x.to === me() && !x.off)), tl = TELL.filter(t => t.by === me() && t.st === 'open');
  const k = [['要谈心的学生', it.length, ov.length ? `${ov.length} 件超期` : '没有超期', 'todo'], ['等学生回复的邀约', iv.length, '学生回复后会通知你', 'todo'], ['分享给我的记录', sh.length, '只能看，不能改', 'recs'], ['要告诉学生的决定', tl.length, '中心的决定，由你转告', 'todo']];
  return `<div class="grid g4" style="margin-bottom:16px">${k.map(([n, v, sub, t]) => `<button class="kpi" data-act="tHomeGo" data-arg="${t}"><small>${n}</small><b style="${n === '要谈心的学生' && ov.length ? 'color:var(--crit)' : ''}">${v}</b><span>${sub}</span></button>`).join('')}</div>
    <div class="grid g2"><div class="card"><h3>派给我的谈心<span class="sp"></span><button class="lnk" data-act="tHomeGo" data-arg="todo">全部 →</button></h3>
      ${it.length ? `<table class="t"><tr><th>学生</th><th>谁派的</th><th>期限</th><th></th></tr>${it.slice().sort((a, b) => (a.due || 0) - (b.due || 0)).slice(0, 5).map(x => { const s = SU(x.sid); return `<tr><td><b>${nm(s)}</b><small>${s.college}</small></td><td>${x.by ? ST(x.by).name : '系统'}</td><td>${x.due ? `<span class="${itOver(x) ? 'warn' : ''}">${fmt(x.due)}</span>` : '—'}</td><td><button class="btn sec xs" data-act="tkGoS" data-arg="${x.sid}">去谈心</button></td></tr>`; }).join('')}</table>` : `<div class="empty">${I('check')}<p>现在没有派给你的谈心</p><small>辅导员或心理中心派给你后，会在这里和消息中心提醒你。</small></div>`}</div>
      <div>${msgCenter()}${tl.length ? `<div class="card" style="margin-top:16px"><h3>要告诉学生的决定</h3>${tl.map(t => { const v = INV.find(x => x.id === t.inv), s = v && SU(v.sid); return `<div class="prow"><span>${s ? nm(s) : '—'}<small>中心决定：${esc(t.dec)}</small></span><button class="btn sec xs" data-act="tkGoS" data-arg="${s ? s.id : ''}">去处理</button></div>`; }).join('')}</div>` : ''}</div></div>
    <p class="note">你的账号等级是「谈心」：只看得到派给你的学生和分享给你的记录，看不到关注等级和普测结果。</p>`; };
const _home18t = PAGES.home; PAGES.home = function () { return S.role === 'T' ? tHome() : _home18t.apply(this, arguments); };
ACT.tHomeGo = t => { go('talk'); S.rec = null; S.rv = null; S.tabs.talk = t; };

/* 核实工作左列表、右操作区（表格 97）：L1 在工作台点学生，档案在右边打开，不遮住列表，可以一个个往下点 */
const _rSp18 = render; render = function () { const r = _rSp18.apply(this, arguments); try { const wk = !!(S.uid && S.page === 'home' && isL1() && homeView() === 'work'), on = wk && !!S.dw, vs = wk && /^(verify|quality):/.test(S.mo || '');
    document.body.classList.toggle('lsplit', on);
    if (S.page === 'home') document.querySelectorAll('#pg .t td').forEach(td => { if (td.querySelector('button,select,input,.clamp') || td.textContent.trim().length <= 60) return; td.innerHTML = `<div class="clamp" title="点击展开">${td.innerHTML}</div>`; });   // 表格 60：超长文字折叠，点击展开
    document.body.classList.toggle('vsplit', vs);
    document.querySelectorAll('#pg tr').forEach(tr => { const b = tr.querySelector('[data-act="mo"]'), a = tr.dataset.act === 'open' ? tr.dataset.arg : b && (b.dataset.arg || '').split(':')[1]; tr.classList.toggle('cur', !!a && ((on && a === S.dw.sid) || (vs && a === S.mo.split(':')[1]))); }); } catch (e) {} return r; };

/* 超长文字折叠（表格 60）：弹窗顶部的说明超过两行，只露第一句，其余点「展开说明」 */
const _mdFold18 = modal; modal = function () { const h = _mdFold18.apply(this, arguments); if (!h) return h;
  return h.replace(/(<div class="mo[^"]*"><h3>[\s\S]*?<\/h3>)<p>([\s\S]*?)<\/p>/, (m, a, p) => { const txt = p.replace(/<[^>]+>/g, ''); if (txt.length <= 70) return m;
    const i = p.search(/[。；]/); if (i < 0 || i > 80) return m; const op = S.mfo === S.mo; return `${a}<div class="mfold"><p>${op ? p : p.slice(0, i + 1)}</p><button class="lnk" data-act="mfoldT">${op ? '收起' : '展开说明'}</button></div>`; }); };
document.addEventListener('click', e => { const c = e.target.closest && e.target.closest('.clamp'); if (c) { e.stopPropagation(); c.classList.toggle('open'); } }, true);
ACT.mfoldT = () => { S.mfo = S.mfo === S.mo ? null : S.mo; };
