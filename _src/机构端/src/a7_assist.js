/* =====================================================================
   小屿 · 后台工作助理：每个身份一份今日简报 + 问答 + 一键起草
   原则：只整理、只起草，不替人决定；读到的范围与本人权限一致；起草与发送都记审计
===================================================================== */
const APPROVALS = [];
const HON = { c1: '李老师', c2: 'Maria', c3: 'Daniel', c4: '王老师', c5: '朱老师', u1: '周老师', u2: '郑老师', u3: '林同学', a1: '陈老师' };
const homeView = () => S.hv || ((S.seen || {})[me()] ? 'work' : 'brief');
const greet = () => { const h = NOW.getHours(); return `${HON[me()] || ST(me()).name}${h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好'}`; };
const it = (html, act, arg, btn) => ({ html, act, arg, btn });
const own = c => STU.filter(s => s.owner === c).length;
const hrsTxt = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const pendL2 = c => STU.filter(s => s.stage === 'L2' && s.assignee === c).length;
const within = (h, k) => STU.reduce((a, s) => a + s.tl.filter(e => (!k || k.includes(e.k)) && hrs(e.at) <= h && hrs(e.at) >= 0).length, 0);

/* ---------- 简报内容（实时计算） ---------- */
function briefL3() {
  const secs = [], u = me();
  const kn = crisisNew(), kh = CRISES.filter(k => k.st === 'handling');
  const crisisItems = [...kn.map(k => it(`<b>未接收</b>：${nm(SU(k.sid))}，${SU(k.sid).college}，${fmt(k.at)} 触发。<span class="whyl">触发线索：${esc(crisisWhy(k))}</span>${cLeft(k) < 0 ? `<span class="due r">已超时 ${dur(cLeft(k))}</span>` : `剩 ${dur(cLeft(k))}`}。${k.esc ? '已升级到你。' : `值班的${ST(DUTY[0].who).name}已收到短信，还没确认。`}`, 'crisisOpen', k.id, '去处置')),
    ...kh.map(k => { const a = k.acts[k.acts.length - 1]; return it(`<b>处置中</b>：${nm(SU(k.sid))}（${esc(crisisWhy(k, 1))}），由${ST(k.recv.by).name}负责${a ? `，最近一步：${(CSTEPS.find(c => c[0] === a.step) || ['', ''])[1]} · ${esc(a.res)}${a.note ? '（' + esc(a.note) + '）' : ''}` : ''}，步骤 ${CSTEPS.filter(c => stepDone(k, c[0])).length}/5。`, 'crisisOpen', k.id, '查看'); })];
  if (kn.length) secs.push({ t: `危机（${kn.length} 条未接收）`, items: crisisItems, red: 1 });
  const dec = [];
  STU.filter(s => s.stage === 'L3' && s.queue === 'down').forEach(s => dec.push(it(`<b>降级审批</b>：${ST(s.downBy).name}申请把 ${nm(s)} 从 ${s.lv} 级降到 ${s.downTo} 级。理由：${esc(s.downWhy)}。${dueTag(leftOf(s))}<span class="hint">我的提醒：${s.hist.length ? '有既往筛查记录，可以对照' : '这是第一次筛查，没有既往记录'}；申请比初判低 ${s.lv - s.downTo} 级${s.lv - s.downTo >= 2 ? '，你可以同意，也可以要求 2 周后复测再定' : ''}。</span>`, 'open', s.id, '去审批')));
  STU.filter(s => s.stage === 'L3' && s.queue === 'hard').forEach(s => dec.push(it(`<b>疑难上推</b>：${esc(s.src)}，${nm(s)}，已等 ${dur(hrs(s.since))}。<span class="hint">王磊负责 ${own('c4')} 人，本周空档 ${openSlots('c4').length} 个；你负责 ${own('c5')} 人，空档 ${openSlots('c5').length} 个。</span>`, 'open', s.id, '去指派')));
  if (dec.length) secs.push({ t: `要你拍板的（${dec.length} 件）`, all: 1, items: dec });
  const st = [], od = STU.filter(s => ['L1', 'L2'].includes(s.stage) && overdue(s)), by = {};
  od.forEach(s => { const h = holder(s); (by[h] = by[h] || []).push(s); });
  Object.entries(by).forEach(([h, a]) => { const done = a.every(nudgedToday), t = done ? a.map(s => s.nudged).sort((x, y) => y - x)[0] : null;
    st.push(Object.assign(it(`${ST(h).name}有 ${a.length} 位${ST(h).role === 'L1' ? '核验' : '复核'}超时，最久超时 ${dur(Math.max(...a.map(s => -leftOf(s))))}。`, done ? null : 'nudgeAll', h, '批量催办'), done ? { tag: `今日已催办 ${hrsTxt(t)}` } : {})); });
  const fo = STU.filter(fOver); if (fo.length) st.push(it(`随访逾期（到期超过 2 天）的有 ${fo.length} 位。`, 'drill', 'students:fdueOver', '看名单'));
  const pool = BOOK.filter(b => b.st === 'pool'); if (pool.length) st.push(it(`预约待办池里有 ${pool.length} 个没人受理。`, 'drill', 'booking:pool', '去指派'));
  const ls = ['c1', 'c2', 'c3'].map(c => [c, pendL2(c)]).sort((a, b) => b[1] - a[1]), [mx, mn] = [ls[0], ls[ls.length - 1]];
  const nb = STU.filter(s => s.stage === 'L2' && s.queue === 'batch' && s.assignee === mx[0]).length;
  if (mx[1] - mn[1] >= 5 && nb) st.push(it(`${ST(mx[0]).name} 手上 ${mx[1]} 件待处理，是团队里最多的；${ST(mn[0]).name} 只有 ${mn[1]} 件。<span class="hint">建议：把${ST(mx[0]).name}的 ${nb} 个批量确认改派给${ST(mn[0]).name}。</span>`, 'rebal', `${mx[0]}>${mn[0]}`, '批量改派'));
  if (st.length) secs.push({ t: `卡住的（${st.length} 处）`, items: st });
  const ah = [], w = TASKS[0].waves.find(x => x.st === 'wait' && x.roster);
  if (w) { const c = capacity(w); ah.push(it(c.ok ? `第 ${w.n} 波计划 ${w.pub} 发布，产能检查通过，可以按计划发布。` : `<b>第 ${w.n} 波普测</b>计划 ${w.pub} 发布，名单 ${w.roster} 人。按第 1 波 4 级及以上 ${(c.p4 * 100).toFixed(1)}% 估算，需要约 ${c.est} 个预咨询，初级池本周只开放了 ${c.free} 个。<span class="hint">最晚本周四要定：推迟发布，还是请大家增开时段。</span>`, 'mo', `wave:${w.n}`, '看产能检查')); }
  const up = UNPUB().map(x => `${ST(x.cid).name} ${x.day}`); if (up.length) ah.push(it(`排班：${up.join('、')} 还没有开放任何时段。`, 'bsched', '', '去排班'));
  if (ah.length) secs.push({ t: '本周要提前定的', items: ah });
  const mine = [...STU.filter(s => fdueNow(s) && s.owner === u).map(s => it(`你负责的 ${nm(s)} 随访到期了。`, 'open', s.id, '打开')), ...BOOK.filter(b => b.cid === u && b.day === todayIdx() && ['ok', 'confirm'].includes(b.st)).map(b => it(`今天 ${TIMES[b.t]} 你有一个${b.kind}：${nm(SU(b.sid))}。`, 'open', b.sid, '打开'))];
  if (mine.length) secs.push({ t: '你自己的', items: mine });
  if (!kn.length) secs.push({ t: '危机', items: [it(`没有未接收的危机。`), ...crisisItems] });
  const lead = dec.length + kn.length ? `今天有 ${dec.length + kn.length} 件事要你亲自处理${st.length ? `，另有 ${st.length} 项需要协调或跟进` : ''}。` : '今天没有需要你直接处理的审批或危机事项。';
  return { lead, secs, foot: `过去 24 小时：确认等级或审批 ${within(24, ['conf', 'downok', 'downno', 'assign'])} 人次，L1 核验 ${within(24, ['l1keep', 'l1up'])} 人，结案 ${CRISES.filter(k => k.closed && hrs(k.closed.at) <= 24).length} 件。第 1 波完成率 ${Math.round(SURV().length / ROSTER * 100)}%（${SURV().length}/${ROSTER}）。新危机会即时通知，不受每日简报时间限制。` };
}
function briefL2() {
  const u = me(), secs = [], myQ = STU.filter(s => s.stage === 'L2' && s.assignee === u);
  const tb = BOOK.filter(b => b.cid === u && b.day === todayIdx() && ['ok', 'confirm'].includes(b.st)).sort((a, b) => a.t - b.t);
  secs.push({ t: `今天的咨询（${tb.length}）`, all: 1, items: tb.length ? tb.map(b => it(`${TIMES[b.t]} ${b.kind} · ${nm(SU(b.sid))} · ${b.mode}${b.st === 'confirm' ? ' · <span class="due w">还没确认</span>' : ''}`, 'open', b.sid, '打开档案')) : [it('今天没有安排。')] });
  const hot = byDue(myQ).filter(s => leftOf(s) < 24);
  if (hot.length) secs.push({ t: `快到时限的（${hot.length}）`, all: 1, items: hot.slice(0, 4).map(s => it(`${nm(s)} · ${lvB(curLv(s))} · ${dueTag(leftOf(s))}<span class="whyl">${esc(why(s, 2))}</span>`, 'open', s.id, '去复核')).concat(hot.length > 4 ? [it(`还有 ${hot.length - 4} 位，在「我的队列」里按时限排好了。`)] : []) });
  const cnt = k => myQ.filter(s => k.includes(s.queue)).length;
  secs.push({ t: '队列一览', items: [it(`待复核 ${cnt(['review4', 'up', 'review3'])} · 批量确认 ${cnt(['batch'])} · 抽查 ${cnt(['sample'])} · 拒绝 / 未回应邀请 ${cnt(['declined', 'noresp'])}`, 'qtabGo', 'review4', '去队列')] });
  const bk = BOOK.filter(b => b.cid === u && ['confirm', 'change'].includes(b.st)), rc = BOOK.filter(b => b.cid === u && b.st === 'record'), fd = STU.filter(s => fdueNow(s) && s.owner === u);
  const ot = [];
  if (bk.length) ot.push(it(`预约待确认或改期 ${bk.length} 个，最早一个 ${dueTag(Math.min(...bk.map(b => bLeft(b) ?? 99)))} 后进待办池。`, 'bview', 'confirm', '去确认'));
  if (rc.length) ot.push(it(`有 ${rc.length} 次咨询还没写记录。`, 'bview', 'record', '去写'));
  if (fd.length) ot.push(it(`你负责的学生有 ${fd.length} 位随访到期。`, 'qtabGo', 'fdue', '去随访'));
  if (UNPUB().some(x => x.cid === u)) ot.push(it(`你 ${UNPUB().filter(x => x.cid === u).map(x => x.day).join('、')} 还没有开放任何时段，学生约不到你。`, 'bsched', '', '去排班'));
  CRISES.filter(k => k.assist === u && k.st === 'handling').forEach(k => ot.push(it(`负责人指派你协助一条危机：${nm(SU(k.sid))}。`, 'crisisOpen', k.id, '查看')));
  if (ot.length) secs.push({ t: '其他要处理的', items: ot });
  return { lead: `今天你有 ${tb.length} 次咨询，队列里 ${myQ.length} 位学生${hot.length ? `，其中 ${hot.length} 位 24 小时内到时限` : ''}。`, secs, foot: '复核存在疑问时，可提交 L3 处理；降低 4 级及以上学生的关注等级需要 L3 审批。' };
}
/* 辅导员：该做的全部列出，按紧急度分三档；最紧急的一档全部展开，其余默认只露前两条。用时只做参考，不限制展示 */
const EST = { asks: 6, pending: 4, verify: 5, fdue: 8 };
function briefL1() {
  const u = me(), q = queues(u, S.role), g = k => (q.find(x => x.k === k) || { items: [] }).items, v = g('verify'), pd = g('pending'), fd = g('fdue'), as = g('asks');
  const mine = CRISES.filter(k => k.by === u && k.st !== 'closed');
  const hl = d => d ? (d - NOW) / H : 1e9;
  const cand = [
    ...as.map(s => { const a = openAsk(s), h = hl(a.due); return { s, t: `中心请你：${esc(a.what)}${a.st ? `（${a.st}）` : ''} · ${h < 0 ? '已超过期限' : '期限 ' + fmt(a.due)}`, m: EST.asks, h, tier: h < 24 ? 1 : 2, act: 'askDone', btn: '更新进度' }; }),
    ...pd.filter(s => s.next <= NOW).map(s => ({ s, t: '待补充信息：到了约定时间', m: EST.pending, h: hl(s.next), tier: 1, act: 'verify', btn: '继续核实' })),
    ...v.map(s => { const h = leftOf(s) ?? 1e9; return { s, t: h < 0 ? `核实已超时 ${dur(h)}` : `核实 · 剩 ${dur(h)}`, m: EST.verify, h, tier: h < 0 ? 1 : h < 24 ? 2 : 3, act: 'verify', btn: '核实' }; }),
    ...fd.map(s => { const h = fLeft(s); return { s, t: s.miss ? `随访：上次没接通（第 ${s.miss} 次）` : fOver(s) ? `随访已逾期 ${dur(h)}` : '随访到期', m: EST.fdue, h, tier: s.miss || fOver(s) ? 1 : 2, act: 'fb', btn: '写随访' }; })];
  cand.sort((x, y) => x.tier - y.tier || x.h - y.h);
  const T = n => cand.filter(c => c.tier === n), row = c => it(`${nm(c.s)} · ${c.t}`, 'mo', `${c.act}:${c.s.id}`, c.btn), mins = cand.reduce((a, c) => a + c.m, 0);
  S._capLeft = cand.length; S._capMin = mins;
  const secs = [];
  if (mine.length) secs.push({ t: '你报告的紧急情况', red: 1, all: 1, items: mine.map(k => it(`${nm(SU(k.sid))}：${k.st === 'new' ? (k.esc ? '值班未按时确认，已再次呼叫并通知中心负责人' : '值班咨询师已收到，等待确认') : `${ST(k.recv.by).name} 已确认接收，正在处理`}`)) });
  if (T(1).length) secs.push({ t: `必须今天处理（${T(1).length}）`, red: 1, all: 1, items: T(1).map(row) });
  if (T(2).length) secs.push({ t: `24 小时内到期（${T(2).length}）`, items: T(2).map(row) });
  if (T(3).length) secs.push({ t: `其他待办，按剩余时限（${T(3).length}）`, items: T(3).map(row) });
  secs.push({ t: '按类别看', items: [it(`待核实 ${v.length} · 待补充 ${pd.length} · 随访到期 ${fd.length} · 中心请协助 ${as.length}`, 'qtabGo', 'verify', '打开名单')] });
  if (pd.filter(s => s.next > NOW).length) secs.push({ t: `待补充信息 ${pd.filter(s => s.next > NOW).length} 位还没到约定时间`, items: [it('到时间会提醒你。延期 2 次或超过最晚期限的，请交回中心。', 'qtabGo', 'pending', '查看')] });
  if (cand.length) secs.push({ t: '需要协调工作量？', items: [it(`全部 ${cand.length} 件预计约 ${mins} 分钟（仅供参考）。请优先处理今天到期的事项。如无法按时完成，可请中心改派或调整期限。`, 'mo', 'capReq:', '请中心协调')] });
  return { lead: cand.length ? `今天一共 ${cand.length} 件：必须今天处理 ${T(1).length} 件，24 小时内到期 ${T(2).length} 件，其余 ${T(3).length} 件按剩余时限往后排。学生表达自伤、自杀想法或可能处于紧急危险时，请使用「报告紧急情况」。` : '今天没有待办。学生表达自伤、自杀想法或可能处于紧急危险时，请使用「报告紧急情况」。', secs, foot: S.role === 'L1s' ? '此账号只显示学生编号。遇到无法判断的情况，请交给咨询师处理。' : '你能看到学生姓名、电话和关注等级，但看不到分数、报告和对话。请记录观察到的事实、联系学生，并在需要时报告；专业风险判断由咨询师完成。' };
}
function briefADM() {
  const secs = [], ap = APPROVALS.filter(a => a.st === '待批');
  secs.push({ t: `待你审批（${ap.length}）`, items: ap.length ? ap.map(a => it(`${ST(a.by).name} 申请导出 ${a.n} 人的原始数据（${a.fields.join('、')}），用途：${esc(a.why)}。`, 'apOk', a.id, '批准')) : [it('没有待审批的导出申请。')] });
  const cf = AUDIT.filter(a => a.cat === '配置' && hrs(a.at) <= 24);
  secs.push({ t: '过去 24 小时的配置变更', items: cf.length ? cf.slice(0, 5).map(a => it(`${fmt(a.at)} ${a.uid === 'sys' ? '系统' : ST(a.uid).name}：${esc(a.t)}`)) : [it('没有配置变更。')] });
  const nx = DUTY[1]; secs.push({ t: '值班与权限', items: [it(`本周值班：${ST(DUTY[0].who).name}；下周（${nx.wk}）：${ST(nx.who).name}。`, 'setTab', 'duty', '看值班表'), it(`辅导员可见范围：${PERMS[0][1] || PERMS[1][1] || PERMS[2][1] ? '已扩大' : '脱敏（默认）'}，知情同意书 ${CONSENT.ver}。`, 'setTab', 'tiers', '查看')] });
  const sent = NOTI.length; secs.push({ t: '系统运行', items: [it(`通知 ${sent} 条，送达 ${NOTI.filter(n => n.st !== '发送中').length} 条（${sent ? 100 : 0}%）；危机通知已确认 ${NOTI.filter(n => n.st === '已确认').length} 条。`)] });
  return { lead: ap.length ? `有 ${ap.length} 个导出申请等你审批。` : '今天没有等你处理的审批。', secs, foot: '系统管理员只管配置，看不到学生档案；审计日志里的学生显示为编号。' };
}
function briefData() { return S.role === 'L3' ? briefL3() : S.role === 'L2' ? briefL2() : S.role === 'ADM' ? briefADM() : briefL1(); }
function briefLine() {
  const b = briefData();
  return `<div class="bline"><img src="${MASCOT}" alt=""><span class="grow"><b>小屿：</b>${b.lead}</span><button class="btn sec xs" data-act="hview" data-arg="brief">看今日简报</button></div>`;
}
function briefPage() {
  const b = briefData(); S.bexp = S.bexp || {}; S.hx = S.hx || {};
  const secs = b.secs.map((s, i) => { const must = s.red || s.all, ex = must || S.full || S.bexp[i], shown = ex ? s.items : [];
    return `<div class="bs ${s.red ? 'red' : ''}"><h4>${i + 1}. ${s.t}${must ? '' : ' <span class="opt">可稍后看</span>'}</h4>${shown.map((x, j) => { const k = i + '-' + j, m = x.html.match(/<span class="hint">(.*?)<\/span>/), main = x.html.replace(/<span class="hint">.*?<\/span>/, '');
      return `<div class="bi"><div>${main}${m ? (S.hx[k] ? `<span class="hint">${m[1]} <button class="lnk" data-act="hx" data-arg="${k}">收起</button></span>` : ` <button class="lnk" data-act="hx" data-arg="${k}">小屿的提醒</button>`) : ''}</div>${x.act ? `<button class="btn ${s.red ? 'red' : 'sec'} xs" data-act="${x.act}" data-arg="${esc(x.arg)}">${x.btn}</button>` : x.tag ? `<span class="pill g">${x.tag}</span>` : ''}</div>`; }).join('')}
      ${!must && !S.full ? `<button class="lnk more" data-act="bexp" data-arg="${i}">${ex ? '收起' : `展开 ${s.items.length} 条`}</button>` : ''}</div>`; }).join('');
  return `<div class="bpage"><div class="brief"><div class="bh"><img src="${MASCOT}" alt=""><div class="grow"><b>小屿 · 今日简报</b><small>按 ${fmt(NOW)} 的数据 · 每天 8:30 推送 · 危机即时提醒</small></div><button class="btn sec xs" data-act="shareBrief">${I('share', 's')}分享</button></div>
    <p class="greet">${greet()}。${b.lead}</p>${secs}<p class="bfoot">${b.foot}</p>
    <div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn pri" data-act="hview" data-arg="work">开始工作 ${I('right', 's')}</button></div></div>
    <div class="aside">${assistBody(true)}</div></div>`;
}

