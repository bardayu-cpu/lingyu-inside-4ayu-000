/* =====================================================================
   v1.13 · 预咨询小屿（学生端）
   v1.12 首次加入；v1.13 改成「接待台」：
   · 提交预约后弹出大的接待窗口（左边站着的接待员小屿，右边开场白）
   · 一次只问一道题（第 n / N 题、上一题、跳过这题），结尾是一张可修改的表单，勾选同意后才发送
   · 题目来自机构端「设置 → 预咨询」的模板（单独打开学生端时用默认模板）；两套模板：名单内 / 名单外或 3 个月内没做普测
   · 随时可关：没答题直接关；答了一部分可「先保存」或「这次不填了」；关闭也同步给老师
   · 只收集，不评分；简答里出现危机表达，窗口内弹出求助卡，并立即走原危机流程（不依赖是否发送）
   位置由学校设置：A 提交后（默认）/ B 选好时段后、提交前（时段暂留 15 分钟）/ C 关闭
===================================================================== */
var IK_MODE = 'A';
var IK_CFG = null;                       // 机构端下发：{ t1, t2, t2on, open, close }；单独打开学生端时为空，用默认
const IK_AV = () => `<img class="ikav" src="${MASCOT_IK}" alt="">`;
const IK_NAME = () => L('预咨询小屿', 'Xiaoyu · Intake');
const IK_PREV = { A: ['睡眠', '学业压力'], B: ['学业压力', '情绪低落'], C: ['情绪低落', '睡眠'], D: ['学业压力', '睡眠'] };   // 上次普测「聊到的话题」（学生在自己的卡片里看得到）
const IK_HOLD_MIN = 15;
/* 默认模板（和机构端 a14_v113.js 的 IKT_DEF 保持一致） */
const IK_Q = {
  topics: { k: 'topics', type: 'multi', useTopics: 1, name: '想聊的话题', say: '这次最想和老师聊的是什么？可以多选，也可以自己写。', sayEn: 'What would you most like to talk about? Pick any, or add your own.', skip: 1 },
  trouble: { k: 'trouble', type: 'text', name: '最困扰的事（原话）', say: '现在最困扰你的一件事是什么？用你自己的话说说就好。', sayEn: 'What’s troubling you most right now? In your own words.', skip: 1, probe: 1, probeText: '能再多说一点吗？比如这件事一般在什么时候最明显？', probeEn: 'Could you say a little more? For example, when is it most noticeable?' },
  dur: { k: 'dur', type: 'single', name: '持续多久', say: '这种情况大概持续多久了？', sayEn: 'How long has this been going on?', opts: ['一两周', '一个月左右', '几个月', '更久'], optsEn: ['A week or two', 'About a month', 'A few months', 'Longer'], skip: 1 },
  impact: { k: 'impact', type: 'single', name: '影响', say: '它对你的学习和生活影响有多大？', sayEn: 'How much is it affecting your study and daily life?', opts: ['还好，能应付', '有些影响', '影响很大'], optsEn: ['I can manage', 'Somewhat', 'A lot'], skip: 1 },
  sleep: { k: 'sleep', type: 'single', name: '睡眠和饮食', say: '最近两周，你的睡眠和饮食有变化吗？', sayEn: 'In the last two weeks, have your sleep or eating changed?', opts: ['没什么变化', '有些变化', '变化很大'], optsEn: ['Not really', 'Some change', 'A big change'], skip: 1 },
  support: { k: 'support', type: 'single', name: '身边的支持', say: '遇到困难的时候，身边有可以说话的人吗？', sayEn: 'When things are hard, is there someone you can talk to?', opts: ['有', '不太确定', '没有'], optsEn: ['Yes', 'Not sure', 'No'], skip: 1 },
  expect: { k: 'expect', type: 'single', name: '希望得到的帮助', say: '你希望这次见面帮到你什么？', sayEn: 'What would you like from this first meeting?', opts: ['想有人听我说说', '想要具体的建议', '想解决一个具体问题', '还不确定'], optsEn: ['Someone to listen', 'Practical advice', 'Solve a specific problem', 'Not sure yet'], skip: 1 },
  extra: { k: 'extra', type: 'text', name: '补充', say: '还有什么想先让老师知道的吗？没有的话可以直接跳过。', sayEn: 'Anything else you’d like your counsellor to know first? Skip if not.', skip: 1 },
};
const IK_DEF = () => JSON.parse(JSON.stringify({ ver: 1,
  open: '你好，我是预咨询小屿。为了在见面前更好地了解你，我想先问你几个问题，大约 3 分钟。你的回答会整理好给{接待老师}看，也会帮中心之后为你安排更合适的咨询老师。上次普测时，你聊到了{上次聊到的话题}，这次可以从这里聊起，也可以聊完全不同的事。',
  openEn: 'Hi, I’m Xiaoyu on the intake desk. To get to know you a little before you meet, I’d like to ask a few questions — about 3 minutes. I’ll put your answers together for {接待老师}, and it also helps UCC arrange the right counsellor for you later. Last time you talked about {上次聊到的话题} — you can start there, or with something else entirely.',
  close: '谢谢你。我把你说的整理成了下面这张表，你可以直接修改，确认没问题再发给{接待老师}。',
  closeEn: 'Thank you. Here’s what you shared — edit anything you like, then send it to {接待老师}.',
  t1: ['topics', 'trouble', 'dur', 'impact', 'expect', 'extra'].map(k => IK_Q[k]),
  t2: ['topics', 'trouble', 'dur', 'impact', 'sleep', 'support', 'expect', 'extra'].map(k => IK_Q[k]), t2on: false }));
