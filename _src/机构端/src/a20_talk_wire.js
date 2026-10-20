/* =====================================================================
   v1.14 · 谈心：动作、危机冻结、工作台 / 简报 / 档案 / 设置接入、试用版联动
===================================================================== */
HINT.frz = '学生在危机通道里，邀约先暂停，由危机负责人决定恢复或取消。';
const frozenOf = sid => ITEMS.filter(x => x.sid === sid && x.st === 'frozen').map(x => ({ id: x.id, x })).concat(INV.filter(v => v.sid === sid && v.st === 'frozen').map(v => ({ id: v.id, v })));
function moveItems(ids, to, why, byCenter) { const L = ITEMS.filter(x => ids.includes(x.id)); if (!L.length) return; const s = SU(L[0].sid);
  L.forEach(x => { const from = x.to; x.moved.push({ at: new Date(NOW), from, to, by: me(), why: why || '' }); x.to = to; x.ver++; x.pend = null;
    if (from !== me() && from !== to) notify(from, '站内', `你的 1 个谈心事项已${byCenter ? '由中心' : ''}改派给 ${ST(to).name}`, s.id); });
  INV.filter(v => ivActive(v) && v.by !== to && L.some(x => x.inv === v.id)).forEach(v => { const rest = ITEMS.filter(x => x.inv === v.id && itOpen2(x) && x.to !== to);
    if (rest.length) { L.forEach(x => { if (x.inv === v.id) x.inv = null; }); v.items = v.items.filter(id => !L.some(x => x.id === id)); }   // 还有事项留在原老师手里：邀约不动，移走的事项不再挂这条邀约
    else { v.by = to; v.ho = v.st !== 'frozen'; v.ver++; } });
  if (byCenter) PRIMARY[s.id] = to; XF.filter(f => f.type === 'xcol' && f.st === 'wait' && (f.items || []).some(id => ids.includes(id))).forEach(f => { f.st = 'closed'; f.res = '事项已直接转走，跨学院确认作废'; });
  notify(to, '站内', `${ST(me()).name} ${byCenter ? '改派' : '转'}给你 ${L.length} 个谈心事项：${s.name}`, s.id);
  log(`${byCenter ? '改派' : '转派'}谈心事项 ${L.length} 个 → ${ST(to).name}${why ? `（${why}）` : ''}`, s, { k: 'talkTask', noTl: 1, obj: '谈心任务' }); }
function lostCheck(s, from) { const n = missN(s); if (n >= 2 && !XF.some(x => x.sid === s.id && x.type === 'lost' && ['wait', 'recv'].includes(x.st))) { addXf('lost', s, Object.assign({ note: `连续 ${n} 次未回应` }, from ? { from } : {})); s.l2take = true; } }
/* v1.16：上报、撤回、暂停后，关联邀约里已经没有在办事项的，一并取消并通知学生 */
const ivActive = v => !!v && ['wait', 'wait2', 'ok', 'change', 'frozen'].includes(v.st);
function ivDrop(ids, why) { INV.filter(v => ivActive(v) && v.items.some(id => ids.includes(id))).forEach(v => { const left = v.items.filter(id => !ids.includes(id) && itOpen(ITEMS.find(x => x.id === id) || {}));
  ITEMS.filter(x => ids.includes(x.id) && x.inv === v.id).forEach(x => { x.inv = null; });
  if (!left.length) { v.st = 'cancel'; v.ver++; v.cancelWhy = why; log(`邀约（${ivTime(v)}）随事项${why}一并取消，已通知学生`, SU(v.sid), { k: 'inv', obj: '邀约', noTl: 1 }); } }); }
/* 危机期间不能重新打开：要打开的事项改成冻结 */
const reopen = (x, st = 'open') => { if (inCrisis(x.sid)) { x.prevSt = st; x.st = 'frozen'; x.frozenAt = x.frozenAt || new Date(NOW); return false; } x.st = st; return true; };
function unfreeze(id, why) { const x = ITEMS.find(y => y.id === id), v = !x && INV.find(y => y.id === id);
  if (x) { x.st = x.prevSt || 'open'; if (x.frozenAt) x.due = new Date(x.due.getTime() + (NOW - x.frozenAt)); x.frozenAt = null; x.unfzAsk = 0; }
  if (v) { if (v.start <= NOW) { v.st = 'expired'; v.fzMiss = true; v.miss = false; v.outcome = '危机期间错过，需要重新约'; ITEMS.filter(y => y.inv === v.id).forEach(y => { y.inv = null; }); } else v.st = v.prevSt || 'wait'; v.ver++; v.unfzAsk = 0; }
  log(`解冻谈心${x ? '事项' : '邀约'}${why ? `（${why}）` : ''}`, SU((x || v).sid), { k: 'talkTask', cat: '危机', obj: '谈心任务', noTl: 1 }); return x || v; }
function stuReply(v, r, slots, why) { const s = SU(v.sid); v.reply = r; v.repAt = new Date(NOW);
  if (r === '好的') v.st = 'ok';
  else if (r === '换个时间') { v.st = 'change'; v.slots = slots || []; v.why = why || ''; }
  else { v.st = 'no'; ITEMS.filter(x => v.items.includes(x.id) && x.st === 'open').forEach(x => { x.st = 'closed'; x.closeWhy = '学生这次不想谈'; x.inv = null; });
    if (curLv(s) >= 4) addXf('decline', s, { from: v.by, note: '学生在邀约里选了「这次不用了」' }); }
  notify(v.by, '站内', `${s.name} 回复了邀约：${r}`, s.id); log(`学生回复邀约：${r}${r === '换个时间' && slots ? `（${slots.map(x => `${x.day} ${x.part}`).join('、')}）` : ''}`, s, { k: 'inv', sys: 1, cat: '流转', obj: '邀约' }); }
const riskAdd = (t, txt, sid = t.sid) => { const words = talkRiskWords(txt); if (t.draft || !words.length) return null; t.risk = 1; t.forced = true;
  return talkRiskReport(t, SU(sid), words, `${ST(me()).name} 追加的谈话记录里出现安全相关的表达（保存时自动报告）`); };
const recFrom = t => Object.assign(recNew(t.sid), { id: t.id, sids: (t.sids || [t.sid]).slice(), who: (t.who || ['本人']).slice(), date: ymd(t.at), tm: `${pad(t.at.getHours())}:${pad(t.at.getMinutes())}`, plan: t.plan, inv: t.inv, mode: t.mode, place: t.place, result: t.result, situ: t.situ, types: (t.types || []).slice(), need: t.need || '', topic: t.topic || '', next: t.next || '不需要', center: !!t.center, cwhy: t.cwhy || '',
    done: t.draft ? recNew(t.sid, t.inv).done : [], shares: (t.shares || []).map(x => Object.assign({}, x, { parts: x.parts.slice(), days: x.days || 30 })), sis: t.sis, src0: t.src0, t0: t.t0, prev: t.prev, same: !!t.prev, pp: JSON.parse(JSON.stringify(t.pp || {})), backfill: t.backfill, cw: t.cw, dirty: false });
