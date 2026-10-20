/* =====================================================================
   灵屿 2.0 机构端 · 交互原型 v2
   结构：队列在工作台，查人在学生，动作在档案里；时限由同一个时钟推进
===================================================================== */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const I = (n, c = '') => `<svg class="ic ${c}"><use href="#i-${n}"/></svg>`;
const ST = id => STAFF[id] || { name: '—' };
const SU = id => STU.find(s => s.id === id);
const pad = n => String(n).padStart(2, '0');
const fmt = d => d ? `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}` : '—';
const hrs = d => (NOW - d) / H;
const dur = h => { h = Math.abs(h); return h < 1 ? `${Math.max(1, Math.round(h * 60))} 分钟` : h < 48 ? `${Math.round(h)} 小时` : `${Math.round(h / 24)} 天`; };
const DD = i => DXL[i] || DAYS[i];
const dayLbl = i => i < 0 ? '10/9（上周五）' : `${DD(i).getMonth() + 1}/${DD(i).getDate()} 周${'日一二三四五六'[DD(i).getDay()]}`;
const LVC = { 5: 'var(--l5)', 4: 'var(--l4)', 3: 'var(--l3)', 2: 'var(--l2)', 1: 'var(--l1)' };
const AUDIT = [];

let S = { uid: null, role: null, login: { step: 0 }, page: 'home', tabs: {}, f: {}, dw: null, mo: null, toast: '', sel: {}, crisis: null, schedC: 'c1', pg: 1, form: {}, draft: {}, noti: false, memo: false, samp: { 2: 0, 1: 0 }, ppg: 1 };
const me = () => S.uid;
/* 普测统计口径：不含名单外登记的学生 */
/* v1.10「为什么在这里」：最关键的一两条线索（原话 / 题目 / 上推理由），只给能看临床内容的角色 */
const QUOTE = { 学业: '这学期感觉怎么学都跟不上', 人际: '感觉身边没有可以说话的人', 睡眠: '最近经常到凌晨三四点才睡着', 情绪: '提不起劲，做什么都没意思', 新生适应: '来了这边一直适应不了', 家庭: '家里最近出了点事，我不知道该怎么办', 恋爱: '分手以后整个人都垮了', 生涯: '不知道毕业以后要干什么' };
const I9 = ['完全不会', '好几天', '一半以上的天数', '几乎每天'];
const shortSrc = t => t.replace(/，即时转入危机通道$/, '').replace(/^作答中 /, '').replace(/^访谈中出现危机表达：/, '访谈原话：').replace(/^访谈原话：/, '访谈：');
function clues(s) {
  const o = [], k = CRISES.find(c => c.sid === s.id && c.st !== 'closed');
  if (k) k.src.forEach(x => o.push(shortSrc(x.t)));
  if (s.src && !/^系统/.test(s.src)) o.push(s.src);
  if (s.l1obs && s.l1obs.items && s.l1obs.items.length) o.push(`辅导员记录：${s.l1obs.items.join('、')}${s.l1obs.areas && Object.values(s.l1obs.areas).some(x => x.dir === '出现困难') ? '出现困难' : ''}`);
  if (s.walkin) return o;
  if (s.item9) o.push(`PHQ-9 第 9 题「${I9[s.item9]}」`);
  if (s.lv >= 3 && QUOTE[s.dirs[0]]) o.push(`访谈：「${QUOTE[s.dirs[0]]}」`);
  o.push(`PHQ-9 ${s.phq} 分 · GAD-7 ${s.gad} 分`);
  return o.filter((x, i, a) => a.indexOf(x) === i);
}
const why = (s, n = 2) => canLv() ? clues(s).slice(0, n).join('；') : '';
const crisisWhy = (k, n = 2) => k.src.slice(0, n).map(x => shortSrc(x.t)).join('；');
const SURV = () => STU.filter(s => !s.walkin);
const isAdm = () => S.role === 'ADM' || (S.uid && ACCTS[S.uid].includes('ADM'));
const isL1 = () => S.role === 'L1' || S.role === 'L1s';
const COL = { L1: 1, L1s: 1, L2: 2, L3: 3, ADM: 4 };
const can = i => (S.role === 'L1s' && i <= 3) ? false : !!PERMS[i][COL[S.role]];
const canLv = () => can(0), canName = () => can(1), canRep = () => can(2), canTalk = () => can(3);

