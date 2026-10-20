/* =====================================================================
   v1.16 · 10/19 走查意见和三份审查的修复（见 line3/review/v1.15-审查核实.md）
===================================================================== */
RULES.unfzAppr = true;
['u2', 'c2', 'c3', 'c4'].forEach(u => { ACCTS[u] = ACCTS[u] || [STAFF[u].role]; }); ACCTS.t2 = ACCTS.t2 || ['T'];   // 其他老师也能用 SSO 登录（移交、分享时要切过去看）                                   // 决定 2：危机期间恢复冻结的谈心要上级批准；上级可以在设置里关掉
/* 记录页：日期选择器 */
document.addEventListener('change', e => { const d = e.target.dataset; if (d.rd != null && S.rec) { S.rec.date = e.target.value; S.rec.dirty = true; render(); } });

/* 审计日志导出：真的生成 CSV（实操 08） */
ACT.auditExp = function () { const cat = S.f.acat || '', L = AUDIT.filter(a => !cat || a.cat === cat), q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = L.map(a => { const s = a.sid && SU(a.sid); return [fmt(a.at), a.uid === 'sys' ? '系统' : ST(a.uid).name, RN[a.role] || a.role, a.cat, S.role === 'ADM' && a.sid ? auditGeneric(a).replace(/<[^>]+>/g, '') : a.t, s ? (S.role === 'ADM' ? '学生 ' + s.code : s.name) : a.obj].map(q).join(','); });
  const csv = '﻿' + `"导出人：${ST(me()).name} · ${fmt(NOW)} · 仅供工作使用，请勿外传"\n` + ['时间', '操作人', '身份', '类型', '操作', '对象'].join(',') + '\n' + rows.join('\n');
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `审计日志-${fmt(NOW).split(' ')[0].replace(/\//g, '')}.csv`; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {}
  log(`导出审计日志 ${rows.length} 条${cat ? `（${cat}）` : ''}`, null, { cat: '导出', obj: '审计日志' }); toast(`已导出 ${rows.length} 条，文件带水印，已记入审计日志`); };

/* ---------- 菜单（U16）：工作台、危机干预、施测工作、预约咨询、谈心工作、数据看板、权限与设置 ---------- */
const GRP = { students: 'test', survey: 'test', work: 'test' };
const GRP_TABS = { students: '被测名单', survey: '施测方案', work: '我管理的学生' };
const MLBL = { home: '工作台', crisis: '危机干预', students: '施测工作', booking: '预约咨询', talk: '谈心工作', data: '数据看板', settings: '权限与设置', noti: '通知' };
Object.keys(MENUS).forEach(r => { const L = MENUS[r], has = k => L.some(m => m[0] === k), order = ['home', 'crisis', 'students', 'booking', 'talk', 'data', 'settings'];
  const vis = order.filter(has).map(k => [k, MLBL[k], (L.find(m => m[0] === k) || [])[2]]);
  if (!has('students') && (has('survey') || has('work'))) vis.splice(1, 0, [has('survey') ? 'survey' : 'work', '施测工作', 'list']);
  const hid = L.filter(m => !order.includes(m[0])).map(m => [m[0], GRP_TABS[m[0]] || m[1], m[2], 'hide']);
  hid.push(['noti', '通知', 'bell', 'hide']);
  MENUS[r] = vis.concat(hid); });
Object.assign(TITLES, { crisis: '危机干预', students: '施测工作', survey: '施测工作', work: '施测工作', booking: '预约咨询', talk: '谈心工作', data: '数据看板', settings: '权限与设置', noti: '通知' });
const grpOf = p => GRP[p] ? Object.keys(GRP).filter(k => MENUS[S.role].some(m => m[0] === k)) : [];
const lvCode = () => ({ L1s: 'L1', T: 'T' })[S.role] || S.role;
const postOf = u => { const x = STAFF[u]; if (x.role === 'L1') return `${(staffCols(u) || []).join('、')} · 辅导员`; if (x.role === 'L1s') return '南洋商学院 · 学生心理委员';
  if (x.role === 'T') return `${(x.cols || []).join('、')} · 任课老师`; if (x.role === 'ADM') return '系统管理员'; return `大学心理咨询中心 · ${x.title}`; };
const _sh16 = shell; shell = function (b) { let h = _sh16(b);
  const cnt = { home: queues().filter(q => q.k !== 'r3pool').reduce((a, q) => a + qCount(q), 0), crisis: crisisNew().length }, cur = GRP[S.page] ? MENUS[S.role].find(m => !m[3] && GRP[m[0]]) : null;
  const nav = MENUS[S.role].filter(m => !m[3]).map(([k, n, ic]) => `<button class="${S.page === k || (cur && cur[0] === k) || (S.page === 'noti' && k === 'home') ? 'on' : ''}" data-act="go" data-arg="${k}">${I(ic)}${n}${k === 'crisis' && cnt.crisis ? `<span class="cnt r">${cnt.crisis}</span>` : k === 'home' && cnt.home ? `<span class="cnt">${cnt.home}</span>` : ''}</button>`).join('');
  h = h.replace(/<nav>[\s\S]*?<\/nav>/, `<nav>${nav}</nav>`);
  h = h.replace(/<div class="who">[\s\S]*?<\/div><\/div>/, `<div class="who">${photo(me())}<div><b>${fullOf(me())}</b><span>${lvCode()}${S.role !== 'ADM' && isAdm() ? ' · 兼系统管理员' : ''}</span><span>${postOf(me())}</span></div></div>`);
  const g = grpOf(S.page); if (g.length > 1) h = h.replace('<div class="page" id="pg">', `<div class="page" id="pg"><div class="tabs gtabs">${g.map(k => `<button class="${S.page === k ? 'on' : ''}" data-act="go" data-arg="${k}">${GRP_TABS[k]}</button>`).join('')}</div>`);
  return h; };
/* 施测工作里辅导员的「我管理的学生」「宣传素材」直接做成上面的分页，不再套一层 */
GRP_TABS.work = '我管理的学生';

/* ---------- 工作台：默认全部展开（U10）；「重点关注」高亮框（U4）；通知管理入口（U18） ---------- */
S.full = true; ACT.fullT = () => {};
const focusStu = () => { if (!['L1', 'T', 'L2', 'L3'].includes(S.role)) return [];
  const r = new Map(), add = (s, why) => { if (!r.has(s.id)) r.set(s.id, { s, why: [] }); const o = r.get(s.id); if (!o.why.includes(why)) o.why.push(why); };
  TELL.filter(t => t.by === me() && t.st === 'open').forEach(t => add(SU(INV.find(v => v.id === t.inv).sid), '要告诉学生中心的决定'));
  myItems().filter(itOver).forEach(x => add(SU(x.sid), '谈心已超期'));
  INV.filter(v => v.by === me() && ['wait', 'wait2'].includes(v.st) && v.d === 'ok' && v.start > NOW && (v.start - NOW) / H < 24).forEach(v => add(SU(v.sid), '见面前还没回复'));
  INV.filter(v => v.by === me() && v.st === 'change').forEach(v => add(SU(v.sid), '学生想换时间'));
  myItems().filter(x => itDue(x) && x.st === 'open' && curLv(SU(x.sid)) >= 4).forEach(x => add(SU(x.sid), '关注等级较高'));
  return [...r.values()]; };