/* v1.19：高危咨询题库（主动邀约来的学生接受邀约后马上做）；机构端「预约咨询 · AI 预咨询 · 题库配置」下发 */
var IK_CFG_H = null;
const IK_DEF_H = () => JSON.parse(JSON.stringify({ ver: 1,
  open: '你好，我是预咨询小屿。心理中心邀请你聊一聊，在你选和老师见面的时间之前，我想先问你几个问题，大约 3 分钟。你的回答会整理好给之后接待你的老师看，只收集，不打分。',
  openEn: 'Hi, I’m Xiaoyu on the intake desk. UCC has invited you to talk. Before you pick a time to meet, I’d like to ask a few questions — about 3 minutes. Your answers go to the counsellor who meets you. Nothing is scored.',
  close: '谢谢你。我把你说的整理成了下面这张表，你可以直接修改，确认没问题再发给老师。发完就可以选和老师见面的时间了。',
  closeEn: 'Thank you. Here’s what you shared — edit anything you like, then send it. After that you can pick a time to meet.',
  t1: ['topics', 'trouble', 'dur', 'impact', 'sleep', 'support', 'expect', 'extra'].map(k => IK_Q[k]), t2: [], t2on: false }));
const ikCfg = () => S && (S._ivIk || (S.ik && S.ik.inv)) ? IK_CFG_H || IK_DEF_H() : IK_CFG || IK_DEF();
const ikTx = (o, k) => LANG === 'en' && o[k + 'En'] ? o[k + 'En'] : o[k];
const ikOpts = q => q.useTopics ? DATA.topics.map(T) : LANG === 'en' && q.optsEn && q.optsEn.length === (q.opts || []).length ? q.optsEn : (q.opts || []);
/* 预计用时（秒）：多选 20、单选 10、简答 40，简答追问再加 20 */
const ikSecs = qs => qs.reduce((n, q) => n + (q.type === 'text' ? 40 + (q.probe ? 20 : 0) : q.type === 'multi' ? 20 : 10), 0);
const ikTeacher = () => { const b = S.hold ? S.hold.pick : S.bk; return b ? whoZ(b.cid) : L('接待老师', 'your counsellor'); };
/* 上次聊到的话题：只用 3 个月内做完的普测，没有就不提 */
function ikPrev() { const t = aiTask(); return t && isDone(t) && t.doneAt && (NOW - t.doneAt) / 864e5 <= 90 ? IK_PREV[S.scen] : null; }
/* 模板二：名单外、自己来求助的学生，或 3 个月内没有完成普测（学校在机构端打开后才用） */
const ikNeedT2 = () => ikCfg().t2on && (!!S.walkin || !ikPrev());
/* 变量替换；某一句里的变量为空时整句去掉 */
function ikFill(text) { const prev = ikPrev(), v = { 接待老师: LANG === 'en' ? (S.hold ? C(S.hold.pick.cid) : S.bk ? C(S.bk.cid) : null)?.name || 'your counsellor' : ikTeacher(), 上次聊到的话题: prev ? prev.map(T).join(L('、', ', ')) : '' };
  return (text || '').split(/(?<=[。！？.!?])\s*/).filter(s => !/\{(\w+|[一-龥]+)\}/.test(s) || [...s.matchAll(/\{([^}]+)\}/g)].every(m => v[m[1]])).map(s => s.replace(/\{([^}]+)\}/g, (_, k) => v[k] ?? '')).join(LANG === 'en' ? ' ' : ''); }
/* 当前输入也属于草稿；关闭或倒计时保存不能只看已点「下一题」的答案。 */
function ikDraftAnswers(ik) { const ans = { ...ik.ans }, q = ik.phase === 'q' && ik.qs[ik.i]; if (!q) return ans;
  if (q.type === 'multi') { const own = (ik.own || '').split(/[、,，]\s*/).map(x => x.trim()).filter(Boolean); if ((ik.sel || []).length || own.length) ans[q.k] = [...(ik.sel || []), ...own]; }
  else if (q.type === 'text') { const txt = (ik.txt || '').trim(); if (txt) ans[q.k] = ik.probe && ans[q.k] ? `${ans[q.k]}；${txt}` : txt; }
  return ans; }
const ikHas = ik => Object.values(ikDraftAnswers(ik)).some(v => v != null && (Array.isArray(v) ? v.length : String(v).trim()));
const ikVal = (q, v) => v == null ? '' : Array.isArray(v) ? v.join('、') : String(v);

