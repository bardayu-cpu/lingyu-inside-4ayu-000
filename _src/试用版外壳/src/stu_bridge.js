/* 学生端 · 与机构端联动（只在合并试用版里生效） */
const LY_SIDE = '学生端';
const LY_CK = { A: 'lin', B: 'chen', C: 'huang', D: 'wang' };
const lyIso = di => di == null || !DAYS[di] ? null : DAYS[di].toISOString();
function LY_snap() { const b = S.bk, ts = S.tasks || []; S._ly = S._ly || Math.random().toString(36).slice(2);
  return { inst: S._ly, scen: S.scen, core: LY_CK[S.scen], ivc: ivSnapshot(), bk: b ? { cid: b.cid, date: lyIso(b.di), ti: b.ti, mode: b.mode, kind: b.kind, inv: !!b.inv, ivId: b.ivId, st: b.st, moved: !!b.moved, moveAck: b.moveAck || null, pend: b.pend ? { type: b.pend.type, date: lyIso(b.pend.di), ti: b.pend.ti } : null, intake: b.intake && ['sent', 'skipped'].includes(b.intake.st) ? { st: b.intake.st, ver: b.intake.ver || 0, sum: b.intake.sum || null, crisis: !!b.intake.crisis, mode: b.intake.mode || IK_MODE, tk: b.intake.tk || 't1', tv: b.intake.tv || 1, adds: (b.intake.adds || []).map(a => ({ at: a.at, t: a.t })) } : null } : null,
    cb: !!S.callback, crisis: ts.some(t => t.crisis) || !!(S.ik && S.ik.crisis), done: ts.filter(isDone).map(t => DATA_ZH.tasks.find(d => d.id === t.id).name), decl: ts.filter(t => t.declined).map(t => DATA_ZH.tasks.find(d => d.id === t.id).name), inv: (S.invs || []).map(v => ({ id: v.id, r: v.r, rv: v.rv, slots: v.slots, why: v.why })) }; }