const _go14 = ACT.go;
const leaveTo = () => { if (S.pendSel) { S.tabs.talk = 'todo'; S.tksel = S.pendSel; S.pendSel = null; } };   // v1.17：离开记录页后选中原本要去的学生
Object.assign(ACT, {
  go(p) { if (S.rec && S.rec.dirty) { S.mo = `recLeave:${p}`; return; } S.rec = null; S.rv = null; _go14(p); },
  tktab(k) { if (S.rec && S.rec.dirty) { S.mo = `recLeave:tab-${k}`; return; } S.tabs.talk = k; S.rec = null; S.rv = null; }, tkX(sid) { S.tkx = S.tkx || {}; S.tkx[sid] = !S.tkx[sid]; },
  tkGoS(sid) { go('talk'); S.rec = null; S.rv = null; S.tabs.talk = 'todo'; S.tkx = { [sid]: true }; },
  tkNew(a) { const [sid, iv] = (a || '').split('|'); if (sid && !tkScope(SU(sid))) return toast('这个学生不在你的管理范围里'); go('talk'); S.rv = null; S.rec = recNew(sid || null, iv || null); if (!sid) S.rec.pick = ''; },
  tkEdit(tid) { const t = TALKS.find(x => x.id === tid); if (!recOwner(t)) return toast('只有写这条记录的人（或岗位接任者）可以修改'); if (!t.draft && recLocked(t)) return toast(HINT.lock); go('talk'); S.rv = null; S.rec = recFrom(t); },
  tkView(tid) { const t = TALKS.find(x => x.id === tid), from = S.page === 'talk' ? S.tabs.talk : null; go('talk'); S.mo = null; S.rvFrom = from; S.rec = null; S.rv = tid; if (recVis(t) && !recOwner(t)) log(`查看谈话记录 ${tkId(t)}`, SU(t.sid), { cat: '查看', noTl: 1, obj: '谈话记录' }); },
  recBack() { if (S.rec && S.rec.dirty) { S.mo = 'recLeave:talk'; return; } S.rec = null; S.rv = null; if (S.rvFrom) { S.tabs.talk = S.rvFrom; S.rvFrom = null; } },
  recLeaveGo(p) { S.rec = null; S.rv = null; S.mo = null; if (p.startsWith('tab-')) S.tabs.talk = p.slice(4); else if (p !== 'talk') _go14(p); leaveTo(); },
  recLeaveSave(p) { const R = S.rec, ed = R.id && TALKS.find(t => t.id === R.id); S.mo = null; ACT.recSave(ed && !ed.draft ? '' : 'draft'); if (S.rec) return; if (S.mo) return; if (p.startsWith('tab-')) S.tabs.talk = p.slice(4); else if (p !== 'talk') _go14(p); leaveTo(); },
  recSave(a) { const R = S.rec, mine = myItems().map(x => x.id), gone = R.done.filter(id => !mine.includes(id)); R.done = R.done.filter(id => mine.includes(id)); recSave(a === 'draft'); if (gone.length) toast(HINT.gone); },
  rcT(a) { const R = S.rec, i = a.indexOf('|'), k = a.slice(0, i), v = a.slice(i + 1); R.dirty = true;
    if (k === 'who' || k === 'types') R[k] = R[k].includes(v) ? R[k].filter(x => x !== v) : [...R[k], v]; else if (k === 'same') R.same = v === '1'; else R[k] = v; },
  rcDel(sid) { const R = S.rec; R.sids = R.sids.filter(x => x !== sid); R.done = R.done.filter(id => (ITEMS.find(x => x.id === id) || {}).sid !== sid); R.dirty = true; },
  rcPick() { S.rec.pick = ''; }, rcSPick() { S.rec.spick = ''; },
  rcAdd(sid) { const R = S.rec, n = recNew(sid); R.sids.push(sid); R.done = R.done.concat(n.done); if (!R.prev && n.prev) { R.prev = n.prev; R.same = true; } R.pick = null; R.dirty = true; },
  rcPP(a) { const [sid, k] = a.split('|'), p = S.rec.pp[sid] = S.rec.pp[sid] || {}; p[k] = !p[k]; S.rec.dirty = true; },
  rcC() { S.rec.center = !S.rec.center; S.rec.dirty = true; }, rcB() { S.rec.backfill = !S.rec.backfill; S.rec.dirty = true; },
  rcDone(id) { const R = S.rec; R.done = R.done.includes(id) ? R.done.filter(x => x !== id) : [...R.done, id]; R.dirty = true; },
  rcSP(a) { const [i, p] = a.split('|'), x = S.rec.shares[+i]; x.parts = x.parts.includes(p) ? x.parts.filter(q => q !== p) : [...x.parts, p]; S.rec.dirty = true; },
  rcSDel(i) { const x = S.rec.shares[+i]; if (x.at) x.off = x.off || new Date(NOW); else S.rec.shares.splice(+i, 1); S.rec.dirty = true; }, rcSAdd(u) { S.rec.shares.push({ to: u, parts: PARTS.map(p => p[0]), days: 30 }); S.rec.spick = null; S.rec.dirty = true; },
  rcSis() { S.rec.sis = !sisDef(S.rec); S.rec.dirty = true; },
  hint(k) { toast(HINT[k] || k); }, memoOpen() { S.memo = true; },
  fArr(a) { const i = a.indexOf('|'), k = a.slice(0, i), v = a.slice(i + 1), L = S.form[k] || []; S.form[k] = L.includes(v) ? L.filter(x => x !== v) : [...L, v]; },
  tkTell(a) { const [id, r] = a.split('|'), t = TELL.find(x => x.id === id), v = INV.find(x => x.id === t.inv); t.st = 'done'; t.res = r; log(`告诉学生中心的决定（${t.dec === '重新约' ? '重新约时间' : t.dec === '恢复' ? '照常见面' : '这次先不见'}）：${r}`, SU(v.sid), { k: 'inv', cat: '危机', obj: '邀约', noTl: 1 }); toast('已记下'); },
  tkHo(a) { const [id] = a.split('|'), v = INV.find(x => x.id === id); v.ho = false; v.ver++; v.whoCh = 1; log(`保留移交来的邀约（${ivTime(v)}），学生收到新老师的名字`, SU(v.sid), { k: 'inv', obj: '邀约', noTl: 1 }); toast('已保留，学生会收到一条更新，写明新老师的名字'); },
  tkFill(a) { const [id, r] = a.split('|'), v = INV.find(x => x.id === id), s = SU(v.sid); if (r === '已谈待记录') return ACT.tkNew(`${v.sid}|${v.id}`);
    v.outcome = r; v.st = r === '老师取消' ? 'cancel' : 'expired'; v.miss = r !== '老师取消'; ITEMS.filter(x => x.inv === v.id).forEach(x => { x.inv = null; });
    log(`待补记录：${r}`, s, { k: 'inv', obj: '邀约', noTl: 1 }); lostCheck(s, v.by); toast(r === '老师取消' ? '已记下，事项回到待谈心，不计次' : `已记下，计一次「未回应」${missN(s) >= 2 ? '；连续 2 次，已交给中心' : ''}`); },
  tkInvCancel(id) { const v = INV.find(x => x.id === id); v.st = 'cancel'; v.ver++; ITEMS.filter(x => x.inv === id).forEach(x => { x.inv = null; }); log(`取消邀约（${ivTime(v)}），已通知学生`, SU(v.sid), { k: 'inv', obj: '邀约', noTl: 1 }); toast('已取消，已通知学生'); },
  tkInvGo(sid) { const F = S.form, s = SU(sid); if (inCrisis(sid)) return toast(HINT.frz); if (!(F.its || []).length) return toast('请勾选这次邀约对应的事项');
    if (ITEMS.some(x => F.its.includes(x.id) && ivActive(INV.find(v => v.id === x.inv)))) return toast('勾选的事项已经有在途的邀约，请在「已约」里改时间'); if (!F.day) return toast('请选择日期'); if (!F.ch.length) return toast('请选择怎么发');
    const st = new Date(+F.day), [h, m] = F.tm.split(':'); st.setHours(+h, +m); if (st < NOW) return toast('这个时间已经过了');
    const v = addInv({ sid, by: me(), start: st, end: new Date(st.getTime() + parseInt(F.len) * 60e3), mode: F.mode, place: F.mode === '面对面' ? F.place : '', link: F.link || '', items: F.its.slice(), ch: F.ch.slice(), d: !s.phone && !F.ch.includes('站内消息') ? 'fail' : 'ok' });
    ITEMS.filter(x => F.its.includes(x.id)).forEach(x => { x.inv = v.id; }); log(`发邀约：${ivTime(v)} · ${v.mode}（${F.ch.join('、')}）`, s, { k: 'inv', obj: '邀约', noTl: 1 });
    S.mo = null; toast((st - NOW) / H < 24 ? '已发出。离见面不到 24 小时，请先和学生确认' : '已发出，学生回复后会通知你'); },
  tkInvEditGo(id) { const F = S.form, v = INV.find(x => x.id === id); if (v.st === 'frozen' || inCrisis(v.sid)) return toast(HINT.frz); if (!['wait', 'wait2', 'ok', 'change'].includes(v.st)) return toast('这条邀约已经结束，不能再改');
    if (!F.day || !F.tm) return toast('请选择日期和时间'); const st = new Date(+F.day), [h, m] = F.tm.split(':'); st.setHours(+h, +m); if (st <= NOW) return toast('这个时间已经过了'); if (+st === +v.start) return toast('时间没变，不用改');
    v.hist.push({ at: new Date(NOW), start: v.start }); const len = v.end - v.start; v.start = st; v.end = new Date(st.getTime() + len); v.st = v.st === 'change' || v.st === 'wait2' ? 'wait2' : 'wait'; v.reply = null; v.rem = null; v.ver++; v.ho = false;
    log(`修改邀约时间 → ${ivTime(v)}，已通知学生`, SU(v.sid), { k: 'inv', obj: '邀约', noTl: 1 }); S.mo = null; toast('已更新，学生需要再确认一次'); },
  tkSimGo(id) { const F = S.form, v = INV.find(x => x.id === id); if (!F.r) return toast('请选择'); stuReply(v, F.r, F.r === '换个时间' ? [{ day: dayTxt(later(48)), part: '下午' }, { day: dayTxt(later(72)), part: '上午' }] : null, F.r === '换个时间' ? '那天下午有实验课' : ''); S.mo = null; toast(`学生回复：${F.r}`); },
  tkRepGo(sid) { const F = S.form, s = SU(sid); if (!(F.its || []).length) return toast('请勾选事项'); if (!F.why) return toast('请选择原因'); if (!(F.note || '').trim()) return toast('请写一句说明');
    const x = addXf(F.why === '不需要谈' ? 'rep_no' : 'rep_take', s, { note: F.note.trim(), items: F.its.slice() }); ITEMS.filter(y => F.its.includes(y.id)).forEach(y => { y.st = 'reported'; y.rep = x.id; y.backNote = ''; }); ivDrop(F.its, '上报中心'); S.mo = null; toast(`已上报，接收人：${xfRecv(x)}`); },
  tkMoveGo(sid) { const F = S.form, s = SU(sid); if (!(F.its || []).length) return toast('请勾选事项'); if (!F.to) return toast('请选择老师');
    if (crossCol(F.to, s) && !canDispatch()) { const x = addXf('xcol', s, { note: (F.why || '').trim(), items: F.its.slice(), target: F.to }); ITEMS.filter(y => F.its.includes(y.id)).forEach(y => { y.pend = { to: F.to, xf: x.id }; }); S.mo = null; return toast(HINT.moveWait); }
    moveItems(F.its, F.to, (F.why || '').trim()); S.mo = null; toast(`已转给 ${ST(F.to).name}`); },
  tkReGo(id) { const F = S.form; if (!canDispatch()) return toast('你没有派活权限，请联系系统管理员'); if (!(F.its || []).length) return toast('请勾选要改派的事项'); if (!F.to) return toast('请选择');
    moveItems(F.its, F.to, (F.why || '').trim(), true); S.mo = null; toast(`已改派 ${F.its.length} 个事项给 ${ST(F.to).name}；这个学生之后的自动任务也派给 ${ST(F.to).name}`); },
  tkWdGo(id) { const F = S.form, x = ITEMS.find(y => y.id === id), s = SU(x.sid); if (!canDispatch()) return toast('你没有派活权限'); if (x.st === 'frozen' && F.how !== '只撤这一次') return toast('学生在危机通道里，这个事项已冻结，不能暂停'); if (!F.how) return toast('请选择'); if (F.how === '暂停到某天' && !F.d) return toast('请选择暂停到哪天'); if (!(F.note || '').trim()) return toast('请写原因');
    if (F.how === '只撤这一次') x.st = 'withdrawn'; else { x.st = 'paused'; x.pauseTo = later(+F.d * 24); s.tkPauseTo = x.pauseTo; } x.ver++; ivDrop([x.id], F.how === '只撤这一次' ? '撤回' : '暂停');
    notify(x.to, '站内', `你的 1 个谈心事项已由中心${F.how === '只撤这一次' ? '撤回' : '暂停'}：${s.name}`, s.id); log(`${F.how === '只撤这一次' ? '撤回' : `暂停到 ${fmt(x.pauseTo).split(' ')[0]}`}谈心事项（${F.note.trim()}）`, s, { k: 'talkTask', noTl: 1, obj: '谈心任务' }); S.mo = null; toast('已处理，已通知负责人'); },
  tkResume(id) { const x = ITEMS.find(y => y.id === id); delete SU(x.sid).tkPauseTo; if (!reopen(x)) { log('恢复暂停的谈心事项：学生在危机通道里，改为冻结', SU(x.sid), { k: 'talkTask', noTl: 1, obj: '谈心任务' }); return toast('学生在危机通道里，事项改为冻结，结案时再决定'); } log('恢复暂停的谈心事项', SU(x.sid), { k: 'talkTask', noTl: 1, obj: '谈心任务' }); },
  tkPrimReset(sid) { delete PRIMARY[sid]; log('恢复默认派发（派给学院跟进人）', SU(sid), { k: 'talkTask', noTl: 1, obj: '谈心任务' }); toast('已恢复，之后的自动任务派给学院跟进人'); },
  tkMkGo() { const F = S.form, s = F.sid && SU(F.sid); if (!s) return toast('请选择学生'); if (!canDispatch()) return toast('你没有派活权限'); if (inCrisis(s.id)) return toast('学生在危机通道里，危机期间不能新建谈心任务'); if (!(F.note || '').trim()) return toast('请写说明'); if (/PHQ|GAD|量表|\d+\s*分|[1-5一二三四五]\s*级|等级/i.test(F.note)) return toast('说明里不能写量表名、分数或等级'); if (!F.due) return toast('请选择期限');
    const to = F.to || primaryOf(s), x = addItem({ sid: s.id, to, src: 'center', by: me(), why: F.note.trim(), due: later(parseInt(F.due) * 24) }); notify(to, '站内', `${ST(me()).name} 给你建了 1 个谈心事项：${s.name}`, s.id);
    log(`手动建谈心任务 → ${ST(to).name}（期限 ${F.due}）`, s, { k: 'talkTask', noTl: 1, obj: '谈心任务' }); S.mo = null; toast(`已建任务，派给 ${ST(to).name}`); },
  tkHandGo(u) { const F = S.form; if (!F.to) return toast('请选择接任者'); const L = ITEMS.filter(x => itOpen2(x) && x.to === u), iv = INV.filter(v => v.by === u && ivActive(v)), mine = t => t.by === u || t.heir === u;
    L.forEach(x => { x.moved.push({ at: new Date(NOW), from: u, to: F.to, by: me(), why: '岗位移交' }); x.to = F.to; }); iv.forEach(v => { v.by = F.to; v.ho = v.st !== 'frozen'; v.ver++; }); TALKS.filter(mine).forEach(t => { t.heir = F.to; });
    TELL.filter(t => t.by === u && t.st === 'open').forEach(t => { t.by = F.to; });
    STU.filter(s => primaryOf(s) === u).forEach(s => { PRIMARY[s.id] = F.to; });                 // 之后的自动任务也派给接任者
    S.ho = S.ho || {}; S.ho[F.to] = { from: u, items: L.length, inv: iv.length, drafts: TALKS.filter(t => t.heir === F.to && t.draft).length, shares: TALKS.filter(t => t.heir === F.to && (t.shares || []).some(shareOn)).length };
    notify(F.to, '站内', `${ST(u).name} 的谈心工作已移交给你，请查看交接清单`, null); log(`岗位移交：${ST(u).name} → ${ST(F.to).name}（事项 ${L.length}、已约 ${iv.length}）`, null, { cat: '流转', obj: '谈心任务' }); S.mo = null; toast('已移交，接任者会看到交接清单'); },
  xfGo(a) { const [id, op] = a.split('|'), x = XF.find(y => y.id === id), s = SU(x.sid), F = S.form, note = (F.note || '').trim(), its = ITEMS.filter(y => (x.items || []).includes(y.id));
    if (['back', 'no'].includes(op) && !note) return toast('请写一句说明'); if (op === 'end' && !note) return toast('请写结论');
    const takeOn = () => XF.some(y => y !== x && y.sid === s.id && y.st === 'recv' && ['rep_take', 'interv', 'decline', 'lost'].includes(y.type));
    if (op === 'recv') { x.st = 'recv'; x.to = x.to || me(); if (x.type === 'rep_take') { s.l2take = true; its.forEach(y => { y.st = 'closed'; y.closeWhy = '中心接手'; }); ivDrop(its.map(y => y.id), '由中心接手'); } if (['interv', 'decline', 'lost'].includes(x.type)) s.l2take = true; notify(x.from, '站内', `中心已接收：${s.name}`, s.id); }
    if (op === 'ok') { x.st = 'ok'; if (x.type === 'rep_no') its.forEach(y => { y.st = 'closed'; y.closeWhy = '中心同意关闭'; });
      if (x.type === 'xcol') { const okIds = its.filter(y => y.to === x.from && itOpen(y) && y.pend && y.pend.xf === x.id).map(y => y.id); if (!okIds.length) { x.st = 'closed'; x.res = '事项已不在原来老师手里，转派作废'; S.mo = null; return toast('这些事项已经不在原来老师手里，转派作废'); } moveItems(okIds, x.target, '跨学院转派，中心已确认'); }
      if (x.type === 'unfz') { const o = ITEMS.find(y => y.id === x.fz) || INV.find(y => y.id === x.fz); if (!o || o.st !== 'frozen') { x.st = 'closed'; x.res = '已经不在冻结状态，申请作废'; S.mo = null; return toast('这一项已经不在冻结状态（可能危机已结案），申请作废'); } unfreeze(x.fz, '上级已批准'); }
      if (x.type === 'corr') { const t = TALKS.find(y => y.id === x.rec); t.corrOk = 1; t.corrAsk = 0; }
      notify(x.from, '站内', x.type === 'unfz' ? `中心已批准恢复：${s.name} 的${ITEMS.some(y => y.id === x.fz) ? '谈心事项' : '邀约'}` : `${XT[x.type]}：中心已${x.type === 'corr' ? '批准，可以再改一次' : x.type === 'xcol' ? '确认' : '同意关闭'}`, s.id); }
    if (op === 'back') { x.st = 'back'; its.forEach(y => { reopen(y); y.backNote = note; }); s.l2take = takeOn(); notify(x.from, '站内', `中心退回了你上报的事项：${s.name}`, s.id); }
    if (op === 'no') { x.st = 'no'; if (x.type === 'xcol') its.forEach(y => { y.pend = null; }); if (x.type === 'corr') TALKS.find(y => y.id === x.rec).corrAsk = 0; if (x.type === 'unfz') { const o = ITEMS.find(y => y.id === x.fz) || INV.find(y => y.id === x.fz); if (o) o.unfzAsk = 0; } notify(x.from, '站内', `${XT[x.type]}：中心不同意（${note}）`, s.id); }
    if (op === 'end') { x.st = 'closed'; x.res = note; if (x.type === 'rep_take') its.forEach(y => { if (itOpen(y)) { y.st = 'closed'; y.closeWhy = '中心已结束'; } }); s.l2take = takeOn(); notify(x.from, '站内', `中心已结束：${s.name}`, s.id); }
    x.res = x.res || note; log(`转来的 · ${XT[x.type]}：${{ recv: '接收', ok: '同意', back: '退回', no: '不同意', end: '结束' }[op]}${note ? `（${note}）` : ''}`, s, { k: 'xfer', obj: '谈心任务', noTl: 1 }); S.mo = null; toast('已处理，已通知对方'); },
  xfAssignGo(id) { const x = XF.find(y => y.id === id); if (!S.form.to) return toast('请选择'); x.to = S.form.to; notify(x.to, '站内', `分配给你 1 件转来的事：${XT[x.type]}`, x.sid); log(`转来的 · 分配给 ${ST(x.to).name}`, SU(x.sid), { k: 'xfer', obj: '谈心任务', noTl: 1 }); S.mo = null; toast(`已分配给 ${ST(x.to).name}`); },
  tkAddGo(tid) { const t = TALKS.find(x => x.id === tid), v = (S.form.add || '').trim(), ids = t.sids || [t.sid]; if (!recOwner(t)) return toast('只有写这条记录的人可以追加'); if (!v) return toast('请写下补充的内容');
    if (ids.length > 1 && TALK_RE.test(v) && !S.form.cw) { S.form.askCw = 1; return toast('补充里有安全相关的表达，请先选涉及哪个学生'); }
    const who = ids.length > 1 ? S.form.cw : t.sid; t.adds.push({ at: new Date(NOW), t: v, by: me(), who: who === 'all' ? null : who });
    talkAppendAux(t, v, who);
    log('追加谈话记录补充', SU(t.sid), { k: 'talkLog', noTl: 1, obj: '谈话记录' }); if (t.forced) notify(SU(t.sid).owner || SU(t.sid).assignee || 'c5', '站内', `${ST(me()).name} 追加了谈话记录补充：${nm(SU(t.sid))}`, t.sid);
    const hit = TALK_RE.test(v) ? (who === 'all' ? ids : [who || t.sid]) : [], ks = hit.map(id => riskAdd(t, v, id)).filter(Boolean); S.mo = ks[0] ? `tkCrisis:${ks[0].id}` : null; if (!ks.length) toast('已追加'); },
  tkCorrGo(tid) { const t = TALKS.find(x => x.id === tid), n = (S.form.note || '').trim(); if (!n) return toast('请写原因'); addXf('corr', SU(t.sid), { note: n, rec: tid }); t.corrAsk = 1; S.mo = null; toast('已提交，中心负责人批准后可以再改一次'); },
  tkContactGo(tid) { const t = TALKS.find(x => x.id === tid), n = (S.form.note || '').trim(); if (!n) return toast('请写下想说的话'); notify(t.by, '站内', `${ST(me()).name}（${tagOf(me())}）就你分享的一条谈话记录给你留言：${n}`, null); log(`联系分享人 ${ST(t.by).name}`, null, { cat: '流转', obj: '谈话记录' }); S.mo = null; toast(`已发给 ${ST(t.by).name}`); },
  shExt(a) { const [tid, i] = a.split('|'), t0 = TALKS.find(t => t.id === tid), x = t0.shares[+i]; if (!recOwner(t0)) return toast('只有写的人或接任者可以管理分享'); x.exp = new Date(Math.max(x.exp, NOW) + 30 * 864e5); log(`延长分享（${tkId(t0)} → ${ST(x.to).name}）30 天`, SU(t0.sid), { cat: '流转', obj: '谈话记录' }); toast('已延长 30 天'); },
  shOff(a) { const [tid, i] = a.split('|'), t0 = TALKS.find(t => t.id === tid), x = t0.shares[+i]; if (!recOwner(t0)) return toast('只有写的人或接任者可以管理分享'); x.off = new Date(NOW); log(`收回分享（${tkId(t0)} → ${ST(x.to).name}）`, SU(t0.sid), { cat: '流转', obj: '谈话记录' }); toast('已收回'); },
  shEditGo(a) { const [tid, i] = a.split('|'), t0 = TALKS.find(t => t.id === tid), x = t0.shares[+i]; if (!recOwner(t0)) return toast('只有写的人或接任者可以管理分享'); x.parts = S.form.parts.slice(); log(`修改分享范围（${tkId(t0)} → ${ST(x.to).name}）`, SU(t0.sid), { cat: '流转', obj: '谈话记录' }); S.mo = null; toast('已修改'); },
  tkDutyOk(kid) { const k = CRISES.find(x => x.id === kid), s = SU(k.sid), d = dutyNow(); k.st = 'handling'; k.recv = { by: d, at: new Date(NOW) }; NOTI.filter(n => n.ref === kid && n.to === d).forEach(n => n.st = '已确认');
    log(`值班 ${ST(d).name} 在手机上确认接收（短信链接）`, s, { cat: '危机', k: 'crisis', sys: 1 }); if (k.by) notify(k.by, '站内', `值班咨询师 ${ST(d).name} 已确认接收`, kid); S.form.dOpen = 1; toast('值班已确认接收'); },
  tkDutyOpen(kid) { const k = CRISES.find(x => x.id === kid); S.form.dOpen = 1; log(`值班 ${ST(dutyNow()).name} 在手机上查看触发危机的谈话记录`, SU(k.sid), { cat: '查看', obj: '谈话记录', noTl: 1 }); },
  tkUnfzGo(id) { const x = ITEMS.find(y => y.id === id), v = !x && INV.find(y => y.id === id), o = x || v, s = SU(o.sid), n = (S.form.note || '').trim(); if (o.unfzAsk) return toast('已经申请过了，等上级批准'); if (!n) return toast('请写一句为什么要恢复');
    if (RULES.unfzAppr) { addXf('unfz', s, { note: n, fz: id }); o.unfzAsk = 1; S.mo = null; return toast('已提交，上级批准后恢复'); }
    unfreeze(id, n); S.mo = null; toast('已恢复'); },
  fAll(a) { const i = a.indexOf('|'); S.form[a.slice(0, i)] = a.slice(i + 1).split(','); },
  fzSet(a) { const [id, d] = a.split('|'); S.form.fz = S.form.fz || {}; S.form.fz[id] = d; },
  tmAddGo() { const F = S.form; if (!(F.name || '').trim() || !F.col) return toast('请填写姓名和学院'); const id = 't' + (Object.keys(STAFF).filter(u => u[0] === 't').length + 1);
    ACCTS[id] = ['T']; SSO_ID[id] = 'teacher' + id.slice(1); STAFF[id] = { name: F.name.trim(), role: 'T', title: `任课老师（${F.col}${F.course ? ' · ' + F.course.trim() : ''}）`, cols: [F.col], on: true, by: me(), at: new Date(NOW) };
    notify(id, '邮件 + 短信', `你的灵屿账号已开通（任课老师），请用 NTU SSO 账号 ${SSO_ID[id]} 登录激活`, null); log(`添加任课老师账号：${F.name.trim()}（${F.col}）`, null, { cat: '配置', obj: '角色与权限' }); S.mo = null; toast(`已添加，SSO 账号 ${SSO_ID[id]}，已给本人发激活通知`); },
  tmToggle(u) { const x = STAFF[u]; x.on = !x.on; log(`${x.on ? '启用' : '停用'}任课老师账号：${x.name}`, null, { cat: '配置', obj: '角色与权限' }); toast(x.on ? '已启用' : `已停用；${myItems(u).length} 个在办事项进入「无人负责」`); },
  dispT(r) { RULES.dispatch[r] = !RULES.dispatch[r]; log(`角色与权限 · 能派活：${['L2', 'L3'].filter(x => RULES.dispatch[x]).join('、') || '无'}`, null, { cat: '配置', obj: '角色与权限' }); toast('已生效，已记入操作记录'); },
});
/* 发邀约前学生端：试用版里「演示：学生回复」也走同一个处理 */