/* ---------- 问答与起草 ---------- */
const CHIPS = {
  L3: ['今天先做什么？', '哪个学院完成率最低？', '王磊手上有多少学生？', '有哪些超时？', '第 2 波能按时发吗？', '起草本周周报', '起草催办消息'],
  L2: ['今天先做什么？', '哪些复核快到时限？', '我负责的学生谁随访到期？', '起草预约邀请短信'],
  L1: ['今天先做什么？', '谁的随访到期了？', '这些学生是几级？', '起草随访开场白'],
  L1s: ['今天先做什么？', '这些学生是几级？', '起草随访开场白'],
  ADM: ['今天先做什么？', '最近改了哪些配置？', '下周谁值班？', '起草配置变更通知'],
};
function answer(q) {
  const r = S.role, has = (...k) => k.some(x => q.includes(x));
  if (has('先做', '今天', '重要')) { const b = briefData(); return { html: `${b.lead}<ol>${b.secs.slice(0, 3).map(s => `<li><b>${s.t}</b>：${s.items[0].html.replace(/<span class="hint">.*?<\/span>/g, '')}</li>`).join('')}</ol>完整内容在工作台顶部的今日简报里。` }; }
  if (has('几级', '等级', '分数') && isL1()) return { html: `${S.role === 'L1s' ? '学生心理委员账号仅显示学生编号，不显示关注等级、分数或报告。' : '学生的关注等级可在名单和档案中查看，当前账号无权查看分数和报告。'}发现学生近况变化时，可在任务卡选择「有新的情况，交给咨询师」，记录已了解到的事实，交由咨询师复核。` };
  if (has('完成率', '学院') && !isL1() && r !== 'ADM') { const rows = COLLEGES.map(c => { const d = SURV().filter(s => s.college === c).length, p = PENDING.filter(x => x.college === c).length; return [c, d, d + p, Math.round(d / (d + p) * 100)]; }).sort((a, b) => a[3] - b[3]);
    return { html: `完成率最低的是<b>${rows[0][0]}</b>：${rows[0][1]}/${rows[0][2]}（${rows[0][3]}%）。<br>${rows.map(x => `${x[0]} ${x[3]}%`).join(' · ')}<br>可选择「起草催办消息」生成提醒草稿，确认内容后再发送。`, chips: ['起草催办消息'] }; }
  if (has('王磊', '手上', '负荷') && r === 'L3') { const c = 'c4'; return { html: `王磊现在负责 ${own(c)} 位学生${STU.filter(s => s.owner === c && curLv(s) >= 4).length ? `，其中 4 级及以上 ${STU.filter(s => s.owner === c && curLv(s) >= 4).length} 位` : ''}；本周还有 ${openSlots(c).length} 个空档；正在处置的危机 ${CRISES.filter(k => k.st === 'handling' && k.recv.by === c).length} 条。` }; }
  if (has('超时') && r === 'L3') { const od = STU.filter(s => ['L1', 'L2'].includes(s.stage) && overdue(s)); return od.length ? { html: `现在有 ${od.length} 位超时：<ul>${od.map(s => `<li>${nm(s)} · ${layerTxt(s)} · 在${ST(holder(s)).name}手上 · 超时 ${dur(-leftOf(s))}</li>`).join('')}</ul>`, chips: ['起草催办消息'] } : { html: '现在没有超时的。' }; }
  if (has('第 2 波', '按时发', '产能') && r === 'L3') { const w = TASKS[0].waves[1], c = capacity(w); return { html: c.ok ? `可以。产能检查三项都通过。` : `不建议按时发。需要约 ${c.est} 个预咨询，初级池本周只开放 ${c.free} 个${c.l2 > RULES.cap ? `，L2 待复核也超过阈值` : ''}${crisisNew().length ? '，还有未接收的危机' : ''}。<br>两个办法：推迟 1 周，或者请初级咨询师每人增开约 ${Math.ceil((c.est - c.free) / 3)} 个时段。` }; }
  if (has('快到时限') && r === 'L2') { const a = byDue(STU.filter(s => s.stage === 'L2' && s.assignee === me())).filter(s => leftOf(s) < 24); return { html: a.length ? `<ul>${a.map(s => `<li>${nm(s)} · ${layerTxt(s)} · ${dueTag(leftOf(s))}</li>`).join('')}</ul>` : '24 小时内没有到时限的。' }; }
  if (has('随访到期')) { const a = STU.filter(s => fdueNow(s) && (isL1() ? !s.owner && s.follower === me() : s.owner === me())); return { html: a.length ? `<ul>${a.map(s => `<li>${nm(s)} · ${fdueTag(s)}${s.miss ? ` · 上次没接通` : ''}</li>`).join('')}</ul>` : '没有到期的随访。' }; }
  if (has('配置') && r === 'ADM') { const cf = AUDIT.filter(a => a.cat === '配置'); return { html: cf.length ? `<ul>${cf.slice(0, 8).map(a => `<li>${fmt(a.at)} ${ST(a.uid).name}：${esc(a.t)}</li>`).join('')}</ul>` : '当前没有配置变更记录。', chips: ['起草配置变更通知'] }; }
  if (has('值班')) return { html: `本周 ${ST(DUTY[0].who).name}，下周（${DUTY[1].wk}）${ST(DUTY[1].who).name}，再下周 ${ST(DUTY[2].who).name}。` };
  if (has('起草')) return draft(q);
  return { html: '可查询以下内容，或生成消息草稿：', chips: CHIPS[S.role] };
}
function draft(q) {
  const r = S.role;
  if (q.includes('周报') && r === 'L3') { const rr = recvRate(); return { draft: { kind: 'report', title: `第 ${weekNo(NOW)} 周心理普测工作周报（脱敏）`, text: `各位领导：\n\n本周秋季普测第 1 波（试点 4 个学院）完成 ${SURV().length}/${ROSTER} 人，完成率 ${Math.round(SURV().length / ROSTER * 100)}%。\n\n关注分布：${[5, 4, 3, 2, 1].map(l => `${l} 级 ${SURV().filter(s => curLv(s) === l).length} 人`).join('，')}。\n\n危机处置：共触发 ${CRISES.length} 条，按规定时限接收 ${rr.txt}，已结案 ${CRISES.filter(k => k.st === 'closed').length} 条，处置中 ${CRISES.filter(k => k.st === 'handling').length} 条。\n\n下周计划：第 2 波（大二、大三，${TASKS[0].waves[1].roster} 人）原定 ${TASKS[0].waves[1].pub} 发布，${capacity(TASKS[0].waves[1]).ok ? '产能检查通过，按计划进行' : '目前咨询时段不足，建议推迟 1 周或增开时段，待中心确认'}。\n\n大学心理咨询中心\n朱静` } }; }
  if (q.includes('催办') && r === 'L3') { const od = STU.filter(s => ['L1', 'L2'].includes(s.stage) && overdue(s)), by = {}; od.forEach(s => { const h = holder(s); by[h] = (by[h] || 0) + 1; });
    const to = Object.keys(by); if (!to.length) return { html: '现在没有超时的，不需要催办。' };
    return { draft: { kind: 'nudge', to, title: `催办消息（发给 ${to.map(h => ST(h).name).join('、')}）`, text: to.map(h => `${HON[h] || ST(h).name}好，你的队列里有 ${by[h]} 位学生已超过处理时限，麻烦今天抽空处理。如果忙不过来请告诉我，我来协调改派。——朱静`).join('\n\n') } }; }
  if (q.includes('邀请') && r === 'L2') return { draft: { kind: 'msg', title: '预约邀请短信（不含任何评估信息）', text: `你好，我是大学心理咨询中心的${ST(me()).name}。看到你最近完成了心理健康普测，想邀请你来中心聊一聊近况，时间你来定，线上线下都可以。可以在灵屿里直接预约，也可以回复这条短信。不想聊也没关系，随时欢迎。` } };
  if (q.includes('开场白') && isL1()) return { draft: { kind: 'msg', title: '随访开场白（通用，不涉及评估内容）', text: '最近怎么样？上课、睡觉、吃饭都还顺利吗？有没有什么事让你觉得比较累或者烦？如果想找人聊聊，学校的心理咨询中心随时可以约，我也可以帮你预约。' } };
  if (q.includes('配置') && r === 'ADM') { const cf = AUDIT.filter(a => a.cat === '配置'); return { draft: { kind: 'msg', title: '配置变更通知（发给中心全体）', text: cf.length ? `各位老师：系统配置有以下调整，即日生效：\n${cf.slice(0, 6).map(a => `· ${a.t}`).join('\n')}\n如有疑问请联系系统管理员。——陈行政` : '各位老师：本周系统配置没有调整。——陈行政' } }; }
  return { html: '这一项不在你的权限范围内，或者演示版还不支持。' };
}
function assistPanel() {
  if (S.page === 'home' && homeView() === 'brief') return '';
  if (!S.ai) return `<button class="abtn" data-act="aiT"><img src="${MASCOT}" alt="">小屿助理</button>`;
  return `<div class="apanel">${assistBody(false)}</div>`;
}
function assistBody(inline) {
  const chat = S.chat || [];
  return `<div class="ah"><img src="${MASCOT}" alt=""><div class="grow"><b>小屿 · 工作助理</b><small>只整理、只起草，不替你决定 · 读到的范围和你的权限一致</small></div>${inline ? '' : `<button class="btn ghost xs" data-act="aiT">${I('x', 's')}</button>`}</div>
    <div class="alist" id="alist">${chat.length ? '' : `<div class="am ai"><div class="bb">${greet()}，我是你的工作助理。可以问我今天的安排、队列和数据，也可以让我帮你起草消息。</div></div>`}
    ${chat.map((m, i) => `<div class="am ${m.who}"><div class="bb">${m.html || ''}${m.draft ? `<div class="draft"><b>${esc(m.draft.title)}</b><pre>${esc(m.draft.text)}</pre><div class="da">${m.sent ? `<span class="pill g">${m.sent}</span>` : `<button class="btn ghost xs" data-act="dCopy" data-arg="${i}">复制</button><button class="btn pri xs" data-act="dSend" data-arg="${i}">${m.draft.kind === 'nudge' ? '确认发送' : '确认并保存'}</button>`}</div></div>` : ''}${m.chips ? `<div class="chips">${m.chips.map(c => `<button data-act="ask" data-arg="${esc(c)}">${c}</button>`).join('')}</div>` : ''}</div></div>`).join('')}</div>
    <div class="chipbar"><button class="lnk" data-act="chipT">${S.chipsOpen !== false ? '收起快捷问题 ▴' : `快捷问题（${CHIPS[S.role].length}）▾`}</button></div>${S.chipsOpen !== false ? `<div class="chips">${CHIPS[S.role].map(c => `<button data-act="ask" data-arg="${esc(c)}">${c}</button>`).join('')}</div>` : ''}
    <div class="ain"><input id="aiq" placeholder="问小屿，例如：哪个学院完成率最低？" value="${esc(S.aiq || '')}" data-bind="aiq"><button class="btn pri xs" data-act="askIn">发送</button></div>
    <p class="note" style="margin:6px 0 0;font-size:11.5px">起草的内容要你确认后才会发出；起草和发送都记入审计日志（类型「助理」）。</p>`;
}