/* ---------- 开始 / 继续 ---------- */
function ikStart(hold, resume) {
  const it = S.bk && S.bk.intake, keep = resume && it && it.qs ? it : null, tk = keep ? keep.tk : ikNeedT2() ? 't2' : 't1';
  const qs = keep ? keep.qs : JSON.parse(JSON.stringify(ikCfg()[tk]));
  S.ik = { tk, tv: keep ? keep.tv : ikCfg().ver, qs, i: 0, ans: keep ? { ...(keep.ans || {}) } : {}, probed: {}, probe: false, crisis: !!(it && it.crisis), crisisAt: -1, hold: !!hold, phase: 'q', sel: [], own: '' };
  const cursor = keep && keep.cursor;
  if (cursor && cursor.i >= 0 && cursor.i < qs.length) S.ik.i = cursor.i;
  else if (keep) { const n = qs.findIndex(q => S.ik.ans[q.k] == null); S.ik.i = n < 0 ? qs.length - 1 : n; }
  ikLoad();
  if (cursor) { Object.assign(S.ik, { probe: !!cursor.probe, probed: { ...(cursor.probed || {}) }, txt: cursor.txt || '', own: cursor.own || '', sel: (cursor.sel || []).slice() }); if (cursor.probe) S.ik.ans[qs[S.ik.i].k] = cursor.base; }
  S.page = 'intake'; S.modal = null; S.pageTop = true;
}
/* 进入某一题时，把已有回答放进输入区 */
function ikLoad() { const ik = S.ik, q = ik.qs[ik.i]; if (!q) return; const v = ik.ans[q.k];
  ik.probe = false; if (q.type === 'multi') { const o = ikOpts(q), a = Array.isArray(v) ? v : []; ik.sel = a.filter(x => o.includes(x) || DATA.topics.includes(x)); ik.own = a.filter(x => !ik.sel.includes(x)).join('、'); } else if (q.type === 'text') ik.txt = v || ''; }
function ikCrisisCheck(text) { const ik = S.ik; if (text && RULE.crisisRe.test(text)) { ik.crisis = true; ik.crisisAt = ik.i; S.ikCrisis = true; crisisFollow(); return true; } return false; }
function ikNext() { const ik = S.ik; ik.probe = false; ik.i++; if (ik.i >= ik.qs.length) ikToReview(); else ikLoad(); }
function ikToReview() { const ik = S.ik; ik.phase = 'review'; S.ikS = {}; ik.qs.forEach(q => S.ikS[q.k] = ikVal(q, ik.ans[q.k])); S.ikOk = false; S.pageTop = true; }
function ikAnswer(v) { const ik = S.ik, q = ik.qs[ik.i];
  if (q.type === 'text') { const t = String(v).trim(); ikCrisisCheck(t);
    if (q.probe && !ik.probed[q.k] && t && t.length < 10 && ik.crisisAt !== ik.i) { ik.probed[q.k] = true; ik.ans[q.k] = t; ik.probe = true; ik.txt = ''; return; }
    ik.ans[q.k] = ik.probe && ik.ans[q.k] && t ? `${ik.ans[q.k]}；${t}` : (t || ik.ans[q.k] || ''); }
  else ik.ans[q.k] = v;
  if (ik.crisisAt === ik.i && q.type === 'text') { ik.probe = false; return; }   // 先停在这一题，让学生看到求助卡，再点「继续」
  ikNext(); }

/* ---------- 完成 / 保存 / 不填 ---------- */
function ikFinish(st) {
  const ik = S.ik, answers = st === 'draft' ? ikDraftAnswers(ik) : ik.ans, sum = st === 'sent' || st === 'draft' ? ik.qs.map(q => ({ k: q.k, name: q.name, v: ik.phase === 'review' ? (S.ikS[q.k] || '').trim() : ikVal(q, answers[q.k]) })) : null;
  const prev = (S.bk && S.bk.intake) || {}, it = { st, at: new Date(NOW), sum: sum || prev.sum || null, crisis: ik.crisis || !!prev.crisis, ver: (prev.ver || 0) + 1, viewed: st === 'sent' ? false : !!prev.viewed, mode: IK_MODE, tk: ik.tk, tv: ik.tv, qs: ik.qs, ans: answers, adds: prev.adds || [] };
  if (st === 'draft') it.cursor = { i: ik.i, probe: !!ik.probe, probed: { ...ik.probed }, txt: ik.txt || '', own: ik.own || '', sel: (ik.sel || []).slice(), base: ik.probe ? ik.ans[ik.qs[ik.i].k] : null };
  const topicsOf = () => { const t = ik.qs.find(q => q.useTopics); return t ? (Array.isArray(ik.ans[t.k]) ? ik.ans[t.k] : []).filter(x => DATA.topics.includes(x)) : []; };
  if (ik.hold) { const h = S.hold; S.pick = h.pick; S.form = h.form; S.bkNote = h.note; S.form.topics = [...new Set([...S.form.topics, ...topicsOf()])]; S._ikPass = true; ACT.bookSubmit(); S._ikPass = false; S.hold = null; }
  else if (S.bk) S.bk.topics = [...new Set([...S.bk.topics, ...topicsOf()])];
  if (S.bk) S.bk.intake = it;
  if (st === 'sent') { addFoot('chat', ['把想聊的内容整理好，发给了老师', 'Sent your intake summary'], 'go:mybook'); if (!ik.hold) toast(L('已发给老师。老师查看前你都可以修改', 'Sent. You can edit it until your counsellor opens it')); }
  else if (st === 'draft' && !ik.hold) toast(L('已保存。之后可以在「我的预约」里继续', 'Saved. Continue any time from My appointments'));
  ik.phase = 'done'; ik.st = st; S.ik = null;
  if (!ik.hold) { S.page = 'mybook'; S.pageTop = true; }
}
/* 时段暂留到时（入口 B）：先提交预约，已答内容存为「已保存未发送」 */
function ikTimeout() { if (!S.hold) return; const ik = S.ik;
  if (ik) ikFinish(ikHas(ik) ? 'draft' : 'none'); else { S.ik = { tk: 't1', qs: ikCfg().t1, ans: {}, hold: true, phase: 'q' }; ikFinish('none'); }
  S.modal = 'booked'; S.ikTimedOut = true; toast(L('时段保留时间到了，已先为你提交预约', 'Your held time ran out, so we sent your booking')); }
