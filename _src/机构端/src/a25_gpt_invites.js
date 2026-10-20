/* R2/Q05：主动邀约使用稳定 ID 和双方修订号；跨端仅传已发送摘要。 */
function ivIdentity() {
  const B = ivb(); B.id = B.id || 'iv-2026-fall-1';
  B.list.forEach(x => { x.id = x.id || `${B.id}-${x.sid}`; x.sv = x.sv || 1; });
  return B;
}
function ivBump(x) { x.sv = (x.sv || 1) + 1; }
function ivAllocate() {
  const B = ivIdentity(), P = poolN();
  let left = Math.max(0, P.can - B.list.filter(x => ['entry', 'sub'].includes(x.st)).length);
  B.list.filter(x => x.st === 'queue' && !x.demoQueue).sort((a, b) => (b.lv >= 4) - (a.lv >= 4) || new Date(SU(a.sid).done || a.readyAt || NOW) - new Date(SU(b.sid).done || b.readyAt || NOW)).forEach(x => {
    if (!left) return; x.st = 'entry'; x.entryUntil = new Date(+NOW + 48 * H).toISOString(); x.edue = ivDue(2); ivBump(x); left--;
  });
}
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
const _ivSnapGpt = LY_snap; LY_snap = function () { const o = _ivSnapGpt(); o.__ivc = ivPublic(); return o; };
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
