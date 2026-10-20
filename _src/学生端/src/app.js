/* =====================================================================
   学生端交互逻辑
   · 界面文案在 stu.html；这里只有拼装逻辑和少量动态文案（L('中文','English')）
===================================================================== */
let S;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const I = (n, cls = '') => `<svg class="ic ${cls}"><use href="#i-${n}"/></svg>`;
const pickLang = s => s.replace(/\[\[([\s\S]*?)\|([\s\S]*?)\]\]/g, (_, zh, en) => LANG === 'en' ? en : zh);
function tpl(id, d = {}) {
  const t = document.getElementById(id); if (!t) return '';
  return pickLang(t.innerHTML).replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (k === 'M') return MASCOT;
    if (k === 'MF') return MASCOT_FULL;
    if (k === 'BG') return LAUNCH_BG;
    if (k in d) return d[k] ?? '';
    if (k === 'iCheckS') return I('check', 's');
    if (/^i[A-Z]/.test(k)) return I(k.slice(1).toLowerCase());
    if (k === 'lang') return langBtn();
    return '';
  });
}
const C = id => DATA.counsellors.find(c => c.id === id);
const ci = id => DATA.counsellors.findIndex(c => c.id === id);
const who = c => L(/^[\u4e00-\u9fa5]/.test(c.name) ? `${c.name}老师` : `${c.name} 老师`, c.name);
/* 写入消息时用中文名 */
const whoZ = id => { const n = DATA_ZH.counsellors.find(c => c.id === id).name; return /^[\u4e00-\u9fa5]/.test(n) ? `${n}老师` : `${n} 老师`; };
const P = () => DATA.people[S.scen];
const SEP = () => L('，', ', ');
/* 示例学生的姓名随语言切换；手动填写的保持原样 */
const prof = () => { const p = S.profile || P(); return p.sid === P().sid ? { ...p, name: p._nameEdited ? p.name : P().name, ecName: p._ecEdited ? p.ecName : P().ecName } : p; };
const WDS = () => LANG === 'en' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDay = d => L(`${d.getMonth() + 1} 月 ${d.getDate()} 日 ${WDS()[d.getDay()]}`, `${WDS()[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`);
const shortDay = d => L(`${d.getMonth() + 1} 月 ${d.getDate()} 日`, `${d.getDate()} ${MON[d.getMonth()]}`);
const langBtn = () => `<button class="lang" data-act="lang" aria-label="language">${I('globe', 's')}<b>${LANG === 'en' ? 'EN' : '中'}</b> / ${LANG === 'en' ? '中' : 'EN'}</button>`;
const TOASTS = { saved: ['卡片已保存', 'Card saved'], linkCopied: ['链接已复制，7 天内有效', 'Link copied — valid for 7 days'], imgSaved: ['分享图已保存', 'Image saved'] };

/* 任务与问卷 */
const TD = t => DATA.tasks.find(d => d.id === t.id);
const TS = t => DATA.scales.filter(s => TD(t).scales.includes(s.k));
/* 问卷分页：每页不超过 5 题；已沿用的问卷不再出现 */
const qpages = t => TS(t).filter(sc => !t.reused[sc.k]).flatMap(sc => { const n = sc.items.length, cut = Math.ceil(n / 2); return [{ k: sc.k, a: 0, b: cut }, { k: sc.k, a: cut, b: n }]; });
/* 已完成：包括已完成后正在进行的新一轮对话（新一轮不影响任务完成状态） */
const isDone = t => t.phase === 'done' || !!t.redo;
const inProg = t => t.phase === 'scale' || t.phase === 'chat' || t.phase === 'bridge';
/* 排序：未完成在前；必做先于选做；进行中先于未开始；再按截止日期；已完成、已过期在后 */
const rankT = t => t.phase === 'expired' ? 9 : isDone(t) ? 8 : t.declined ? 5 : (TD(t).req ? 0 : 2) + (inProg(t) ? 0 : 1);
const sortedTasks = () => [...S.tasks].sort((x, y) => rankT(x) - rankT(y) || TD(x).due.localeCompare(TD(y).due));
/* 14 天内在其他任务里做完的同一份问卷，直接沿用 */
function reuseFrom(t, k) {
  for (const u of S.tasks) { if (u === t) continue; const sc = DATA.scales.find(s => s.k === k), a = u.ans[k];
    const when = u.doneAt || u.scaleAt; if (a && sc && a.filter(v => v != null).length === sc.items.length && when && (NOW - when) / 864e5 <= DATA.reuseDays) return { a, when }; }
  return null;
}
const progTxt = t => t.phase === 'scale' ? L(`问卷已答 ${answered(t)}/${nQ(t)}`, `${answered(t)} of ${nQ(t)} answered`) : t.phase === 'chat' ? L(`和小屿聊了 ${t.rounds} 轮`, `${t.rounds} rounds with Xiaoyu`) : '';

/* ---------- 状态 ---------- */
function newTask(d = DATA.tasks[0]) { return { id: d.id, phase: d.expired ? 'expired' : 'none', ans: Object.fromEntries(d.scales.map(k => [k, []])), reused: {}, scaleAt: null, miss: [], pg: 0, msgs: [], qi: 0, rounds: 0, concern: 0, scaleLv: 1, lv: 0, crisis: false, safeShown: false, paused: false, doneAt: null }; }
function reset(scen = 'A') {
  S = { scen, page: 'launch', inbox: [], foot: [], inboxOpen: false, sv: 'todo', fun: { cur: null, ans: [], miss: [], res: {} }, ec: {},
         auth: false, profile: null, f: { gender: '', campus: '', college: '', ecRel: '' },
        consent: { read: false, ok: false }, phone: '', cc: '+65', code: '', codeSent: false, cd: 0, err: {}, rosterFail: false, schoolOpen: false, schoolQ: '',
        tasks: [], history: [], bk: null, bkHist: [], owner: null, chg: null, bookTab: 'time', day: 0, campus: DATA.campuses[0],
        resch: false, pick: null, form: { mode: '线下', topics: [] }, garden: { tab: '全部', last: null, cur: null, step: 0 },
        ops: [], modal: null, menu: false, after: null, invited: false, toast: '', rec: 0, fb: {}, fast: false };
  /* 新生没有历史内容；再次使用的学生才会有已过期的任务 */
  S.tasks = DATA.tasks.filter(d => SCENES[scen].returning || !d.expired).map(d => newTask(d)); S.task = S.tasks[0];
  if (SCENES[scen].returning) {
    S.profile = { ...P() }; S.auth = false;
    S.history = [{ name: ['2026 春季学期心理健康普测', 'Semester 2, 2026 Wellbeing Check'], at: new Date(2026, 2, 9), rounds: 11, mins: 31, card: 'calm' }];
    Object.assign(S.task, { phase: 'done', rounds: 6, doneAt: new Date(2026, 9, 8), lv: 2, scaleLv: 2, msgs: demoTranscript(), ans: { phq9: [...FILLS.mild.phq9], gad7: [...FILLS.mild.gad7] } });
    S.owner = 'c4';
    S.bkHist = [{ cid: 'c1', at: new Date(2026, 8, 2, 10, 30), kind: '预咨询', st: '已完成' }, { cid: 'c4', at: new Date(2026, 8, 16, 14, 0), kind: '正式咨询', st: '已完成' }];
    S.garden.last = { id: 'g1', step: 1 };
    S.foot = [{ at: new Date(2026, 9, 9, 21, 5), ico: 'wind', t: ['看了「4-7-8 呼吸练习」，停在第 2 步', 'Viewed “4-7-8 Breathing”, stopped at step 2'], go: 'gOpen:g1:1' },
              { at: new Date(2026, 9, 8, 16, 20), ico: 'chat', t: ['完成「2026 秋季学期心理健康普测」的问卷和访谈', 'Finished the questionnaires and chat for the Semester 1 check'], go: 'go:talks' },
              { at: new Date(2026, 8, 16, 14, 50), ico: 'cal', t: ['和王磊老师完成一次正式咨询', 'Had a counselling session with Wang Lei'], go: 'go:mybook' }];
  }
  /* 消息中心：别人发给我的 */
  const m = (at, ico, t, d, link, read) => ({ at, ico, t, d, link, read });
  S.inbox = SCENES[scen].returning ? [
    m(new Date(2026, 9, 12, 9, 0), 'list', ['新任务：期中压力小调查', 'New: Mid-term Stress Check-in'], ['来自 学院辅导员 周老师，选做，10 月 30 日截止', 'From Mr Zhou, college advisor · optional · due 30 Oct'], 'task:t2', false),
    m(new Date(2026, 9, 8, 16, 21), 'card', ['你的卡片已生成', 'Your card is ready'], ['「2026 秋季学期心理健康普测」已完成', 'Semester 1 check completed'], 'report', true),
    m(new Date(2026, 8, 30, 18, 0), 'clock', ['「新生适应追踪（第 1 次）」已截止', '“Freshmen Adjustment Follow-up (1)” has closed'], ['如需补做，请联系 UCC 重新开放', 'Contact UCC if you need it reopened'], 'myq', true),
    m(new Date(2026, 8, 16, 15, 0), 'users', ['王磊老师成为你的负责咨询师', 'Wang Lei is now your counsellor'], ['之后的预约会由王磊老师接待', 'Future sessions will be with Wang Lei'], 'cp:c4', true),
  ] : [
    m(new Date(2026, 9, 12, 9, 0), 'list', ['新任务：2026 秋季学期心理健康普测', 'New: Semester 1, 2026 Wellbeing Check'], ['来自 大学心理咨询中心（UCC），必做，10 月 19 日截止', 'From UCC · required · due 19 Oct'], 'task:t1', false),
    m(new Date(2026, 9, 12, 9, 0), 'list', ['新任务：期中压力小调查', 'New: Mid-term Stress Check-in'], ['来自 学院辅导员 周老师，选做，10 月 30 日截止', 'From Mr Zhou, college advisor · optional · due 30 Oct'], 'task:t2', false),
  ];
}
function addFoot(ico, t, go) { S.foot.unshift({ at: new Date(NOW), ico, t, go }); }
function addMsg(ico, t, d, link, sms) { S.inbox.unshift({ at: new Date(NOW), ico, t, d, link, read: false, sms }); }
/* 危机后的反馈：不提等级，只告诉学生有人会联系、现在可以找谁 */
function crisisFollow() { if (S.crisisMsg) return; S.crisisMsg = true;
  addMsg('heart', ['大学心理咨询中心会尽快联系你', 'UCC will be in touch soon'], ['谢谢你愿意说出来。UCC 的老师会尽快和你联系。如果你现在感到不安全，请拨打 1767（24 小时）或 995。', 'Thank you for telling us. A UCC counsellor will contact you soon. If you don’t feel safe right now, call 1767 (24 hours) or 995.'], 'help', true); }
const relT = d => { const sameDay = d.toDateString() === NOW.toDateString(), hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return sameDay ? L(`今天 ${hm}`, `Today ${hm}`) : shortDay(d); };
{
}
const dateTxt = d => d ? L(`${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`, `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`) : '';

