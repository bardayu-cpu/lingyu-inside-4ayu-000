/* R2/Q05：只同步邀约状态和明确发送的摘要；草稿留在本机。 */
function ivTouch() { if (S.ivc) S.ivc.rv = (S.ivc.rv || 0) + 1; }
function ivSnapshot() { const v = S.ivc; if (!v) return null; return { id: v.id, rv: v.rv || 0, demo: !!v.demo, demoQueue: !!S.ivQ, turn: !!v.turn,
  st: v.st, due: v.due, replyUntil: v.replyUntil, fit: (v.fit || []).slice(),
  ik: v.ik && ['sent', 'skipped'].includes(v.ik.st) ? JSON.parse(JSON.stringify(v.ik)) : null }; }
function ivReceive(v) {
  if (!v) { if (S.ivc && S.ivc.sv) { S.ivc=null; if (S.modal==='ivc') S.modal=null; } return; }
  const old = S.ivc;
  if (old && old.id === v.id && ((v.ack || 0) < (old.rv || 0) || (v.sv || 0) <= (old.sv || 0))) return;
  const ik = old && old.id === v.id && old.ik && old.ik.st === 'draft' ? old.ik : v.ik;
  if (v.reminder && (!old || v.reminder>(old.reminder||0))) addMsg('clock',['心理中心的提醒','UCC reminder'],[v.st==='entry'?`选时间入口将在 ${v.edue} 关闭，请及时提交申请。`:`请在 ${v.due} 前回复心理中心的邀约。`,'Please check your invitation.'],'ivc');
  S.ivc = Object.assign({}, v, { ik, rv: v.ack || 0 });
  if (!old || old.id !== v.id) addMsg('chat', ['心理中心邀请你聊一聊', 'UCC invites you to talk'], [`请在 ${v.due} 前回复。`, `Please reply by ${v.due}.`], 'ivc');
  if (v.st === 'entry' && (!old || old.id !== v.id || old.st !== 'entry')) { addMsg('cal', ['可以选和老师见面的时间了', 'You can now pick a time to meet'], [`请在 ${v.edue} 前提交申请。`, `Please apply by ${v.edue}.`], 'book'); if (!S.bk && S.page !== 'intake') { S.page = 'book'; S.bookTab = 'time'; S.modal = null; } }
  if (v.viewed && S.ivc.ik) S.ivc.ik.viewed = true;
}
const _ivDemoGpt = ACT.zIvc; ACT.zIvc = function () { _ivDemoGpt.apply(this, arguments); Object.assign(S.ivc, { id: `demo-${S.scen}-${Date.now()}`, demo: true, replyUntil: new Date(+NOW + 48 * 3600e3).toISOString() }); ivTouch(); };
['ivAcc', 'ivNoOk', 'ivFitOk', 'zIvTurn'].forEach(k => { const f = ACT[k]; ACT[k] = function () { const old = S.ivc && S.ivc.st; const r = f.apply(this, arguments); if (S.ivc && S.ivc.st !== old) { if (k === 'zIvTurn') S.ivc.turn = true; ivTouch(); } return r; }; });
const _ivFinishGpt = ikFinish; ikFinish = function (st) { const inv = S.ik && S.ik.inv; const r = _ivFinishGpt.apply(this, arguments); if (inv) ivTouch(); return r; };
const _ivSubmitGpt = ACT.bookSubmit; ACT.bookSubmit = function () { const v = S.ivc, old = S.bk, resch=!!S.resch; const r = _ivSubmitGpt.apply(this, arguments); if (resch && old && old.inv && S.bk) {S.bk.inv=true;S.bk.ivId=old.ivId;if(v){v.st='sub';ivTouch();}} if (!old && S.bk && S.bk.inv && v) { S.bk.ivId = v.id; ivTouch(); } return r; };

const _ivPickGpt=ACT.pickSlot;ACT.pickSlot=function(){const r=_ivPickGpt.apply(this,arguments);if(S.ivc && S.ivc.st==='entry' && S.ivc.allowedMode) S.form.mode=S.ivc.allowedMode;return r;};
const _ivModeGpt=ACT.fMode;ACT.fMode=function(m){if(S.ivc && S.ivc.st==='entry' && S.ivc.allowedMode && m!==S.ivc.allowedMode)return toast(L('这个入口目前只提供'+S.ivc.allowedMode+'咨询','This mode is not available'));return _ivModeGpt.apply(this,arguments);};

function ivLive(kind) { const v=S.ivc,until=v && (kind==='reply'?v.replyUntil:v.entryUntil); if (!v || (until && NOW>=new Date(until))) { if(v){v.st='late';v.lateType=kind;ivTouch();}S.modal=null;S.page='home';toast(L('已过截止时间，中心老师会跟进。你也可以自己预约普通号。','This invitation has expired.'));return false;}return true; }
['ivAcc','ivNoOk'].forEach(k=>{const f=ACT[k];ACT[k]=function(){if(!ivLive('reply'))return;return f.apply(this,arguments);};});
['ivFit','ivFitOk'].forEach(k=>{const f=ACT[k];ACT[k]=function(){if(!ivLive('entry'))return;return f.apply(this,arguments);};});
const _ivDeadlineSubmit=ACT.bookSubmit;ACT.bookSubmit=function(){if(S.ivc && S.ivc.st==='entry' && !S.bk && !ivLive('entry'))return;return _ivDeadlineSubmit.apply(this,arguments);};
const _ivDeadlineModal=MODALS.ivc;MODALS.ivc=function(){if(S.ivc && (S.ivc.st==='late'||S.ivc.replyUntil && NOW>=new Date(S.ivc.replyUntil)))return `<div class="mo"><h3>这次邀约已过截止时间</h3><p>中心老师会跟进后续安排。想和老师聊聊，也可以自己预约普通号。</p><div class="acts"><button class="btn pri" data-act="close">知道了</button></div></div>`;return _ivDeadlineModal();};
const _ivDeadlineHome=homeExtra;homeExtra=function(){const rows=_ivDeadlineHome();if(S.ivc && ['late','adjust'].includes(S.ivc.st))rows.unshift(`<div class="row todo"><div class="grow"><b>${S.ivc.st==='adjust'?'中心正在重新安排时间':'这次邀约已过截止时间'}</b><small>${esc(S.ivc.note || '中心老师会跟进。想早点聊，也可以自己预约普通号。')}</small></div></div>`);return rows;};

const _ivPendGpt=ACT.zPend;ACT.zPend=function(){const b=S.bk,r=_ivPendGpt.apply(this,arguments);if(b && b.inv && S.bk){S.bk.inv=true;S.bk.ivId=b.ivId;}return r;};
