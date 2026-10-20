/* ---------- 外壳 ---------- */
const MENUS = {
  L3: [['home', '工作台', 'home'], ['crisis', '危机通道', 'alert'], ['students', '被测名单', 'users'], ['booking', '咨询预约', 'cal'], ['survey', '施测方案', 'list'], ['data', '数据', 'chart'], ['settings', '规则与审计', 'gear']],
  L2: [['home', '工作台', 'home'], ['crisis', '危机通道', 'alert'], ['students', '被测名单', 'users'], ['booking', '咨询预约', 'cal']],
  L1: [['home', '工作台', 'home'], ['students', '被测名单', 'users']],
  L1s: [['home', '工作台', 'home'], ['students', '被测名单', 'users']],
  ADM: [['home', '工作台', 'home'], ['settings', '设置', 'gear'], ['data', '数据（汇总）', 'chart']],
};
const TITLES = { home: '工作台', crisis: '危机通道', students: '被测名单', booking: '咨询预约', survey: '施测方案', data: '数据', settings: '设置' };
const myNoti = () => NOTI.filter(n => n.to === me());
function shell(body) {
  const cnt = { home: queues().filter(q => q.k !== 'r3pool').reduce((a, q) => a + qCount(q), 0), crisis: crisisNew().length }, un = myNoti().filter(n => !n.read).length;
  return `<aside class="side"><div class="lg"><img src="${MASCOT}" alt=""><div><b>灵 屿</b><small>机构端 · NTU UCC</small></div></div>
    <nav>${MENUS[S.role].map(([k, n, ic]) => `<button class="${S.page === k ? 'on' : ''}" data-act="go" data-arg="${k}">${I(ic)}${k === 'settings' ? (isAdm() ? '设置' : '规则与审计') : n}${k === 'crisis' && cnt.crisis ? `<span class="cnt r">${cnt.crisis}</span>` : k === 'home' && cnt.home ? `<span class="cnt">${cnt.home}</span>` : ''}</button>`).join('')}</nav>
    <div class="who">${photo(me())}<div><b>${ST(me()).name}</b><span>${RN[S.role]}${S.role !== 'ADM' && isAdm() ? ' · 兼系统管理员' : ''}</span></div></div>
    <div class="who-acts"><button data-act="logout">${I('out', 's')}退出</button></div><p class="disc2">仅供校内分级管理参考，不替代临床诊断</p></aside>
  <div class="main"><div class="top"><h1>${TITLES[S.page]}</h1><span class="sp"></span>
    ${S.role === 'ADM' ? '' : `<label class="srch">${I('search', 's')}<input placeholder="${S.role === 'L1s' ? '搜索学生编号' : canName() ? '搜索学生姓名或学号' : '搜索学号后 5 位'}" data-bind="q" value="${esc(S.f.q || '')}"></label>`}
    ${S.role === 'ADM' ? '' : isL1() ? `<button class="btn soft xs" data-act="mo" data-arg="report:">${I('plus', 's')}求助 / 报告</button>` : `<button class="btn soft xs dgr" data-act="mo" data-arg="report:urgent">${I('alert', 's')}报告紧急情况</button>`}
    <button class="bell" data-act="notiT" title="通知">${I('bell')}${un ? `<i>${un}</i>` : ''}</button><span class="pill p">${RN[S.role]}</span></div>
    ${S.noti ? notiPanel() : ''}
    <div class="page" id="pg">${body}</div>${assistPanel()}</div>`;
}
function notiPanel() {
  const all = S.role === 'L3' && S.tabs.noti === 'all', list = (all ? NOTI : myNoti()).slice(0, 30);
  return `<div class="npanel"><div class="nh"><b>通知</b>${S.role === 'L3' ? `<span class="sp"></span><button class="${all ? '' : 'on'}" data-act="notiTab" data-arg="me">发给我的</button><button class="${all ? 'on' : ''}" data-act="notiTab" data-arg="all">全部送达记录</button>` : ''}</div>
    ${list.map(n => `<div class="ni ${n.read || all ? '' : 'un'}"><div>${all ? `<b>${ST(n.to).name}</b> · ` : ''}${esc(n.t)}<small>${fmt(n.at)} · ${n.ch}</small></div><span class="pill ${n.st === '已确认' ? 'g' : n.st === '发送中' ? 'w' : ''}">${n.st}</span></div>`).join('') || '<div class="empty">暂无通知</div>'}
    <p class="note" style="margin:8px 0 0">短信与电话显示送达状态；危机通知在接收后变为「已确认」。</p></div>`;
}