/* ---------- 危机：冻结在途事项；结案时逐条恢复或取消 ---------- */
const _nc14 = newCrisis; newCrisis = function (s) { const k = _nc14.apply(this, arguments); if (!k) return k;
  ITEMS.filter(x => x.sid === s.id && ['open', 'paused', 'reported'].includes(x.st)).forEach(x => { x.prevSt = x.st; x.st = 'frozen'; x.frozenAt = new Date(NOW); });
  INV.filter(v => v.sid === s.id && ['wait', 'wait2', 'ok', 'change'].includes(v.st) && !v.outcome).forEach(v => { v.prevSt = v.st; v.st = 'frozen'; v.ver++; }); return k; };
const _close14 = ACT.closeOk; ACT.closeOk = function (id) { const k = CRISES.find(x => x.id === id), fz = frozenOf(k.sid), D = S.form.fz || {};
  if (fz.length && !fz.every(o => D[o.id])) return toast('请先把冻结的谈心逐条选「恢复」或「取消」');
  _close14(id); if (k.st !== 'closed') return;
  fz.forEach(o => { const d = D[o.id]; if (o.x) { if (d === '恢复') unfreeze(o.id, '危机结案'); else { o.x.st = 'closed'; o.x.closeWhy = '危机结案时取消'; } }
    else { if (d === '恢复') unfreeze(o.id, '危机结案'); else { o.v.st = 'cancel'; o.v.ver++; } const late = o.v.fzMiss && d === '恢复', to = STAFF[o.v.by] && STAFF[o.v.by].on !== false ? o.v.by : primaryOf(SU(k.sid));
      const t = { id: 'tl' + (TELL.length + 1), inv: o.v.id, by: to, dec: late ? '重新约' : d, st: 'open' }; TELL.push(t); notify(to, '站内', `中心决定${SU(k.sid).name}的谈心${late ? '重新约时间（原定时间已过）' : d === '恢复' ? '照常' : '这次先不见'}，请你告诉学生`, k.sid); } });
  XF.filter(x => x.type === 'unfz' && x.sid === k.sid && x.st === 'wait').forEach(x => { x.st = 'closed'; x.res = '危机已结案，申请作废'; });   // 结案的决定为准，旧的恢复申请作废
  const back = fz.filter(o => o.x && D[o.id] === '恢复'), byT = {}; back.forEach(o => { byT[o.x.to] = (byT[o.x.to] || 0) + 1; });
  Object.entries(byT).forEach(([u, n]) => notify(u, '站内', `${SU(k.sid).name} 的危机已结案，恢复了 ${n} 个谈心事项，回到你的「待谈心」`, k.sid));
  if (fz.length) log(`危机结案：冻结的谈心 ${fz.length} 项已逐条处理（${fz.map(o => D[o.id]).join('、')}）`, SU(k.sid), { cat: '危机', k: 'crisis' }); };