const ikStatusTxt = it => !it || it.st === 'none' ? L('还没聊', 'Not started') : it.st === 'skipped' ? L('这次不填', 'Skipped this time') : it.st === 'draft' ? L('已保存，未发送', 'Saved, not sent') : it.viewed ? L('老师已查看', 'Seen by your counsellor') : L('已发给老师', 'Sent to your counsellor');

/* ---------- 接待窗口（提交预约后 / 入口 B 选好时段后） ---------- */
function ikWelcome() { const cfg = ikCfg(), tk = ikNeedT2() ? 't2' : 't1', mins = Math.max(1, Math.round(ikSecs(cfg[tk]) / 60)), b = S.hold ? S.hold.pick : S.bk;
  const top = S.hold ? `<div class="ikw-top hold">${I('clock', 's')}${L(`你选的时段（${fmtDay(DAYS[b.di])} ${DATA.times[b.ti]}）已为你保留 ${IK_HOLD_MIN} 分钟`, `Your time (${fmtDay(DAYS[b.di])} ${DATA.times[b.ti]}) is held for ${IK_HOLD_MIN} minutes`)} · <b class="ikcd">${ikCdTxt()}</b></div>`
    : `<div class="ikw-top">${I('check', 's')}${L(`预约申请已提交：${who(C(b.cid))}，${bkWhen(b)}，等老师确认`, `Request sent: ${C(b.cid).name}, ${bkWhen(b)} — waiting for confirmation`)}</div>`;
  return `<div class="mo ikw"><button class="x" data-act="ikWX" aria-label="${L('关闭', 'Close')}">${I('x')}</button>
    <div class="ikw-l"><img src="${MASCOT_IK_FULL}" alt=""><span>${L('接待台', 'Intake desk')}</span></div>
    <div class="ikw-r">${top}<div class="ikw-name">${IK_NAME()}</div><div class="iksay big">${ikFill(ikTx(cfg, 'open'))}</div>
      <ul class="ikw-notes"><li>${I('check', 's')}${S.hold ? L('不填也可以直接提交预约', 'You can send your booking without it') : L('跳过不会影响这次预约申请', 'Your booking stands either way')}</li><li>${I('check', 's')}${L('只是帮老师提前了解你，不打分', 'Just helps your counsellor prepare — no scores')}</li><li>${I('check', 's')}${L('最后你看过、确认后才发送', 'Nothing is sent until you check and confirm')}</li></ul>
      <div class="ikw-acts"><button class="btn sec" data-act="ikNo">${S.hold ? L('这次先不用，直接提交预约', 'Not now — send my booking') : L('这次先不用', 'Not this time')}</button><button class="btn pri" data-act="ikYes">${L(`好的，开始（约 ${mins} 分钟）`, `OK, let’s start (~${mins} min)`)}</button></div></div></div>`; }
const ikCdTxt = () => { if (!S.hold || !S.hold.until) return ''; const s = Math.max(0, Math.round((S.hold.until - Date.now()) / 1000)); return L(`还剩 ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} left`); };

