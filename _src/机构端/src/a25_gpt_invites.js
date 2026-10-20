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
  return { inv, norm: slots.length - inv, hold, can: Math.max(0, inv - hold), slots, invite: [...slots.filter(s => held.has(s.key)), ...slots.filter(s => map[s.key] === 'inv' && !held.has(s.key)).slice(0, Math.max(0, inv - held.size - hold))] };
}
function ivCompatible(x,slot) { const cid=x.allowedCid || SU(x.sid).owner; return (!cid || slot.cid===cid) && (!x.allowedMode || slot.modes.includes(x.allowedMode)) && (!x.allowedPlace || slot.place===x.allowedPlace); }
function ivFits(x, slot, until) {
  return ivCompatible(x,slot) && new Date(`${slot.date}T${slot.time}:00`) >= new Date(until || x.entryUntil || +NOW + 48*H).getTime() + 24*H;
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
  const existing = ivMatch(entries,P.invite); if (existing) entries.forEach(x=>{ x.holdKey=existing[x.id]; });
  const sorted = B.list.filter(x => x.st === 'queue' && !x.demoQueue).sort((a,b) => (b.lv >= 4) - (a.lv >= 4) || (b.priorityReturn || 0) - (a.priorityReturn || 0) || new Date(SU(a.sid).done || a.readyAt || NOW) - new Date(SU(b.sid).done || b.readyAt || NOW));
  for (const x of sorted) { const trial = Object.assign({},x,{entryUntil:new Date(+NOW+48*H).toISOString()});
    const matched = ivMatch([...entries,trial],P.invite); if (!matched) break;
    Object.assign(x,{st:'entry',entryUntil:trial.entryUntil,edue:ivDue(2)}); entries.push(x); ivBump(x);
    entries.forEach(e => { e.holdKey = matched[e.id]; });
  }
}
function ivSlotAllowed(sid,cid,date,time,excludeBid,sharedPool) {
  const P = sharedPool || ivPool(), key = `${cid}|${date}|${time}`, own = ivEntries().find(x => x.sid === sid), b = excludeBid && BOOK.find(b => b.id === excludeBid), existing = b && b.cid === cid && slotISO(DD(b.day)) === date && TIMES[b.t] === time;
  if (existing) return true;
  const slot = P.slots.find(s => s.key === key); if (!slot) return false;
  if (own || b && b.ivId) { const x = own || ivIdentity().list.find(x => x.id === b.ivId); if (!x || RULES.slotPool[key] !== 'inv' || !ivCompatible(x,slot)) return false; }
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
  if (action==='confirm' || action==='accept' || action==='moveAccept') { x.st='ok'; delete x.holdKey; }
  else if (action==='submit' || action==='move') { x.st='sub'; delete x.holdKey; }
  else if (action==='decline' || action==='cancel') {
    x.st='entry'; x.note=b.declineNote || ''; x.entryUntil=new Date(+NOW+48*H).toISOString(); x.edue=ivStamp(x.entryUntil);
    delete x.entryReminded; delete x.lateType;
    if (x.returnHoldKey) x.holdKey=x.returnHoldKey;
    // 自愿取消释放了原时段；没有可保护的替代时段时回到队列。
    if (action==='cancel' && !ivMatch(ivEntries(),ivPool().invite)) { x.st='queue';x.priorityReturn=1;delete x.holdKey; }
  }
  else if (action==='adjust') { x.st='adjust'; x.note='老师临时停诊，中心会重新安排'; delete x.holdKey; }
  ivBump(x); ivAllocate();
}
/* R6/R12：按时提交即履行提交期限；老师婉拒后重新给完整的选时窗口。 */
const _ivDeclineGpt=ACT.bNoOk; ACT.bNoOk=function(id) {
  const b=BOOK.find(v=>v.id===id), x=b && ivIdentity().list.find(v=>v.id===b.ivId || v.bid===b.id);
  if (x && mayBook(b) && ['confirm','move'].includes(b.st) && S.form.why) {
    const trial={...x,st:'entry',entryUntil:new Date(+NOW+48*H).toISOString()}, P=ivPool();
    const released=schedSlots().find(s=>s.key===`${b.cid}|${slotISO(DD(b.day))}|${TIMES[b.t]}`);
    const slots=P.invite.slice(); if (released && !slots.some(s=>s.key===released.key)) slots.push(released);
    const plan=ivMatch([...ivEntries().filter(v=>v.id!==x.id),trial],slots);
    if (!plan) return toast('目前没有可供学生重新选择的时间。请先补充排班，或与学生商量后提出新时间。');
    x.returnHoldKey=plan[x.id];
  }
  try { return _ivDeclineGpt.apply(this,arguments); } finally { if(x) delete x.returnHoldKey; }
};
function ivAllowedPublic() { const out={}, P=ivPool(); Object.entries(LY_CORE()).forEach(([k,s]) => { out[k]=P.slots.filter(x=>ivSlotAllowed(s.id,x.cid,x.date,x.time,(lyBook(s)||{}).id,P)).map(x=>x.key); }); return out; }

