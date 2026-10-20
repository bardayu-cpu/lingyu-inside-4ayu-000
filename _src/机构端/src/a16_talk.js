/* =====================================================================
   v1.14 · 预约谈心独立页面（dev/预约谈心-独立页面方案.md 第四稿，10/19 用户「开工」）
   · 谁收到任务谁谈：辅导员、任课老师、中心老师；能不能派活由系统管理员勾选（默认 L3）
   · 事项（ITEMS）→ 邀约（INV）→ 谈话记录（TALKS）；转到中心的进「转来的」（XF）
   · 危机词命中走「报告紧急情况」通道；危机期间冻结在途事项，结案时逐条恢复或取消
===================================================================== */

/* ---------- 1. 角色：任课老师；派活权限 ---------- */
STAFF.t1 = { name: '吴老师', role: 'T', title: '任课老师（南洋商学院 · 会计学）', cols: ['南洋商学院'], on: true, by: 'c5', at: ago(24 * 20) };
STAFF.t2 = { name: 'Tan 老师', role: 'T', title: '任课老师（工程学院 · 机械工程）', cols: ['工程学院'], on: true, by: 'c5', at: ago(24 * 12) };
ACCTS.t1 = ['T']; RN.T = '任课老师'; COL.T = 1;
MENUS.T = [['talk', '谈心', 'chat']];
MENUS.L1.push(['talk', '谈心', 'chat']);
['L2', 'L3'].forEach(r => MENUS[r].splice(MENUS[r].findIndex(m => m[0] === 'booking') + 1, 0, ['talk', '谈心', 'chat']));
TITLES.talk = '谈心';
RULES.dispatch = { L2: false, L3: true };                 // 谁能派活：系统管理员在「设置 · 角色权限」里勾，默认只勾 L3
const canDispatch = (r = S.role) => !!RULES.dispatch[r];
const TALKERS = () => Object.keys(STAFF).filter(u => ['L1', 'T', 'L2', 'L3'].includes(STAFF[u].role) && STAFF[u].on !== false);
const isT = () => S.role === 'T';
const staffCols = u => STAFF[u].cols || (STAFF[u].role === 'L1' ? COLLEGES.filter(c => FOLLOWER_OF[c] === u) : null);   // null = 中心老师，不分学院
const crossCol = (u, s) => { const c = staffCols(u); return !!c && !c.includes(s.college); };
const dutyNow = () => DUTY[0].who;
const tagOf = u => STAFF[u].role === 'T' ? '任课老师' : STAFF[u].role === 'L1' ? '辅导员' : '心理中心';
/* v1.16（决定 7）：老师全名，学生端统一显示「全名 老师（岗位）」 */
Object.assign(STAFF.u1, { full: '周也' }); Object.assign(STAFF.u2, { full: '郑可' }); Object.assign(STAFF.t1, { full: '吴敏' }); Object.assign(STAFF.t2, { full: 'Tan Mei Ling' });
const fullOf = u => STAFF[u].full || STAFF[u].name;
const stuName = u => `${fullOf(u)} 老师（${tagOf(u)}）`;
const inCrisis = sid => CRISES.some(k => k.sid === sid && k.st !== 'closed');