/* ---------- 接待台页面 ---------- */
function intakePage() {
  const ik = S.ik; if (!ik) { S.page = 'mybook'; return PAGES.mybook(); }
  const n = ik.qs.length, q = ik.qs[ik.i], rev = ik.phase === 'review';
  const hold = S.hold ? `<span class="ikcdw ${S.hold.until - Date.now() < 120e3 ? 'warn' : ''}">${I('clock', 's')}${L('时段保留', 'Held')} <b class="ikcd">${ikCdTxt()}</b>${S.hold.until - Date.now() < 120e3 ? `<em>${L('快到时间了，到时会先帮你提交预约，已答的内容会保存', 'Almost out of time — we’ll send your booking and save your answers')}</em>` : ''}<span class="zap" data-act="zIkTime">⚡ ${L('演示 · 时间到', 'Demo: time’s up')}</span></span>` : '';
  const top = `<div class="iktop"><span class="ikprog">${rev ? L('最后一步：确认摘要', 'Last step: check your summary') : L(`第 ${ik.i + 1} / ${n} 题`, `Question ${ik.i + 1} of ${n}`)}</span><span class="ikbar"><i style="width:${rev ? 100 : Math.round(ik.i / n * 100)}%"></i></span>${hold}<button class="x" data-act="ikX" aria-label="${L('关闭', 'Close')}">${I('x')}</button></div>`;
  let body = '';
  if (!rev) { const help = ik.crisisAt === ik.i ? tpl('help-card', { ec: ecLine()[0], ecTel: ecLine()[1], cb: cbLine() }) + `<p class="iksay">${L('这部分情况会优先提供给老师，UCC 会尽快联系你。如果现在觉得不安全，请先联系上面的热线或紧急联系人。准备好了，再继续回答。', 'Thank you for telling me. Your counsellor will see this first, and UCC will reach out soon. You can contact the people above anytime.')}</p>` : '';
    let ans = '';
    if (help) ans = `<div class="iknav"><span style="flex:1"></span><button class="btn pri" data-act="ikGoOn">${L('我准备好了，继续', 'I’m ready — continue')}</button></div>`;
    else if (q.type === 'single') ans = `<div class="ikopts">${ikOpts(q).map((o, j) => { const v = q.opts ? q.opts[j] : o; return `<button class="${ik.ans[q.k] === v ? 'on' : ''}" data-act="ikPick" data-arg="${j}">${o}</button>`; }).join('')}</div>`;
    else if (q.type === 'multi') { const o = q.useTopics ? DATA.topics : (q.opts || []), prev = q.useTopics ? (ikPrev() || []) : [];
      ans = `<div class="ikchips">${o.map(x => `<button class="${ik.sel.includes(x) ? 'on' : ''}" data-act="ikTog" data-arg="${esc(x)}">${ik.sel.includes(x) ? '✓ ' : ''}${T(x)}${prev.includes(x) ? `<em class="prevtag">${L('上次聊到', 'last time')}</em>` : ''}</button>`).join('')}</div>
        <input class="inp" id="ikOwn" data-bind="ik.own" value="${esc(ik.own)}" placeholder="${L('也可以自己写（选填）', 'Or add your own (optional)')}" autocomplete="off">`; }
    else ans = `<textarea class="inp iktxt" id="ikTxt" data-bind="ik.txt" placeholder="${L('写下你想说的…', 'Type here…')}">${esc(ik.txt || '')}</textarea>`;
    const next = help ? '' : q.type === 'single' ? '' : `<button class="btn pri" data-act="ikNextQ">${ik.i === n - 1 ? L('完成', 'Done') : L('下一题', 'Next')} →</button>`;
    body = `<div class="iksay">${ik.probe ? (LANG === 'en' && q.probeEn ? q.probeEn : q.probeText) : ikTx(q, 'say')}</div>${help}${help ? '' : `<div class="ikans">${ans}</div>`}
      ${help ? ans : `<div class="iknav">${ik.i > 0 ? `<button class="btn ghost" data-act="ikPrevQ">${I('left', 's')}${L('上一题', 'Back')}</button>` : ''}<span style="flex:1"></span>${q.skip ? `<button class="lnkb" data-act="ikSkipQ">${L('跳过这题', 'Skip this one')}</button>` : ''}${next}</div>`}
      <span class="zap" data-act="zIk">⚡ ${L('演示 · 快进填写', 'Demo: fill it in')}</span>`; }
  else body = `<div class="iksay">${ikFill(ikTx(ikCfg(), 'close'))}</div>${ikReview()}`;
  return `<div class="ikpage fade"><div class="ikdesk"><div class="ikl"><img src="${MASCOT_IK_FULL}" alt=""><span class="iktag">${IK_NAME()} · ${L('接待台', 'Intake desk')}</span></div>
    <div class="ikr">${top}<div class="ikbody" id="ikBody" data-keep>${body}</div></div></div>
    <p class="ikfoot">${I('lock', 's')}${L('这些回答用于帮助老师了解你，不打分。接待你的老师和中心负责安排咨询的老师可以查看，辅导员看不到。需要及时帮助时，可拨打 24 小时热线 1767。', 'Only collected, never scored. Your counsellor and the UCC staff who arrange sessions can see it — your college advisor can’t. Need help now? Call 1767, 24 hours.')}</p></div>`;
}
function ikReview() { const ik = S.ik;
  const f = q => { const big = q.type === 'text'; return `<div class="ikf ${big ? 'w' : ''}"><label>${esc(q.name)}</label>${big ? `<textarea class="inp" data-bind="ikS.${q.k}" placeholder="${L('没有可以留空', 'Leave blank if nothing')}">${esc(S.ikS[q.k] || '')}</textarea>` : `<input class="inp" data-bind="ikS.${q.k}" value="${esc(S.ikS[q.k] || '')}" placeholder="—">`}</div>`; };
  return `<div class="ikform"><div class="ikfh">${I('file', 's')}<b>${L('给接待老师的预咨询摘要', 'Intake summary for your counsellor')}</b><span class="pill">${L('每一项都可以改', 'Edit anything')}</span></div>
    <div class="ikgrid">${ik.qs.map(f).join('')}</div>
    ${ik.crisis ? `<p class="ikwarn">${I('shield', 's')}${L('你提到的安全情况会优先提供给老师，UCC 会尽快联系你。', 'What you shared about your safety will be seen first; UCC will contact you soon.')}</p>` : ''}
    <label class="ikok"><input type="checkbox" ${S.ikOk ? 'checked' : ''} data-act="ikOkT"> ${L(`同意把这份摘要发给接待我的老师（${ikTeacher()}）`, `I agree to share this with my counsellor (${ikTeacher()})`)}</label>
    <div class="acts"><button class="btn ghost" data-act="ikBackQ">${I('left', 's')}${L('回到题目', 'Back to questions')}</button><span style="flex:1"></span><button class="btn sec" data-act="ikDraft">${L('先保存，不发送', 'Save, don’t send')}</button><button class="btn pri" data-act="ikSendSum" ${S.ikOk ? '' : 'disabled'}>${L('确认发给老师', 'Send to counsellor')}</button></div></div>`; }
