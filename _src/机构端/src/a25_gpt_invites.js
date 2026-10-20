/* R2/Q05：主动邀约使用稳定 ID 和双方修订号；跨端仅传已发送摘要。 */
function ivIdentity() {
  const B = ivb(); B.id = B.id || 'iv-2026-fall-1';
  B.list.forEach(x => { x.id = x.id || `${B.id}-${x.sid}`; x.sv = x.sv || 1; });
  return B;
}
function ivBump(x) { x.sv = (x.sv || 1) + 1; }
/* R7：以实际日期时段算容量，并用一对一匹配持续保护每个人工入口。 */
function ivRawSlots() { return schedSlots().filter(s => { const t = new Date(`${s.date}T${s.time}:00`); return s.st === 'open' && t - NOW >= 24 * H && t - NOW <= 30 * 24 * H; }); }
function ivEntries() { return ivIdentity().list.filter(x => x.st === 'entry'); }
function ivPool() {
  const P = RULES.pool, slots = ivRawSlots(), entries = ivEntries(), held = new Set(entries.map(x => x.holdKey).filter(Boolean));
  const map = RULES.slotPool = RULES.slotPool || {}, free = slots.filter(s => !held.has(s.key));
  const changed = RULES.slotRatio !== P.inv; RULES.slotRatio = P.inv;
  if (changed || free.some(s => !map[s.key])) {
    const n = Math.round(free.length * P.inv / 100);
    free.sort((a,b) => a.key.localeCompare(b.key)).forEach((s,i) => { map[s.key] = Math.floor((i+1)*n/free.length) > Math.floor(i*n/free.length) ? 'inv' : 'norm'; });
  }
  held.forEach(k => { map[k] = 'inv'; });
  // 三天内的闲置邀约号不可能用于新的48小时入口保护，可转普通号。
  slots.forEach(s => { if (new Date(`${s.date}T${s.time}:00`) - NOW < 72 * H && !held.has(s.key)) map[s.key] = 'norm'; });
  const inv = slots.filter(s => map[s.key] === 'inv').length, hold = Math.min(P.hold, Math.max(0, inv - held.size));
  P.R = Math.max(0, slots.length - held.size); P.FIX = held.size + schedSlots().filter(s => s.st === 'bk' && new Date(`${s.date}T${s.time}:00`) >= NOW && new Date(`${s.date}T${s.time}:00`) - NOW <= 30*24*H).length;
  return { inv, norm: slots.length - inv, hold, can: Math.max(0, inv - hold), slots, invite: slots.filter(s => map[s.key] === 'inv').slice(0, inv - hold) };
}
function ivFits(x, slot, until) {
  const s = SU(x.sid), cid = x.allowedCid || s.owner;
  return (!cid || slot.cid === cid) && (!x.allowedMode || slot.modes.includes(x.allowedMode)) && (!x.allowedPlace || slot.place === x.allowedPlace) && new Date(`${slot.date}T${slot.time}:00`) >= new Date(until || x.entryUntil || +NOW + 48*H).getTime() + 24*H;
}
function ivMatch(entries, slots) {
  const bySlot = new Map(), chosen = {};
  function add(x, seen) { const list = slots.filter(s => ivFits(x,s)).sort((a,b) => (b.key === x.holdKey) - (a.key === x.holdKey));
    for (const s of list) { if (seen.has(s.key)) continue; seen.add(s.key); const prev = bySlot.get(s.key); if (!prev || add(prev,seen)) { bySlot.set(s.key,x); chosen[x.id] = s.key; return true; } } return false; }
  return entries.every(x => add(x,new Set())) ? chosen : null;
}
function ivAllocate() {
  const B = ivIdentity(), P = ivPool(), entries = ivEntries();
  entries.forEach(x => { if (!x.entryUntil) x.entryUntil = new Date(+NOW+48*H).toISOString(); });
  const sorted = B.list.filter(x => x.st === 'queue' && !x.demoQueue).sort((a,b) => (b.lv >= 4) - (a.lv >= 4) || (b.priorityReturn || 0) - (a.priorityReturn || 0) || new Date(SU(a.sid).done || a.readyAt || NOW) - new Date(SU(b.sid).done || b.readyAt || NOW));
  for (const x of sorted) { const trial = Object.assign({},x,{entryUntil:new Date(+NOW+48*H).toISOString()});
    const matched = ivMatch([...entries,trial],P.invite); if (!matched) break;
    Object.assign(x,{st:'entry',entryUntil:trial.entryUntil,edue:ivDue(2)}); entries.push(x); ivBump(x);
    entries.forEach(e => { e.holdKey = matched[e.id]; });
  }
}
function ivSlotAllowed(sid,cid,date,time,excludeBid) {
  const P = ivPool(), key = `${cid}|${date}|${time}`, own = ivEntries().find(x => x.sid === sid), b = excludeBid && BOOK.find(b => b.id === excludeBid), existing = b && b.cid === cid && slotISO(DD(b.day)) === date && TIMES[b.t] === time;
  if (existing) return true;
  const slot = P.slots.find(s => s.key === key); if (!slot) return false;
  if (own || b && b.ivId) { const x = own || ivIdentity().list.find(x => x.id === b.ivId); if (!x || RULES.slotPool[key] !== 'inv' || (SU(x.sid).owner && SU(x.sid).owner !== cid)) return false; }
  else if (sid && RULES.slotPool[key] !== 'norm') return false;
  return !!ivMatch(ivEntries().filter(x => x.sid !== sid),P.invite.filter(s => s.key !== key));
}
function ivCanCloseSlots(keys) { return !!ivMatch(ivEntries(),ivPool().invite.filter(s => !keys.includes(s.key))); }
function ivScheduleChanged(change) {
  const P = ivPool(), held = [];
  ivEntries().sort((a,b) => (b.lv>=4)-(a.lv>=4)).forEach(x => {
    const matched = ivMatch([...held,x],P.invite);
    if (matched) { held.push(x); held.forEach(e => { e.holdKey=matched[e.id]; }); return; }
    x.st='adjust'; x.note=change.reason || '老师临时停诊，中心会重新安排'; delete x.holdKey; ivBump(x);
    notify(x.resp,'站内',`${nm(SU(x.sid))} 的预约入口因中心调整待重新安排`,x.sid);
    log('主动邀约 · 停诊影响入口，交中心重新安排',SU(x.sid),{cat:'预约',obj:'主动邀约'});
  }); ivAllocate();
}
function ivBookChanged(b,action) {
  const x = ivIdentity().list.find(x => x.id === b.ivId || x.bid === b.id); if (!x) { if (['cancel','decline','confirm'].includes(action)) ivAllocate(); return; }
  x.bid=b.id;
  if (action==='confirm' || action==='accept') { x.st='ok'; delete x.holdKey; }
  else if (action==='submit' || action==='move') { x.st='sub'; delete x.holdKey; }
  else if (action==='decline' || action==='cancel') { x.st='entry'; x.note=b.declineNote || ''; }
  else if (action==='adjust') { x.st='adjust'; x.note='老师临时停诊，中心会重新安排'; delete x.holdKey; }
  ivBump(x); ivAllocate();
}
function ivAllowedPublic() { const out={}; Object.entries(LY_CORE()).forEach(([k,s]) => { out[k]=ivPool().slots.filter(x=>ivSlotAllowed(s.id,x.cid,x.date,x.time)).map(x=>x.key); }); return out; }