/* ---------- 展示 ---------- */
const surname = s => s.name.split(/\s/)[0].slice(0, 1) + '*';
const nm = s => !s ? '—' : S.maskAll ? `${surname(s).slice(0, 1)}同学` : S.role === 'L1s' || S.role === 'ADM' ? `学生 ${s.code}` : canName() ? s.name : `${surname(s)} · ${s.sid.slice(-5)}`;
const curLv = s => s.conf || s.lv;
const lvB = (lv, sig) => lv ? `<span class="lv"><b style="background:${LVC[lv]}">${lv}</b>${LVN[lv]}${sig ? ` <span class="sig" style="color:${LVC[lv]}">${'●'.repeat(sig)}${'○'.repeat(5 - sig)}</span>` : ''}</span>` : '<span class="pill">未分级</span>';
const lvV = (s, sig) => canLv() ? lvB(curLv(s), sig ? s.sig : 0) : '<span class="pill">已隐藏</span>';
const tags = a => (a || []).map(x => `<span class="tag">${x}</span>`).join('');
const photo = id => typeof PHOTOS !== 'undefined' && PHOTOS[id] ? `<img class="av" src="${PHOTOS[id]}" alt="">` : '';
const dueTag = left => left == null ? '' : left < 0 ? `<span class="due r">已超时 ${dur(left)}</span>` : `<span class="due ${left < 12 ? 'r' : left < 24 ? 'w' : ''}">剩 ${dur(left)}</span>`;