/* ---------- 2. 事项 ---------- */
const ITEMS = [], INV = [], XF = [], TELL = [];
const PRIMARY = {};                                     // 改派覆盖默认：学生 id → 新的主跟进人
const ISRC = { auto: '谈心任务', center: '中心请求', next: '我约定的下次' };
const IST = { open: '待处理', frozen: '已冻结', reported: '已上报中心', done: '已完成', closed: '已结束', withdrawn: '已撤回', paused: '已暂停' };
const primaryOf = s => PRIMARY[s.id] || s.follower || FOLLOWER_OF[s.college];
let itN = 0, ivN = 0, xfN = 0;
function addItem(o) { const x = Object.assign({ id: 'it' + (++itN), at: new Date(NOW), st: 'open', ver: 1, moved: [], src: 'auto' }, o); x.due = x.due || later(7 * 24); ITEMS.push(x); return x; }
const itOpen = x => ['open', 'frozen', 'reported'].includes(x.st);
const itOpen2 = x => itOpen(x) || x.st === 'paused';   // v1.17：移交、改派时暂停中的也算在办
const itDue = x => x.st === 'open' && (!x.startAt || x.startAt <= NOW);
const itOver = x => x.st === 'open' && itDue(x) && x.due < NOW;
const myItems = (u = me()) => ITEMS.filter(x => x.to === u && itOpen(x));
const freqOf = s => RULES.talkFreq[curLv(s)];
/* 有效谈心：谈话对象含学生本人、结果是「已谈」、不是草稿、不是补录 */
const effTalk = t => !t.draft && !t.backfill && (t.result || '已谈') === '已谈' && (t.who || ['本人']).includes('本人');
const talkN = (s, d) => TALKS.filter(t => (t.sids || [t.sid]).includes(s.id) && effTalk(t) && !((t.pp || {})[s.id] || {}).absent && (NOW - t.at) / 864e5 <= d).length;
const freqTxt = s => { const f = freqOf(s); return f && f.n ? `最近 ${f.d} 天需谈 ${f.n} 次，已谈 ${talkN(s, f.d)} 次` : ''; };
const itWhy = x => x.src === 'auto' ? freqTxt(SU(x.sid)) || '按关注等级派发' : x.why || '';
/* 自动派发：每天检查一次；危机中、中心在跟进的学生不派；已有待办或邀约不再派 */
function itSync(quiet) {
  STU.forEach(s => { if (!ttEligible(s) || s.l2take || inCrisis(s.id) || (s.tkPauseTo && s.tkPauseTo > NOW)) return; const f = freqOf(s); if (talkN(s, f.d) >= f.n) return;
    if (ITEMS.some(x => x.sid === s.id && (itOpen(x) || x.st === 'paused')) || INV.some(v => v.sid === s.id && ['wait', 'ok', 'change', 'wait2'].includes(v.st))) return;
    const to = primaryOf(s); if (!to || STAFF[to].on === false) return; const x = addItem({ sid: s.id, to, src: 'auto' });
    if (!quiet) { log(`系统派发谈心任务：${freqTxt(s)}`, s, { k: 'talkTask', sys: 1, noTl: 1, obj: '谈心任务' }); notify(to, '站内', `新的谈心任务：${s.name}`, s.id); } });
  ITEMS.forEach(x => { if (itOver(x) && (NOW - x.due) / 864e5 >= 7 && !x.escd) { x.escd = new Date(NOW); notify('c5', '站内', `谈心事项超期 7 天以上：${SU(x.sid).college} 1 位学生`, x.sid); if (!quiet) log('谈心事项超期 7 天，已通知中心', SU(x.sid), { k: 'talkTask', sys: 1, noTl: 1, obj: '谈心任务' }); } });
}
ttSync = itSync;
/* v1.13 的演示任务转成事项；旧的「下次谈心」转成「我约定的下次」 */
Object.values(TT).forEach(t => { if (!t.done) addItem({ sid: t.sid, to: t.to, src: 'auto', at: t.at, due: t.due, escd: t.escd }); });
Object.keys(TT).forEach(k => delete TT[k]);
TALKS.forEach(t => { Object.assign(t, { situ: t.situ || t.points, result: '已谈', who: ['本人'], mode: { 面谈: '面对面', 线上: '视频' }[t.mode] || t.mode, savedAt: t.savedAt || t.at, shares: [], forced: !!t.center, types: [], adds: t.adds || [], hist: t.hist || [], sis: !t.center });
  if (t.mode === '面对面' && !t.place) t.place = '办公室';
  if (t.nextAt && !TALKS.some(t2 => t2.sid === t.sid && t2.at > t.at)) addItem({ sid: t.sid, to: t.by, src: 'next', at: t.at, startAt: t.nextAt, due: new Date(t.nextAt.getTime() + 7 * 864e5), rec: t.id }); });
(() => { const chen = CORE.chen, a = chen && openAsk(chen); if (a && a.what === '请安排一次谈心') { a.item = addItem({ sid: chen.id, to: chen.follower, src: 'center', by: a.by, why: a.note, at: a.at, due: a.due }).id; } })();