/* ---------- 渲染 ---------- */
function render() {
  if (S.resch && !['book', 'cpage'].includes(S.page)) { S.resch = null; S.reschFrom = null; }
  const keep = {}; document.querySelectorAll('[data-keep]').forEach(e => keep[e.id] = e.scrollTop);
  /* 整页重绘时保留：页面滚动位置、正在输入的框和光标、已展开的问答 */
  const pgEl = document.querySelector('#app > .page'), pgTop = pgEl && S._lastPage === S.page ? pgEl.scrollTop : null;
  const ae = document.activeElement, fk = ae && (ae.id || ae.dataset.bind) && /INPUT|TEXTAREA/.test(ae.tagName) ? { id: ae.id, bind: ae.dataset.bind, a: ae.selectionStart, b: ae.selectionEnd } : null;
  const openD = [...document.querySelectorAll('details[open]')].map(d => d.dataset.k);
  const pg = PAGES[S.page] ? PAGES[S.page]() : '';
  const loggedIn = S.auth && !['launch', 'splash', 'consent', 'phone', 'info'].includes(S.page);
  $('#app').innerHTML = (S.page === 'launch' ? '' : loggedIn ? header() : tpl('hd-out')) + pg;
  $('#modal').innerHTML = S.modal ? `<div class="ov" data-act="ovClose">${MODALS[S.modal]()}</div>` : '';
  $('#toast').innerHTML = S.toast ? `<div class="toast" role="status">${I('check')}${esc(S.toast)}</div>` : '';
  renderMemo(); renderShell();
  document.querySelectorAll('[data-keep]').forEach(e => { if (keep[e.id] != null && !S.resetScroll && !S.pageTop) e.scrollTop = keep[e.id]; });
  if (S.scrollEnd) { const m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight; S.scrollEnd = false; }
  if (S.resetScroll || S.pageTop) { const m = $('#msgs') || $('.page'); if (m) m.scrollTop = 0; S.resetScroll = false; S.pageTop = false; }
  else if (pgTop != null) { const m = document.querySelector('#app > .page'); if (m) m.scrollTop = pgTop; }
  S._lastPage = S.page;
  openD.forEach(k => { const d = document.querySelector(`details[data-k="${k}"]`); if (d) d.open = true; });
  if (fk) { const el = fk.id ? document.getElementById(fk.id) : document.querySelector(`[data-bind="${fk.bind}"]`); if (el && !el.disabled) { el.focus(); try { el.setSelectionRange(fk.a, fk.b); } catch (e) {} } }
  if (S.scrollErr) { S.scrollErr = false; const e = document.querySelector('.err-t, .alert, .inp.err'); if (e) e.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
}
function header() {
  const p = S.page, b = S.bk;
  const badge = b ? (b.st === '已确认' && !b.pend ? `<span class="badge ok" title="${L('你下一次咨询的时间', 'Your next session')}">${L('已约', 'Booked')} ${shortDay(DAYS[b.di])} ${DATA.times[b.ti]}</span>` : `<span class="badge">${b.pend ? L('待老师同意', 'Pending') : b.st === '已改约' ? L('待接受新时间', 'Accept new time') : L('待确认', 'Pending')}</span>`) : '';
  const unread = S.inbox.filter(x => !x.read).length;
  return tpl('hd-in', { navHome: p === 'home' ? 'on' : '', navSv: ['surveys', 'survey', 'intro', 'fun', 'funres'].includes(p) ? 'on' : '', navAi: ['ai', 'session', 'bridge', 'talks'].includes(p) ? 'on' : '', navGarden: p === 'garden' ? 'on' : '', navBook: ['mybook', 'book'].includes(p) ? 'on' : '', navHelp: p === 'help' ? 'on' : '', navMsgs: p === 'msgs',
    bookBadge: badge, hello: esc(S.profile ? prof().name : L('同学', 'there')), menu: S.menu ? tpl('menu') : '', menuOpen: S.menu ? 'true' : 'false',
    unread: unread ? `<span class="dot">${unread}</span>` : '',
    inbox: false ? tpl('inbox', { items: S.inbox.map((x, i) => `<button class="msg ${x.read ? '' : 'new'}" data-act="msgOpen" data-arg="${i}"><span class="mi">${I(x.ico, 's')}</span><span style="flex:1"><b>${L(...x.t)}</b><small>${L(...x.d)}</small></span><small style="color:var(--mute);white-space:nowrap">${relT(x.at)}</small></button>`).join('') || `<div class="empty">${L('暂时没有消息', 'No notifications')}</div>` }) : '' });
}
const stepsBar = n => `<div class="steps">${[L('知情同意', 'Consent'), L('手机验证', 'Verify'), L('基本信息', 'About you')].map((t, i) =>
  `<div class="${i < n ? 'done' : i === n ? 'on' : ''}"><i>${i < n ? '✓' : i + 1}</i>${t}</div>`).join('')}</div>`;
const hotline = () => `<div class="hot"><p>${L('如果你现在就需要帮助，可以直接联系', 'Need help right now? Reach out directly')}</p><div><span><b>SOS</b> <a class="tel" href="tel:1767">1767</a> · ${L('24 小时', '24 h')}</span><span><b>mindline</b> <a class="tel" href="tel:1771">1771</a> · ${L('24 小时', '24 h')}</span><span><b>UCC</b> ${L('工作日 8:30–17:30', 'Weekdays 8:30–17:30')}</span></div></div>`;
/* UCC 联系方式（演示占位） */
const UCC = () => `${L('电话', 'Tel')} <a class="tel" href="tel:+6560000000">+65 6000 0000</a>${SEP()}${L('邮箱', 'Email')} ucc@example.edu.sg${SEP()}${L('学生服务中心 2 楼', 'Level 2, Student Services Centre')} <span class="demo-tag">${L('示意', 'sample')}</span>`;
const errT = m => m ? `<div class="err-t">${L(...m)}</div>` : '';
const opt = (arr, v, ph) => `<option value="" ${v ? '' : 'selected'} disabled>${ph}</option>` + arr.map(x => `<option value="${x}" ${x === v ? 'selected' : ''}>${T(x)}</option>`).join('');
/* v1.13 手机号区号：默认 +65，可选其他国家 / 地区；+65 仍校验 8 位、以 8 或 9 开头 */
const CCODES = [['+65', '新加坡', 'Singapore'], ['+60', '马来西亚', 'Malaysia'], ['+86', '中国', 'China'], ['+852', '中国香港', 'Hong Kong'], ['+62', '印度尼西亚', 'Indonesia'], ['+91', '印度', 'India'], ['+84', '越南', 'Vietnam'], ['+66', '泰国', 'Thailand'], ['+63', '菲律宾', 'Philippines'], ['+82', '韩国', 'Korea'], ['+81', '日本', 'Japan'], ['+1', '美国 / 加拿大', 'US / Canada'], ['+44', '英国', 'UK']];
const ccSel = (bind, v) => `<select class="cc" data-bind="${bind}" data-rerender aria-label="${L('国家 / 地区区号', 'Country code')}">${CCODES.map(([c, z, e]) => `<option value="${c}" ${(v || '+65') === c ? 'selected' : ''}>${c} ${L(z, e)}</option>`).join('')}</select>`;
const telOk = (cc, n) => (cc || '+65') === '+65' ? /^[89]\d{7}$/.test(n || '') : /^\d{6,12}$/.test(n || '');
const telMax = cc => (cc || '+65') === '+65' ? 8 : 12;
const telErr = (cc, who) => (cc || '+65') === '+65' ? [`请输入${who || ''} 8 位新加坡手机号`.replace('请输入 8', '请输入 8'), `Enter an 8-digit Singapore mobile${who ? ' for ' + who : ''}`] : [`请输入${who || ''}正确的手机号（6–12 位数字）`, 'Enter a valid mobile number (6–12 digits)'];
const telTxt = (cc, n) => `${cc || '+65'} ${n}`;
const ecLine = () => { const p = prof(); return [L(`${esc(p.ecName)}（${T(p.ecRel)}）`, `${esc(p.ecName)} (${T(p.ecRel)})`), telTxt(p.ecCc, p.ecTel)]; };
const nQ = (t = S.task) => TS(t).reduce((s, x) => s + x.items.length, 0);
const answered = (t = S.task) => TS(t).reduce((s, x) => s + t.ans[x.k].filter(v => v != null).length, 0);
const minsUsed = (t = S.task) => Math.round(answered(t) * 0.4) + t.rounds * 3;
const greet = () => { const h = NOW.getHours(); return h < 12 ? L('早上好', 'Good morning') : h < 18 ? L('下午好', 'Good afternoon') : L('晚上好', 'Good evening'); };

const PAGES = {
  launch: () => tpl('p-launch'),
  splash: () => PAGES.launch(),
  consent: () => tpl('p-consent', { steps: stepsBar(0), hot: hotline(), doc: tpl('doc-consent'),
    ckCls: S.consent.ok ? 'on' : S.consent.read ? '' : 'off', ckOn: S.consent.ok ? 'true' : 'false',
    readHint: S.consent.read ? '' : `<div class="note" style="margin:-8px 0 12px">${L('请向下滚动读完全部内容后再勾选', 'Scroll to the end to enable the checkbox')}</div>`,
    nextDis: S.consent.ok ? '' : 'disabled' }),
  phone: () => tpl('p-phone', { steps: stepsBar(1), phoneBack: SCENES[S.scen].returning ? 'launch' : 'consent', phone: esc(S.phone), code: esc(S.code), ccSel: ccSel('cc', S.cc), phMax: telMax(S.cc), phPh: (S.cc || '+65') === '+65' ? L('请输入 8 位手机号', '8-digit mobile number') : L('请输入手机号', 'Mobile number'),
    phErr: S.err.phone ? 'err' : '', phMsg: errT(S.err.phone), cdErr: S.err.code ? 'err' : '', cdMsg: errT(S.err.code),
    sendDis: S.cd > 0 ? 'disabled' : '', sendLbl: sendLbl() }),
  info: () => {
    const f = S.f, sch = DATA.schools.filter(s => !S.schoolQ || (s.n + T(s.n) + s.c).toLowerCase().includes(S.schoolQ.toLowerCase()));
    return tpl('p-info', { steps: stepsBar(2), name: esc(f.name), age: esc(f.age), sid: esc(f.sid), ecName: esc(f.ecName), ecTel: esc(f.ecTel), ecCcSel: ccSel('f.ecCc', f.ecCc), ecMax: telMax(f.ecCc),
      gender: ['女', '男', '其他'].map(g => `<button class="${f.gender === g ? 'on' : ''}" data-act="setF" data-arg="gender:${g}">${T(g)}</button>`).join(''),
      schoolLbl: f.school ? T(f.school) : L('请选择当前所在学校', 'Select your university'), schoolColor: f.school ? 'var(--ink)' : 'var(--mute)',
      schoolList: S.schoolOpen ? `<div class="ddl"><div class="q">${I('search', 's')}<input id="schoolQ" placeholder="${L('输入校名、简称或首字母', 'Search by name or short name')}" value="${esc(S.schoolQ)}"></div>${
        sch.length ? sch.map(s => `<button data-act="setF" data-arg="school:${s.n}"><span class="sq" style="background:${s.col}">${s.i}</span><span>${T(s.n)}<small>${s.c}</small></span></button>`).join('') : `<div class="none">${L('没有找到这所学校，换个关键词试试', 'No match — try another name')}</div>`}</div>` : '',
      campusOpts: opt(DATA.campuses, f.campus, L('请选择校区', 'Select campus')), collegeOpts: opt(DATA.colleges, f.college, L('请选择学院', 'Select college')), relOpts: opt(DATA.rels, f.ecRel, L('关系', 'Relation')),
      rosterErr: S.rosterFail ? tpl('roster-err', { ucc: UCC() }) : '', infoErr: S.err.info ? `<div class="err-t" style="margin:-4px 0 12px">${L(...S.err.info)}</div>` : '' });
  },
  home: () => {
    const list = sortedTasks(), todo = list.filter(t => !isDone(t) && t.phase !== 'expired'), main = todo[0];
    const say = !main ? L('这学期的普测都完成了。累的时候，去心理园区做个三分钟的呼吸练习吧。', 'You’re all caught up. When you’re tired, try a 3-minute breathing practice in the hub.')
      : main.declined ? L('你已选择不参加这次普测，可以随时回来参加。', 'You chose not to take part this time. You can come back anytime.')
      : main.phase === 'none' ? L('学校发布了新的心理健康普测。准备好了就开始，中途可以随时停下。', 'NTU has a new wellbeing check for you. Start when you’re ready — you can stop anytime.')
      : L('上次的进度我都帮你存好了，回来就能接着做。', 'I saved your progress. Pick up right where you left off.');
    const foot = S.foot.slice(0, 5).map((f, i) => `<button class="ev" data-act="footGo" data-arg="${i}"><span class="ei">${I(f.ico, 's')}</span><span class="grow">${L(...f.t)}</span><small>${relT(f.at)}</small>${I('right', 's')}</button>`).join('') || `<div class="empty" style="padding:22px 0">${L('你在灵屿里做过的事会记在这里。', 'Things you do here will show up here.')}</div>`;
    const recs = (SCENES[S.scen].returning ? ['g1', 'g7', 'g9', 'g5'] : ['g1', 'g7', 'g8', 'g6']).map(id => gCard(DATA.garden.find(x => x.id === id))).join('');
    const mv = S.bk && (S.bk.st === '已改约' || S.bk.pend) ? `<div style="margin-top:16px">${bkWarn(S.bk).replace('class="warnbar"', 'class="warnbar" data-act="go" data-arg="mybook" style="cursor:pointer"')}</div>` : '';
    const nx = homeExtra().length;
    return tpl('p-home', { greet: `${greet()}${SEP()}${esc(prof().name)}`, say: say, mv, todoN: L(`共 ${todo.length + nx} 项`, `${todo.length + nx} item${todo.length + nx === 1 ? '' : 's'}`),
      todos: homeExtra().concat(todo.map(todoRow)).join('') || `<div class="empty" style="padding:22px 0">${L('没有待办，照顾好自己。', 'Nothing to do right now. Take care of yourself.')}</div>`, foot, recs });
  },
  intro: () => { const t = S.task, d = TD(t), sc = TS(t), re = sc.filter(s => !t.reused[s.k] && reuseFrom(t, s.k));
    S.reuse = S.reuse || {}; re.forEach(s => { if (!(s.k in S.reuse)) S.reuse[s.k] = true; });
    const keep = re.filter(s => S.reuse[s.k]), allRe = keep.length === sc.length;
    return tpl('p-intro', { from: d.from, tName: d.name, until: L(`${d.until}（剩余 ${d.left}）`, `${d.until} (${d.left} left)`), dur: d.dur,
      incl: L(`${sc.length} 份标准化问卷${d.ai ? '，和小屿聊一聊' : ''}`, `${sc.length} standard questionnaire${sc.length > 1 ? 's' : ''}${d.ai ? ' and a chat with Xiaoyu' : ''}`),
      reuse: re.map(s => { const r = reuseFrom(t, s.k); return `<div class="strip" style="text-align:left;margin:0 0 16px;display:block"><div style="display:flex;gap:14px;align-items:center"><span class="ico">${I('later')}</span><div class="grow"><b>${L(`你在 ${shortDay(r.when)} 做过 ${s.short}`, `You answered ${s.short} on ${shortDay(r.when)}`)}</b><small>${L('勾选后直接沿用上次的回答；不勾选就重新作答。重新作答的结果只用于这项任务，之前的记录会保留。', 'Tick to reuse your previous answers, or untick to answer again. New answers apply to this check only; the earlier record is kept.')}</small></div></div>
        <div class="ck2 ${S.reuse[s.k] ? 'on' : ''}" data-act="reuseSet" data-arg="${s.k}:${S.reuse[s.k] ? 0 : 1}" style="padding-left:54px"><i>✓</i>${L(`沿用 ${shortDay(r.when)} 的 ${s.short} 回答`, `Reuse my ${s.short} answers from ${shortDay(r.when)}`)}</div></div>`; }).join(''),
      decl: d.req && t.phase === 'none' && !t.declined ? `<button class="lnkb" data-act="declAsk" style="margin-top:10px">${L('这次不参加', 'Not this time')}</button>` : '',
      goLbl: allRe && !d.ai ? L('确认提交', 'Confirm and submit') : L('开始', 'Begin'),
      top: d.ai ? `<img class="mascot" src="${MASCOT}" alt="" style="margin:8px auto 0">` : `<div class="okmark" style="background:var(--bub);color:var(--pri)">${I('list', 'l')}</div>`,
      text: d.ai ? L('你好，我是小屿。我们会先完成几份标准化问卷，再随便聊聊。这不是考试，没有标准答案。中途有事随时可以停，有效期内回来就能接着做。完成之后，你会拿到一张属于自己的卡片。', 'Hi, I’m Xiaoyu. First you’ll answer a few standard questionnaires, then we’ll chat. This isn’t a test — there are no right answers. You can stop anytime and come back before the due date. When you finish, you’ll get a card written just for you.')
        : L('这是一份简短的标准化问卷，按最近两周的实际情况作答即可。答案会提供给大学心理咨询中心，用于了解同学们的近况。', 'A short standard questionnaire. Answer based on the last 2 weeks. Your answers go to UCC to help them understand how students are doing.') }); },
  survey: surveyPage,
  bridge: () => tpl('p-bridge'),
  surveys: () => {
    const f = { todo: t => !isDone(t) && t.phase !== 'expired', done: isDone, all: () => true }[S.sv];
    const list = sortedTasks().filter(f);
    return tpl('p-surveys', { tabs: [['todo', L('待完成', 'To do')], ['done', L('已完成', 'Done')], ['all', L('全部', 'All')]].map(([k, n]) => `<button class="${S.sv === k ? 'on' : ''}" data-act="svTab" data-arg="${k}">${n}</button>`).join(''),
      tasks: list.map(taskRow).join('') || `<div class="empty" style="padding:24px 0">${S.sv === 'todo' ? L('学校发的问卷都完成了', 'You’re all caught up') : L('还没有记录', 'Nothing here yet')}</div>`,
      fun: DATA.fun.map(x => { const r = S.fun.res[x.k]; return `<button class="sc" data-act="${r ? 'funView' : 'funStart'}" data-arg="${x.k}"><span class="si" style="background:${x.bg}">${I(x.ico)}</span><span class="grow"><b>${x.name}</b><small>${x.sub}</small><span class="meta">${I('clock', 's')}${L(`约 ${x.mins} 分钟`, `${x.mins} min`)}${r ? `<em class="dn">${I('check', 's')}${L('已测', 'Done')} ${shortDay(r.at)}</em>` : ''}</span></span></button>`; }).join('') });
  },
  fun: () => { const x = DATA.fun.find(y => y.k === S.fun.cur), a = S.fun.ans, n = x.items.length, cnt = a.filter(v => v != null).length;
    const qs = x.items.map((it, i) => { const opts = x.ab ? [it[1], it[2]] : x.opts;
      return `<div class="qc ${S.fun.miss.includes(i) ? 'miss' : ''}" id="f-${i}"><p><span>${i + 1}.</span>${it[0]}</p><div class="qo ${x.ab ? 'ab' : opts.length === 5 ? 'l5' : opts.length === 6 ? 'l6' : ''}">${opts.map((o, v) => `<button class="${a[i] === v ? 'on' : ''}" data-act="funAns" data-arg="${i}:${v}">${o}</button>`).join('')}</div></div>`; }).join('');
    return tpl('p-fun', { name: x.name, src: x.src, guide: x.guide, pos: L(`已答 ${cnt}/${n}`, `${cnt} of ${n}`), pct: Math.round(cnt / n * 100), qs, mins: L(`约 ${x.mins} 分钟`, `About ${x.mins} min`) }); },
  funres: funResult,
  /* AI 访谈：上面是现在要做的，下面是记录（「我的访谈记录」指向同一页） */
  ai: () => { const t = aiTask(), d = TD(t), ph = t.phase;
    const strip = (ico, title, sub, btn) => `<div class="strip"><span class="ico">${ico}</span><div class="grow"><b>${title}</b><small>${sub}</small></div>${btn}</div>`;
    const mimg = `<img src="${MASCOT}" alt="" style="width:40px;height:40px;border-radius:12px">`;
    const cur = (ph === 'none' || ph === 'scale') ? strip(I('list'), L('先完成问卷，再和小屿聊', 'Finish the questionnaires first'), L(`「${d.name}」包含问卷和访谈。问卷完成后会自动进入和小屿的对话。`, `“${d.name}” includes questionnaires and a chat. The chat opens once the questionnaires are done.`), `<button class="btn pri sm" data-act="taskGo" data-arg="${t.id}">${ph === 'none' ? L('开始问卷', 'Start') : L('继续问卷', 'Continue')}</button>`)
      : (ph === 'chat' || ph === 'bridge') ? strip(mimg, t.redo ? L('新一轮对话进行中', 'New chat in progress') : L('和小屿的对话还没聊完', 'Your chat with Xiaoyu isn’t finished'), L(`已经聊了 ${t.rounds} 轮，进度都保存着。`, `${t.rounds} rounds so far — all saved.`), `<button class="btn pri sm" data-act="taskGo" data-arg="${t.id}">${L('继续聊', 'Continue')}</button>`)
      : ph === 'done' ? strip(mimg, L('想再和小屿聊聊？', 'Want to chat with Xiaoyu again?'), L('可以开始新一轮对话。上一轮的对话和卡片会保留在下面，任务仍然算已完成。', 'Start a new chat. Your last chat and card stay below, and the check still counts as done.'), `<button class="btn soft sm" data-act="redoAsk" data-arg="${t.id}">${I('later', 's')}${L('重新对话', 'Chat again')}</button>`) : '';
    const fbBtn = x => x.fbDone ? `<span class="pill g">${I('check', 's')}${L('已反馈', 'Feedback sent')}</span>` : `<button class="btn ghost sm" data-act="fbGo">${L('填写反馈', 'Feedback')}</button>`;
    const rows = S.tasks.filter(x => TD(x).ai && x.doneAt).map(x => `<div class="row"><span class="mini"><img src="${MASCOT}" alt=""></span><div class="grow"><b>${TD(x).name}</b> <span class="pill g">${L('已完成', 'Completed')}</span><small>${L(`${dateTxt(x.doneAt)}完成`, `Completed ${dateTxt(x.doneAt)}`)}${x.redo ? '' : L(`，共 ${x.rounds} 轮对话`, `, ${x.rounds} rounds`)}</small></div><div class="acts">${fbBtn(x)}${x.redo ? '' : `<button class="btn ghost sm" data-act="viewChat" data-arg="${x.id}">${L('查看对话', 'Conversation')}</button>`}<button class="btn soft sm" data-act="card" data-arg="cur">${L('查看卡片', 'View card')}</button></div></div>`)
      .concat(S.history.map((h, i) => `<div class="row"><span class="mini"><img src="${MASCOT}" alt=""></span><div class="grow"><b>${L(...h.name)}</b> <span class="pill g">${L('已完成', 'Completed')}</span><small>${L(`${dateTxt(h.at)}完成，共 ${h.rounds} 轮对话，用时 ${h.mins} 分钟`, `Completed ${dateTxt(h.at)} · ${h.rounds} rounds · ${h.mins} min`)}</small></div><div class="acts"><button class="btn ghost sm" data-act="histChat" data-arg="${i}">${L('查看对话', 'Conversation')}</button><button class="btn soft sm" data-act="card" data-arg="h${i}">${L('查看卡片', 'View card')}</button></div></div>`));
    return tpl('p-ai', { cur, items: rows.join('') || `<div class="empty" style="padding:24px 0">${L('完成第一次访谈后，记录会出现在这里', 'Your conversations will appear here after your first chat')}</div>` }); },
  help: () => tpl('p-help', { ucc: UCC(), docs: DOCS().map(d => `<div class="row"><span class="mini" style="background:var(--bub)">${I(d.ico)}</span><div class="grow"><b>${d.name}</b><small>${d.meta}</small></div><div class="acts"><button class="btn soft sm" data-act="doc" data-arg="${d.k}">${L('查看', 'View')}</button></div></div>`).join('') }),
  msgs: () => { const tab = S.msgTab || 'all', list = S.inbox.map((x, i) => [x, i]).filter(([x]) => tab === 'all' || !x.read), un = S.inbox.filter(x => !x.read).length;
    return tpl('p-msgs', { backTo: L('返回', 'Back'), tabs: [['all', L('全部', 'All')], ['unread', L(`未读 ${un}`, `Unread ${un}`)]].map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-act="msgTab" data-arg="${k}">${n}</button>`).join(''),
      items: list.map(([x, i]) => `<button class="msg ${x.read ? '' : 'new'}" data-act="msgOpen" data-arg="${i}"><span class="mi">${I(x.ico, 's')}</span><span style="flex:1"><b>${L(...x.t)}</b><small>${L(...x.d)}</small>${x.sms ? `<span class="pill n" style="margin-top:6px">${I('phone', 's')}${L('已同步短信', 'Also sent by SMS')}</span>` : ''}</span><span class="t">${relT(x.at)}</span></button>`).join('') || `<div class="empty">${L('没有未读消息', 'You’re all caught up')}</div>` }); },
  cpage: () => { const c = C(S.cp), j = ci(c.id), ok = canB(c), mine = cRecords(c);
    const days = DAYS.map((d, di) => [d, di, DATA.times.map((_, ti) => [ti, slotState(j, di, ti)]).filter(x => x[1] === 'open' || x[1] === 'taken')]).filter(x => x[2].length);
    return tpl('p-cpage', { mine, av: avatar(c, 'l'), name: who(c), role: T(c.role), sep: SEP(), campus: T(c.campus), bio: c.bio, tags: c.tags.map(x => `<span>${T(x)}</span>`).join(''),
      own: S.owner === c.id ? `<span class="pill g">${L('你的负责咨询师', 'Your counsellor')}</span>` : '',
      slots: ok ? days.map(([d, di, ts]) => `<div class="crow" style="padding:12px 16px"><div class="who" style="width:150px"><b>${shortDay(d)} <span style="color:var(--mute2);font-weight:400">${WDS()[d.getDay()]}</span></b></div><div class="times">${ts.map(([ti, st]) => slotBtn(c, di, ti, st)).join('')}</div></div>`).join('') || `<div class="empty">${L('近 30 天暂无空档', 'No openings in the next 30 days')}</div>`
        : `<div class="strip"><span class="ico">${I('lock')}</span><div class="grow"><b>${L('暂时不能直接预约这位老师', 'You can’t book this counsellor directly')}</b><small>${S.owner ? L('你已有负责咨询师，如需更换请先申请。', 'You already have a counsellor. Request a change first.') : L('高级咨询师由中心在预咨询后安排。', 'Senior counsellors are arranged by UCC after your intake chat.')}</small></div></div>` }); },
  profile: () => { const p = prof(), e2 = P().ec2;
    const kr = (k, v, act = '') => `<div class="kr"><span>${k}</span><b style="font-weight:500">${v}</b>${act}</div>`;
    return tpl('p-profile', { ucc: UCC(),
      base: [kr(L('姓名', 'Name'), esc(p.name)), kr(L('学号', 'Matric no.'), esc(p.sid)), kr(L('学校', 'University'), T(p.school)), kr(L('校区', 'Campus'), T(p.campus)), kr(L('学院', 'College'), T(p.college)), kr(L('手机号', 'Mobile'), `${p.cc || S.cc || '+65'} ${p.phone || P().phone}`)].join(''),
      ec: kr(L('本人填写', 'Added by you'), `${esc(p.ecName)}${L('（', ' (')}${T(p.ecRel)}${L('）', ')')}  ${telTxt(p.ecCc, p.ecTel)}`, `<button class="btn sec sm" data-act="ecOpen">${I('edit', 's')}${L('修改', 'Edit')}</button>`)
        + kr(L('学校导入', 'From NTU records'), `${e2[0]}${L('（', ' (')}${T(e2[1])}${L('）', ')')}  +65 ${e2[2]}`, `<span class="pill n">${L('入学资料', 'Enrolment')}</span>`) }); },
  session: sessionPage,
  talks: () => PAGES.ai(),
  /* 我的问卷：只放要做的和做过的 */
  myq: () => { const all = sortedTasks(), todo = all.filter(t => !isDone(t) && t.phase !== 'expired'), done = all.filter(isDone), exp = all.filter(t => t.phase === 'expired');
    const fun = DATA.fun.filter(x => S.fun.res[x.k]).map(x => `<div class="row"><span class="mini" style="background:${x.bg}">${I(x.ico)}</span><div class="grow"><b>${x.name}</b> <span class="pill n">${I('lock', 's')}${L('自我了解 · 仅自己可见', 'Self-test · private')}</span><small>${L(`${dateTxt(S.fun.res[x.k].at)}完成`, `Taken ${dateTxt(S.fun.res[x.k].at)}`)}</small></div><div class="acts"><button class="btn soft sm" data-act="funView" data-arg="${x.k}">${L('查看结果', 'View result')}</button></div></div>`);
    const sec = (t, rows, empty) => `<div class="sect">${t}<span style="font-weight:400;font-size:13px;color:var(--mute2)">${L(`${rows.length} 项`, `${rows.length}`)}</span></div><div class="panel">${rows.join('') || `<div class="empty" style="padding:22px 0">${empty}</div>`}</div>`;
    return tpl('p-myq', { body: sec(L('待完成', 'To do'), todo.map(taskRow), L('没有需要完成的问卷', 'Nothing to do right now'))
      + sec(L('已完成', 'Done'), done.map(taskRow).concat(fun), L('还没有做过问卷', 'Nothing completed yet'))
      + (exp.length ? sec(L('已截止', 'Closed'), exp.map(taskRow), '') : '') }); },
  report: () => {
    const t = aiTask(), items = [];
    if (isDone(t)) items.push(repItem(t.doneAt, 'cur', TD(t).name));
    S.history.forEach((h, i) => items.push(repItem(h.at, 'h' + i, L(...h.name))));
    return tpl('p-report', { pending: !isDone(t) ? `<div class="strip"><span class="ico">${I('sand')}</span><div class="grow"><b>${L('本次普测的卡片还在路上', 'Your card for this check is on its way')}</b><small>${L('完成普测后，小屿会把卡片放在这里', 'Finish the check and Xiaoyu will leave it here')}</small></div><button class="btn pri sm" data-act="taskGo" data-arg="${t.id}">${L('去完成', 'Finish the check')}</button></div>` : '',
      items: items.join('') || `<div class="empty"><img src="${MASCOT}" alt="">${L('还没有卡片', 'No cards yet')}</div>` });
  },
  book: bookPage,
  mybook: myBookPage,
  garden: () => {
    const g = S.garden, G = DATA.garden, by = t => G.filter(x => x.type === t), feat = G.find(x => x.id === 'g4');
    const last = g.last && G.find(x => x.id === g.last.id);
    const resume = last ? `<button class="resume" data-act="gOpen" data-arg="${last.id}:${g.last.step}"><span class="th">${art(last, 'sq')}</span><span class="grow"><small>${L('最近在看', 'Continue')}</small><b>${last.title}</b><span class="pb"><i style="width:${Math.round((g.last.step + 1) / last.steps.length * 100)}%"></i></span></span>${I('right', 's')}</button>` : '';
    const hero = `<div class="feat"><button class="fcv" data-act="gOpen" data-arg="${feat.id}:0">${art(feat, 'big')}<span class="play">${I('play')}</span><span class="dur">${feat.dur}</span></button>
      <div class="fin"><span class="pill">${L('本周推荐', 'Featured this week')}</span><small>${feat.ep}${SEP()}${L('大学心理咨询中心出品', 'from UCC')}</small><h3>${feat.title}</h3><p>${feat.sub}</p>
      <div class="facts"><button class="btn pri" data-act="gOpen" data-arg="${feat.id}:0">${I('play', 's')}${L('开始观看', 'Watch now')}</button></div>${resume}</div></div>`;
    const head = (t, n, ic) => `<div class="sect">${`<span style="display:flex;align-items:center;gap:8px">${I(ic, 's')}${t}<em class="cnt">${n}</em></span>`}</div>`;
    const vids = by('video').filter(x => x !== feat), aud = by('audio'), art2 = by('article'), ev = by('event');
    const aRow = x => `<button class="ar" data-act="gOpen" data-arg="${x.id}:0"><span class="th">${art(x, 'sq')}<span class="play">${I('play')}</span></span><span class="grow"><b>${x.title}</b><small>${x.sub}</small><span class="meta">${I('phones', 's')}${x.dur}${isUcc(x) ? `<em>UCC</em>` : ''}</span></span></button>`;
    const dRow = x => `<button class="ar doc" data-act="gOpen" data-arg="${x.id}:0"><span class="th">${art(x, 'sq')}</span><span class="grow"><b>${x.title}</b><small>${x.sub}</small><span class="meta">${I('file', 's')}${x.dur}${isUcc(x) ? `<em>UCC</em>` : ''}</span></span></button>`;
    const eCard = x => `<button class="evc" data-act="gOpen" data-arg="${x.id}:0"><span class="dt"><small>${L(`${x.date[0]} 月`, MON[x.date[0] - 1])}</small><b>${x.date[1]}</b></span><span class="grow"><b>${x.title}</b><small>${x.sub}</small><span class="meta">${I('clock', 's')}${x.dur}<i></i>${I('pin', 's')}${x.place}</span></span><span class="go">${L('查看', 'Details')}</span></button>`;
    return tpl('p-garden', { hero,
      body: head(L('视频微课', 'Video lessons'), vids.length + 1, 'video') + `<div class="vgrid">${vids.map(gCard).join('')}</div>`
        + head(L('音频练习', 'Audio practices'), aud.length, 'phones') + `<div class="agrid">${aud.map(aRow).join('')}</div>`
        + `<div class="two"><div>${head(L('图文', 'Reads'), art2.length, 'file')}<div class="alist">${art2.map(dRow).join('')}</div></div><div>${head(L('本校活动', 'At NTU'), ev.length, 'cal')}<div class="alist">${ev.map(eCard).join('')}</div></div></div>` });
  },
  fb: () => aiTask().fbDone ? `<div class="page fade"><div class="wrap" style="width:min(680px,100%)"><div class="ph"><h2>${L('访谈反馈', 'Feedback')}</h2></div><div class="strip"><span class="ico">${I('check')}</span><div class="grow"><b>${L('你已经提交过这次的反馈了', 'You’ve already sent feedback for this chat')}</b><small>${L('谢谢你，小屿会继续改进。', 'Thank you — it helps Xiaoyu get better.')}</small></div><button class="btn soft sm" data-act="go" data-arg="ai">${L('回到 AI 访谈', 'Back to Talk with Xiaoyu')}</button></div></div></div>` : tpl('p-fb', { qs: DATA.fbQs.map((q, i) => `<div class="rq"><p>${q[0]}</p><div class="rate">${[1, 2, 3, 4, 5].map(n => `<button class="${S.fb[i] === n ? 'on' : ''}" data-act="rate" data-arg="${i}:${n}">${n}</button>`).join('')}<small style="color:var(--mute);margin-left:8px">1 ${q[1]}${SEP()}5 ${q[2]}</small></div></div>`).join('') }),
};
function steps2(t) {
  const a = answered(t), n = nQ(t), ai = TD(t).ai, sc = t.phase === 'scale' ? 'now' : t.phase === 'none' ? '' : 'done', ch = (t.phase === 'chat' || t.phase === 'bridge') ? 'now' : '';
  const s = [`<span class="${sc}">${sc === 'done' ? '✓ ' : ''}${L(`问卷 ${a}/${n}`, `Questionnaires ${a}/${n}`)}</span>`];
  if (ai) s.push(`<span class="${ch}">${L('和小屿聊聊', 'Chat with Xiaoyu')}${ch ? L(` · ${t.rounds} 轮`, ` · ${t.rounds}`) : ''}</span>`, `<span>${L('拿到我的卡片', 'Get your card')}</span>`);
  else s.push(`<span>${L('提交', 'Submit')}</span>`);
  return `<div class="steps2">${s.join('<i>›</i>')}</div>`;
}
/* v1.18：个人中心的待办里先放预约和老师的约谈（表格 S5、S6） */
function homeExtra() { const R = [], row = (ico, t, tag, sub, btn) => `<div class="row todo"><span class="mini" style="background:var(--bub)">${I(ico)}</span><div class="grow"><b>${t}</b> ${tag}<small>${sub}</small></div><div class="acts">${btn}</div></div>`, b = S.bk;
  if (b && !['已完成', '已取消'].includes(b.st)) { const it = b.intake, ikTodo = b.kind === '预咨询' && !S.owner && (!it || ['none', 'draft'].includes(it.st));
    R.push(row('cal', L(`预约咨询 · ${b.kind}`, b.kind === '预咨询' ? 'Counselling · Intake' : 'Counselling · Session'), `<span class="pill ${b.st === '已确认' && !b.pend ? 'g' : 'n'}">${b.pend ? L('待老师同意', 'Pending') : b.st === '已确认' ? L('已确认', 'Confirmed') : b.st === '已改约' ? L('待接受新时间', 'Accept new time') : L('待老师确认', 'Pending')}</span>`,
      `${who(C(b.cid))}${SEP()}${L('咨询时间', 'Time')} ${bkWhen(b)}${ikTodo ? SEP() + L('预咨询小屿还没聊，聊完老师能提前了解你', 'Chat with Xiaoyu first so your counsellor knows you') : it && it.st === 'sent' ? SEP() + L('预咨询已发给老师', 'Intake sent') : ''}`,
      `<button class="btn ${ikTodo ? 'pri' : 'soft'} sm" data-act="go" data-arg="mybook">${ikTodo ? L('去聊聊', 'Start') : L('查看', 'View')}</button>`)); }
  (S.invs || []).filter(v => invNeed(v) || v.st === 'ok').forEach(v => R.push(row('chat', L(`${invWho(v)} 约你聊聊`, `${invWho(v)} would like to chat`), `<span class="pill ${invNeed(v) ? 'w' : 'g'}">${invSt(v)[0]}</span>`, `${invWhen(v)} ${invWhere(v)}`,
    `<button class="btn ${invNeed(v) ? 'pri' : 'soft'} sm" data-act="ivOpen" data-arg="${v.id}">${invNeed(v) ? L('回复', 'Reply') : L('查看', 'View')}</button>`)));
  return R; }
function todoRow(t) {
  const d = TD(t);
  if (t.declined) return `<div class="row todo"><span class="mini" style="${d.ai ? '' : 'background:var(--bub)'}">${d.ai ? `<img src="${MASCOT}" alt="">` : I('list')}</span><div class="grow"><b>${d.name}</b> <span class="pill n">${L('已选择不参加', 'Not taking part')}</span>
    <small>${L('你已选择不参加，可以随时回来参加', 'You chose not to take part. You can come back anytime.')}${SEP()}${L(`${d.until}截止`, `Due ${d.until}`)}</small></div>
    <div class="acts"><button class="btn soft sm" data-act="declUndo" data-arg="${t.id}">${L('回来参加', 'Take part')}</button></div></div>`;
  return `<div class="row todo"><span class="mini" style="${d.ai ? '' : 'background:var(--bub)'}">${d.ai ? `<img src="${MASCOT}" alt="">` : I('list')}</span><div class="grow"><b>${d.name}</b> ${reqTag(t)}${inProg(t) ? ` <span class="pill">${t.paused ? L('已暂停', 'Paused') : L('进行中', 'In progress')}</span>` : ''}
    <small><span class="src">${L('来自', 'From')} <b>${d.from}</b></span>${SEP()}${L(`${d.until}截止，剩余 ${d.left}`, `Due ${d.until}, ${d.left} left`)}${SEP()}${d.dur}</small>${steps2(t)}</div>
    <div class="acts"><span class="zap" data-act="zDue" data-arg="${t.id}">⚡ ${L('模拟到期提醒', 'Demo: due reminder')}</span><button class="btn ${inProg(t) || t === sortedTasks()[0] ? 'pri' : 'soft'} sm" data-act="taskGo" data-arg="${t.id}">${inProg(t) ? L('继续', 'Continue') : L('开始', 'Start')}</button></div></div>`;
}
function triSteps(t) {
  const a = answered(t), n = nQ(t), ai = TD(t).ai, ns = TS(t).length;
  const s = [{ ic: 'list', t: L(`${ns} 份问卷`, `${ns} questionnaire${ns > 1 ? 's' : ''}`), d: t.phase === 'none' ? L(`${n} 题`, `${n} questions`) : t.phase === 'scale' ? L(`已完成 ${a}/${n}`, `${a} of ${n} done`) : L('已完成', 'Done'), st: t.phase === 'scale' ? 'now' : t.phase === 'none' ? '' : 'done' }];
  if (ai) s.push({ ic: 'chat', t: L('和小屿聊聊', 'Chat with Xiaoyu'), d: t.phase === 'chat' || t.phase === 'bridge' ? (t.paused ? L(`已暂停，聊了 ${t.rounds} 轮`, `Paused after ${t.rounds} rounds`) : L(`已聊 ${t.rounds} 轮`, `${t.rounds} rounds so far`)) : L('约 15 分钟', 'About 15 min'), st: t.phase === 'chat' || t.phase === 'bridge' ? 'now' : '' },
    { ic: 'card', t: L('拿到我的卡片', 'Get your card'), d: L('只有你能看到', 'Only you can see it'), st: '' });
  else s.push({ ic: 'check', t: L('提交', 'Submit'), d: L('不含访谈', 'No chat needed'), st: '' });
  return s.map(x => `<div class="${x.st}"><span class="ico">${I(x.st === 'done' ? 'check' : x.ic)}</span><span><b>${x.t}</b>${x.d}</span></div>`).join('');
}
const reqTag = t => TD(t).req ? `<span class="pill">${L('必做', 'Required')}</span>` : `<span class="pill n">${L('选做', 'Optional')}</span>`;
const aiTask = () => S.tasks.find(t => TD(t).ai) || S.task;
function taskRow(t) {
  const redo = t.redo; if (redo) t = { ...t, phase: 'done' };
  const d = TD(t), st = { done: [L('已完成', 'Completed'), 'g'], expired: [L('已过期', 'Expired'), 'n'], none: [L('未开始', 'Not started'), 'n'], scale: [L('进行中', 'In progress'), ''], bridge: [L('进行中', 'In progress'), ''], chat: [t.paused ? L('已暂停', 'Paused') : L('进行中', 'In progress'), ''] }[t.phase];
  const sub = t.phase === 'done' ? L(`${dateTxt(t.doneAt)}完成`, `Completed ${dateTxt(t.doneAt)}`) + (d.ai ? (redo ? L('，正在进行新一轮对话', ', new chat in progress') : L(`，共 ${t.rounds} 轮对话`, `, ${t.rounds} rounds`)) : '')
    : t.phase === 'expired' ? L(`${d.until}截止。如需补做，请联系 UCC 为你重新开放：`, `Closed on ${d.until}. Contact UCC to reopen it: `) + UCC()
    : L(`${d.until}截止，剩余 ${d.left}`, `Due ${d.until}, ${d.left} left`) + (inProg(t) ? `${SEP()}${progTxt(t)}` : '');
  const act = t.phase === 'expired' ? '' : t.phase === 'done' ? (d.ai ? `<button class="btn ghost sm" data-act="viewChat" data-arg="${t.id}">${L('查看对话', 'Conversation')}</button><button class="btn soft sm" data-act="card" data-arg="cur">${L('查看卡片', 'View card')}</button>` : '')
    : `<button class="btn ${inProg(t) ? 'pri' : 'soft'} sm" data-act="taskGo" data-arg="${t.id}">${inProg(t) ? L('继续', 'Continue') : L('开始', 'Start')}</button>`;
  const from = `<span class="src">${L('来自', 'From')} <b>${d.from}</b></span>`;
  return `<div class="row" style="${t.phase === 'expired' ? 'opacity:.7' : ''}"><span class="mini" style="${d.ai ? '' : 'background:var(--bub)'}">${d.ai ? `<img src="${MASCOT}" alt="">` : I('list')}</span><div class="grow"><b>${d.name}</b> ${reqTag(t)} <span class="pill ${st[1]}">${st[0]}</span><small>${from}${SEP()}${sub}</small></div><div class="acts">${act}</div></div>`;
}
const repItem = (at, key, name) => `<div class="row"><span class="mini"><img src="${MASCOT}" alt=""></span><div class="grow"><b>${L('我的卡片', 'My card')}</b><small>${name}${SEP()}${dateTxt(at)}</small></div><div class="acts"><button class="btn pri sm" data-act="card" data-arg="${key}">${L('查看卡片', 'View card')}</button></div></div>`;
/* 心理园区封面：按主题画的扁平插画，不用图片 */
function art(x, cls = '') {
  const [a, b, c] = x.pal, id = 'a' + x.id + cls.replace(/\W/g, ''), W = 'rgba(255,255,255,';
  const hills = (y, col, o = 1) => `<path d="M-10 ${y}C40 ${y - 26} 90 ${y - 30} 150 ${y - 12}S260 ${y - 34} 330 ${y - 14}V190H-10z" fill="${col}" opacity="${o}"/>`;
  const M = {
    sun: `<circle cx="210" cy="78" r="64" fill="${W}.25)"/><circle cx="210" cy="78" r="46" fill="${W}.35)"/><circle cx="210" cy="78" r="30" fill="${c}" opacity=".85"/>${hills(150, c, .25)}${hills(168, '#fff', .55)}`,
    moon: `${[[40, 30], [80, 62], [128, 24], [262, 40], [290, 96], [170, 52], [60, 110]].map(([cx, cy], i) => `<circle cx="${cx}" cy="${cy}" r="${i % 3 ? 1.6 : 2.4}" fill="#fff" opacity=".75"/>`).join('')}<circle cx="226" cy="70" r="34" fill="${c}"/><circle cx="242" cy="60" r="30" fill="${a}"/>${hills(150, '#232B45', .55)}${hills(170, '#1C2338', .7)}`,
    wave: `<circle cx="240" cy="54" r="24" fill="${W}.7)"/>${[120, 140, 160].map((y, i) => `<path d="M-10 ${y}Q40 ${y - 20} 90 ${y}T190 ${y}T290 ${y}T390 ${y}V190H-10z" fill="${i === 2 ? '#fff' : c}" opacity="${[.18, .3, .6][i]}"/>`).join('')}`,
    hills: `<circle cx="70" cy="60" r="22" fill="${W}.75)"/>${hills(140, c, .3)}${[[200, 112, 16], [228, 118, 12], [252, 110, 18]].map(([x0, y0, r]) => `<rect x="${x0 - 2}" y="${y0}" width="4" height="${r + 8}" fill="${c}" opacity=".7"/><circle cx="${x0}" cy="${y0}" r="${r}" fill="${c}" opacity=".75"/>`).join('')}${hills(170, '#fff', .55)}`,
    cloud: `<circle cx="220" cy="66" r="26" fill="${c}" opacity=".55"/>${[[120, 80, 1], [210, 100, .8]].map(([x0, y0, k]) => `<g opacity=".9" fill="#fff"><circle cx="${x0}" cy="${y0}" r="${22 * k}"/><circle cx="${x0 + 24 * k}" cy="${y0 - 10 * k}" r="${26 * k}"/><circle cx="${x0 + 52 * k}" cy="${y0}" r="${20 * k}"/><rect x="${x0}" y="${y0}" width="${52 * k}" height="${20 * k}"/></g>`).join('')}${[0, 1, 2].map(i => `<path d="M${128 + i * 18} 120l-5 12" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`).join('')}${hills(172, '#fff', .5)}`,
    people: `<rect x="186" y="34" width="86" height="40" rx="18" fill="${W}.8)"/><circle cx="212" cy="54" r="4" fill="${c}"/><circle cx="229" cy="54" r="4" fill="${c}" opacity=".7"/><circle cx="246" cy="54" r="4" fill="${c}" opacity=".45"/>
      <circle cx="120" cy="84" r="20" fill="${c}" opacity=".8"/><path d="M84 160c0-26 16-42 36-42s36 16 36 42z" fill="${c}" opacity=".8"/><circle cx="176" cy="94" r="17" fill="#fff" opacity=".9"/><path d="M146 160c0-22 13-36 30-36s30 14 30 36z" fill="#fff" opacity=".9"/>${hills(176, '#fff', .35)}`,
    desk: `<circle cx="244" cy="58" r="22" fill="#fff" opacity=".85"/><path d="M244 46v12l8 5" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="86" y="116" width="96" height="16" rx="3" fill="${c}" opacity=".85"/><rect x="94" y="100" width="82" height="16" rx="3" fill="#fff" opacity=".9"/><rect x="90" y="84" width="88" height="16" rx="3" fill="${c}" opacity=".55"/>
      <rect x="196" y="104" width="26" height="28" rx="5" fill="#fff" opacity=".9"/><path d="M222 112c8 0 8 12 0 12" stroke="#fff" stroke-width="3" fill="none" opacity=".9"/><rect x="40" y="132" width="250" height="6" rx="3" fill="${c}" opacity=".45"/>`,
  };
  return `<svg class="art ${cls}" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="320" height="180" fill="url(#${id})"/>${M[x.art] || ''}</svg>`;
}
const gTypeLbl = x => ({ video: L('视频', 'Video'), audio: L('音频', 'Audio'), article: L('文章', 'Article'), event: L('活动', 'Event') }[x.type]);
const isUcc = x => x.src.includes('UCC');
/* 通用内容卡：封面 + 类型 + 标题（个人中心推荐、视频区） */
const gCard = x => `<button class="vc" data-act="gOpen" data-arg="${x.id}:0"><div class="cvr">${art(x)}<span class="tl">${gTypeLbl(x)}</span>${isUcc(x) ? `<span class="ucc">UCC</span>` : ''}${x.type === 'event' ? '' : `<span class="dur">${x.type === 'article' ? I('file', 's') : x.type === 'audio' ? I('phones', 's') : ''}${x.dur}</span>`}<span class="play">${I(x.type === 'article' || x.type === 'event' ? 'right' : 'play')}</span></div><div class="bd"><b>${x.title}</b><span>${x.ep || T(x.src)}</span></div></button>`;
/* 咨询师头像：有照片用照片（DATA.counsellors[].photo），没有就用写实风格的插画头像 */
function avatar(c, cls = '') {
  const ph = c.photo || (typeof PHOTOS !== 'undefined' && PHOTOS[c.id]);
  if (ph) return `<span class="av ${cls}"><img src="${ph}" alt=""></span>`;
  const [bg, cloth, , hs, skin, hc, gl] = c.look, id = 'av' + c.id;
  const back = { bob: `<rect x="18" y="13" width="28" height="27" rx="12" fill="${hc}"/>`, long: `<path d="M18 26C18 14 25 11 32 11s14 3 14 15l1 24c-3 2-7 2-9-1H26c-2 3-6 3-9 1z" fill="${hc}"/>`, bun: `<circle cx="32" cy="11" r="5.5" fill="${hc}"/>`, short: '', pony: `<path d="M42 18c6 2 7 12 4 20-1-6-3-10-6-12z" fill="${hc}"/>` }[hs];
  const front = { bob: `M21 25c1-8 6-12 11-12s10 4 11 12c-5-4-13-5-22 0z`, long: `M21 27c0-10 6-15 12-15 7 0 11 5 10 14-3-6-9-9-15-7-3 2-5 4-7 8z`, bun: `M21 25c0-8 5-12 11-12s11 4 11 12c-4-5-18-5-22 0z`, short: `M20.5 26c-1-10 5-14.5 12-14.5 8 0 12 5 10.5 13.5-2-4-6-6-10-5.5-5 0-9 2.5-12.5 6.5z`, pony: `M21 26c0-9 5-13 11-13s11 4 11 13c-4-6-11-8-22 0z` }[hs];
  const sh = 'rgba(120,80,60,.18)';
  return `<span class="av ${cls}"><svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <rect width="64" height="64" fill="${bg}"/><rect width="64" height="64" fill="url(#${id})"/>${back}
    <rect x="28" y="34" width="8" height="10" rx="3" fill="${skin}"/><rect x="28" y="36" width="8" height="4" fill="${sh}"/>
    <path d="M9 66c0-14 10-22 23-22s23 8 23 22z" fill="${cloth}"/><path d="M26.5 44l5.5 7 5.5-7z" fill="#fff" opacity=".9"/>
    <ellipse cx="21.6" cy="28.5" rx="1.8" ry="2.6" fill="${skin}"/><ellipse cx="42.4" cy="28.5" rx="1.8" ry="2.6" fill="${skin}"/>
    <ellipse cx="32" cy="27" rx="10.4" ry="12" fill="${skin}"/>
    <path d="${front}" fill="${hc}"/>
    <path d="M26.3 25.2q1.7-1 3.4 0M34.3 25.2q1.7-1 3.4 0" stroke="${hc}" stroke-width="1" fill="none" stroke-linecap="round"/>
    <ellipse cx="28" cy="28.3" rx="1.15" ry="1.45" fill="#3A2F28"/><ellipse cx="36" cy="28.3" rx="1.15" ry="1.45" fill="#3A2F28"/>
    <path d="M32.2 29.6q-1.1 2.7.3 3.1" stroke="${sh}" stroke-width="1" fill="none" stroke-linecap="round"/>
    <circle cx="25.6" cy="32.4" r="2.1" fill="#EE9B88" opacity=".22"/><circle cx="38.4" cy="32.4" r="2.1" fill="#EE9B88" opacity=".22"/>
    <path d="M29.2 34.4q2.8 2 5.6 0" stroke="#A8604E" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    ${gl ? `<g fill="none" stroke="#4B4036" stroke-width=".9"><circle cx="28" cy="28.4" r="3.4"/><circle cx="36" cy="28.4" r="3.4"/><path d="M31.4 28.2h1.2M24.6 27.8l-2.4-.8M39.4 27.8l2.4-.8"/></g>` : ''}</svg></span>`;
}
function qrSvg(seed = 7) {
  const n = 25, cell = []; let x = seed;
  const rnd = () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648;
  const finder = (r, c) => [[0, 0], [0, n - 7], [n - 7, 0]].some(([a, b]) => r >= a && r < a + 7 && c >= b && c < b + 7);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    let on;
    if (finder(r, c)) { const [a, b] = [[0, 0], [0, n - 7], [n - 7, 0]].find(([a, b]) => r >= a && r < a + 7 && c >= b && c < b + 7); const rr = r - a, cc = c - b; on = rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr > 1 && rr < 5 && cc > 1 && cc < 5); }
    else on = rnd() > .52;
    if (on) cell.push(`<rect x="${c}" y="${r}" width="1" height="1"/>`);
  }
  return `<svg class="qrc" viewBox="-1 -1 27 27" aria-label="QR"><g fill="#43413A">${cell.join('')}</g></svg>`;
}

/* ---------- 趣味测试结果（仅学生自己可见；只呈现文字建议，不展示分数或风险分档） ---------- */
function funResult() {
  const x = DATA.fun.find(y => y.k === S.fun.cur), r = S.fun.res[x.k], a = r.a, sc = FUNSCORE[x.k](x, a);
  let body = '', more = '';
  if (x.k === 'big5') body = `<p>${L('五种特质没有好坏之分，它们一起组成了你的样子。', 'None of these traits is good or bad — together they make up who you are.')}</p>` +
    sc.map(s => { const tr = x.traits[s.k]; return `<div class="trait"><b>${tr[0]}</b><small style="grid-column:2/-1;margin-top:0">${s.pct >= 60 ? tr[1] : s.pct <= 40 ? tr[2] : L('两端之间，比较平衡', 'Somewhere in between')}</small></div>`; }).join('');
  if (x.k === 'type16') { const code = sc.map(s => x.dims[s.d][s.side][0]).join(' ');
    body = `<div class="big">${code}</div><p>${L('四个字母只代表你目前的倾向，没有好坏之分，也会随着经历改变。', 'These letters show your current leanings — not a fixed label, and they can change over time.')}</p>` +
      sc.map(s => { const [l, r2] = x.dims[s.d]; return `<div class="dim"><span class="${s.side === 0 ? 'on' : ''}">${l[1]} ${l[0]}</span><span class="mid"><i style="left:${s.side === 0 ? '12%' : '76%'}"></i></span><span class="${s.side === 1 ? 'on' : ''}">${r2[0]} ${r2[1]}</span></div>`; }).join(''); }
  if (x.k === 'pss') { const band = sc <= 13 ? 0 : sc <= 26 ? 1 : 2;
    body = `<p>${[L('最近你对生活的掌控感不错，继续保持适合自己的节奏。', 'You’ve felt fairly in control lately — keep the rhythm that works for you.'), L('最近有些事情让你感到吃力，这很常见。给自己留一点放松的时间。', 'Some things have felt like a lot lately — that’s common. Leave yourself time to unwind.'), L('最近压力不小。试试呼吸练习，也可以找人聊聊，不用一个人扛。', 'It’s been a stressful stretch. Try a breathing practice, and remember you don’t have to carry it alone.')][band]}</p>`;
    more = `<button class="btn soft" data-act="gOpen" data-arg="g1:0">${L('试试 4-7-8 呼吸练习', 'Try 4-7-8 Breathing')}</button>`; }
  if (x.k === 'who5') { const low = sc < 50;
    body = `<p>${low ? L('最近两周过得不太轻松。如果这种状态持续两周以上，可以约一位老师聊聊。', 'The last two weeks haven’t been easy. If this lasts more than two weeks, consider talking to a counsellor.') : L('最近两周你的状态不错，记得照顾好自己。', 'You’ve been doing well these two weeks. Keep looking after yourself.')}</p>`;
    more = low ? `<button class="btn soft" data-act="go" data-arg="book">${L('预约咨询', 'Book a session')}</button>` : ''; }
  if (x.k === 'rse') { const band = sc < 25 ? 0 : sc < 35 ? 1 : 2;
    body = `<p>${[L('你可能常常对自己不太满意。试着记下每天做成的一件小事，哪怕很小。', 'You may often feel unsatisfied with yourself. Try noting one small thing you did well each day.'), L('你对自己的看法总体平衡，有认可也有期待。', 'You see yourself in a balanced way — some pride, some room to grow.'), L('你对自己有比较稳定的认可，这是很好的心理资源。', 'You have a steady sense of your own worth — a real strength.')][band]}</p>`;
    more = `<button class="btn soft" data-act="gOpen" data-arg="g3:0">${L('看看「情绪是怎么来的」', 'Watch “Where Emotions Come From”')}</button>`; }
  if (x.bands) { const bi = x.bands.findIndex(b => sc < b[0]), b = x.bands[bi < 0 ? x.bands.length - 1 : bi];
    body = `<p>${b[2]}</p>`;
    if (x.k === 'ucla3' && bi !== 0) more = `<button class="btn soft" data-act="gOpen" data-arg="g6:0">${L('看看新生适应小组', 'See the support group')}</button>`; }
  return tpl('p-funres', { name: x.name, date: dateTxt(r.at), body, more: more + `<button class="btn ghost" data-act="funStart" data-arg="${x.k}:1">${L('重新测一次', 'Take it again')}</button>` });
}

/* ---------- 访谈窗口 ---------- */
/* 标准化问卷：独立页面，在访谈之前完成；不出现小屿，避免误以为题目来自 AI */
function surveyPage() {
  const t = S.task, pages = qpages(t), p = pages[t.pg], sc = DATA.scales.find(s => s.k === p.k), list = TS(t).filter(s => !t.reused[s.k]), si = list.indexOf(sc), last = t.pg === pages.length - 1;
  const qs = sc.items.slice(p.a, p.b).map((it, j) => { const i = p.a + j; return `<div class="qc ${t.miss.includes(sc.k + i) ? 'miss' : ''}" id="r-${sc.k}${i}"><p><span>${i + 1}.</span>${it}</p><div class="qo" role="radiogroup">${sc.opts.map((o, v) =>
    `<button class="${t.ans[sc.k][i] === v ? 'on' : ''}" role="radio" aria-checked="${t.ans[sc.k][i] === v}" data-act="ans" data-arg="${sc.k}:${i}:${v}">${o}</button>`).join('')}</div></div>`; }).join('');
  return tpl('p-survey', { task: TD(t).name, title: sc.official, guide: sc.guide, pos: L(`问卷 ${si + 1}/${list.length}，第 ${t.pg + 1}/${pages.length} 页`, `Questionnaire ${si + 1} of ${list.length}, page ${t.pg + 1} of ${pages.length}`),
    pct: Math.round(answered() / nQ() * 100), qs,
    back: t.pg > 0 ? `<button class="btn sec" data-act="qPrev">${L('上一页', 'Back')}</button>` : '',
    next: last ? (TD(t).ai ? L('提交问卷，进入访谈', 'Submit and continue to the chat') : L('提交问卷', 'Submit')) : L('下一页', 'Next') });
}
function sessionPage() {
  const t = S.task, ph = t.phase;
  let main = '', bar = '';
  {
    main = t.msgs.map(m => m.help ? tpl('help-card', { ec: ecLine()[0], ecTel: ecLine()[1], cb: cbLine() }) : msg(m.who, m.text, m.voice)).join('') + (S.typing ? msg('bot', '<span class="dots"><i></i><i></i><i></i></span>') : '');
    if (ph === 'done') bar = `<div class="endbar">${L('本轮普测已完成', 'This check is complete')}<div class="acts"><button class="btn soft" data-act="card" data-arg="cur">${L('查看我的卡片', 'View my card')}</button><button class="btn sec" data-act="go" data-arg="talks">${L('访谈记录', 'Past check-ins')}</button></div></div>`;
    else if (t.crisis && t.paused) bar = `<div class="endbar">${L('对话先停在这里。你随时可以联系上面的人；也可以请 UCC 今天联系你。', 'We’ll pause here. You can reach the people above anytime, or ask UCC to call you today.')}<div class="acts"><button class="btn sec" data-act="resume">${L('我现在安全，继续聊', 'I’m safe — continue')}</button><button class="btn pri" data-act="callUcc" ${S.callback ? 'disabled' : ''}>${I('phone', 's')}${S.callback ? L('已通知 UCC', 'UCC notified') : L('请 UCC 今天联系我', 'Ask UCC to call me today')}</button></div></div>`;
    else if (t.paused) bar = `<div class="endbar">${L('对话已暂停，内容已完整保留。有效期内回来就能继续。', 'Paused. Everything is saved — come back before the due date to continue.')}<div class="acts"><button class="btn pri" data-act="resume">${L('继续作答', 'Continue')}</button></div></div>`;
    else {
      const q = DATA.script[t.qi];
      bar = `<div class="inbar"><div class="qtags">${q && !S.typing ? q.tags.map(x => `<button data-act="say" data-arg="${esc(x)}">${x}</button>`).join('') : ''}<span style="flex:1"></span>
        <span class="zap" data-act="zChat">⚡ ${L('演示 · 快进完成访谈', 'Demo: finish chat')}</span>${S.scen === 'C' ? `<span class="zap" data-act="zCrisis">⚡ ${L('演示 · 发送危机表达', 'Demo: send a crisis message')}</span>` : ''}</div>
        <div class="ib"><div class="box">${S.rec ? `<span class="rec"><i></i><i></i><i></i><i></i><i></i><em>${L('正在录音', 'Recording')} 0:${String(S.rec).padStart(2, '0')}</em></span>` : `<input id="chatIn" placeholder="${S.typing ? L('小屿正在回复…', 'Xiaoyu is replying…') : L('输入你的回答…', 'Type your answer…')}" autocomplete="off" ${S.typing ? 'disabled' : ''}>`}</div>
        <button class="sq ${S.rec ? 'recon' : ''}" data-act="mic" aria-label="${L('语音', 'Voice')}" ${S.typing ? 'disabled' : ''}>${S.rec ? I('pause') : I('mic')}</button><button class="sq send" data-act="send" aria-label="${L('发送', 'Send')}" ${S.typing ? 'disabled' : ''}>${I('up')}</button></div>
        <div class="narrow-acts"><button data-act="modal" data-arg="pause">${I('pause', 's')}${L('先停一下', 'Take a break')}</button><a href="tel:1767">${I('phone', 's')}${L('求助热线 1767', 'Helpline 1767')}</a></div></div>`;
    }
  }
  const si = ph === 'done' ? 3 : t.rounds < 3 ? 0 : 1;
  const stg = [L('初相识', 'Getting to know'), L('深度对话', 'Deeper talk'), L('生成报告', 'Your card')].map((x, i) => `<div class="${i < si ? 'done' : i === si ? 'on' : ''}">${x}</div>`).join('');
  const showBook = t.crisis || (ph === 'done' && RULE.invite(t.lv));
  return tpl('p-session', { main, bar, stg, left: TD(t).left, q: t.rounds, qLbl: L('已答轮数', 'Rounds'), mins: minsUsed(),
    tipLine: t.crisis ? L('你说的这些很重要。下面的人随时都在，不用一个人扛着。', 'What you shared matters. The people below are always there — you don’t have to carry this alone.') : ph === 'done' ? L('谢谢你今天的分享，记得照顾好自己。', 'Thanks for sharing today. Look after yourself.') : t.paused ? L('歇一会儿也没关系，回来随时可以接着聊。', 'Taking a break is fine. Come back whenever you’re ready.') : L('你回答得很认真，我们再多聊一会儿就好。', 'You’re doing great. Just a little longer.'),
    sideBook: showBook ? `<button class="btn pri blk" style="margin-top:12px;height:42px" data-act="go" data-arg="book">${I('cal', 's')}${L('预约咨询师', 'Book a counsellor')}</button>` : '',
    sideBtns: ph === 'done' ? `<button class="btn" data-act="redoAsk" data-arg="${t.id}">${I('later', 's')}${L('重新对话', 'Chat again')}</button><button class="btn" data-act="go" data-arg="home">${I('home', 's')}${L('个人中心', 'My space')}</button>`
      : `<button class="btn" data-act="modal" data-arg="pause" ${t.paused ? 'disabled' : ''}>${I('pause', 's')}${L('先停一下', 'Take a break')}</button>` });
}
const msg = (who, text, voice) => who === 'bot' ? `<div class="m"><img src="${MASCOT}" alt=""><div class="bb">${text}</div></div>`
  : `<div class="m me"><div class="bb">${esc(text)}${voice ? `<span class="vo">${I('mic', 's')} ${voice}</span>` : ''}</div></div>`;

/* ---------- 预约中心 ---------- */
/* 可约的老师：规则 4 + 更换通过后排除原咨询师 */
const canB = c => RULE.canBook(c, S.owner) && c.id !== S.excl;
const bkWhen = b => `${fmtDay(DAYS[b.di])} ${DATA.times[b.ti]}`;
const bkSt = b => b.pend ? (b.pend.type === 'cancel' ? L('取消待老师同意', 'Cancellation pending') : L('改期待老师同意', 'Reschedule pending')) : b.st === '已改约' ? L('待接受新时间', 'Acceptance pending') : T(b.st);
/* 预约中心顶部：当前预约卡 */
const bkMini = b => { const c = C(b.cid); return `<div class="bkmini">${avatar(c)}<div class="grow"><small>${L('我的预约', 'My appointment')}</small><b>${T(b.kind)} · ${who(c)}</b><span>${bkWhen(b)}</span></div><span class="pill ${b.st === '已确认' && !b.pend ? 'g' : ''}">${bkSt(b)}</span><button class="btn soft sm" data-act="go" data-arg="mybook">${L('查看与改期', 'View or reschedule')}</button></div>`; };
function firstOpen(j) { for (let di = 0; di < DAYS.length; di++) for (let ti = 0; ti < DATA.times.length; ti++) if (slotState(j, di, ti) === 'open') return [di, ti]; return null; }
function bookPage() {
  const tab = S.bookTab, own = S.owner && C(S.owner), pending = S.chg && S.chg.st === '审批中';
  let top = '', bottom = '';
  if (own) top = `<div class="own">${avatar(own)}<div class="grow"><small>${L('你的负责咨询师', 'Your counsellor')}</small><button class="lnk" data-act="cp" data-arg="${own.id}">${who(own)}</button> <span style="color:var(--mute2);font-size:13px">${T(own.role)}${SEP()}${T(own.campus)}</span>${pending ? ` <span class="pill">${L('更换申请审批中', 'Change request under review')}</span>` : ''}</div>
      ${pending ? '' : `<button class="btn sec sm" data-act="modal" data-arg="change">${I('swap', 's')}${L('申请更换', 'Request a change')}</button>`}</div>`;
  if (S.bk && !S.resch) top += bkMini(S.bk);
  if (S.resch) { const f = S.reschFrom, when = `${fmtDay(DAYS[f.di])} ${DATA.times[f.ti]}`;
    top += `<div class="strip"><span class="ico">${I('edit')}</span><div class="grow"><b>${L('正在改期：选一个新的时间', 'Rescheduling: pick a new time')}</b><small>${S.resch.approval ? L(`提交后需要老师同意；老师同意之前，原预约（${when}）仍然有效。`, `Your counsellor needs to approve. Until then, your current appointment (${when}) stands.`) : L(`提交新时间后，原预约（${when}）才会作废；现在离开，原预约不受影响。`, `Your current appointment (${when}) is only replaced once you submit a new time. Leave now and nothing changes.`)}</small></div><button class="btn sec sm" data-act="reschQuit">${L('放弃改期', 'Keep current time')}</button></div>`; }
  if (!own && !S.resch && !S.bk) top += xyTip(S.reIntake ? L('更换已通过，先和新老师进行一次预咨询吧', 'Your change was approved — start with an intake chat') : L('第一次预约是一次预咨询哦', 'Your first session is an intake chat'), L('大约 30 分钟，老师会和你一起看看接下来怎么安排。之后会有一位负责咨询师一直陪着你。', 'About 30 minutes. You and the counsellor will work out next steps together, and then one counsellor will stay with you.'));
  const tabs = [['time', L('按时间', 'By date')], ['who', L('按咨询师', 'By counsellor')], ['campus', L('按校区', 'By campus')]].map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-act="bTab" data-arg="${k}">${n}</button>`).join('');
  let body = '';
  if (tab === 'time') body = calendar(canB) + daySlots(canB) + `<p class="note" style="margin:14px 0 0">${L('只显示你可以预约的老师。需至少提前 24 小时预约。', 'Showing counsellors you can book. Book at least 24 hours ahead.')}</p>`;
  else { const list = DATA.counsellors.filter(c => tab === 'who' || c.campus === S.campus);
    body = (tab === 'campus' ? `<div class="chips" style="margin-bottom:16px">${DATA.campuses.map(x => { const n = DATA.counsellors.filter(c => c.campus === x).length; return `<button class="${S.campus === x ? 'on' : ''}" data-act="bCampus" data-arg="${x}" ${n ? '' : 'disabled title="' + L('这个校区暂时没有咨询师', 'No counsellors here yet') + '"'}>${T(x)}${n ? '' : L('（暂无）', ' (none)')}</button>`; }).join('')}</div>` : '') +
      `<div class="cs">${list.map(cCard).join('') || `<div class="empty">${L('这个校区暂时没有咨询师', 'No counsellors at this campus yet')}</div>`}</div>`; }
  return tpl('p-book', { own: top, tabs, body: body + bottom });
}
/* 未来 30 天日历：有可约时段的日子才可点 */
function calendar(ok) {
  const avail = DAYS.map((_, di) => DATA.counsellors.reduce((n, c, j) => n + (ok(c) ? DATA.times.filter((_, ti) => slotState(j, di, ti) === 'open').length : 0), 0));
  if (S.day == null || !avail[S.day]) S.day = avail.findIndex(n => n > 0);
  const start = new Date(NOW); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(NOW); end.setDate(end.getDate() + 30);
  const cells = []; for (let d = new Date(start); d <= end || cells.length % 7; d.setDate(d.getDate() + 1)) {
    const di = DAYS.findIndex(x => x.toDateString() === d.toDateString()), n = di >= 0 ? avail[di] : 0;
    const today = d.toDateString() === NOW.toDateString();
    const who3 = di >= 0 ? DATA.counsellors.filter((c, j) => ok(c) && DATA.times.some((_, ti) => slotState(j, di, ti) === 'open')).slice(0, 3) : [];
    cells.push(n ? `<button class="d av ${S.day === di ? 'on' : ''}" data-act="day" data-arg="${di}" title="${who3.map(who).join(SEP())}"><span class="n">${d.getDate()}</span><span class="avs">${who3.map(c => avatar(c)).join('')}</span></button>` : `<div class="d ${d < NOW || d > end ? 'x' : ''} ${today ? 'today' : ''}">${d.getDate()}${today ? `<small>${L('今天', 'Today')}</small>` : ''}</div>`);
  }
  return `<div class="cal"><div class="mh">${L(`${NOW.getMonth() + 1} 月 – ${end.getMonth() + 1} 月`, `${MON[NOW.getMonth()]} – ${MON[end.getMonth()]}`)}<small>${L('未来 30 天，有空档的日期可点', 'Next 30 days — dates with openings are selectable')}</small></div><div class="g">${(LANG === 'en' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['一', '二', '三', '四', '五', '六', '日']).map(x => `<div class="wd">${x}</div>`).join('')}${cells.join('')}</div></div>`;
}
function daySlots(ok) {
  if (S.day < 0) return `<div class="empty">${L('未来 30 天暂时没有可约时段', 'No openings in the next 30 days')}</div>`;
  const rows = DATA.counsellors.map((c, j) => { if (!ok(c)) return ''; const ts = DATA.times.map((tm, ti) => [ti, slotState(j, S.day, ti)]).filter(x => x[1] === 'open' || x[1] === 'taken'); if (!ts.length) return '';
    return `<div class="crow"><div class="who">${avatar(c)}<div><button class="lnk" data-act="cp" data-arg="${c.id}">${who(c)}</button><small>${T(c.role)}${SEP()}${T(c.campus)}</small></div></div><div class="times">${ts.map(([ti, st]) => slotBtn(c, S.day, ti, st)).join('')}</div></div>`; }).join('');
  return `<div class="sect" id="slots" style="margin-top:6px">${fmtDay(DAYS[S.day])}</div>` + rows;
}
function slotBtn(c, di, ti, st) {
  const mine = S.bk && S.bk.cid === c.id && S.bk.di === di && S.bk.ti === ti;
  if (mine) return `<button class="tm mine" disabled>${DATA.times[ti]}</button>`;
  if (st === 'taken') return `<button class="tm full" disabled>${DATA.times[ti]} ${L('已约满', 'Full')}</button>`;
  if (st !== 'open' || (S.bk && !S.resch)) return `<button class="tm off" disabled>${DATA.times[ti]}</button>`;
  return `<button class="tm" data-act="pickSlot" data-arg="${c.id}:${di}:${ti}">${DATA.times[ti]}</button>`;
}
function cCard(c) {
  const ok = canB(c), j = ci(c.id), nx = firstOpen(j);
  return `<div class="cc ${ok ? '' : 'lock'}"><div class="top">${avatar(c)}<div><b>${who(c)}</b><small>${T(c.role)}${SEP()}${T(c.campus)}</small></div></div>
    <div class="tg">${c.tags.map(x => `<span>${T(x)}</span>`).join('')}</div>
    ${ok ? `<div class="nx">${I('clock', 's')}${nx ? L(`最近可约 ${shortDay(DAYS[nx[0]])} ${DATA.times[nx[1]]}`, `Next available ${shortDay(DAYS[nx[0]])}, ${DATA.times[nx[1]]}`) : L('近期暂无空档', 'No times soon')}</div><button class="btn soft sm" data-act="cp" data-arg="${c.id}">${L('看介绍和时间', 'View profile and times')}</button>`
      : `<div class="lk">${I('lock', 's')}${S.owner ? L('你已有负责咨询师，如需更换请先申请', 'You have a counsellor. Request a change to see someone else.') : L('由中心在预咨询后安排', 'Arranged by UCC after your intake chat')}</div>`}</div>`;
}

/* 危机后的即时通道：请 UCC 今天联系我 */
const cbLine = () => S.callback ? `<div class="cbok">${I('check', 's')}${L('已通知 UCC 值班老师，今天 17:30 前会打电话给你', 'UCC’s duty counsellor will call you before 5:30 pm today')}</div>` : `<button class="btn pri sm" data-act="callUcc" style="margin-top:10px">${I('phone', 's')}${L('请 UCC 今天联系我', 'Ask UCC to call me today')}</button>`;

/* 协议与文件 */
const DOCS = () => { const at = S.consentAt || (SCENES[S.scen].returning ? new Date(2026, 7, 12, 14, 20) : null);
  return [{ k: 'consent', ico: 'shield', name: L('知情同意书', 'Informed consent'), meta: `v2.0${SEP()}` + (at ? L(`你已于 ${dateTxt(at)} 同意`, `You agreed on ${dateTxt(at)}`) : L('2026 年 8 月 1 日生效', 'Effective 1 Aug 2026')) },
    { k: 'privacy', ico: 'lock', name: L('隐私政策', 'Privacy policy'), meta: `v2.0${SEP()}${L('2026 年 8 月 1 日生效', 'Effective 1 Aug 2026')}` },
    { k: 'terms', ico: 'file', name: L('用户服务协议', 'Terms of use'), meta: `v2.0${SEP()}${L('2026 年 8 月 1 日生效', 'Effective 1 Aug 2026')}` }]; };

/* 小屿的温馨提醒：小屿头像 + 对话气泡 */
const xyTip = (title, text) => `<div class="xy"><img src="${MASCOT}" alt=""><div class="xb"><small>${L('小屿温馨提醒', 'A note from Xiaoyu')}</small><b>${title}</b><span>${text}</span></div></div>`;

/* ---------- 改期 / 取消次数：每 14 天各 1 次 ---------- */
const QUOTA_DAYS = 14;
const opsIn = type => S.ops.filter(o => o.type === type && (NOW - o.at) / 864e5 < QUOTA_DAYS);
const left = type => opsIn(type).length < 1;
const freeOn = type => { const o = opsIn(type)[0]; if (!o) return ''; const d = new Date(o.at); d.setDate(d.getDate() + QUOTA_DAYS); return d; };
function useOp(type) { S.ops.push({ type, at: new Date(NOW) }); }
function quotaBox() {
  const r = left('resch'), c = left('cancel'), cell = (ty, ok, n) => `<span class="${ok ? '' : 'used'}">${n}${L('剩余', ' left: ')} <b>${ok ? 1 : 0}</b>${L(' 次', '')}${ok ? '' : `<em>${L(`${shortDay(freeOn(ty))} 恢复`, `back on ${shortDay(freeOn(ty))}`)}</em>`}</span>`;
  const rule = `<div class="quota">${I('info', 's')}<span class="grow">${L('为保证其他同学也能约到时间，每 14 天可改期 1 次、取消 1 次（老师调整时间不计入）。', 'So everyone gets a fair chance to book, you can reschedule once and cancel once every 14 days. Changes made by your counsellor don’t count.')}</span>${cell('resch', r, L('改期', 'Reschedules'))}${cell('cancel', c, L('取消', 'Cancellations'))}</div>`;
  if (r && c) return rule;
  return rule + `<div class="urg"><b>${I('heart', 's')}${L('如果你需要尽快和人聊聊，不用等到下个周期', 'Need to talk to someone sooner? You don’t have to wait')}</b><div><span><b>SOS</b> <a class="tel" href="tel:1767">1767</a> · ${L('24 小时', '24 h')}</span><span><b>mindline</b> <a class="tel" href="tel:1771">1771</a> · ${L('24 小时', '24 h')}</span><span><b>UCC</b> ${L('工作日 8:30–17:30', 'Weekdays 8:30–17:30')}</span><span><b>${L('紧急情况', 'Emergency')}</b> <a class="tel" href="tel:995">995</a></span></div></div>`;
}

/* 老师主页：我和这位老师的预约与咨询记录（只显示时间和类型，咨询内容由老师保密记录） */
function cRecords(c) {
  const h = S.bkHist.filter(x => x.cid === c.id), cur = S.bk && S.bk.cid === c.id ? S.bk : null;
  if (!h.length && !cur) return '';
  const done = h.filter(x => x.st === '已完成').sort((a, b) => a.at - b.at), mins = done.reduce((n, x) => n + (x.kind === '预咨询' ? 30 : 50), 0);
  const stat = (n, t) => `<div><b>${n}</b><small>${t}</small></div>`;
  const nth = x => done.indexOf(x) >= 0 ? L(`第 ${done.indexOf(x) + 1} 次`, `Session ${done.indexOf(x) + 1}`) : '';
  return `<div class="sect">${L(`我和 ${who(c)}的咨询`.replace(/和 (?=[\u4e00-\u9fa5])/, '和'), `My sessions with ${c.name}`)}</div><div class="panel crec">
    <div class="cstat">${stat(done.length, L('已完成咨询', 'Sessions completed'))}${stat(done.length ? shortDay(done[0].at) : '—', L('第一次见面', 'First met'))}${stat(mins ? L(`${mins} 分钟`, `${mins} min`) : '—', L('累计时长', 'Total time'))}${stat(cur ? shortDay(DAYS[cur.di]) : '—', L('下一次', 'Next'))}</div>
    ${cur ? bkMini(cur) : ''}
    ${h.map(x => histRow(x, nth(x))).join('')}
    <p class="note" style="margin:12px 0 0">${I('lock', 's')} ${L('这里只显示时间和类型。咨询中聊到的内容由老师保密记录，不会显示在这里。', 'Only dates and types are shown. What you talk about is kept confidential by your counsellor and never appears here.')}</p></div>`;
}
const histRow = (h, extra = '') => { const off = h.st !== '已完成'; return `<div class="row hrow ${off ? 'off' : ''}"><span class="st ${off ? '' : 'g'}">${T(h.st)}</span>${avatar(C(h.cid))}<div class="grow"><b>${T(h.kind)}${extra ? ` · ${extra}` : ''}</b> <button class="lnk" data-act="cp" data-arg="${h.cid}" style="font-weight:400">${who(C(h.cid))}</button><small>${fmtDay(h.at)} ${String(h.at.getHours()).padStart(2, '0')}:${String(h.at.getMinutes()).padStart(2, '0')}</small></div></div>`; };

/* ---------- 我的预约 ---------- */
function bkWarn(b) {
  if (b.pend && b.pend.type === 'resch') return `<div class="warnbar"><span class="ico">${I('edit')}</span><div class="grow"><b>${L('改期申请等待老师同意', 'Waiting for approval to reschedule')}</b><small>${L(`新时间：${fmtDay(DAYS[b.pend.di])} ${DATA.times[b.pend.ti]}，${who(C(b.pend.cid))}。老师同意之前，下面的原预约仍然有效。`, `New time: ${fmtDay(DAYS[b.pend.di])} ${DATA.times[b.pend.ti]} with ${C(b.pend.cid).name}. Until approved, the appointment below stands.`)}</small></div></div>`;
  if (b.pend) return `<div class="warnbar"><span class="ico">${I('x')}</span><div class="grow"><b>${L('取消申请等待老师同意', 'Waiting for approval to cancel')}</b><small>${L('老师同意之前，这次预约仍然有效。', 'Until approved, this appointment stands.')}</small></div></div>`;
  if (b.st === '已改约') return `<div class="warnbar"><span class="ico">${I('cal')}</span><div class="grow"><b>${L('老师提出了新时间，等你接受', 'New time proposed — please accept')}</b><small>${L(`由 ${b.oldWhen} 改为 ${fmtDay(DAYS[b.di])} ${DATA.times[b.ti]}`, `From ${b.oldWhen} to ${fmtDay(DAYS[b.di])} ${DATA.times[b.ti]}`)}</small></div><button class="btn pri sm" data-act="movedOk">${L('接受新时间', 'Accept')}</button></div>`;
  return '';
}
function myBookPage() {
  const b = S.bk;
  let cur = '';
  if (b) {
    const c = C(b.cid), conf = b.st === '已确认', moved = b.st === '已改约', step = conf ? 2 : 1, end = addMin(DATA.times[b.ti], b.kind === '预咨询' ? 30 : 50);
    cur = `<div class="bk"><div class="bh ${conf ? 'ok' : ''}">${avatar(c)}<div class="grow"><b>${T(b.kind)}</b><br><button class="lnk" data-act="cp" data-arg="${c.id}">${who(c)}</button><small style="color:var(--mute2)">${SEP()}${T(c.role)}</small></div><span class="pill ${conf && !b.pend ? 'g' : ''}">${b.pend ? (b.pend.type === 'cancel' ? L('取消待老师同意', 'Cancellation pending') : L('改期待老师同意', 'Reschedule pending')) : moved ? L('待接受新时间', 'Acceptance pending') : T(b.st)}</span></div>
      <div class="bb">${bkWarn(b)}<div class="tl">${[L('提交申请', 'Requested'), L('老师确认', 'Confirmed'), L('咨询', 'Session'), L('完成', 'Done')].map((x, i) => `<div class="${i < step ? 'on' : ''}">${x}</div>`).join('')}</div>
      <div class="kv">${I('cal', 's')}<span>${L('时间', 'When')}</span><b>${fmtDay(DAYS[b.di])} ${DATA.times[b.ti]}–${end}</b>
        ${I(b.mode === '线上' ? 'video' : 'pin', 's')}<span>${b.mode === '线上' ? L('线上', 'Online') : L('地点', 'Where')}</span><b>${conf ? (b.mode === '线上' ? L('Zoom 会议链接，开始前 30 分钟可进入', 'Zoom link — opens 30 min before') : DATA.room) : (b.mode === '线上' ? L('确认后发送会议链接', 'Link sent after confirmation') : L('确认后通知具体房间', 'Room shared after confirmation'))}</b>
        ${I('chat', 's')}<span>${L('想聊的主题', 'Topics')}</span><b>${b.topics.map(T).join(L('、', ', ')) || L('未填写', 'None given')}</b></div>
      <div class="tip">${conf ? L('开始前一天和开始前 1 小时会提醒你。如需改期，请至少提前 24 小时。', 'We’ll remind you the day before and 1 hour before. Reschedule at least 24 hours ahead if needed.')
        : moved ? L('新时间需要你接受才会确认。方便的话请点「接受新时间」；不方便可以改期另选时间。', 'Please accept the new time to confirm it. If it does not work, reschedule to pick another time.')
        : b.late ? L('老师还没有确认。我们已提醒 UCC 跟进，这个时段仍为你保留。着急的话，可以直接联系 UCC。', 'Not confirmed yet. We’ve asked UCC to follow up, and the time is still held for you. If it’s urgent, contact UCC directly.')
        : L('这个时段已为你保留。老师确认后才算预约成功，通常 2 个工作日内回复。', 'This time is held for you. It’s booked once the counsellor confirms — usually within 2 working days.')}</div>
      <div class="act">${b.pend ? `<button class="btn sec sm" data-act="pendBack">${L('撤回申请', 'Withdraw request')}</button><span class="zap" data-act="zPend">⚡ ${L('演示 · 模拟老师同意', 'Demo: counsellor approves')}</span>` : `<button class="btn sec sm" data-act="resch" ${left('resch') || moved ? '' : 'disabled'}>${I(left('resch') || moved ? 'edit' : 'lock', 's')}${L('改期', 'Reschedule')}</button><button class="btn ghost sm" data-act="modal" data-arg="cancel" ${left('cancel') ? '' : 'disabled'}>${left('cancel') ? '' : I('lock', 's')}${L('取消预约', 'Cancel')}</button>`}
        ${b.pend ? '' : conf ? `${b.kind === '预咨询' && !b.moved ? `<span class="zap" data-act="zDecline">⚡ ${L('演示 · 模拟老师婉拒', 'Demo: counsellor declines')}</span>` : ''}<span class="zap" data-act="zMove">⚡ ${L('演示 · 模拟老师改约', 'Demo: counsellor moves it')}</span><span class="zap" data-act="zRemind">⚡ ${L('演示 · 模拟开始前提醒', 'Demo: pre-session reminder')}</span><span class="zap" data-act="zDone">⚡ ${L('演示 · 模拟咨询完成', 'Demo: session completed')}</span>` : `<span class="zap" data-act="zConfirm">⚡ ${L('演示 · 模拟老师确认', 'Demo: counsellor confirms')}</span>${moved ? '' : `<span class="zap" data-act="zDecline">⚡ ${L('演示 · 模拟老师婉拒', 'Demo: counsellor declines')}</span><span class="zap" data-act="zLate">⚡ ${L('演示 · 模拟超时未确认', 'Demo: no reply in time')}</span>`}${moved ? '' : `<span class="zap" data-act="zMove">⚡ ${L('演示 · 模拟老师改约', 'Demo: counsellor moves it')}</span>`}`}</div></div></div>`;
  } else cur = `<div class="bk"><div class="bb" style="text-align:center;padding:34px 24px"><img src="${MASCOT}" alt="" style="width:64px;height:64px;border-radius:14px;margin:0 auto 12px"><p style="color:var(--ink2);margin:0 0 4px">${L('目前没有进行中的预约', 'No upcoming appointments')}</p><p style="color:var(--mute2);font-size:13px;margin:0 0 16px">${L('想找人聊聊的时候，可以约一位大学心理咨询中心的老师。', 'Whenever you’d like to talk, you can book time with a UCC counsellor.')}</p><button class="btn pri" data-act="go" data-arg="book">${L('预约咨询', 'Book a session')}</button></div></div>`;
  let chg = '';
  if (S.chg) chg = S.chg.st === '审批中'
    ? `<div class="bk"><div class="bh"><span class="ico" style="color:var(--gold2)">${I('swap')}</span><div class="grow"><b>${L('更换咨询师申请', 'Counsellor change request')}</b></div><span class="pill">${T('审批中')}</span></div><div class="bb">
       <div class="kv">${I('users', 's')}<span>${L('当前', 'Current')}</span><b>${who(C(S.chg.from))}</b>${I('info', 's')}<span>${L('原因', 'Reason')}</span><b>${T(S.chg.why)}</b></div>
       <div class="tip">${L(`需要${who(C(S.chg.from))}同意。通过后，你需要先和新的老师进行一次预咨询。`, `${who(C(S.chg.from))} needs to approve. Then you’ll start with an intake chat with a new counsellor.`)}</div>
       <div class="act"><button class="btn ghost sm" data-act="chgWithdraw">${L('撤回申请', 'Withdraw request')}</button><span class="zap" data-act="zChg">⚡ ${L(`演示 · 模拟${who(C(S.chg.from))}同意`, `Demo: ${who(C(S.chg.from))} approves`)}</span></div></div></div>`
    : `<div class="bk"><div class="bh ok"><span class="ico" style="color:var(--ok)">${I('check')}</span><div class="grow"><b>${L('更换申请已通过', 'Change approved')}</b></div><span class="pill g">${T('已同意')}</span></div><div class="bb" style="color:var(--ink2)">${L('请先预约一次预咨询，和新的老师认识一下，再继续后面的咨询。', 'Book an intake chat to meet a new counsellor before continuing.')} <button class="btn pri sm" data-act="go" data-arg="book" style="margin-left:8px">${L('去预约', 'Book now')}</button></div></div>`;
  const hist = S.bkHist.map(h => histRow(h)).join('') || `<div class="empty" style="padding:20px 0">${L('还没有历史预约', 'No past appointments')}</div>`;
  return tpl('p-mybook', { cur, chg, hist, quota: quotaBox() });
}
const addMin = (t, m) => { const [h, mm] = t.split(':').map(Number), x = h * 60 + mm + m; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };

/* ---------- 弹窗 ---------- */
const cardVariant = lv => lv >= 3 ? 'care' : 'calm';
const MODALS = {
  pause: () => tpl('m-pause', { until: TD(S.task).until }),
  later: () => tpl('m-later', { until: TD(S.task).until }),
  redo: () => tpl('m-redo'),
  resch: () => { const b = S.bk, c = C(b.cid), when = bkWhen(b), moved = b.st === '已改约';
    return tpl('m-resch', { body: (b.st === '已确认' ? L(`${who(c)}已经确认了这次预约（${when}）。<br>改期需要老师同意；在老师同意之前，原预约仍然有效。`, `${c.name} has confirmed this appointment (${when}).<br>Rescheduling needs their approval; until then, the original time stands.`)
      : L(`接下来请选一个新的时间。<br>提交新时间之后，这次预约（${when}）才会作废；中途放弃，原预约不受影响。`, `Next, pick a new time.<br>Your current appointment (${when}) is only replaced once you submit. If you stop halfway, nothing changes.`))
      + (moved ? `<br><span class="qn" style="color:var(--ok);background:var(--ok-bg)">${L('老师调整引起的改期，不占用你的改期次数。', 'Because your counsellor changed the time, this doesn’t count toward your limit.')}</span>` : `<br><span class="qn">${L('提交后会用掉本周期（14 天）唯一的一次改期机会。', 'Submitting uses your one reschedule for this 14-day period.')}</span>`) }); },
  info: () => { const x = S.info; return tpl('m-info', { ico: I(x.ico || 'info'), title: x.title, body: x.body, btns: (x.btn ? `<button class="btn sec" data-act="close">${L('知道了', 'Got it')}</button><button class="btn pri" data-act="go" data-arg="${x.btn[0]}">${x.btn[1]}</button>` : `<button class="btn pri" data-act="close">${L('知道了', 'Got it')}</button>`) }); },
  doc: () => { const d = DOCS().find(x => x.k === S.doc), h = tpl('m-doc', { title: d.name, meta: d.meta, doc: tpl('doc-' + d.k) });
    /* v1.14：知情同意不能在线撤回，点了只提示联系 UCC */
    return d.k === 'consent' ? h.replace('<div class="acts">', `<div class="acts"><button class="btn ghost" data-act="consentWd">${L('撤回同意', 'Withdraw consent')}</button>`) : h; },
  appr: () => { const a = S.appr, c = C(a.cid); return tpl('m-appr', { title: a.type === 'cancel' ? L('老师同意了你的取消申请', 'Your cancellation was approved') : L('老师同意了你的改期申请', 'Your reschedule was approved'), body: a.type === 'cancel' ? L(`${who(c)}同意了取消，${a.when} 的预约已取消，时段已释放。需要的时候，可以重新预约。`, `${c.name} approved it. Your appointment on ${a.when} is cancelled. You can book again whenever you need.`) : L(`新的预约时间是 ${a.when}，${who(c)}。开始前一天和 1 小时会提醒你。`, `Your new time is ${a.when} with ${c.name}. We’ll remind you the day before and 1 hour before.`), ok: a.type === 'cancel' ? 'g' : '' }); },
  moved: () => { const b = S.bk, c = C(b.cid); return tpl('m-moved', { name: who(c), old: b.oldWhen, new: `${fmtDay(DAYS[b.di])} ${DATA.times[b.ti]}` }); },
  doneS: () => tpl('m-doneS', { tName: TD(S.task).name, reuseLine: Object.keys(S.task.reused).length ? L('<br>其中的问卷沿用了你最近一次的回答。', '<br>Answers from your recent questionnaire were reused.') : '' }),
  remind: () => { const p = pendingTasks(), n = p.length, req = p.filter(t => TD(t).req).length;
    return tpl('m-remind', { title: req ? L(`你有 ${n} 项问卷待完成`, `You have ${n} questionnaire${n > 1 ? 's' : ''} to do`) : L(`有 ${n} 项选做问卷`, `${n} optional questionnaire${n > 1 ? 's' : ''} for you`),
      lead: req ? L('必做的请在截止日期前完成；选做的可以按自己的节奏来。', 'Please finish required ones before they’re due. Optional ones can wait until you have time.') : L('有空的时候可以看看，不做也没关系。', 'Take a look when you have time — it’s entirely up to you.'),
      rows: p.map(t => `<div class="rem"><div class="grow"><b>${TD(t).name} ${reqTag(t)}${inProg(t) ? ` <span class="pill">${L('进行中', 'In progress')}</span>` : t.phase === 'none' ? ` <span class="pill n">${L('新', 'New')}</span>` : ''}</b><small>${L('来自', 'From')} ${TD(t).from}${SEP()}${L(`${TD(t).until}截止`, `Due ${TD(t).until}`)}</small></div><button class="btn ${inProg(t) ? 'pri' : 'soft'} sm" data-act="remindOne" data-arg="${t.id}">${inProg(t) ? L('继续', 'Continue') : L('去完成', 'Start')}</button></div>`).join('') }); },
  ec: () => tpl('m-ec', { name: esc(S.ec.name), tel: esc(S.ec.tel), ccSel: ccSel('ec.cc', S.ec.cc), max: telMax(S.ec.cc), rels: DATA.rels.map(x => `<option value="${x}" ${x === S.ec.rel ? 'selected' : ''}>${T(x)}</option>`).join(''), err: S.ec.err ? `<div class="err-t" style="margin:-6px 0 8px">${L(...S.ec.err)}</div>` : '' }),
  switch: () => { const c = S.tasks.find(x => x !== S.switchTo && inProg(x)); return tpl('m-switch', { cur: TD(c).name, prog: progTxt(c) }); },
  safe: () => tpl('m-safe', { ec: ecLine()[0], ecTel: ecLine()[1], oops: S.safeOops ? `<div class="oops">${L('没关系，你可以回到题目里改正答案。为了你的安全，UCC 老师仍可能联系你确认一下，这不会影响你的任何记录。', 'No problem — you can go back and change your answer. To be safe, a UCC counsellor may still check in with you. It won’t affect any of your records.')}</div>` : `<button class="lnk" data-act="safeOops" style="font-size:13px;margin-bottom:6px">${L('我点错了', 'I picked that by mistake')}</button>` }),
  done: () => { const t = S.task, re = TS(t).filter(sc => t.reused[sc.k]).length; return tpl('m-done', { nsc: TS(t).length - re, reNote: re ? L(`另有 ${re} 份问卷沿用了你之前的回答。<br>`, `${re} more used your earlier answers.<br>`) : '', rounds: t.rounds, mins: minsUsed() }); },
  invite: () => tpl('m-invite', { help: S.task.lv >= 5 ? `<div class="box2"><div><b>${L('新加坡援人协会 SOS', 'Samaritans of Singapore (SOS)')}</b><span>1767 · ${L('24 小时', '24 hours')}</span></div><div><b>${L('你的紧急联系人', 'Your emergency contact')} ${ecLine()[0]}</b><span>${ecLine()[1]}</span></div></div><p style="font-size:13px">${L('如果你现在感到不安全，请先联系上面的人。', 'If you don’t feel safe right now, please contact them first.')}</p>` : '' }),
  card: () => { const k = S.cardKey, h = k === 'cur' ? null : S.history[+k.slice(1)];
    return tpl('m-card', { date: dateTxt(h ? h.at : aiTask().doneAt), secs: DATA.cards[h ? h.card : cardVariant(aiTask().lv)].map(([a, b]) => `<b>${a}</b><p>${b}</p>`).join(''), qr: qrSvg(k === 'cur' ? 11 : 5) }); },
  share: () => tpl('m-share', { line: DATA.shareLine }),
  trans: () => tpl('m-trans', { lines: (S.transMsgs || (aiTask().msgs.length ? aiTask().msgs : demoTranscript())).filter(m => !m.help).map(m => `<p style="margin:0 0 12px;color:var(--ink2)"><b style="color:${m.who === 'bot' ? 'var(--gold2)' : 'var(--ink)'}">${m.who === 'bot' ? L('小屿', 'Xiaoyu') : L('我', 'Me')}：</b>${m.who === 'bot' ? m.text : esc(m.text)}</p>`).join('') }),
  counsellor: () => { const c = C(S.who), j = ci(S.who), byDay = [];
    DAYS.forEach((d, di) => { const ts = DATA.times.map((_, ti) => [ti, slotState(j, di, ti)]).filter(x => x[1] === 'open' || x[1] === 'taken'); if (ts.length) byDay.push(`<div class="crow" style="padding:10px 14px"><div class="who" style="width:120px"><b>${shortDay(d)} <span style="color:var(--mute2);font-weight:400">${WDS()[d.getDay()]}</span></b></div><div class="times">${ts.map(([ti, st]) => slotBtn(c, di, ti, st)).join('')}</div></div>`); });
    return tpl('m-counsellor', { av: avatar(c, 'l'), name: who(c), role: T(c.role), campus: T(c.campus), bio: c.bio, tags: c.tags.map(x => `<span>${T(x)}</span>`).join(''), slots: byDay.slice(0, 5).join('') }); },
  submit: () => { const p = S.pick, c = C(p.cid);
    return tpl('m-submit', { note: esc(S.bkNote || ''), mTitle: S.resch ? L('确认新的预约时间', 'Confirm your new time') : L('确认预约信息', 'Confirm your request'), mBtn: S.resch ? (S.resch.approval ? L('提交改期申请', 'Request this new time') : L('提交新时间', 'Submit new time')) : L('提交预约申请', 'Send request'), name: `${who(c)}${SEP()}${T(c.role)}`, when: `${fmtDay(DAYS[p.di])} ${DATA.times[p.ti]}`, kind: S.owner ? L('正式咨询，约 50 分钟', 'Counselling session, about 50 min') : L('预咨询，约 30 分钟', 'Intake chat, about 30 min'),
      modes: ['线下', '线上'].map(m => `<button class="${S.form.mode === m ? 'on' : ''}" data-act="fMode" data-arg="${m}">${I(m === '线上' ? 'video' : 'pin', 's')} ${m === '线下' ? L(`线下（${T(c.campus)}）`, `In person (${T(c.campus)})`) : L('线上视频', 'Online video')}</button>`).join(''),
      topics: DATA.topics.map(x => `<button class="${S.form.topics.includes(x) ? 'on' : ''}" data-act="fTopic" data-arg="${x}">${T(x)}</button>`).join('') }); },
  cancel: () => { const st = S.bk.st;
    return tpl('m-cancel', { body: st === '已改约' ? L('老师调整了时间，你可以直接取消，不占用你的取消次数。时段会释放给其他同学。', 'Your counsellor changed the time, so cancelling won’t count toward your limit.')
      : (st === '已确认' ? L('老师已经确认了这次预约。取消需要老师同意；在老师同意之前，原预约仍然有效。', 'Your counsellor has confirmed this appointment. Cancelling needs their approval; until then, it stands.') : L('取消后，这个时段会释放给其他同学。之后需要时，可以重新预约。', 'The time will be released to other students. You can book again whenever you need.'))
        + `<br><span class="qn">${L('这会用掉本周期（14 天）唯一的一次取消机会。', 'This uses your one cancellation for this 14-day period.')}</span>` }); },
  booked: () => { const b = S.bk, k = S.booked, p = k === 'pend' ? b.pend : b, c = C(p.cid);
    return tpl('m-booked', { title: { pend: L('改期申请已提交', 'Reschedule request sent'), resch: L('新的预约时间已提交', 'New time sent'), new: b.st === '已确认' ? L('预约成功', 'You’re booked') : L('预约申请已提交', 'Request sent') }[k], name: who(c), when: bkWhen(p),
      text: k === 'pend' ? L('老师同意后，新时间才会生效；在那之前，原预约仍然有效。结果会通过站内消息和短信通知你。', 'The new time takes effect once your counsellor approves. Until then, your original appointment stands. We’ll let you know in-app and by SMS.')
        : b.st === '已确认' ? L('预约已经成功，不需要再等老师确认。如果之后要改期或取消，需要老师同意。预约前一天会通过站内消息和短信提醒你。', 'You’re all set — no need to wait for confirmation. Rescheduling or cancelling later needs your counsellor’s approval. We’ll remind you the day before, in-app and by SMS.')
        : L('这个时段已为你保留。老师确认后才算预约成功，通常 2 个工作日内回复，结果会通过站内消息和短信通知你。', 'This time is held for you. It’s booked once the counsellor confirms — usually within 2 working days. We’ll let you know in-app and by SMS.') }); },
  change: () => tpl('m-change', { cur: who(C(S.owner)),
    reasons: ['时间不方便', '想换个校区', '想尝试不同风格', '其他'].map(x => `<button class="${S.chgWhy === x ? 'on' : ''}" data-act="chgWhy" data-arg="${x}">${T(x)}</button>`).join('') }),
  gd: () => { const g = DATA.garden.find(x => x.id === S.garden.cur), st = S.garden.step, n = g.steps.length;
    /* 文章：全文；活动：详情 + 报名 */
    if (g.type === 'article' || g.type === 'event') { const ev = g.type === 'event', joined = (S.joined || []).includes(g.id);
      return tpl('m-gd', { src: `${gTypeLbl(g)}${SEP()}${T(g.src)}`, title: g.title, stepLbl: '', prog: '',
        body: `<div class="banner">${art(g, 'big')}</div>` + (ev ? `<div class="box2" style="text-align:left"><div><span>${L('时间', 'When')}</span><b>${L(`${g.date[0]} 月 ${g.date[1]} 日`, `${g.date[1]} ${MON[g.date[0] - 1]}`)} ${g.dur}</b></div><div><span>${L('地点', 'Where')}</span><b>${g.place}</b></div></div>` : `<p style="font-size:12.5px;color:var(--mute2);margin:10px 0 0">${g.dur}</p>`)
          + `<div class="art-body">${g.steps.map(x => `<p>${x}</p>`).join('')}</div>`,
        btns: ev ? (joined ? `<span class="pill g" style="padding:6px 14px">${I('check', 's')}${L('已报名，活动前一天会提醒你', 'Registered — we’ll remind you the day before')}</span>` : `<button class="btn sec" data-act="close">${L('再看看', 'Maybe later')}</button><button class="btn pri" data-act="gJoin">${L('报名参加', 'Register')}</button>`)
          : `<button class="btn pri" data-act="close">${L('读完了', 'Done reading')}</button>` }); }
    const media = g.breath ? `<div class="breath">${L('跟着呼吸', 'Breathe with me')}</div>`
      : g.type === 'video' ? `<div class="player ${S.playing ? 'on' : ''}">${art(g, 'big')}<button class="play" data-act="gPlay" aria-label="play">${I(S.playing ? 'pause' : 'play')}</button><div class="ctl"><span class="pb"><i style="width:${Math.round((st + 1) / n * 100)}%"></i></span><span>${g.dur}</span></div><span class="demo-cap">${L('演示：视频内容以要点代替', 'Demo: key points shown instead of video')}</span></div>`
      : `<div class="aplay ${S.playing ? 'on' : ''}"><button class="th" data-act="gPlay">${art(g, 'sq')}<span class="play">${I(S.playing ? 'pause' : 'play')}</span></button><div class="wv">${Array.from({ length: 36 }, (_, i) => `<i class="${i / 36 <= (st + 1) / n ? 'on' : ''}" style="height:${8 + Math.round(Math.abs(Math.sin(i * 1.7)) * 22)}px"></i>`).join('')}</div><span style="color:var(--mute2);font-size:12px">${g.dur}</span></div>`;
    return tpl('m-gd', { src: `${gTypeLbl(g)}${SEP()}${T(g.src)}`, title: g.title, stepLbl: g.type === 'video' ? L(`要点 ${st + 1} / ${n}`, `Key point ${st + 1} of ${n}`) : L(`第 ${st + 1} / ${n} 步`, `Step ${st + 1} of ${n}`),
      body: media + `<p class="gtx">${g.steps[st]}</p>`,
      prog: g.steps.map((_, i) => `<i class="${i <= st ? 'on' : ''}"></i>`).join(''),
      btns: (st > 0 ? `<button class="btn sec" data-act="gStep" data-arg="-1">${L('上一步', 'Back')}</button>` : '') + (st < n - 1 ? `<button class="btn pri" data-act="gStep" data-arg="1">${L('下一步', 'Next')}</button>` : `<button class="btn pri" data-act="gDone">${L('完成', 'Done')}</button>`) }); },
  help: () => tpl('m-help'), about: () => tpl('m-about'), fbok: () => tpl('m-fbok'),
};
/* 完整的演示对话：开场 → 6 轮问答（带承接语）→ 结束语 */
function fullTranscript(tag = 0) { const m = [{ who: 'bot', text: DATA.greet }];
  DATA.script.forEach((q, i) => { m.push({ who: 'bot', text: (i ? DATA.acks[tag][i % DATA.acks[tag].length] + ' ' : '') + q.q }, { who: 'me', text: q.tags[tag] }); });
  m.push({ who: 'bot', text: DATA.closing }); return m; }
const demoTranscript = () => fullTranscript(0);

/* ---------- 动作 ---------- */
const ACT = {
  go(p) { S.menu = false; S.modal = null; S.after = null; if ((p === 'home' || p === 'mybook') && S.bk && S.bk.st === '已改约' && !S.bk.moveSeen) { S.bk.moveSeen = true; S.modal = 'moved'; } if (p === 'book' && !S.bk) S.resch = false; S.page = p; if (p === 'session') S.scrollEnd = true; },
  aiGo() { S.menu = false; S.page = 'ai'; },
  svGo(tab) { S.menu = false; S.sv = tab || 'todo'; S.page = 'surveys'; },
  svTab(k) { S.sv = k; },
  inbox() { S.menu = false; if (S.page !== 'msgs') S.msgFrom = S.page; S.page = 'msgs'; },
  msgBack() { S.page = S.msgFrom && S.msgFrom !== 'msgs' ? S.msgFrom : 'home'; S.msgFrom = null; },   // v1.18：消息中心能返回上一级（表格 S7）
  readAll() { S.inbox.forEach(x => x.read = true); },
  msgTab(k) { S.msgTab = k; },
  histChat(i) { S.transMsgs = S.history[+i].msgs || fullTranscript(0); S.modal = 'trans'; },
  fbGo() { S.page = 'fb'; S.pageTop = true; },
  cardChat() { if (S.cardKey === 'cur') { S.modal = null; ACT.viewChat(aiTask().id); } else { const h = S.history[+S.cardKey.slice(1)]; S.transMsgs = h.msgs || fullTranscript(0); S.modal = 'trans'; } },
  redoAsk(id) { S.task = S.tasks.find(x => x.id === id); S.modal = 'redo'; },
  viewChat(id) { const t = S.tasks.find(x => x.id === id); if (!t.msgs.length) t.msgs = demoTranscript(); S.task = t; S.page = 'session'; S.scrollEnd = true; },
  doc(k) { S.doc = k; S.modal = 'doc'; },
  consentWd() { toast(L('知情同意不能在线撤回。如需撤回，请联系大学心理咨询中心（UCC）。', 'Consent can’t be withdrawn online. To withdraw, please contact UCC.')); },
  footGo(i) { const g = S.foot[+i].go || 'go:home', k = g.indexOf(':'); ACT[g.slice(0, k)](g.slice(k + 1)); },
  back() { S.page = S.prev || 'book'; },
  msgOpen(i) { const x = S.inbox[+i]; x.read = true; const [k, v] = x.link.split(':');
    if (k === 'task') { const t = S.tasks.find(y => y.id === v); if (t.phase === 'expired') return ACT.go('myq'); S.task = t; return isDone(t) ? ACT.go(TD(t).ai ? 'talks' : 'myq') : ACT.taskGo(v); }
    if (k === 'cp') return ACT.cp(v);
    ACT.go(k); },
  funStart(a) { const [k, fresh] = a.split(':'); S.fun.drafts = S.fun.drafts || {}; S.fun.cur = k; S.fun.ans = fresh ? [] : (S.fun.drafts[k] || []); S.fun.miss = []; S.page = 'fun'; S.pageTop = true; },
  funView(k) { S.fun.cur = k; S.page = 'funres'; },
  funAns(a) { const [i, v] = a.split(':').map(Number); S.fun.ans[i] = v; S.fun.drafts[S.fun.cur] = S.fun.ans; S.fun.miss = S.fun.miss.filter(x => x !== i); },
  zFun() { const x = DATA.fun.find(y => y.k === S.fun.cur), n = x.ab ? 2 : x.opts.length; x.items.forEach((_, i) => S.fun.ans[i] = (i * 7 + 3) % n); S.fun.miss = []; },
  funSubmit() {
    const x = DATA.fun.find(y => y.k === S.fun.cur); S.fun.miss = x.items.map((_, i) => i).filter(i => S.fun.ans[i] == null);
    if (S.fun.miss.length) { toast(L(`还有 ${S.fun.miss.length} 题没选`, `${S.fun.miss.length} left`)); setTimeout(() => { const r = document.getElementById('f-' + S.fun.miss[0]); r && r.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 30); return; }
    S.fun.res[x.k] = { a: [...S.fun.ans], at: new Date(NOW) }; delete S.fun.drafts[x.k]; addFoot(x.ico, [`完成自我了解「${DATA_ZH.fun.find(y => y.k === x.k).name}」`, `Took the self-test “${deepMerge(DATA_ZH, DATA_EN).fun.find(y => y.k === x.k).name}”`], 'funView:' + x.k);
    S.page = 'funres'; S.pageTop = true;
  },
  ecOpen() { const p = prof(); S.ec = { name: p.ecName, rel: p.ecRel, tel: p.ecTel, cc: p.ecCc || '+65' }; S.modal = 'ec'; },
  ecSave() { const e = S.ec; if (!e.name || !telOk(e.cc, e.tel)) { e.err = (e.cc || '+65') === '+65' ? ['请填写姓名和 8 位手机号', 'Enter a name and an 8-digit mobile'] : ['请填写姓名和正确的手机号', 'Enter a name and a valid mobile number']; return; }
    if (e.tel === (prof().phone || P().phone)) { e.err = ['紧急联系人的手机号不能和你自己的相同', 'Your emergency contact needs a different number from yours']; return; }
    S.profile = { ...S.profile, ecName: e.name, ecRel: e.rel, ecTel: e.tel, ecCc: e.cc || '+65', _ecEdited: true }; S.modal = null; toast(L('紧急联系人已更新', 'Emergency contact updated')); },
  taskGo(id) {
    S.menu = false; const t = id ? S.tasks.find(x => x.id === id) : sortedTasks()[0];
    const other = S.tasks.find(x => x !== t && inProg(x) && !x.paused);
    if (other && !inProg(t)) { S.switchTo = t; S.modal = 'switch'; return; }
    S.task = t; openTask(t);
  },
  bridgeGo() { clearTimeout(S.bridgeT); const t = S.task; if (t.phase === 'bridge') startChat(t); },
  remindOne(id) { S.modal = null; ACT.taskGo(id); },
  remindGo() { S.modal = null; ACT.taskGo(pendingTasks()[0].id); },
  /* 重新对话：新一轮不改变任务的完成状态；上一轮存入历史，本轮的危机、邀请标记重置 */
  redoOk() {
    const t = S.task, d = DATA_ZH.tasks.find(x => x.id === t.id), dEn = deepMerge(DATA_ZH, DATA_EN).tasks.find(x => x.id === t.id), n = S.history.filter(h => h.tid === t.id).length + 1;
    S.history.unshift({ tid: t.id, name: [`${d.name}（第 ${n} 轮对话）`, `${dEn.name} (chat ${n})`], at: t.doneAt, rounds: t.rounds, mins: minsUsed(t), card: cardVariant(t.lv), msgs: t.msgs });
    addFoot('later', ['开始了新一轮和小屿的对话', 'Started a new chat with Xiaoyu'], 'go:ai');
    Object.assign(t, { redo: true, msgs: [], qi: 0, rounds: 0, concern: 0, crisis: false, paused: false, ackUsed: [] }); S.invited = false; S.inviteNo = false; S.modal = null; startChat(t);
  },
  switchGo() { S.modal = null; S.task = S.switchTo; openTask(S.task); },
  switchKeep() { S.modal = null; S.task = S.tasks.find(x => x !== S.switchTo && inProg(x)); openTask(S.task); },
  lang() { setLang(LANG === 'en' ? 'zh' : 'en'); },
  menu() { S.menu = !S.menu; },
  modal(m) { S.menu = false; S.modal = m; },
  close() { const m = S.modal; if (m === 'done') return afterDone(() => {}); if (m === 'doneS') return ACT.doneSOk(); if (m === 'share') { S.modal = 'card'; return; }
    if (m === 'card' && S.afterCard) { S.afterCard = false; return afterDone(() => {}); } if (m === 'trans') S.transMsgs = null; if (m === 'safe') S.safeOops = false; const a = S.after; S.modal = null; S.after = null; if (a) a(); },
  ovClose(_, e) { if (e.target.classList.contains('ov')) ACT.close(); },
  toast(k) { toast(L(...TOASTS[k])); },
  logout() { S.auth = false; S.menu = false; S.page = 'launch'; S.consent = { read: false, ok: false }; S.code = ''; S.codeSent = false; },
  /* 登录 */
  start() { if (SCENES[S.scen].returning) { S.consent = { read: true, ok: true }; S.page = 'phone'; } else S.page = 'consent'; },
  back1(p) { S.err = {}; S.rosterFail = false; S.page = p; },
  agree() { if (!S.consent.read) return toast(L('请先向下滚动，读完全部内容', 'Please scroll to the end first')); S.consent.ok = !S.consent.ok; },
  consentNext() { if (S.consent.ok) S.page = 'phone'; },
  zConsent() { S.consent = { read: true, ok: true }; },
  sendCode() { if (!telOk(S.cc, S.phone)) { S.err.phone = telErr(S.cc); return; } S.err.phone = ''; S.codeSent = true; S.codeFor = S.phone; S.cd = 60; toast(L('验证码已发送', 'Code sent')); },
  phoneNext() {
    S.err = {};
    if (!telOk(S.cc, S.phone)) S.err.phone = telErr(S.cc);
    else if (!S.codeSent || S.codeFor !== S.phone) S.err.code = ['手机号改过了，请重新获取验证码', 'Your number changed — request a new code'];
    else if (false) S.err.code = ['请先获取验证码', 'Request a code first'];
    else if (!/^\d{6}$/.test(S.code)) S.err.code = ['请输入 6 位验证码', 'Enter the 6-digit code'];
    if (S.err.phone || S.err.code) return;
    S.auth = true; if (S.profile) { enterHome(); } else S.page = 'info';
  },
  zPhone() { S.phone = P().phone; S.code = '039853'; S.codeSent = true; S.codeFor = S.phone; S.cd = 0; S.err = {}; },
  setF(a) { const [k, v] = a.split(':'); S.f[k] = v; if (k === 'school') { S.schoolOpen = false; S.schoolQ = ''; } },
  schoolDD() { S.schoolOpen = !S.schoolOpen; },
  infoNext() {
    const f = S.f; S.err = {}; S.scrollErr = true;
    if (!['name', 'age', 'gender', 'school', 'sid', 'campus', 'college', 'ecName', 'ecRel', 'ecTel'].every(k => (f[k] || '').trim())) { S.err.info = ['请完整填写带 * 的信息', 'Please fill in every field marked *']; return; }
    if (!/^\d{2}$/.test(f.age)) { S.err.info = ['请填写正确的年龄', 'Enter a valid age']; return; }
    if (!telOk(f.ecCc, f.ecTel)) { S.err.info = (f.ecCc || '+65') === '+65' ? ['请填写紧急联系人的 8 位手机号', 'Enter an 8-digit mobile for your emergency contact'] : ['请填写紧急联系人正确的手机号', 'Enter a valid mobile for your emergency contact']; return; }
    if (f.ecTel === S.phone && (f.ecCc || '+65') === (S.cc || '+65')) { S.err.info = ['紧急联系人的手机号不能和你自己的相同', 'Your emergency contact needs a different number from yours']; return; }
    const ok = DATA.roster.some(r => r.sid.toLowerCase() === f.sid.trim().toLowerCase() && r.phone === S.phone);
    S.rosterFail = !ok; if (!ok) return;
    S.profile = { ...f, phone: S.phone, cc: S.cc || '+65', _nameEdited: f.name !== P().name, _ecEdited: f.ecName !== P().ecName }; S.consentAt = new Date(NOW); enterHome();
  },
  zInfo() { const s = P(); Object.assign(S.f, { name: s.name, age: s.age, gender: s.gender, school: s.school, sid: s.sid, campus: s.campus, college: s.college, ecName: s.ecName, ecRel: s.ecRel, ecTel: s.ecTel }); S.rosterFail = false; S.err = {}; },
  zInfoBad() { ACT.zInfo(); S.f.sid = 'U2699999Z'; ACT.infoNext(); },
  /* 普测 */
  introGo() { if (S.task) S.task.declined = null;
    const t = S.task; TS(t).forEach(s => { const r = reuseFrom(t, s.k); if (r && (!S.reuse || S.reuse[s.k] !== false)) { t.ans[s.k] = [...r.a]; t.reused[s.k] = r.when; } });
    t.pg = 0; S.resetScroll = true;
    if (!qpages(t).length) { t.scaleLv = RULE.scaleLevel(t.ans); t.scaleAt = new Date(NOW); return TD(t).ai ? toChat(t) : finishSurvey(t); }
    t.phase = 'scale'; S.page = 'survey';
  },
  reuseSet(a) { const [k, v] = a.split(':'); S.reuse[k] = v === '1'; },
  doneSOk() { afterDone(() => { S.page = 'home'; }); },
  ans(a) {
    const [k, i, v] = a.split(':'), t = S.task; t.ans[k][+i] = +v; t.miss = t.miss.filter(x => x !== k + i);
    if (RULE.riskHit(k, +i, +v) && !t.safeShown) { t.crisis = true; t.safeShown = true; S.modal = 'safe'; crisisFollow(); }
  },
  qPrev() { S.task.pg--; S.task.miss = []; S.pageTop = true; },
  qNext() {
    const t = S.task, pages = qpages(t), p = pages[t.pg], sc = DATA.scales.find(s => s.k === p.k);
    t.miss = []; for (let i = p.a; i < p.b; i++) if (t.ans[sc.k][i] == null) t.miss.push(sc.k + i);
    if (t.miss.length) { toast(L(`这一页还有 ${t.miss.length} 题没选`, `${t.miss.length} question${t.miss.length > 1 ? 's' : ''} left on this page`)); setTimeout(() => { const r = document.getElementById('r-' + t.miss[0]); r && r.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 30); return; }
    if (t.pg < pages.length - 1) { t.pg++; S.pageTop = true; return; }
    t.scaleLv = RULE.scaleLevel(t.ans); t.scaleAt = new Date(NOW);
    if (TD(t).ai) toChat(t); else finishSurvey(t);
  },
  zScale() { const f = FILLS[SCENES[S.scen].fill], t = S.task; TS(t).forEach(sc => t.ans[sc.k] = [...f[sc.k]]); t.miss = []; t.pg = qpages(t).length - 1;
    if (t.ans.phq9 && t.ans.phq9[8] >= 1 && !t.safeShown) { t.crisis = true; t.safeShown = true; S.modal = 'safe'; crisisFollow(); } },
  say(x) { userSay(x); },
  send() { const i = $('#chatIn'); if (!i || !i.value.trim()) return; userSay(i.value.trim()); },
  mic() {
    if (S.rec) { clearInterval(S.recT); const d = S.rec; S.rec = 0; const q = DATA.script[S.task.qi]; userSay(q ? q.tags[1] : L('嗯', 'Mm'), `0:${String(d).padStart(2, '0')}`); return; }
    S.rec = 1; S.recT = setInterval(() => { S.rec++; const e = document.querySelector('.rec em'); if (e) e.textContent = `${L('正在录音', 'Recording')} 0:${String(S.rec).padStart(2, '0')}`; }, 1000);
  },
  zChat() { S.fast = true; const tg = SCENES[S.scen].tag; while (S.task.phase === 'chat' && !S.task.paused) { const q = DATA.script[S.task.qi]; userSay(q.tags[tg]); } S.fast = false; },
  zCrisis() { userSay(DATA.crisisDemo); },
  resume() { const t = S.task; t.paused = false; S.scrollEnd = true;
    if (t.crisis) { const q = DATA.script[t.qi]; if (!q) return botSay(DATA.resumeAck, false, finish); botSay(DATA.resumeAck + ' ' + q.q); } },
  pauseOk() { S.task.paused = true; S.modal = null; },
  safeOops() { S.safeOops = true; },
  callUcc() { if (!S.callback) { S.callback = true; addMsg('phone', ['已请 UCC 今天联系你', 'UCC will call you today'], ['值班老师会在今天 17:30 前打电话给你。如果现在感到不安全，请拨打 995 或 1767（24 小时）。', 'A duty counsellor will call you before 5:30 pm today. If you don’t feel safe right now, call 995 or 1767 (24 hours).'], 'help', true); }
    S.info = { ico: 'phone', title: L('已通知 UCC 值班老师', 'UCC’s duty counsellor has been notified'), body: L(`值班老师会在今天 17:30 前打电话到你的手机 ${prof().cc || S.cc || '+65'} ${prof().phone || P().phone}。<br>如果现在感到不安全，请不要等待，直接拨打 <a class="tel" href="tel:995">995</a> 或 <a class="tel" href="tel:1767">1767</a>（24 小时）。`, `A duty counsellor will call ${prof().cc || S.cc || '+65'} ${prof().phone || P().phone} before 5:30 pm today.<br>If you don’t feel safe right now, don’t wait — call <a class="tel" href="tel:995">995</a> or <a class="tel" href="tel:1767">1767</a> (24 hours).`) }; S.modal = 'info'; },
  laterOk() { S.modal = null; S.page = 'home'; toast(L('进度已保存', 'Progress saved')); },
  doneCard() { S.cardKey = 'cur'; S.modal = 'card'; S.afterCard = true; },
  doneFb() { afterDone(() => { S.page = 'fb'; }); },
  inviteGo() { S.invited = true; S.modal = null; S.after = null; S.page = 'book'; },
  inviteNo() { S.invited = true; S.inviteNo = true; const a = S.after; S.modal = null; S.after = null; if (a) a(); },
  card(k) { S.cardKey = k; S.modal = 'card'; S.menu = false; },
  /* 预约 */
  bTab(k) { S.bookTab = k; }, day(i) { S.day = +i; setTimeout(() => { const e = document.getElementById('slots'); if (e) e.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 30); }, bCampus(x) { S.campus = x; },
  who(id) { ACT.cp(id); },
  cp(id) { S.prev = S.page === 'cpage' ? S.prev : S.page; S.cp = id; S.modal = null; S.page = 'cpage'; S.pageTop = true; },
  pickSlot(a) {
    const [cid, di, ti] = a.split(':');
    S.pick = { cid, di: +di, ti: +ti }; S.form = S.resch && S.reschFrom ? { mode: S.reschFrom.mode, topics: [...S.reschFrom.topics] } : { mode: '线下', topics: [] }; S.bkNote = ''; S.modal = 'submit';
  },
  fMode(m) { S.form.mode = m; },
  fTopic(x) { const t = S.form.topics; S.form.topics = t.includes(x) ? t.filter(y => y !== x) : [...t, x]; },
  bookSubmit() {
    const r = S.resch, p = { ...S.pick, mode: S.form.mode, topics: S.form.topics, note: S.bkNote || '' };
    if (r && r.approval) { useOp('resch'); S.bk.pend = { type: 'resch', ...p }; addFoot('edit', ['申请改期，等待老师同意', 'Asked to reschedule'], 'go:mybook'); }
    else if (r) { const o = S.bk; if (!r.moved) useOp('resch'); S.bkHist.unshift({ cid: o.cid, at: slotDate(o), kind: o.kind, st: '已作废' });
      S.bk = { ...p, st: '待确认', kind: o.kind, moved: true, intake: o.intake }; addFoot('edit', ['改期：选择了新的预约时间', 'Rescheduled to a new time'], 'go:mybook'); }
    else { S.bk = { ...p, st: '待确认', kind: S.owner ? '正式咨询' : '预咨询' }; addFoot('cal', ['提交了一次预约申请', 'Sent a booking request'], 'go:mybook'); }
    S.booked = r ? (r.approval ? 'pend' : 'resch') : 'new'; S.resch = null; S.reschFrom = null; S.modal = 'booked'; },
  reschQuit() { S.resch = null; S.reschFrom = null; S.page = 'mybook'; toast(L('已放弃改期，原预约不变', 'Reschedule cancelled — nothing changed')); },
  zMove() { const b = S.bk, j = ci(b.cid); let di = b.di + 1, ti = -1;
    for (; di < DAYS.length; di++) { ti = DATA.times.findIndex((_, x) => slotState(j, di, x) === 'open'); if (ti >= 0) break; }
    if (ti < 0) { di = b.di; ti = (b.ti + 1) % DATA.times.length; if (di === b.di && ti === b.ti) return toast(L('这位老师近期没有其他空档', 'No other openings for this counsellor')); }
    b.oldWhen = bkWhen(b);
    const old = `${fmtDay(DAYS[b.di])} ${DATA.times[b.ti]}`; Object.assign(b, { di, ti, st: '已改约', moved: true });
    addMsg('edit', [`${whoZ(b.cid)}提出了新的预约时间`, `${C(b.cid).name} proposed a new appointment time`], [`由 ${old} 改为 ${fmtDay(DAYS[di])} ${DATA.times[ti]}。请在「我的预约」里接受新时间；不方便可以改期。`, `New time: ${fmtDay(DAYS[di])} ${DATA.times[ti]}. Accept it in My appointments, or reschedule if it does not work.`], 'mybook');
    b.moveSeen = true; S.modal = 'moved'; },
  movedOk() { S.bk.st = '已确认'; S.bk.moveSeen = true; S.modal = null; addFoot('check', ['接受了老师调整的预约时间', 'Accepted the new time'], 'go:mybook'); toast(L('已接受新时间', 'New time accepted')); },
  movedResch() { S.bk.moveSeen = true; S.modal = 'resch'; },
  pendBack() { const ty = S.bk.pend.type; S.ops = S.ops.filter(o => !(o.type === ty && o.at.getTime() === NOW.getTime())); S.bk.pend = null; toast(L('申请已撤回，原预约保持不变', 'Request withdrawn')); },
  zPend() { const b = S.bk, p = b.pend, cz = DATA_ZH.counsellors.find(x => x.id === b.cid).name;
    S.appr = { type: p.type, cid: p.type === 'cancel' ? b.cid : p.cid, when: p.type === 'cancel' ? `${fmtDay(DAYS[b.di])} ${DATA.times[b.ti]}` : `${fmtDay(DAYS[p.di])} ${DATA.times[p.ti]}` }; S.modal = 'appr';
    if (p.type === 'cancel') { S.bkHist.unshift({ cid: b.cid, at: slotDate(b), kind: b.kind, st: '已取消' }); S.bk = null; addMsg('cal', [`${whoZ(b.cid)}同意了取消`, 'Cancellation approved'], ['这次预约已取消，时段已释放', 'Your appointment has been cancelled'], 'mybook'); }
    else { S.bkHist.unshift({ cid: b.cid, at: slotDate(b), kind: b.kind, st: '已改期' }); S.bk = { cid: p.cid, di: p.di, ti: p.ti, mode: p.mode, topics: p.topics, kind: b.kind, st: '已确认', moved: true, intake: b.intake }; addMsg('cal', [`${whoZ(p.cid)}同意了改期`, 'Reschedule approved'], [`新的时间：${fmtDay(DAYS[p.di])} ${DATA.times[p.ti]}`, `New time: ${fmtDay(DAYS[p.di])} ${DATA.times[p.ti]}`], 'mybook'); }
  },
  zRemind() { const b = S.bk, c = C(b.cid), cz = DATA_ZH.counsellors.find(x => x.id === b.cid).name;
    addMsg('clock', ['预约提醒：明天有一次咨询', 'Reminder: your session is tomorrow'], [`${fmtDay(DAYS[b.di])} ${DATA.times[b.ti]}，${whoZ(b.cid)}，${b.mode === '线上' ? '线上（会议链接已发送）' : DATA_ZH.room}。如需改期，请尽快操作。`, `${DATA.times[b.ti]} with ${c.name}, ${b.mode === '线上' ? 'online' : 'UCC Room 3'}. Reschedule soon if needed.`], 'mybook', true);
    toast(L('已通过站内信和短信提醒', 'Reminder sent in-app and by SMS')); },
  zDue(id) { const t = S.tasks.find(x => x.id === id), dz = DATA_ZH.tasks.find(x => x.id === id), de = deepMerge(DATA_ZH, DATA_EN).tasks.find(x => x.id === id);
    addMsg('clock', [`「${dz.name}」还剩 2 天截止`, `“${de.name}” closes in 2 days`], [`请在 ${dz.until} 前完成。${inProg(t) ? '你的进度已保存，回来就能接着做。' : '大约需要 ' + dz.dur.replace('约 ', '') + '。'}`, `Please finish by ${de.until}. ${inProg(t) ? 'Your progress is saved.' : de.dur + '.'}`], 'task:' + id, true);
    toast(L('已通过站内信和短信提醒', 'Reminder sent in-app and by SMS')); },
  zDone() { const b = S.bk; S.bkHist.unshift({ cid: b.cid, at: slotDate(b), kind: b.kind, st: '已完成' }); addFoot('cal', [`和${whoZ(b.cid)}完成了一次${b.kind}`, `Had a ${T(b.kind).toLowerCase()} with ${C(b.cid).name}`], 'go:mybook');
    if (b.kind === '预咨询') { const nid = S.scen === 'A' || S.excl ? b.cid : 'c4'; S.owner = nid; S.reIntake = false; S.chg = null;
      addMsg('users', [`${whoZ(nid)}成为你的负责咨询师`, `${C(nid).name} is now your counsellor`], ['预咨询后由中心安排，之后的咨询会由 TA 持续陪伴你', 'Arranged by UCC after your intake chat — they’ll see you from now on'], 'cp:' + nid); }
    S.bk = null; toast(L('咨询已完成', 'Session completed')); },
  zConfirm() { S.bk.st = '已确认'; addMsg('cal', [`${whoZ(S.bk.cid)}已确认你的预约`, `${C(S.bk.cid).name} confirmed your appointment`], [`${fmtDay(DAYS[S.bk.di])} ${DATA.times[S.bk.ti]}，${S.bk.mode === '线上' ? '会议链接已发送' : DATA_ZH.room}`, `${DATA.times[S.bk.ti]} — ${S.bk.mode === '线上' ? 'link sent' : 'UCC Room 3'}`], 'mybook'); toast(L(`${who(C(S.bk.cid))}已确认你的预约`, `${who(C(S.bk.cid))} confirmed your appointment`)); },
  resch() { S.modal = 'resch'; },
  zDecline() { const b = S.bk, c = C(b.cid); S.bkHist.unshift({ cid: b.cid, at: slotDate(b), kind: b.kind, st: '已婉拒' }); S.bk = null;
    addMsg('cal', [`${whoZ(b.cid)}这次无法接待`, `${c.name} can’t take this appointment`], ['这个时段老师临时有安排，预约已取消，不占用你的取消次数。可以重新选一个时间。', 'Your counsellor isn’t available then. The booking is cancelled and doesn’t count toward your limit. Please pick another time.'], 'book', true);
    S.info = { ico: 'cal', title: L('老师这次无法接待', 'Your counsellor can’t make it'), body: L(`${who(c)}在 ${bkWhen(b)} 临时有安排，这次预约已取消，不占用你的取消次数。<br>可以重新选一个时间，或约其他老师。`, `${c.name} isn’t available on ${bkWhen(b)}, so this booking is cancelled. It doesn’t count toward your limit.<br>Pick another time or another counsellor.`), btn: ['book', L('重新预约', 'Book again')] }; S.modal = 'info'; },
  zLate() { S.bk.late = true; addMsg('clock', ['预约还在等待老师确认', 'Still waiting for confirmation'], ['已超过 2 个工作日，我们已提醒 UCC 跟进。这个时段仍为你保留。着急的话，可以直接联系 UCC。', 'It’s been over 2 working days. We’ve asked UCC to follow up, and the time is still held for you.'], 'mybook', true); toast(L('已通过站内信和短信提醒', 'Sent in-app and by SMS')); },
  /* 改期：先选新时间，提交后才作废旧预约、才计次；已确认的需老师同意；老师改约引发的不计次 */
  reschOk() { const b = S.bk, moved = b.st === '已改约'; if (!moved && !left('resch')) { S.modal = null; return; }
    S.resch = { approval: b.st === '已确认', moved }; S.reschFrom = { ...b }; b.moveSeen = true; S.modal = null; S.page = 'book'; S.bookTab = 'time'; S.pageTop = true; },

  cancelOk() { const moved = S.bk.st === '已改约'; if (!moved && !left('cancel')) { S.modal = null; return; } if (!moved) useOp('cancel'); if (S.bk.st === '已确认') { S.bk.pend = { type: 'cancel' }; S.modal = null; addFoot('cal', ['申请取消预约，等待老师同意', 'Asked to cancel'], 'go:mybook'); toast(L('已提交取消申请，等待老师同意', 'Cancellation requested')); return; }
    S.bkHist.unshift({ cid: S.bk.cid, at: slotDate(S.bk), kind: S.bk.kind, st: '已取消' }); addFoot('cal', ['取消了一次预约', 'Cancelled an appointment'], 'go:mybook'); S.bk = null; S.modal = null; toast(L('预约已取消，时段已释放', 'Appointment cancelled')); },
  chgTo(id) { S.chgTo = id; }, chgWhy(x) { S.chgWhy = x; },
  chgSubmit() { if (!S.chgWhy) return toast(L('请选择更换原因', 'Choose a reason')); S.chg = { from: S.owner, why: S.chgWhy, st: '审批中' }; addFoot('swap', ['申请更换负责咨询师', 'Requested a different counsellor'], 'go:mybook'); S.modal = null; S.page = 'mybook'; toast(L('更换申请已提交', 'Change request sent')); },
  chgWithdraw() { S.chg = null; toast(L('申请已撤回', 'Request withdrawn')); },
  zChg() { S.excl = S.chg.from; S.owner = null; S.reIntake = true; S.chg.st = '已同意'; addMsg('swap', ['更换咨询师申请已通过', 'Counsellor change approved'], ['请先和新的老师进行一次预咨询，再继续后面的咨询', 'Start with an intake chat with a new counsellor'], 'book'); toast(L('更换申请已通过', 'Change approved')); },
  /* 园区 */
  gTab(t) { S.garden.tab = t; },
  gOpen(a) { const [id, st] = a.split(':'); const g0 = DATA_ZH.garden.find(x => x.id === id), g1 = deepMerge(DATA_ZH, DATA_EN).garden.find(x => x.id === id); if (!S.foot.length || S.foot[0].gid !== id) { addFoot(g0.ico, [`看了「${g0.title}」`, `Viewed “${g1.title}”`], `gOpen:${id}:0`); S.foot[0].gid = id; } S.garden.cur = id; S.garden.step = +st; S.playing = false; if (g0.type === 'video' || g0.type === 'audio') S.garden.last = { id, step: +st }; S.modal = 'gd'; },
  gPlay() { S.playing = !S.playing; },
  gJoin() { const g = DATA_ZH.garden.find(x => x.id === S.garden.cur); S.joined = [...(S.joined || []), g.id]; addFoot('cal', [`报名了「${g.title}」`, `Registered for “${deepMerge(DATA_ZH, DATA_EN).garden.find(x => x.id === g.id).title}”`], `gOpen:${g.id}:0`); toast(L('报名成功，活动前一天会提醒你', 'Registered — we’ll remind you the day before')); },
  gStep(d) { S.garden.step += +d; S.garden.last = { id: S.garden.cur, step: S.garden.step }; },
  gDone() { S.garden.last = null; S.modal = null; toast(L('完成了，给自己一点肯定', 'Done — well done you')); },
  /* 反馈 */
  rate(a) { const [i, n] = a.split(':'); S.fb[i] = +n; },
  zFb() { S.fb = { 0: 4, 1: 4, 2: 4, 3: 5 }; },
  fbSubmit() { if (Object.keys(S.fb).length < DATA.fbQs.length) return toast(L('还有题目没有选', 'Please answer every question')); aiTask().fbDone = true; S.modal = 'fbok'; },
};
const sendLbl = () => S.cd > 0 ? L(`已发送 ${S.cd}s`, `Sent · ${S.cd}s`) : S.codeSent ? L('重新获取', 'Resend') : L('获取验证码', 'Get code');

/* ---------- 小屿对话 ---------- */
/* 承接语：按轻重取一句，同一次访谈不重复（记的是序号，切换语言也不会重复） */
function ackPick(t, lvl) { const pool = DATA.acks[lvl] || DATA.acks[1], used = t.ackUsed || (t.ackUsed = []);
  let i = t.qi % pool.length; for (let k = 0; k < pool.length; k++) { const j = (t.qi + k) % pool.length; if (!used.includes(`${lvl}:${j}`)) { i = j; break; } } used.push(`${lvl}:${i}`); return pool[i]; }
function userSay(text, voice) {
  const t = S.task; if (t.phase !== 'chat' || t.paused || (S.typing && !S.fast)) return;
  t.msgs.push({ who: 'me', text, voice }); t.rounds++;
  if (RULE.crisisRe.test(text)) { t.crisis = true; t.paused = true; crisisFollow(); botSay(DATA.crisisReply, true); return; }
  const q = DATA.script[t.qi], ti = q ? q.tags.indexOf(text) : -1, lvl = ti >= 0 ? ti : RULE.concernRe.test(text) ? 2 : 1;
  if (lvl === 2) t.concern++;
  t.qi++;
  if (t.qi < DATA.script.length) botSay(ackPick(t, lvl) + ' ' + DATA.script[t.qi].q); else botSay(DATA.closing, false, finish);
}
function botSay(text, help, then) {
  const t = S.task, push = () => { t.msgs.push({ who: 'bot', text }); if (help) t.msgs.push({ help: true }); S.typing = false; S.scrollEnd = true; if (then) then(); };
  if (S.fast) return push();
  S.typing = true; S.scrollEnd = true; render();
  setTimeout(() => { push(); render(); }, 800);
}
function openTask(t) {
  if (t.phase === 'none') S.page = 'intro';
  else if (t.phase === 'scale') { S.page = 'survey'; S.pageTop = true; }
  else if (t.phase === 'expired') return;
  else if (t.phase === 'bridge') startChat(t);
  else { if (t.paused && !t.crisis) t.paused = false; S.page = 'session'; S.scrollEnd = true; }
}
/* 问卷交完先进过渡页，说明接下来是 AI 对话，约 2.6 秒后自动进入 */
function toChat(t) { t.phase = 'bridge'; S.page = 'bridge'; clearTimeout(S.bridgeT); S.bridgeT = setTimeout(() => { if (S.page === 'bridge') { ACT.bridgeGo(); render(); } }, S.fast ? 0 : 2600); }
function startChat(t) { t.phase = 'chat'; S.page = 'session'; t.msgs = [{ who: 'bot', text: DATA.greet }]; botSay(DATA.script[0].q); }
/* 登录后进入个人中心：有未完成的任务就先提醒 */
const pendingTasks = () => sortedTasks().filter(t => !isDone(t) && t.phase !== 'expired' && !t.declined);
function enterHome() { S.page = 'home'; if (S.bk && S.bk.st === '已改约') { S.bk.moveSeen = true; S.modal = 'moved'; } else if (pendingTasks().length) S.modal = 'remind'; }
function finishSurvey(t) { readTaskMsgs(t.id); addFoot('list', [`提交了「${DATA_ZH.tasks.find(d => d.id === t.id).name}」`, `Submitted “${deepMerge(DATA_ZH, DATA_EN).tasks.find(d => d.id === t.id).name}”`], 'go:myq'); t.phase = 'done'; t.doneAt = new Date(NOW); t.lv = t.scaleLv; S.page = 'home'; S.modal = 'doneS'; }
const readTaskMsgs = id => S.inbox.forEach(x => { if (x.link === 'task:' + id) x.read = true; });
function finish() { S.task.redo = false; readTaskMsgs(S.task.id); addFoot('chat', [`完成「${DATA_ZH.tasks.find(d => d.id === S.task.id).name}」的问卷和访谈`, `Finished the questionnaires and chat for “${deepMerge(DATA_ZH, DATA_EN).tasks.find(d => d.id === S.task.id).name}”`], 'go:talks'); const t = S.task; t.phase = 'done'; t.paused = false; t.doneAt = new Date(NOW); t.lv = RULE.finalLevel(t); if (RULE.invite(t.lv) && !S.invited && !S.bk) { S.modal = 'invite'; S.after = () => { S.modal = 'done'; }; } else S.modal = 'done'; }   // v1.18：需要邀请的学生先出邀请卡，再出结束卡
function afterDone(next) { if (RULE.invite(S.task.lv) && !S.invited && !S.bk) { S.after = next; S.modal = 'invite'; } else { S.modal = null; next(); } }
function toast(t) { S.toast = t; clearTimeout(S.toastT); S.toastT = setTimeout(() => { S.toast = ''; render(); }, 2400); }

/* ---------- 事件 ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) { let r = false; if (S.menu) { S.menu = false; r = true; } if (S.inboxOpen && !e.target.closest('.bell-w')) { S.inboxOpen = false; r = true; } if (S.schoolOpen && !e.target.closest('.dd')) { S.schoolOpen = false; r = true; } if (r) render(); return; }
  if (el.hasAttribute('disabled')) return;
  const f = ACT[el.dataset.act]; if (!f) return;
  if (el.dataset.act === 'ovClose' && !e.target.classList.contains('ov')) return;
  if (el.dataset.act !== 'menu') S.menu = false;
  if (!['inbox', 'readAll'].includes(el.dataset.act)) S.inboxOpen = false;
  e.stopPropagation(); f(el.dataset.arg, e); render();
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'schoolQ') { S.schoolQ = el.value; render(); const q = $('#schoolQ'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); return; }
  const b = el.dataset.bind; if (!b) return;
  if (b === 'fbText') return;
  if (b.startsWith('ec.')) { S.ec[b.slice(3)] = el.value; return; }
  const [a, k] = b.split('.'); if (k) S[a][k] = el.value; else S[a] = el.value;
});
document.addEventListener('change', e => { if (e.target.dataset.rerender != null) render(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'chatIn' && !e.isComposing && e.keyCode !== 229) { ACT.send(); render(); }
  if (e.key === 'Enter' && e.target.matches('[role=checkbox]')) { ACT.agree(); render(); }
  if (e.key === 'Escape' && S.modal) { ACT.close(); render(); }
});
document.addEventListener('scroll', e => {
  if (e.target.id === 'consentBox' && !S.consent.read) { const b = e.target; if (b.scrollTop + b.clientHeight >= b.scrollHeight - 6) { S.consent.read = true; render(); } }
}, true);
setInterval(() => { if (S.cd > 0) { S.cd--; const b = $('#sendBtn'); if (b) { b.textContent = sendLbl(); b.disabled = S.cd > 0; } } }, 1000);

const slotDate = b => { const d = new Date(DAYS[b.di]); const [h, m] = DATA.times[b.ti].split(':'); d.setHours(+h, +m); return d; };