function ivPublic() {
  const B = ivIdentity(), out = {};
  Object.entries(LY_CORE()).forEach(([core, s]) => {
    const x = B.list.find(x => x.sid === s.id && x.st !== 'new');
    if (x) { const b=BOOK.find(b=>b.id===x.bid),it=b && b.intake;if(it && ['sent','skipped'].includes(it.st)){const sig=JSON.stringify(it);if(sig!==x.ikSig){x.ik=it;x.ikSig=sig;ivBump(x);}} }
    if (!x) { out[core] = null; return; }
    const st = ({ sent: 'wait', ik: 'acc' })[x.st] || x.st;
    out[core] = { id: x.id, sv: x.sv, ack: x.replyRv || 0, st, due: x.due, replyUntil: x.replyUntil, edue: x.edue, entryUntil: x.entryUntil,
      allowedMode:x.allowedMode, allowedPlace:x.allowedPlace, fit: (x.fit || []).slice(), viewed: !!(x.ik && x.ik.viewed), note: x.note || '', lateType:x.lateType, reminder:x.reminder || 0,
      ik: x.ik && ['sent', 'skipped'].includes(x.ik.st) ? JSON.parse(JSON.stringify(x.ik)) : null };
  });
  return out;
}
const _ivSnapGpt = LY_snap; LY_snap = function () { const o = _ivSnapGpt(); o.__ivc = ivPublic(); o.__allowed = ivAllowedPublic(); return o; };
const _ivInGpt = LY_in; LY_in = function (ev) {
  ivTick();
  if (ev.t !== 'ivcReply') {
    if (ev.t==='book' && ev.inv) { const s=LY_CORE()[ev.core],x=s && ivIdentity().list.find(x=>x.sid===s.id && x.id===ev.ivId); const current=s && lyBook(s), linked=current && current.ivId===ev.ivId && ['sub','ok'].includes(x && x.st); if (!x || !linked && (x.st!=='entry' || NOW>=new Date(x.entryUntil)) || x.allowedMode && ev.mode!==x.allowedMode) { RULES.bookReject=RULES.bookReject||{};RULES.bookReject[ev.core]={token:`${Date.now()}-${Math.random()}`,cid:ev.cid,date:ev.date,ti:ev.ti,reason:'这个入口已失效或所选方式不适用，请返回查看最新安排。'};render();return '主动邀约申请未提交，请查看最新安排'; } }
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
  if (!state || ['ok', 'late', 'adjust'].includes(x.st) || state==='sub' && !(lyBook(s) && lyBook(s).ivId===x.id)) { x.replyRv=v.rv;ivBump(x);render();return ''; }
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
  render(); return '主动邀约状态已同步';
};
const _ivSendGpt = ACT.ivSendGo; ACT.ivSendGo = function () { const before = new Set(ivb().list.filter(x => x.st === 'new').map(x => x.sid)); _ivSendGpt.apply(this, arguments);
  ivIdentity().list.filter(x => before.has(x.sid) && x.st === 'sent').forEach(x => { x.replyUntil = new Date(+new Date(x.at) + 48 * H).toISOString(); x.due=ivStamp(x.replyUntil); ivBump(x); }); };
Object.assign(ACT, {
  ivReentry(id) { const x = ivIdentity().list.find(x => x.id === id); if (!x || !['nofit', 'late', 'adjust'].includes(x.st) || !(S.role === 'L3' || S.role === 'L2' && x.resp === me())) return;
    x.st = x.ik && ['sent', 'skipped'].includes(x.ik.st) ? 'queue' : 'sent'; x.fit = []; x.note = ''; x.demoQueue = false; x.priorityReturn=1;delete x.entryUntil;delete x.edue;
    if (x.st === 'sent') { x.replyUntil = new Date(+NOW + 48 * H).toISOString(); x.due = ivDue(2); }
    ivBump(x); ivAllocate(); log('主动邀约 · 老师确认重新提供入口／邀约', SU(x.sid), { cat: '预约', obj: '主动邀约' }); toast(x.st === 'queue' ? '已重新排队，开放时间后通知学生' : '已通知学生'); }
});

/* R12/Q07：保存完整截止时间，卡片、入口和接收端共用同一时钟。 */
function ivStamp(value) { const d=new Date(value); return `${d.getMonth()+1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function ivLegacyUntil(text,fallback) { const m=String(text||'').match(/(\d+)\/(\d+)\s+(\d+):(\d+)/); return m ? new Date(NOW.getFullYear(),+m[1]-1,+m[2],+m[3],+m[4]).toISOString() : new Date(fallback).toISOString(); }
function ivTick() {
  ivIdentity().list.forEach(x=>{
    if (x.st==='sent') { x.replyUntil=x.replyUntil || ivLegacyUntil(x.due,+(x.at ? new Date(x.at):NOW)+48*H);x.due=ivStamp(x.replyUntil); }
    if (x.st==='entry') { x.entryUntil=x.entryUntil || ivLegacyUntil(x.edue,+NOW+48*H);x.edue=ivStamp(x.entryUntil); }
    const until=x.st==='sent'?x.replyUntil:x.st==='entry'?x.entryUntil:null;
    if (until && +NOW>=+new Date(until)) { x.lateType=x.st==='sent'?'reply':'entry';x.st='late';delete x.holdKey;ivBump(x);
      log(`主动邀约 · ${x.lateType==='reply'?'邀约卡':'选时间入口'}已到期，交负责老师跟进`,SU(x.sid),{cat:'预约',obj:'主动邀约',sys:1}); notify(x.resp,'站内',`${nm(SU(x.sid))} 的${x.lateType==='reply'?'邀约卡':'选时间入口'}已到期，请决定后续安排`,x.sid); }
    else if (until && +new Date(until)-NOW<=24*H && !x[`${x.st}Reminded`]) { x[`${x.st}Reminded`]=true;x.reminder=(x.reminder||0)+1;ivBump(x); }
    if (x.st==='ik' && x.acceptedAt && NOW-new Date(x.acceptedAt)>=48*H && !x.ikReminded) { x.ikReminded=true;notify(x.resp,'站内',`${nm(SU(x.sid))} 接受邀约后尚未完成预咨询，请跟进`,x.sid); }
  });
  ivAllocate();
}
const _ivTickGpt=tick;tick=function(){const r=_ivTickGpt.apply(this,arguments);ivTick();return r;};
const _ivRenderGpt=render;render=function(){ivTick();return _ivRenderGpt.apply(this,arguments);};