/* 中途关闭 */
MODALS.ikClose = () => `<div class="mo l"><h3>${L('要先停在这里吗？', 'Stop here for now?')}</h3><p>${S.ik && S.ik.inv ? L('已经回答的内容可以先保存，之后在首页「和预咨询小屿聊聊」里接着聊；也可以这次不填，继续选和老师见面的时间。', 'Save your answers and continue from “Chat with Xiaoyu” on Home, or skip for now and continue to pick a time to meet.') : S.hold ? L('你的预约会先提交。已经回答的内容可以先保存，之后在「我的预约」里继续。', 'Your booking will be sent. You can save what you’ve answered and continue later from My appointments.') : L('已经回答的内容可以先保存，之后在「我的预约」里继续；也可以这次不填，跳过不会影响这次预约申请。', 'Save what you’ve answered and continue later from My appointments — or skip it this time. Your booking stands either way.')}</p>
  <div class="acts"><button class="btn ghost" data-act="close">${L('继续填写', 'Keep going')}</button><button class="btn sec" data-act="ikQuit">${L('这次不填了', 'Skip this time')}</button><button class="btn pri" data-act="ikSave">${L('先保存，稍后继续', 'Save and continue later')}</button></div></div>`;
MODALS.ikWelcome = ikWelcome;