const focusBox = () => { const L = focusStu(); if (!L.length) return '';
  return `<div class="card focus"><h3>${I('flag')}重点关注（${L.length}）<span class="sp"></span><small>点学生直接进谈心工作</small></h3><div class="fgrid">${L.slice(0, 9).map(o => { const its = myItems().filter(x => x.sid === o.s.id && itOpen(x)), x0 = its.length ? its.reduce((a, b) => a.due < b.due ? a : b) : null, over = x0 && itOver(x0);
    return `<div class="fstu ${over ? 'over' : ''}"><div class="f1"><b>${o.s.name}</b>${lvT(o.s) || ''}</div><div class="f2"><em>${o.why.join('、')}</em>${x0 ? `<span class="due">${over ? `已超期 ${Math.max(1, Math.round((NOW - x0.due) / 864e5))} 天` : `期限 ${fmt(x0.due).split(' ')[0]}`}</span>` : ''}</div><div class="f3"><small>${o.s.college} · ${o.s.year}</small><button class="btn pri xs" data-act="tkGoS" data-arg="${o.s.id}">去谈心</button></div></div>`; }).join('')}</div>${L.length > 9 ? `<p class="note">还有 ${L.length - 9} 位，在「谈心工作」里看全部。</p>` : ''}</div>`; };
const _home16 = PAGES.home; PAGES.home = function () { let h = _home16();
  h = h.replace(/<button class="btn ghost xs" data-act="fullT">[^<]*<\/button>/, `<button class="btn ghost xs" data-act="go" data-arg="noti">${I('bell', 's')}通知管理${myNoti().filter(n => !n.read).length ? `（${myNoti().filter(n => !n.read).length} 条未读）` : ''}</button>`);
  if (homeView() === 'work') h = h.replace('</div>', '</div>' + focusBox());
  return h; };

/* ---------- 通知管理页（U18）：发给我的 / 全部送达记录，可以筛选、点回来源 ---------- */
const notiSrc = n => { if (!n.ref) return '<span class="note">—</span>'; const k = CRISES.find(x => x.id === n.ref), s = !k && SU(n.ref);
  if (k) return S.role === 'ADM' ? '<span class="note">无权查看</span>' : `<button class="lnk" data-act="go" data-arg="crisis">危机 · ${nm(SU(k.sid))}</button>`;
  if (!s) return '<span class="note">—</span>'; if (S.role === 'ADM') return '<span class="note">无权查看</span>';
  return ['L1', 'T'].includes(S.role) ? `<button class="lnk" data-act="tkGoS" data-arg="${s.id}">${nm(s)}</button>` : `<button class="lnk" data-act="open" data-arg="${s.id}">${nm(s)}</button>`; };
PAGES.noti = function () { const all = ['L3', 'ADM'].includes(S.role) && S.tabs.noti2 === 'all', adm = all && S.role === 'ADM', f = S.f, q = (f.nq || '').trim();
  let L = (all ? NOTI : myNoti()).filter(n => (!f.nch || n.ch.includes(f.nch)) && (!f.nst || n.st === f.nst) && (!q || (!adm && n.t.includes(q)) || (all && ST(n.to).name.includes(q))));
  const per = 30, pages = Math.max(1, Math.ceil(L.length / per)), pg = Math.min(S.npg || 1, pages);
  return `<p class="nback"><button class="lnk" data-act="go" data-arg="home">← 返回工作台</button></p><div class="card"><div class="tabs"><button class="${all ? '' : 'on'}" data-act="nTab" data-arg="me">发给我的（${myNoti().length}）</button>${['L3', 'ADM'].includes(S.role) ? `<button class="${all ? 'on' : ''}" data-act="nTab" data-arg="all">全部送达记录（${NOTI.length}）</button>` : ''}<span class="sp"></span>${myNoti().some(n => !n.read) ? '<button class="btn ghost xs" data-act="nRead">全部标为已读</button>' : ''}</div>
    <div class="filters"><select data-bind="f.nch" data-rerender><option value="">全部渠道</option>${['站内', '短信', '电话', '邮件'].map(c => `<option ${f.nch === c ? 'selected' : ''}>${c}</option>`).join('')}</select><select data-bind="f.nst" data-rerender><option value="">全部状态</option>${[...new Set(NOTI.map(n => n.st))].map(c => `<option ${f.nst === c ? 'selected' : ''}>${c}</option>`).join('')}</select><input class="in" style="width:200px" data-bind="f.nq" data-rerender placeholder="${adm ? '搜收件人' : all ? '搜内容或收件人' : '搜内容'}" value="${esc(q)}"><span class="note">${(all ? NOTI : myNoti()).length} 条 · 当前 <b>${L.length}</b> 条</span></div>
    <table class="t dense"><tr><th>时间</th>${all ? '<th>收件人</th>' : ''}<th>内容</th><th>渠道</th><th>状态</th><th>来源</th></tr>${L.slice((pg - 1) * per, pg * per).map(n => `<tr class="${n.read || all ? '' : 'un'}"><td>${fmt(n.at)}</td>${all ? `<td>${ST(n.to).name}<small>${RN[STAFF[n.to].role] || ''}</small></td>` : ''}<td class="ntx">${adm && n.to !== me() ? '<span class="note">（正文不显示：系统管理员只看送达情况）</span>' : esc(n.t)}</td><td>${n.ch}</td><td><span class="pill ${n.st === '已确认' ? 'g' : n.st === '发送中' ? 'w' : ''}">${n.st}</span></td><td>${notiSrc(n)}</td></tr>`).join('') || `<tr><td colspan="6" class="note">没有符合条件的通知</td></tr>`}</table>
    ${pages > 1 ? `<div style="display:flex;gap:6px;justify-content:flex-end;margin-top:8px">${Array.from({ length: pages }, (_, i) => `<button class="btn ${pg === i + 1 ? 'pri' : 'sec'} xs" data-act="npg" data-arg="${i + 1}">${i + 1}</button>`).join('')}</div>` : ''}
    <p class="note">短信和电话显示送达状态；危机通知在值班确认后变成「已确认」。${S.role === 'ADM' ? '系统管理员不接触个案，正文和来源都不显示。' : '点「来源」回到对应的学生或危机。'}${all ? '查看全部送达记录会记入审计日志。' : ''}</p></div>`; };
Object.assign(ACT, { nTab(k) { S.tabs.noti2 = k; S.npg = 1; if (k === 'all') log('查看全部通知送达记录', null, { cat: '查看', obj: '通知' }); }, nRead() { myNoti().forEach(n => n.read = true); }, npg(i) { S.npg = +i; } });
const _np16 = notiPanel; notiPanel = function () { return _np16().replace('<p class="note" style="margin:8px 0 0">', '<p class="note" style="margin:8px 0 0"><button class="lnk" data-act="go" data-arg="noti">打开通知管理 →</button> '); };

