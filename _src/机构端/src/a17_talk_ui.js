/* =====================================================================
   v1.14 · 谈心页面：待谈心 / 已约 / 谈心记录；中心另有「谈心任务总览」「回传的记录」
===================================================================== */
const TYPES = ['学业', '人际', '家庭', '心理健康', '经济', '身体', '其他'];
const WHO = ['本人', '家长', '室友或同学', '导师', '其他'];
const RESULTS = ['已谈', '学生未到', '联系不上', '只和第三方谈了'];
const NEXTS = { '不需要': 0, '1 周后': 7, '2 周后': 14, '1 个月后': 30 };
const tkId = t => 'TK-' + String(TALKS.indexOf(t) + 1).padStart(4, '0');
/* 我能在谈心页看到的学生：辅导员看管理范围；任课老师只看派给自己的；中心老师看全部 */
const tkScope = s => S.role === 'L1' ? inScope(s) || myItems().some(x => x.sid === s.id) : isT() ? myItems().some(x => x.sid === s.id) : isCenter();
const recent = (s, u = me()) => TALKS.some(t => !t.draft && t.by === u && (t.sids || [t.sid]).includes(s.id) && (NOW - t.at) / 864e5 <= 30);
const pillSt = x => x.pend ? `<span class="pill w" title="${HINT.moveWait}">等中心确认转派</span>` : x.st === 'reported' ? `<span class="pill w">${(XF.find(f => f.id === x.rep) || {}).st === 'recv' ? '已上报 · 中心已接收' : '已上报 · 等待接收'}</span>`
  : x.st === 'frozen' ? '<span class="pill r" title="学生进入危机通道，期限暂停，由危机负责人决定恢复或取消">已冻结</span>' : x.st !== 'open' ? `<span class="pill">${IST[x.st]}</span>` : !itDue(x) ? `<span class="pill">未到期 · ${fmt(x.startAt).split(' ')[0]} 起</span>` : itOver(x) ? `<span class="due r">已超期 ${Math.max(1, Math.floor((NOW - x.due) / 864e5))} 天</span>` : `<span class="pill p">${IST[x.st]}</span>`;
const stuTags = (s, L) => { const t = [];
  if (recent(s)) t.push('<span class="pill g">最近谈过</span>');
  if (L.some(x => (x.moved.length && x.moved[x.moved.length - 1].to === me() && hrs(x.moved[x.moved.length - 1].at) < 48) || hrs(x.at) < 24)) t.push('<span class="pill p">新分给你</span>');
  if (INV.some(v => v.sid === s.id && v.by === me() && v.st === 'wait' && v.d === 'ok')) t.push('<span class="pill w">学生没回复</span>');
  if (INV.some(v => v.sid === s.id && v.by === me() && v.st === 'no' && hrs(v.repAt) < 24 * 7)) t.push('<span class="pill">学生不想谈</span>');
  if (s.l2take) t.push('<span class="pill">中心在跟进</span>');
  return t.join(' '); };