/* ---------- 时钟：邀约过期与提醒、暂停到期、每天派发 ---------- */
const _tick14 = tick; tick = function () { _tick14();
  INV.forEach(v => { if (['wait', 'wait2'].includes(v.st) && v.start <= NOW) { v.st = 'expired'; if (v.d === 'ok') { v.miss = true; lostCheck(SU(v.sid), v.by); } }
    if (['wait', 'wait2'].includes(v.st) && v.d === 'ok' && (v.start - NOW) / H < 24 && !v.rem) { v.rem = new Date(NOW); notify(v.by, '站内', `${SU(v.sid).name} 还没回复邀约，见面前请先联系学生`, v.sid); } });
  ITEMS.forEach(x => { if (x.st === 'paused' && x.pauseTo <= NOW) { reopen(x); delete SU(x.sid).tkPauseTo; } });
  XF.forEach(x => { if (x.st === 'wait' && hrs(x.at) >= 24 * 7 && !x.escd) { x.escd = 1; notify('c5', '站内', `转来的事 7 天没人接收：${XT[x.type]}`, x.sid); } });
  const d = NOW.toDateString(); if (S._itDay !== d) { S._itDay = d; itSync(); } };
STU.forEach(s => { s.l2take = s.l2take || false; });

/* ---------- 工作台、简报 ---------- */
const talkStu = (u = me()) => [...new Set(myItems(u).filter(x => itDue(x) && x.st === 'open').map(x => x.sid))].map(SU);
const _q14 = queues; queues = function (u = me(), r = S.role) { if (r === 'T') return [];
  const q = _q14(u, r).filter(x => !['ttask', 'talks'].includes(x.k)); q.forEach(x => { if (x.k === 'asks') x.items = x.items.filter(s => (s.asks || []).some(a => !a.done && a.what !== '请安排一次谈心')); });
  if (r !== 'L1s' && r !== 'ADM') q.push({ k: 'talk', n: '待谈心', items: talkStu(u) });
  if (r === 'L2' || r === 'L3') q.push({ k: 'xfer', n: '转来的', book: xfMine(u, r) });   // book：不按学生排序
  return q; };