/* ---------- 谈心工作 · 待谈心：左边学生列表，右边这个学生的事项和记录（U4） ---------- */
const stuRecs = sid => TALKS.filter(t => (t.sids || [t.sid]).includes(sid) && (recOwner(t) || (!t.draft && recVis(t)))).sort((a, b) => b.at - a.at);
tkTodo = function () { const L = myItems(), tell = TELL.filter(t => t.by === me() && t.st === 'open'), ho = (S.ho || {})[me()];
  const ov1 = L.filter(x => itOver(x) && !INV.some(v => v.id === x.inv && ['wait', 'expired'].includes(v.st))).length, ov2 = L.filter(x => itOver(x) && INV.some(v => v.id === x.inv && (['wait', 'expired'].includes(v.st) || v.d !== 'ok'))).length;
  const dueOf = s => Math.min(...L.filter(x => x.sid === s.id).map(x => +x.due));
  let studs = [...new Set(L.map(x => x.sid))].map(SU).sort((a, b) => dueOf(a) - dueOf(b));
  let sel0 = S.tksel && SU(S.tksel); if (sel0 && !studs.includes(sel0) && !tkScope(sel0)) sel0 = null; if (sel0 && !studs.includes(sel0)) studs = [sel0].concat(studs);
  const sel = sel0 || studs[0];
  const left = studs.map(s => { const its = L.filter(x => x.sid === s.id), due = its.filter(itDue), first = its.length ? (due.length ? due : its).reduce((a, b) => a.due < b.due ? a : b) : null;
    return `<button class="tkrow ${sel === s ? 'on' : ''} ${its.some(itOver) ? 'crit' : ''}" data-act="tkX" data-arg="${s.id}"><span class="r1"><b>${s.name}</b>${lvT(s)}<span class="sp"></span>${first ? (itOver(first) ? `<span class="due r">已超期</span>` : itDue(first) ? `<small>${fmt(first.due).split(' ')[0]} 前</small>` : '<small>未到期</small>') : '<small class="note">不在你的待谈心里</small>'}</span><span class="r2">${s.sid} · ${s.college} · ${s.year}</span>${stuTags(s, its) ? `<span class="r3">${stuTags(s, its)}</span>` : ''}</button>`; }).join('');
  let right = `<div class="empty"><img src="${MASCOT}" alt="">现在没有要谈的学生</div>`;
  if (sel) { const its = L.filter(x => x.sid === sel.id), fz = its.length && its.every(x => x.st === 'frozen'), recs = stuRecs(sel.id), ivs = INV.filter(v => v.sid === sel.id && v.by === me() && ivActive(v)), mN = missN(sel);
    seeOthers(sel, recs);
    right = `<div class="tkhd"><div><h3>${sel.name} <small>${sel.sid}</small></h3><p class="note">${sel.college} · ${sel.year}${lvT(sel) ? ' · ' + lvT(sel) : ''}${freqTxt(sel) ? ` · ${freqTxt(sel)}` : ''}${mN || missLog(sel).length ? ` · <button class="lnk" data-act="mo" data-arg="tkMiss:${sel.id}">连续未回应 ${mN} 次</button>` : ''}</p></div><span class="sp"></span>
      ${its.length ? `${fz || inCrisis(sel.id) ? '<button class="btn sec xs dis" data-act="hint" data-arg="frz" title="学生在危机通道里，邀约先暂停">发邀约</button>' : `<button class="btn sec xs" data-act="mo" data-arg="tkInv:${sel.id}">发邀约</button>`}<button class="btn pri xs" data-act="tkNew" data-arg="${sel.id}">写记录</button><button class="btn ghost xs" data-act="mo" data-arg="tkRep:${sel.id}">上报中心</button><button class="btn ghost xs" data-act="mo" data-arg="tkMove:${sel.id}">转给其他老师</button>${hintQ('noDel')}` : `<button class="btn pri xs" data-act="tkNew" data-arg="${sel.id}">写记录</button>${isCenter() ? `<button class="btn ghost xs" data-act="open" data-arg="${sel.id}">打开档案</button>` : ''}`}</div>
      ${its.length ? `<h4 class="qsub">事项（${its.length}）</h4>${its.map(x => `<div class="tkit tk2"><div class="l1"><span class="pill">${ISRC[x.src]}</span><b class="grow">${esc(itWhy(x))}</b></div><div class="l2"><span class="${itOver(x) ? 'due r' : ''}">期限 ${fmt(x.due).split(' ')[0]}</span>${pillSt(x)}${x.src === 'center' && x.by ? `<small>${ST(x.by).name} 发起</small>` : ''}${x.inv ? `<small>已发邀约 · ${VST[(INV.find(v => v.id === x.inv) || {}).st] || ''}</small>` : ''}${x.backNote ? `<small class="warn">中心退回：${esc(x.backNote)}</small>` : ''}<span class="sp"></span>${x.st === 'frozen' ? (x.unfzAsk ? '<small class="note">已申请恢复，等上级批准</small>' : `<button class="btn ghost xs" data-act="mo" data-arg="tkUnfz:${x.id}">申请恢复</button>`) : ''}</div>`).join('')}` : ''}
      ${ivs.length ? `<h4 class="qsub">已约（${ivs.length}）</h4>${ivs.map(v => `<p class="tkline">${ivTime(v)} · ${v.mode}<span class="sp"></span><span class="pill ${v.st === 'ok' ? 'g' : v.st === 'frozen' ? 'r' : 'w'}">${VST[v.st]}</span></p>`).join('')}` : ''}
      <h4 class="qsub">谈话记录（${recs.length}）</h4>${recs.length ? `<table class="t dense"><tr><th>谈话时间</th><th>写的人</th><th>方式 · 结果</th><th>学生的情况</th><th></th></tr>${recs.map(t => { const v = recVis(t), see = v === 'full' || (Array.isArray(v) && v.includes('situ'));
        return `<tr><td>${fmt(t.at)}${t.draft ? '<small class="warn">草稿</small>' : ''}</td><td>${ST(t.by).name}<small>${tagOf(t.by)}</small></td><td>${t.mode || '—'} · ${t.result || '—'}</td><td class="tkpts">${see ? esc((t.situ || '').slice(0, 40)) + ((t.situ || '').length > 40 ? '…' : '') : '<span class="note">未分享</span>'}${t.risk ? `<small class="tkrisk">${I('alert', 's')}含安全相关内容</small>` : ''}</td><td>${t.draft ? `<button class="btn sec xs" data-act="tkEdit" data-arg="${t.id}">接着写</button>` : `<button class="btn ghost xs" data-act="tkView" data-arg="${t.id}">查看</button>`}</td></tr>`; }).join('')}</table>` : '<p class="note">还没有你能看到的谈话记录。</p>'}`; }
  return `${tell.length ? `<div class="dbox warnbox"><b>中心的决定，需要你告诉学生（${tell.length}）</b>${tell.map(t => { const v = INV.find(x => x.id === t.inv), s = SU(v.sid); return `<p class="tkline">${s.name} · 原定 ${ivTime(v)} · 中心决定<b>${t.dec === '重新约' ? '重新约时间（原定时间在危机期间已过）' : t.dec === '恢复' ? '照常见面' : '这次先不见'}</b><span class="sp"></span><button class="btn sec xs" data-act="tkTell" data-arg="${t.id}|已通知">已通知学生</button><button class="btn ghost xs" data-act="tkTell" data-arg="${t.id}|没联系上">没联系上</button></p>`; }).join('')}<p class="note">请你自己联系学生，不要提危机相关的内容；系统不会替你通知学生。</p></div>` : ''}
    ${ho ? `<div class="dbox"><b>交接清单 · 从 ${ST(ho.from).name} 移交给你</b><p class="note" style="margin:4px 0 0">待谈心 ${ho.items} 个、已约 ${ho.inv} 个、草稿 ${ho.drafts} 条、分享出去的记录 ${ho.shares} 条。草稿可以接着写，分享可以延长或收回；已约的邀约请在「已约」里选保留或改期。</p></div>` : ''}
    ${L.length ? `<p class="note tkov">超期：老师未处理 <b>${ov1}</b> · 学生未回应 / 送达失败 <b>${ov2}</b></p>` : ''}
    ${studs.length ? `<div class="tksplit"><div class="tkl">${left}</div><div class="tkr">${right}</div></div><p class="note">任务不能删除：自己谈、上报中心、转给其他老师三选一。</p>` : right}`; };
