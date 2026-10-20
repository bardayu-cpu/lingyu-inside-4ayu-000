/* ---------- 页面与渲染 ---------- */
/* 中英文之间自动加空格（只改显示文字，不碰输入框和属性） */
function fixSp(root) { if (!root) return; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const p = n.parentNode && n.parentNode.tagName; if (p === 'TEXTAREA' || p === 'SCRIPT' || p === 'STYLE') continue; const t = n.nodeValue; if (/[一-鿿][A-Za-z]|[A-Za-z][A-Za-z0-9]*[一-鿿]/.test(t)) n.nodeValue = t.replace(/([一-鿿])([A-Za-z])/g, '$1 $2').replace(/([A-Za-z][A-Za-z0-9]*)([一-鿿])/g, '$1 $2'); } }
const PAGES = { home, crisis, students, booking, survey, data, settings };
function render() {
  tick();
  if (!S.uid) { $('#app').innerHTML = loginPage(); $('#drawer').innerHTML = ''; $('#modal').innerHTML = ''; $('#toast').innerHTML = S.toast ? `<div class="toast">${I('check', 's')}${esc(S.toast)}</div>` : ''; S._p = null; renderShell(); return; }
  if (!MENUS[S.role].some(m => m[0] === S.page)) S.page = MENUS[S.role][0][0];
  const pg = $('#pg'), top = pg ? pg.scrollTop : 0, same = S._p === S.page, db = $('.dw .db'), dtop = db ? db.scrollTop : 0;
  const dwKey = S.dw ? S.dw.sid : null, dwSame = dwKey && S._dw === dwKey, dtabSame = dwSame && S._dt === S.dw.tab;
  $('#app').innerHTML = shell(PAGES[S.page]());
  if (!same) $('#pg').classList.add('fade');
  $('#drawer').innerHTML = S.dw ? drawer() : ''; $('#drawer').classList.toggle('na', !!dwSame);
  $('#modal').innerHTML = S.mo ? modal() : ''; $('#modal').classList.toggle('na', S._mo === S.mo);
  $('#toast').innerHTML = S.toast ? `<div class="toast">${I('check', 's')}${esc(S.toast)}</div>` : '';
  if (same && $('#pg')) $('#pg').scrollTop = top;
  if (dtabSame && $('.dw .db')) $('.dw .db').scrollTop = dtop;
  S._p = S.page; S._dw = dwKey; S._dt = S.dw && S.dw.tab; S._mo = S.mo;
  if (S.dw && S.dw.hl != null && S.dw.tab === 'talk' && S._hl !== S.dw.hl) { const e = document.getElementById('q' + S.dw.hl); if (e) e.scrollIntoView({ block: 'center' }); }
  S._hl = S.dw && S.dw.hl;
  const al = $('#alist'); if (al) al.scrollTop = al.scrollHeight;
  ['#app', '#drawer', '#modal', '#toast'].forEach(x => fixSp($(x)));
  renderShell();
}
function go(p) { if (p === 'survey') S.plan = null; S.page = p; S.dw = null; S.mo = null; S.noti = false; }
function open(id) { const s = SU(id); if (!s || S.role === 'ADM') return; if (isL1() && s.follower !== me()) return toast('只能查看你跟进的学生'); S.dw = { sid: id, tab: null }; log('查看学生档案', s, { cat: '查看', noTl: 1 }); }
function close2() { S.mo = null; S.dw = null; }
function err(t) { toast(t); return true; }
function followUp(s, lv, extra = {}) { const c = CYCLE[lv]; move(s, 'follow', null, Object.assign({ conf: lv, lv, cycle: c, fdue: later(c * 24), miss: 0 }, extra)); }
function newCrisis(s, src, type, urgent) {
  if (CRISES.some(k => k.sid === s.id && k.st !== 'closed')) return null;
  s.prev = { stage: s.stage, queue: s.queue }; s.stage = 'crisis'; s.queue = null;
  const k = { id: 'k' + (CRISES.length + 1), sid: s.id, st: 'new', at: new Date(NOW), src: [{ t: src, at: new Date(NOW) }], type, urgent: !!urgent, recv: null, acts: [], calls: [], esc: 0 };
  CRISES.push(k); crisisNotify(k, new Date(NOW)); return k;
}
const W = { 王磊: 'c4', 朱静: 'c5', Maria: 'c2', 李文: 'c1', Daniel: 'c3', 周老师: 'u1', 郑老师: 'u2' };