const _qb14 = queueBody; queueBody = function (q) { if (q.k === 'xfer') return xfTable(q.book);
  if (q.k !== 'talk') return _qb14(q); if (!q.items.length) return `<div class="empty"><img src="${MASCOT}" alt="">没有要谈的学生</div>`;
  return `<table class="t"><tr><th>学生</th><th>关注等级</th><th>事项</th><th>最早到期</th><th></th></tr>${q.items.map(s => { const L = myItems().filter(x => x.sid === s.id && itDue(x)), f = L.reduce((a, b) => a.due < b.due ? a : b); return `<tr class="${L.some(itOver) ? 'crit' : ''}"><td><b>${nm(s)}</b><small>${s.college}</small></td><td>${lvT(s)}</td><td>${L.map(x => ISRC[x.src]).join('、')}</td><td>${itOver(f) ? `<span class="due r">已超期</span>` : fmt(f.due)}</td><td><button class="btn pri xs" data-act="tkGoS" data-arg="${s.id}">去谈心</button></td></tr>`; }).join('')}</table>`; };
const _bL1_14 = briefL1; briefL1 = function () { const b = _bL1_14(), L = talkStu(), ov = myItems().filter(itOver).length, tl = TELL.filter(t => t.by === me() && t.st === 'open');
  b.secs = b.secs.filter(x => !/^谈心(到期|任务)/.test(x.t));
  if (L.length) b.secs.splice(b.secs[0] && b.secs[0].red ? 1 : 0, 0, { t: `谈心（${L.length} 人待谈${ov ? `，${ov} 个已超期` : ''}）`, red: ov ? 1 : 0, all: 1, items: L.slice(0, 6).map(s => it(`${s.name} · ${myItems().filter(x => x.sid === s.id && itDue(x)).map(x => ISRC[x.src]).join('、')}`, 'tkGoS', s.id, '去谈心')) });
  if (tl.length) b.secs.unshift({ t: `中心的决定，需要你告诉学生（${tl.length}）`, red: 1, items: tl.map(t => it(`${SU(INV.find(v => v.id === t.inv).sid).name} · ${t.dec === '重新约' ? '重新约时间' : t.dec === '恢复' ? '照常见面' : '这次先不见'}`, 'tkGoS', INV.find(v => v.id === t.inv).sid, '去处理')) });
  return b; };