/* ---------- 3. 邀约 ---------- */
const VST = { wait: '待确认', ok: '已确认', change: '学生想换时间', wait2: '新时间待学生确认', no: '学生不想谈', frozen: '已冻结', expired: '已失效', cancel: '已取消', done: '已写记录' };
const MODES = ['面对面', '电话', '语音', '视频', '即时消息', '邮件'], PLACES = ['寝室', '教室', '办公室', '其他'];
const addInv = o => { const v = Object.assign({ id: 'iv' + (++ivN), at: new Date(NOW), st: 'wait', d: 'ok', ver: 1, hist: [], items: [] }, o); INV.push(v); return v; };
const ivTime = v => `${dayTxt(v.start)} ${pad(v.start.getHours())}:${pad(v.start.getMinutes())}–${pad(v.end.getHours())}:${pad(v.end.getMinutes())}`;
const dayTxt = d => `${d.getMonth() + 1}/${d.getDate()} 周${'日一二三四五六'[d.getDay()]}`;
const ivWhere = v => v.mode === '面对面' ? `在${v.place === '办公室' ? '学院办公室' : v.place || '学院办公室'}` : `用${v.mode}`;
const ivFill = v => ['ok', 'wait', 'wait2', 'expired'].includes(v.st) && v.end < NOW && !v.outcome;     // 自动过期的也能补     // 时间过了还没写记录 → 待补记录
const ivMsg = v => `${stuName(v.by)} 约你 ${ivTime(v)} ${ivWhere(v)}聊聊`;
const SMS_NO = '如果这次不需要，请到线上平台回复「不用了」：lingyu.ntu.edu.sg/m';
/* 失联：只算「已送达但没回应」和「联系不上」；送达失败、已失效的不算 */
/* 老师取消、危机期间错过的不算，也不打断连续 */
// v1.17：连续未回应 = 邀约未回应 / 未到 + 直接写的「学生未到 / 联系不上」记录（决定 17）；老师取消、危机期间错过的跳过
const MISSR = ['学生未到', '联系不上'];
const missLog = s => { const ev = INV.filter(v => v.sid === s.id && v.start <= NOW && v.st !== 'cancel' && v.outcome !== '老师取消' && !v.fzMiss && (v.miss || v.reply || v.outcome)).map(v => ({ at: v.start, miss: !!v.miss, why: v.miss ? (v.outcome || '邀约没有回应') : '学生回应了邀约', inv: v.id, rec: v.rec }));
  TALKS.filter(t => !t.draft && !t.backfill && (t.sids || [t.sid]).includes(s.id) && !INV.some(v => v.rec === t.id)).forEach(t => { const ab = ((t.pp || {})[s.id] || {}).absent;
    if (MISSR.includes(t.result)) ev.push({ at: t.at, miss: true, why: t.result + '（谈话记录）', rec: t.id });
    else if (!ab && effTalk(t)) ev.push({ at: t.at, miss: false, why: '谈过', rec: t.id }); });
  const out = []; for (const e of ev.sort((a, b) => b.at - a.at)) { if (!e.miss) break; out.push(e); } return out; };
const missN = s => missLog(s).length;
(() => { const chen = CORE.chen; if (!chen) return; const st = new Date(2026, 9, 14, 15, 0), en = new Date(2026, 9, 14, 15, 30); const it = ITEMS.find(x => x.sid === chen.id && x.src === 'center');
  const v = addInv({ id: 'iv1', sid: chen.id, by: chen.follower, start: st, end: en, mode: '面对面', place: '办公室', items: it ? [it.id] : [], at: ago(2), sms: 1 }); if (it) it.inv = v.id; ivN = 1; })();