/* ---------- 待谈心 ---------- */
function tkTodo() { const L = myItems(), sids = [...new Set(L.map(x => x.sid))].map(SU), x0 = S.tkx || {};
  const ov1 = L.filter(x => itOver(x) && !INV.some(v => v.id === x.inv && ['wait', 'expired'].includes(v.st))).length, ov2 = L.filter(x => itOver(x) && INV.some(v => v.id === x.inv && (['wait', 'expired'].includes(v.st) || v.d !== 'ok'))).length;
  const tell = TELL.filter(t => t.by === me() && t.st === 'open'), ho = (S.ho || {})[me()];
  const rows = sids.sort((a, b) => Math.min(...L.filter(x => x.sid === a.id).map(x => +x.due)) - Math.min(...L.filter(x => x.sid === b.id).map(x => +x.due))).map(s => { const its = L.filter(x => x.sid === s.id), due = its.filter(itDue), first = (due.length ? due : its).reduce((a, b) => a.due < b.due ? a : b), open = !!x0[s.id], fz = its.every(x => x.st === 'frozen');
    return `<tr class="hov ${its.some(itOver) ? 'crit' : ''}" data-act="tkX" data-arg="${s.id}"><td><b>${s.name}</b><small>${s.sid}</small></td><td>${s.college}<small>${s.year}</small></td><td>${lvT(s)}</td><td>${itDue(first) ? fmt(first.due) : '未到期'}<small>${its.length} 个事项</small></td><td>${stuTags(s, its)}</td>
      <td class="tkacts">${fz ? '<button class="btn sec xs dis" data-act="hint" data-arg="frz" title="学生在危机通道里，邀约先暂停">发邀约</button>' : `<button class="btn sec xs" data-act="mo" data-arg="tkInv:${s.id}">发邀约</button>`}<button class="btn pri xs" data-act="tkNew" data-arg="${s.id}">写记录</button><button class="btn ghost xs" data-act="mo" data-arg="tkRep:${s.id}">上报中心</button><button class="btn ghost xs" data-act="mo" data-arg="tkMove:${s.id}">转给其他老师</button>${hintQ('noDel')}</td></tr>
      ${open ? `<tr class="tksub"><td colspan="6">${its.map(x => `<div class="tkit"><span class="pill">${ISRC[x.src]}</span><span class="grow">${esc(itWhy(x))}${x.src === 'center' && x.by ? `<small>${ST(x.by).name} 发起</small>` : ''}${x.backNote ? `<small class="warn">中心退回：${esc(x.backNote)}</small>` : ''}${x.inv ? `<small>已发邀约 · ${VST[(INV.find(v => v.id === x.inv) || {}).st] || ''}</small>` : ''}</span><span>期限 ${fmt(x.due).split(' ')[0]}</span>${pillSt(x)}${x.st === 'frozen' ? (x.unfzAsk ? '<small class="note">已申请恢复，等上级批准</small>' : `<button class="btn ghost xs" data-act="mo" data-arg="tkUnfz:${x.id}">申请恢复</button>`) : ''}</div>`).join('')}</td></tr>` : ''}`; }).join('');
  return `${tell.length ? `<div class="dbox warnbox"><b>中心的决定，需要你告诉学生（${tell.length}）</b>${tell.map(t => { const v = INV.find(x => x.id === t.inv), s = SU(v.sid); return `<p class="tkline">${s.name} · 原定 ${ivTime(v)} · 中心决定<b>${t.dec === '重新约' ? '重新约时间（原定时间在危机期间已过）' : t.dec === '恢复' ? '照常见面' : '这次先不见'}</b><span class="sp"></span><button class="btn sec xs" data-act="tkTell" data-arg="${t.id}|已通知">已通知学生</button><button class="btn ghost xs" data-act="tkTell" data-arg="${t.id}|没联系上">没联系上</button></p>`; }).join('')}<p class="note">请你自己联系学生，不要提危机相关的内容；系统不会替你通知学生。</p></div>` : ''}
    ${ho ? `<div class="dbox"><b>交接清单 · 从 ${ST(ho.from).name} 移交给你</b><p class="note" style="margin:4px 0 0">待谈心 ${ho.items} 个、已约 ${ho.inv} 个、草稿 ${ho.drafts} 条、分享出去的记录 ${ho.shares} 条。已约的邀约请在「已约」里选保留或改期。</p></div>` : ''}
    ${L.length ? `<p class="note tkov">超期：辅导员未处理 <b>${ov1}</b> · 学生未回应 / 送达失败 <b>${ov2}</b></p>` : ''}
    ${rows ? `<table class="t tkt"><tr><th>学生</th><th>学院 · 年级</th><th>关注等级</th><th>最早到期</th><th>标签</th><th></th></tr>${rows}</table><p class="note">点一行展开看每个事项。任务不能删除：自己谈、上报中心、转给其他老师三选一。</p>` : `<div class="empty"><img src="${MASCOT}" alt="">现在没有要谈的学生</div>`}`; }

