/* =====================================================================
   v1.13（2026-10-19）
   1. 预咨询小屿：设置里新增「预咨询」标签（题目模板、开场白、两套模板、版本记录、学生视角预览）；摘要按表单显示
   2. 学生第一次预约（预咨询）直接预约成功：老师看到「新预约」，点「知道了」；改期、取消仍需老师同意
===================================================================== */

/* ---------- 1. 预咨询模板（和学生端 intake.js 的默认模板一致） ---------- */
const IKT_Q = {
  topics: { k: 'topics', type: 'multi', useTopics: 1, name: '想聊的话题', say: '这次最想和老师聊的是什么？可以多选，也可以自己写。', sayEn: 'What would you most like to talk about? Pick any, or add your own.', skip: 1 },
  trouble: { k: 'trouble', type: 'text', name: '最困扰的事（原话）', say: '现在最困扰你的一件事是什么？用你自己的话说说就好。', sayEn: 'What’s troubling you most right now? In your own words.', skip: 1, probe: 1, probeText: '能再多说一点吗？比如这件事一般在什么时候最明显？', probeEn: 'Could you say a little more? For example, when is it most noticeable?' },
  dur: { k: 'dur', type: 'single', name: '持续多久', say: '这种情况大概持续多久了？', sayEn: 'How long has this been going on?', opts: ['一两周', '一个月左右', '几个月', '更久'], optsEn: ['A week or two', 'About a month', 'A few months', 'Longer'], skip: 1 },
  impact: { k: 'impact', type: 'single', name: '影响', say: '它对你的学习和生活影响有多大？', sayEn: 'How much is it affecting your study and daily life?', opts: ['还好，能应付', '有些影响', '影响很大'], optsEn: ['I can manage', 'Somewhat', 'A lot'], skip: 1 },
  sleep: { k: 'sleep', type: 'single', name: '睡眠和饮食', say: '最近两周，你的睡眠和饮食有变化吗？', sayEn: 'In the last two weeks, have your sleep or eating changed?', opts: ['没什么变化', '有些变化', '变化很大'], optsEn: ['Not really', 'Some change', 'A big change'], skip: 1 },
  support: { k: 'support', type: 'single', name: '身边的支持', say: '遇到困难的时候，身边有可以说话的人吗？', sayEn: 'When things are hard, is there someone you can talk to?', opts: ['有', '不太确定', '没有'], optsEn: ['Yes', 'Not sure', 'No'], skip: 1 },
  expect: { k: 'expect', type: 'single', name: '希望得到的帮助', say: '你希望这次见面帮到你什么？', sayEn: 'What would you like from this first meeting?', opts: ['想有人听我说说', '想要具体的建议', '想解决一个具体问题', '还不确定'], optsEn: ['Someone to listen', 'Practical advice', 'Solve a specific problem', 'Not sure yet'], skip: 1 },
  extra: { k: 'extra', type: 'text', name: '补充', say: '还有什么想先让老师知道的吗？没有的话可以直接跳过。', sayEn: 'Anything else you’d like your counsellor to know first? Skip if not.', skip: 1 },
};
const IKT_MAX = 8, IKT_TYPES = { single: '单选', multi: '多选', text: '简答' };
const iktClone = o => JSON.parse(JSON.stringify(o));
RULES.ikt = { ver: 1,
  open: '你好，我是预咨询小屿。为了在见面前更好地了解你，我想先问你几个问题，大约 3 分钟。你的回答会整理好给{接待老师}看，也会帮中心之后为你安排更合适的咨询老师。上次普测时，你聊到了{上次聊到的话题}，这次可以从这里聊起，也可以聊完全不同的事。',
  openEn: 'Hi, I’m Xiaoyu on the intake desk. To get to know you a little before you meet, I’d like to ask a few questions — about 3 minutes. I’ll put your answers together for {接待老师}, and it also helps UCC arrange the right counsellor for you later. Last time you talked about {上次聊到的话题} — you can start there, or with something else entirely.',
  close: '谢谢你。我把你说的整理成了下面这张表，你可以直接修改，确认没问题再发给{接待老师}。',
  closeEn: 'Thank you. Here’s what you shared — edit anything you like, then send it to {接待老师}.',
  t1: ['topics', 'trouble', 'dur', 'impact', 'expect', 'extra'].map(k => iktClone(IKT_Q[k])),
  t2: ['topics', 'trouble', 'dur', 'impact', 'sleep', 'support', 'expect', 'extra'].map(k => iktClone(IKT_Q[k])), t2on: false };