Object.assign(ACT, {
  hview(v) { S.hv = v; S._p = null; if (v === 'work') { S.seen = S.seen || {}; S.seen[me()] = 1; } },
  hx(k) { S.hx[k] = !S.hx[k]; }, bexp(i) { S.bexp[i] = !S.bexp[i]; },
  aiT() { S.ai = !S.ai; },
  chipT() { S.chipsOpen = S.chipsOpen === false; },
  ask(q) { S.chipsOpen = false; if (!(S.page === 'home' && homeView() === 'brief')) S.ai = true; S.chat = (S.chat || []).concat([{ who: 'me', html: esc(q) }, Object.assign({ who: 'ai' }, answer(q))]); },
  askIn() { const q = (S.aiq || '').trim(); if (!q) return; S.aiq = ''; ACT.ask(q); },
  dCopy() { toast('已复制到剪贴板'); },
  dSend(i) { const m = S.chat[+i], d = m.draft;
    if (d.kind === 'nudge') { d.to.forEach(h => { notify(h, '站内 + 短信', '负责人催办：你有学生超过处理时限', null); STU.filter(s => holder(s) === h && overdue(s)).forEach(s => s.nudged = new Date(NOW)); }); m.sent = `已发送给 ${d.to.length} 人`; }
    else m.sent = '已保存为草稿';
    log(`助理起草「${d.title}」，由 ${ST(me()).name} 确认${d.kind === 'nudge' ? '发送' : '保存'}`, null, { cat: '助理', obj: '小屿助理' }); toast(m.sent); },
  nudgeAll(h) { const a = STU.filter(s => holder(s) === h && ['L1', 'L2'].includes(s.stage) && overdue(s) && !nudgedToday(s)); if (!a.length) return toast('今天已经催办过'); a.forEach(s => { s.nudged = new Date(NOW); log(`催办 ${ST(h).name}`, s, { k: 'nudge' }); }); notify(h, '站内 + 短信', `有 ${a.length} 位学生超时未处理，请尽快处理`, null); toast(`已催办${ST(h).name}（${a.length} 位）`); },
  rebal(a) { const [f, t] = a.split('>'), its = STU.filter(s => s.stage === 'L2' && s.queue === 'batch' && s.assignee === f);
    its.forEach(s => { s.assignee = t; s.since = new Date(NOW); s.limKey = null; if (s.ack || s.viewed) { s.ack = s.viewed = null; notify(s.follower, '站内', `${nm(s)} 已改派给${ST(t).name}，等待对方确认接手`, s.id); } log(`改派：${ST(f).name} → ${ST(t).name}（简报建议）`, s, { k: 'reassign' }); }); notify(t, '站内 + 短信', `有 ${its.length} 位学生改派给你（批量确认）`, null); notify(f, '站内', `你的 ${its.length} 个批量确认已改派给${ST(t).name}`, null); toast(`已把 ${its.length} 个批量确认改派给${ST(t).name}`); },
  bsched() { go('booking'); S.tabs.booking = 'sched'; },
  bview(sub) { go('booking'); S.tabs.booking = 'list'; S.tabs.bsub = sub; },
  qtabGo(k) { go('home'); S.hv = 'work'; S._p = null; S.tabs.home = k; setTimeout(() => { const e = document.querySelector('#pg .card .tabs'); if (e) e.scrollIntoView({ block: 'center' }); }, 30); },
  setTab(k) { go('settings'); S.tabs.settings = k; },
  apOk(id) { const a = APPROVALS.find(x => x.id === id); a.st = '已批准'; log(`批准导出申请：${ST(a.by).name} · ${a.n} 人`, null, { cat: '导出', obj: '原始数据' }); notify(a.by, '站内', '你的导出申请已批准，可以下载', null); toast('已批准，并通知申请人'); },
});