/* 我的预约里的入口卡 */
function ikCard() {
  const b = S.bk; if (!b || S.owner || b.kind !== '预咨询' || IK_MODE === 'C' && !(b.intake && b.intake.sum)) return '';
  const it = b.intake || { st: 'none' }, sent = it.st === 'sent', S2 = it.sum || [];
  const rows = S2.filter(x => x.v).slice(0, 2).map(x => `${I('chat', 's')}<span>${esc(x.name)}</span><b>${esc(x.v)}</b>`).join('');
  return `<div class="bk ikcard"><div class="bh">${IK_AV()}<div class="grow"><b>${IK_NAME()}</b><small style="color:var(--mute2)">${L('帮老师提前了解你想聊什么', 'Helps your counsellor prepare')}</small></div><span class="pill ${sent ? 'g' : ''}">${ikStatusTxt(it)}</span></div>
    <div class="bb">${sent && rows ? `<div class="kv">${rows}</div>` : `<p style="margin:0 0 10px;color:var(--ink2)">${it.st === 'draft' ? L('你保存了一部分回答，可以接着填完再发给老师。', 'You saved some answers — finish and send them when you’re ready.') : it.st === 'skipped' ? L('你这次选择了不填。想补的话，随时可以和预咨询小屿聊聊，不影响预约。', 'You chose to skip this time. You can still do it any time — your booking stands either way.') : L('花 3 分钟和预咨询小屿聊聊，老师见你之前就能先了解你。也可以不聊，不影响预约。', 'Spend 3 minutes with Xiaoyu so your counsellor can get to know you first. Optional — your booking stands either way.')}</p>`}
      ${(it.adds || []).length ? `<p class="note" style="margin:0 0 8px">${L(`你追加过 ${it.adds.length} 条补充`, `You added ${it.adds.length} note(s)`)}</p>` : ''}
      <div class="act">${!sent ? `<button class="btn pri sm" data-act="ikGo">${it.st === 'draft' ? L('继续填写', 'Continue') : L('和预咨询小屿聊聊', 'Chat with Xiaoyu')}</button>`
        : it.viewed ? `<button class="btn sec sm" data-act="ikAdd">${L('追加补充', 'Add a note')}</button><span class="note">${L('老师已查看，摘要不能再改，可以追加补充', 'Your counsellor has read it; you can add a note')}</span>`
        : `<button class="btn sec sm" data-act="ikEdit">${L('查看 / 修改', 'View / edit')}</button>`}</div></div></div>`;
}
/* ---------- 挂到原有流程上 ---------- */
PAGES.intake = intakePage;
const _myBook12 = PAGES.mybook; PAGES.mybook = () => { const h = _myBook12(), c = ikCard(); return c ? h.replace('<div class="sect">', c + '<div class="sect">') : h; };
const _submit12 = ACT.bookSubmit, _close13 = ACT.close;
Object.assign(ACT, {
  bookSubmit() { const first = !S.resch && !S.owner;
    if (first && IK_MODE === 'B' && !S._ikPass) { S.hold = { pick: { ...S.pick }, form: { ...S.form, topics: [...S.form.topics] }, note: S.bkNote || '', until: Date.now() + IK_HOLD_MIN * 60e3 }; S.modal = 'ikWelcome'; return; }
    _submit12(); if (first && S.bk && !S.bk.intake) S.bk.intake = { st: 'none', ver: 0 };
    if (first && IK_MODE === 'A' && !S._ikPass && S.bk && S.bk.kind === '预咨询') S.modal = 'ikWelcome'; },
  close() { if (S.modal === 'ikWelcome') return ACT.ikWX(); return _close13.apply(this, arguments); },
  ikWX() { S.modal = null; if (S.hold) { S.ik = { tk: 't1', qs: ikCfg().t1, ans: {}, hold: true, phase: 'q' }; ikFinish('none'); S.modal = 'booked'; } },
  ikYes() { ikStart(!!S.hold, false); },
  ikNo() { if (S.hold) { S.ik = { tk: 't1', qs: ikCfg().t1, ans: {}, hold: true, phase: 'q' }; ikFinish('skipped'); S.modal = 'booked'; return; }
    if (S.bk) S.bk.intake = Object.assign(S.bk.intake || { ver: 0 }, { st: 'skipped', at: new Date(NOW), ver: ((S.bk.intake || {}).ver || 0) + 1 }); S.modal = null; S.page = 'mybook'; S.pageTop = true; },
  ikGo() { const it = S.bk && S.bk.intake; ikStart(false, !!(it && it.st === 'draft')); },
  ikEdit() { const it = S.bk.intake; ikStart(false, true); const ik = S.ik; ik.qs = it.qs || ik.qs; ik.phase = 'review'; S.ikS = {}; (it.sum || []).forEach(x => S.ikS[x.k] = x.v); S.ikOk = true; },
  ikPick(j) { const q = S.ik.qs[S.ik.i]; ikAnswer(q.opts ? q.opts[+j] : ikOpts(q)[+j]); },
  ikTog(x) { const s = S.ik.sel; S.ik.sel = s.includes(x) ? s.filter(y => y !== x) : [...s, x]; },
  ikNextQ() { const ik = S.ik, q = ik.qs[ik.i];
    if (q.type === 'multi') { const own = (ik.own || '').split(/[、,，]\s*/).map(x => x.trim()).filter(Boolean); ikCrisisCheck(own.join(' ')); if (!ik.sel.length && !own.length) return toast(L('选一个，或者点「跳过这题」', 'Pick one, or skip this question')); ik.ans[q.k] = [...ik.sel, ...own]; if (ik.crisisAt === ik.i) return; return ikNext(); }
    const t = (ik.txt || '').trim(); if (!t) return toast(L('写一句就好，或者点「跳过这题」', 'Write a line, or skip this question')); ikAnswer(t); },
  ikSkipQ() { const ik = S.ik, q = ik.qs[ik.i]; if (ik.probe) { ik.probe = false; return ikNext(); } ik.ans[q.k] = null; ikNext(); },
  ikPrevQ() { const ik = S.ik; if (ik.i > 0) { ik.i--; ikLoad(); } },
  ikBackQ() { const ik = S.ik; ik.qs.forEach(q => { const v = S.ikS[q.k]; if (v != null) ik.ans[q.k] = q.type === 'multi' ? v.split(/[、,，]\s*/).filter(Boolean) : v; }); ik.phase = 'q'; ik.i = ik.qs.length - 1; ikLoad(); },
  ikGoOn() { const ik = S.ik; ik.crisisAt = -1; ikNext(); },
  ikX() { const ik = S.ik; if (ik.phase === 'review' || ikHas(ik)) { S.modal = 'ikClose'; return; }
    if (ik.hold) { ikFinish('none'); S.modal = 'booked'; return; } S.ik = null; S.page = 'mybook'; S.pageTop = true; },
  ikSave() { S.modal = null; const hold = S.ik.hold; if (S.ik.phase === 'review') ACT.ikBackQ(); ikFinish('draft'); if (hold) S.modal = 'booked'; },
  ikQuit() { S.modal = null; const hold = S.ik.hold; ikFinish('skipped'); if (hold) S.modal = 'booked'; },
  ikOkT() { S.ikOk = !S.ikOk; },
  ikSendSum() { if (!S.ikOk) return; const hold = S.ik.hold; ikFinish('sent'); if (hold) S.modal = 'booked'; },
  ikDraft() { const hold = S.ik.hold; ikFinish('draft'); if (hold) S.modal = 'booked'; },
  ikAdd() { S.modal = 'ikAdd'; S.ikAddT = ''; },
  ikAddOk() { const t = (S.ikAddT || '').trim(); if (!t) return; const it = S.bk.intake; if (RULE.crisisRe.test(t)) { it.crisis = true; S.ikCrisis = true; crisisFollow(); }
    it.adds = [...(it.adds || []), { at: new Date(NOW), t }]; it.ver++; it.add = true; S.modal = null; toast(L('已追加，老师会收到', 'Added — your counsellor will see it')); },
  zIkTime() { ikTimeout(); },
  zIk() { const ik = S.ik, A = { A: { topics: ['睡眠', '学业压力'], trouble: '最近一个多月都睡不好，躺下脑子停不下来，白天上课注意力很差', dur: '一个月左右', impact: '有些影响', sleep: '有些变化', support: '有', expect: '想要具体的建议', extra: '' }, B: { topics: ['学业压力', '情绪低落'], trouble: '这学期课程跟不上，越落越多，最近什么都提不起劲，也不太想见人', dur: '几个月', impact: '影响很大', sleep: '变化很大', support: '不太确定', expect: '想有人听我说说', extra: '希望老师说话慢一点，我比较紧张' }, C: { topics: ['情绪低落'], trouble: '感觉很累，提不起劲', dur: '几个月', impact: '影响很大', sleep: '变化很大', support: '没有', expect: '还不确定', extra: '' }, D: { topics: ['学业压力'], trouble: '毕业去向很焦虑，晚上经常想这件事', dur: '几个月', impact: '有些影响', sleep: '有些变化', support: '有', expect: '想要具体的建议', extra: '' } }[S.scen];
    ik.qs.forEach(q => { if (ik.ans[q.k] == null) ik.ans[q.k] = q.k in A ? A[q.k] : q.type === 'single' ? (q.opts || [])[0] : q.type === 'multi' ? [] : ''; }); ik.crisisAt = -1; ikToReview(); S.ikOk = true; },
});
MODALS.ikAdd = () => `<div class="mo l"><button class="x" data-act="close" aria-label="close">${I('x')}</button><h3>${L('追加补充', 'Add a note')}</h3><p style="color:var(--ink2)">${L('老师已经看过你的摘要。新的想法可以追加在这里，老师会收到。', 'Your counsellor has read your summary. Add anything new here.')}</p><textarea class="inp" data-bind="ikAddT" placeholder="${L('例如：这两天又发生了一件事…', 'e.g. something else happened…')}"></textarea><div class="acts"><button class="btn sec" data-act="close">${L('取消', 'Cancel')}</button><button class="btn pri" data-act="ikAddOk">${L('追加', 'Add')}</button></div></div>`;
document.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229 && (e.target.id === 'ikTxt' || e.target.id === 'ikOwn') && S.ik) { e.preventDefault(); ACT.ikNextQ(); render(); const i = $('#ikTxt') || $('#ikOwn'); if (i) i.focus(); } });
/* 入口 B 的倒计时：每秒刷新；剩 2 分钟时整页重绘出提醒；到时自动提交 */
setInterval(() => { if (!S || !S.hold || !S.hold.until) return; const left = S.hold.until - Date.now();
  if (left <= 0) { ikTimeout(); render(); return; }
  document.querySelectorAll('.ikcd').forEach(e => e.textContent = ikCdTxt());
  if (left < 120e3 && !S.hold.warned) { S.hold.warned = true; render(); } }, 1000);