/* ---------- 时限 ---------- */
function ruleLimit(s) {
  if (s.queue === 'verify') return s.lv >= 3 ? RULES.lim.verify3 : RULES.lim.verify2;
  return RULES.lim[s.queue] ?? null;
}
/* 时限在学生进入某一层时写死；之后改规则只影响新进入的学生 */
function limitOf(s) {
  if (!['L1', 'L2', 'L3'].includes(s.stage)) return null;
  const key = s.stage + '|' + s.queue; if (s.limKey !== key) { s.limKey = key; s.lim = ruleLimit(s); } return s.lim;
}
const leftOf = s => { const l = limitOf(s); return l == null ? null : l - hrs(s.since); };
const overdue = s => { const l = leftOf(s); return l != null && l < 0; };
const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString();
const nudgedToday = s => sameDay(s.nudged, NOW);
const fLeft = s => s.fdue ? (s.fdue - NOW) / H : null;
const fdueNow = s => s.stage === 'follow' && s.fdue && fLeft(s) <= 0;
/* 口径：到期 = 已到随访时间；逾期 = 到期超过 2 天 */
const fOver = s => fdueNow(s) && fLeft(s) < -RULES.lim.fdue;
const fdueTag = s => fOver(s) ? `<span class="due r">逾期 ${dur(fLeft(s))}</span>` : `<span class="due w">已到期 ${dur(fLeft(s))}</span>`;
const holder = s => s.stage === 'L1' ? s.follower : s.stage === 'L2' ? s.assignee : s.stage === 'follow' ? (s.owner || s.follower) : s.stage === 'L3' ? null : null;
const byDue = a => a.slice().sort((x, y) => (leftOf(x) ?? fLeft(x) ?? 1e9) - (leftOf(y) ?? fLeft(y) ?? 1e9));
const activeBook = s => BOOK.find(b => b.sid === s.id && ['audit', 'confirm', 'ok', 'change', 'pool'].includes(b.st));
const bLimit = b => SU(b.sid) && curLv(SU(b.sid)) >= 5 ? RULES.lim.book5 : RULES.lim.book;
const bLeft = b => ['audit', 'confirm'].includes(b.st) ? bLimit(b) - hrs(b.at) : null;
const auditor = b => b.auditor || SU(b.sid).follower;
const crisisNew = () => CRISES.filter(k => k.st === 'new').sort((a, b) => a.at - b.at);
/* 紧急报告（学院 / 他人报告、学生主动求助）按分钟确认；普通危机 12 小时 */
const kLim = k => k.urgent ? RULES.urgentMin / 60 : 12;
const kEsc = k => k.urgent ? [RULES.urgentMin / 60, 2] : [RULES.esc, RULES.esc2];
const cLeft = k => kLim(k) - hrs(k.at);
/* 12 小时内接收率：分母含已超过 12 小时仍未接收的 */
const recvRate = () => { const rec = CRISES.filter(k => k.recv), late = CRISES.filter(k => k.st === 'new' && cLeft(k) < 0), n = rec.length + late.length; const ok = rec.filter(k => (k.recv.at - k.at) / H <= kLim(k)).length; return { ok, n, txt: n ? `${ok}/${n}` : '—' }; };
const slotDate = (day, t) => { const d = day < 0 ? new Date(2026, 9, 9) : new Date(DD(day)); const [h, m] = TIMES[t].split(':'); d.setHours(+h, +m, 0, 0); return d; };
const todayIdx = () => DAYS.findIndex(d => sameDay(d, NOW));
/* 未提交排班：接下来两个工作日，某位咨询师一个时段都没开放 */
const UNPUB = () => { const r = [], t = todayIdx(); ['c1', 'c2', 'c3', 'c4', 'c5'].forEach(c => [t + 1, t + 2].forEach(d => { if (d > 0 && d < DAYS.length && SCHED[c][d].every(v => v === 'off')) r.push({ cid: c, day: dayLbl(d), d }); })); return r; };
const slotTxt = b => `${dayLbl(b.day)} ${TIMES[b.t]}`;
function setSlot(cid, day, t, v) { if (day >= 0 && SCHED[cid] && SCHED[cid][day]) SCHED[cid][day][t] = v; }

/* ---------- 日志与通知 ---------- */
function log(t, s, o = {}) {
  NOW.setTime(NOW.getTime() + 60e3);
  const at = new Date(NOW), who = o.sys ? '系统' : ST(me()).name;
  AUDIT.unshift({ k: o.k || '', at, uid: o.sys ? 'sys' : me(), role: o.sys ? '系统' : (o.cat === '配置' && S.role !== 'ADM' && isAdm() ? 'ADMx' : S.role), t, sid: s ? s.id : null, obj: o.obj || '', cat: o.cat || '流转' });
  if (s && !o.noTl) s.tl.push({ at, t: o.tl || t, who, k: o.k || 'misc', r: o.r });
}
function toast(t) { S.toast = t; clearTimeout(S.tt); S.tt = setTimeout(() => { S.toast = ''; render(); }, 2600); }
function move(s, stage, queue, extra = {}) { Object.assign(s, { stage, queue, since: new Date(NOW), limKey: null, ack: null, viewed: null }, extra); }
const l2For = s => (RULES.colL2 && RULES.colL2[s.college]) || (s.college === '李光前医学院' ? 'c3' : 'c1');   // v1.18：学院对口咨询师可在「成员管理」里调整

