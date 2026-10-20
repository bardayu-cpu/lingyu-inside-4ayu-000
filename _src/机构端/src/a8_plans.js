/* =====================================================================
   施测方案中心：创建（向导 + 预览 + 草稿箱）、查看（进行中）、复盘（已结束）
===================================================================== */
const GRADES = ['大一', '大二', '大三', '大四', '研究生'];
const GRADE_N = { 大一: 3100, 大二: 1070, 大三: 1070, 大四: 990, 研究生: 990 };
const SCALES = [['PHQ-9', '抑郁 · 9 题 · 约 2 分钟', 2], ['GAD-7', '焦虑 · 7 题 · 约 2 分钟', 2], ['PSS-10', '压力感知 · 10 题 · 约 3 分钟', 3], ['ISI', '失眠严重程度 · 7 题 · 约 2 分钟', 2]];
const AIM = { 必做: 15, 选做: 15, 不做: 0 };
const PLANS = [
  { id: 't1', name: TASKS[0].name, st: 'run', owner: 'c5', target: '试点 4 个学院，之后全校分 4 波', scales: [['PHQ-9', 1], ['GAD-7', 1]], ai: '必做', start: '10/05', due: '10/19', valid: 14, waveTxt: '按学院 + 按年级，4 波' },
  { id: 't2', name: '期中压力小调查', st: 'run', owner: 'u1', target: '南洋商学院 · 全体', scales: [['GAD-7', 1]], ai: '不做', start: '10/12', due: '10/30', valid: 7, waveTxt: '不分波', roster: 180, done: 42 },
  { id: 'd1', name: '新生适应追踪（第 2 次）', st: 'draft', owner: 'c4', tgt: ['按年级'], grades: ['大一'], cols: [], imported: 0, scl: { 'PHQ-9': 1, 'ISI': 0 }, ai: '选做', start: '10/26', due: '11/09', valid: 7, waveBy: [], gw: {}, cw: {}, edited: ago(30), name0: 1 },
  { id: 'p0', name: '2026 春季学期心理健康普测', st: 'done', owner: 'c5', target: '全校（试点 3 个学院）', scales: [['PHQ-9', 1], ['GAD-7', 1]], ai: '选做', start: '03/02', due: '03/20', valid: 14, waveTxt: '按学院，3 波', roster: 1860,
    review: { done: 1412, mins: 21, crisis: 5, recv: '5/5', dist: [9, 61, 188, 602, 552], cols: [['计算与数据科学学院', 81], ['南洋商学院', 74], ['工程学院', 72]], notes: '完成率偏低的主要原因：第 2 波撞上期中考试周；大四参与率只有 41%。下次避开考试周，大四单独一波并请学院发通知。' } },
  { id: 'p1', name: '新生适应追踪（第 1 次）', st: 'done', owner: 'c4', target: '大一 · 全体', scales: [['PHQ-9', 1]], ai: '不做', start: '09/15', due: '09/30', valid: 7, waveTxt: '不分波', roster: 3120,
    review: { done: 2246, mins: 4, crisis: 2, recv: '2/2', dist: [2, 38, 170, 980, 1056], cols: [['全体大一', 72]], notes: '问卷短、完成率高；但没有访谈，3 级以上学生的追踪信息不足，第 2 次建议加小屿访谈（选做）。' } },
];
STU.forEach((s, i) => { s.plans = ['t1']; if (s.college === '南洋商学院' && i % 2) s.plans.push('t2'); if (s.hist.length) s.plans.push('p0'); });
const notStarted = p => { if (p.st !== 'run' || !p.start) return false; const [m, d] = p.start.split('/').map(Number); return new Date(2026, m - 1, d) > NOW; };
const planOf = id => PLANS.find(p => p.id === id);
const scaleTxt = p => (p.scales || Object.entries(p.scl || {})).map(([n, r]) => `${n}${r ? '' : '（选填）'}`).join(' · ') + (p.ai !== '不做' ? ` · 小屿访谈（${p.ai}）` : '');
const wizRoster = w => Math.round((w.tgt.includes('按年级') && w.grades.length ? w.grades.reduce((a, g) => a + GRADE_N[g], 0) : w.tgt.includes('按学院') || w.tgt.includes('按年级') ? 7220 : 0) * (w.tgt.includes('按学院') && w.cols.length ? w.cols.length / 4 : 1) + (w.tgt.includes('导入名单') ? w.imported : 0) + (w.tgt.includes('定向复测') ? STU.filter(s => curLv(s) >= 3).length : 0));
const wizTarget = w => w.tgt.map(t => t === '按年级' ? `年级：${w.grades.join('、') || '未选'}` : t === '按学院' ? `学院：${w.cols.join('、') || '未选'}` : t === '导入名单' ? `导入名单 ${w.imported} 人` : `定向复测：上次 3–5 级 ${STU.filter(s => curLv(s) >= 3).length} 人`).join('；');