const xfBrief = f0 => function () { const b = f0(), L = xfMine(); b.secs = b.secs.filter(x => !/^谈心任务超期/.test(x.t));
  if (L.length) b.secs.splice(1, 0, { t: `转来的（${L.length}）`, all: 1, items: L.slice(0, 5).map(x => it(`${XT[x.type]} · ${nm(SU(x.sid))} · ${ST(x.from).name}`, 'xfQ', 'xfer', '去处理')) });
  const ov = S.role === 'L3' && canDispatch() ? ITEMS.filter(x => itOver(x) && (NOW - x.due) / 864e5 >= 7) : []; if (ov.length) b.secs.push({ t: `谈心事项超期 7 天以上（${ov.length}）`, items: ov.slice(0, 5).map(x => it(`${nm(SU(x.sid))} · ${SU(x.sid).college} · ${ST(x.to).name}`, 'mo', `tkRe:${x.id}`, '改派')) }); return b; };
briefL2 = xfBrief(briefL2); briefL3 = xfBrief(briefL3);

/* ---------- 旧入口改到谈心页 ---------- */
const _mo14 = ACT.mo; ACT.mo = function (a) { const [k, id] = a.split(':');
  if (k === 'talk') return ACT.tkNew(id); if (k === 'talkPick') return ACT.tkNew('');
  if (k === 'talkHist') { go('talk'); S.tabs.talk = 'recs'; S.f.tq = SU(id).name; return; }
  if (k === 'ttMove') { const x = ITEMS.find(y => y.sid === id && itOpen(y)); if (x) { if (!canDispatch()) return toast('你没有派活权限'); _mo14(`tkRe:${x.id}`); return; } }
  if (k === 'askDone') { const a2 = openAsk(SU(id)); if (a2 && a2.what === '请安排一次谈心') return ACT.tkNew(id); }
  return _mo14.apply(this, arguments); };