function LY_ctx() { return { 端: '学生端', 场景: SCENES[S.scen].name, 页面: ((typeof JUMPS !== 'undefined' && JUMPS.find(j => j[0] === S.page)) || [0, S.page])[1].replace(/^\d+b? /, ''), 弹窗: S.modal || '', 语言: LANG === 'en' ? 'English' : '中文' }; }
function LY_in(ev) { const b = S.bk; let msg = '';
  if (ev.t === 'ivcSync') { ivReceive(ev.ivc); render(); return ''; }
  if (ev.t === 'confirm' && b && b.st === '待确认') { ACT.zConfirm(); msg = '学生端收到「老师已确认你的预约」'; }
  else if (ev.t === 'decline' && b && !b.pend) { const invited = ev.inv || b.inv; ACT.zDecline(); const detail = [ev.reason, ev.note].filter(Boolean).join('；'); if (detail) { if (S.inbox[0]) S.inbox[0].d = [`老师说明：${detail}。请重新选择方便的时间。`, `Counsellor’s message: ${detail}. Please pick another time.`]; if (S.info) S.info.body = `<p>${L('老师说明', 'Counsellor’s message')}：${esc(detail)}</p><p>${L('请重新选择方便的时间，不占用你的取消次数。', 'Please pick another time. This does not count toward your cancellation limit.')}</p>`; } if (invited && S.ivc) { S.ivc.st = 'entry'; S.ivc.ik = S.ivc.ik || b.intake; S.page = 'book'; S.bookTab = 'time'; } msg = invited ? '学生端回到主动邀约选时间，入口和预咨询保留' : '学生端收到「老师这次无法接待」'; }
  else if (ev.t === 'agree' && b && b.pend) { ACT.zPend(); msg = '学生端收到「老师同意了你的申请」'; }
  else if (ev.t === 'deny' && b && b.pend) { const ty = b.pend.type === 'cancel' ? '取消' : '改期'; b.pend = null;
    addMsg('cal', [`你的${ty}申请未通过`, 'Your request was not approved'], ['原预约保持不变。', 'Your original appointment stays.'], 'mybook'); msg = `学生端收到「${ty}申请未通过」`; }
  else if (ev.t === 'move' && b) { const di = DAYS.findIndex(d => d.toDateString() === new Date(ev.date).toDateString());
    if (di >= 0) { const old = bkWhen(b); Object.assign(b, { di, ti: ev.ti, st: '已改约', moved: true, oldWhen: old, moveProposal: ev.proposal || null });
      addMsg('edit', [`${whoZ(b.cid)}调整了你的预约时间`, 'Your counsellor moved your appointment'], [`由 ${old} 改为 ${bkWhen(b)}。`, `New time: ${bkWhen(b)}.`], 'mybook'); S.modal = 'moved'; msg = '学生端收到「老师调整了预约时间」'; } }
  else if (ev.t === 'centerAdjust' && b) { b.st = '中心调整 · 待重新安排'; b.centerAdjusted = true; b.pend = null; if (S.ivc && b.inv) S.ivc.st = 'adjust'; const body = '原定的时间因老师临时有事取消了，老师会尽快重新和你约。'; addMsg('cal', ['中心正在重新安排时间', 'UCC is arranging a new time'], [body, 'Your original time was cancelled because your counsellor is temporarily unavailable. UCC will contact you soon to arrange another time.'], 'mybook', true); S.info = { ico: 'cal', title: L('中心正在重新安排时间', 'UCC is arranging a new time'), body: esc(body), btn: ['mybook', L('查看预约', 'View appointment')] }; S.modal = 'info'; msg = '学生已收到中心调整通知，不计学生改期或取消次数'; }
  else if (ev.t === 'rearrange' && b) { const di = DAYS.findIndex(d => d.toDateString() === new Date(ev.date).toDateString()); if (di >= 0) { Object.assign(b, { cid: ev.cid, di, ti: ev.ti, st: '待确认', centerAdjusted: false, moved: true }); addMsg('cal', ['中心已重新安排，等待老师确认', 'UCC has arranged a new time'], [bkWhen(b), bkWhen(b)], 'mybook'); } }
  else if (ev.t === 'moveConfirmed' && b) { ACT.zConfirm(); msg = '学生接受新时间后，预约已正式确认'; }
  else if (ev.t === 'bookRejected' && b && b.cid === ev.cid && lyIso(b.di) === ev.date && b.ti === ev.ti && b.st === '待确认') { S.bk = null; if (b.inv && S.ivc) S.ivc.st = 'entry'; S.page = 'book'; S.modal = null; toast(ev.reason); msg = '预约申请未提交，请重新选时间'; }
  else if (ev.t === 'intakeViewed' && b && b.intake) { b.intake.viewed = true; msg = '学生端：预咨询摘要显示「老师已查看」'; }
  else if (ev.t === 'invSync') { const keep = new Set((ev.invs || []).map(v => v.id)); if (S.invs) { const gone = S.invs.filter(o => !keep.has(o.id)).map(o => 'inv:' + o.id); S.invs = S.invs.filter(o => keep.has(o.id)); S.inbox = S.inbox.filter(x => !gone.includes(x.link)); if (gone.includes('inv:' + S.inv) && S.modal === 'inv') S.modal = null; }   // 以机构端为准：机构端已经没有的邀约，学生端也删掉
    (ev.invs || []).forEach(v => { const o = (S.invs || []).find(x => x.id === v.id); if (!o || o.st !== v.st || o.ver !== v.ver || o.start !== v.start) invUpd(v); }); msg = ''; }
  else if (ev.t === 'invite' || ev.t === 'invUpd') { const o0 = (S.invs || []).find(x => x.id === ev.inv.id), same = o0 && o0.st === ev.inv.st && o0.start === ev.inv.start && o0.who === ev.inv.who; invUpd(ev.inv);
    msg = same ? '' : o0 && o0.st === 'frozen' && ['wait', 'wait2', 'ok'].includes(ev.inv.st) ? '学生收到「约谈恢复了」' : o0 ? `学生收到邀约更新：${({ wait: '老师改了时间，请学生再确认', wait2: '老师给了新时间', cancel: '老师取消了', frozen: '约谈先暂停', ok: '时间调整', expired: '原定时间已过', done: '已经聊过', no: '学生说这次不用了', change: '等老师给新时间' })[ev.inv.st] || '有更新'}` : '学生收到「老师约你聊聊」'; }
  else if (ev.t === 'schedSync') { S._schedSnapshot = ev.slots || []; S._slotAllowed = ev.allowed || null; msg = ''; }
  else if (ev.t === 'cfg') { IK_MODE = ev.intakeMode; if (ev.ikt) IK_CFG = ev.ikt; if (ev.ikh) IK_CFG_H = ev.ikh; msg = ''; }
  render(); return msg; }

/* 老师改时间必须由学生接受后，机构端完成最后的冲突校验。 */
const _lyMovedOk = ACT.movedOk; ACT.movedOk = function () { const proposal = S.bk && S.bk.moveProposal; _lyMovedOk.apply(this, arguments); if (proposal && S.bk) { S.bk.moveAck = proposal; S.bk.st = '待确认'; } };

const _lyMyBook = PAGES.mybook; PAGES.mybook = function () { if (!(S.bk && S.bk.centerAdjusted)) return _lyMyBook(); return `<div class="bk"><div class="bh"><span class="ico">${I('cal')}</span><b>${L('中心调整 · 待重新安排', 'UCC is arranging a new time')}</b></div><div class="bb"><p>${L('原定的时间因老师临时有事取消了，老师会尽快重新和你约。', 'Your counsellor is temporarily unavailable. UCC will contact you soon to arrange another time.')}</p><p class="note">${L('这次变更不占用你的改期或取消次数，预咨询内容会保留。', 'This does not count toward your changes or cancellations. Your intake summary is retained.')}</p></div></div>`; };
