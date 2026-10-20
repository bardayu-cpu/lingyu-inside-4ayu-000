/* R2/Q05：只同步邀约状态和明确发送的摘要；草稿留在本机。 */
function ivTouch() { if (S.ivc) S.ivc.rv = (S.ivc.rv || 0) + 1; }
function ivSnapshot() { const v = S.ivc; if (!v) return null; return { id: v.id, rv: v.rv || 0, demo: !!v.demo, demoQueue: !!S.ivQ, turn: !!v.turn,
  st: v.st, due: v.due, replyUntil: v.replyUntil, fit: (v.fit || []).slice(),
  ik: v.ik && ['sent', 'skipped'].includes(v.ik.st) ? JSON.parse(JSON.stringify(v.ik)) : null }; }
function ivReceive(v) {
  if (!v) return;
  const old = S.ivc;
  if (old && old.id === v.id && ((v.ack || 0) < (old.rv || 0) || (v.sv || 0) <= (old.sv || 0))) return;
  const ik = old && old.id === v.id && old.ik && old.ik.st === 'draft' ? old.ik : v.ik;
  S.ivc = Object.assign({}, v, { ik, rv: v.ack || 0 });
  if (!old || old.id !== v.id) addMsg('chat', ['心理中心邀请你聊一聊', 'UCC invites you to talk'], [`请在 ${v.due} 前回复。`, `Please reply by ${v.due}.`], 'ivc');
  if (v.st === 'entry' && (!old || old.id !== v.id || old.st !== 'entry')) { addMsg('cal', ['可以选和老师见面的时间了', 'You can now pick a time to meet'], [`请在 ${v.edue} 前提交申请。`, `Please apply by ${v.edue}.`], 'book'); if (!S.bk && S.page !== 'intake') { S.page = 'book'; S.bookTab = 'time'; S.modal = null; } }
  if (v.viewed && S.ivc.ik) S.ivc.ik.viewed = true;
}
const _ivDemoGpt = ACT.zIvc; ACT.zIvc = function () { _ivDemoGpt.apply(this, arguments); Object.assign(S.ivc, { id: `demo-${S.scen}-${Date.now()}`, demo: true, replyUntil: new Date(+NOW + 48 * 3600e3).toISOString() }); ivTouch(); };
['ivAcc', 'ivNoOk', 'ivFitOk', 'zIvTurn'].forEach(k => { const f = ACT[k]; ACT[k] = function () { const old = S.ivc && S.ivc.st; const r = f.apply(this, arguments); if (S.ivc && S.ivc.st !== old) { if (k === 'zIvTurn') S.ivc.turn = true; ivTouch(); } return r; }; });
const _ivFinishGpt = ikFinish; ikFinish = function (st) { const inv = S.ik && S.ik.inv; const r = _ivFinishGpt.apply(this, arguments); if (inv) ivTouch(); return r; };
const _ivSubmitGpt = ACT.bookSubmit; ACT.bookSubmit = function () { const v = S.ivc, old = S.bk; const r = _ivSubmitGpt.apply(this, arguments); if (!old && S.bk && S.bk.inv && v) { S.bk.ivId = v.id; ivTouch(); } return r; };