ACT.tkX = sid => { S.tksel = sid; };
const _tkGoS16 = ACT.tkGoS; ACT.tkGoS = function (sid) { if (S.rec && S.rec.dirty) { S.pendSel = sid; S.mo = 'recLeave:talk'; return; } _tkGoS16(sid); S.tksel = sid; };

/* ---------- 表格：表头点击排序（再点一次倒序）（U17） ---------- */
const sth = (tbl, k, n) => { const o = (S.srt || {})[tbl] || {}; return `<th class="srt ${o.k === k ? 'on' : ''}" data-act="srt" data-arg="${tbl}|${k}" title="点击排序，再点一次倒序">${n}<i>${o.k === k ? (o.d > 0 ? '↑' : '↓') : '↕'}</i></th>`; };
const srtBy = (tbl, L, keys) => { const o = (S.srt || {})[tbl]; if (!o || !keys[o.k]) return L; const f = keys[o.k];
  return L.slice().sort((a, b) => { const x = f(a), y = f(b); return (typeof x === 'string' ? x.localeCompare(y, 'zh') : (x ?? 1e12) - (y ?? 1e12)) * o.d; }); };
ACT.srt = a => { const [t, k] = a.split('|'); S.srt = S.srt || {}; const o = S.srt[t]; S.srt[t] = o && o.k === k ? { k, d: -o.d } : { k, d: 1 }; S.pg = 1; S.wpg = 1; };
const SKEY = { lv: s => -curLv(s), name: s => s.name, sid: s => S.role === 'L1s' ? s.code : s.sid, col: s => s.college, year: s => s.year, due: s => leftOf(s) ?? fLeft(s), fol: s => ST(s.follower).name };