/* v1.13 · 普测「这次不参加」：不影响其他服务；首页任务卡改成可回来参加；机构端名单显示「已拒绝」，不再提醒 */
MODALS.declAsk = () => `<div class="mo"><h3>${L('这次不参加普测？', 'Skip this wellbeing check?')}</h3><p style="color:var(--ink2)">${L('参加是自愿的。不参加不会影响你预约咨询、使用心理园区等其他服务，学校也不会再就这次普测提醒你。截止前想参加，随时可以从首页回来。', 'Taking part is voluntary. Skipping won’t affect booking a counsellor, the wellbeing hub or any other service, and you won’t get more reminders about this check. You can come back from Home anytime before the due date.')}</p>
  <div class="acts"><button class="btn sec" data-act="close">${L('再想想', 'Go back')}</button><button class="btn pri" data-act="declOk">${L('确认不参加', 'Skip this time')}</button></div></div>`;
Object.assign(ACT, {
  declAsk() { S.modal = 'declAsk'; },
  declOk() { const t = S.task; S.modal = null; if (!t) return; t.declined = new Date(NOW); S.page = 'home'; toast(L('好的，你可以随时回来参加', 'Okay. You can come back anytime.')); },
  declUndo(id) { const t = S.tasks.find(x => x.id === id); if (!t) return; t.declined = null; ACT.taskGo(id); },
});
