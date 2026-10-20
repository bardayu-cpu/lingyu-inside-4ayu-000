/* =====================================================================
   v1.19 · 主动邀约（学生这边）
   邀约卡 → 接受 → 马上和预咨询小屿聊（高危咨询题库）→ 拿到人工预约入口（号不够先排队）→ 自己选时间、提交申请 → 老师确认
   卡上不写原因、等级、「普测筛出」、排队名次。演示里由「⚡ 演示 · 收到心理中心的邀约卡」触发（真实情况是老师按批确认后发）
===================================================================== */
/* 截止时间都按「现在 + 2 天 18:00」算（演示里的今天跟着场景走） */
const ivDay = n => { const d = new Date(NOW); d.setDate(d.getDate() + n); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
const IVC_DUE_ = () => ivDay(2);
const ivcDue = () => (S.ivc && S.ivc.due) || IVC_DUE_();
function ivEntry(due) { S.ivc.st = 'entry'; S.ivc.edue = due || ivDay(2); S.page = 'book'; S.bookTab = 'time'; S.pageTop = true; }
/* 预咨询存到邀约上（这时还没有预约）；发送、保存、不填都接着走到下一步 */
const _ikFinish19 = ikFinish; ikFinish = function (st) { const ik = S.ik; if (!ik || !ik.inv) return _ikFinish19(st);
  const real = S.bk; S.bk = { intake: S.ivc.ik || null, topics: [] }; try { _ikFinish19(st); S.ivc.ik = S.bk.intake; } finally { S.bk = real; }
  if (st === 'draft') { S.page = 'home'; S.pageTop = true; toast(L('已保存。之后可以在首页接着聊', 'Saved. You can continue from Home')); return; }
  if (S.ivQ) { S.ivc.st = 'queue'; S.page = 'home'; S.modal = 'ivcQ'; return; }
  ivEntry(); toast(st === 'sent' ? L('已发给老师。现在可以选和老师见面的时间了', 'Sent. Now pick a time to meet') : L('现在可以选和老师见面的时间了', 'Now pick a time to meet')); };
const _ikX19 = ACT.ikX; ACT.ikX = function () { const ik = S.ik; if (ik && ik.inv && ik.phase !== 'review' && !ikHas(ik)) return ikFinish('skipped'); return _ikX19.apply(this, arguments); };
function ivGoIk() { const it = S.ivc.ik, real = S.bk; S.ivc.st = 'acc'; S._ivIk = true; S.bk = { intake: it || null };
  try { ikStart(false, !!(it && it.st === 'draft' && it.qs)); } finally { S.bk = real; S._ivIk = false; } S.ik.inv = true; }
Object.assign(ACT, {
  zIvc() { S.ivc = { st: 'wait', due: IVC_DUE_(), at: new Date(NOW) };
    addMsg('chat', ['心理中心邀请你聊一聊', 'UCC invites you to talk'], [`接受后，小屿会先花 3 分钟了解一下你最近的情况，然后你可以自己选和老师见面的时间。请在 ${IVC_DUE_()} 前回复。`, `If you accept, Xiaoyu will spend about 3 minutes getting to know how you’ve been, then you can choose a time to meet a counsellor. Please reply by ${IVC_DUE_()}.`], 'ivc'); S.modal = 'ivc'; },
  zIvQ() { S.ivQ = !S.ivQ; toast(S.ivQ ? L('演示：号不够，做完预咨询先排队', 'Demo: no slots, queue after intake') : L('演示：有号，做完预咨询直接选时间', 'Demo: slots available')); },
  zIvTurn() { if (!S.ivc || S.ivc.st !== 'queue') return; S.ivc.st = 'entry'; S.ivc.edue = ivDay(4);
    addMsg('cal', ['可以选和老师见面的时间了', 'You can now pick a time to meet'], [`请在 ${S.ivc.edue} 前提交。`, `Please send your choice by ${S.ivc.edue}.`], 'book'); toast(L('收到通知：可以选时间了', 'Notified: you can pick a time now')); },
  ivcOpen() { S.modal = 'ivc'; },
  ivAcc() { S.modal = null; S.ivc.acc = new Date(NOW); addFoot('chat', ['接受了心理中心的邀约', 'Accepted UCC’s invitation'], 'home');
    if (IK_MODE === 'C') return ivEntry(); ivGoIk(); },
  ivNo() { S.modal = 'ivcNo'; },
  ivNoOk() { S.ivc.st = 'no'; S.modal = null; S.page = 'home'; toast(L('好的。之后想聊，随时可以在「预约咨询」里约', 'Okay. You can book anytime from “Counselling”')); },
  ivIkGo() { ivGoIk(); },
  ivFit() { S.modal = 'ivFit'; S.ivFitSel = (S.ivc.fit || []).slice(); },
  ivFitT(k) { const L0 = S.ivFitSel; const i = L0.indexOf(k); if (i >= 0) L0.splice(i, 1); else if (L0.length >= 3) return toast(L('最多选 3 个', 'Pick up to 3')); else L0.push(k); },
  ivFitOk() { if (!S.ivFitSel.length) return toast(L('选一个方便的时间', 'Pick at least one time')); S.ivc.fit = S.ivFitSel.slice(); S.ivc.st = 'nofit'; S.modal = null; S.page = 'home';
    toast(L('已交给老师。老师加了合适的时间会通知你', 'Sent. We’ll let you know when a matching time opens')); },
});
const _msgOpen19 = ACT.msgOpen; ACT.msgOpen = function (i) { const x = S.inbox[+i]; if (x && x.link === 'ivc') { x.read = true; if (S.ivc && S.ivc.st === 'wait') S.modal = 'ivc'; else { S.page = 'home'; } return; } return _msgOpen19(i); };
/* 提交申请：带上预咨询摘要，不再弹预咨询窗口 */
const _submit19 = ACT.bookSubmit; ACT.bookSubmit = function () { const iv = S.ivc && S.ivc.st === 'entry' && !S.resch && !S.bk;
  if (!iv) return _submit19.apply(this, arguments);
  S._ikPass = true; try { _submit19.apply(this, arguments); } finally { S._ikPass = false; }
  if (S.bk) { S.bk.inv = true; S.bk.intake = S.ivc.ik ? Object.assign({}, S.ivc.ik) : { st: 'skipped', at: new Date(NOW), ver: 1, mode: IK_MODE };  S.ivc.st = 'sub'; } };
/* 选时间：入口提示 + 最下面「时间都不合适」 */
const _book19 = PAGES.book; PAGES.book = () => { const h = _book19(); if (!S.ivc || S.ivc.st !== 'entry' || S.bk || S.resch) return h;
  const strip = `<div class="strip"><span class="ico">${I('cal')}</span><div class="grow"><b>${L('可以选和老师见面的时间了', 'You can now pick a time to meet')}</b><small>${L(`请在 ${S.ivc.edue} 前提交。下面列的都是你现在能约的时间，提交后等老师确认。`, `Please send your choice by ${S.ivc.edue}. Every time shown here is open to you; your counsellor confirms after you send it.`)}</small></div></div>`;
  const fit = `<div class="ivfit"><button class="lnk" data-act="ivFit">${L('时间都不合适？告诉老师你方便的时间', 'None of these work? Tell us when suits you')}</button></div>`;
  return h.replace(/<div class="xy">[\s\S]*?<\/span><\/div><\/div>/, '').replace('<div class="tabs">', strip + '<div class="tabs">').replace(/<\/div><\/div>\s*$/, fit + '</div></div>'); };
/* 首页待办：邀约卡、预咨询、排队、选时间 */
const _homeExtra19 = homeExtra; homeExtra = function () { const R = _homeExtra19(), v = S.ivc;
  const row = (ico, t, tag, sub, btn) => `<div class="row todo"><span class="mini" style="background:var(--bub)">${I(ico)}</span><div class="grow"><b>${t}</b> ${tag}<small>${sub}</small></div><div class="acts">${btn}</div></div>`;
  if (!v) ;
  else if (v.st === 'wait') R.unshift(row('chat', L('心理中心邀请你聊一聊', 'UCC invites you to talk'), `<span class="pill n">${L('待回复', 'Reply needed')}</span>`, L(`请在 ${ivcDue()} 前回复`, `Please reply by ${ivcDue()}`), `<button class="btn pri sm" data-act="ivcOpen">${L('查看', 'View')}</button>`));
  else if (v.st === 'acc') R.unshift(row('chat', L('和预咨询小屿聊聊', 'Chat with Xiaoyu'), `<span class="pill n">${v.ik && v.ik.st === 'draft' ? L('已保存，没聊完', 'Saved') : L('还没聊', 'Not started')}</span>`, L('大约 3 分钟，聊完就可以选和老师见面的时间', 'About 3 minutes, then you can pick a time to meet'), `<button class="btn pri sm" data-act="ivIkGo">${v.ik && v.ik.st === 'draft' ? L('接着聊', 'Continue') : L('去聊聊', 'Start')}</button>`));
  else if (v.st === 'queue') R.unshift(row('clock', L('等待见面时间开放', 'Waiting for a time to open'), `<span class="pill n">${L('老师已收到', 'Received')}</span>`, L('见面时间开放后会第一时间通知你。想早点聊，也可以自己在「预约咨询」里约。', 'We’ll let you know as soon as a time opens. To talk sooner, you can book yourself from “Counselling”.'), `<span class="zap" data-act="zIvTurn">⚡ ${L('演示 · 轮到你了', 'Demo: your turn')}</span>`));
  else if (v.st === 'entry') R.unshift(row('cal', L('选和老师见面的时间', 'Pick a time to meet'), `<span class="pill n">${L('待提交', 'To do')}</span>`, L(`请在 ${v.edue} 前提交`, `Please send by ${v.edue}`), `<button class="btn pri sm" data-act="go" data-arg="book">${L('选时间', 'Pick a time')}</button>`));
  else if (v.st === 'nofit') R.unshift(row('cal', L('已告诉老师你方便的时间', 'You told us when suits you'), `<span class="pill n">${L('等老师安排', 'Waiting')}</span>`, (v.fit || []).join(L('、', ', ')), ''));
  return R; };
Object.assign(MODALS, {
  ivc: () => `<div class="mo"><button class="x" data-act="close" aria-label="${L('关闭', 'Close')}">${I('x')}</button><img class="mascot" src="${MASCOT}" alt=""><h3>${L('心理中心邀请你聊一聊', 'UCC invites you to talk')}</h3>
    <p>${L(`接受后，小屿会先花 3 分钟了解一下你最近的情况，然后你可以自己选和老师见面的时间。请在 ${ivcDue()} 前回复。`, `If you accept, Xiaoyu will spend about 3 minutes getting to know how you’ve been, then you can choose a time to meet a counsellor. Please reply by ${ivcDue()}.`)}</p>
    <div class="acts"><button class="btn sec" data-act="ivNo">${L('这次不参加', 'Not this time')}</button><button class="btn pri" data-act="ivAcc">${L('接受', 'Accept')}</button></div></div>`,
  ivcNo: () => `<div class="mo"><h3>${L('确定这次不参加吗？', 'Skip this time?')}</h3><p style="color:var(--ink2)">${L('之后想聊可以随时在「预约咨询」里约。', 'You can book anytime from “Counselling” if you’d like to talk later.')}</p>
    <div class="acts"><button class="btn sec" data-act="ivcOpen">${L('再想想', 'Go back')}</button><button class="btn pri" data-act="ivNoOk">${L('确定不参加', 'Skip this time')}</button></div></div>`,
  ivcQ: () => `<div class="mo"><img class="mascot" src="${MASCOT}" alt=""><h3>${L('谢谢你，老师已经收到', 'Thank you — we’ve got it')}</h3><p>${L('见面时间开放后会第一时间通知你。想早点聊，也可以自己在「预约咨询」里约。', 'We’ll let you know as soon as a time opens. To talk sooner, you can book yourself from “Counselling”.')}</p>
    <div class="acts"><button class="btn pri" data-act="close">${L('好的', 'OK')}</button></div></div>`,
  ivFit: () => { const D = DAYS.slice(1, 8), P = [L('上午', 'Morning'), L('下午', 'Afternoon'), L('晚上', 'Evening')], sel = S.ivFitSel || [];
    return `<div class="mo l"><button class="x" data-act="close" aria-label="close">${I('x')}</button><h3>${L('你方便的时间', 'When suits you')}</h3><p style="color:var(--ink2)">${L('最多选 3 个。老师加了匹配的时间后会通知你，再请你选。', 'Pick up to 3. We’ll let you know when a matching time opens.')}</p>
      <div class="ivfg">${D.map(d => `<div><small>${fmtDay(d)}</small><div class="chips">${P.map(p => { const k = `${fmtDay(d)} ${p}`; return `<button class="${sel.includes(k) ? 'on' : ''}" data-act="ivFitT" data-arg="${k}">${p}</button>`; }).join('')}</div></div>`).join('')}</div>
      <div class="acts"><button class="btn sec" data-act="close">${L('返回', 'Back')}</button><button class="btn pri" data-act="ivFitOk">${L('交给老师', 'Send')}</button></div></div>`; },
});
/* 接受后直接进预咨询：第一题上面先显示开场白（高危咨询题库里配置） */
const _ikPage19 = PAGES.intake; PAGES.intake = () => { const h = _ikPage19(), ik = S.ik; if (!ik || !ik.inv || ik.i !== 0 || ik.phase !== 'q' || ikHas(ik)) return h;
  return h.replace('<div class="iksay', `<div class="iksay ikopen">${ikFill(ikTx(ikCfg(), 'open'))}</div><div class="iksay`); };
/* 演示按钮放在首页最下面（不算待办） */
const _home19 = PAGES.home; PAGES.home = () => { const h = _home19(); if (S.ivc) return h;
  return h.replace(/<\/div><\/div>\s*$/, `<div class="zaps"><span class="zap" data-act="zIvc">⚡ ${L('演示 · 收到心理中心的邀约卡', 'Demo: receive UCC’s invitation')}</span><span class="zap" data-act="zIvQ">⚡ ${S.ivQ ? L('演示 · 现在：没号要排队', 'Demo: now queueing') : L('演示 · 现在：有号', 'Demo: slots available')}</span></div></div></div>`); };