/* ---------- 4. 转来的（中心工作台） ---------- */
const XT = { rep_no: '上报中心 · 不需要谈', rep_take: '上报中心 · 请中心接手', interv: '希望介入', decline: '学生不想谈', lost: '失联', xcol: '跨学院转派确认', corr: '申请更正', unfz: '申请解冻' };
const XST = { wait: '等待接收', recv: '已接收', closed: '已结束', back: '已退回', ok: '已同意', no: '不同意' };
const respL2 = s => s.owner || (s.stage === 'L2' && s.assignee) || null;
function addXf(type, s, o = {}) { const l3 = ['xcol', 'corr', 'unfz'].includes(type), x = Object.assign({ id: 'xf' + (++xfN), type, sid: s.id, from: me(), to: l3 ? null : respL2(s), l3only: l3, at: new Date(NOW), st: 'wait', note: '' }, o); XF.push(x);
  if (x.to) notify(x.to, '站内', `转来 1 件事：${XT[type]} · ${nm(s)}`, s.id); else ['c4', 'c5'].forEach(u => notify(u, '站内', `转来 1 件事，${l3 ? '请处理' : '还没有负责的咨询师，请分配'}：${XT[type]}`, s.id));
  log(`转给中心：${XT[type]}${x.note ? `（${x.note}）` : ''}`, s, { k: 'xfer', obj: '谈心任务', noTl: 1 }); return x; }
const xfMine = (u = me(), r = S.role) => XF.filter(x => ['wait', 'recv'].includes(x.st) && (x.to === u || (r === 'L3' && !x.to)));
const xfRecv = x => x.to ? ST(x.to).name : x.l3only ? '中心负责人 / 高级咨询师' : '待 L3 分配';

/* ---------- 5. 谁能看一条记录 ---------- */
const PARTS = [['situ', '学生的情况'], ['types', '情况类型'], ['need', '学生表达的需要'], ['next', '下次谈心']];
const shareOn = sh => !sh.off && sh.exp > NOW;
/* v1.16：写的人和接任者看全文；回传中心的记录中心看全文（优先于部分分享）；分享只给勾的部分 */
const recOwner = (t, u = me()) => !!t && (t.by === u || t.heir === u);
function recVis(t, u = me(), r = S.role) {
  if (!t) return null; if (recOwner(t, u)) return 'full'; if (t.draft || ['ADM', 'L1s'].includes(r)) return null;
  const ids = t.sids || [t.sid], forced = t.forced || t.center || t.share || t.risk;
  if (forced && r === 'L3') return 'full';
  if (forced && r === 'L2' && (ids.some(id => [SU(id).owner, SU(id).assignee].includes(u)) || XF.some(x => x.to === u && ['wait', 'recv', 'closed'].includes(x.st) && (x.rec === t.id || ids.includes(x.sid))))) return 'full';
  if (CRISES.some(k => k.st !== 'closed' && (k.fromRec === t.id || (k.recs || []).includes(t.id))) && dutyNow() === u) return 'full';    // 危机期间：当班值班可以读触发危机和之后补充的记录
  const sh = (t.shares || []).find(x => x.to === u && shareOn(x)); if (sh) return sh.parts;
  return null; }
const expiredShare = (t, u = me()) => (t.shares || []).find(x => x.to === u && !x.off && x.exp <= NOW);   // 收回的不再出现在对方列表里

/* ---------- 6. 小工具：悬停提示、「?」、等级 ---------- */
const HINT = {
  moveMiss: '名单先列同学院的辅导员。其他学院的老师也能搜，选了要等心理中心确认。',
  moveWait: '跨学院转派要心理中心确认，确认后会通知你。',
  tMiss: '任课老师要先由心理中心负责人在「设置 · 成员」里添加。',
  sMiss: '只能选你管理范围内的学生。管理范围请联系系统管理员。',
  lock: '超过 24 小时只能追加。需要更正已写的内容，请点「申请更正」，由心理中心负责人批准。',
  noDel: '任务不能删除。不需要谈的话，请点「上报中心」，选「不需要谈」。',
  gone: '这个任务已由心理中心改派或撤回，你不用再处理。',
  exp: '分享已过期。需要继续查看，请点「联系分享人」。' };
const hintB = (txt, k, cls = 'btn ghost xs') => `<button class="${cls} dis" data-act="hint" data-arg="${k}" title="${HINT[k]}">${txt}</button>`;
const hintQ = k => `<button class="hq" data-act="hint" data-arg="${k}" title="${HINT[k]}">?</button>`;
const pageQ = () => `<button class="pq" data-act="memoOpen" title="这一页的功能说明">?</button>`;
/* D2：辅导员全系统都能看到关注等级（不含信号格、分数、报告） */
const lvSeen = () => canLv() || S.role === 'L1' || isT();
const lvT = s => lvSeen() ? lvB(curLv(s)) : '';