/* ---------- 登录 ---------- */
function loginPage() {
  const L = S.login;
  const cards = Object.entries(ACCTS).map(([u, rs]) => `<button class="acc ${L.uid === u ? 'on' : ''}" data-act="lgPick" data-arg="${u}">${photo(u) || `<span class="av0">${ST(u).name.slice(0, 1)}</span>`}<span><b>${ST(u).name}</b><small>${ST(u).title}</small><small>${RN[rs[0]]}${rs.length > 1 ? ' · 兼系统管理员' : ''}</small></span></button>`).join('');
  let body;
  if (L.step === 0) body = `<h2>登录灵屿机构端</h2><p class="note">使用学校统一身份认证（NTU SSO）登录，再做短信二次验证。</p>
      <button class="btn pri" style="width:100%;height:44px" data-act="lgSSO" ${L.uid ? '' : 'disabled'}>${I('shield', 's')}使用 NTU SSO 登录${L.uid ? `：${ST(L.uid).name}` : ''}</button>
      <p class="note" style="margin:16px 0 8px">演示：先选一个账号</p><div class="accs">${cards}</div>`;
  else if (L.step === 1) body = `<h2>短信验证</h2><p class="note">验证码已发送到 ${ST(L.uid).name} 的手机 +65 8*** **21（演示已自动填入）。</p>
      <div class="code">${'246810'.split('').map(c => `<span>${c}</span>`).join('')}</div><button class="btn pri" style="width:100%;height:44px" data-act="lgCode">验证并继续</button><button class="btn ghost" style="width:100%;margin-top:8px" data-act="lgBack">换个账号</button>`;
  else body = `<h2>选择本次登录的身份</h2><p class="note">${ST(L.uid).name} 兼任两个身份。处理学生和修改配置不在同一会话里，切换身份会记入审计日志。</p>
      ${ACCTS[L.uid].map(r => `<button class="acc" data-act="lgRole" data-arg="${r}"><span class="av0">${I(r === 'ADM' ? 'gear' : 'layers')}</span><span><b>${RN[r]}</b><small>${r === 'ADM' ? '只管配置：分层规则、权限、账号、值班、审计；看不到学生档案' : '处理危机、审批、分配，看全部学生'}</small></span></button>`).join('')}`;
  return `<div class="login"><div class="lbox"><div class="lg2"><img src="${MASCOT}" alt=""><div><b>灵屿 2.0</b><small>校园心理普测与服务协同 · 机构端</small></div></div>${body}
    <p class="note" style="margin-top:18px;text-align:center">空闲 15 分钟自动退出 · 登录、退出、切换身份都记入审计日志</p></div></div>`;
}
function enter(uid, role, how) {
  S.uid = uid; S.role = role; S.page = MENUS[role][0][0]; S.tabs = {}; S.f = {}; S.pg = 1; S.dw = null; S.mo = null; S.noti = false; S.login = { step: 0 }; S.hv = null; S.ai = false; S.chat = []; S.aiq = ''; S.chipsOpen = true; S.hx = {}; S.bexp = {}; S.rec = null; S.rv = null; S.tkx = null; S.tksel = null; S.l1sel = {}; S.srt = {}; S.form = {};
  log(`登录（${how}），身份：${RN[role]}`, null, { cat: '登录' });
}