/* ---------- 被测名单：更紧凑，单列学号，可以按学院、年级筛，表头排序（U6 / U9 / U17） ---------- */
PAGES.students = function () {
  const tab = S.tabs.students || 'all', f = S.f, L1 = isL1(), base = visibleStudents();
  let list = base.slice();
  if (tab === 'mine') list = list.filter(s => s.assignee === me() || s.owner === me());
  if (tab === 'todo') list = list.filter(s => ['L1', 'L2', 'L3', 'crisis'].includes(s.stage) || fdueNow(s));
  if (tab === 'over') list = list.filter(s => overdue(s) || fOver(s));
  if (f.lv && (canLv() || lvSeen())) list = list.filter(s => String(curLv(s)) === f.lv);
  if (f.layer) list = list.filter(s => layerMatch(s, f.layer));
  if (f.col) list = list.filter(s => s.college === f.col);
  if (f.yr) list = list.filter(s => s.year === f.yr);
  if (f.plan) list = list.filter(s => (s.plans || []).includes(f.plan));
  if (f.q) list = list.filter(s => searchHit(s, f.q));
  if (L1 || !canLv()) list = byDue(list); else list.sort((a, b) => (b.stage === 'crisis') - (a.stage === 'crisis') || curLv(b) - curLv(a) || b.sig - a.sig || b.done - a.done);
  list = srtBy('stu', list, SKEY);
  const per = 30, pages = Math.max(1, Math.ceil(list.length / per)); if (S.pg > pages) S.pg = 1;
  const rows = list.slice((S.pg - 1) * per, S.pg * per), std = LAYER_OPTS().some(o => o[0] === f.layer), cols = [...new Set(base.map(s => s.college))].sort(), yrs = [...new Set(base.map(s => s.year))].sort();
  const showLv = canLv() || lvSeen(), idCol = canName() || S.role === 'L1s';
  return `<div class="card"><div class="tabs">${[['all', L1 ? '我跟进的学生' : '全部'], ...(L1 ? [] : [['todo', '待处理'], ['mine', '我负责的']]), ['over', '已超时']].map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-act="stab" data-arg="${k}">${n}</button>`).join('')}<span style="flex:1"></span>${S.role === 'L3' && can(10) ? `<button class="btn sec xs" data-act="mo" data-arg="import:roster">${I('dl', 's')}导入 / 替换名单</button>` : ''}</div>
    ${f.layer && !std ? `<div class="chip">筛选：${esc(f.label || LAYER_LBL[f.layer] || f.layer)} · ${list.length} 人 <button data-act="clearF">${I('x', 's')}清除</button></div>` : ''}
    <div class="filters">${showLv ? `<label class="flab"><span>关注等级</span><select data-bind="f.lv" data-rerender><option value="">全部等级</option>${[5, 4, 3, 2, 1].map(l => `<option value="${l}" ${f.lv == l ? 'selected' : ''}>${l} ${LVN[l]}</option>`).join('')}</select></label>` : ''}
      <label class="flab"><span>学院</span><select data-bind="f.col" data-rerender><option value="">全部学院</option>${cols.map(c => `<option ${f.col === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="flab"><span>年级</span><select data-bind="f.yr" data-rerender><option value="">全部年级</option>${yrs.map(c => `<option ${f.yr === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="flab"><span>${L1 ? '状态' : '所在层'}</span><select data-bind="f.layer" data-rerender><option value="">${L1 ? '全部状态' : '当前所在层'}</option>${LAYER_OPTS().map(([k, n]) => `<option value="${k}" ${f.layer === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      ${L1 ? '' : `<label class="flab"><span>施测方案</span><select data-bind="f.plan" data-rerender><option value="">全部施测方案</option>${PLANS.filter(p => p.st !== 'draft').map(p => `<option value="${p.id}" ${f.plan === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}</select></label>`}
      <span class="note flcnt">共 ${list.length} 人 · 点表头排序</span></div>
    <table class="t dense"><tr>${showLv ? sth('stu', 'lv', canLv() ? '等级' : '关注等级') : ''}${sth('stu', 'name', '学生')}${idCol ? sth('stu', 'sid', S.role === 'L1s' ? '编号' : '学号') : ''}${sth('stu', 'col', '学院')}${sth('stu', 'year', '年级')}${canLv() ? '<th>精筛方向</th>' : ''}<th>${L1 ? '状态' : '当前所在层'}</th>${sth('stu', 'due', '等了多久 / 时限')}${L1 ? '' : sth('stu', 'fol', '跟进人 / 负责')}</tr>
    ${rows.map(s => `<tr class="hov ${s.stage === 'crisis' && !L1 ? 'crit' : ''}" data-act="open" data-arg="${s.id}">${showLv ? `<td>${canLv() ? `${lvB(curLv(s), s.sig)}${s.conf ? '' : '<small>初判，待确认</small>'}` : lvT(s)}</td>` : ''}<td><b>${nm(s)}</b></td>${idCol ? `<td class="mono">${S.role === 'L1s' ? s.code : s.sid}</td>` : ''}<td>${s.college}</td><td>${s.year}</td>${canLv() ? `<td>${tags(s.fs)}</td>` : ''}<td>${layer(s)}</td><td class="due2">${['L1', 'L2', 'L3'].includes(s.stage) ? `<span>等了 ${dur(hrs(s.since))}</span>` : ''}<span>${leftOf(s) != null ? dueTag(leftOf(s)) : fdueNow(s) ? fdueTag(s) : ''}</span></td>${L1 ? '' : `<td>${ST(s.follower).name}${s.owner ? ` / ${ST(s.owner).name}` : s.assignee && s.stage === 'L2' ? ` / ${ST(s.assignee).name}` : ''}</td>`}</tr>`).join('') || '<tr><td colspan="10"><div class="empty">没有符合条件的学生</div></td></tr>'}</table>
    <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:10px">${Array.from({ length: pages }, (_, i) => `<button class="btn ${S.pg === i + 1 ? 'pri' : 'sec'} xs" data-act="pg" data-arg="${i + 1}">${i + 1}</button>`).join('')}</div></div>`; };

/* ---------- 辅导员「我管理的学生」：同样加密、筛选、排序；谈心按新的事项和记录（U6 / U9） ---------- */
const _wp16b = PAGES.work; PAGES.work = function () { if (!isL1() || (S.tabs.work || 'stu') !== 'stu') return _wp16b();
  const h = _wp16b(), f = S.f, q = (f.wq || '').trim(), base = STU.filter(s => inScope(s)), cols = [...new Set(base.map(s => s.college))].sort(), yrs = [...new Set(base.map(s => s.year))].sort();
  const nT = s => TALKS.filter(t => !t.draft && (t.sids || [t.sid]).includes(s.id) && recOwner(t)).length, lastT = s => TALKS.filter(t => !t.draft && (t.sids || [t.sid]).includes(s.id) && recOwner(t)).sort((a, b) => b.at - a.at)[0];
  const nIt = s => myItems().filter(x => x.sid === s.id).length;
  let L = base.filter(s => (!q || s.name.includes(q) || s.sid.includes(q)) && (!f.wcol || s.college === f.wcol) && (!f.wyr || s.year === f.wyr));
  L = srtBy('wst', L, { lv: s => -curLv(s), name: s => s.name, sid: s => s.sid, col: s => s.college, year: s => s.year, n: s => -nT(s), last: s => { const t = lastT(s); return t ? -t.at : null; }, it: s => -nIt(s) });
  const per = 30, pages = Math.max(1, Math.ceil(L.length / per)), pg = Math.min(S.wpg || 1, pages);
  const body = `<div class="filters"><input class="in" style="width:200px" data-bind="f.wq" data-rerender placeholder="搜索姓名或学号" value="${esc(q)}"><select data-bind="f.wcol" data-rerender><option value="">全部学院</option>${cols.map(c => `<option ${f.wcol === c ? 'selected' : ''}>${c}</option>`).join('')}</select><select data-bind="f.wyr" data-rerender><option value="">全部年级</option>${yrs.map(c => `<option ${f.wyr === c ? 'selected' : ''}>${c}</option>`).join('')}</select><span class="note">${L.length} 人 · 点表头排序</span></div>
    <table class="t dense"><tr>${sth('wst', 'lv', '关注等级')}${sth('wst', 'name', '学生')}${sth('wst', 'sid', '学号')}${sth('wst', 'col', '学院')}${sth('wst', 'year', '年级')}${sth('wst', 'n', '我谈过')}${sth('wst', 'last', '上次谈心')}${sth('wst', 'it', '待谈心事项')}<th></th></tr>${L.slice((pg - 1) * per, pg * per).map(s => { const lt = lastT(s), n = nIt(s);
      return `<tr><td>${lvT(s)}</td><td><b>${s.name}</b></td><td class="mono">${s.sid}</td><td>${s.college}</td><td>${s.year}</td><td>${nT(s)}</td><td>${lt ? fmt(lt.at).split(' ')[0] : '—'}</td><td>${n ? `<span class="pill p">${n} 个</span>` : '—'}</td><td><button class="btn ${n ? 'pri' : 'ghost'} xs" data-act="tkGoS" data-arg="${s.id}">去谈心</button></td></tr>`; }).join('')}</table>
    ${pages > 1 ? `<div style="display:flex;gap:6px;justify-content:flex-end;margin-top:8px">${Array.from({ length: pages }, (_, i) => `<button class="btn ${pg === i + 1 ? 'pri' : 'sec'} xs" data-act="wpg" data-arg="${i + 1}">${i + 1}</button>`).join('')}</div>` : ''}`;
  const i = h.indexOf('<div class="filters">'), j = h.indexOf('<p class="note">这里只有身份信息'); if (i < 0 || j < i) return h;
  return h.slice(0, i) + body + h.slice(j); };
const _wp16c = PAGES.work; PAGES.work = function () { return _wp16c().replace(`${I('users')}学生工作<span class="sp"></span>`, `${I('users')}我管理的学生<span class="sp"></span>`); };

/* ---------- 登录页（U13 / U14）：只放 NTU SSO；这台电脑最近登录的 5 个账号用头像显示，选了仍要短信验证 ---------- */
const SSO_ID = { u1: 'zhouye', u2: 'zhengke', u3: 'linxt', c1: 'liwen', c2: 'maria', c3: 'daniel', c4: 'wanglei', c5: 'zhujing', a1: 'admin.chen', t1: 'wumin', t2: 'tanml' };
const recentGet = () => { try { const v = JSON.parse(localStorage.getItem('ly_adm_recent') || 'null'); if (Array.isArray(v)) return v.filter(u => ACCTS[u]).slice(0, 5); } catch (e) {} return S._recent || ['u1']; };
const recentSet = L => { S._recent = L; try { localStorage.setItem('ly_adm_recent', JSON.stringify(L)); } catch (e) {} };
const _en16 = enter; enter = function (uid) { _en16.apply(this, arguments); if (ACCTS[uid]) recentSet([uid].concat(recentGet().filter(u => u !== uid)).slice(0, 5)); };
const _lp16 = loginPage; loginPage = function () { const L = S.login;
  if (L.step !== 0 && L.step !== 9) return _lp16();
  let body; const rec = recentGet();
  if (L.step === 0) body = `<h2>登录灵屿机构端</h2><p class="note">使用学校统一身份认证（NTU SSO）登录，再做短信二次验证。</p>
      <button class="btn pri" style="width:100%;height:44px" data-act="lgSso2">${I('shield', 's')}使用 NTU SSO 登录</button>
      ${rec.length ? `<p class="note" style="margin:18px 0 8px">最近在这台电脑上登录过</p><div class="recent">${rec.map(u => `<div class="rac"><button data-act="lgRecent" data-arg="${u}" title="${fullOf(u)} · ${SSO_ID[u] || u}@ntu.edu.sg">${photo(u) || `<span class="av0">${fullOf(u).slice(0, 1)}</span>`}<span class="rt"><b>${fullOf(u)}</b><small>${SSO_ID[u] || u}@ntu.edu.sg</small></span></button><button class="rx" data-act="lgForget" data-arg="${u}" title="从这台电脑上移除">移除</button></div>`).join('')}</div><p class="note">选了账号也要短信验证。公用电脑用完请点「移除」。</p>` : ''}
      <p class="note demo-hint">演示：换人请用页面顶部的「快速登录」。</p>`;
  else body = `<h2>NTU 统一身份认证</h2><p class="note">这是学校 SSO 的登录页（演示）。</p>
      <div class="fld"><label>NTU 账号</label><input class="in" style="width:100%" data-lacc value="${esc(L.acc ?? (SSO_ID[rec[0]] || ''))}" placeholder="例如：zhouye"></div>
      <div class="fld"><label>密码</label><input class="in" type="password" style="width:100%" value="demo1234"></div>${L.err ? `<p class="note warn">${L.err}</p>` : ''}
      <button class="btn pri" style="width:100%;height:44px" data-act="lgSsoGo">登录</button><button class="btn ghost" style="width:100%;margin-top:8px" data-act="lgBack">返回</button>`;
  return `<div class="login"><div class="lbox"><div class="lg2"><img src="${MASCOT}" alt=""><div><b>灵屿 2.0</b><small>校园心理普测与服务协同 · 机构端</small></div></div>${body}
    <p class="note" style="margin-top:18px;text-align:center">空闲 15 分钟自动退出 · 登录、退出、切换身份都记入审计日志</p></div></div>`; };
Object.assign(ACT, {
  lgSso2() { S.login = { step: 9 }; },
  lgSsoGo() { const L = S.login, a = (L.acc ?? (SSO_ID[recentGet()[0]] || '')).trim().replace(/@.*$/, ''), u = Object.keys(SSO_ID).find(k => SSO_ID[k] === a);
    if (!u || !ACCTS[u]) { L.err = '账号或密码不对。演示里请用顶部「快速登录」换人。'; return; } if (STAFF[u] && STAFF[u].on === false) { L.err = '这个账号已停用，请联系系统管理员'; return; } S.login = { step: 1, uid: u }; },
  lgRecent(u) { if (STAFF[u] && STAFF[u].on === false) return toast('这个账号已停用，请联系系统管理员'); S.login = { step: 1, uid: u }; },
  lgForget(u) { recentSet(recentGet().filter(x => x !== u)); toast('已从这台电脑上移除'); } });
document.addEventListener('input', e => { if (e.target.dataset.lacc != null) S.login.acc = e.target.value; });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset.lacc != null) { ACT.lgSsoGo(); render(); } });

/* ---------- 设置：危机词库由心理中心维护；危机期间恢复冻结的谈心要不要上级批准（决定 2、4） ---------- */
const cwPage = () => { const ed = S.role === 'L3';
  return `<p class="intro">${I('info', 's')}谈话记录、追加内容里出现这些词，保存时自动报告紧急情况（草稿只提醒，不报告）。词库由心理中心负责人、高级咨询师维护，改动记入操作记录。</p>
    <div class="card"><h3>危机词库（${CRISIS_WORDS.length}）</h3><div class="chips cwl">${CRISIS_WORDS.map((w, i) => `<span class="chip">${esc(w)}${ed ? `<button class="lnk" data-act="cwDel" data-arg="${i}" title="删除">×</button>` : ''}</span>`).join('')}</div>
      ${ed ? `<div class="filters" style="margin-top:10px"><input class="in" style="width:220px" data-bind="form.cw" placeholder="加一个词，例如：撑不下去" value="${esc(S.form.cw || '')}"><button class="btn sec xs" data-act="cwAdd">添加</button></div>` : '<p class="note">只有心理中心负责人、高级咨询师可以修改。</p>'}</div>
    <div class="card"><h3>危机期间的谈心</h3><div class="prow"><span>恢复冻结的谈心要上级批准<small>学生进危机通道后，谈心事项和邀约自动冻结。老师申请恢复时，开着就要中心负责人或高级咨询师批准；关掉就直接恢复。</small></span><span class="sw ${RULES.unfzAppr ? 'on' : ''} ${ed ? '' : 'lk'}" ${ed ? 'data-act="unfzT"' : ''}></span></div></div>`; };
Object.assign(ACT, {
  cwAdd() { const w = (S.form.cw || '').trim(); if (!w) return toast('请写一个词'); if (w.length < 2) return toast('至少两个字，太短容易误报'); if (CRISIS_WORDS.includes(w)) return toast('词库里已经有了');
    CRISIS_WORDS.push(w); S.form.cw = ''; log(`危机词库 · 添加「${w}」`, null, { cat: '配置', obj: '危机词库' }); toast('已添加，之后保存的记录按新词库检测'); },
  cwDel(i) { const w = CRISIS_WORDS[+i]; if (CRISIS_WORDS.length <= 1) return toast('词库至少保留一个词'); CRISIS_WORDS.splice(+i, 1); log(`危机词库 · 删除「${w}」`, null, { cat: '配置', obj: '危机词库' }); toast('已删除'); },
  unfzT() { RULES.unfzAppr = !RULES.unfzAppr; log(`危机期间恢复冻结的谈心：${RULES.unfzAppr ? '要上级批准' : '不用审批'}`, null, { cat: '配置', obj: '角色与权限' }); toast('已生效，已记入操作记录'); } });
const _st16 = settings; settings = function () { const can = isAdm() || S.role === 'L3';
  if (S.tabs.settings === 'cwords' && can) { S.tabs.settings = 'audit'; let h; try { h = _st16(); } finally { S.tabs.settings = 'cwords'; }
    h = h.replace('class="on" data-act="settab" data-arg="audit"', 'class="" data-act="settab" data-arg="audit"'); const t = h.indexOf('<div class="tabs">'), e = h.indexOf('</div>', t) + 6;
    return h.slice(0, e).replace('<button class="" data-act="settab" data-arg="audit">', '<button class="on" data-act="settab" data-arg="cwords">危机词库</button><button class="" data-act="settab" data-arg="audit">') + cwPage() + '</div>'; }
  let h = _st16(); if (can) h = h.replace(/(<button class="[^"]*" data-act="settab" data-arg="audit">)/, '<button class="" data-act="settab" data-arg="cwords">危机词库</button>$1');
  return h; };
PAGES.settings = settings;

/* ---------- 宣传海报（U11）：加 3 张纯色底图；文字放进白色卡片，排版重做；辅导员也能换底图、改字、换 logo，二维码固定 ---------- */
PTPL.push({ n: '纯色 · 暖米', solid: ['#fbf3e3', '#f1dcb2'], ink: '#5c4a1f', acc: '#d9902c', masc: 1 }, { n: '纯色 · 薄荷', solid: ['#eef6f2', '#cfe5da'], ink: '#1f3d35', acc: '#3d8a6c', masc: 1 }, { n: '纯色 · 雾蓝', solid: ['#eef1fb', '#d3daf3'], ink: '#26306a', acc: '#5464c8', masc: 0 });
POSTER_TPL.length = 0; PTPL.forEach(t => POSTER_TPL.push([t.n, ...(t.solid || ['#fbf3e3', '#f3dfb8']), t.ink || PINK, t.acc || PACC]));    // 旧代码按下标取模板名，和新列表对齐
const pZone2 = P => { const T = PTPL[P.tpl] || PTPL[0]; return P.bg ? (P.zone || 'b') : T.solid ? 'c' : T.zone; };
/* logo 位置冲突：压到小屿的位置、两个 logo 同一位置，都挪到空着的位置 */
const logoPos = P => { const no = P.bg ? [] : ((PTPL[P.tpl] || {}).no || []), used = [], r = {};
  Object.entries(P.logos || {}).forEach(([kk, L]) => { if (!L || !L.src) return; let p = L.pos || logoDef(P, kk); if (no.includes(p) || used.includes(p)) p = LOGO_POS.map(q => q[0]).find(q => !no.includes(q) && !used.includes(q)) || p; used.push(p); r[kk] = p; }); return r; };
const fixLogos = P => { const r = logoPos(P); Object.entries(r).forEach(([kk, p]) => { P.logos[kk].pos = p; }); };
drawPoster = function (P, w = 600) {
  const h = w * 1.5, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'), k = w / 600, T = PTPL[P.tpl] || PTPL[0], zone = pZone2(P), ink = (!P.bg && T.ink) || PINK, acc = (!P.bg && T.acc) || PACC;
  const F = (wt, sz) => `${wt} ${sz * k}px -apple-system,"PingFang SC","Microsoft YaHei","Helvetica Neue",sans-serif`;
  const rr = (X, Y, W, H, r) => { x.beginPath(); if (x.roundRect) x.roundRect(X * k, Y * k, W * k, H * k, r * k); else x.rect(X * k, Y * k, W * k, H * k); };
  if (!P.bg && T.solid) { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, T.solid[0]); g.addColorStop(1, T.solid[1]); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalAlpha = .18; x.fillStyle = acc; x.beginPath(); x.arc(540 * k, 70 * k, 150 * k, 0, 7); x.fill(); x.beginPath(); x.arc(40 * k, 880 * k, 120 * k, 0, 7); x.fill(); x.globalAlpha = 1; }
  else { x.fillStyle = '#fbf3e3'; x.fillRect(0, 0, w, h); const bg = img(P.bg || POSTER_BG[P.tpl]); if (bg.complete && bg.naturalWidth) { const r = Math.max(w / bg.naturalWidth, h / bg.naturalHeight); x.drawImage(bg, (w - bg.naturalWidth * r) / 2, (h - bg.naturalHeight * r) / 2, bg.naturalWidth * r, bg.naturalHeight * r); } }
  const txt = (s, y, wt, sz, o = {}) => { if (!s) return; let z = sz; x.font = F(wt, z); while (z > 9 && x.measureText(s).width > (o.mw || 480) * k) { z -= .5; x.font = F(wt, z); }
    x.globalAlpha = o.a ?? 1; x.fillStyle = o.c || ink; x.textAlign = o.al || 'center'; x.fillText(s, (o.x ?? 300) * k, y * k); x.globalAlpha = 1; };
  const wrap = (s, wt, sz, mw, max) => { x.font = F(wt, sz); const ln = ['']; [...(s || '')].forEach(c => { if (x.measureText(ln[ln.length - 1] + c).width > mw * k) ln.push(''); ln[ln.length - 1] += c; }); return ln.filter(Boolean).slice(0, max); };
  const card = (X, Y, W, H, a = .92) => { x.save(); x.shadowColor = 'rgba(60,40,10,.12)'; x.shadowBlur = 18 * k; x.globalAlpha = a; x.fillStyle = '#fff'; rr(X, Y, W, H, 22); x.fill(); x.restore(); };
  const pill = y => { if (!P.due) return; x.font = F(600, 16); const bw = Math.max(150 * k, x.measureText(P.due).width + 40 * k); x.fillStyle = acc; x.beginPath(); if (x.roundRect) x.roundRect(w / 2 - bw / 2, y * k, bw, 34 * k, 17 * k); else x.rect(w / 2 - bw / 2, y * k, bw, 34 * k); x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(P.due, w / 2, (y + 23) * k); };
  if (zone === 'b') {
    card(36, 496, 528, 352);
    txt(P.org, 528, 600, 15, { a: .7 }); txt(P.title, 570, 700, 34); txt(P.titleEn, 597, 500, 16, { a: .78 }); txt(P.sub, 627, 400, 17, { mw: 470 }); pill(640);
    x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(64 * k, 690 * k, 472 * k, 1 * k);
    fakeQR(x, 72 * k, 708 * k, 76 * k, 7); txt(PFIX.cap, 732, 600, 15, { al: 'left', x: 172, mw: 360 });
    wrap(P.contact, 400, 12.5, 360, 2).forEach((l, i) => txt(l, 754 + i * 17, 400, 12.5, { al: 'left', x: 172, a: .78, mw: 360 }));
    txt(PFIX.foot, 836, 400, 11, { a: .62 });
  } else if (zone === 't') {
    card(36, 92, 528, 270);
    txt(P.org, 126, 600, 15, { a: .7 }); txt(P.title, 170, 700, 34); txt(P.titleEn, 197, 500, 16, { a: .78 }); txt(P.sub, 228, 400, 17, { mw: 470 }); pill(244);
    wrap(P.contact, 400, 13, 460, 2).forEach((l, i) => txt(l, 310 + i * 18, 400, 13, { a: .78 }));
    const qx = (T.qr === 'l' || (P.bg && T.qr !== 'r')) ? 40 : 600 - 40 - 132; card(qx, 640, 132, 172, .95); fakeQR(x, (qx + 22) * k, 660 * k, 88 * k, 7);
    wrap(PFIX.cap, 600, 12, 116, 2).forEach((l, i) => txt(l, 782 + i * 16, 600, 12, { x: qx + 66, mw: 120 }));
    x.save(); x.font = F(400, 11); const fw = x.measureText(PFIX.foot).width + 28 * k; x.globalAlpha = .82; x.fillStyle = '#fff'; x.beginPath(); if (x.roundRect) x.roundRect(w / 2 - fw / 2, 820 * k, fw, 22 * k, 11 * k); else x.rect(w / 2 - fw / 2, 820 * k, fw, 22 * k); x.fill(); x.restore(); txt(PFIX.foot, 835, 400, 11, { a: .75 });
  } else {
    txt(P.org, 190, 600, 16, { a: .7 }); txt(P.title, 250, 700, 42, { mw: 500 }); txt(P.titleEn, 288, 500, 17, { a: .78 }); txt(P.sub, 330, 400, 18, { mw: 500 }); pill(350);
    wrap(P.contact, 400, 13, 440, 2).forEach((l, i) => txt(l, 428 + i * 18, 400, 13, { a: .75 }));
    card(222, 486, 156, 178, .96); fakeQR(x, 248 * k, 508 * k, 104 * k, 7); txt(PFIX.cap, 700, 600, 15, { mw: 420 });
    if (T.masc) { const m = img(MASCOT_FULL); if (m.complete && m.naturalWidth) { const mh = 132, mw = m.naturalWidth / m.naturalHeight * mh; x.drawImage(m, (560 - mw) * k, 690 * k, mw * k, mh * k); } }
    txt(PFIX.foot, 836, 400, 11, { a: .65 });
  }
  const pos = logoPos(P);
  Object.entries(P.logos || {}).forEach(([kk, L]) => { if (!L || !L.src || !pos[kk]) return; const im = img(L.src); if (!im.complete) return; const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height; if (!iw || !ih) return;
    const p = pos[kk], mh = (p === 'bc' ? (zone === 'b' ? 30 : 40) : 54) * k, mw = 180 * k, r = Math.min(mh / ih, mw / iw), lw = iw * r, lh = ih * r;
    const lx = p === 'tl' ? 28 * k : p === 'tr' ? w - 28 * k - lw : w / 2 - lw / 2, ly = p === 'bc' ? (zone === 'b' ? 820 : 818) * k - lh : 24 * k; x.drawImage(im, lx, ly, lw, lh); });
  return cv; };
const tplThumb = (t, i) => t.solid ? `<i class="psolid" style="background:linear-gradient(${t.solid[0]},${t.solid[1]})">${t.masc ? `<img src="${MASCOT_FULL}" alt="">` : ''}</i>` : `<img src="${POSTER_BG[i]}" alt="">`;
posterBox = function (id) { const P = posterOf(id), cv = drawPoster(P, S.pzoom ? 450 : 300), l1 = String(id).startsWith('l1~');
  const tb = (t, i) => `<button class="${P.tpl === i && !P.bg ? 'on' : ''}" data-act="pTpl" data-arg="${id}|${i}" title="${t.n}">${tplThumb(t, i)}<span>${t.n}</span></button>`;
  return `<div class="ov" data-act="ovClose"><div class="mo wide pmo"><h3>${l1 ? '下载宣传海报' : '宣传海报'}</h3><p>${l1 ? '这是你自己的一份：可以换底图、改文字、换 logo，改动只对你下载的这张生效，不影响中心的原版。二维码固定不能改。' : '全校统一一张，随辅导员转发包一起发出。辅导员下载前可以自己换底图、改文字、换 logo；二维码固定不能改。'}</p>
  <div class="poster"><div class="pprev"><img class="${S.pzoom ? 'big' : ''}" src="${cv.toDataURL()}" alt="海报预览" data-act="pZoom" title="点图${S.pzoom ? '缩小' : '放大'}"><small class="note">成品 900 × 1350 像素 · 点图${S.pzoom ? '缩小' : '放大'}</small></div><div class="pform">
    <div class="fld"><label>底图<small>照片底图 6 张、纯色 3 张</small></label><div class="ptpls ph">${PTPL.map((t, i) => t.solid ? '' : tb(t, i)).join('')}</div><div class="ptpls so">${PTPL.map((t, i) => t.solid ? tb(t, i) : '').join('')}</div>
      <div style="margin-top:6px"><label class="btn sec xs">上传自己的底图<input type="file" accept="image/*" data-pid="${id}" class="pbg" hidden></label>${P.bg ? ` 文字区：<select data-pzone="${id}"><option value="b" ${pZone2(P) === 'b' ? 'selected' : ''}>下方</option><option value="t" ${pZone2(P) === 't' ? 'selected' : ''}>上方</option></select> <button class="lnk" data-act="pBgClr" data-arg="${id}">换回模板底图</button>` : ''}</div></div>
    ${PFIELD.map(([f, n, m]) => `<div class="fld"><label>${n}${pCnt(id, f, m)}</label><input class="in" style="width:100%" maxlength="${m}" data-pbind="${id}|${f}" data-max="${m}" value="${esc(P[f] || '')}"></div>`).join('')}
    <p class="note">二维码、二维码说明「${PFIX.cap}」和底部小字「${PFIX.foot}」固定，不能改。文字放在白色卡片里，位置按底图固定。</p>
    <div class="fld"><label>logo<small>PNG / JPG / SVG，2 MB 以内；只能放左上、右上、底部居中</small></label>${LOGO_K.map(([kk, n]) => logoRow(id, P, kk, n)).join('')}</div>
    ${l1 ? `<button class="lnk" data-act="pL1Reset" data-arg="${id}">恢复成中心的版本</button>` : ''}
  </div></div><div class="acts pacts"><button class="btn sec" data-act="moClose">关闭</button><button class="btn pri" data-act="posterDl" data-arg="${id}">下载海报 PNG</button></div></div></div>`; };
ACT.pZoom = () => { S.pzoom = !S.pzoom; };
const _ptpl16 = ACT.pTpl; ACT.pTpl = function (a) { _ptpl16(a); const [id] = a.split('|'); fixLogos(posterOf(id)); };
const _pdl16 = ACT.posterDl; ACT.posterDl = function (id) { if (!String(id).startsWith('l1~')) return _pdl16(id); const P = posterOf(id), cv = drawPoster(P, 900);
  try { const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = '灵屿-宣传海报.png'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {}
  log(`下载宣传海报（辅导员自己的版本，${P.bg ? '自己的底图' : PTPL[P.tpl].n}）`, null, { cat: '配置', obj: '宣传素材' }); toast('已下载海报'); };
ACT.pL1Reset = id => { delete (S.l1p || {})[me() + '~' + id.slice(3)]; toast('已恢复成中心的版本'); };
const _mo16p = ACT.mo; ACT.mo = function (a) { const [k, id] = a.split(':'); if (k === 'posterL1') return _mo16p(`poster:l1~${id}`); return _mo16p.apply(this, arguments); };

/* ---------- 谈话记录页排版（U2）：按「必填 / 谈了什么 / 后续 / 分享和同步」分成几块，保存按钮固定在顶上 ---------- */
const _rp16 = recPage; recPage = function () { const h = _rp16(); return h.replace(/(<h4>[\s\S]*?)(?=<h4>|<div class="crumb" style="border:0)/g, '<section class="rsec">$1</section>'); };