/* ---------- 已约 ---------- */
function tkInvTab() { const L = INV.filter(v => v.by === me() && !['cancel', 'done'].includes(v.st) && !(v.st === 'no' && hrs(v.repAt) > 24 * 7)), fill = L.filter(ivFill), rest = L.filter(v => !ivFill(v)), ho = rest.filter(v => v.ho);
  const row = v => { const s = SU(v.sid), soon = ['wait', 'wait2'].includes(v.st) && v.start > NOW && (v.start - NOW) / H < 24;
    return `<tr class="${soon ? 'crit' : ''}"><td><b>${s.name}</b><small>${s.college}</small></td><td>${ivTime(v)}${soon ? '<small class="warn">见面前 24 小时还没回复，请先联系学生</small>' : ''}</td><td>${v.mode}${v.mode === '面对面' ? `<small>${v.place}</small>` : ''}</td>
      <td><span class="pill ${v.st === 'ok' ? 'g' : ['no', 'expired', 'frozen'].includes(v.st) ? 'r' : 'w'}">${VST[v.st]}</span>${v.d !== 'ok' ? `<small class="warn">${v.d === 'fail' ? '送达失败' : '已退订'}（不是没回复）</small>` : ''}${v.st === 'change' ? `<small>学生可以：${v.slots.map(x => `${x.day} ${x.part}`).join('、')}${v.why ? `；${esc(v.why)}` : ''}</small>` : ''}</td>
      <td>${v.items.length} 个事项</td><td>${v.st === 'frozen' ? (v.unfzAsk ? '<small class="note">已申请恢复，等上级批准</small>' : `<button class="btn ghost xs" data-act="mo" data-arg="tkUnfz:${v.id}">申请恢复</button>`) : v.ho ? `<button class="btn pri xs" data-act="tkHo" data-arg="${v.id}|keep">保留</button><button class="btn ghost xs" data-act="mo" data-arg="tkInvEdit:${v.id}">改期</button>` : ['no', 'expired'].includes(v.st) ? '' : `<button class="btn sec xs" data-act="mo" data-arg="tkInvEdit:${v.id}">${v.st === 'change' ? '提新时间' : '改时间'}</button><button class="btn ghost xs" data-act="tkInvCancel" data-arg="${v.id}">取消</button>`}${['ok', 'wait', 'wait2'].includes(v.st) ? `<button class="btn ghost xs" data-act="tkNew" data-arg="${v.sid}|${v.id}">写记录</button>` : ''}${['wait', 'wait2'].includes(v.st) && v.d === 'ok' ? `<button class="zap" data-act="mo" data-arg="tkStuSim:${v.id}">⚡ 学生回复</button>` : ''}</td></tr>`; };
  return `${fill.length ? `<div class="dbox warnbox"><b>待补记录（${fill.length}）</b><p class="note" style="margin:2px 0 6px">约定时间过了还没写记录。选一个结果，不会直接回到「待谈心」：</p>${fill.map(v => `<p class="tkline">${SU(v.sid).name} · ${ivTime(v)}<span class="sp"></span>${['已谈待记录', '学生未到', '老师取消', '联系不上'].map(r => `<button class="btn ${r === '已谈待记录' ? 'pri' : 'ghost'} xs" data-act="tkFill" data-arg="${v.id}|${r}">${r}</button>`).join('')}</p>`).join('')}
      <p class="note">学生未到、联系不上：事项回到待谈心，计一次「未回应」；老师取消：回到待谈心，不计次。连续 2 次未回应，交给中心。</p></div>` : ''}
    ${ho.length ? `<p class="note warn">有 ${ho.length} 个邀约随任务移交给你，请选择保留或改期。保留的，学生会收到一条更新，写明新老师的名字。</p>` : ''}
    ${rest.length ? `<table class="t"><tr><th>学生</th><th>时间</th><th>方式</th><th>状态</th><th>关联</th><th style="width:240px"></th></tr>${rest.sort((a, b) => a.start - b.start).map(row).join('')}</table>` : `<div class="empty"><img src="${MASCOT}" alt="">还没有约好的谈心</div>`}
    <p class="note">系统不会自动通知学生，点「发邀约」才会发出。「送达失败 / 已退订」和「没回复」分开显示。</p>`; }