/* ---------- 时钟推进后的自动规则 ---------- */
function tick() {
  CRISES.forEach(k => {
    if (k.st !== 'new') return; const s = SU(k.sid);
    const [e1, e2] = kEsc(k), t1 = k.urgent ? `${RULES.urgentMin} 分钟` : `${e1} 小时`, t2 = `${e2} 小时`;
    if (hrs(k.at) >= e1 && k.esc < 1) { k.esc = 1; if (k.urgent) { notify(DUTY[0].who, '电话（追呼）', `紧急报告 ${t1} 未确认，再次呼叫`, k.id); k.notified.push(`${ST(DUTY[0].who).name}（追呼 · 电话）`); } notify('c5', '短信 + 电话', `危机已 ${t1} 无人接收，升级到中心负责人`, k.id); k.notified.push('朱静（升级 · 短信 + 电话）');
      log(`危机 ${t1} 无人接收，${k.urgent ? '再次呼叫值班并' : '自动'}升级到中心负责人朱静`, s, { sys: 1, cat: '危机', r: 1, k: 'crisis' }); if (k.by) notify(k.by, '站内', `你报告的紧急情况 ${t1} 未确认，已再次呼叫并通知中心负责人`, k.id); }
    if (hrs(k.at) >= e2 && k.esc < 2) { k.esc = 2; notify('vp', '电话', `危机已 ${t2} 无人接收，二级升级到分管领导`, k.id); k.notified.push('何处长（二级升级 · 电话）');
      log(`危机 ${t2} 无人接收，二级升级到学生事务处分管领导`, s, { sys: 1, cat: '危机', r: 1, k: 'crisis' }); }
  });
  STU.forEach(s => { if (s.stage === 'L1' && s.queue === 'pending' && s.next && s.next <= NOW && !s.nextNotified) { s.nextNotified = true; notify(s.follower, '站内', `「待补充信息」到了约定时间：${nm(s)}`, s.id); } });
  BOOK.forEach(b => { if (['audit', 'confirm'].includes(b.st) && bLeft(b) < 0) { b.st = 'pool'; b.src = '超时未确认 → 待办池'; notify('c5', '站内', '1 个预约超时未确认，进入待办池', b.id); log('预约超时未确认，自动进入待办池', SU(b.sid), { sys: 1, cat: '预约', k: 'book' }); } });
  BOOK.forEach(b => { if (b.st === 'ok' && slotDate(b.day, b.t).getTime() + H < NOW.getTime()) { b.st = 'record'; notify(b.cid, '站内', '有 1 次咨询已结束，请写记录', b.id); } });
  STU.forEach(s => { if (s.stage === 'invited' && hrs(s.invAt) >= 48 && !activeBook(s)) { move(s, 'L2', 'noresp', { src: '邀请 48 小时未回应' }); log('预约邀请 48 小时未回应，回到 L2 跟进', s, { sys: 1, k: 'inv' }); } });
}