function ivPublic() {
  const B = ivIdentity(), out = {};
  Object.entries(LY_CORE()).forEach(([core, s]) => {
    const x = B.list.find(x => x.sid === s.id && x.st !== 'new');
    if (!x) { out[core] = null; return; }
    const st = ({ sent: 'wait', ik: 'acc' })[x.st] || x.st;
    out[core] = { id: x.id, sv: x.sv, ack: x.replyRv || 0, st, due: x.due, replyUntil: x.replyUntil, edue: x.edue, entryUntil: x.entryUntil,
      fit: (x.fit || []).slice(), viewed: !!(x.ik && x.ik.viewed), note: x.note || '',
      ik: x.ik && ['sent', 'skipped'].includes(x.ik.st) ? JSON.parse(JSON.stringify(x.ik)) : null };
  });
  return out;
}
const _ivSnapGpt = LY_snap; LY_snap = function () { const o = _ivSnapGpt(); o.__ivc = ivPublic(); o.__allowed = ivAllowedPublic(); return o; };
const _ivInGpt = LY_in; LY_in = function (ev) {
  if (ev.t !== 'ivcReply') {
    const r = _ivInGpt(ev);
    if (ev.t === 'book' && ev.ivId) { const s = LY_CORE()[ev.core], b = s && lyBook(s), x = ivIdentity().list.find(x => x.id === ev.ivId && x.sid === s.id);
      if (b && x && b.cid === ev.cid && b.day === lyDay(ev.date) && b.t === ev.ti) { b.ivId = x.id; b.src = '主动邀约'; x.bid = b.id; x.st = 'sub'; ivBump(x); if (S.uid) render(); } }
    return r;
  }
  const s = LY_CORE()[ev.core], v = ev.ivc; if (!s || !v || !v.id || !(v.rv > 0)) return '';
  const B = ivIdentity(); let x = B.list.find(x => x.id === v.id && x.sid === s.id);
  if (!x && v.demo && v.id.startsWith('demo-')) { x = B.list.find(x => x.sid === s.id); if (x && ['sub', 'ok'].includes(x.st)) return '';
    if (!x) { x = { sid: s.id, lv: curLv(s), resp: ivResp(s) }; B.list.push(x); }
    Object.assign(x, { id: v.id, st: 'sent', at: new Date(NOW), due: v.due, replyUntil: v.replyUntil, replyRv: 0, sv: 1, demo: true }); }
  if (!x || v.rv <= (x.replyRv || 0)) return '';
  const state = ({ wait: 'sent', acc: 'ik', queue: 'queue', entry: 'queue', no: 'no', nofit: 'nofit', sub: 'sub' })[v.st];
  if (!state || ['ok', 'late', 'adjust'].includes(x.st)) return '';
  x.replyRv = v.rv;
  if (!['sub', 'entry'].includes(x.st) || ['no', 'nofit', 'sub'].includes(state)) x.st = state;
  if (['ik', 'queue', 'entry', 'sub', 'nofit'].includes(x.st)) x.acceptedAt = x.acceptedAt || new Date(NOW);
  if (v.ik && ['sent', 'skipped'].includes(v.ik.st)) x.ik = JSON.parse(JSON.stringify(v.ik));
  if (v.fit) x.fit = v.fit.slice(0, 3).map(String);
  if (x.st === 'queue') { x.readyAt = x.readyAt || new Date(NOW); x.demoQueue = !!(v.demo && v.demoQueue); }
  if (v.demo && v.turn) x.demoQueue = false;
  ivBump(x); ivAllocate();
  log(`主动邀约 · 学生回复：${(IV_ST[x.st] || [x.st])[0]}`, s, { cat: '预约', obj: '主动邀约', sys: 1 });
  if (['no', 'nofit'].includes(x.st)) notify(x.resp, '站内', `${nm(s)}：${x.st === 'no' ? '这次不参加，请继续跟进' : '时间都不合适，请查看方便时间'}`, s.id);
  if (S.uid) render(); return '主动邀约状态已同步';
};
const _ivSendGpt = ACT.ivSendGo; ACT.ivSendGo = function () { const before = new Set(ivb().list.filter(x => x.st === 'new').map(x => x.sid)); _ivSendGpt.apply(this, arguments);
  ivIdentity().list.filter(x => before.has(x.sid) && x.st === 'sent').forEach(x => { x.replyUntil = new Date(+NOW + 48 * H).toISOString(); ivBump(x); }); };
Object.assign(ACT, {
  ivReentry(id) { const x = ivIdentity().list.find(x => x.id === id); if (!x || !['nofit', 'late', 'adjust'].includes(x.st) || !(S.role === 'L3' || x.resp === me())) return;
    x.st = x.ik && ['sent', 'skipped'].includes(x.ik.st) ? 'queue' : 'sent'; x.fit = []; x.note = ''; x.demoQueue = false;
    if (x.st === 'sent') { x.replyUntil = new Date(+NOW + 48 * H).toISOString(); x.due = ivDue(2); }
    ivBump(x); ivAllocate(); log('主动邀约 · 老师确认重新提供入口／邀约', SU(x.sid), { cat: '预约', obj: '主动邀约' }); toast(x.st === 'queue' ? '已重新排队，开放时间后通知学生' : '已通知学生'); }
});
