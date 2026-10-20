/* =====================================================================
   v1.11 · 与学生端联动（只在合并试用版里生效；单独打开机构端时什么也不做）
   4 位核心学生：林晓 / 陈嘉怡 / 黄子轩 / 王思远
===================================================================== */
const LY_CORE = () => ({ lin: CORE.lin, chen: CORE.chen, huang: CORE.huang, wang: CORE.wang });
const LY_ACTIVE = ['confirm', 'ok', 'change', 'audit', 'pool', 'move', 'adjust'];
const lyBook = s => BOOK.find(b => b.sid === s.id && LY_ACTIVE.includes(b.st));
const lyDay = iso => { const d = new Date(iso); const i = DXL.findIndex(x => sameDay(x, d)); return i; };
function LY_snap() { const o = { __bookReject: RULES.bookReject || {}, __sched: typeof schedSlots === 'function' ? schedSlots() : [], __bookResult: {} }; Object.entries(LY_CORE()).forEach(([k, s]) => { const b = lyBook(s); o[k] = b ? { id: b.id, st: b.st, cid: b.cid, day: b.day, t: b.t, date: DD(b.day).toISOString(), type: b.req && b.req.type, proposal: b.moveProposal || null, adjustReason: b.adjustReason || '' } : null; }); Object.entries(LY_CORE()).forEach(([core, s]) => { const b = BOOK.filter(x => x.sid === s.id).slice(-1)[0]; if (b && b.st === 'no') o.__bookResult[core] = { id: b.id, inv: !!b.inv || b.src === '主动邀约', reason: b.declineReason || '', note: b.declineNote || '' }; }); return o; }
function LY_ctx() { const s = S.dw && SU(S.dw.sid); return { 端: '机构端', 账号: S.uid ? `${ST(S.uid).name} · ${RN[S.role]}` : '未登录', 页面: S.uid ? TITLES[S.page] : '登录页', 视图: S.page === 'home' ? (homeView() === 'brief' ? '今日简报' : '工作台') : '', 标签: S.tabs && S.page === 'home' ? (S.tabs.home || '') : '', 学生: s ? `${s.name}（${s.id}）` : '', 档案标签: S.dw ? (S.dw.tab || '') : '', 弹窗: S.mo ? String(S.mo).split(':')[0] : '', 演示时间: fmt(NOW) }; }
function LY_in(ev) {
  const s = LY_CORE()[ev.core]; if (!s) return; let b = lyBook(s), msg = '';
  if (ev.t === 'book') {
    const day = lyDay(ev.date); if (day < 0 || !canTakeSlot(ev.cid, day, ev.ti, b && b.id, s.id)) { RULES.bookReject = RULES.bookReject || {}; RULES.bookReject[ev.core] = { token: `${Date.now()}-${Math.random()}`, cid: ev.cid, date: ev.date, ti: ev.ti, reason: '这个时段已被占用或不再开放，请重新选时间。' }; if (S.uid) render(); return `${s.name} 的预约未提交：时段已不可用`; } if (b && b.cid === ev.cid && b.day === day && b.t === ev.ti) return ''; if (b) { setSlot(b.cid, b.day, b.t, 'open'); b.st = 'cancelled'; }   // v1.13：学生重新预约 = 新的一条预约，旧的作废（避免被当成老师改约）
    b = { id: 'bx' + (BOOK.length + 1), sid: s.id }; BOOK.push(b);
    Object.assign(b, { cid: ev.cid, day, t: ev.ti, mode: ev.mode || '线下', kind: ev.kind || '预咨询', inv: !!ev.inv, st: (ev.kind || '预咨询') === '预咨询' ? 'ok' : 'confirm', fresh: (ev.kind || '预咨询') === '预咨询', src: '学生端提交', at: new Date(NOW), req: null }); setSlot(b.cid, day, b.t, "bk"); bookChanged(b, 'submit');
    log(`学生在学生端提交预约：${slotTxt(b)} · ${ST(b.cid).name}`, s, { cat: '预约', k: 'book', sys: 1 }); notify(b.cid, '站内', `${nm(s)} 提交了预约：${slotTxt(b)}`, b.id); msg = b.fresh ? `${s.name} 预约成功，已出现在 ${ST(b.cid).name} 的「新预约」里` : `${s.name} 提交了预约，已出现在 ${ST(b.cid).name} 的「预约待确认」里`; }
  else if (ev.t === 'moveAccept' && b && b.st === 'move' && ev.proposal === b.moveProposal) {
    if (!canTakeSlot(b.cid, b.day, b.t, b.id, b.sid)) { b.st = 'adjust'; bookChanged(b, 'adjust'); notify('c5', '站内 + 短信', '老师提议的时段发生冲突，请为学生重新安排', b.id); msg = '新时段已不可用，已请中心重新安排'; }
    else { b.st = 'ok'; b.moveAccepted = new Date(NOW); bookChanged(b, 'moveAccept'); log('学生接受老师提议的新时间，预约正式确认', s, { cat: '预约', k: 'book', sys: 1 }); notify(b.cid, '站内', `${s.name} 接受了新时间：${slotTxt(b)}`, b.id); msg = `${s.name} 已接受新时间，预约已确认`; }
  }
  else if (ev.t === 'req' && b) { b.st = 'change'; b.req = { cid: ev.cid || b.cid, type: ev.type === 'cancel' ? '取消' : '改期', day: ev.date ? lyDay(ev.date) : b.day, t: ev.ti ?? b.t }; b.src = `学生申请${b.req.type}`;
    log(`学生在学生端申请${b.req.type}`, s, { cat: '预约', k: 'book', sys: 1 }); notify(b.cid, '站内', `${nm(s)} 申请${b.req.type}`, b.id); msg = `${s.name} 申请${b.req.type}，等 ${ST(b.cid).name} 处理`; }
  else if (ev.t === 'cancel' && b && b.st === 'confirm') { b.st = 'cancelled'; setSlot(b.cid, b.day, b.t, 'open'); bookChanged(b, 'cancel'); log('学生在学生端取消了待确认的预约', s, { cat: '预约', k: 'book', sys: 1 }); msg = `${s.name} 取消了预约`; }
  else if (ev.t === 'ok' && b && b.st === 'confirm') { b.st = 'ok'; log('预约已确认（学生端演示按钮）', s, { cat: '预约', k: 'book', sys: 1 }); }
  else if (ev.t === 'callback' || ev.t === 'crisis') {
    const t = ev.t === 'callback' ? '学生点击「请 UCC 今天联系我」' : '学生端：作答或对话中出现风险信号，即时转入危机通道';
    const k = CRISES.find(x => x.sid === s.id && x.st !== 'closed');
    if (k) { if (!k.src.some(x => x.t === t && hrs(x.at) < 1)) k.src.push({ t, at: new Date(NOW) }); notify(DUTY[0].who, '电话 + 短信', `危机：${s.college} 一名学生有新情况`, k.id); }
    else newCrisis(s, t, ev.t === 'callback' ? '主动求助' : '主动意图');
    log(t, s, { cat: '危机', r: 1, k: 'crisis', sys: 1 }); msg = `${s.name}：${ev.t === 'callback' ? '请 UCC 今天联系' : '出现风险信号'}，已进入危机通道`; }
  else if (ev.t === 'done') { log(`学生在学生端完成「${ev.task}」`, s, { k: 'done', sys: 1 }); msg = `${s.name} 完成了「${ev.task}」`; }
  if (S.uid) render(); return msg;
}