const _wp16 = workPage; workPage = function () { if ((S.tabs.work || 'stu') === 'talk' || !S.tabs.work) S.tabs.work = 'stu'; const h = _wp16();
  return h.replace(/<button class="[^"]*" data-act="wtab" data-arg="talk">[^<]*<\/button>/, '').replace('核实、随访、中心请求的协助都在「工作台」', '谈心在左侧「谈心」；核实、随访、中心请求的协助都在「工作台」'); };
PAGES.work = workPage;
/* 学生档案：谈话记录按新的可见规则；辅导员在标题旁看到等级 */
const _dw14 = drawer; drawer = function () { const s = SU(S.dw.sid), keep = s.tl; s.tl = s.tl.filter(e => !['talk', 'talkr'].includes(e.k) || recVis(TALKS.find(t => t.id === e.tid)));
  let h; try { h = _dw14(); } finally { s.tl = keep; }
  h = h.replace(/<div class="dbox" style="background:#fff"><b><svg class="ic s"><use href="#i-chat"\/><\/svg>辅导员谈心记录（\d+）<\/b>[\s\S]*?<\/table><\/div>/, '');
  const L = TALKS.filter(t => !t.draft && (t.sids || [t.sid]).includes(s.id) && recVis(t));
  if (L.length && S.role !== 'ADM') h = h.replace(/(<div class="db"><div class="tabs">[\s\S]*?<\/div>)/, `$1<div class="dbox" style="background:#fff"><b>${I('chat', 's')}谈话记录（${L.length}）</b><table class="t">${L.sort((a, b) => b.at - a.at).map(t => `<tr><td>${fmt(t.at)}</td><td>${ST(t.by).name}<small>${tagOf(t.by)}</small></td><td>${t.mode} · ${t.result}</td><td>${t.risk ? '<span class="pill r">含安全内容</span>' : t.center ? '<span class="pill w">希望中心介入</span>' : ''}</td><td><button class="btn ghost xs" data-act="tkView" data-arg="${t.id}">查看</button></td></tr>`).join('')}</table></div>`);
  if (S.role === 'L1' && !canLv()) h = h.replace(/(<h2>[^<]*)/, `$1 ${lvB(curLv(s))}`);
  return h; };
const _stuPg14 = PAGES.students; PAGES.students = function () { const h = _stuPg14(); if (S.role !== 'L1' || canLv()) return h;
  return h.replace('<tr><th>学生</th>', '<tr><th>关注等级</th><th>学生</th>').replace(/(<tr class="hov[^"]*" data-act="open" data-arg="([^"]+)">)/g, (m, a, id) => `${a}<td>${lvB(curLv(SU(id)))}</td>`); };
const _sh14 = shell; shell = function (b) { const h = _sh14(b); return isT() ? h.replace(/<label class="srch">[\s\S]*?<\/label>/, '') : h; };

/* ---------- 设置：谁能派活、任课老师、谈心频率文案、辅导员看等级 ---------- */
const tmemPage = () => { const ed = S.role === 'L3' || isAdm(), L = Object.keys(STAFF).filter(u => STAFF[u].role === 'T');
  return `<p class="intro">${I('info', 's')}任课老师由心理中心负责人、高级咨询师（L3 及以上）添加，系统管理员也可以。L3 在这里只能添加和停用任课老师，其他成员仍归系统管理员。添加和停用都记入操作记录。</p>
    <div class="card"><h3>任课老师（${L.length}）<span class="sp"></span>${ed ? `<button class="btn pri xs" data-act="mo" data-arg="tmAdd:">${I('plus', 's')}添加任课老师</button>` : ''}</h3><table class="t"><tr><th>姓名</th><th>说明</th><th>添加人</th><th>在办事项</th><th>状态</th><th></th></tr>${L.map(u => `<tr><td><b>${ST(u).name}</b><small>任课老师</small></td><td>${ST(u).title}</td><td>${STAFF[u].by ? ST(STAFF[u].by).name : '—'}<small>${STAFF[u].at ? fmt(STAFF[u].at).split(' ')[0] : ''}</small></td><td>${myItems(u).length}</td><td>${STAFF[u].on === false ? '<span class="pill">已停用</span>' : '<span class="pill g">在用</span>'}</td><td>${ed ? `<button class="btn ghost xs" data-act="tmToggle" data-arg="${u}">${STAFF[u].on === false ? '启用' : '停用'}</button>` : ''}</td></tr>`).join('')}</table>
    <p class="note">任课老师的权限相当于辅导员，标签是「任课老师」：收到谈心任务就能谈，只看得到派给自己的学生；别人分享的记录只读。停用后，在办事项进入「谈心任务总览 · 无人负责」。</p></div>`; };
const _st14 = settings; settings = function () { const can = isAdm() || S.role === 'L3';
  if (S.tabs.settings === 'tmem' && can) { S.tabs.settings = 'audit'; let h; try { h = _st14(); } finally { S.tabs.settings = 'tmem'; }
    h = h.replace('class="on" data-act="settab" data-arg="audit"', 'class="" data-act="settab" data-arg="audit"'); const t = h.indexOf('<div class="tabs">'), e = h.indexOf('</div>', t) + 6;
    return h.slice(0, e).replace('<button class="" data-act="settab" data-arg="audit">', '<button class="on" data-act="settab" data-arg="tmem">任课老师</button><button class="" data-act="settab" data-arg="audit">') + tmemPage() + '</div>'; }
  let h = _st14(); if (can) h = h.replace(/(<button class="[^"]*" data-act="settab" data-arg="audit">)/, '<button class="" data-act="settab" data-arg="tmem">任课老师</button>$1');
  const tab = S.tabs.settings;
  if (tab === 'perm' && isAdm()) h = h.replace(/<\/div>$/, `<div class="card" style="margin-top:14px"><h3>谁能派谈心任务<span class="sp"></span><small>默认只有 L3</small></h3>${['L2', 'L3'].map(r => `<div class="prow"><span>${RN[r]}</span><span class="sw ${RULES.dispatch[r] ? 'on' : ''}" data-act="dispT" data-arg="${r}"></span></div>`).join('')}<p class="note">能派活的人可以手动建任务、改派、撤回和暂停。接到任务的人都可以转给任何能谈心的老师。</p></div></div>`);
  h = h.replace(/<div class="prow"><span>学生的关注等级<\/span><span class="sw[^"]*"[^>]*><\/span><\/div>/, '<div class="prow"><span>学生的关注等级<small>10/19 定：全系统显示，不含信号格</small></span><span class="sw on lk"></span></div>');
  if (tab === 'talkf') h = h.replace('辅导员只看到频率和截止日，看不到等级。', '辅导员能看到等级和频率要求。').replace(/<tr><td style="width:180px">派给谁<\/td><td>[^<]*<\/td><\/tr>/, '<tr><td style="width:180px">派给谁</td><td>默认派给学生的主跟进人（学院跟进人）。能派活的人改派以后以改派为准，这个学生之后的自动任务也派给新的人</td></tr>')
    .replace(/<tr><td>什么算完成<\/td><td>[^<]*<\/td><\/tr>/, '<tr><td>什么算完成</td><td>按事项完成：保存记录时勾选本次完成了哪几个事项；只有和学生本人谈过才算</td></tr>').replace(/进行中的谈心任务 \d+ 个，其中超期 \d+ 个/, `进行中的谈心事项 ${ITEMS.filter(itOpen).length} 个，其中超期 ${ITEMS.filter(itOver).length} 个`);
  return h; };
PAGES.settings = settings;
CONSENT.l1 = '学院辅导员可以看到学生姓名、联系方式和关注等级，但看不到分数、报告和对话；经授权的学生心理委员只看到编号';
/* 设置改了要通知受影响的人 */
document.addEventListener('change', e => { if (e.target.dataset.tf && S.role === 'L3') ['u1', 'u2'].forEach(u => notify(u, '站内', '谈心频率已调整，之后新派的任务按新频率', null)); });
document.addEventListener('input', e => { const b = e.target.dataset.bind;
  if (b === 'intakeMode' && e.target.value === 'C') ['c1', 'c2', 'c3', 'c4', 'c5'].forEach(u => notify(u, '站内', '预咨询小屿已关闭；已存的草稿和已发的摘要不受影响', null));
  if (b === 'l1Scope') ['u1', 'u2'].forEach(u => notify(u, '站内', `你的管理范围已调整：${e.target.value}`, null)); });
const _l1Col14 = ACT.l1Col; ACT.l1Col = function (a) { _l1Col14(a); const [u, c] = a.split('|'); notify(u, '站内', `你的管理范围已调整：${RULES.l1Cols[u].join('、') || '无'}`, null); if (FOLLOWER_OF[c] && FOLLOWER_OF[c] !== u) notify(FOLLOWER_OF[c], '站内', `${c} 的管理范围有调整：${ST(u).name}`, null); };
/* 预咨询追加 → 列表显示「有新追加」，接待老师查看后消失 */
const _itag14 = intakeTag; intakeTag = function (b) { const h = _itag14(b), x = ikOf(b); return x && x.newAdd && !isL1() ? h + ' <span class="pill w">有新追加</span>' : h; };
const _mv14 = markViewed; markViewed = b => { _mv14(b); const x = ikOf(b); if (x && me() === b.cid) x.newAdd = false; };

/* ---------- 记录页输入 ---------- */
document.addEventListener('input', e => { const d = e.target.dataset, R = S.rec; if (!R) return;
  if (d.rb != null) { R[d.rb] = e.target.value; if (!['pick', 'spick'].includes(d.rb)) R.dirty = true;
    if (d.rr != null) { clearTimeout(window._rq); window._rq = setTimeout(() => { render(); const i = document.querySelector(`[data-rb="${d.rb}"]`); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); } }
  if (d.rpp) { const p = R.pp[d.rpp] = R.pp[d.rpp] || {}; p.txt = e.target.value; R.dirty = true; } });
document.addEventListener('change', e => { const d = e.target.dataset; if (d.rsd != null && S.rec) { S.rec.shares[+d.rsd].days = +e.target.value; S.rec.dirty = true; } });
ACT.tkExpGo = function () { const per = { '近 30 天': 30, 本学期: 120, 全部: 9999 }[S.form.per || '近 30 天'], L = TALKS.filter(t => t.by === me() && !t.draft && (NOW - t.at) / 864e5 <= per), q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = L.flatMap(t => (t.sids || [t.sid]).map(id => { const s = SU(id); return [fmt(t.at), s.name, s.sid, s.college, t.mode, t.place, t.result, ((t.sids || []).length > 1 ? `[共同部分] ${t.situ} [个人部分] ${((t.pp || {})[id] || {}).txt || ''}` : t.situ), (t.types || []).join('/'), t.need, t.next, t.center ? '是' : '否'].map(q).join(','); }));
  const csv = '﻿' + `"导出人：${ST(me()).name} · ${fmt(NOW)} · 仅供工作使用，请勿外传"\n` + ['时间', '学生姓名', '学号', '学院', '方式', '地点', '结果', '学生的情况', '情况类型', '学生表达的需要', '下次谈心', '希望中心介入'].join(',') + '\n' + rows.join('\n');
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `谈话记录-${ST(me()).name}.csv`; a.click(); } catch (e) {}
  log(`导出谈话记录 ${rows.length} 行（我写的，${S.form.per || '近 30 天'}）`, null, { cat: '导出', obj: '谈话记录' }); S.mo = null; toast(`已导出 ${rows.length} 行，带水印，已记入操作记录`); };

/* ---------- 试用版联动：邀约发到学生端；学生的回复回到机构端 ---------- */
if (typeof LY_in === 'function') {
  const _lySnap14 = LY_snap; LY_snap = function () { const o = _lySnap14(), m = {};
    Object.entries(LY_CORE()).forEach(([k, s]) => { m[k] = INV.filter(v => v.sid === s.id).map(v => ({ id: v.id, st: v.st, ver: v.ver, start: v.start.toISOString(), end: v.end.toISOString(), mode: v.mode, place: v.place, link: v.link || '', who: fullOf(v.by), tag: tagOf(v.by), sms: (v.ch || []).includes('短信') })); });
    o.__inv = m; return o; };
  const _lyIn14 = LY_in; LY_in = function (ev) { if (ev.t !== 'invReply') return _lyIn14(ev); const v = INV.find(x => x.id === ev.id); if (!v || !['wait', 'wait2', 'change'].includes(v.st)) return ''; if (ev.ver != null && ev.ver !== v.ver) return '学生回复的是旧时间，已忽略，等学生确认新时间';
    stuReply(v, ev.r, ev.slots, ev.why); if (S.uid) render(); return `${SU(v.sid).name} 回复邀约：${ev.r}`; };
}
ACT.xfQ = k => { ACT.hview('work'); S.tabs.home = k; };
itSync(true); S._itDay = NOW.toDateString();