/* ---------- 谈心记录 ---------- */
const recLocked = t => (NOW - t.savedAt) / H >= 24 && !t.corrOk;
const recStatus = t => t.draft ? '<span class="pill w">草稿 · 不完成任务</span>' : recLocked(t) ? '<span class="pill">已锁定 · 只能追加</span>' : `<span class="pill g">${Math.max(1, Math.ceil(24 - (NOW - t.savedAt) / H))} 小时内可改</span>`;
function tkRecs() { const q = (S.f.tq || '').trim(), mine = TALKS.filter(t => recOwner(t)), shared = TALKS.filter(t => !recOwner(t) && (recVis(t) && recVis(t) !== 'full' || expiredShare(t)) && !t.draft);
  const hit = t => !q || (t.sids || [t.sid]).some(id => SU(id).name.includes(q) || SU(id).sid.includes(q));
  const names = t => (t.sids || [t.sid]).map(id => SU(id).name).join('、');
  const mineH = mine.filter(hit).sort((a, b) => b.at - a.at).map(t => `<tr><td>${fmt(t.at)}<small>${tkId(t)}</small></td><td><b>${names(t)}</b><small>${SU(t.sid).college}</small></td><td>${t.mode}${t.place && t.mode === '面对面' ? `<small>${t.place}</small>` : ''}</td><td>${t.result}${(t.sids || []).length > 1 ? '<small>多人谈话</small>' : ''}</td><td class="tkpts">${esc((t.situ || '').slice(0, 60))}${(t.situ || '').length > 60 ? '…' : ''}${t.risk ? `<small class="tkrisk">${I('alert', 's')}含安全相关内容 · 已报告（按命中等级处理）</small>` : ''}</td>
    <td>${recStatus(t)}${(t.shares || []).filter(shareOn).length ? `<small>分享给 ${(t.shares || []).filter(shareOn).length} 人</small>` : ''}${t.forced ? '<small>回传中心</small>' : ''}${t.sis ? '<small>同步 SIS（占位）</small>' : ''}</td>
    <td><button class="btn ghost xs" data-act="tkView" data-arg="${t.id}">查看</button>${t.draft ? `<button class="btn sec xs" data-act="tkEdit" data-arg="${t.id}">接着写</button>` : recLocked(t) ? `${hintB('修改', 'lock')}<button class="btn ghost xs" data-act="mo" data-arg="tkAdd:${t.id}">追加</button>${t.corrAsk ? '<small class="note">已申请更正</small>' : `<button class="btn ghost xs" data-act="mo" data-arg="tkCorr:${t.id}">申请更正</button>`}` : `<button class="btn sec xs" data-act="tkEdit" data-arg="${t.id}">修改</button>`}</td></tr>`).join('');
  const shH = shared.filter(hit).map(t => { const ex = !recVis(t), sh = (t.shares || []).find(x => x.to === me()); return `<tr><td>${fmt(t.at)}<small>${tkId(t)}</small></td><td><b>${names(t)}</b></td><td>${ST(t.by).name}<small>${tagOf(t.by)}</small></td><td>${ex ? `<span class="pill" title="${HINT.exp}">已过期</span>` : `${fmt(sh.exp).split(' ')[0]} 前可看`}</td><td>${ex ? hintB('查看', 'exp') : `<button class="btn ghost xs" data-act="tkView" data-arg="${t.id}">查看</button>`}<button class="btn ghost xs" data-act="mo" data-arg="tkContact:${t.id}">联系分享人</button></td></tr>`; }).join('');
  return `<div class="filters"><input class="in" style="width:220px" data-bind="f.tq" data-rerender placeholder="搜索学生姓名或学号" value="${esc(q)}">${isT() && !myItems().length ? '' : `<button class="btn pri xs" data-act="tkNew" data-arg="">${I('plus', 's')}新建记录</button>`}<span class="sp"></span>${mine.length ? `<button class="btn sec xs" data-act="mo" data-arg="tkExport:">${I('dl', 's')}导出我写的</button>` : ''}</div>
    ${isT() && !mine.length ? '' : `<h4 class="qsub">我写的（${mine.length}）</h4>${mineH ? `<table class="t"><tr><th>谈话时间</th><th>学生</th><th>方式</th><th>结果</th><th>学生的情况</th><th>状态</th><th style="width:220px"></th></tr>${mineH}</table>` : '<p class="note">没有符合条件的记录</p>'}`}
    <h4 class="qsub">分享给我的（${shared.length}）</h4>${shH ? `<table class="t"><tr><th>谈话时间</th><th>学生</th><th>写的人</th><th>有效期</th><th style="width:200px"></th></tr>${shH}</table>` : '<p class="note">还没有别人分享给你的记录</p>'}
    <p class="note">记录默认只有写的人能看。分享时勾选对方能看哪些内容和有效期；中心派的任务、命中危机词、勾了「希望中心介入」的记录会回传中心，不能移除。</p>`; }

/* ---------- 页面 ---------- */
function talkPage() { if (S.rec) return recPage(); if (S.rv) return recView();
  const T0 = isT() && !myItems().length && !TELL.some(t => t.by === me() && t.st === 'open') && !INV.some(v => v.by === me()), tabs = T0 ? [['recs', '谈心记录']] : [['todo', `待谈心（${new Set(myItems().map(x => x.sid)).size}）`], ['inv', `已约（${INV.filter(v => v.by === me() && ['wait', 'wait2', 'ok', 'change'].includes(v.st)).length}）`], ['recs', '谈心记录']];
  if (canDispatch()) tabs.push(['all', '谈心任务总览']); if (S.role === 'L3') tabs.push(['back', '回传的记录']);
  let tab = S.tabs.talk || tabs[0][0]; if (!tabs.some(t => t[0] === tab)) tab = tabs[0][0];
  const body = { todo: tkTodo, inv: tkInvTab, recs: tkRecs, all: tkAll, back: tkBack }[tab]();
  const sub = isT() ? '只看得到派给你的学生和分享给你的记录' : S.role === 'L1' ? `你的管理范围：${scopeTxt()}` : '谁收到任务谁就谈';
  return `<div class="card"><h3>${I('chat')}谈心${pageQ()}<span class="sp"></span><small>${sub}</small></h3><div class="tabs">${tabs.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-act="tktab" data-arg="${k}">${n}</button>`).join('')}</div>${body}</div>`; }
PAGES.talk = talkPage;