/* ---------- 工作台 ---------- */
function home() {
  const qs = queues(), r = S.role; let headH = '';
  const firstItem = () => { for (const q of qs) { if (q.items && q.items.length) return [q, byDue(q.items)[0]]; if (q.book && q.book.length) return [q, null]; } return [null, null]; };
  const [q0, it] = firstItem();
  const nextH = q0 ? `<div class="head n">${I('flag', 'l')}<div class="grow"><b>${r === 'L3' && !crisisNew().length ? '危机：没有未接收的 · 下一件事：' : '现在最重要：'}${q0.n} ${qCount(q0)}</b><small>${it ? `${nm(it)}${canLv() ? ' · ' + lvB(curLv(it)) : ''} · ${dueTag(leftOf(it) ?? fLeft(it)) || ''}${why(it, 1) ? ' · ' + esc(why(it, 1)) : ''}` : '处理完后这里会换成下一件事'}</small></div>${it ? `<button class="btn pri" data-act="open" data-arg="${it.id}">打开档案</button>` : `<button class="btn pri" data-act="qtab" data-arg="${q0.k}">去处理</button>`}</div>`
    : `<div class="head n">${I('check', 'l')}<div class="grow"><b>今天的待办都处理完了</b></div></div>`;
  if (r === 'L3') { const ks = crisisNew(), k = ks[0];
    headH = k ? `<div class="head">${I('alert', 'l')}<div class="grow"><b>现在最重要：危机 · 未接收 ${ks.length}${ks.length > 1 ? `（另有 ${ks.length - 1} 条）` : ''}</b><small>${nm(SU(k.sid))} · ${SU(k.sid).college} · ${k.type}</small><small class="whyl">触发：${esc(crisisWhy(k))}</small></div><div style="text-align:right"><div class="cd">${cLeft(k) < 0 ? `已超时 ${dur(cLeft(k))}` : `剩 ${dur(cLeft(k))}`}</div><small>${k.esc >= 2 ? '已二级升级到分管领导' : k.esc ? (k.urgent ? '已追呼值班并升级到中心负责人' : '已升级到中心负责人') : `${dur(kEsc(k)[0] - hrs(kClock(k)))}后升级到中心负责人`}</small></div><button class="btn red" data-act="crisisOpen" data-arg="${k.id}">去处置</button></div>` : ''; }
  const hv = homeView(), htabs = `<div class="tabs htabs"><button class="${hv === 'brief' ? 'on' : ''}" data-act="hview" data-arg="brief">${I('sun', 's')}今日简报</button><button class="${hv === 'work' ? 'on' : ''}" data-act="hview" data-arg="work">${I('layers', 's')}工作台</button><span class="sp"></span><button class="btn ghost xs" data-act="fullT">${S.full ? '收起次要内容' : '一键展开全部'}</button></div>`;
  if (hv === 'brief') return htabs + briefPage();
  if (r === 'ADM') return htabs + approvals() + `<div class="card"><h3>${I('gear')}最近的配置变更</h3><table class="t">${AUDIT.filter(x => x.cat === '配置').slice(0, 8).map(x => `<tr><td>${fmt(x.at)}</td><td>${x.uid === 'sys' ? '系统' : ST(x.uid).name}</td><td>${esc(x.t)}</td></tr>`).join('') || '<tr><td class="note">这次演示中还没有配置变更</td></tr>'}</table><div style="margin-top:10px"><button class="btn sec xs" data-act="setTab" data-arg="audit">看完整审计日志</button></div></div>`;
  headH = htabs + l1Extras() + headH;
  const G = r === 'L2' ? [['g1', '待复核', ['review4', 'up']], ['g2', '确认与抽查', ['batch', 'sample']], ['g3', '联系与预约', ['declined', 'bnew', 'bconfirm']], ['g4', '随访与记录', ['fdue', 'record']], ['g5', '待谈心', ['talk']], ['g6', '转来的', ['xfer']]] : null;
  // v1.13：L3 兼有 L2 时，工作台分两栏：左「我要复核的」（L2 那一套），右「需要我决策的」
  const qCard = (list, title, tk, act, sub) => {
    const tq = G ? G.map(([k, n, ks]) => { const subs = list.filter(x => ks.includes(x.k)); return { k, n, subs, items: subs.flatMap(x => x.items || x.book || []) }; }) : list;
    const want = G && S.tabs[tk] && !tq.some(x => x.k === S.tabs[tk]) ? (tq.find(g => g.subs.some(x => x.k === S.tabs[tk])) || {}).k : S.tabs[tk];
    const tab = want && tq.find(x => x.k === want) ? want : (tq.find(x => qCount(x)) || tq[0]).k, q = tq.find(x => x.k === tab);
    const qBody = q.subs ? q.subs.filter(x => qCount(x) || q.subs.length === 1).map(x => `<h4 class="qsub">${x.n} · ${qCount(x)}</h4>${queueBody(x)}`).join('') || queueBody(q.subs[0]) : queueBody(q);
    const tabsH = `<div class="tabs">${tq.filter(x => S.full || qCount(x) || x.k === tab).map(x => `<button class="${x.k === tab ? 'on' : ''}" data-act="${act}" data-arg="${x.k}">${x.n}<i class="${x.k === 'over' && qCount(x) ? 'r' : ''}">${qCount(x)}</i></button>`).join('')}</div>`;
    return `<div class="card"><h3>${title}<span class="sp"></span><small>${sub}</small></h3>${tabsH}${qBody}</div>`; };
  const sub = isL1() ? '按剩余时限排序 · 处理完自动消失' : '按剩余时限排序';
  if (r === 'L3' && qs.some(x => x.rev)) return headH + overview() + `<div class="grid g2 l3cols">${qCard(qs.filter(x => x.rev), '我要复核的', 'home3', 'qtab3', '复核池里可以领取或分配给 L2')}${qCard(qs.filter(x => !x.rev), '需要我决策的', 'home', 'qtab', sub)}</div>` + team();
  return headH + (r === 'L3' ? overview() : '') + qCard(qs, r === 'L3' ? '需要我决策的' : '我的队列', 'home', 'qtab', sub) + (r === 'L3' ? team() : '');
}
/* 分层概览：每个数字都由数据计算，点进去的名单条件与数字一致 */
function quality() {
  const tl = k => STU.reduce((a, s) => a + s.tl.filter(e => e.k === k).length, 0);
  const keep = tl('l1keep'), up = tl('l1up'), fb = STU.flatMap(s => s.tl.filter(e => e.k === 'fb1' || e.k === 'fb'));
  const confd = STU.flatMap(s => s.tl.filter(e => e.k === 'conf').map(e => s)).filter((s, i, a) => a.indexOf(s) === i);
  const agree = confd.filter(s => s.conf === s.ai).length, samp = STU.flatMap(s => s.tl.filter(e => e.k === 'sample'));
  const rr = recvRate();
  const tot = Object.values(SCHED).flat(2).length, bkd = Object.values(SCHED).flat(2).filter(v => v === 'bk').length, op = Object.values(SCHED).flat(2).filter(v => v === 'open').length;
  return {
    crisis: rr.n ? `按规定时限接收 ${rr.txt}` : '—',
    l1: keep + up ? `上推率 ${Math.round(up / (keep + up) * 100)}%（${up}/${keep + up}）` : '—',
    fb: fb.length ? `「加重」${fb.filter(e => e.t.includes('加重')).length}/${fb.length}` : '—',
    l2: confd.length ? `与 AI 初判一致 ${agree}/${confd.length}` : '本期还没有人工确认',
    samp: samp.length ? `抽查不一致 ${samp.filter(e => e.fail).length}/${samp.length}` : '本期还没有完成的抽查',
    book: `本周 ${tot} 个时段：开放 ${op} · 已约 ${bkd}`,
  };
}
const OVROWS = () => {
  const by = (st, qs) => STU.filter(s => s.stage === st && (!qs || qs.includes(s.queue)));
  const maxW = a => a.length ? dur(Math.max(...a.map(s => hrs(s.since)))) : '—', od = a => a.filter(overdue).length, Q = quality();
  const f1 = STU.filter(s => fdueNow(s) && !s.owner), f2 = STU.filter(s => fdueNow(s) && s.owner);
  return [
    ['危机 · 未接收 / 处置中', `${crisisNew().length} / ${CRISES.filter(c => c.st === 'handling').length}`, crisisNew().length ? dur(Math.max(...crisisNew().map(k => hrs(k.at)))) : '—', crisisNew().filter(k => cLeft(k) < 0).length, Q.crisis, 'crisis:'],
    ['L1 · 待核验', by('L1').length, maxW(by('L1')), od(by('L1')), Q.l1, 'students:L1'],
    ['L1 · 随访到期', f1.length, f1.length ? dur(-Math.min(...f1.map(fLeft))) : '—', f1.filter(s => fLeft(s) < -RULES.lim.fdue).length, Q.fb, 'students:fdue1'],
    ['L2 · 待复核（密切关注 + 上推）', by('L2', ['review4', 'up', 'review3']).length, maxW(by('L2', ['review4', 'up', 'review3'])), od(by('L2', ['review4', 'up', 'review3'])), Q.l2, 'students:L2:review4,up,review3'],
    ['L2 · 批量确认 / 抽查', `${by('L2', ['batch']).length} / ${by('L2', ['sample']).length}`, maxW(by('L2', ['batch', 'sample'])), od(by('L2', ['batch', 'sample'])), Q.samp, 'students:L2:batch,sample'],
    ['L2 · 拒绝 / 未回应邀请', by('L2', ['declined', 'noresp']).length, maxW(by('L2', ['declined', 'noresp'])), od(by('L2', ['declined', 'noresp'])), '—', 'students:L2:declined,noresp'],
    ['L3 · 疑难 / 降级审批', `${by('L3', ['hard']).length} / ${by('L3', ['down']).length}`, maxW(by('L3')), od(by('L3')), '—', 'students:L3'],
    ['负责咨询师 · 随访到期', f2.length, f2.length ? dur(-Math.min(...f2.map(fLeft))) : '—', f2.filter(s => fLeft(s) < -RULES.lim.fdue).length, '—', 'students:fdue2'],
    ['预约 · 待确认 / 待办池', `${BOOK.filter(b => b.st === 'confirm').length} / ${BOOK.filter(b => b.st === 'pool').length}`, '—', BOOK.filter(b => b.st === 'pool').length, Q.book, 'booking:pool']];
};
function overview() {
  return `<div class="card"><h3>${I('layers')}分层概览<span class="sp"></span><small>点任一行，进入与数字一致的名单</small></h3><table class="t"><tr><th>层 · 清单</th><th>待处理</th><th>最久等待</th><th>逾期</th><th>质量（实时计算）</th></tr>${OVROWS().map(r => `<tr class="hov" data-act="drill" data-arg="${r[5]}" data-label="${r[0]}"><td>${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td>${r[3] ? `<span class="due r">${r[3]}</span>` : '0'}</td><td class="note">${r[4]}</td></tr>`).join('')}</table></div>`;
}
/* 团队进展：与每个人自己的队列同一口径（含随访到期、预约、待写记录） */
function team() {
  const ppl = [['u1', 'L1'], ['u2', 'L1'], ['u3', 'L1s'], ['c1', 'L2'], ['c2', 'L2'], ['c3', 'L2'], ['c4', 'L3']];
  const rows = ppl.map(([c, r]) => { const qs = queues(c, r);
    const items = qs.flatMap(q => q.items || []), books = qs.flatMap(q => q.book || []);
    return [c, items.length + books.length, items.filter(s => overdue(s) || fOver(s)).length, books.length, STU.filter(s => s.owner === c).length, STU.filter(s => holder(s) === c && ['L1', 'L2'].includes(s.stage) && overdue(s)).length]; });
  return `<div class="card"><h3>${I('users')}团队进展<span class="sp"></span><small>和每个人自己工作台上的数字一致 · 谁积压就改派给谁</small></h3><table class="t"><tr><th>成员</th><th>待处理（含随访、预约）</th><th>其中超时 / 逾期</th><th>其中预约与记录</th><th>负责学生</th><th></th></tr>${rows.map(r => `<tr><td><div style="display:flex;gap:8px;align-items:center">${photo(r[0])}${ST(r[0]).name}<small style="color:var(--mute2)">${RN[ST(r[0]).role]}${ST(r[0]).role === 'L3' ? '（含 L3 共享的决策队列）' : ''}</small></div></td><td>${r[1]}</td><td>${r[2] ? `<span class="due r">${r[2]}</span>` : 0}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5] && can(9) ? `<button class="btn sec xs" data-act="mo" data-arg="moveAll:${r[0]}">改派超时项</button>` : ''}</td></tr>`).join('')}</table></div>`;
}
function approvals() { const a = APPROVALS;
  return `<div class="card"><h3>${I('inbox')}导出审批</h3>${a.length ? `<table class="t"><tr><th>申请人</th><th>人数</th><th>字段</th><th>用途</th><th>状态</th><th></th></tr>${a.map(x => `<tr><td>${ST(x.by).name}</td><td>${x.n}</td><td>${x.fields.join('、')}</td><td>${esc(x.why)}</td><td>${x.st}</td><td>${x.st === '待批' ? `<button class="btn pri xs" data-act="apOk" data-arg="${x.id}">批准</button>` : ''}</td></tr>`).join('')}</table>` : '<div class="empty">没有导出申请</div>'}</div>`; }