const iktSnap = () => { const o = iktClone(RULES.ikt); delete o.hist; return o; };
RULES.ikt.hist = [{ ver: 1, at: ago(24 * 20), by: 'c5', note: '默认模板', snap: iktSnap() }];
/* 预计用时（秒）：多选 20、单选 10、简答 40，简答追问再加 20（学生端用同一算法） */
const iktSecs = qs => qs.reduce((n, q) => n + (q.type === 'text' ? 40 + (q.probe ? 20 : 0) : q.type === 'multi' ? 20 : 10), 0);
const iktMin = qs => Math.max(1, Math.round(iktSecs(qs) / 60));
const iktEdC = () => S.role === 'L3';                 // 题目和文字：中心负责人（L3）
const iktEdS = () => isAdm();                         // 位置和开关：系统管理员
const iktD = () => S.iktD || (S.iktD = iktClone(iktSnap()));
const iktDirty = () => !!S.iktD && JSON.stringify(S.iktD) !== JSON.stringify(iktSnap());
function iktQRow(tk, q, i, n, ed) {
  const dis = ed ? '' : 'disabled', a = `${tk}|${i}`;
  return `<div class="iktq"><div class="iktq-h"><b>第 ${i + 1} 题</b><select data-ik="q|${a}|type" ${dis} ${q.useTopics ? 'disabled title="话题题固定为多选"' : ''}>${Object.entries(IKT_TYPES).map(([v, l]) => `<option value="${v}" ${q.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <label><input type="checkbox" data-ik="q|${a}|skip" ${q.skip ? 'checked' : ''} ${dis}> 可跳过</label>${q.type === 'text' ? `<label><input type="checkbox" data-ik="q|${a}|probe" ${q.probe ? 'checked' : ''} ${dis}> 回答很短时追问一次</label>` : ''}${q.useTopics ? '<span class="pill">选项取自中心的话题列表</span>' : ''}
      <span class="sp"></span>${ed ? `<button class="btn ghost xs" data-act="iktMv" data-arg="${a}|-1" ${i ? '' : 'disabled'}>上移</button><button class="btn ghost xs" data-act="iktMv" data-arg="${a}|1" ${i < n - 1 ? '' : 'disabled'}>下移</button><button class="btn ghost xs" data-act="iktDel" data-arg="${a}" ${n > 1 ? '' : 'disabled'}>删除</button>` : ''}</div>
    <div class="iktq-b"><label>小屿怎么问<input class="in" data-ik="q|${a}|say" value="${esc(q.say)}" ${dis}></label>
      <label>摘要里的名称<input class="in" data-ik="q|${a}|name" value="${esc(q.name)}" ${dis}></label>
      ${q.type !== 'text' && !q.useTopics ? `<label class="w">选项（用「、」隔开）<input class="in" data-ik="q|${a}|opts" value="${esc((q.opts || []).join('、'))}" ${dis}></label>` : ''}
      ${q.type === 'text' && q.probe ? `<label class="w">追问的话<input class="in" data-ik="q|${a}|probeText" value="${esc(q.probeText || '')}" ${dis}></label>` : ''}</div></div>`;
}
function intakeSettings() {
  const d = iktD(), edC = iktEdC(), edS = iktEdS(), tk = S.iktTab || 't1', qs = d[tk], mins = iktMin(qs), long = iktSecs(qs) > 300, r = RULES.ikt;
  const who = edC && edS ? '' : edC ? '<p class="note">你可以修改题目和文字；放在哪一步、是否启用模板二由系统管理员设置。</p>' : edS ? '<p class="note">你可以设置放在哪一步、是否启用模板二；题目和文字由中心负责人修改。</p>' : '<p class="note">只读。</p>';
  return `<p class="intro">${I('info', 's')}学生第一次预约时，预咨询小屿一次问一道题，最后整理成一张表，学生确认后才发给接待老师。只收集，不评分，不改变等级；辅导员看不到。${who}</p>
  <div class="card"><h3><img src="${MASCOT_IK}" alt="" style="width:24px;height:24px;border-radius:7px;vertical-align:middle;margin-right:6px">放在预约的哪一步<span class="sp"></span><small>系统管理员设置</small></h3>
    <p style="font-size:13.5px">位置：<select data-bind="intakeMode" data-rerender ${edS ? '' : 'disabled'}>${Object.entries(IKM).map(([v, n]) => `<option value="${v}" ${RULES.intakeMode === v ? 'selected' : ''}>${n}</option>`).join('')}</select></p>
    <table class="t"><tr><th>选项</th><th>好处</th><th>风险</th></tr><tr class="${RULES.intakeMode === 'A' ? 'sel' : ''}"><td>A · 预约申请提交后</td><td>时段先锁住，不会被抢；不给求助增加门槛</td><td>学生可能跳过不聊，老师拿不到摘要</td></tr><tr class="${RULES.intakeMode === 'B' ? 'sel' : ''}"><td>B · 选好时段后、提交前</td><td>聊完才提交，摘要齐全；时段暂留 15 分钟，剩 2 分钟时提醒，到时自动提交预约，已答内容存为「已保存未发送」</td><td>多一步，可能有学生聊到一半放弃</td></tr><tr class="${RULES.intakeMode === 'C' ? 'sel' : ''}"><td>C · 关闭</td><td>流程最短</td><td>老师见面前对学生想聊什么一无所知</td></tr></table>
    <p style="font-size:13.5px;margin-top:10px"><span class="sw ${d.t2on ? 'on' : ''} ${edS ? '' : 'lk'}" ${edS ? 'data-act="iktT2"' : ''} style="cursor:${edS ? 'pointer' : 'default'};vertical-align:middle"></span> 启用模板二：名单外的学生，或 3 个月内没有完成普测的学生，用模板二（多问睡眠饮食和身边的支持）</p></div>
  <div class="card"><h3>开场白和结束语<span class="sp"></span><small>中心负责人修改</small></h3>
    <label class="iktl">开场白（学生提交预约后看到的大窗口）<textarea class="in" data-ik="open" ${edC ? '' : 'disabled'}>${esc(d.open)}</textarea></label>
    <label class="iktl">结束语（最后确认摘要时）<textarea class="in" data-ik="close" ${edC ? '' : 'disabled'}>${esc(d.close)}</textarea></label>
    <p class="note">可以用的变量：{接待老师}、{上次聊到的话题}。变量为空时（比如 3 个月内没有普测记录），这句话整句不显示。英文版由中心另行翻译，演示里沿用默认英文。</p></div>
  <div class="card"><h3>题目<span class="sp"></span><small>一次只问一道题；最多 ${IKT_MAX} 题</small></h3>
    <div class="tabs">${[['t1', `模板一 · 名单内、3 个月内做过普测（${d.t1.length} 题）`], ['t2', `模板二 · 其他学生（${d.t2.length} 题）${d.t2on ? '' : ' · 未启用'}`]].map(([k, n]) => `<button class="${tk === k ? 'on' : ''}" data-act="iktTab" data-arg="${k}">${n}</button>`).join('')}</div>
    <p class="iktime ${long ? 'warn' : ''}">${I('clock', 's')}预计学生用时约 ${mins} 分钟${long ? ' · 超过 5 分钟，学生更容易中途放弃，建议精简' : ''}</p>
    ${qs.map((q, i) => iktQRow(tk, q, i, qs.length, edC)).join('')}
    ${edC ? `<div style="display:flex;gap:8px;align-items:center;margin-top:10px"><select data-ik="addType"><option value="single">单选</option><option value="multi">多选</option><option value="text">简答</option></select><button class="btn sec xs" data-act="iktAdd" ${qs.length >= IKT_MAX ? 'disabled' : ''}>${I('plus', 's')}加一道题</button>${qs.length >= IKT_MAX ? `<span class="note">已到 ${IKT_MAX} 题上限</span>` : ''}</div>` : ''}
    <div class="iktbar"><button class="btn sec" data-act="mo" data-arg="iktPrev:${tk}">${I('user', 's')}用学生视角预览</button><span class="sp"></span>${iktDirty() ? '<span class="note" style="color:var(--warn)">有未保存的修改</span><button class="btn ghost" data-act="iktUndo">放弃修改</button>' : ''}${edC || edS ? `<button class="btn pri" data-act="iktSave" ${iktDirty() ? '' : 'disabled'}>保存为第 ${r.ver + 1} 版</button>` : ''}</div>
    <p class="note">保存后，新预约的学生用新版；已经「先保存」的学生继续用他开始时的版本，不会被打乱。</p></div>
  <div class="card"><h3>版本记录<span class="sp"></span><small>每次保存和恢复都记入操作记录</small></h3>
    <table class="t"><tr><th>版本</th><th>时间</th><th>修改人</th><th>说明</th><th></th></tr>${r.hist.slice().reverse().map(h => `<tr><td>第 ${h.ver} 版${h.ver === r.ver ? ' <span class="pill g">当前</span>' : ''}</td><td>${fmt(h.at)}</td><td>${ST(h.by).name}</td><td>${esc(h.note)}</td><td>${h.ver !== r.ver && edC ? `<button class="btn ghost xs" data-act="iktRestore" data-arg="${h.ver}">恢复这一版</button>` : ''}</td></tr>`).join('')}</table></div>`;
}
function iktPreview(tk) { const high = typeof ikBankCur !== 'undefined' && ikBankCur === 'h', d = iktD(), qs = d[tk], fill = t => esc(t).replace('{接待老师}', '<b>李文老师</b>').replace(/[^。]*\{上次聊到的话题\}[^。]*。/, m => m.replace('{上次聊到的话题}', '<b>睡眠、学业压力</b>'));
  const opening = high ? `<div class="ikpv-w"><img src="${MASCOT_IK}" alt=""><div><small>接受心理中心邀约后，直接进入预咨询；开场白显示在第一题上面</small><p>${fill(d.open)}</p></div></div>` : `<div class="ikpv-w"><img src="${MASCOT_IK}" alt=""><div><small>预约申请提交后学生看到的大窗口</small><p>${fill(d.open)}</p><div class="ikpv-b"><span>这次先不用</span><span class="on">好的，开始（约 ${iktMin(qs)} 分钟）</span></div></div></div>`;
  return `<div class="ikpv">${opening}
    <div class="ikpv-q">${qs.map((q, i) => `<div><small>第 ${i + 1} / ${qs.length} 题 · ${IKT_TYPES[q.type]}${q.skip ? ' · 可跳过' : ''}</small><b>${esc(q.say)}</b>${q.type === 'text' ? '<span class="ikpv-t">学生自己写</span>' : `<span class="ikpv-o">${(q.useTopics ? ['学业压力', '情绪低落', '睡眠', '人际关系', '…'] : q.opts || []).map(o => `<i>${esc(o)}</i>`).join('')}</span>`}</div>`).join('')}</div>
    <p class="note">最后一步：${fill(d.close)}<br>学生可以修改表里每一项，勾选「同意把这份摘要发给接待我的老师」后才会发送。</p></div>`; }
/* 输入：草稿先存在 S.iktD，点「保存为第 N 版」才生效 */
document.addEventListener('input', e => { const p = e.target.dataset.ik; if (!p || p === 'addType') return; const d = iktD(), v = e.target.value;
  if (p === 'open' || p === 'close') { d[p] = v; } else { const [, tk, i, f] = p.split('|'), q = d[tk][+i]; if (!q) return;
    if (f === 'skip' || f === 'probe') q[f] = e.target.checked ? 1 : 0; else if (f === 'opts') q.opts = v.split(/[、,，]/).map(x => x.trim()).filter(Boolean); else if (f === 'type') { q.type = v; if (v !== 'text') { q.opts = q.opts && q.opts.length ? q.opts : ['选项一', '选项二']; q.probe = 0; } }
    else q[f] = v; }
  if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') render();
  else { const bar = document.querySelector('.iktbar'); if (bar && !bar.querySelector('.note')) render(); } });
Object.assign(ACT, {
  iktTab(k) { S.iktTab = k; },
  iktT2() { if (!iktEdS()) return; const d = iktD(); d.t2on = !d.t2on; },
  iktMv(a) { const [tk, i, dir] = a.split('|'), L = iktD()[tk], j = +i + +dir; [L[+i], L[j]] = [L[j], L[+i]]; },
  iktDel(a) { const [tk, i] = a.split('|'), L = iktD()[tk]; if (L.length > 1) L.splice(+i, 1); },
  iktAdd() { const d = iktD(), tk = S.iktTab || 't1'; if (d[tk].length >= IKT_MAX) return toast(`最多 ${IKT_MAX} 题`); const t = (document.querySelector('[data-ik="addType"]') || {}).value || 'single';
    d[tk].push({ k: 'q' + Date.now().toString(36), type: t, name: '新的一项', say: '（写下小屿要问的话）', opts: t === 'text' ? [] : ['选项一', '选项二'], skip: 1, probe: 0 }); },
  iktUndo() { S.iktD = null; toast('已放弃修改'); },
  iktSave() { if (!iktDirty()) return; const was = iktSnap(), d = S.iktD, r = RULES.ikt, ch = [];
    if (d.open !== was.open || d.close !== was.close) ch.push('开场白 / 结束语'); ['t1', 't2'].forEach(k => { if (JSON.stringify(d[k]) !== JSON.stringify(was[k])) ch.push(`${k === 't1' ? '模板一' : '模板二'}题目（${was[k].length} → ${d[k].length} 题）`); });
    if (d.t2on !== was.t2on) ch.push(`模板二 ${d.t2on ? '启用' : '停用'}`);
    if (!iktEdS()) d.t2on = was.t2on; if (!iktEdC()) { d.open = was.open; d.close = was.close; d.t1 = was.t1; d.t2 = was.t2; }
    Object.assign(r, iktClone(d), { ver: r.ver + 1 }); r.hist.push({ ver: r.ver, at: new Date(NOW), by: me(), note: ch.join('；') || '修改', snap: iktSnap() }); S.iktD = null;
    log(`预咨询模板 · 第 ${r.ver} 版：${ch.join('；')}`, null, { cat: '配置', obj: '预咨询' }); toast(`已保存为第 ${r.ver} 版，新预约的学生开始使用；已记入操作记录`); },
  iktRestore(v) { const r = RULES.ikt, h = r.hist.find(x => x.ver === +v); if (!h) return; Object.assign(r, iktClone(h.snap), { ver: r.ver + 1 }); r.hist.push({ ver: r.ver, at: new Date(NOW), by: me(), note: `恢复第 ${h.ver} 版`, snap: iktSnap() }); S.iktD = null;
    log(`预咨询模板 · 恢复第 ${h.ver} 版（存为第 ${r.ver} 版）`, null, { cat: '配置', obj: '预咨询' }); toast(`已恢复第 ${h.ver} 版内容，存为第 ${r.ver} 版`); },
  bSeen(id) { const b = BOOK.find(x => x.id === id); if (!b) return; b.fresh = false; log('查看新预约（预约已成功，无需确认）', SU(b.sid), { cat: '预约', k: 'book' }); toast('已标记为看过'); },
});
/* 设置：加「预咨询」标签（系统管理员、中心负责人可见） */
const _st13 = settings; settings = function () { const can = isAdm() || S.role === 'L3', want = S.tabs.settings;
  if (want === 'intake' && can) { S.tabs.settings = 'audit'; let h; try { h = _st13(); } finally { S.tabs.settings = 'intake'; }
    h = h.replace('class="on" data-act="settab" data-arg="audit"', 'class="" data-act="settab" data-arg="audit"');
    const t = h.indexOf('<div class="tabs">'), e = h.indexOf('</div>', t) + 6; return h.slice(0, e).replace('<button class="" data-act="settab" data-arg="audit">', '<button class="on" data-act="settab" data-arg="intake">预咨询</button><button class="" data-act="settab" data-arg="audit">') + intakeSettings() + '</div>'; }
  let h = _st13(); if (can) h = h.replace(/(<button class="[^"]*" data-act="settab" data-arg="audit">)/, '<button class="" data-act="settab" data-arg="intake">预咨询</button>$1'); return h; };
PAGES.settings = settings;

/* ---------- 摘要：按表单显示；谁能看：接待老师、中心负责人、之后的负责咨询师；每次查看记入操作记录 ---------- */
const ikRows = it => Array.isArray(it.sum) ? it.sum : it.sum ? [['topics', '想聊的话题'], ['trouble', '最困扰的事（原话）'], ['dur', '持续多久'], ['impact', '影响'], ['expect', '希望得到的帮助'], ['extra', '补充']].map(([k, name]) => ({ k, name, v: Array.isArray(it.sum[k]) ? it.sum[k].join('、') : it.sum[k] || '' })) : [];
const ikMayView = b => { if (!b || isL1() || S.role === 'ADM') return false; const s = SU(b.sid); return S.role === 'L3' || me() === b.cid || (s && s.owner === me()); };
intakeBox = function (b, wide) { const it = ikOf(b), s = SU(b.sid); if (!it || it.st === 'draft' || !it.sum || !ikMayView(b)) return '';
  const rows = ikRows(it), adds = it.adds || [];
  return `<div class="dbox ikbox"><b>${I('chat', 's')}预咨询摘要 · ${nm(s)}<span class="sp"></span><small class="note">学生 ${fmt(it.at)} 发送${it.ver > 1 ? ` · 第 ${it.ver} 版` : ''}${it.tk === 't2' ? ' · 模板二' : ''}${it.viewed ? ' · 已查看' : ''}</small></b>
    ${it.crisis ? `<p style="color:var(--crit);margin:6px 0 0">${I('alert', 's')} 学生在预咨询里提到了安全相关的内容，已立即按危机流程处理（不论是否发送摘要）</p>` : ''}
    <div class="ikform2">${rows.map(x => `<div class="${x.k === 'trouble' || x.k === 'extra' || (x.v || '').length > 24 ? 'w' : ''}"><label>${esc(x.name)}</label><p>${x.v ? (x.k === 'trouble' ? `「${esc(x.v)}」` : esc(x.v).replace(/\n/g, '<br>')) : '<span class="note">学生跳过了</span>'}</p></div>`).join('')}</div>
    ${adds.length ? `<div class="ikadds"><label>学生追加的补充</label>${adds.map(a => `<p><small class="note">${fmt(new Date(a.at))}</small> ${esc(a.t)}</p>`).join('')}</div>` : ''}
    <p class="note" style="margin:6px 0 0">由预咨询小屿整理、学生本人确认后发送；只收集信息，不评分，不改变等级。能看到的人：接待老师、中心负责人、之后负责的咨询师；辅导员看不到。每次查看都记入操作记录。</p></div>`; };
const _mv12 = markViewed; markViewed = b => { const it = ikOf(b); if (!it || !it.sum || !ikMayView(b)) return; const k = `${me()}|${it.ver}`; it.seen = it.seen || {};
  if (!it.seen[k]) { it.seen[k] = 1; if (!(it.st === 'sent' && !it.viewed && me() === b.cid)) log('查看预咨询摘要', SU(b.sid), { cat: '查看', noTl: 1 }); }
  _mv12(b); };
/* 预约改给别的老师（改派、待办池指派）：摘要跟着预约走，新老师的「已查看」重新计算 */
['assignBOk'].forEach(n => { if (!ACT[n]) return; const f = ACT[n]; ACT[n] = function (id) { const b = BOOK.find(x => x.id === id), c0 = b && b.cid; const r = f.apply(this, arguments); if (b && b.cid !== c0 && b.intake) { b.intake.viewed = false; } return r; }; });
/* 老师对「新预约」做了任何处理（改约、婉拒）也算看过 */
['bMoveOk', 'bNoOk'].forEach(n => { const f = ACT[n]; ACT[n] = function (id) { const b = BOOK.find(x => x.id === id); const r = f.apply(this, arguments); if (b && S.mo == null) b.fresh = false; return r; }; });
/* 简报：新预约 */
const _bL2_13 = briefL2; briefL2 = function () { const b = _bL2_13();
  const nb = BOOK.filter(x => x.cid === me() && x.st === 'ok' && x.fresh);
  if (nb.length) b.secs.splice(1, 0, { t: `新预约（${nb.length}）`, all: 1, items: nb.map(x => it(`${nm(SU(x.sid))} 预约成功：${slotTxt(x)} · ${x.kind} · ${x.mode}。不用确认，看过点「知道了」。`, 'bview', 'fresh', '查看')) });
  return b; };
const ikTopicsTxt = it => { const r = ikRows(it).find(x => x.k === 'topics'); return r && r.v ? r.v : '—'; };

/* ---------- 合并试用版联动 ---------- */
if (typeof LY_in === 'function') {
  const _lyIn13 = LY_in; LY_in = function (ev) {
    if (ev.t === 'intake') { const s = LY_CORE()[ev.core], b = s && lyBook(s), x = ev.intake; if (!b || !x) return '';
      const old = b.intake || {}, nAdd = (x.adds || []).length - (old.adds || []).length;
      if (old.st === 'sent' && x.st === 'sent' && nAdd > 0) { b.intake = Object.assign({}, old, { ver: x.ver, adds: x.adds, crisis: old.crisis || x.crisis, newAdd: true });
        log('学生在学生端追加了预咨询补充', s, { cat: '预约', k: 'book', sys: 1 }); notify(b.cid, '站内', `${nm(s)} 追加了预咨询补充`, b.id); if (S.uid) render(); return `${s.name} 追加了补充，${ST(b.cid).name} 能看到`; }
      const r = _lyIn13(ev); if (b.intake) Object.assign(b.intake, { tk: x.tk, tv: x.tv, adds: x.adds || [] }); lySnapNow(); return r; }
    const r = _lyIn13(ev); lySnapNow(); return r; };
  /* 没登录时机构端不重绘，也要把最新状态告诉外壳（否则下一次比较会拿到过期的预约） */
  const lySnapNow = () => { if (S.uid || window.parent === window) return; try { window.parent.postMessage({ ly: 1, side: LY_SIDE, t: 'snap', snap: LY_snap() }, '*'); } catch (e) {} };
  const _lySnap13 = LY_snap; LY_snap = function () { const o = _lySnap13(), no = {};
    Object.entries(LY_CORE()).forEach(([k, s]) => { if (!o[k]) { const last = BOOK.filter(b => b.sid === s.id).slice(-1)[0]; if (last && last.st === 'no') no[k] = 1; } });
    o.__no = no; o.__cfg = { intakeMode: RULES.intakeMode, ikt: iktSnap() }; return o; };
}
const _md13 = modal; modal = function () { const [k, id] = (S.mo || '').split(':');
  if (k === 'iktPrev') return `<div class="ov" data-act="ovClose"><div class="mo wide"><h3>学生视角预览 · ${typeof ikBankCur !== 'undefined' && ikBankCur === 'h' ? '高危咨询 · 接受邀约后' : id === 't2' ? '普通咨询 · 模板二' : '普通咨询 · 模板一'}</h3><p>${iktDirty() ? '预览的是还没保存的修改。' : '预览的是当前生效的版本。'}</p>${iktPreview(id)}<div class="acts"><button class="btn sec" data-act="moClose">关闭</button></div></div></div>`;
  return _md13(); };

/* =====================================================================
   3. 谈心任务按关注等级自动派发（10/19 用户确认）
   · 中心负责人在「设置 → 谈心频率」里配置：关注等级 → 最近 N 天谈心 M 次（默认 30 天 2 次）
   · 系统每天检查随访中的学生，不够就给辅导员派任务；任务卡只写频率和截止日，不写等级
   · 同一层级之间可以改派，优先推荐最近谈过的辅导员；超期先在简报标红，再超期通知中心
   · 和手填「下次谈心」、中心「请安排一次谈心」共用同一份谈心记录
===================================================================== */
RULES.talkFreq = { 5: { n: 2, d: 30 }, 4: { n: 2, d: 30 }, 3: { n: 2, d: 30 }, 2: { n: 2, d: 30 } };
RULES.talkFreqHist = [];
const TT = {};                                  // 学生 id → 当前任务 { sid, to, lv, n, d, at, due, moved:[], warned }
const TT_DUE_D = 7, TT_ESC_D = 7;               // 生成后 7 天截止；超期再 7 天通知中心
const ttEligible = s => s.stage === 'follow' && curLv(s) >= 2 && RULES.talkFreq[curLv(s)] && RULES.talkFreq[curLv(s)].n > 0;
const ttCount = (s, d) => TALKS.filter(t => t.sid === s.id && (NOW - t.at) / 864e5 <= d).length;
const ttOpen = (u = me()) => Object.values(TT).filter(t => !t.done && t.to === u);
const ttOver = t => !t.done && t.due < NOW, ttEsc = t => !t.done && (NOW - t.due) / 864e5 >= TT_ESC_D;
const ttReq = t => `最近 ${t.d} 天谈心 ${t.n} 次`;
function ttSync(quiet) {
  STU.forEach(s => { const cur = TT[s.id];
    if (!ttEligible(s)) { if (cur && !cur.done) { cur.done = { at: new Date(NOW), why: '不再需要' }; } return; }
    const lv = curLv(s), f = RULES.talkFreq[lv];
    if (cur && !cur.done) { if (cur.lv !== lv) { Object.assign(cur, { lv, n: f.n, d: f.d }); if (!quiet) log(`谈心任务按新频率重算：${ttReq(cur)}`, s, { k: 'talkTask', sys: 1, noTl: 1 }); }
      if (ttCount(s, cur.d) >= cur.n) { cur.done = { at: new Date(NOW), why: '已达到频率' }; if (!quiet) log('谈心任务完成', s, { k: 'talkTask', sys: 1, noTl: 1 }); } return; }
    if (ttCount(s, f.d) >= f.n) return;
    const to = s.follower || FOLLOWER_OF[s.college]; if (!to) return;
    TT[s.id] = { sid: s.id, to, lv, n: f.n, d: f.d, at: new Date(NOW), due: later(TT_DUE_D * 24), moved: [] };
    if (!quiet) { log(`系统派发谈心任务：${ttReq(TT[s.id])}`, s, { k: 'talkTask', sys: 1, noTl: 1 }); notify(to, '站内', `新的谈心任务：${s.name}`, s.id); } });
  Object.values(TT).forEach(t => { if (ttEsc(t) && !t.escd) { t.escd = new Date(NOW); notify('c5', '站内', `谈心任务超期 ${TT_ESC_D} 天以上：${SU(t.sid).college} 1 位学生`, t.sid); if (!quiet) log('谈心任务超期，已通知中心', SU(t.sid), { k: 'talkTask', sys: 1, noTl: 1 }); } });
}
/* 演示数据：随访中的学生，三分之一最近谈过 2 次，三分之一谈过 1 次，其余还没谈；有两条任务已超期 */
(() => { const P = ['例行关心：学生说这周课程比较满，作息基本规律。', '学生说和室友相处还好，周末去了图书馆复习。', '电话关心，学生说期中考试准备得差不多了。', '面谈：学生提到最近有点累，已经在调整作息。'];
  const fs = STU.filter(s => ttEligible(s) && ['u1', 'u2'].includes(s.follower)); let j = 0;
  fs.forEach((s, i) => { const k = i % 3, mk = h => { const t = addTalk({ sid: s.id, by: s.follower, mode: ['面谈', '电话', '线上'][(i + h) % 3], place: '', points: P[(i + h) % P.length], need: '', next: '不需要', from: '自发' }); t.at = ago(h); const e = s.tl[s.tl.length - 1]; e.at = ago(h); t.seed = 1; };
    if (k === 0) { mk(24 * (4 + i % 5)); mk(24 * (16 + i % 7)); } else if (k === 1) mk(24 * (6 + i % 9)); });
  ttSync(true);
  Object.values(TT).forEach(t => { j++; const back = j === 2 ? 10 : j === 5 ? 16 : j % 4 + 1; t.at = ago(24 * back); t.due = new Date(t.at.getTime() + TT_DUE_D * 864e5); });
  Object.values(TT).forEach(t => { if (ttEsc(t)) t.escd = t.due; });
})();
/* 谈心任务列表（工作台、学生工作页共用） */
function ttTable(list) { if (!list.length) return `<div class="empty"><img src="${MASCOT}" alt="">没有谈心任务</div>`;
  return `<table class="t"><tr><th>学生</th><th>学院 · 年级</th><th>要求</th><th>截止</th><th>来源</th><th style="width:220px"></th></tr>${list.slice().sort((a, b) => a.due - b.due).map(t => { const s = SU(t.sid), k = ttCount(s, t.d);
    return `<tr class="${ttEsc(t) ? 'crit' : ''}"><td><b>${isL1() ? s.name : nm(s)}</b><small>${s.sid}</small></td><td>${s.college} · ${s.year}</td><td>${ttReq(t)}<small>已谈 ${k} 次，还差 ${Math.max(0, t.n - k)} 次</small></td><td>${ttOver(t) ? `<span class="due r">已超期 ${Math.floor((NOW - t.due) / 864e5) || 1} 天</span>${ttEsc(t) ? '<small>已通知中心</small>' : ''}` : fmt(t.due)}</td><td>系统按频率派发${t.moved.length ? `<small>由 ${ST(t.moved[t.moved.length - 1].from).name} 改派</small>` : ''}</td>
      <td><button class="btn pri xs" data-act="mo" data-arg="talk:${s.id}">写谈心记录</button> <button class="btn ghost xs" data-act="mo" data-arg="ttMove:${s.id}">改派</button></td></tr>`; }).join('')}</table>
    <p class="note">谈心任务由系统按中心设定的频率派发，只写频率和截止日。写一条谈心记录就会计入，达到次数后任务自动完成；手填的「下次谈心」和中心的「请安排一次谈心」也记在同一份谈心记录里。</p>`; }
/* 改派：同一层级（辅导员之间），优先推荐最近谈过的 */
function ttMoveBox(s, F) { const t = TT[s.id], L1s = Object.keys(STAFF).filter(u => STAFF[u].role === 'L1' && u !== t.to);
  const talked = u => TALKS.some(x => x.sid === s.id && x.by === u && (NOW - x.at) / 864e5 <= Math.max(30, t.d));
  const L = L1s.sort((a, b) => talked(b) - talked(a));
  return `<div class="ov" data-act="ovClose"><div class="mo"><h3>改派谈心任务 · ${s.name}</h3><p>${ttReq(t)} · 截止 ${fmt(t.due)}。只能改派给其他辅导员；最近和这位学生谈过的老师排在前面。</p>
    <div class="ttpick">${L.map(u => `<label class="${F.to === u ? 'on' : ''}"><input type="radio" name="ttto" ${F.to === u ? 'checked' : ''} data-act="ttTo" data-arg="${u}"> <b>${ST(u).name}</b>${talked(u) ? ' <span class="pill g">最近谈过</span>' : ''}<small>${ST(u).title} · 当前谈心任务 ${ttOpen(u).length} 个</small></label>`).join('')}</div>
    ${fld('改派原因（选填）', ta('why', '例如：本周出差，请郑老师代为谈心'))}
    <div class="acts"><button class="btn sec" data-act="moClose">取消</button><button class="btn pri" data-act="ttMoveGo" data-arg="${s.id}" ${F.to ? '' : 'disabled'}>改派</button></div></div></div>`; }
/* 设置 → 谈心频率（中心负责人修改；系统管理员只读） */
function talkFreqSettings() { const ed = S.role === 'L3', f = RULES.talkFreq, n = Object.values(TT).filter(t => !t.done).length;
  const row = lv => `<tr><td>${lvB(+lv)}</td><td>最近 <select data-tf="${lv}|d" ${ed ? '' : 'disabled'}>${[14, 30, 60].map(x => `<option ${f[lv].d === x ? 'selected' : ''}>${x}</option>`).join('')}</select> 天谈心 <select data-tf="${lv}|n" ${ed ? '' : 'disabled'}>${[0, 1, 2, 3, 4].map(x => `<option value="${x}" ${f[lv].n === x ? 'selected' : ''}>${x || '不派'}</option>`).join('')}</select> ${f[lv].n ? '次' : ''}</td><td>${STU.filter(s => s.stage === 'follow' && curLv(s) === +lv).length} 人</td></tr>`;
  return `<p class="intro">${I('info', 's')}随访中的学生，按关注等级给辅导员派谈心任务。系统每天检查一次：最近一段时间的谈心次数不够，就派一条任务到这位学生的辅导员工作台。辅导员只看到频率和截止日，看不到等级。${ed ? '' : '<br>只读：由中心负责人修改。'}</p>
    <div class="card"><h3>关注等级 → 谈心频率<span class="sp"></span><small>默认每个等级都是最近 30 天 2 次</small></h3>
      <table class="t"><tr><th style="width:140px">关注等级</th><th>频率</th><th>随访中</th></tr>${['5', '4', '3', '2'].map(row).join('')}</table>
      <p class="note">1 级是无需关注，不派谈心任务；危机通道里的学生由中心直接处理，也不派。修改只影响之后新派的任务，已经派出的任务不变；学生等级变化后，按新等级的频率重算。每次修改都记入操作记录。</p></div>
    <div class="card"><h3>任务规则<span class="sp"></span></h3><table class="t">
      <tr><td style="width:180px">派给谁</td><td>默认派给学生的辅导员；辅导员之间可以改派，优先推荐最近和学生谈过的老师（显示「最近谈过」）</td></tr>
      <tr><td>截止</td><td>派出后 ${TT_DUE_D} 天</td></tr><tr><td>超期</td><td>超期后在辅导员的简报里标红；超期 ${TT_ESC_D} 天以上通知中心负责人</td></tr>
      <tr><td>什么算完成</td><td>谈心次数达到频率要求；任何来源的谈心记录（任务、手填的下次谈心、中心请求）都计入</td></tr>
      <tr><td>当前</td><td>进行中的谈心任务 ${n} 个，其中超期 ${Object.values(TT).filter(ttOver).length} 个</td></tr></table></div>
    ${RULES.talkFreqHist.length ? `<div class="card"><h3>修改记录</h3><table class="t">${RULES.talkFreqHist.slice().reverse().map(h => `<tr><td style="width:150px">${fmt(h.at)}</td><td>${ST(h.by).name}</td><td>${esc(h.t)}</td></tr>`).join('')}</table></div>` : ''}`; }
document.addEventListener('change', e => { const p = e.target.dataset.tf; if (!p || S.role !== 'L3') return; const [lv, k] = p.split('|'), f = RULES.talkFreq[lv], was = `${f.d} 天 ${f.n} 次`; f[k] = +e.target.value;
  const t = `${lv} 级：最近 ${was} → ${f.n ? `${f.d} 天 ${f.n} 次` : '不派'}`; RULES.talkFreqHist.push({ at: new Date(NOW), by: me(), t }); log(`谈心频率 · ${t}（只影响之后的任务）`, null, { cat: '配置', obj: '谈心频率' }); toast('已保存，只影响之后新派的任务；已记入操作记录'); render(); });
const _st13b = settings; settings = function () { const can = isAdm() || S.role === 'L3';
  if (S.tabs.settings === 'talkf' && can) { S.tabs.settings = 'audit'; let h; try { h = _st13b(); } finally { S.tabs.settings = 'talkf'; }
    h = h.replace('class="on" data-act="settab" data-arg="audit"', 'class="" data-act="settab" data-arg="audit"');
    const t = h.indexOf('<div class="tabs">'), e = h.indexOf('</div>', t) + 6; return h.slice(0, e).replace('<button class="" data-act="settab" data-arg="audit">', '<button class="on" data-act="settab" data-arg="talkf">谈心频率</button><button class="" data-act="settab" data-arg="audit">') + talkFreqSettings() + '</div>'; }
  let h = _st13b(); if (can) h = h.replace(/(<button class="[^"]*" data-act="settab" data-arg="audit">)/, '<button class="" data-act="settab" data-arg="talkf">谈心频率</button>$1'); return h; };
PAGES.settings = settings;
/* 辅导员：工作台队列、简报、学生工作页 */
const _q13 = queues; queues = function (u = me(), r = S.role) { const q = _q13(u, r); if (r === 'L1') q.push({ k: 'ttask', n: '谈心任务', items: ttOpen(u).map(t => SU(t.sid)) }); return q; };
const _qb13 = queueBody; queueBody = function (q) { if (q.k !== 'ttask') return _qb13(q); return ttTable(ttOpen()); };
const _bL1_13 = briefL1; briefL1 = function () { const b = _bL1_13(), L = ttOpen(), ov = L.filter(ttOver);
  if (L.length) b.secs.splice(b.secs[0] && b.secs[0].red ? 1 : 0, 0, { t: `谈心任务（${L.length}${ov.length ? `，${ov.length} 个已超期` : ''}）`, red: ov.length ? 1 : 0, all: 1,
    items: L.slice().sort((a, c) => a.due - c.due).slice(0, 6).map(t => { const s = SU(t.sid), k = ttCount(s, t.d); return it(`${s.name} · ${ttReq(t)}，已谈 ${k} 次 · ${ttOver(t) ? `<span class="due r">已超期</span>` : `截止 ${fmt(t.due)}`}`, 'mo', `talk:${s.id}`, '写谈心记录'); }).concat(L.length > 6 ? [it(`还有 ${L.length - 6} 个`, 'wtabGo', 'talk', '全部任务')] : []) });
  return b; };
const _bL3_13 = briefL3; briefL3 = function () { const b = _bL3_13(), ov = Object.values(TT).filter(ttEsc);
  if (ov.length) b.secs.push({ t: `谈心任务超期 ${TT_ESC_D} 天以上（${ov.length}）`, items: ov.map(t => it(`${nm(SU(t.sid))} · ${SU(t.sid).college} · ${ST(t.to).name} · ${ttReq(t)}，截止 ${fmt(t.due)}`, 'mo', `ttMove:${t.sid}`, '改派')) });
  return b; };
const _wp13 = workPage; workPage = function () { let h = _wp13(); if ((S.tabs.work || 'talk') !== 'talk') return h; const L = ttOpen();
  return h.replace('<div class="filters"><button class="btn pri xs" data-act="mo" data-arg="talkPick:">', `${L.length ? `<div class="dbox ttbox"><b>谈心任务（${L.length}）<span class="sp"></span><small class="note">系统按中心设定的频率派发</small></b>${ttTable(L)}</div>` : ''}<div class="filters"><button class="btn pri xs" data-act="mo" data-arg="talkPick:">`); };
PAGES.work = workPage;

/* =====================================================================
   4. 谈心记录：保存和追加时检查危机表达；24 小时内可修改，之后只能追加（中心已接手或已查看后立即只能追加）
===================================================================== */
/* v1.16：危机词库由心理中心在「设置 · 危机词库」里维护 */
const CRISIS_WORDS = ['不想活', '活着没意思', '活着没意义', '想死', '去死', '自杀', '轻生', '结束生命', '结束自己', '伤害自己', '自伤', '自残', '割腕', '跳楼', '跳下去', '遗书', '安眠药'];
const TALK_RE = { test: x => CRISIS_WORDS.some(w => w && String(x == null ? '' : x).includes(w)) };
const talkLocked = t => { const s = SU(t.sid); return (NOW - t.at) / H >= 24 || !!t.cseen || (t.center && inCenter(s)); };
const talkLockWhy = t => t.cseen ? '中心已查看' : t.center && inCenter(SU(t.sid)) ? '中心已接手' : '已超过 24 小时';
talkTable = function (list, withStu = true) { if (!list.length) return `<div class="empty"><img src="${MASCOT}" alt="">还没有谈心记录</div>`;
  return `<table class="t"><tr><th>时间</th>${withStu ? '<th>学生</th>' : ''}<th>方式</th><th>谈话要点（事实）</th><th>学生表达的需要</th><th>下次</th><th>中心</th>${isL1() ? '<th></th>' : ''}</tr>${list.slice().sort((a, b) => b.at - a.at).map(t => { const s = SU(t.sid), mine = isL1() && t.by === me();
    return `<tr><td>${fmt(t.at)}<small>${t.from === '中心请求' ? '中心请求' : t.from === '谈心任务' ? '谈心任务' : '自发'} · ${ST(t.by).name}</small>${(t.hist || []).length ? `<small><button class="lnk" data-act="mo" data-arg="talkLog:${t.id}">已修改 ${t.hist.length} 次</button></small>` : ''}</td>${withStu ? `<td><b>${isL1() ? s.name : nm(s)}</b><small>${s.college} · ${s.year}</small></td>` : ''}<td>${t.mode}${t.place ? `<small>${esc(t.place)}</small>` : ''}</td>
      <td style="max-width:340px">${esc(t.points)}${(t.adds || []).map(a => `<small class="tkadd">补充 · ${fmt(a.at)}：${esc(a.t)}</small>`).join('')}${t.noRep ? `<small class="tkrisk">${I('alert', 's')}含安全相关内容 · 辅导员未报告紧急情况（${esc(t.noRep)}）</small>` : t.rep ? `<small class="tkrisk">${I('alert', 's')}含安全相关内容 · 已报告紧急情况</small>` : ''}</td><td>${esc(t.need) || '—'}</td><td>${t.next === '不需要' ? '—' : t.next}${t.nextAt ? `<small>${t.nextAt < NOW ? '<span class="due r">已到期</span>' : fmt(t.nextAt)}</small>` : ''}</td><td>${t.center ? '<span class="pill w">希望中心介入</span>' : t.share ? '<span class="pill">让中心知道</span>' : '<span class="note">仅学院</span>'}</td>
      ${isL1() ? `<td>${mine ? (talkLocked(t) ? `<button class="btn ghost xs" data-act="mo" data-arg="talkAdd:${t.id}">追加补充</button><small class="note">${talkLockWhy(t)}，只能追加</small>` : `<button class="btn ghost xs" data-act="mo" data-arg="talkEdit:${t.id}">修改</button><small class="note">${Math.max(1, Math.ceil(24 - (NOW - t.at) / H))} 小时内可改</small>`) : ''}</td>` : ''}</tr>`; }).join('')}</table>`; };
/* 中心（L2/L3）在档案里看到谈心记录 → 记为「中心已查看」 */
const _dw13 = drawer; drawer = function () { const h = _dw13(); if (isCenter() && S.dw) TALKS.filter(t => t.sid === S.dw.sid && talkVis(t) && !t.cseen).forEach(t => { t.cseen = new Date(NOW); }); return h; };
/* 写记录：先检查危机表达 */
const _talkGo12 = ACT.talkGo;
const talkRisk = F => TALK_RE.test(`${F.points || ''} ${F.need || ''}`);
Object.assign(ACT, {
  talkGo(id) { const F = S.form; if (!F.crisisDone && F.mode && (F.points || '').trim() && F.next && talkRisk(F)) { S.form.crisisFor = id; S.mo = `talkRisk:${id}`; return; }
    const s = SU(id), tt = TT[id], wasTask = tt && !tt.done && tt.to === me(), n0 = TALKS.length; _talkGo12(id); const t = TALKS[TALKS.length - 1]; if (TALKS.length === n0) return;
    if (wasTask && t.from === '自发') t.from = '谈心任务';
    if (F.crisisDone) { t.risk = 1; if (F.crisisDone === 'rep') t.rep = 1; else { t.noRep = F.noRep; t.share = true; } }
    t.hist = []; t.adds = []; ttSync();
    if (F.crisisDone === 'rep') { const note = t.points; S.form = { urgentOnly: 1, sid: id, who: '老师 / 辅导员', note: `谈心时学生说：${note}` }; S.mo = 'report:urgent'; } },
  talkRiskRep(id) { S.form.crisisDone = 'rep'; log('谈心记录含安全相关内容，辅导员选择报告紧急情况', SU(id), { k: 'talkLog', noTl: 1 }); ACT.talkGo(id); },
  talkRiskNo(id) { const r = (S.form.noRepT || '').trim(); if (!r) return toast('请写一句不报告的原因'); S.form.crisisDone = 'no'; S.form.noRep = r;
    log(`谈心记录含安全相关内容，辅导员选择不报告：${r}（已自动让中心知道）`, SU(id), { k: 'talkLog', noTl: 1 }); ACT.talkGo(id); toast('已保存；这条记录会让中心知道，并出现在中心的简报里'); },
  talkRiskBack(id) { S.mo = `talk:${id}`; },
  talkEditGo(tid) { const t = TALKS.find(x => x.id === tid), F = S.form; if (!t || talkLocked(t)) return toast('已超过可修改时间，只能追加补充'); const p = (F.points || '').trim(); if (!p) return toast('请写下谈话要点');
    if (TALK_RE.test(p + ' ' + (F.need || '')) && !TALK_RE.test(t.points + ' ' + t.need) && !F.crisisDone) { S.mo = `talkRisk:${t.sid}|edit|${tid}`; return; }
    t.hist = t.hist || []; t.hist.push({ at: new Date(NOW), points: t.points, need: t.need }); t.points = p; t.need = (F.need || '').trim();
    if (F.crisisDone === 'no') { t.noRep = F.noRep; t.share = true; } log('修改谈心记录（保留修改前的内容）', SU(t.sid), { k: 'talkLog', noTl: 1 }); S.mo = null; toast('已修改，修改前的内容保留在历史里');
    if (F.crisisDone === 'rep') { t.rep = 1; S.form = { urgentOnly: 1, sid: t.sid, who: '老师 / 辅导员', note: `谈心时学生说：${p}` }; S.mo = 'report:urgent'; } },
  talkAddGo(tid) { const t = TALKS.find(x => x.id === tid), F = S.form, v = (F.add || '').trim(); if (!t || !v) return toast('请写下补充的内容');
    if (TALK_RE.test(v) && !F.crisisDone) { S.mo = `talkRisk:${t.sid}|add|${tid}`; return; }
    t.adds = t.adds || []; t.adds.push({ at: new Date(NOW), t: v, by: me() }); if (F.crisisDone === 'no') { t.noRep = F.noRep; t.share = true; } if (F.crisisDone === 'rep') t.rep = 1;
    log('追加谈心记录补充', SU(t.sid), { k: 'talkLog', noTl: 1 }); if (t.center || t.share) notify(SU(t.sid).owner || SU(t.sid).assignee || 'c5', '站内', `${ST(me()).name} 追加了谈心记录补充：${nm(SU(t.sid))}`, t.sid);
    S.mo = null; toast('已追加'); if (F.crisisDone === 'rep') { S.form = { urgentOnly: 1, sid: t.sid, who: '老师 / 辅导员', note: `谈心时学生说：${v}` }; S.mo = 'report:urgent'; } },
  talkRisk2(a) { const [sid, kind, tid, ch] = a.split('|'); if (ch === 'no') { const r = (S.form.noRepT || '').trim(); if (!r) return toast('请写一句不报告的原因'); S.form.crisisDone = 'no'; S.form.noRep = r; log(`谈心记录${kind === 'add' ? '补充' : '修改'}含安全相关内容，辅导员选择不报告：${r}（已自动让中心知道）`, SU(sid), { k: 'talkLog', noTl: 1 }); }
    else { S.form.crisisDone = 'rep'; log(`谈心记录${kind === 'add' ? '补充' : '修改'}含安全相关内容，辅导员选择报告紧急情况`, SU(sid), { k: 'talkLog', noTl: 1 }); }
    if (kind === 'add') ACT.talkAddGo(tid); else ACT.talkEditGo(tid); },
  ttTo(u) { S.form.to = u; },
  ttMoveGo(sid) { const t = TT[sid], F = S.form, s = SU(sid); if (!t || !F.to) return; const from = t.to; t.moved.push({ at: new Date(NOW), from, to: F.to, by: me(), why: (F.why || '').trim() }); t.to = F.to;
    log(`改派谈心任务：${ST(from).name} → ${ST(F.to).name}${F.why ? `（${F.why.trim()}）` : ''}`, s, { k: 'talkTask', noTl: 1 }); notify(F.to, '站内', `${ST(me()).name} 改派给你 1 个谈心任务：${s.name}`, sid); if (from !== me()) notify(from, '站内', `你的 1 个谈心任务已改派给 ${ST(F.to).name}`, sid);
    S.mo = null; toast(`已改派给 ${ST(F.to).name}`); },
});
const _md13b = modal; modal = function () { const [k, id] = (S.mo || '').split(':'), F = S.form;
  if (k === 'ttMove') return ttMoveBox(SU(id), F);
  if (k === 'talkRisk') { const [sid, kind, tid] = id.split('|'), s = SU(sid), arg = kind ? `${sid}|${kind}|${tid}` : sid;
    return `<div class="ov" data-act="ovClose"><div class="mo"><h3>${I('alert')}这条记录里有安全相关的内容</h3><p>${kind === 'add' ? '你追加的补充' : kind === 'edit' ? '你修改后的记录' : `关于 ${s.name} 的谈心记录`}里出现了类似「不想活」「伤害自己」的表达。是否报告紧急情况？</p>
      <p class="note">报告后会立即通知值班咨询师；如果有人正处在立即危险中，请先拨打 995 / 999。选择不报告也可以，但需要写一句原因；这条记录会自动「让中心知道」，并出现在中心的简报里。</p>
      ${fld('不报告的原因（选「不报告」时必填）', `<input class="in" style="width:100%" data-bind="form.noRepT" value="${esc(F.noRepT || '')}" placeholder="例如：学生在引用电影台词，已当面确认没有这个想法">`)}
      <div class="acts">${kind ? '' : `<button class="btn ghost" data-act="talkRiskBack" data-arg="${sid}">回去修改记录</button>`}<button class="btn sec" data-act="${kind ? 'talkRisk2' : 'talkRiskNo'}" data-arg="${kind ? arg + '|no' : sid}">不报告，保存</button><button class="btn red" data-act="${kind ? 'talkRisk2' : 'talkRiskRep'}" data-arg="${kind ? arg + '|rep' : sid}">保存并报告紧急情况</button></div></div></div>`; }
  if (k === 'talkEdit') { const t = TALKS.find(x => x.id === id); if (F._tid !== id) { S.form = { _tid: id, points: t.points, need: t.need }; }
    return `<div class="ov" data-act="ovClose"><div class="mo wide"><h3>修改谈心记录 · ${SU(t.sid).name}</h3><p>${fmt(t.at)} · ${t.mode}。写下后 24 小时内可以修改，修改前的内容会保留；中心已接手或已查看后只能追加补充。</p>
      ${fld('谈话要点（只写事实，不写判断）', ta('points', ''))}${fld('学生表达的需要（选填）', ta('need', ''))}
      <div class="acts"><button class="btn sec" data-act="moClose">取消</button><button class="btn pri" data-act="talkEditGo" data-arg="${id}">保存修改</button></div></div></div>`; }
  if (k === 'talkAdd') { const t = TALKS.find(x => x.id === id);
    return `<div class="ov" data-act="ovClose"><div class="mo"><h3>追加补充 · ${SU(t.sid).name}</h3><p>${fmt(t.at)} 的谈心记录${talkLockWhy(t)}，原记录不能再改，可以追加补充。</p><div class="sms" style="text-align:left">${esc(t.points)}</div>
      ${fld('补充的内容（写事实）', ta('add', '例如：第二天学生发消息说已经和任课老师沟通好了'))}
      <div class="acts"><button class="btn sec" data-act="moClose">取消</button><button class="btn pri" data-act="talkAddGo" data-arg="${id}">追加</button></div></div></div>`; }
  if (k === 'talkLog') { const t = TALKS.find(x => x.id === id);
    return `<div class="ov" data-act="ovClose"><div class="mo wide"><h3>修改历史 · ${SU(t.sid).name}</h3><table class="t"><tr><th style="width:140px">时间</th><th>谈话要点</th><th>学生表达的需要</th></tr>${t.hist.map((h, i) => `<tr><td>${i ? fmt(t.hist[i - 1].at) : fmt(t.at)}<small>修改前</small></td><td>${esc(h.points)}</td><td>${esc(h.need) || '—'}</td></tr>`).join('')}<tr><td>${fmt(t.hist[t.hist.length - 1].at)}<small>当前</small></td><td>${esc(t.points)}</td><td>${esc(t.need) || '—'}</td></tr></table><div class="acts"><button class="btn sec" data-act="moClose">关闭</button></div></div></div>`; }
  return _md13b(); };
/* 中心简报：含安全内容但辅导员没有报告的谈心记录 */
const riskTalks = () => TALKS.filter(t => t.noRep && !t.cAck && (S.role === 'L3' || [SU(t.sid).owner, SU(t.sid).assignee].includes(me())));
const _bL2_13b = briefL2; briefL2 = function () { const b = _bL2_13b(), L = riskTalks(); if (L.length) b.secs.splice(1, 0, { t: `辅导员谈心记录里的安全内容（${L.length}）`, red: 1, all: 1, items: L.map(t => it(`${nm(SU(t.sid))} · ${ST(t.by).name} ${fmt(t.at)} 的谈心记录有安全相关内容，辅导员未报告紧急情况（原因：${esc(t.noRep)}）`, 'open', t.sid, '打开档案')) }); return b; };
const _bL3_13b = briefL3; briefL3 = function () { const b = _bL3_13b(), L = riskTalks(); if (L.length) b.secs.splice(1, 0, { t: `辅导员谈心记录里的安全内容（${L.length}）`, red: 1, all: 1, items: L.map(t => it(`${nm(SU(t.sid))} · ${ST(t.by).name} ${fmt(t.at)} 的谈心记录有安全相关内容，辅导员未报告紧急情况（原因：${esc(t.noRep)}）`, 'open', t.sid, '打开档案')) }); return b; };
/* 打开档案即视为中心已看到这条提醒 */
const _open13 = ACT.open; ACT.open = function (id) { const r = _open13.apply(this, arguments); if (isCenter()) TALKS.filter(t => t.sid === id && t.noRep).forEach(t => { t.cAck = t.cAck || new Date(NOW); }); return r; };

/* =====================================================================
   5. 施测方案多渠道触达（方案第二节 新增 1–7，审查 D1 / D3，默认 8–11）
   · 每个渠道不同链接：短信、邮件是个人链接；二维码、海报用公共链接，登录后按学生归因
   · 送达失败单列，不算「未打开」；只有中心负责人能导出名单
   · 自动提醒规则；每人每一波上限（默认 2 次，一个提醒节点算 1 次，首页任务卡不算）；22:00–08:00 短信顺延到 08:00
   · 短信、邮件末尾「不想再收到提醒」；已退订、已拒绝不算未完成
   · 辅导员「普测进度」：本学院完成率 + 未完成名单，可经系统提醒（以 UCC 名义发出，计入上限，记审计）
   · 双语文案分开编辑；发布和手动提醒前显示「预计发送 N 条」
===================================================================== */
RULES.remQuota = 2;
const CH_LINK = { sms: '个人链接', mail: '个人链接', home: '首页任务卡', pack: '公共链接', qr: '公共链接', poster: '公共链接' };
/* 演示数据：送达失败 / 已退订 / 已拒绝（知情同意选了「这次不参加」） */
PENDING.forEach((x, i) => { if (x.st !== '未开始') return; const k = i % 9; if (k === 2) x.fail = i % 2 ? '邮件退信' : '手机号错误'; else if (k === 5) x.unsub = ago(30 + i); else if (k === 7) x.declined = ago(40 + i); });
const pStat = x => x.declined ? '已拒绝' : x.unsub ? '已退订' : x.fail ? '送达失败' : x.st === '未开始' ? '未打开' : '已打开未完成';
const remindable = x => !x.declined && !x.unsub && !x.fail;
const quotaFull = x => (x.rem || 0) >= RULES.remQuota;
const quietNow = () => { const h = NOW.getHours(); return h >= 22 || h < 8; };
const defAuto = () => [{ id: 'a1', on: 1, d: 3, base: '发布后', cond: '未打开', ch: ['短信'] }, { id: 'a2', on: 1, d: 1, base: '截止前', cond: '未完成', ch: ['短信', '学生端首页'] }];
const defCopy = p => ({ sms: `【NTU UCC】${p.name}已开放，约 15 分钟，请在 ${p.due} 前完成：{个人链接}（需用 NTU 账号登录）。不想再收到提醒：{退订链接}`, smsEn: `[NTU UCC] ${p.name} is open (about 15 min). Please complete by ${p.due}: {个人链接} (NTU login required). Stop reminders: {退订链接}`,
  mailT: `${p.name} 已开放（约 15 分钟）`, mailTEn: `${p.name} is now open (about 15 minutes)`, mail: `同学你好：\n${p.name}已开放，请在 ${p.due} 前完成。点击你的专属链接，用 NTU 账号登录即可开始。结果只用于为你提供支持，不会出现在任何成绩或档案中。`, mailEn: `Dear student,\n${p.name} is now open. Please complete it by ${p.due}. Use your personal link and sign in with your NTU account. Your answers are only used to support you and never appear in grades or records.`,
  posterEn: 'Take 15 minutes for yourself' });
const planX = p => { p.auto = p.auto || defAuto(); p.copy = p.copy || defCopy(p); return p; };
/* 预计发送条数：双语短信约占 2 条；首页任务卡不算条数 */
const estMsgs = (n, chs) => ({ sms: chs.includes('短信') ? n * 2 : 0, mail: chs.includes('学校邮箱') ? n : 0 });
const estTxt = (n, chs) => { const e = estMsgs(n, chs), parts = []; if (e.sms) parts.push(`短信 ${e.sms} 条`); if (e.mail) parts.push(`邮件 ${e.mail} 封`); if (chs.includes('学生端首页')) parts.push(`首页任务卡 ${n} 人`);
  return `预计发送：${parts.join('、') || '—'}${e.sms ? '<small>双语短信约占 2 条；演示不计费</small>' : ''}${e.sms && quietNow() ? '<small>现在是晚上 10 点到早上 8 点之间，短信会顺延到 08:00（新加坡时间）发出</small>' : ''}`; };
/* 未完成名单（中心看到的） */
remindList = function () { const f = S.f; return PENDING.filter(x => (!f.rst || pStat(x) === f.rst) && (!f.rcol || x.college === f.rcol) && (!f.rch || x.via === f.rch)); };
reachPanel = function (p) { planX(p); const R = reachData(p), pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '—', ch = p.ch || defCh(), t1 = p.id === 't1';
  const fails = t1 ? PENDING.filter(x => x.fail) : [], unsub = t1 ? PENDING.filter(x => x.unsub) : [], decl = t1 ? PENDING.filter(x => x.declined) : [];
  const failBy = k => fails.filter(x => (k === 'sms' ? x.fail === '手机号错误' : x.fail === '邮件退信')).length, notOpen = t1 ? PENDING.filter(x => pStat(x) === '未打开').length : R.N - R.open;
  let list = '';
  if (t1) { const f = S.f, sel = S.rsel || (S.rsel = {}); let pl = PENDING.map((x, i) => ({ ...x, i, stt: pStat(x) }));
    if (f.rst) pl = pl.filter(x => x.stt === f.rst); if (f.rcol) pl = pl.filter(x => x.college === f.rcol); if (f.rch) pl = pl.filter(x => x.via === f.rch);
    const per = 12, pages = Math.max(1, Math.ceil(pl.length / per)), pg = Math.min(S.rpg || 1, pages), nsel = Object.values(sel).filter(Boolean).length, can = pl.filter(x => remindable(x)).length;
    const tag = x => ({ 未打开: '<span class="pill">未打开</span>', 已打开未完成: '<span class="pill w">已打开未完成</span>', 送达失败: `<span class="pill r">送达失败 · ${x.fail}</span>`, 已退订: '<span class="pill">已退订</span>', 已拒绝: '<span class="pill">已拒绝（不参加）</span>' })[x.stt];
    list = `<h4 style="margin:18px 0 8px">还没完成的人 · 可以再提醒</h4>
    <div class="filters"><select data-bind="f.rst" data-rerender><option value="">全部状态</option>${['未打开', '已打开未完成', '送达失败', '已退订', '已拒绝'].map(x => `<option ${f.rst === x ? 'selected' : ''}>${x}</option>`).join('')}</select><select data-bind="f.rcol" data-rerender><option value="">全部学院</option>${COLLEGES.map(c => `<option ${f.rcol === c ? 'selected' : ''}>${c}</option>`).join('')}</select><select data-bind="f.rch" data-rerender><option value="">全部进入渠道</option>${CH.map(([k, n]) => `<option value="${k}" ${f.rch === k ? 'selected' : ''}>${n}</option>`).join('')}</select><span class="note">${pl.length} 人</span><span style="flex:1"></span>
      <button class="btn sec xs" data-act="mo" data-arg="remind:sel" ${nsel ? '' : 'disabled'}>提醒所选（${nsel}）</button><button class="btn pri xs" data-act="mo" data-arg="remind:all" ${can ? '' : 'disabled'}>提醒筛选出的人</button></div>
    <table class="t"><tr><th style="width:32px"></th><th>学生</th><th>学院</th><th>状态</th><th>从哪里进入</th><th>本波已提醒</th><th>最近一次</th></tr>${pl.slice((pg - 1) * per, pg * per).map(x => `<tr><td>${remindable(x) ? `<input type="checkbox" ${sel[x.i] ? 'checked' : ''} data-act="rsel" data-arg="${x.i}">` : ''}</td><td>${x.name}<small>${x.sid}</small></td><td>${x.college}</td><td>${tag(x)}</td><td>${x.via ? chName(x.via) : '—'}</td><td>${x.rem || 0} / ${RULES.remQuota} 次${quotaFull(x) ? '<small>已达本波上限</small>' : ''}</td><td>${x.remAt ? `${fmt(x.remAt)} · ${x.remChs ? x.remChs.join(' + ') : chName(x.remCh)}${x.remBy ? `<small>${ST(x.remBy).name} 发起</small>` : ''}` : '—'}</td></tr>`).join('')}</table>
    <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:8px">${Array.from({ length: pages }, (_, i) => `<button class="btn ${pg === i + 1 ? 'pri' : 'sec'} xs" data-act="rpg" data-arg="${i + 1}">${i + 1}</button>`).join('')}</div>
    <p class="note">已退订、已拒绝（知情同意选了「这次不参加」）的学生不再提醒，也不算进「还没完成」；送达失败的学生单列，请学院更正联系方式。</p>`; }
  const autoTxt = a => `${a.base}第 ${a.d} 天${a.base === '截止前' ? '' : ''}，${a.cond}的学生 → ${a.ch.join(' + ')}`;
  const auto = `<div class="dbox autobox"><b>自动提醒规则<span class="sp"></span><small class="note">手动提醒保留作补充</small></b>
    ${p.auto.map(a => `<p class="autor"><span class="sw ${a.on ? 'on' : ''}" data-act="autoT" data-arg="${p.id}|${a.id}" style="cursor:pointer"></span><span>${autoTxt(a)}</span>${a.ran ? `<small class="note">${esc(a.ran)}</small>` : ''}<button class="lnk" data-act="autoDel" data-arg="${p.id}|${a.id}">删除</button></p>`).join('')}
    <div class="autoadd"><select data-bind="form.abase"><option>发布后</option><option>截止前</option></select>第<select data-bind="form.ad">${[1, 2, 3, 5, 7].map(d => `<option>${d}</option>`).join('')}</select>天，<select data-bind="form.acond"><option>未打开</option><option>未完成</option></select>的学生 →
      <label><input type="checkbox" data-act="aCh" data-arg="短信" ${(S.form.ach || ['短信']).includes('短信') ? 'checked' : ''}> 短信</label><label><input type="checkbox" data-act="aCh" data-arg="学校邮箱" ${(S.form.ach || []).includes('学校邮箱') ? 'checked' : ''}> 邮件</label><label><input type="checkbox" data-act="aCh" data-arg="学生端首页" ${(S.form.ach || []).includes('学生端首页') ? 'checked' : ''}> 首页任务卡</label><button class="btn sec xs" data-act="autoAdd" data-arg="${p.id}">${I('plus', 's')}加一条</button></div>
    <p class="note">每人每一波最多提醒 <select data-bind="remQuota" ${S.role === 'L3' || isAdm() ? '' : 'disabled'}>${[1, 2, 3, 4].map(n => `<option ${RULES.remQuota === n ? 'selected' : ''}>${n}</option>`).join('')}</select> 次（自动 + 手动 + 辅导员发起的合计；一次提醒同时走几个渠道也只算 1 次，首页任务卡不算）。晚上 10 点到早上 8 点不发短信，落在这个时段的顺延到 08:00；邮件不受限。短信、邮件末尾都有「不想再收到提醒」，点了以后本波不再提醒。</p></div>`;
  return `<div class="reach"><div class="grid g6 kpi6" style="margin-bottom:12px">${[['已下发', R.N, '去重后的人数'], ['已打开', R.open, pct(R.open, R.N)], ['已完成', R.done, pct(R.done, R.N)], ['还没打开', notOpen, pct(notOpen, R.N)], ['送达失败', t1 ? fails.length : '—', t1 ? '不算未打开' : ''], ['已退订 / 已拒绝', t1 ? `${unsub.length} / ${decl.length}` : '—', '不再提醒']].map(k => `<div class="kpi"><small>${k[0]}</small><b>${k[1]}</b><span>${k[2]}</span></div>`).join('')}</div>
    <table class="t"><tr><th>渠道</th><th>链接</th><th>发送时间</th><th>下发人数</th><th>送达失败</th><th>从这里打开</th><th>从这里完成</th><th>完成率</th></tr>${R.rows.map(r => `<tr><td><b>${r.n}</b></td><td>${CH_LINK[r.k]}</td><td>${ch[r.k] && ch[r.k].when ? ch[r.k].when + (ch[r.k].when === '定时发' && ch[r.k].at ? ' · ' + ch[r.k].at : '') : '—'}</td><td>${r.sent ?? '—'}</td><td>${t1 && (r.k === 'sms' || r.k === 'mail') ? failBy(r.k) : '—'}</td><td>${r.open}</td><td>${r.done}</td><td>${r.sent ? pct(r.done, r.sent) : pct(r.done, r.open)}</td></tr>`).join('')}
      <tr class="sum"><td><b>合计（去重）</b></td><td></td><td></td><td><b>${R.N}</b></td><td><b>${t1 ? fails.length : '—'}</b></td><td><b>${R.open}</b></td><td><b>${R.done}</b></td><td><b>${pct(R.done, R.N)}</b></td></tr></table>
    <p class="note">每个渠道用不同的链接：短信、邮件是每个学生的个人链接（点开后仍需 NTU 账号登录，链接本身不能代替登录）；二维码、海报、转发包用公共链接，登录后按学生归因。「打开」= 点开链接并登录；邮件是否被阅读不统计。同一学生从多个渠道进入，按第一次进入的渠道计算。</p>
    ${t1 && fails.length ? `<div class="dbox" style="background:#fff;border-color:var(--crit-line)"><b>送达失败 ${fails.length} 人<span class="sp"></span>${S.role === 'L3' ? `<button class="btn sec xs" data-act="failExp" data-arg="${p.id}">${I('dl', 's')}导出名单（含联系方式）</button>` : '<small class="note">只有中心负责人能导出</small>'}</b><p>手机号错误 ${failBy('sms')} 人 · 邮件退信 ${failBy('mail')} 人。各学院辅导员在「学生工作 · 普测进度」里能看到本学院「联系方式有误」的姓名，用来更正。</p></div>` : ''}
    ${auto}
    <div class="assets"><span class="note">素材：</span><button class="btn sec xs" data-act="mo" data-arg="copyEd:${p.id}">${I('edit', 's')}短信 / 邮件文案（中 · 英）</button>${ch.qr && ch.qr.on ? `<button class="btn sec xs" data-act="qrDl" data-arg="${p.id}">${I('dl', 's')}下载二维码</button>` : ''}${ch.poster && ch.poster.on ? `<button class="btn sec xs" data-act="mo" data-arg="poster:${p.id}">${I('edit', 's')}海报（${POSTER_TPL[(p.poster || defPoster(p)).tpl][0]}）</button>` : ''}${ch.mail && ch.mail.on ? `<button class="btn sec xs" data-act="mo" data-arg="mailPrev:${p.id}">邮件预览</button>` : ''}${ch.pack && ch.pack.on ? `<button class="btn sec xs" data-act="mo" data-arg="packPrev:${p.id}">辅导员转发包</button>` : ''}</div>${list}</div>`; };
(() => { const p = planOf('t1'); if (p) { planX(p); p.auto[0].ran = '10/09 08:00 已发送 · 41 人（短信）'; } })();
/* 提醒：一次提醒可以同时走几个渠道，只算 1 次 */
function remindTargets(id) { const L = id === 'sel' ? PENDING.filter((x, i) => (S.rsel || {})[i]) : remindList();
  const ok = [], skip = { q: 0, day: 0, no: 0 }; L.forEach(x => { if (!remindable(x)) skip.no++; else if (quotaFull(x)) skip.q++; else if (isToday(x.remAt)) skip.day++; else ok.push(x); }); return { ok, skip }; }
function remindBox(id, F) { const { ok, skip } = remindTargets(id), chs = F.rch || ['短信'], l1 = isL1();
  return `<div class="ov" data-act="ovClose"><div class="mo"><h3>${l1 ? '提醒还没完成的同学' : '再提醒一次'} · ${ok.length} 人</h3><p>${l1 ? '经系统以大学心理咨询中心（UCC）的名义发出，不显示你的名字；计入每人每一波的提醒上限，并记入操作记录。' : '一次提醒同时走几个渠道也只算 1 次；首页任务卡不算次数。'}</p>
    ${skip.q || skip.day || skip.no ? `<p class="note">自动跳过：${[skip.q ? `${skip.q} 人已达本波上限` : '', skip.day ? `${skip.day} 人今天已提醒过` : '', skip.no ? `${skip.no} 人已退订、已拒绝或送达失败` : ''].filter(Boolean).join('，')}。</p>` : ''}
    ${fld('用哪些渠道（可多选）', `<div class="opts">${['短信', '学校邮箱', '学生端首页'].map(c => `<button class="${chs.includes(c) ? 'on' : ''}" data-act="rch" data-arg="${c}">${c}</button>`).join('')}</div>`)}
    <p class="estl">${estTxt(ok.length, chs)}</p>
    ${l1 ? '<p class="note" style="color:var(--warn)">这是中心发起的自愿普测，请不要强制要求学生参加。</p>' : ''}
    <div class="acts"><button class="btn sec" data-act="moClose">取消</button><button class="btn pri" data-act="remindGo" data-arg="${id}" ${ok.length && chs.length ? '' : 'disabled'}>发送提醒</button></div></div></div>`; }
Object.assign(ACT, {
  rch(c) { const a = S.form.rch || ['短信']; S.form.rch = a.includes(c) ? a.filter(x => x !== c) : [...a, c]; },
  remindGo(id) { const F = S.form, chs = F.rch || ['短信']; if (!chs.length) return toast('请选择渠道'); const { ok, skip } = remindTargets(id), counts = chs.some(c => c !== '学生端首页');
    ok.forEach(x => { if (counts) x.rem = (x.rem || 0) + 1; x.remAt = new Date(NOW); x.remChs = chs.slice(); x.remCh = { 短信: 'sms', 学校邮箱: 'mail', 学生端首页: 'home' }[chs[0]]; x.remBy = isL1() ? me() : null; });
    const e = estMsgs(ok.length, chs), sk = skip.q + skip.day + skip.no;
    log(`${isL1() ? '辅导员经系统提醒（以 UCC 名义）' : '再提醒未完成的学生'}：${ok.length} 人（${chs.join(' + ')}${e.sms ? `，短信约 ${e.sms} 条` : ''}）${sk ? `，跳过 ${sk} 人` : ''}`, null, { cat: '流转', obj: '施测方案' });
    S.rsel = {}; S.mo = null; toast(`已提醒 ${ok.length} 人${quietNow() && chs.includes('短信') ? '（短信顺延到 08:00）' : ''}${sk ? `；跳过 ${sk} 人` : ''}`); },
  autoT(a) { const [pid, id] = a.split('|'), r = planX(planOf(pid)).auto.find(x => x.id === id); r.on = r.on ? 0 : 1; log(`自动提醒规则${r.on ? '启用' : '停用'}：${r.base}第 ${r.d} 天，${r.cond} → ${r.ch.join(' + ')}`, null, { cat: '配置', obj: '施测方案' }); },
  autoDel(a) { const [pid, id] = a.split('|'), p = planX(planOf(pid)), r = p.auto.find(x => x.id === id); p.auto = p.auto.filter(x => x !== r); log(`删除自动提醒规则：${r.base}第 ${r.d} 天，${r.cond} → ${r.ch.join(' + ')}`, null, { cat: '配置', obj: '施测方案' }); },
  aCh(c) { const a = S.form.ach || ['短信']; S.form.ach = a.includes(c) ? a.filter(x => x !== c) : [...a, c]; },
  autoAdd(pid) { const F = S.form, p = planX(planOf(pid)), ch = F.ach || ['短信']; if (!ch.length) return toast('至少选一个渠道');
    const r = { id: 'a' + Date.now().toString(36), on: 1, base: F.abase || '发布后', d: +(F.ad || 1), cond: F.acond || '未打开', ch }; p.auto.push(r); log(`新增自动提醒规则：${r.base}第 ${r.d} 天，${r.cond} → ${r.ch.join(' + ')}`, null, { cat: '配置', obj: '施测方案' }); toast('已加一条自动提醒规则'); },
  failExp(pid) { if (S.role !== 'L3') return; const L = PENDING.filter(x => x.fail), q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = '﻿' + [['姓名', '学号', '学院', '失败原因', '手机号（示意）', '邮箱（示意）'], ...L.map((x, i) => [x.name, x.sid, x.college, x.fail, `+65 9${String(1000000 + i * 7919).slice(-7)}`, `${x.sid.toLowerCase()}@e.ntu.edu.sg`])].map(r => r.map(q).join(',')).join('\n');
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = '送达失败名单.csv'; a.click(); } catch (e) {}
    log(`导出送达失败名单：${L.length} 人（含联系方式）`, null, { cat: '导出', obj: '施测方案' }); toast(`已导出 ${L.length} 人，已记入操作记录`); },
  copySave(pid) { const p = planX(planOf(pid)), F = S.form; ['sms', 'smsEn', 'mailT', 'mailTEn', 'mail', 'mailEn'].forEach(k => { if (F['c_' + k] != null) p.copy[k] = F['c_' + k]; }); S.mo = null; log('修改普测提醒文案（中 / 英）', null, { cat: '配置', obj: '施测方案' }); toast('文案已保存'); },
});
document.addEventListener('change', e => { if (e.target.dataset.bind !== 'remQuota') return; const was = RULES.remQuota; RULES.remQuota = +e.target.value; log(`每人每一波提醒上限：${was} → ${RULES.remQuota} 次`, null, { cat: '配置', obj: '施测方案' }); toast('已保存，已记入操作记录'); render(); });
/* 文案编辑：中文、英文分开写 */
function copyBox(pid) { const p = planX(planOf(pid)), c = p.copy, F = S.form, v = k => esc(F['c_' + k] ?? c[k]);
  const tx = (k, h) => `<textarea class="in cpta" data-bind="form.c_${k}" style="height:${h}px">${v(k)}</textarea>`, smsLen = t => (t || '').length;
  return `<div class="ov" data-act="ovClose"><div class="mo wide"><h3>短信 / 邮件文案 · ${esc(p.name)}</h3><p>默认中英双语，两种语言分开编辑。{个人链接}、{退订链接} 会自动换成每位学生自己的链接；「不想再收到提醒」必须保留。</p>
    <div class="cpg"><div><b>短信 · 中文</b>${tx('sms', 92)}<small class="note">约 ${smsLen(F.c_sms ?? c.sms)} 字</small></div><div><b>短信 · English</b>${tx('smsEn', 92)}<small class="note">约 ${smsLen(F.c_smsEn ?? c.smsEn)} 字符</small></div>
    <div><b>邮件标题 · 中文</b><input class="in" data-bind="form.c_mailT" value="${v('mailT')}"></div><div><b>邮件标题 · English</b><input class="in" data-bind="form.c_mailTEn" value="${v('mailTEn')}"></div>
    <div><b>邮件正文 · 中文</b>${tx('mail', 120)}</div><div><b>邮件正文 · English</b>${tx('mailEn', 120)}</div></div>
    <p class="note">双语短信通常超过一条的长度，按约 2 条计算；演示不做计费。邮件末尾自动附「不想再收到提醒？点这里」。海报的英文标题在海报编辑里改。</p>
    <div class="acts"><button class="btn sec" data-act="moClose">取消</button><button class="btn pri" data-act="copySave" data-arg="${pid}">保存文案</button></div></div></div>`; }
const _md13c = modal; modal = function () { const [k, id] = (S.mo || '').split(':'), F = S.form;
  if (k === 'remind') return remindBox(id, F);
  if (k === 'copyEd') return copyBox(id);
  if (k === 'mailPrev') { const p = planX(planOf(id)), c = p.copy; return `<div class="ov" data-act="ovClose"><div class="mo wide"><h3>邮件预览</h3><p>发件人：NTU University Counselling Centre &lt;ucc@ntu.edu.sg&gt;（示意）· 每位学生收到的是自己的个人链接</p><div class="sms" style="white-space:pre-line;text-align:left">主题：${esc(c.mailT)} | ${esc(c.mailTEn)}\n\n${esc(c.mail)}\n\n[ 开始 ] lingyu.ntu.edu.sg/s/${p.id}/个人链接\n\n———\n\n${esc(c.mailEn)}\n\n[ Start ] lingyu.ntu.edu.sg/s/${p.id}/personal-link\n\n不想再收到提醒？点这里 · Stop reminders for this round</div><div class="acts"><button class="btn sec" data-act="moClose">关闭</button></div></div></div>`; }
  let h = _md13c();
  if (k === 'pubPlan' && S.wiz) { const w = S.wiz, n = wizRoster(w), chs = [w.ch && w.ch.sms && w.ch.sms.on ? '短信' : '', w.ch && w.ch.mail && w.ch.mail.on ? '学校邮箱' : '', w.ch && w.ch.home && w.ch.home.on ? '学生端首页' : ''].filter(Boolean);
    h = h.replace('<div class="acts">', `<p class="estl">${estTxt(n, chs)}</p><div class="acts">`); }
  if (k === 'poster') { const P = posterOf(id); P.titleEn = P.titleEn ?? 'Take 15 minutes for yourself'; h = h.replace(/(<input class="in" style="width:100%" data-pbind="[^"]*\|title" value="[^"]*">)/, `$1</div><div class="fld"><label>主标题 · English</label><input class="in" style="width:100%" data-pbind="${id}|titleEn" value="${esc(P.titleEn)}">`); }
  return h; };
/* 海报：加英文标题（双语） */
const _dp13 = drawPoster; drawPoster = function (P, w = 600) { const cv = _dp13(P, w), x = cv.getContext('2d'), k = w / 600, ink = POSTER_TPL[P.tpl][3];
  if (P.titleEn !== '') { x.fillStyle = ink; x.textAlign = 'center'; x.globalAlpha = .85; x.font = `500 ${17 * k}px -apple-system,"Helvetica Neue",sans-serif`; x.fillText(P.titleEn || 'Take 15 minutes for yourself', w / 2, 482 * k); x.globalAlpha = 1; } return cv; };

/* 辅导员「普测进度」：本学院完成率 + 未完成名单（只有姓名、学号、状态） */
const l1Cols = (u = me()) => [...new Set([...COLLEGES.filter(c => FOLLOWER_OF[c] === u), ...scopeCols(u)])];
const l1Prog = (col) => PENDING.filter(x => (col ? x.college === col : l1Cols().includes(x.college)) && !x.unsub && !x.declined && !x.fail);
function l1ProgTab() { const cols = l1Cols(), rate = c => { const d = SURV().filter(s => s.college === c).length, n = d + PENDING.filter(x => x.college === c).length; return [d, n]; };
  const L = l1Prog(), bad = PENDING.filter(x => cols.includes(x.college) && x.fail), sel = S.l1sel || (S.l1sel = {}), ns = Object.values(sel).filter(Boolean).length;
  return `<div class="dbox" style="background:#fdf6e8"><b>${I('info', 's')}这是中心发起的自愿普测，请不要强制要求学生参加。</b><p>你可以提醒还没完成的同学；提醒经系统以大学心理咨询中心（UCC）的名义发出，计入每人每一波的提醒上限（${RULES.remQuota} 次），并记入操作记录。已退订、选择不参加的同学不会出现在这里。</p></div>
    <div class="grid g4" style="margin:12px 0">${cols.map(c => { const [d, n] = rate(c); return `<div class="kpi"><small>${c}</small><b>${n ? Math.round(d / n * 100) : 0}%</b><span>已完成 ${d} / ${n} 人</span></div>`; }).join('')}</div>
    <div class="filters"><span class="note">还没完成 ${L.length} 人</span><span style="flex:1"></span><button class="btn sec xs" data-act="mo" data-arg="remind:l1sel" ${ns ? '' : 'disabled'}>提醒所选（${ns}）</button><button class="btn pri xs" data-act="mo" data-arg="remind:l1all" ${L.length ? '' : 'disabled'}>提醒全部</button></div>
    <table class="t"><tr><th style="width:32px"></th><th>姓名</th><th>学号</th><th>学院</th><th>状态</th><th>本波已提醒</th><th></th></tr>${L.map(x => { const i = PENDING.indexOf(x); return `<tr><td><input type="checkbox" ${sel[i] ? 'checked' : ''} data-act="l1sel" data-arg="${i}"></td><td>${x.name}</td><td>${x.sid}</td><td>${x.college}</td><td>${x.st === '未开始' ? '未打开' : '未完成'}</td><td>${x.rem || 0} / ${RULES.remQuota}${quotaFull(x) ? '<small>已达本波上限</small>' : ''}</td><td><button class="btn ghost xs" data-act="mo" data-arg="remind:l1one|${i}" ${quotaFull(x) || isToday(x.remAt) ? 'disabled' : ''}>提醒</button></td></tr>`; }).join('')}</table>
    ${bad.length ? `<div class="dbox" style="background:#fff;margin-top:12px"><b>联系方式有误（${bad.length}）</b><p>${bad.map(x => x.name).join('、')}：短信或邮件发不到，请协助学生在学校系统里更正联系方式。</p></div>` : ''}`; }
const _rt13 = remindTargets; remindTargets = function (id) { if (!id || !id.startsWith('l1')) return _rt13(id);
  const L = id === 'l1all' ? l1Prog() : id === 'l1sel' ? PENDING.filter((x, i) => (S.l1sel || {})[i] && l1Prog().includes(x)) : [PENDING[+id.split('|')[1]]];
  const ok = [], skip = { q: 0, day: 0, no: 0 }; L.forEach(x => { if (!remindable(x)) skip.no++; else if (quotaFull(x)) skip.q++; else if (isToday(x.remAt)) skip.day++; else ok.push(x); }); return { ok, skip }; };
ACT.l1sel = i => { S.l1sel = S.l1sel || {}; S.l1sel[i] = !S.l1sel[i]; };
const _rg13 = ACT.remindGo; ACT.remindGo = function (id) { _rg13(id); if (id && id.startsWith('l1')) S.l1sel = {}; };
const _wp13b = workPage; workPage = function () { const tab = S.tabs.work || 'talk';
  if (tab === 'prog') { S.tabs.work = 'promo'; let h; try { h = _wp13b(); } finally { S.tabs.work = 'prog'; }
    const a = h.indexOf('<div class="tabs">'), e = h.indexOf('</div>', a) + 6, tabs = h.slice(a, e).replace('class="on" data-act="wtab" data-arg="promo"', 'class="" data-act="wtab" data-arg="promo"');
    const c2 = h.indexOf('<div class="card"><h3>' + I('info'), e); return h.slice(0, a) + tabs.replace('</div>', `<button class="on" data-act="wtab" data-arg="prog">普测进度</button></div>`) + l1ProgTab() + '</div>' + (c2 > 0 ? h.slice(c2) : ''); }
  return _wp13b().replace(/(<button class="[^"]*" data-act="wtab" data-arg="promo">[^<]*<\/button>)/, `$1<button class="" data-act="wtab" data-arg="prog">普测进度</button>`); };
PAGES.work = workPage;

/* ---------- v1.13 · 学生在普测里选了「这次不参加」：名单显示「已拒绝」，不再提醒，不算未完成 ---------- */
if (typeof LY_in === 'function') {
  const _lyIn13d = LY_in; LY_in = function (ev) {
    if (ev.t !== 'decl') return _lyIn13d(ev);
    const s = LY_CORE()[ev.core]; if (!s) return '';
    let x = PENDING.find(y => y.sid === s.id);
    if (!x && ev.on) { x = { name: s.name, sid: s.id, college: s.college, st: '未开始', left: '问卷 + 访谈', due: '10/19', rem: 1 }; PENDING.unshift(x); }
    if (!x) return ''; x.declined = ev.on ? new Date(NOW) : null;
    log(ev.on ? `学生在学生端选择「这次不参加」：${ev.task}` : `学生撤回「这次不参加」，回来参加：${ev.task}`, s, { k: 'done', sys: 1 });
    if (S.uid) render(); return ev.on ? `${s.name} 选择这次不参加，名单里显示「已拒绝」，不再提醒` : `${s.name} 回来参加普测了`; };
}

/* ---------- v1.13 · L3 兼有 L2 全部功能（学校可关，开关记审计） ---------- */
RULES.l3l2 = true;
const L3POOLQ = ['review4', 'up', 'review3', 'quality'];
const _q13c = queues; queues = function (u = me(), r = S.role) { const q = _q13c(u, r); if (r !== 'L3' || !RULES.l3l2) return q;
  return q.concat([
    { k: 'r3mine', n: '我在复核的', rev: 1, items: STU.filter(s => s.stage === 'L2' && s.assignee === u) },
    ...(u === me() ? [{ k: 'r3pool', n: '复核池', rev: 1, items: STU.filter(s => s.stage === 'L2' && L3POOLQ.includes(s.queue) && s.assignee !== u) }] : [])]); };
const _qb13c = queueBody; queueBody = function (q) { if (q.k !== 'r3pool') return _qb13c(q);
  const it = byDue(q.items); if (!it.length) return `<div class="empty"><img src="${MASCOT}" alt="">复核池是空的</div>`;
  return `<table class="t"><tr><th>学生</th><th>等级</th><th>在谁手里</th><th>时限</th><th style="width:170px"></th></tr>${it.map(s => `<tr class="hov ${overdue(s) ? 'crit' : ''}" data-act="open" data-arg="${s.id}"><td><b>${nm(s)}</b><small>${s.college}</small></td><td>${lvB(curLv(s))}</td><td>${s.assignee ? ST(s.assignee).name : '—'}${s.ack ? '<small>已确认接手</small>' : ''}</td><td>${dueTag(leftOf(s)) || '—'}</td>
    <td><div style="display:flex;gap:6px;justify-content:flex-end"><button class="btn pri xs" data-act="l3Claim" data-arg="${s.id}">领取</button><button class="btn sec xs" data-act="mo" data-arg="reassign:${s.id}">分配给 L2</button></div></td></tr>`).join('')}</table><p class="note">领取后由你复核，原来的咨询师会收到通知；分配会重新计算时限。</p>`; };
Object.assign(ACT, {
  l3Claim(id) { const s = SU(id); if (!s) return; const h = s.assignee; s.assignee = me(); s.since = new Date(NOW); s.limKey = null; s.ack = null;
    log(`中心领取复核${h ? `（原来在 ${ST(h).name} 手上）` : ''}`, s, { k: 'reassign' }); if (h && h !== me()) notify(h, '站内', `${nm(s)} 已由 ${ST(me()).name} 领取复核，你不用再处理`, s.id);
    S.tabs.home3 = 'r3mine'; toast(`已领取，${nm(s)} 在「我在复核的」里`); },
  l3l2T() { if (!isAdm()) return; RULES.l3l2 = !RULES.l3l2; log(`中心负责人 / 高级咨询师兼有 L2 复核功能：${RULES.l3l2 ? '打开' : '关闭'}`, null, { cat: '配置', obj: '流转规则' }); toast(`已${RULES.l3l2 ? '打开' : '关闭'}，已记入操作记录`); },
});
const _st13c = settings; settings = function () { const h = _st13c(); if (!h.includes('<div class="rules">')) return h; const ed = isAdm();
  const card = `<div class="card" style="margin-top:16px"><div class="prow"><span><b>L3 兼做 L2 复核</b><small>打开后，中心负责人、高级咨询师可以从复核池领取学生自己复核，也可以分配给初级咨询师；工作台分「我要复核的」「需要我决策的」两栏。关掉后 L3 只做决策。</small></span><span class="sw ${RULES.l3l2 ? 'on' : ''} ${ed ? '' : 'lk'}" ${ed ? 'data-act="l3l2T"' : ''}></span></div></div>`;
  const i = h.indexOf('<div class="grid g3" style="margin-top:16px">'); return i < 0 ? h : h.slice(0, i) + card + h.slice(i); };
PAGES.settings = settings;

/* ---------- v1.13 · AI 访谈不读量表分数，独立判断；档案里两者并排，不一致的标出来给 L2 看 ---------- */
const scBand = s => s.phq >= 15 || s.gad >= 15 ? 3 : s.phq >= 10 || s.gad >= 10 ? 2 : s.phq >= 5 || s.gad >= 5 ? 1 : 0;
const aiBand = s => s.ai >= 4 ? 3 : s.ai === 3 ? 2 : s.ai === 2 ? 1 : 0;
const BANDN = ['没有明显困扰', '轻度', '中度', '中重度及以上'];
const mmGap = s => s.walkin || s.phq == null ? 0 : Math.abs(scBand(s) - aiBand(s));
function mmBox(s) { const g = mmGap(s), hi = aiBand(s) > scBand(s);
  return `<h4>四、访谈与量表对照</h4><table class="t"><tr><th style="width:150px">来源</th><th>结果</th><th>程度</th></tr>
    <tr><td>标准化量表<small>学生自填</small></td><td>PHQ-9 ${s.phq} / 27 · GAD-7 ${s.gad} / 21</td><td>${BANDN[scBand(s)]}</td></tr>
    <tr><td>小屿访谈<small>独立判断，不读量表分数</small></td><td>初判 ${s.ai} 级</td><td>${BANDN[aiBand(s)]}</td></tr></table>
    ${g >= 2 ? `<div class="dbox mm"><b><span class="pill r">访谈与量表不一致</span></b><p>${hi ? '访谈里反映的困扰明显重于量表分数，可能是量表答得偏轻，或者学生在对话里说出了量表没问到的情况。' : '量表分数明显高于访谈里的表现，可能是量表答得偏重或理解有误，也可能是学生在对话里有所保留。'}复核时请当面问清楚，以人工判断为准。</p></div>` : `<p class="note">两者一致${g === 1 ? '（相差一档，属正常范围）' : ''}。</p>`}`; }
/* 演示：一位密切关注的学生，访谈重于量表 */
(() => { const s = STU.find(x => x.stage === 'L2' && x.queue === 'review4' && x.ai === 4 && !x.item9 && x.id !== (CORE.chen || {}).id); if (s) { s.phq = 6; s.gad = 4; s.mmDemo = 1; } })();

/* 演示备忘录（v1.13 新增部分；预咨询的设置挪到了「预咨询」标签，旧说明换掉） */
setTimeout(() => { try {
  const add = (r, p, arr) => { MEMO[r] = MEMO[r] || {}; MEMO[r][p] = (MEMO[r][p] || []).filter(x => !/^v1\.12：「流转规则」里可以设置预咨询小屿/.test(x)).concat(arr); };
  ['L2', 'L3'].forEach(r => add(r, 'booking', ['v1.13：第一次预约（预咨询）选了时段就预约成功，不用老师确认；工作台「新预约」里看过点「知道了」。改期、取消仍要老师同意。']));
  add('L2', 'home', ['v1.13：档案「筛查与报告」最后有「访谈与量表对照」。小屿访谈不读量表分数，两者不一致时会标出来（南洋商学院的 Wong Jun 就是一例），复核时请当面问清楚。']);
  add('L3', 'home', ['v1.13：L3 默认兼做 L2 复核，工作台分「我要复核的」「需要我决策的」两栏；复核池里可以领取，也可以分配给初级咨询师。系统管理员可以在「流转规则」里关掉。', '学生抽屉只显示当下能做的 1–2 个按钮，其余在「更多」里；「转危机」一直在。']);
  add('L3', 'settings', ['v1.13：「预咨询」里编辑小屿的问题（改完存为新版本，可预览、可恢复）；「谈心频率」里按关注等级设置辅导员多久谈心一次，默认最近 30 天 2 次，只影响之后的任务。']);
  add('ADM', 'settings', ['v1.13：「预咨询」里设置小屿放在哪一步、是否启用模板二；「流转规则」里可以关掉「L3 兼做 L2 复核」。改动都记入操作记录。']);
  add('L1', 'home', ['v1.13：中心按关注等级设置谈心频率，到期的学生会出现在「谈心任务」里；同一层的辅导员之间可以改派，优先给标了「最近谈过」的老师。', '「学生工作 → 普测进度」能看到本学院的完成情况，可以请中心再提醒一次。']);
  add('L3', 'survey', ['v1.13：「触达与催办」可以设置自动提醒规则和每人提醒上限；多个渠道同时发算 1 次。已退订、已拒绝（学生选了「这次不参加」）的不再提醒，送达失败的单列。']);
} catch (e) {} }, 0);