/* ---------- 队列 ---------- */
function queues(u = me(), r = S.role) {
  if (r === 'ADM') return [];
  if (r === 'L1' || r === 'L1s') return [
    { k: 'verify', n: '待核实', items: STU.filter(s => s.stage === 'L1' && s.queue === 'verify' && s.follower === u) },
    { k: 'pending', n: '待补充信息', items: STU.filter(s => s.stage === 'L1' && s.queue === 'pending' && s.follower === u) },
    { k: 'fdue', n: '随访到期', items: STU.filter(s => fdueNow(s) && !s.owner && s.follower === u) },
    ...(r === 'L1' ? [{ k: 'asks', n: '中心请求协助', items: STU.filter(s => s.follower === u && (s.asks || []).some(a => !a.done)) }] : [])];
  const mineB = st => BOOK.filter(b => st.includes(b.st) && b.cid === u);
  if (r === 'L2') return [
    { k: 'review4', n: '待复核 · 密切关注', items: STU.filter(s => s.stage === 'L2' && s.queue === 'review4' && s.assignee === u) },
    { k: 'up', n: '待复核 · 上推', items: STU.filter(s => s.stage === 'L2' && ['up', 'review3', 'quality'].includes(s.queue) && s.assignee === u) },
    { k: 'batch', n: '批量确认 · 重点关注', items: STU.filter(s => s.stage === 'L2' && s.queue === 'batch' && s.assignee === u) },
    { k: 'sample', n: '抽查', items: STU.filter(s => s.stage === 'L2' && s.queue === 'sample' && s.assignee === u) },
    { k: 'declined', n: '拒绝 / 未回应邀请', items: STU.filter(s => s.stage === 'L2' && ['declined', 'noresp'].includes(s.queue) && s.assignee === u) },
    { k: 'fdue', n: '我负责的 · 随访到期', items: STU.filter(s => fdueNow(s) && s.owner === u) },
    { k: 'bnew', n: '新预约', book: BOOK.filter(b => b.cid === u && b.st === 'ok' && b.fresh) },
    { k: 'bconfirm', n: '预约待确认 / 改期', book: mineB(['confirm', 'change']) },
    { k: 'record', n: '待写记录', book: mineB(['record']) }];
  return [
    { k: 'hard', n: '疑难上推', items: STU.filter(s => s.stage === 'L3' && s.queue === 'hard') },
    { k: 'down', n: '降级审批', items: STU.filter(s => s.stage === 'L3' && s.queue === 'down') },
    { k: 'over', n: '超时升级', items: STU.filter(s => (['L1', 'L2'].includes(s.stage) && overdue(s)) || fOver(s)) },
    { k: 'pool', n: '预约待办池', book: BOOK.filter(b => b.st === 'pool') },
    { k: 'fdue', n: '我负责的 · 随访到期', items: STU.filter(s => fdueNow(s) && s.owner === u) },
    { k: 'mineB', n: '我的预约待处理', book: mineB(['confirm', 'change', 'record']) }];
}
const qCount = q => (q.items || q.book || []).length;

/* ---------- 学生所在层 ---------- */
function layer(s) {
  if (isL1()) return s.stage === 'L1' && s.queue === 'pending' ? '<span class="pill w">待补充信息</span>' : { L1: '<span class="pill p">待我核实</span>', follow: fdueNow(s) ? '<span class="pill w">随访到期</span>' : '<span class="pill g">随访中</span>', done: '<span class="pill">已结束</span>', redo: '<span class="pill w">待重做</span>' }[s.stage] || '<span class="pill">处理中</span>';
  if (s.stage === 'crisis') { const k = CRISES.find(c => c.sid === s.id && c.st !== 'closed'); return k && k.st === 'new' ? '<span class="pill r">危机 · 未接收</span>' : '<span class="pill r">危机 · 处置中</span>'; }
  const Q = { verify: '<span class="pill">L1 · 待核验</span>', pending: '<span class="pill w">L1 · 待补充信息</span>', quality: '<span class="pill w">L2 · 作答质量待核实</span>', review4: '<span class="pill p">L2 · 待复核</span>', review3: '<span class="pill p">L2 · 逐一复核</span>', up: '<span class="pill p">L2 · 上推复核</span>', batch: '<span class="pill p">L2 · 批量确认</span>', sample: '<span class="pill p">L2 · 抽查</span>', declined: '<span class="pill w">L2 · 拒绝邀请</span>', noresp: '<span class="pill w">L2 · 邀请未回应</span>', hard: '<span class="pill w">L3 · 疑难</span>', down: '<span class="pill w">L3 · 降级审批</span>' };
  if (Q[s.queue] && ['L1', 'L2', 'L3'].includes(s.stage)) return Q[s.queue];
  if (s.stage === 'follow') return fdueNow(s) ? '<span class="pill w">随访到期</span>' : `<span class="pill g">随访中${s.cycle === 1 ? ' · 24 小时' : ''}</span>`;
  return { invited: '<span class="pill g">已邀请预约</span>', redo: '<span class="pill w">待重做</span>', done: s.archived ? '<span class="pill">已归档</span>' : '<span class="pill">已结束</span>' }[s.stage] || '<span class="pill">—</span>';
}
const layerTxt = s => layer(s).replace(/<[^>]+>/g, '');

STU.forEach(limitOf);