/* ---------- 动作 ---------- */
const ACT = {
  // 登录
  lgPick(u) { S.login.uid = u; }, lgSSO() { S.login.step = 1; }, lgBack() { S.login = { step: 0 }; },
  lgCode() { if (STAFF[S.login.uid] && STAFF[S.login.uid].on === false) { S.login = { step: 9, err: '这个账号已停用，请联系系统管理员' }; return; } enter(S.login.uid, ACCTS[S.login.uid][0], 'NTU SSO + 短信验证'); },
  lgRole(r) { enter(S.login.uid, r, 'NTU SSO + 短信验证'); },
  logout() { CRISES.forEach(k => { if (k.shown) delete k.shown[me()]; }); log('退出登录', null, { cat: '登录' }); S.uid = null; S.role = null; S.dw = null; S.mo = null; S.rec = null; S.rv = null; S.tkx = null; S.tksel = null; S.l1sel = {}; S.login = { step: 0 }; toast('已退出'); },
  switchTo(r) { if (r === S.role) { S.mo = null; return; } log(`切换身份：${RN[S.role]} → ${RN[r]}`, null, { cat: '登录' }); S.role = r; S.page = MENUS[r][0][0]; S.mo = null; S.dw = null; S.tabs = {}; toast(`已切换为${RN[r]}`); },
  notiT() { S.noti = !S.noti; if (S.noti) myNoti().forEach(n => n.read = true); }, notiTab(k) { S.tabs.noti = k; },
  // 导航
  go(p) { go(p); if (p === 'students') { S.f = {}; S.tabs.students = 'all'; S.pg = 1; } }, qtab(k) { S.tabs.home = k; }, qtab3(k) { S.tabs.home3 = k; }, ctab(k) { S.tabs.crisis = k; S.crisis = null; }, stab(k) { S.tabs.students = k; S.pg = 1; }, btab(k) { S.tabs.booking = k; }, bsub(k) { S.tabs.bsub = k; }, svtab(k) { S.tabs.survey = k; }, dtabD(k) { S.tabs.data = k; }, settab(k) { S.tabs.settings = k; }, pg(n) { S.pg = +n; }, apg(n) { S.apg = +n; }, ppg(n) { S.ppg = +n; },
  drill(a, e, el) { if (S.role === 'ADM') return toast('系统管理员只看汇总，不能进入名单');
    const i = a.indexOf(':'), p = a.slice(0, i), f = a.slice(i + 1); go(p);
    if (p === 'students') { S.f = { layer: f, label: el && el.dataset.label }; S.tabs.students = 'all'; S.pg = 1; }
    if (p === 'booking') { S.tabs.booking = 'list'; S.tabs.bsub = f || 'all'; }
    if (p === 'survey') { S.plan = 't1'; S.tabs.survey = 'prog'; } },
  clearF() { S.f = {}; S.pg = 1; },
  open(id) { open(id); }, dwClose() { S.dw = null; }, dtab(k) { S.dw.tab = k; S.dw.hl = null; }, quote(i) { S.dw.tab = 'talk'; S.dw.hl = +i; },
  crisisOpen(id) { go('crisis'); S.crisis = id; S.tabs.crisis = CRISES.find(k => k.id === id).st === 'closed' ? 'closed' : 'open'; },
  crisisFor(id) { const k = CRISES.filter(x => x.sid === id).pop(); S.dw = null; ACT.crisisOpen(k.id); },
  mo(a) { S.mo = a; S.form = {}; const [k, id] = a.split(':'); const s = SU(id);
    if (k === 'conf' && s) { S.form.lv = String(curLv(s)); S.form.next = activeBook(s) ? '已有预约，无需邀请' : curLv(s) >= 4 ? '邀请预约' : '常规随访'; }
    if (k === 'report' && (id === 'urgent' || !isL1())) S.form.urgentOnly = 1; },   // v1.13：咨询师、负责人只用「报告紧急情况」
  moClose() { S.mo = null; }, ovClose() { S.mo = null; },
  fset(a) { const i = a.indexOf('|'); S.form[a.slice(0, i)] = a.slice(i + 1); },
  fchk(x) { const all = ['学生信息（姓名、学号、学院、年级）', '量表作答与得分', '等级、信号格、完成时间', '小屿对话全文']; const f = S.form.fields || all.slice(0, 3); S.form.fields = f.includes(x) ? f.filter(y => y !== x) : [...f, x]; },
  // L1
  keep(id, e, el, extra) { const s = SU(id); if (actScope(s) !== 'l1' && S.role !== 'L3') return toast('不在你的核验队列里');
    log(`L1 ${ST(me()).name} 完成学院核实${typeof extra === 'string' ? extra : ''}`, s, { k: 'l1keep' }); let msg;
    if (s.lv >= 3) { const e = RULES.t3end; if (e === 'L1 结束') { followUp(s, 3); msg = '已完成学院核实，按规则进入 14 天随访'; } else { move(s, 'L2', e === '批量确认' ? 'batch' : 'review3', { assignee: l2For(s), src: 'L1 维持' }); msg = `已完成学院核实，交给咨询师${e}`; } }
    else { S.samp[s.lv] += RULES['samp' + s.lv]; if (S.samp[s.lv] >= 100) { S.samp[s.lv] -= 100; move(s, 'L2', 'sample', { assignee: l2For(s), src: `系统抽查（${RULES['samp' + s.lv]}%）`, conf: s.lv }); log(`被系统抽中，进入 L2 抽查（${RULES['samp' + s.lv]}%）`, s, { sys: 1, k: 'samp' }); msg = `已完成学院核实；本次被系统抽中（${RULES['samp' + s.lv]}%）给咨询师复查`; }
      else if (s.lv === 1) { move(s, 'done', null, { conf: 1 }); msg = '已完成学院核实'; } else { followUp(s, s.lv); msg = '已完成学院核实，进入 30 天随访'; } }
    S.dw = null; toast(msg); },
  obs(a) { const [x, v] = a.split('|'); S.form.obs = Object.assign({}, S.form.obs, { [x]: v }); },
  verifyKeep(id) { const s = SU(id), o = S.form.obs || {}, y = Object.keys(o).filter(x => o[x] === '有'); s.l1obs = { by: me(), items: y, note: S.form.note || '' }; S.mo = null; ACT.keep(id, null, null, `（观察：${y.length ? y.join('、') : '未见异常'}）`); },
  verifyUp(id) { const s = SU(id), o = S.form.obs || {}, y = Object.keys(o).filter(x => o[x] === '有'); s.l1obs = { by: me(), items: y, note: S.form.note || '' };
    log(`L1 ${ST(me()).name} 交给咨询师：${y.length ? y.join('、') : '拿不准'}${S.form.note ? '（' + S.form.note + '）' : ''}`, s, { k: 'l1up' }); move(s, 'L2', 'up', { assignee: l2For(s), src: `${ST(me()).name} 存疑：${y[0] || '拿不准'}` }); close2(); toast('已上推到 L2 待复核，你的观察会一起带过去'); },
  invalid(id) { const s = SU(id); log('L1 核验：标记作答无效，请学生重做', s, { k: 'invalid' }); move(s, 'redo', null); notify('stu', '短信', '请重新完成普测', s.id); toast('已标记无效，系统已短信请学生重做'); },
  up1Ok(id) { const s = SU(id); if (!S.form.why) return toast('请选一个原因'); log(`L1 ${ST(me()).name} 交给咨询师：${S.form.why}${S.form.note ? '（' + S.form.note + '）' : ''}`, s, { k: 'l1up' }); move(s, 'L2', 'up', { assignee: l2For(s), src: `${ST(me()).name} 存疑：${S.form.why}` }); close2(); toast('已上推到 L2 待复核'); },
  fbOk(id) { const s = SU(id), F = S.form, k = isL1() ? 'fb1' : 'fb';
    if (F.res === '未接通') { s.miss = (s.miss || 0) + 1; log(`随访：未接通（第 ${s.miss} 次）`, s, { k }); if (s.miss >= 3) { move(s, 'L2', 'up', { assignee: s.owner || l2For(s), src: '随访连续 3 次未接通' }); toast('连续 3 次未接通，已上推到 L2'); } else { s.fdue = later(24); toast(`未接通，24 小时后再次提醒（第 ${s.miss} 次）`); } S.mo = null; return; }
    log(`随访反馈：${F.res}，风险趋势「${F.trend}」${F.note ? '，' + F.note : ''}`, s, { k });
    if (F.trend === '加重') { move(s, 'L2', 'up', { assignee: s.owner || l2For(s), src: '随访反馈「加重」' }); toast('已提交；「加重」已转入 L2 待复核'); }
    else { s.miss = 0; s.fdue = later((s.cycle || 14) * 24); toast(`已提交，下次随访 ${s.cycle === 1 ? '24 小时' : (s.cycle || 14) + ' 天'}后`); } close2(); },
  // L2 / L3
  confOk(id) { const s = SU(id), F = S.form, lv = +F.lv, cur = curLv(s); if (!lv) return toast('请选择等级'); if (lv !== s.ai && !F.note) return toast('等级与初判不同，请写原因');
    const tag = S.role === 'L3' && ['L1', 'L2'].includes(s.stage) ? 'L3 代办：' : '';
    if (s.queue === 'sample') log(`抽查结果：${lv === s.conf ? '与 L1 一致' : `不一致（L1 ${s.conf} 级 → ${lv} 级）`}`, s, { k: 'sample' }), s.tl[s.tl.length - 1].fail = lv !== s.conf;
    if (lv === 5) { log(`${tag}确认 5 级：${F.note || '复核确认'}`, s, { k: 'conf' }); s.conf = s.lv = 5; newCrisis(s, `${ST(me()).name} 复核确认 5 级：${F.note || ''}`, '人工判断'); close2(); return toast('已确认 5 级，转入危机通道，短信已发给值班咨询师'); }
    if (cur >= 4 && lv < cur && S.role !== 'L3') { log(`申请把等级从 ${cur} 降为 ${lv}：${F.note}`, s, { k: 'down' }); move(s, 'L3', 'down', { downTo: lv, downBy: me(), downWhy: F.note, src: `${ST(me()).name} 申请降为 ${lv} 级` }); notify('c5', '站内', `${ST(me()).name} 申请降级，待你审批`, s.id); close2(); return toast('降级需要 L3 审批，已提交'); }
    log(`${tag}确认等级 ${lv} 级${lv !== s.ai ? `（初判 ${s.ai}，原因：${F.note}）` : ''}；后续：${F.next || '常规随访'}`, s, { k: 'conf' }); s.conf = s.lv = lv;
    if (F.next === '邀请预约') { s.invAt = new Date(NOW); move(s, 'invited', null, { assignee: s.assignee || me() }); notify('stu', '站内 + 短信', '心理老师邀请你聊一聊', s.id); }
    else if (F.next === '直接指派咨询师') move(s, 'L3', 'hard', { src: `${ST(me()).name} 请求指派` });
    else followUp(s, lv);
    close2(); toast(F.next === '邀请预约' ? '已确认；学生端收到「心理老师邀请你聊一聊」' : F.next === '已有预约，无需邀请' ? '已确认；学生已有预约，去「咨询预约」确认即可' : '已确认'); },
  invite(id) { const s = SU(id); if (activeBook(s)) return toast('学生已有预约，不用再邀请'); if (s.invAt && hrs(s.invAt) < 24) return toast('24 小时内已邀请过');
    s.invAt = new Date(NOW); log('发出预约邀请', s, { k: 'inv' }); if (['L2', 'follow'].includes(s.stage) && s.stage !== 'follow') move(s, 'invited', null); notify('stu', '站内 + 短信', '心理老师邀请你聊一聊', s.id); toast('已发出邀请；48 小时未回应会回到你的队列'); },
  up2Ok(id) { const s = SU(id); if (!S.form.why) return toast('请选一个原因'); log(`上推 L3：${S.form.why}${S.form.note ? '，' + S.form.note : ''}`, s, { k: 'up2' }); move(s, 'L3', 'hard', { src: `${ST(me()).name} 上推：${S.form.why}` }); notify('c5', '站内', '有 1 位学生上推到 L3', s.id); close2(); toast('已上推到 L3'); },
  contactOk(id) { const s = SU(id), r = S.form.res || ''; if (!r) return toast('请选择结果');
    if (r === '转危机') { S.mo = 'toCrisis:' + id; S.form = {}; return; }
    log(`联系结果：${r}${S.form.note ? '，' + S.form.note : ''}`, s, { k: 'contact' });
    if (r === '再次邀请') { s.invAt = new Date(NOW); move(s, 'invited', null); notify('stu', '站内 + 短信', '心理老师再次邀请你聊一聊', s.id); toast('已再次邀请'); }
    else if (r === '未接通') { s.tries = (s.tries || 0) + 1; if (s.tries >= 3) { move(s, 'L3', 'hard', { src: '拒绝服务且 3 次联系不上' }); toast('3 次联系不上，已上推 L3'); } else { s.since = new Date(NOW); toast(`未接通（第 ${s.tries} 次），留在队列中，时限重新计算`); } }
    else { followUp(s, curLv(s)); toast(`已记录，${CYCLE[curLv(s)]} 天后随访`); } close2(); },
  selT(id) { S.sel[id] = !S.sel[id]; },
  batchOk() { const ids = Object.keys(S.sel).filter(k => S.sel[k] && SU(k).queue === 'batch' && SU(k).stage === 'L2'); ids.forEach(k => { const s = SU(k); log('批量确认 3 级，进入 14 天随访', s, { k: 'conf' }); followUp(s, 3); delete S.sel[k]; }); toast(`已确认 ${ids.length} 人`); },
  toCrisisOk(id) { const s = SU(id), F = S.form; if (!F.why || !F.note) return toast('请选原因并写说明'); if (s.stage === 'crisis') return toast('该学生已在危机通道中');
    log(`转危机：${F.why}，${F.note}`, s, { cat: '危机', k: 'crisis', r: 1 }); newCrisis(s, `${ST(me()).name} 手动转危机：${F.why}`, '人工判断'); close2(); toast('已转入危机通道，短信已发给值班咨询师'); },
  downOkGo(id) { const s = SU(id), by = s.downBy; log(`同意降级：${s.lv} → ${s.downTo} 级${S.form.note ? '，' + S.form.note : ''}`, s, { k: 'downok' }); notify(by, '站内', `你的降级申请已通过`, s.id); followUp(s, s.downTo, { downTo: null }); close2(); toast(`已同意，已通知${ST(by).name}`); },
  downNoGo(id) { const s = SU(id), by = s.downBy; if (!S.form.note) return toast('请写驳回原因'); log(`驳回降级，维持 ${s.lv} 级：${S.form.note}`, s, { k: 'downno' }); notify(by, '站内', `降级申请被驳回：${S.form.note}`, s.id); move(s, 'L2', 'review4', { assignee: by, conf: s.lv, src: `L3 驳回降级：${S.form.note}`, downTo: null }); close2(); toast(`已驳回，退回${ST(by).name}的待复核`); },
  assignOk(id) { const s = SU(id), w = W[S.form.who]; if (!w) return toast('请选择咨询师'); log(`确认 ${s.lv} 级，指派负责咨询师：${S.form.who}`, s, { k: 'assign' }); s.owner = w; followUp(s, s.lv); notify(w, '站内 + 短信', '你有 1 位新指派的学生', s.id); close2(); toast(`已指派给${S.form.who}，并通知`); },
  nudge(id) { const s = SU(id), h = holder(s); if (nudgedToday(s)) return toast('今天已经催办过'); s.nudged = new Date(NOW); notify(h, '站内 + 短信', '有 1 位学生超时未处理，请尽快处理', s.id); log(`催办 ${ST(h).name}`, s, { k: 'nudge' }); toast(`已催办${ST(h).name}`); },
  reassignOk(id) { const s = SU(id), w = W[S.form.who]; if (!w) return toast('请选择'); const h = holder(s);
    if (s.stage === 'L1' || (s.stage === 'follow' && !s.owner)) s.follower = w; else if (s.stage === 'follow') s.owner = w; else s.assignee = w;
    if (s.stage !== 'follow') { s.since = new Date(NOW); s.limKey = null; } else s.fdue = later(24);
    if (s.ack || s.viewed) { s.ack = null; s.viewed = null; if (s.follower && s.follower !== w) notify(s.follower, '站内', `${nm(s)} 已改派给${S.form.who}，等待对方确认接手`, s.id); }
    log(`改派：${ST(h).name} → ${S.form.who}`, s, { k: 'reassign' }); notify(w, '站内 + 短信', '有 1 位学生改派给你', s.id); if (h) notify(h, '站内', `你名下 1 位超时学生已改派给${S.form.who}，不用再处理`, s.id); S.mo = null; toast(`已改派给${S.form.who}`); },
  moveAllOk(id) { const w = W[S.form.who]; if (!w) return toast('请选择'); const its = STU.filter(x => holder(x) === id && ['L1', 'L2'].includes(x.stage) && overdue(x));
    its.forEach(s => { if (s.stage === 'L1') s.follower = w; else s.assignee = w; s.since = new Date(NOW); s.limKey = null; if (s.ack || s.viewed) { s.ack = s.viewed = null; if (s.follower !== w) notify(s.follower, '站内', `${nm(s)} 已改派给${S.form.who}，等待对方确认接手`, s.id); } log(`改派：${ST(id).name} → ${S.form.who}`, s, { k: 'reassign' }); }); notify(w, '站内 + 短信', `有 ${its.length} 位学生改派给你`, null); notify(id, '站内', `你名下 ${its.length} 位超时学生已改派给${S.form.who}`, null); S.mo = null; toast(`已改派 ${its.length} 人`); },
  // 危机
  recv(id) { const k = CRISES.find(x => x.id === id); k.st = 'handling'; k.recv = { by: me(), at: new Date(NOW) }; NOTI.filter(n => n.ref === id && n.to === me()).forEach(n => n.st = '已确认'); if (!NOTI.some(n => n.ref === id && n.to === me())) notify(me(), '站内', '你已接收这条危机', id, '已确认');
    log('接收危机，开始处置', SU(k.sid), { cat: '危机', k: 'crisis', r: 1 }); toast('已接收，倒计时停止；其他人可以看到由你负责'); },
  showPh(a) { const [id, to] = a.split('|'), k = CRISES.find(x => x.id === id); if (k.st === 'new' || !cMay(k)) return toast('接收后才能查看'); k.shown = k.shown || {}; const m = k.shown[me()] = k.shown[me()] || {}; m[to] = !m[to]; if (m[to]) log(`查看危机联系方式：${to}`, SU(k.sid), { cat: '查看', noTl: 1 }); },
  copyPh(a) { const [id, to] = a.split('|'), k = CRISES.find(x => x.id === id); if (k.st === 'new' || !cMay(k)) return toast('接收后才能复制'); const y = SU(k.sid), p = to === '本人' ? y.phone : to.includes(y.ec[0][0]) ? y.ec[0][2] : y.ec[1][2];
    try { navigator.clipboard && navigator.clipboard.writeText('+65 ' + p).catch(() => {}); } catch (e) {} log(`复制危机联系方式：${to}`, y, { cat: '查看', noTl: 1 }); toast(`已复制 ${to} 的号码，用手机拨打后回来「记录」结果`); },
  stepOk(a) { const [id, key] = a.split('|'), k = CRISES.find(x => x.id === id), F = S.form, st = CSTEPS.find(x => x[0] === key);
    if (!F.res) return toast('请选择结果'); if ((key === 'contact' || key === 'parent') && !F.to) return toast('请选择联系对象');
    k.acts.push({ at: new Date(NOW), step: key, to: F.to, res: F.res, min: F.min ? +F.min : 0, note: F.note || '', by: me() });
    log(`处置 · ${st[1]}：${F.to ? F.to + ' · ' : ''}${F.res}${F.note ? '（' + F.note + '）' : ''}`, SU(k.sid), { cat: '危机', k: 'crisis' }); S.mo = null; toast('已记录'); },
  escOk(a) { const [id, what] = a.split('|'), k = CRISES.find(x => x.id === id), y = SU(k.sid);
    k.acts.push({ at: new Date(NOW), step: 'contact', res: '联系不上', to: `升级：${what}`, note: S.form.note || '', by: me() });
    const who = what.includes('辅导员') ? FOLLOWER_OF[y.college] : 'c5'; notify(who, '电话', `危机协助请求：${what}`, id);
    log(`处置 · 联系不上，启动升级：${what}${S.form.note ? '（' + S.form.note + '）' : ''}`, y, { cat: '危机', k: 'crisis', r: 1 }); S.mo = null; toast(`已启动升级：${what}`); },
  assistOk(id) { const k = CRISES.find(x => x.id === id), w = W[S.form.who]; if (!w) return toast('请选择'); k.assist = w; notify(w, '站内 + 短信', `负责人请你协助一条危机${S.form.note ? '：' + S.form.note : ''}`, id); log(`请 ${S.form.who} 协助${S.form.note ? '：' + S.form.note : ''}`, SU(k.sid), { cat: '危机', k: 'crisis' }); S.mo = null; toast(`已请${S.form.who}协助`); },
  closeOk(id) { const k = CRISES.find(x => x.id === id), F = S.form; if (!canCloseK(k)) return toast('还不能结案'); if (!F.state || !F.plan || !F.parent || !F.note || !F.lv || !F.who) return toast('各项都必填');
    const w = W[F.who], lv = +F.lv[0], s = SU(k.sid);
    k.st = 'closed'; k.closed = { at: new Date(NOW), note: F.note, lv, owner: w, state: F.state, plan: F.plan, parent: F.parent };
    log(`危机结案：${F.state}；安全计划${F.plan}；家长${F.parent}；${F.note}；结案等级 ${lv}；负责 ${F.who}`, s, { cat: '危机', k: 'crisis', r: 1 });
    s.owner = w; move(s, 'follow', null, { conf: lv, lv, cycle: 1, fdue: later(24), miss: 0 }); notify(w, '站内 + 短信', '危机结案后由你负责，24 小时内首次随访', s.id);
    S.mo = null; S.tabs.crisis = 'closed'; S.crisis = id; toast('已结案；24 小时随访已进入负责咨询师的队列'); },
  // 预约
  bAudit(id) { const b = BOOK.find(x => x.id === id); b.st = 'confirm'; b.at = new Date(NOW); log(`${S.role === 'L3' ? 'L3 代审核' : '审核'}预约并同步给${ST(b.cid).name}`, SU(b.sid), { cat: '预约', k: 'book' }); notify(b.cid, '站内', '有 1 个新预约待确认', b.id); toast(`已同步给${ST(b.cid).name}`); },
  auditorOk(id) { const b = BOOK.find(x => x.id === id), w = W[S.form.who]; if (!w) return toast('请选择'); const was = auditor(b); b.auditor = w; notify(w, '站内', '有 1 个预约改派给你审核', b.id); log(`改派预约审核人：${ST(was).name} → ${S.form.who}`, SU(b.sid), { cat: '预约', k: 'book' }); S.mo = null; toast(`已改派给${S.form.who}`); },
  bOk(id) { const b = BOOK.find(x => x.id === id); if (!b || !mayBook(b) || b.st !== 'confirm') return toast('无权处理或申请状态已变化'); if (!canTakeSlot(b.cid, b.day, b.t, b.id, b.sid)) return toast('时段已被占用或关闭，请重新安排'); b.st = 'ok'; bookChanged(b, 'confirm'); const s = SU(b.sid); if (s.stage === 'invited') followUp(s, curLv(s), { owner: s.owner }); log('确认预约', s, { cat: '预约', k: 'book' }); notify('stu', '站内 + 短信', `预约已确认：${slotTxt(b)}`, b.id); toast('已确认；学生端收到时间和地点'); },
  bMoveOk(id) { const b = BOOK.find(x => x.id === id); if (!S.form.slot) return toast('请选择新时段'); const [d, t] = S.form.slot.split('-').map(Number); if (!mayBook(b) || !canTakeSlot(b.cid, d, t, b.id, b.sid)) return toast('时段已被占用或关闭，请重新选择');
    setSlot(b.cid, b.day, b.t, 'open'); b.day = d; b.t = t; setSlot(b.cid, d, t, 'bk'); b.st = 'ok'; log(`老师改约到 ${slotTxt(b)}（不计学生次数）`, SU(b.sid), { cat: '预约', k: 'book' }); notify('stu', '站内 + 短信', `老师调整了你的预约时间：${slotTxt(b)}`, b.id); S.mo = null; toast('已改约；排班同步更新'); },
  bNoOk(id) { const b = BOOK.find(x => x.id === id); if (!S.form.why) return toast('请选原因'); b.st = 'no'; setSlot(b.cid, b.day, b.t, 'open'); log(`婉拒预约：${S.form.why}`, SU(b.sid), { cat: '预约', k: 'book' }); notify('stu', '站内', `老师婉拒了预约：${S.form.why}`, b.id); S.mo = null; toast('已婉拒；时段已释放，学生可重新预约，不计次数'); },
  bAgree(id) { const b = BOOK.find(x => x.id === id), s = SU(b.sid);
    if (b.req.type === '取消') { b.st = 'cancelled'; setSlot(b.cid, b.day, b.t, 'open'); s.q.cancel = Math.max(1, s.q.cancel); }
    else { const cid = b.req.cid || b.cid; if (!canTakeSlot(cid, b.req.day, b.req.t, b.id, b.sid)) return toast('新时段已被占用或关闭，原预约保持不变'); setSlot(b.cid, b.day, b.t, 'open'); b.cid = cid; b.day = b.req.day; b.t = b.req.t; setSlot(b.cid, b.day, b.t, 'bk'); b.st = 'ok'; }
    log(`同意学生${b.req.type}${b.req.type === '改期' ? '到 ' + slotTxt(b) : ''}`, s, { cat: '预约', k: 'book' }); notify('stu', '站内', `你的${b.req.type}申请已同意`, b.id); toast('已同意；排班同步更新，学生端弹窗告知'); },
  bDenyOk(id) { const b = BOOK.find(x => x.id === id); if (!S.form.note) return toast('请写原因'); b.st = 'ok'; log(`不同意学生${b.req.type}：${S.form.note}`, SU(b.sid), { cat: '预约', k: 'book' }); notify('stu', '站内', `你的${b.req.type}申请未通过：${S.form.note}`, b.id); S.mo = null; toast('已发送说明，原预约保持不变'); },
  bTalk(id) { const b = BOOK.find(x => x.id === id); log('回复学生：老师想先和你聊聊', SU(b.sid), { cat: '预约', k: 'book' }); notify('stu', '站内', '老师想先和你聊聊这次改期', b.id); toast('已通知学生，并记录'); },
  recOk(id) { const b = BOOK.find(x => x.id === id), F = S.form, s = SU(b.sid); if (!F.note) return toast('随访结果必填'); if (!F.next) return toast('请选择接下来');
    b.rec = { note: F.note, lv: F.lv ? +F.lv : null, next: F.next, by: me() }; b.st = 'done'; log(`写咨询记录（内容仅负责咨询师与 L3 可见）；接下来：${F.next}`, s, { cat: '预约', k: 'rec' });
    const lv = F.lv ? +F.lv : curLv(s);
    if (F.next === '转介危机干预或合作医院') { newCrisis(s, `${ST(me()).name} 咨询后转介：${F.note}`, '人工判断'); S.mo = null; return toast('已保存记录，并转入危机通道'); }
    if (F.next === '上报高级咨询师') move(s, 'L3', 'hard', { src: `${ST(me()).name} 咨询后上报` });
    else if (F.next === '结束并归档') move(s, 'done', null, { archived: true, owner: null });
    else if (curLv(s) >= 4 && lv < curLv(s)) move(s, 'L3', 'down', { downTo: lv, downBy: me(), downWhy: `咨询后建议：${F.note}`, src: `${ST(me()).name} 咨询后建议降为 ${lv} 级`, owner: me() });
    else followUp(s, lv, { owner: me() });
    S.mo = null; toast(F.next === '结束并归档' ? '记录已保存，学生已归档' : '记录已保存'); },
  assignBOk(id) { const b = BOOK.find(x => x.id === id), w = W[S.form.who]; if (!w) return toast('请选择咨询师'); if (!S.form.slot) return toast('请选择时段'); const [d, t] = S.form.slot.split('-').map(Number); if (!canTakeSlot(w, d, t, b.id, b.sid)) return toast('时段已被占用或关闭，请重新选择');
    setSlot(b.cid, b.day, b.t, 'open'); b.cid = w; b.day = d; b.t = t; setSlot(w, d, t, 'bk'); b.st = 'confirm'; b.at = new Date(NOW); b.src = '待办池指派';
    log(`待办池指派给 ${S.form.who}，${slotTxt(b)}`, SU(b.sid), { cat: '预约', k: 'book' }); notify(w, '站内 + 短信', '待办池指派给你 1 个预约', b.id); S.mo = null; toast('已指派；排班同步更新'); },
  slot(a) { const [c, d, t] = a.split(':'); if (!S.draft[c]) S.draft[c] = SCHED[c].map(r => r.slice()); S.draft[c][d][t] = S.draft[c][d][t] === 'open' ? 'off' : 'open'; },
  discard() { delete S.draft[S.role === 'L2' ? me() : S.schedC]; },
  pre(c) { if (S.role === 'L2' && c !== me()) return; STAFF[c].pre = !STAFF[c].pre; log(`${ST(c).name} 接待预咨询：${STAFF[c].pre ? '关 → 开' : '开 → 关'}`, null, { cat: '配置', obj: '排班' }); },
  copyWeek() { const c = S.role === 'L2' ? me() : S.schedC; log(`复制 ${ST(c).name} 本周排班到下周（草稿）`, null, { cat: '预约', obj: '排班' }); toast('已复制到 10/19–10/23，作为草稿待发布'); },
  publish() { const c = S.role === 'L2' ? me() : S.schedC, d = S.draft[c]; const n = d ? d.flat().filter((v, i) => v !== SCHED[c].flat()[i]).length : 0; if (d) SCHED[c].forEach((row, i) => row.splice(0, 4, ...d[i])); delete S.draft[c];
    log(`提交排班：${ST(c).name} ${dayLbl(0)}–${dayLbl(4)}，改动 ${n} 处`, null, { cat: '预约', obj: '排班' }); toast('已提交，学生端可以看到新时段'); },
  // 普测
  waveOk(id) { const w = TASKS[0].waves.find(x => x.n == id), c = capacity(w); if (!c.ok && !S.form.note) return toast('产能不足时必须写明理由');
    w.st = 'pub'; w.pub = `${NOW.getMonth() + 1}/${NOW.getDate()}`; log(`发布 ${w.name}${c.ok ? '（产能检查通过）' : `（产能检查未通过，仍然发布：${S.form.note}）`}`, null, { cat: '配置', obj: '普测' }); S.mo = null; toast('已发布，学生收到短信链接'); },
  remindF() { const f = S.f, pl = PENDING.filter(p => (!f.pcol || p.college === f.pcol) && (!f.pst || p.st === f.pst)); pl.forEach(p => p.rem++); log(`短信提醒未完成学生 ${pl.length} 人（${f.pcol || '全部学院'} · ${f.pst || '全部状态'}）`, null, { cat: '流转', obj: '普测' }); toast(`已短信提醒 ${pl.length} 人`); },
  extend(i) { const p = PENDING[+i]; if (p.ext) return; p.ext = true; p.due = '10/22'; log(`为 ${p.name} 延长截止到 10/22`, null, { obj: '普测' }); toast('已延长到 10/22'); },
  newNext() { const st = S.form.step || 0; if (st < 4) S.form.step = st + 1; else { S.mo = null; log('新建普测草稿：新生适应追踪（第 2 次）', null, { cat: '配置', obj: '普测' }); toast('已保存为草稿，发布前会做产能检查'); } },
  importOk() { const map = S.mo.endsWith('map'); log(map ? '导入跟进对应表：412 行，409 匹配，3 待分配' : '导入名单：244 行，241 匹配，3 待分配', null, { cat: '配置', obj: map ? '跟进对应关系' : '名单' }); S.mo = null; toast('已导入；3 行进入待分配，24 小时内可回滚'); },
  memberOk() { if (!S.form.role) return toast('请选择身份'); log(`新增成员邀请：${S.form.role}${S.form.note ? ' · ' + S.form.note : ''}`, null, { cat: '配置', obj: '成员与账号' }); S.mo = null; toast('已发送账号邀请'); },
  rep(t) { log(`下载${t}`, null, { cat: '导出', obj: '报表（脱敏）' }); toast(`${t}已生成`); },
  exportOk() { const F = S.form, fs = F.fields || ['学生信息（姓名、学号、学院、年级）', '量表作答与得分', '等级、信号格、完成时间']; if (!fs.length) return toast('请至少选一个字段'); if (!F.note) return toast('请写用途');
    const need2 = fs.includes('小屿对话全文') || SURV().length > 100;
    log(`${need2 ? '提交导出审批' : '导出原始数据'}：${SURV().length} 人；字段：${fs.join('、')}；用途：${F.note}`, null, { cat: '导出', obj: '原始数据' });
    if (need2) APPROVALS.push({ id: 'ap' + (APPROVALS.length + 1), by: me(), n: SURV().length, fields: fs, why: F.note, st: '待批', at: new Date(NOW) });
    if (need2) notify('a1', '站内', `朱静 提交了导出审批（${SURV().length} 人）`, null); S.mo = null; toast(need2 ? '已提交给系统管理员陈行政审批，通过后才能下载' : '已导出 CSV'); },
  auditExp() { log('导出审计日志', null, { cat: '导出', obj: '审计日志' }); toast('审计日志已导出'); },
  // 设置
  l1v(i) { S.mo = 'l1v:' + i; S.form = {}; },
  l1vOk(i) { i = +i; if (PLOCK.has(`${i}:1`)) return; const on = PERMS[i][1]; if (!on && !S.form.ack) return toast('请先确认已同步更新知情同意书');
    PERMS[i][1] = on ? 0 : 1; if (!on) CONSENT.ver = 'v2.' + (+CONSENT.ver.split('.')[1] + 1);
    log(`L1 可见范围 · 辅导员「${PERMS[i][0]}」：${on ? '开 → 关' : '关 → 开'}${on ? '' : `；知情同意书更新为 ${CONSENT.ver}`}`, null, { cat: '配置', obj: '角色与权限' }); S.mo = null; toast('已生效，并记入审计日志'); },
  perm(a) { const [i, j] = a.split(':').map(Number); if (PLOCK.has(`${i}:${j}`)) return; const was = PERMS[i][j]; PERMS[i][j] = was ? 0 : 1;
    log(`权限矩阵 · ${['', 'L1 核验', 'L2 复核', 'L3 决策', '系统管理员'][j]}「${PERMS[i][0]}」：${was ? '开 → 关' : '关 → 开'}`, null, { cat: '配置', obj: '角色与权限' }); },
  // 演示按钮
  zCrisis() { const s = STU.find(x => x.stage === 'L1' && x.lv === 3); s.ai = s.lv = 5; s.item9 = 2; s.tl.push({ at: new Date(NOW), t: '学生在学生端点「请 UCC 今天联系我」', who: '学生', r: 1, k: 'crisis' }); newCrisis(s, '学生在学生端点「请 UCC 今天联系我」', '主动求助'); toast('新危机：已短信通知值班咨询师'); },
  zTime() { NOW.setTime(NOW.getTime() + 4 * H); tick(); toast('时间快进 4 小时：时限、升级、待办池、随访都已按新时间计算'); },
  zWave() { const take = PENDING.filter(p => p.st === '作答中').slice(0, 6); if (!take.length) return toast('没有作答中的学生了');
    const lvs = [2, 2, 3, 2, 4, 1]; let n1 = 0, n4 = 0, n0 = 0;
    take.forEach((p, i) => { PENDING.splice(PENDING.indexOf(p), 1); const lv = lvs[i % 6];
      const s = mk({ name: p.name, sid: p.sid, college: p.college, lv, stage: lv === 4 ? 'L2' : lv === 1 ? 'done' : 'L1', queue: lv === 4 ? 'review4' : lv === 1 ? null : 'verify', assignee: lv === 4 ? l2For({ college: p.college }) : null, since: new Date(NOW), done: new Date(NOW), conf: lv === 1 ? 1 : null });
      if (lv === 4) { s.src = '系统分配（4 级跳过 L1）'; n4++; } else if (lv === 1) { S.samp[1] += RULES.samp1; if (S.samp[1] >= 100) { S.samp[1] -= 100; move(s, 'L2', 'sample', { assignee: l2For(s), src: `系统抽查（${RULES.samp1}%）` }); } else s.tl.push({ at: new Date(NOW), t: '1 级自动确认', who: '系统', k: 'auto' }); n0++; } else n1++; });
    toast(`又有 ${take.length} 位学生完成：${n1} 位进入 L1 待核验，${n4} 位 4 级直接进入 L2，${n0} 位 1 级自动确认`); },
  zBook() { const a = STU.find(s => s.stage === 'follow' && s.lv === 2 && s.follower === 'u1' && !activeBook(s)), b = STU.find(s => s.stage === 'L2' && s.queue === 'review4' && s.assignee === 'c2' && !activeBook(s));
    const put = (s, cid, extra) => { const k = openSlots(cid, 24)[0]; if (!k) return 0; const [d, t] = k.split('-').map(Number); BOOK.push(Object.assign({ id: 'b' + (BOOK.length + 1), sid: s.id, cid, day: d, t, st: 'ok', fresh: true, at: new Date(NOW), mode: '线下', kind: '预咨询', src: '自主预约' }, extra)); setSlot(cid, d, t, 'bk'); notify(cid, '站内', '有 1 个新预约', null); return 1; };
    const n = (a ? put(a, 'c1', {}) : 0) + (b ? put(b, 'c2', { lv4: true }) : 0); toast(n ? `学生提交了 ${n} 个预约，直接预约成功，出现在咨询师的「新预约」里（都满足提前 24 小时）` : '本周已没有满足「提前 24 小时」的开放时段'); },
};
document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (!el || el.hasAttribute('disabled')) return; const a = el.dataset.act, f = ACT[a]; if (!f) return; if ((a === 'ovClose' && !e.target.classList.contains('ov')) || (a === 'dwClose' && el.classList.contains('dw-ov') && e.target !== el)) return; e.stopPropagation(); f(el.dataset.arg, e, el); render(); });
document.addEventListener('input', e => { const b = e.target.dataset.bind; if (!b) return; const v = e.target.value;
  if (b === 'q') { S.f.q = v; S.pg = 1; if (S.page !== 'students') { S.page = 'students'; S.dw = null; } render(); const i = document.querySelector('[data-bind=q]'); i.focus(); i.setSelectionRange(v.length, v.length); return; }
  if (b.startsWith('form.')) { S.form[b.slice(5)] = v; return; }
  if (b === 'aiq') { S.aiq = v; return; }
  if (b === 'plan.notes') { S.planNotes = v; return; }
  if (b.startsWith('wiz.')) { const ks = b.slice(4).split('.'); let o = S.wiz; while (ks.length > 1) o = o[ks.shift()]; o[ks[0]] = isNaN(+v) || v === '' || ks[0] === 'name' ? v : +v; if (e.target.dataset.rerender != null) render(); return; }
  if (b.startsWith('f.')) { S.f[b.slice(2)] = v; S.pg = 1; S.ppg = 1; S.apg = 0; if (b === 'f.layer') S.f.label = ''; }
  else if (b === 'schedC') S.schedC = v;
  else if (b.startsWith('duty.')) { const i = +b.slice(5), was = DUTY[i].who; DUTY[i].who = v; log(`值班表 ${DUTY[i].wk}：${ST(was).name} → ${ST(v).name}`, null, { cat: '配置', obj: '值班表' }); }
  else { const LBL = { urgentMin: '紧急报告确认时限（分钟）', esc: '5 级无人接收升级时长（小时）', 'lim.review4': '4 级 L2 复核时限（小时）', 'lim.verify3': '3 级 L1 核验时限（小时）', 'lim.verify2': '2 级 L1 核验时限（小时）', t3end: '3 级结束方式', samp2: '2 级抽查比例（%）', samp1: '1 级抽查比例（%）', cap: 'L2 待复核阈值（条）' };
    if (LBL[b]) { const [o, k] = b.includes('.') ? [RULES.lim, b.split('.')[1]] : [RULES, b], was = o[k]; o[k] = isNaN(+v) ? v : +v; log(`分层规则 · ${LBL[b]}：${was} → ${v}`, null, { cat: '配置', obj: '分层规则' }); toast(`已生效：${LBL[b]} ${was} → ${v}。只影响之后进入这一层的学生，已记入操作记录`); } }
  if (e.target.dataset.rerender != null) render(); });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'aiq') { ACT.askIn(); render(); const i = $('#aiq'); if (i) i.focus(); return; } if (e.key === 'Escape') { if (S.mo) S.mo = null; else if (S.noti) S.noti = false; else S.dw = null; render(); } });