/* ---------- 简报一键分享：生成脱敏图片并复制到剪贴板 ---------- */
function briefImage() {
  S.maskAll = true; const b = briefData(); S.maskAll = false;
  const strip = h => String(h).replace(/<span class="hint">.*?<\/span>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const W = 900, P = 40, cv = document.createElement('canvas'), x = cv.getContext('2d'), F = '"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
  const lines = []; const push = (t, f, c, gap) => lines.push({ t, f, c, gap: gap || 0 });
  push(`${greet()}。${strip(b.lead)}`, `500 19px ${F}`, '#2E3A3C', 6);
  b.secs.forEach((s, i) => { push(`${i + 1}. ${strip(s.t)}`, `600 17px ${F}`, s.red ? '#B4432E' : '#2F5D62', 14); s.items.forEach(it => push('· ' + strip(it.html), `400 15.5px ${F}`, '#3d4a4c', 4)); });
  push(strip(b.foot), `400 13.5px ${F}`, '#6F7A7D', 16);
  const wrap = (t, f) => { x.font = f; const out = []; let cur = ''; for (const ch of t) { if (x.measureText(cur + ch).width > W - P * 2 - 10) { out.push(cur); cur = ch; } else cur += ch; } if (cur) out.push(cur); return out; };
  cv.width = W; cv.height = 4000; let y = 120; const draw = [];
  lines.forEach(l => { y += l.gap; wrap(l.t, l.f).forEach(t => { y += parseFloat(l.f.split(' ')[1]) * 1.65; draw.push([t, l.f, l.c, y]); }); });
  const H = y + 90; cv.height = H;
  x.fillStyle = '#FFFDF3'; x.fillRect(0, 0, W, H); x.fillStyle = '#1E3337'; x.fillRect(0, 0, W, 84);
  x.fillStyle = '#F2C14E'; x.font = `700 24px ${F}`; x.fillText('小屿 · 今日简报', P, 48); x.fillStyle = '#DDE6E4'; x.font = `400 14px ${F}`; x.fillText(`${ST(me()).name} · ${RN[S.role]} · 按 ${fmt(NOW)} 的数据`, P, 70);
  draw.forEach(([t, f, c, yy]) => { x.font = f; x.fillStyle = c; x.fillText(t, P, yy); });
  x.save(); x.globalAlpha = .07; x.fillStyle = '#2F5D62'; x.font = `600 22px ${F}`; x.rotate(-Math.PI / 9); for (let yy = 0; yy < H + 400; yy += 140) for (let xx = -200; xx < W + 200; xx += 360) x.fillText('内部资料 · 请勿外传', xx, yy); x.restore();
  x.fillStyle = '#E4E8E3'; x.fillRect(0, H - 50, W, 50); x.fillStyle = '#6F7A7D'; x.font = `400 13px ${F}`; x.fillText(`内部资料 · 请勿外传 · 学生姓名已脱敏 · 由 ${ST(me()).name} 分享于 ${fmt(NOW)} · 灵屿 2.0`, P, H - 20);
  return cv;
}
Object.assign(ACT, {
  shareBrief() { const cv = briefImage(); S.shareImg = cv.toDataURL('image/png'); S.shareCopied = null; S.mo = 'share:'; S.form = {};
    log('分享今日简报（脱敏图片）', null, { cat: '助理', obj: '今日简报' });
    try { cv.toBlob(bl => { navigator.clipboard.write([new ClipboardItem({ 'image/png': bl })]).then(() => { S.shareCopied = true; render(); }, () => { S.shareCopied = false; render(); }); }); } catch (e) { S.shareCopied = false; } },
});