function survey() {
  if (S.wiz) return wizard();
  if (S.plan) { const p = planOf(S.plan); return p.id === 't1' ? surveyT1() : p.st === 'done' ? review(p) : planRun(p); }
  const tab = S.tabs.plans || 'run', L = PLANS.filter(p => p.st === tab);
  const row = p => { const pr = p.id === 't1' ? [SURV().length, ROSTER] : [p.done || 0, p.roster || 0];
    return `<tr class="hov" ${p.st === 'draft' ? `data-act="wzEdit" data-arg="${p.id}"` : `data-act="planOpen" data-arg="${p.id}"`}><td><b>${p.name}</b><small>${p.st === 'draft' ? `草稿 · 编辑于 ${fmt(p.edited)}` : p.target || wizTarget(p)}</small></td><td>${ST(p.owner).name}</td><td>${scaleTxt(p)}</td><td>${p.start} – ${p.due}<small>发出后 ${p.valid} 天内有效</small></td>
      <td>${p.st === 'draft' ? '<span class="pill">草稿</span>' : notStarted(p) ? `<span class="pill w">未开始</span><small>${p.start} 开始</small>` : p.st === 'done' ? `完成 ${Math.round(p.review.done / p.roster * 100)}%<small>${p.review.done}/${p.roster}</small>` : `<div class="hb" style="grid-template-columns:1fr 44px;margin:0"><span class="bar"><i style="width:${Math.round(pr[0] / pr[1] * 100)}%"></i></span><span>${Math.round(pr[0] / pr[1] * 100)}%</span></div><small>${pr[0]}/${pr[1]}</small>`}</td>
      <td>${p.st === 'draft' ? '<button class="btn sec xs">继续编辑</button>' : p.st === 'done' ? '<button class="btn sec xs">看复盘</button>' : '<button class="btn sec xs">查看</button>'}</td></tr>`; };
  return `<div class="card"><h3>${I('list')}施测方案<span class="sp"></span><small>创建、查看、复盘每一次施测</small>${can(10) ? `<button class="btn pri xs" data-act="wzNew">${I('plus', 's')}新建施测方案</button>` : ''}</h3>
    <div class="tabs">${[['run', '进行中 / 未开始'], ['draft', '草稿箱'], ['done', '已结束 · 复盘']].map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-act="planTab" data-arg="${k}">${n}<i>${PLANS.filter(p => p.st === k).length}</i></button>`).join('')}</div>
    ${L.length ? `<table class="t"><tr><th>方案</th><th>第一责任人</th><th>内容</th><th>时间</th><th>进度</th><th></th></tr>${L.map(row).join('')}</table>` : `<div class="empty"><img src="${MASCOT}" alt="">${tab === 'draft' ? '草稿箱是空的' : '暂无'}</div>`}</div>`;
}
function planRun(p) {
  return `<div class="card"><h3>${I('list')}${p.name}<span class="sp"></span><button class="btn ghost xs" data-act="planBack">${I('left', 's')}返回施测方案</button></h3>
    <div class="kv"><span>第一责任人</span><b>${ST(p.owner).name}</b><span>人群</span><b>${p.target || wizTarget(p)}</b><span>内容</span><b>${scaleTxt(p)}</b><span>时间</span><b>${p.start} – ${p.due} · 发出后 ${p.valid} 天内有效</b><span>分波</span><b>${p.waveTxt || '—'}</b></div>
    <div class="grid g3" style="margin-top:14px">${[['名单', p.roster], ['已完成', p.done], ['完成率', Math.round(p.done / p.roster * 100) + '%']].map(k => `<div class="kpi"><small>${k[0]}</small><b>${k[1]}</b></div>`).join('')}</div></div>`;
}
function review(p) {
  const r = p.review, tot = r.dist.reduce((a, b) => a + b, 0), cur = Math.round(SURV().length / ROSTER * 100);
  return `<div class="card"><h3>${I('chart')}复盘 · ${p.name}<span class="sp"></span><button class="btn sec xs" data-act="wzCopy" data-arg="${p.id}">复制为新方案</button><button class="btn ghost xs" data-act="planBack">${I('left', 's')}返回</button></h3>
    <div class="kv"><span>第一责任人</span><b>${ST(p.owner).name}</b><span>人群</span><b>${p.target}</b><span>内容</span><b>${scaleTxt(p)}</b><span>时间</span><b>${p.start} – ${p.due} · ${p.waveTxt}</b></div>
    <div class="grid g4" style="margin:14px 0">${[['名单', p.roster], ['完成', `${r.done}（${Math.round(r.done / p.roster * 100)}%）`], ['平均用时', r.mins + ' 分钟'], ['危机触发', `${r.crisis} 条 · 12 小时内接收 ${r.recv}`]].map(k => `<div class="kpi"><small>${k[0]}</small><b style="font-size:20px">${k[1]}</b></div>`).join('')}</div>
    <div class="grid g2"><div class="card" style="margin:0"><h3>关注等级分布</h3>${[5, 4, 3, 2, 1].map((l, i) => `<div class="hb"><span>${l} ${LVN[l]}</span><span class="bar"><i style="width:${Math.round(r.dist[i] / tot * 100)}%;background:${LVC[l]}"></i></span><span>${r.dist[i]} · ${(r.dist[i] / tot * 100).toFixed(1)}%</span></div>`).join('')}</div>
      <div class="card" style="margin:0"><h3>完成率</h3>${r.cols.map(([c, v]) => `<div class="hb"><span>${c}</span><span class="bar"><i style="width:${v}%"></i></span><span>${v}%</span></div>`).join('')}<p class="note">对比：本学期第 1 波目前完成率 ${cur}%。</p></div></div>
    <div class="fld" style="margin-top:14px"><label>复盘笔记（下次施测前，新建方案时会提示这里的内容）</label><textarea data-bind="plan.notes" style="width:100%;min-height:90px;border:1px solid var(--line);border-radius:10px;padding:10px;background:#fff">${esc(r.notes)}</textarea></div>
    <div style="display:flex;justify-content:flex-end"><button class="btn pri xs" data-act="reviewSave" data-arg="${p.id}">保存复盘笔记</button></div></div>`;
}

/* ---------- 新建向导：1 基本信息与名单 → 2 施测方案 → 3 时间与分波 → 4 预览 ---------- */
const WSTEPS = ['基本信息与名单', '施测方案', '时间与分波', '预览'];
const newWiz = () => ({ step: 0, id: null, name: '', owner: me(), tgt: [], grades: [], cols: [], imported: 0, scl: { 'PHQ-9': 1, 'GAD-7': 1 }, ai: '必做', start: '10/26', due: '11/09', valid: 7, waveBy: [], gw: {}, cw: {} });
const chipsSel = (key, arr, sel) => `<div class="opts">${arr.map(x => `<button class="${sel.includes(x) ? 'on' : ''}" data-act="wzT" data-arg="${key}|${x}">${sel.includes(x) ? I('check', 's') : ''}${x}</button>`).join('')}</div>`;
const one = (key, arr, v) => `<div class="opts">${arr.map(x => `<button class="${String(v) === String(x) ? 'on' : ''}" data-act="wzS" data-arg="${key}|${x}">${x}</button>`).join('')}</div>`;
function wizErr(w, st) {
  if (st === 0) { if (!w.name.trim()) return '请填写方案名称'; if (!w.owner) return '请指派第一责任人'; if (!w.tgt.length) return '请至少选一种目标人群'; if (w.tgt.includes('按年级') && !w.grades.length) return '请选择年级'; if (w.tgt.includes('按学院') && !w.cols.length) return '请选择学院'; if (w.tgt.includes('导入名单') && !w.imported) return '请先导入名单'; }
  if (st === 1 && !Object.keys(w.scl).length && w.ai === '不做') return '请至少选一个量表，或启用小屿访谈';
  if (st === 1 && Object.keys(w.scl).length && !Object.values(w.scl).some(Boolean) && w.ai !== '必做') return '至少要有一项必做内容';
  return '';
}
function wizard() {
  const w = S.wiz, st = w.step, last = PLANS.filter(p => p.st === 'done').pop();
  const head = `<div class="card"><h3>${I('plus')}${w.id ? '编辑草稿' : '新建施测方案'}<span class="sp"></span><button class="btn ghost xs" data-act="wzQuit">${I('x', 's')}关闭（未保存的改动会丢失）</button></h3>
    <div class="wsteps">${WSTEPS.map((x, i) => `<button class="${i === st ? 'on' : i < st ? 'done' : ''}" data-act="wzGo" data-arg="${i}"><i>${i < st ? '✓' : i + 1}</i>${x}</button>`).join('')}</div>`;
  let b = '';
  if (st === 0) b = `${last ? `<div class="dbox" style="margin-top:0"><b>上次复盘提示 · ${last.name}</b><p>${esc(last.review.notes)}</p></div>` : ''}
    ${fld('方案名称', `<input class="in" data-bind="wiz.name" value="${esc(w.name)}" placeholder="例如：2026 秋季学期新生适应追踪（第 2 次）">`)}
    ${fld('第一责任人（对完成率和后续跟进负责）', `<select class="in" data-bind="wiz.owner" data-rerender>${['c5', 'c4', 'c1', 'c2', 'c3', 'u1', 'u2'].map(x => `<option value="${x}" ${w.owner === x ? 'selected' : ''}>${ST(x).name} · ${ST(x).title}</option>`).join('')}</select>`)}
    ${fld('目标人群（可多选，叠加取并集；按年级 + 按学院同时选时取交集）', chipsSel('tgt', ['按年级', '按学院', '导入名单', '定向复测'], w.tgt))}
    ${w.tgt.includes('按年级') ? fld('选择年级', chipsSel('grades', GRADES, w.grades)) : ''}
    ${w.tgt.includes('按学院') ? fld('选择学院', chipsSel('cols', COLLEGES, w.cols)) : ''}
    ${w.tgt.includes('导入名单') ? fld('导入名单', w.imported ? `<div class="dbox" style="background:var(--ok-bg);border-color:#cfe0c8;margin:0"><b>已导入 ${w.imported} 人</b><p>学号匹配 ${w.imported - 2}，待核对 2 人 · <button class="lnk" data-act="wzImp" data-arg="0">重新导入</button></p></div>` : `<button class="locked" style="width:100%;padding:18px" data-act="wzImp" data-arg="128">${I('dl')}点击导入 xlsx / csv（演示：导入 128 人）</button>`) : ''}
    ${w.tgt.includes('定向复测') ? `<p class="note">定向复测：上次结果 3–5 级的学生，目前 ${STU.filter(s => curLv(s) >= 3).length} 人。</p>` : ''}
    <p class="note">预计名单约 <b>${wizRoster(w)}</b> 人。</p>`;
  if (st === 1) b = `${fld('量表（可多选；每个量表可设为必填或选填）', `<table class="t">${SCALES.map(([n, d]) => { const on = n in w.scl; return `<tr class="${on ? 'sel' : ''}"><td style="width:36px"><input type="checkbox" ${on ? 'checked' : ''} data-act="wzScale" data-arg="${n}"></td><td><b>${n}</b><small>${d}</small></td><td style="text-align:right">${on ? `<span class="note">必填</span> <span class="sw ${w.scl[n] ? 'on' : ''}" data-act="wzReq" data-arg="${n}" style="cursor:pointer"></span>` : ''}</td></tr>`; }).join('')}</table>`)}
    ${fld('小屿访谈', one('ai', ['必做', '选做', '不做'], w.ai))}
    <p class="note">学生作答顺序：${Object.keys(w.scl).join(' → ') || '（无量表）'}${w.ai !== '不做' ? ' → 小屿访谈' : ''}。预计用时约 ${Object.keys(w.scl).reduce((a, n) => a + SCALES.find(x => x[0] === n)[2], 0) + AIM[w.ai]} 分钟。14 天内做过的同一量表可以沿用。</p>`;
  if (st === 2) { const wv = ['第 1 波', '第 2 波', '第 3 波'];
    b = `${fld('开始 / 截止', `<div style="display:flex;gap:8px"><input class="in" data-bind="wiz.start" value="${esc(w.start)}" style="width:140px"><span style="align-self:center">至</span><input class="in" data-bind="wiz.due" value="${esc(w.due)}" style="width:140px"></div>`)}
    ${fld('有效期（每位学生收到链接后多少天内可作答）', one('valid', [3, 7, 14], w.valid))}
    ${fld('分波方式（可多选；不选则一次发出）', chipsSel('waveBy', ['按年级', '按学院'], w.waveBy))}
    ${w.waveBy.includes('按年级') ? fld('各年级放在哪一波', `<table class="t">${(w.grades.length ? w.grades : GRADES).map(g => `<tr><td>${g}</td><td style="text-align:right"><select data-bind="wiz.gw.${g}" data-rerender>${wv.map((x, i) => `<option value="${i + 1}" ${(w.gw[g] || 1) == i + 1 ? 'selected' : ''}>${x}</option>`).join('')}</select></td></tr>`).join('')}</table>`) : ''}
    ${w.waveBy.includes('按学院') ? fld('各学院放在哪一波', `<table class="t">${(w.cols.length ? w.cols : COLLEGES).map(c => `<tr><td>${c}</td><td style="text-align:right"><select data-bind="wiz.cw.${c}" data-rerender>${wv.map((x, i) => `<option value="${i + 1}" ${(w.cw[c] || 1) == i + 1 ? 'selected' : ''}>${x}</option>`).join('')}</select></td></tr>`).join('')}</table>`) : ''}
    <p class="note">每一波发布前都会做产能检查；波与波之间默认间隔 7 天。</p>`; }
  if (st === 3) { const n = wizRoster(w), c = capacity({ roster: n }), waves = Math.max(1, ...Object.values(w.gw).map(Number), ...Object.values(w.cw).map(Number));
    b = `<div class="preview"><h4>${esc(w.name) || '（未命名）'}</h4>
      <div class="kv"><span>第一责任人</span><b>${ST(w.owner).name} · ${ST(w.owner).title}</b><span>目标人群</span><b>${wizTarget(w) || '—'}</b><span>预计名单</span><b>${n} 人</b>
      <span>施测内容</span><b>${Object.entries(w.scl).map(([k, r]) => `${k}（${r ? '必填' : '选填'}）`).join('、') || '无量表'}${w.ai !== '不做' ? `、小屿访谈（${w.ai}）` : ''}</b>
      <span>时间</span><b>${w.start} – ${w.due} · 收到后 ${w.valid} 天内有效</b><span>分波</span><b>${w.waveBy.length ? `${w.waveBy.join(' + ')}，共 ${waves} 波` : '一次发出'}</b></div>
      ${w.waveBy.length ? `<table class="t" style="margin-top:10px"><tr><th>波次</th><th>包含</th></tr>${Array.from({ length: waves }, (_, i) => `<tr><td>第 ${i + 1} 波</td><td>${[...(w.waveBy.includes('按年级') ? (w.grades.length ? w.grades : GRADES).filter(g => (w.gw[g] || 1) == i + 1) : []), ...(w.waveBy.includes('按学院') ? (w.cols.length ? w.cols : COLLEGES).filter(c => (w.cw[c] || 1) == i + 1) : [])].join('、') || '—'}</td></tr>`).join('')}</table>` : ''}
      <h4 style="margin-top:16px">学生会收到的短信</h4><div class="sms">【NTU 心理咨询中心】同学你好，${esc(w.name) || '本次心理健康调查'}已开放，约 ${Object.keys(w.scl).reduce((a, k) => a + SCALES.find(x => x[0] === k)[2], 0) + AIM[w.ai]} 分钟，请在收到后 ${w.valid} 天内完成。结果只用于为你提供支持，不会出现在任何成绩或档案中。点击进入灵屿：lingyu.ntu.edu.sg/s/xxxx</div>
      <h4 style="margin-top:16px">产能预估（第一波）</h4><div class="chk"><div class="${c.free >= c.est ? 'v' : 'x'}">${I(c.free >= c.est ? 'check' : 'x', 's')}预计需要约 ${c.est} 个预咨询，初级池本周开放 ${c.free} 个</div><div class="${c.l2 <= RULES.cap ? 'v' : 'x'}">${I(c.l2 <= RULES.cap ? 'check' : 'x', 's')}L2 待复核 ${c.l2} 条（阈值 ${RULES.cap}）</div></div></div>`; }
  const err = wizErr(w, st);
  return head + b + `<div class="wfoot">${st ? `<button class="btn ghost" data-act="wzGo" data-arg="${st - 1}">${I('left', 's')}上一步</button>` : ''}<span class="sp"></span><button class="btn sec" data-act="wzSave">保存草稿</button>${st < 3 ? `<button class="btn pri" data-act="wzGo" data-arg="${st + 1}" ${err ? `title="${err}"` : ''}>${st === 2 ? '进入预览' : '下一步'} ${I('right', 's')}</button>` : `<button class="btn pri" data-act="wzPub">确认发布</button>`}</div></div>`;
}

Object.assign(ACT, {
  planTab(k) { S.tabs.plans = k; }, planOpen(id) { S.plan = id; S._p = null; }, planBack() { S.plan = null; S.wiz = null; S._p = null; },
  reviewSave(id) { const p = planOf(id); p.review.notes = S.planNotes ?? p.review.notes; log(`保存复盘笔记：${p.name}`, null, { obj: '施测方案' }); toast('已保存，新建方案时会提示'); },
  wzNew() { S.wiz = newWiz(); S._p = null; },
  wzEdit(id) { const p = planOf(id); S.wiz = Object.assign(newWiz(), JSON.parse(JSON.stringify({ ...p, edited: null })), { id, step: 0 }); if (p.name0) S.wiz.name = p.name; S._p = null; },
  wzCopy(id) { const p = planOf(id); S.wiz = Object.assign(newWiz(), { name: p.name.replace(/（第 (\d) 次）/, (m, n) => `（第 ${+n + 1} 次）`).replace('春季', '秋季'), owner: p.owner, scl: Object.fromEntries(p.scales), ai: p.ai, valid: p.valid }); S._p = null; },
  wzQuit() { S.wiz = null; },
  wzGo(i) { i = +i; const w = S.wiz; if (i > w.step) { for (let s = w.step; s < i; s++) { const e = wizErr(w, s); if (e) return toast(e); } } w.step = i; S._p = null; },
  wzT(a) { const [k, x] = a.split('|'), w = S.wiz; w[k] = w[k].includes(x) ? w[k].filter(y => y !== x) : [...w[k], x]; },
  wzS(a) { const [k, x] = a.split('|'); S.wiz[k] = isNaN(+x) ? x : +x; },
  wzScale(n) { const w = S.wiz; if (n in w.scl) delete w.scl[n]; else w.scl[n] = 1; },
  wzReq(n) { S.wiz.scl[n] = S.wiz.scl[n] ? 0 : 1; },
  wzImp(n) { S.wiz.imported = +n; if (+n) log(`施测方案导入名单：${n} 人`, null, { cat: '配置', obj: '施测方案' }); },
  wzSave() { const w = S.wiz; if (!w.name.trim()) return toast('请先填写方案名称');
    const d = Object.assign({}, JSON.parse(JSON.stringify(w)), { st: 'draft', edited: new Date(NOW), name0: 1 }); delete d.step;
    if (w.id) Object.assign(planOf(w.id), d); else { d.id = 'd' + (PLANS.length + 1); PLANS.push(d); w.id = d.id; }
    log(`保存施测方案草稿：${w.name}`, null, { cat: '配置', obj: '施测方案' }); S.wiz = null; S.tabs.plans = 'draft'; toast('已保存到草稿箱'); },
  wzPub() { for (let s = 0; s < 3; s++) { const e = wizErr(S.wiz, s); if (e) { S.wiz.step = s; return toast(e); } } S.mo = 'pubPlan:'; S.form = {}; },
  pubOk() { const w = S.wiz, n = wizRoster(w), c = capacity({ roster: n }); if (!c.ok && !S.form.note) return toast('产能不足时必须写明理由');
    const p = Object.assign({}, JSON.parse(JSON.stringify(w)), { st: 'run', roster: n, done: 0, target: wizTarget(w), scales: Object.entries(w.scl), waveTxt: w.waveBy.length ? w.waveBy.join(' + ') : '不分波' }); delete p.step;
    if (w.id) Object.assign(planOf(w.id), p); else { p.id = 'n' + (PLANS.length + 1); PLANS.push(p); }
    log(`发布施测方案：${w.name}（${n} 人，第一责任人 ${ST(w.owner).name}）${c.ok ? '' : `；产能检查未通过，仍然发布：${S.form.note}`}`, null, { cat: '配置', obj: '施测方案' });
    notify(w.owner, '站内 + 短信', `你是「${w.name}」的第一责任人，方案已发布`, null); S.mo = null; S.wiz = null; S.tabs.plans = 'run'; toast('已发布；第一责任人已收到通知'); },
});