function today() { const bs = BOOK.filter(b => b.cid === me() && b.day === 0 && ['ok', 'confirm'].includes(b.st));
  return `<div class="card"><h3>${I('cal')}今天的咨询 · ${dayLbl(0)}</h3>${bs.map(b => `<div style="display:flex;gap:10px;align-items:center;padding:6px 0">${TIMES[b.t]}<b>${nm(SU(b.sid))}</b>${b.kind} · ${b.mode}<span class="pill ${b.st === 'ok' ? 'g' : 'w'}">${b.st === 'ok' ? '已确认' : '待确认'}</span></div>`).join('') || '<div class="empty">今天没有安排</div>'}</div>`; }

function queueBody(q) {
  if (q.book) return bookTable(q.book);
  const it = byDue(q.items);
  if (!it.length) return `<div class="empty"><img src="${MASCOT}" alt="">这一项都处理完了</div>`;
  if (q.k === 'batch') return batchView(it);
  if (isL1() && q.k === 'pending') return `<table class="t"><tr><th>学生</th><th>约定再了解</th><th>首次进入 · 已等</th><th>延期次数</th><th>最晚期限</th><th></th></tr>${it.map(s => `<tr class="${pendLocked(s) ? 'crit' : ''}"><td><b>${nm(s)}</b><small>${s.college}</small></td><td>${s.next <= NOW ? '<span class="due w">已到时间</span>' : fmt(s.next)}<small>${esc(s.nextKind || '')}</small></td><td>${s.pend ? fmt(s.pend.first) + '<small>已等 ' + dur(hrs(s.pend.first)) + '</small>' : '—'}</td><td>${s.pend ? s.pend.count : 0}</td><td>${s.pend ? fmt(pendMax(s)) : '—'}${pendLocked(s) ? '<small class="due r">请交回中心</small>' : ''}</td><td><button class="btn pri xs" data-act="mo" data-arg="verify:${s.id}">继续了解</button></td></tr>`).join('')}</table>`;
  if (q.k === 'asks') return `<table class="t"><tr><th>学生</th><th>中心请你做什么</th><th>发起人</th><th>期限</th><th>进度</th><th></th></tr>${it.map(s => { const a = openAsk(s); return `<tr class="${a.due < NOW ? 'crit' : ''}"><td><b>${nm(s)}</b><small>${s.college}</small></td><td>${esc(a.what)}${a.note ? `<small>${esc(a.note)}</small>` : ''}</td><td>${ST(a.by).name}</td><td>${a.due < NOW ? `<span class="due r">已过期 ${dur(hrs(a.due))}</span>` : fmt(a.due)}</td><td>${a.st ? `<span class="pill w">${a.st}</span>` : '<span class="pill">未处理</span>'}</td><td><button class="btn pri xs" data-act="mo" data-arg="askDone:${s.id}">更新进度</button></td></tr>`; }).join('')}</table>`;
  if (isL1() && q.k === 'verify') return `<table class="t"><tr><th>学生</th><th>学院 · 年级</th><th>系统提示</th><th>等了多久</th><th>剩余时限</th><th style="width:260px">核实</th></tr>${it.map(s => `<tr class="${overdue(s) ? 'crit' : ''}"><td><b>${nm(s)}</b></td><td>${s.college}<small>${s.year}</small></td><td>${s.quality ? `<span class="pill w">${s.quality}</span>` : '<span class="note">—</span>'}</td><td>${dur(hrs(s.since))}</td><td>${dueTag(leftOf(s))}</td><td><button class="btn pri xs" data-act="mo" data-arg="verify:${s.id}">核实</button>${s.quality ? ` <button class="btn ghost xs" data-act="mo" data-arg="quality:${s.id}">作答质量待核实</button>` : ''}</td></tr>`).join('')}</table><p class="note" style="margin:10px 0 0">${I('lock', 's')} ${S.role === 'L1s' ? '学生委员只看到编号和学院年级。' : '能看到关注等级，看不到分数、报告和对话原文。'}点「核实」打开任务卡：按「这次请你」核实，写下事实和来源；不清楚就选不清楚，不用你做风险判断。</p>`;
  if (q.k === 'fdue') return `<table class="t"><tr><th>学生</th>${isL1() ? '' : '<th>当前等级</th><th>随访周期</th>'}<th>到期情况</th><th>未接通</th><th></th></tr>${it.map(s => `<tr><td><b>${nm(s)}</b><small>${s.college}</small></td>${isL1() ? '' : `<td>${lvV(s)}</td><td>${s.cycle === 1 ? '24 小时' : s.cycle + ' 天'}</td>`}<td>${fdueTag(s)}</td><td>${s.miss ? s.miss + ' 次' : '—'}</td><td><button class="btn pri xs" data-act="mo" data-arg="fb:${s.id}">写随访记录</button></td></tr>`).join('')}</table>`;
  if (q.k === 'over') return `<table class="t"><tr><th>学生</th><th>所在层</th><th>卡在谁手里</th><th>超时</th><th style="width:230px"></th></tr>${it.map(s => { const h = holder(s); return `<tr class="crit"><td><b>${nm(s)}</b><small>${s.college}</small></td><td>${layer(s)}</td><td>${ST(h).name}${nudgedToday(s) ? `<small class="okt">今日已催办 ${pad(s.nudged.getHours())}:${pad(s.nudged.getMinutes())}</small>` : ''}</td><td>${dueTag(leftOf(s) ?? fLeft(s) + RULES.lim.fdue)}</td><td>${nudgedToday(s) ? '<button class="btn sec xs" disabled>今日已催办</button>' : `<button class="btn sec xs" data-act="nudge" data-arg="${s.id}">催办</button>`} <button class="btn sec xs" data-act="mo" data-arg="reassign:${s.id}">改派</button> <button class="btn pri xs" data-act="open" data-arg="${s.id}">代办</button></td></tr>`; }).join('')}</table><p class="note">每一层超过时限都会进入这里。催办会给当事人发短信和站内信；改派后时限重新计算；代办由你直接处理并留痕。</p>`;
  return `<table class="t"><tr><th>学生</th><th>等级</th><th>为什么在这里</th><th>时限</th><th></th></tr>${it.map(s => `<tr class="hov ${overdue(s) || s.queue === 'hard' ? 'crit' : ''}" data-act="open" data-arg="${s.id}"><td><b>${nm(s)}</b><small>${s.college} · ${s.year}</small></td><td>${lvV(s)}${s.downTo ? `<small>申请降为 ${s.downTo} 级</small>` : ''}</td><td class="whyc">${esc(why(s, 2))}</td><td>${dueTag(leftOf(s)) || '—'}<small>已等 ${dur(hrs(s.since))}</small></td><td><button class="btn pri xs">打开档案</button></td></tr>`).join('')}</table>`;
}
function batchView(it) {
  it.forEach(s => { if (!(s.id in S.sel)) S.sel[s.id] = s.sig <= 3; });
  const n = it.filter(s => S.sel[s.id]).length;
  return `<p class="note" style="margin:0 0 10px">辅导员已完成核实、没有转交新情况的 3 级学生。信号格 4 格及以上的默认不勾选，建议点开逐一看。确认方式由系统管理员配置（当前：${RULES.t3end}）。</p>
    <table class="t"><tr><th style="width:36px"></th><th>学生</th><th>初判</th><th>精筛方向</th><th>学院核实</th><th>剩余时限</th><th></th></tr>${it.map(s => `<tr class="${S.sel[s.id] ? 'sel' : ''}"><td><input type="checkbox" ${S.sel[s.id] ? 'checked' : ''} data-act="selT" data-arg="${s.id}"></td><td><b>${nm(s)}</b><small>${s.college}</small></td><td>${lvB(s.lv, s.sig)}</td><td>${tags(s.fs)}</td><td>${ST(s.follower).name}：已完成</td><td>${dueTag(leftOf(s))}</td><td><button class="btn ghost xs" data-act="open" data-arg="${s.id}">打开档案</button></td></tr>`).join('')}</table>
    <div style="display:flex;gap:10px;align-items:center;margin-top:12px"><button class="btn pri" data-act="batchOk" ${n ? '' : 'disabled'}>确认所选 ${n} 人为 3 级，进入 14 天随访</button><span class="note">每条确认都会记入各自的跟进时间线</span></div>`;
}
const BST = { move: '<span class="pill w">老师提议改时间 · 等学生接受</span>', adjust: '<span class="pill r">中心调整 · 待重新安排</span>', audit: '<span class="pill">待审核</span>', confirm: '<span class="pill w">待确认</span>', change: '<span class="pill w">改期 / 取消申请</span>', record: '<span class="pill w">待写记录</span>', pool: '<span class="pill r">待办池</span>', ok: '<span class="pill g">已确认</span>', no: '<span class="pill">已婉拒</span>', done: '<span class="pill g">已完成</span>', cancelled: '<span class="pill">已取消</span>' };
const mayBook = b => S.role === 'L3' || (S.role === 'L2' && b.cid === me());
function bookTable(list) {
  if (!list.length) return `<div class="empty"><img src="${MASCOT}" alt="">这一项都处理完了</div>`;
  const act = b => {
    if (b.st === 'audit') return isL1() ? `<button class="btn pri xs" data-act="bAudit" data-arg="${b.id}">审核并同步</button>` : S.role === 'L3' ? `<button class="btn sec xs" data-act="mo" data-arg="auditor:${b.id}">改派审核人</button> <button class="btn ghost xs" data-act="bAudit" data-arg="${b.id}">代审核</button>` : '';
    if (!mayBook(b) || isL1()) return '';
    if (b.st === 'confirm') return `<button class="btn pri xs" data-act="bOk" data-arg="${b.id}">确认</button> <button class="btn sec xs" data-act="mo" data-arg="bMove:${b.id}">改约</button> <button class="btn ghost xs" data-act="mo" data-arg="bNo:${b.id}">婉拒</button>`;
    if (b.st === 'move') return `<span class="note">等待学生接受新时间</span>`;
    if (b.st === 'change') return `<button class="btn pri xs" data-act="bAgree" data-arg="${b.id}">同意</button> <button class="btn sec xs" data-act="mo" data-arg="bDeny:${b.id}">不同意</button> <button class="btn ghost xs" data-act="bTalk" data-arg="${b.id}">先和学生聊聊</button>`;
    if (b.st === 'record') return `<button class="btn pri xs" data-act="mo" data-arg="rec:${b.id}">写记录</button>`;
    if (['pool', 'adjust'].includes(b.st) && can(9)) return `<button class="btn pri xs" data-act="mo" data-arg="assignB:${b.id}">指派</button>`;
    if (b.st === 'ok' && b.fresh) return `<button class="btn pri xs" data-act="bSeen" data-arg="${b.id}">知道了</button> <button class="btn sec xs" data-act="mo" data-arg="bMove:${b.id}">改约</button> <button class="btn ghost xs" data-act="mo" data-arg="bNo:${b.id}">婉拒</button>`;
    if (b.st === 'ok') return `<button class="btn ghost xs" data-act="mo" data-arg="bMove:${b.id}">改约</button>`;
    return '';
  };
  return `<table class="t"><tr><th>学生</th>${isL1() ? '' : '<th>等级</th>'}<th>类型 · 咨询师</th><th>时段</th><th>来源</th><th>状态</th><th>时限</th><th></th></tr>${list.map(b => { const s = SU(b.sid); return `<tr><td><b>${nm(s)}</b><small>${s.college}</small></td>${isL1() ? '' : `<td>${lvV(s)}</td>`}<td>${b.kind} · ${ST(b.cid).name}${typeof intakeTag === 'function' ? intakeTag(b) : ''}</td><td>${slotTxt(b)} · ${b.mode}${b.st === 'change' ? `<small>申请${b.req.type}${b.req.type === '改期' ? '到 ' + dayLbl(b.req.day) + ' ' + TIMES[b.req.t] : ''} · 本 14 天第 ${s.q.chg || 1} 次</small>` : ''}</td><td>${esc(b.src)}${b.lv4 && !isL1() ? '<small>4 级及以上，跳过 L1 审核</small>' : ''}</td><td>${BST[b.st] || b.st}${b.st === 'ok' && b.fresh ? ' <span class="pill p">新预约</span>' : ''}${b.st === 'audit' && !isL1() ? `<small>审核人：${ST(auditor(b)).name}</small>` : ''}</td><td>${dueTag(bLeft(b)) || '—'}</td><td>${act(b)}</td></tr>`; }).join('')}</table>`;
}
