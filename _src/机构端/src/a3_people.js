/* ---------- 危机通道 ---------- */
const cMay = k => S.role === 'L3' || (S.role === 'L2' && k.assist === me());
/* 处置步骤：每一步都可以多次记录，每次记录带结果和备注 */
const CSTEPS = [
  ['contact', '联系学生', '复制号码用电话联系；记录是否接通。联系不上时用下面的升级动作。', ['已接通', '未接通', '关机 / 停机']],
  ['assess', '风险评估', '当面或电话评估，写下评估结论。', ['已约当面评估', '评估完成 · 需要陪同', '评估完成 · 可回宿舍并保持联系']],
  ['plan', '安全计划', '与学生共同制定，写下要点（预警信号、可求助的人、紧急电话）。', ['已签署', '口头约定', '学生拒绝']],
  ['parent', '告知家长 / 紧急联系人', '写明告知了谁、对方的反应。', ['已告知', '联系不上', '学生成年且拒绝，未告知']],
  ['refer', '转介（可选）', '需要时转介合作医院或校外机构。', ['已转介合作医院', '已转介校外机构', '暂不需要']],
];
const stepDone = (k, st) => (k.acts || []).some(a => a.step === st && !['未接通', '关机 / 停机', '已约当面评估', '联系不上'].includes(a.res));
const canCloseK = k => (k.acts || []).some(a => (a.step === 'contact' && a.res === '已接通' && a.to === '本人') || (a.step === 'assess' && a.res && a.res.startsWith('评估完成')));
function crisis() {
  const tab = S.tabs.crisis || 'open';
  const list = tab === 'open' ? [...crisisNew(), ...CRISES.filter(k => k.st === 'handling')] : CRISES.filter(k => k.st === 'closed');
  const k = list.find(x => x.id === S.crisis) || list[0], s = k && k.sid && SU(k.sid), may = k && cMay(k) && k.st === 'handling';
  const left = `<div style="width:280px;flex:none"><div class="tabs"><button class="${tab === 'open' ? 'on' : ''}" data-act="ctab" data-arg="open">未结案 <i class="${crisisNew().length ? 'r' : ''}">${CRISES.filter(x => x.st !== 'closed').length}</i></button><button class="${tab === 'closed' ? 'on' : ''}" data-act="ctab" data-arg="closed">已结案</button></div>
    ${list.map(x => { const y = x.sid && SU(x.sid), dn = CSTEPS.filter(c => stepDone(x, c[0])).length; return `<button class="card ccard ${x === k ? 'on' : ''}" data-act="crisisOpen" data-arg="${x.id}"><b>${y ? nm(y) : x.name}</b> <span class="pill ${x.st === 'new' ? 'r' : x.st === 'handling' ? 'w' : 'g'}">${{ new: '未接收', handling: '处置中', closed: '已结案' }[x.st]}</span><small>${y ? y.college : x.college} · ${x.type}</small><small class="whyl">${esc(crisisWhy(x, 1))}</small><small style="color:${x.st === 'new' ? 'var(--crit)' : 'var(--mute2)'}">${x.st === 'new' ? (cLeft(x) < 0 ? `已超时 ${dur(cLeft(x))}` : `剩 ${dur(cLeft(x))} 接收`) : x.st === 'handling' ? `负责：${ST(x.recv.by).name} · 步骤 ${dn}/5` : `结案 ${fmt(x.closed.at)}`}</small></button>`; }).join('') || '<div class="empty">没有记录</div>'}</div>`;
  if (!k) return `<div style="display:flex;gap:16px">${left}<div class="card" style="flex:1"><div class="empty">没有未结案的危机</div></div></div>`;
  const escTxt = k.esc >= 2 ? '已二级升级到分管领导（电话）' : k.esc ? `超过 ${k.urgent ? RULES.urgentMin + ' 分钟' : RULES.esc + ' 小时'}无人接收，已${k.urgent ? '再次呼叫值班并' : ''}升级到中心负责人` : `${dur(kEsc(k)[0] - hrs(kClock(k)))}后无人接收将升级到中心负责人${k.urgent ? `（紧急报告：${RULES.urgentMin} 分钟内必须确认）` : ''}`;
  const contacts = s ? [['本人', s.phone], [`${s.ec[0][1]} ${s.ec[0][0]}（自填）`, s.ec[0][2]], [`${s.ec[1][1]} ${s.ec[1][0]}（学校导入）`, s.ec[1][2]]] : [];
  const shown = ((k.shown || {})[me()]) || {}, pre = k.st === 'new';
  const phoneRows = contacts.map(([a, p]) => `<div class="crow"><span style="flex:1">${a}<small class="ph">+65 ${shown[a] && !pre ? p : p.slice(0, 1) + '*** ' + p.slice(-4)}</small></span>${k.st === 'closed' || !cMay(k) ? '' : pre ? `<span class="note">接收后才能查看和复制</span>` : `<button class="btn ghost xs" data-act="showPh" data-arg="${k.id}|${a}">${shown[a] ? '隐藏' : '显示'}</button><button class="btn sec xs" data-act="copyPh" data-arg="${k.id}|${a}">${I('file', 's')}复制号码</button>`}</div>`).join('');
  const steps = CSTEPS.map(([key, name, tip], i) => { const es = k.acts.filter(a => a.step === key), done = stepDone(k, key);
    return `<div class="cstep ${done ? 'done' : es.length ? 'part' : ''}"><div class="sn">${done ? I('check', 's') : i + 2}</div><div class="grow"><div class="st"><b>${name}</b>${done ? '<span class="pill g">已完成</span>' : es.length ? '<span class="pill w">进行中</span>' : ''}<span class="sp"></span>${may ? `<button class="btn ${done ? 'ghost' : 'sec'} xs" data-act="mo" data-arg="step:${k.id}|${key}">${I('edit', 's')}记录</button>` : ''}</div>
      ${es.length ? es.map(a => `<div class="se ${['未接通', '关机 / 停机', '联系不上'].includes(a.res) ? 'r' : ''}"><b>${esc(a.res || '')}</b>${a.to ? ` · ${esc(a.to)}` : ''}${a.min ? ` · ${a.min} 分钟` : ''}${a.note ? `<p>${esc(a.note)}</p>` : ''}<small>${fmt(a.at)}${a.by ? ' · ' + ST(a.by).name : ''}</small></div>`).join('') : `<p class="note" style="margin:2px 0 0">${tip}</p>`}
      ${key === 'contact' ? `<div class="phones">${phoneRows}</div>${may && k.acts.some(a => a.step === 'contact' && a.res !== '已接通') && !k.acts.some(a => a.step === 'contact' && a.res === '已接通' && a.to === '本人') ? `<div class="opts" style="margin-top:8px"><span class="note" style="align-self:center">联系不上时：</span>${['请辅导员 / 舍监上门确认', '通知校园安全处', '拨打 995 / 999'].map(x => `<button class="warn" data-act="mo" data-arg="esc:${k.id}|${x}">${I('arrowup', 's')}${x}</button>`).join('')}</div>` : ''}` : ''}</div></div>`; }).join('');
  const recvStep = `<div class="cstep ${k.recv ? 'done' : ''}"><div class="sn">${k.recv ? I('check', 's') : 1}</div><div class="grow"><div class="st"><b>接收</b>${k.recv ? `<span class="pill g">${ST(k.recv.by).name} · ${fmt(k.recv.at)}</span>` : `<span class="pill r">${cLeft(k) < 0 ? `已超时 ${dur(cLeft(k))}` : `剩 ${dur(cLeft(k))}`}</span>`}<span class="sp"></span>${!k.recv && S.role === 'L3' ? `<button class="btn red xs" data-act="recv" data-arg="${k.id}">确认接收并开始处置</button>` : ''}</div>${k.recv ? '' : `<p class="note" style="margin:2px 0 0">${escTxt}。确认接收后停止接收倒计时，并向相关人员显示当前负责人。</p>`}</div></div>`;
  const closeStep = `<div class="cstep ${k.st === 'closed' ? 'done' : ''}"><div class="sn">${k.st === 'closed' ? I('check', 's') : 7}</div><div class="grow"><div class="st"><b>结案</b><span class="sp"></span>${k.st === 'handling' && S.role === 'L3' ? `<button class="btn pri xs" data-act="mo" data-arg="close:${k.id}">结案</button>` : ''}</div>
    ${k.st === 'closed' ? `<div class="kv" style="margin-top:6px"><span>学生现状</span><b>${k.closed.state}</b><span>安全计划</span><b>${k.closed.plan}</b><span>家长</span><b>${k.closed.parent}</b><span>结案说明</span><b>${esc(k.closed.note)}</b><span>结案等级</span><b>${lvB(k.closed.lv)}</b><span>后续负责</span><b>${ST(k.closed.owner).name} · 24 小时内首次随访</b></div>` : `<p class="note" style="margin:2px 0 0">前提：已接通本人，或完成风险评估。结案后进入 24 小时随访。</p>`}</div></div>`;
  const assistRow = k.st === 'handling' ? `<div class="assist">${I('users', 's')}<span><b>协助人：</b>${k.assist ? ST(k.assist).name : '暂无'}<small>需要人手时，可以请一位咨询师协助。协助人能记录联系和处置步骤，但不能结案。</small></span>${S.role === 'L3' ? `<button class="btn ghost xs" data-act="mo" data-arg="assist:${k.id}">${k.assist ? '更换协助人' : '请人协助'}</button>` : ''}</div>` : '';
  const body = `<div style="flex:1;min-width:0">
    <div class="head" style="${k.st === 'closed' ? 'background:var(--ok-bg);border-color:#cfe0c8' : k.st === 'handling' ? 'background:var(--warn-bg);border-color:#ecd2ad' : ''}">${I('alert', 'l')}<div class="grow"><b>${s ? nm(s) : k.name} · ${s ? s.college : k.college} · ${k.type}</b><small class="whyl">触发：${esc(crisisWhy(k, 3))}</small><small>首次触发 ${fmt(k.at)} · 已通知：${k.notified.join('、')}</small></div>${s ? `<button class="btn ghost xs" data-act="open" data-arg="${s.id}">学生档案</button>` : ''}</div>
    ${!cMay(k) && k.st !== 'closed' ? `<p class="note" style="margin:-6px 0 12px">${I('lock', 's')} 咨询师默认只看；负责人请你协助后，才能复制号码、记录处置步骤。</p>` : ''}
    <div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)"><div class="card"><h3>${I('list')}处置步骤<span class="sp"></span><small>按顺序做，每一步都可以写备注</small></h3>${assistRow}${recvStep}${steps}${closeStep}</div>
      <div><div class="card"><h3>${I('flag')}触发时间线</h3><div class="tl">${k.src.map(t => `<div class="r">${esc(t.t)}<small>${fmt(t.at)}</small></div>`).join('')}</div></div>
      <div class="card"><h3>${I('bell')}通知与送达</h3>${NOTI.filter(n => n.ref === k.id).map(n => `<div class="ni"><div>${ST(n.to).name} · ${n.ch}<small>${esc(n.t)} · ${fmt(n.at)}</small></div><span class="pill ${n.st === '已确认' ? 'g' : ''}">${n.st}</span></div>`).join('') || '<p class="note">无</p>'}</div></div></div></div>`;
  return `<div style="display:flex;gap:16px;align-items:flex-start">${left}${body}</div>`;
}

/* ---------- 学生名单 ---------- */
const LAYER_LBL = { fdueOver: '随访逾期（到期超过 2 天）', fdue: '随访到期', 'over:L1': 'L1 核验超时', 'over:L2': 'L2 复核超时', L3: 'L3 决策', L1: 'L1 待核验' };
const LAYER_OPTS = () => isL1() ? [['L1', '待我核实'], ['fdue1', '随访到期'], ['follow', '随访中'], ['proc', '处理中'], ['done', '已结束'], ['redo', '待重做']]
  : [['crisis', '危机'], ['L1', 'L1 核验'], ['L2', 'L2 复核'], ['L3', 'L3 决策'], ['fdue1', '随访到期（L1 跟进）'], ['fdue2', '随访到期（负责咨询师）'], ['follow', '随访中'], ['invited', '已邀请预约'], ['redo', '待重做'], ['done', '已结束']];
function layerMatch(s, f) {
  if (f === 'fdue1') return fdueNow(s) && !s.owner;
  if (f === 'fdue2') return fdueNow(s) && !!s.owner;
  if (f === 'fdueOver') return fOver(s);
  if (f === 'fdue') return fdueNow(s);
  if (f === 'proc') return !['L1', 'follow', 'done', 'redo'].includes(s.stage);
  if (f.startsWith('over:')) return s.stage === f.slice(5) && overdue(s);
  const [st, qs] = f.split(':'); return s.stage === st && (!qs || qs.split(',').includes(s.queue));
}
function visibleStudents() { return isL1() ? STU.filter(s => s.follower === me() || s.reporter === me()) : STU; }
function searchHit(s, q) { q = q.toLowerCase(); return (S.role === 'L1s' ? s.code : canName() ? s.name + s.sid : nm(s)).toLowerCase().includes(q); }
function students() {
  const tab = S.tabs.students || 'all', f = S.f;
  let list = visibleStudents().slice();
  if (tab === 'mine') list = list.filter(s => s.assignee === me() || s.owner === me());
  if (tab === 'todo') list = list.filter(s => ['L1', 'L2', 'L3', 'crisis'].includes(s.stage) || fdueNow(s));
  if (tab === 'over') list = list.filter(s => overdue(s) || fOver(s));
  if (f.lv && canLv()) list = list.filter(s => String(curLv(s)) === f.lv);
  if (f.layer) list = list.filter(s => layerMatch(s, f.layer));
  if (f.col) list = list.filter(s => s.college === f.col);
  if (f.plan) list = list.filter(s => (s.plans || []).includes(f.plan));
  if (f.q) list = list.filter(s => searchHit(s, f.q));
  if (isL1() || !canLv()) list = byDue(list);
  else list.sort((a, b) => (b.stage === 'crisis') - (a.stage === 'crisis') || curLv(b) - curLv(a) || b.sig - a.sig || b.done - a.done);
  const per = 20, pages = Math.max(1, Math.ceil(list.length / per)); if (S.pg > pages) S.pg = 1;
  const rows = list.slice((S.pg - 1) * per, S.pg * per), L1 = isL1();
  const std = LAYER_OPTS().some(o => o[0] === f.layer);
  return `<div class="card"><div class="tabs">${[['all', L1 ? '我跟进的学生' : '全部'], ...(L1 ? [] : [['todo', '待处理'], ['mine', '我负责的']]), ['over', '已超时']].map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-act="stab" data-arg="${k}">${n}</button>`).join('')}<span style="flex:1"></span>${S.role === 'L3' && can(10) ? `<button class="btn sec xs" data-act="mo" data-arg="import:roster">${I('dl', 's')}导入 / 替换名单</button>` : ''}</div>
    ${f.layer && !std ? `<div class="chip">筛选：${esc(f.label || LAYER_LBL[f.layer] || f.layer)} · ${list.length} 人 <button data-act="clearF">${I('x', 's')}清除</button></div>` : ''}
    <div class="filters">${canLv() ? `<select data-bind="f.lv" data-rerender><option value="">全部等级</option>${[5, 4, 3, 2, 1].map(l => `<option value="${l}" ${f.lv == l ? 'selected' : ''}>${l} ${LVN[l]}</option>`).join('')}</select>` : ''}
      <select data-bind="f.layer" data-rerender><option value="">${L1 ? '全部状态' : '当前所在层'}</option>${LAYER_OPTS().map(([k, n]) => `<option value="${k}" ${f.layer === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      ${L1 ? '' : `<select data-bind="f.plan" data-rerender><option value="">全部施测方案</option>${PLANS.filter(p => p.st !== 'draft').map(p => `<option value="${p.id}" ${f.plan === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}</select>`}
      ${L1 ? '' : `<select data-bind="f.col" data-rerender><option value="">全部学院</option>${COLLEGES.map(c => `<option ${f.col === c ? 'selected' : ''}>${c}</option>`).join('')}</select>`}
      <span class="note">共 ${list.length} 人 · ${L1 || !canLv() ? '按剩余时限排序' : '一人一行，按危机 → 等级 → 信号格排序'}</span></div>
    <table class="t"><tr>${canLv() ? '<th>等级 · 信号</th>' : ''}<th>学生</th><th>学院 · 年级</th>${canLv() ? '<th>精筛方向</th>' : ''}<th>${L1 ? '状态' : '当前所在层'}</th><th>等了多久 / 时限</th><th>${L1 ? '' : '跟进人 / 负责'}</th></tr>
    ${rows.map(s => `<tr class="hov ${s.stage === 'crisis' && !L1 ? 'crit' : ''}" data-act="open" data-arg="${s.id}">${canLv() ? `<td>${lvB(curLv(s), s.sig)}${s.conf ? '' : '<small>初判，待确认</small>'}</td>` : ''}<td><b>${nm(s)}</b><small>${canName() ? s.sid : ''}</small></td><td>${s.college}<small>${s.year}</small></td>${canLv() ? `<td>${tags(s.fs)}</td>` : ''}<td>${layer(s)}</td><td>${['L1', 'L2', 'L3'].includes(s.stage) ? dur(hrs(s.since)) : '—'}${leftOf(s) != null ? `<small>${dueTag(leftOf(s))}</small>` : fdueNow(s) ? `<small>${fdueTag(s)}</small>` : ''}</td><td>${L1 ? '' : `${ST(s.follower).name}${s.owner ? ` / ${ST(s.owner).name}` : s.assignee && s.stage === 'L2' ? ` / ${ST(s.assignee).name}` : ''}`}</td></tr>`).join('') || '<tr><td colspan="7"><div class="empty">没有符合条件的学生</div></td></tr>'}</table>
    <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:10px">${Array.from({ length: pages }, (_, i) => `<button class="btn ${S.pg === i + 1 ? 'pri' : 'sec'} xs" data-act="pg" data-arg="${i + 1}">${i + 1}</button>`).join('')}</div></div>`;
}

/* ---------- 学生档案（抽屉） ---------- */
function report(s) {
  if (s.walkin) return '<div class="locked">名单外登记的学生，没有普测数据。请看「跟进时间线」里的登记内容。</div>';
  const lv = s.ai, q = i => canTalk() ? `<button class="btn ghost xs" data-act="quote" data-arg="${i}" title="查看原话">原话</button>` : '';
  const sleep = s.dirs.includes('睡眠') || s.fs.includes('睡眠障碍'), mood = s.fs.includes('抑郁') || s.dirs.includes('情绪'), anx = s.fs.includes('焦虑');
  const T = rows => `<table class="t">${rows.map(r => `<tr><td style="width:120px">${r[0]}</td><td>${r[1]}${r[2] != null ? ' ' + q(r[2]) : ''}</td></tr>`).join('')}</table>`;
  return `<div class="rep"><h4>一、基本信息</h4><div class="kv"><span>姓名 / 学号</span><b>${nm(s)} · ${canName() ? s.sid : '（已隐藏）'}</b><span>学院 / 年级</span><b>${s.college} · ${s.year}</b><span>完成时间</span><b>${fmt(s.done)} · 访谈 ${s.rounds} 轮 · ${s.mins} 分钟</b><span>一般问题方向</span><b>${tags(s.dirs) || '—'}</b></div>
    <h4>二、初筛综合报告</h4>
    ${T([['主诉', lv >= 4 ? '持续情绪低落、提不起劲，学业压力明显，影响日常节奏' : lv === 3 ? '课程压力较大，伴随睡眠变差和疲惫感' : lv === 2 ? '近期课程节奏紧，偶有熬夜，整体可应对' : '未报告明显困扰', 2], ['起始时间', lv >= 4 ? '一个多月，开学前已有苗头' : lv === 3 ? '约一个月' : '近一两周', 3], ['整体影响', lv >= 4 ? '学习效率下降，社交减少' : lv === 3 ? '白天精力不足，效率下降' : '基本不影响']])}
    <h4>自伤风险</h4>${T([['自杀 / 自伤', s.item9 >= 2 ? '<span class="pill r">明确提及</span> 访谈中出现消极念头表达' : s.item9 === 1 ? '<span class="pill w">PHQ-9 第 9 题「好几天」</span> 访谈中未展开' : '未提及', s.item9 >= 2 ? 5 : null], ['紧急建议', s.item9 >= 2 ? '已进入危机通道' : s.item9 === 1 ? '建议复核时直接询问' : '暂无紧急处置依据，仍需人工复核']])}
    <h4>生理 · 心理 · 社会功能</h4>${T([['睡眠', sleep ? (lv >= 4 ? '几乎每晚睡不好，入睡困难' : '入睡偏晚，偶有失眠') : '基本正常', 0], ['情绪', mood ? '低落、兴趣减退' : anx ? '紧张、担心多' : '平稳', 2], ['支持系统', lv >= 4 ? '不太愿意让别人担心，倾向自己扛' : '室友、家人可倾诉', 4], ['学习', s.dirs.includes('学业') ? '课程压力是主要压力源' : '未提及明显困难', 2]])}
    <h4>综合推断与待核实</h4><p style="font-size:13px;color:var(--ink2);margin:0">${lv >= 4 ? '多项指标指向中重度抑郁焦虑症状，支持系统偏弱，建议 48 小时内联系并邀请预咨询。待核实：是否有既往求助经历、家庭近况。' : lv === 3 ? '中度困扰，以学业压力和睡眠为主，功能部分受影响。待核实：睡眠问题持续时长。' : '轻度或无明显困扰，建议常规随访。'}</p>
    <h4>后续支持</h4>${T([['咨询重点', lv >= 4 ? '情绪评估、安全评估、建立支持' : '压力管理、睡眠卫生'], ['辅导员协同', lv >= 3 ? '关注出勤与作业提交，避免追问细节' : '无需特别协同'], ['转介建议', lv >= 4 ? '评估后视情况转介合作医院' : '暂不需要']])}
    <h4>三、深度访谈汇总</h4><table class="t"><tr><th>模块</th><th>当前程度</th><th>核心表现</th><th>功能影响</th><th>风险信号</th><th>建议处理</th></tr>${(s.fs.length ? s.fs : ['—']).map(x => `<tr><td>${x}</td><td>${lv >= 4 ? '达到阈值' : lv === 3 ? '接近阈值' : '未达阈值'}</td><td>${x === '睡眠障碍' ? '入睡困难、早醒' : x === '焦虑' ? '担心多、难放松' : x === '抑郁' ? '低落、兴趣减退' : '—'}</td><td>${lv >= 3 ? '学习效率下降' : '轻微'}</td><td>${s.item9 ? '<span class="pill r">有</span>' : '未见明确信号'}</td><td>${lv >= 4 ? '心理咨询' : lv === 3 ? '持续关注' : '常规'}</td></tr>`).join('')}</table>${typeof mmBox === 'function' && !isL1() ? mmBox(s) : ''}</div>`;
}
function convo(s) { if (s.walkin) return '<div class="note">名单外登记，没有访谈记录。</div>'; const a = ANS[s.ai];
  return SCRIPT.slice(0, s.rounds).map((qq, i) => `<div class="msg"><img src="${MASCOT}" alt=""><div class="bb">${qq}</div></div><div class="msg me" id="q${i}"><div class="bb">${S.dw.hl === i ? `<mark>${a[i]}</mark>` : a[i]}</div></div>`).join(''); }
/* L1 只看到事件类型；原因、备注、等级只给 L2 及以上 */
function tlText(e) {
  if (!isL1() || canLv()) return esc(e.t);
  if (['done', 'l1keep', 'l1up', 'fb1', 'invalid', 'l1add', 'report'].includes(e.k) && e.who === ST(me()).name || e.k === 'done') return esc(e.k === 'done' ? '完成普测' : e.t);
  if (e.k === 'ack') return `${e.who} 已确认接手`;
  if (e.k === 'crisis' && /^危机结案/.test(e.t)) return '危机已处置结案，进入随访';
  if (e.k === 'ask') return '咨询中心请你协助';
  if (e.k === 'crisis' && S.role === 'L1') return '进入危机通道，由负责人处理';
  if (e.k === 'book') return '预约状态更新';
  return '专业人员已跟进（详情仅咨询师可见）';
}
/* 谁能对这个学生动手：按所在层和负责人校验 */
function actScope(s) {
  const r = S.role, u = me();
  if (s.stage === 'crisis') return 'crisis';
  if (r === 'L3') return 'full';
  if (r === 'L2') return ((s.stage === 'L2' && s.assignee === u) || (s.stage === 'invited' && s.assignee === u) || s.owner === u) ? 'full' : 'ro';
  if (isL1()) return s.follower === u && (s.stage === 'L1' || (s.stage === 'follow' && !s.owner)) ? 'l1' : 'ro';
  return 'ro';
}
function drawer() {
  const s = SU(S.dw.sid), r = S.role, scope = actScope(s), L1 = isL1();
  const tab = S.dw.tab || (canRep() ? 'rep' : 'tl');
  const ab = activeBook(s), invBtn = ab ? `<button class="btn sec xs" disabled title="已有预约">已有预约 · ${BST[ab.st].replace(/<[^>]+>/g, '')}</button>` : s.invAt && hrs(s.invAt) < 24 ? `<button class="btn sec xs" disabled>已邀请（${dur(hrs(s.invAt))}前）</button>` : `<button class="btn sec xs" data-act="invite" data-arg="${s.id}">${s.invAt ? '再次邀请' : '邀请预约'}</button>`;
  let acts = [];
  if (scope === 'crisis') acts = isL1() ? (s.follower === me() || s.reporter === me() ? [`<button class="btn sec xs" data-act="mo" data-arg="l1add:${s.id}">追加情况</button>`] : []) : [`<button class="btn red xs" data-act="crisisFor" data-arg="${s.id}">去危机通道</button>`];
  else if (scope === 'l1') acts = (s.stage === 'L1' ? [`<button class="btn pri xs" data-act="mo" data-arg="verify:${s.id}">${s.queue === 'pending' ? '继续核实' : '核验'}</button>`, s.quality ? `<button class="btn sec xs" data-act="mo" data-arg="quality:${s.id}">作答质量待核实</button>` : ''] : []).concat(s.stage === 'follow' ? [`<button class="btn pri xs" data-act="mo" data-arg="fb:${s.id}">写随访记录</button>`] : []).concat((s.asks || []).some(a => !a.done) ? [`<button class="btn pri xs" data-act="mo" data-arg="askDone:${s.id}">完成中心的协助请求</button>`] : []).concat([`<button class="btn red xs" data-act="mo" data-arg="report:urgent">报告紧急情况</button>`]).filter(Boolean);
  else if (isL1() && s.follower === me()) acts = [`<button class="btn sec xs" data-act="mo" data-arg="l1add:${s.id}">追加情况</button>`, ...((s.asks || []).some(a => !a.done) ? [`<button class="btn pri xs" data-act="mo" data-arg="askDone:${s.id}">完成中心的协助请求</button>`] : []), `<button class="btn red xs" data-act="mo" data-arg="report:urgent">报告紧急情况</button>`];
  else if (scope === 'full') {   // v1.13：按学生所在层只露出 1–2 个主按钮，其余收进「更多」；「转危机」始终在，次要样式
    const rev = ['L1', 'L2', 'L3'].includes(s.stage) || ['review4', 'up', 'review3', 'sample', 'verify'].includes(s.queue);
    const B = [
      [r === 'L3' && s.queue === 'down' ? `<button class="btn pri xs" data-act="mo" data-arg="downOk:${s.id}">同意降为 ${s.downTo} 级</button><button class="btn sec xs" data-act="mo" data-arg="downNo:${s.id}">驳回，维持 ${s.lv} 级</button>` : '', 1],
      [r === 'L3' && s.queue === 'hard' ? `<button class="btn pri xs" data-act="mo" data-arg="assign:${s.id}">指派高级咨询师</button>` : '', 1],
      [s.queue === 'quality' ? `<button class="btn pri xs" data-act="qOk" data-arg="${s.id}">作答有效，继续流转</button><button class="btn sec xs" data-act="qRedo" data-arg="${s.id}">请学生重做</button>` : '', 1],
      [['declined', 'noresp'].includes(s.queue) ? `<button class="btn sec xs" data-act="mo" data-arg="contact:${s.id}">记录联系结果</button>` : '', 1],
      [r === 'L3' && RULES.l3l2 && s.stage === 'L2' && s.assignee !== me() && ['review4', 'up', 'review3', 'quality'].includes(s.queue) ? `<button class="btn pri xs" data-act="l3Claim" data-arg="${s.id}">领取复核</button>` : '', 1],
      [(r === 'L2' || r === 'L3' && RULES.l3l2) && s.stage === 'L2' && s.assignee === me() && !s.ack ? `<button class="btn pri xs" data-act="mo" data-arg="ack:${s.id}">确认接手</button>` : '', 1],
      [can(6) && s.queue !== 'down' && !(r === 'L3' && !RULES.l3l2 && ['L1', 'L2'].includes(s.stage)) ? `<button class="btn ${['review4', 'up', 'review3', 'sample', 'verify'].includes(s.queue) ? 'pri' : 'sec'} xs" data-act="mo" data-arg="conf:${s.id}">${r === 'L3' && ['L1', 'L2'].includes(s.stage) && s.assignee !== me() ? '代办：' : ''}确认 / 调整等级</button>` : '', rev],
      [s.stage === 'follow' ? `<button class="btn sec xs" data-act="mo" data-arg="fb:${s.id}">写随访反馈</button>` : '', 1],
      [s.queue !== 'down' ? invBtn : '', ['invited', 'follow'].includes(s.stage)],
      [!s.walkin ? `<button class="btn sec xs" data-act="mo" data-arg="ask:${s.id}">请学院协助</button>` : '', 0],
      [r === 'L2' ? `<button class="btn sec xs" data-act="mo" data-arg="up2:${s.id}">上推 L3</button>` : '', 0]].filter(x => x[0]);
    const main = B.filter(x => x[1]).slice(0, 2), rest = B.filter(x => !main.includes(x));
    if (!main.length && rest.length) main.push(rest.shift());
    acts = main.map(x => x[0]).concat(rest.length ? [`<details class="dmore"><summary class="btn sec xs">更多</summary><div class="dmenu">${rest.map(x => x[0]).join('')}</div></details>`] : [],
      [`<button class="btn sec xs dgr" data-act="mo" data-arg="toCrisis:${s.id}">转危机</button>`]);
  }
  const holderTxt = s.stage === 'L1' ? `L1 核验（${ST(s.follower).name}）` : s.stage === 'L2' ? `L2 复核（${ST(s.assignee).name}）` : s.stage === 'L3' ? 'L3 决策' : s.owner ? `负责咨询师 ${ST(s.owner).name}` : layerTxt(s);
  const TABS = [['rep', '筛查与报告', 2], ['score', '深度访谈评分', 2], ['risk', '危机风险', 3], ['scale', '量表结果', 2], ['talk', '完整对话', 3], ['ex', '对话摘录（脱敏）', -1], ['tl', '跟进时间线', -1], ['bk', '预约与咨询', 1], ['ops', '操作记录', -1]];
  const locked = k => { if (k === 'ex') return !(L1 && !can(3)); const t = TABS.find(x => x[0] === k); return t[2] >= 0 && !can(t[2]) || (k === 'ops' && L1); };
  let body = '';
  if (locked(tab)) body = `<div class="locked">${I('lock')}这一项只给心理中心的老师看。你能看的内容在上面的页签里。</div>`;
  else if (tab === 'rep') body = `<div class="card">${report(s)}</div>`;
  else if (tab === 'score') body = `<div class="card"><h3>深度访谈评分</h3>${['情绪', '睡眠', '学业', '人际', '自我评价'].map((x, i) => { const v = Math.min(5, Math.max(1, s.ai - (i % 3 === 0 ? 0 : 1) + (s.dirs.includes(x) ? 1 : 0))); return `<div class="hb"><span>${x}</span><span class="bar"><i style="width:${v * 20}%;background:${LVC[Math.min(5, v)]}"></i></span><span>${v} / 5</span></div>`; }).join('')}<p class="note">评分由小屿访谈生成，只作为复核线索，不替代专业判断。</p></div>`;
  else if (tab === 'risk') body = `<div class="card"><h3>危机风险</h3><div class="kv"><span>PHQ-9 第 9 题</span><b>${['完全不会', '好几天', '一半以上的天数', '几乎每天'][s.item9]}</b><span>访谈危机表达</span><b>${s.ai >= 5 ? `有 <button class="btn ghost xs" data-act="quote" data-arg="5">查看原话</button>` : '无'}</b><span>危机记录</span><b>${CRISES.filter(k => k.sid === s.id).map(k => `${fmt(k.at)} · ${{ new: '未接收', handling: '处置中', closed: '已结案' }[k.st]}`).join('；') || '无'}</b></div></div>`;
  else if (tab === 'scale') body = `<div class="card"><h3>量表结果</h3><table class="t"><tr><th>量表</th><th>得分</th><th>分档</th></tr><tr><td>PHQ-9</td><td>${s.phq} / 27</td><td>${s.phq >= 20 ? '重度' : s.phq >= 15 ? '中重度' : s.phq >= 10 ? '中度' : s.phq >= 5 ? '轻度' : '极轻微'}</td></tr><tr><td>GAD-7</td><td>${s.gad} / 21</td><td>${s.gad >= 15 ? '重度' : s.gad >= 10 ? '中度' : s.gad >= 5 ? '轻度' : '极轻微'}</td></tr></table><p class="note">历次结果：${s.hist.map(h => `${h.t}：${h.lv ? h.lv + ' 级' : '未完成'}`).join('；') || '本次为第一次'}</p></div>`;
  else if (tab === 'talk') body = `<div class="card"><h3>完整对话 · ${s.rounds} 轮</h3>${convo(s)}</div>`;
  else if (tab === 'ex') body = exCard(s);
  else if (tab === 'tl') { const rows = s.tl.slice().sort((a, b) => a.at - b.at).map(e => ({ e, t: tlText(e) })).filter((x, i, a) => !L1 || i === 0 || x.t !== a[i - 1].t);
    body = `<div class="card"><h3>跟进时间线</h3><div class="tl">${rows.map(({ e, t }) => `<div class="${e.r && !L1 ? 'r' : ''}">${t}<small>${fmt(e.at)} · ${L1 && !['done', 'l1keep', 'l1up', 'fb1', 'invalid', 'l1add', 'report'].includes(e.k) && e.who !== '系统' && e.who !== '学生' ? '咨询中心' : e.who}</small></div>`).join('')}</div></div>`; }
  else if (tab === 'bk') { const bs = BOOK.filter(b => b.sid === s.id); body = `<div class="card"><h3>预约与咨询<span class="sp"></span><small>本 14 天：改期 ${s.q.chg}/1 · 取消 ${s.q.cancel}/1（老师改约不计）</small></h3>${bs.length ? bookTable(bs) : '<div class="empty">还没有预约</div>'}
      ${bs.filter(b => b.rec).map(b => (S.role === 'L3' || b.rec.by === me()) ? `<div class="recbox"><b>咨询记录 · ${slotTxt(b)} · ${ST(b.rec.by).name}</b><p>${esc(b.rec.note)}</p><small>建议等级 ${b.rec.lv || '—'} · 接下来：${b.rec.next}</small></div>` : `<div class="locked">${I('lock')}咨询记录只给负责咨询师和 L3 看</div>`).join('')}
      <p class="note">${s.owner ? `负责咨询师：${ST(s.owner).name}` : '还没有负责咨询师'}${s.invAt ? ` · 最近一次邀请 ${fmt(s.invAt)}` : ''}</p></div>`; }
  else body = `<div class="card"><h3>操作记录</h3><table class="t">${AUDIT.filter(a => a.sid === s.id).map(a => `<tr><td>${fmt(a.at)}</td><td>${a.uid === 'sys' ? '系统' : ST(a.uid).name}</td><td>${esc(a.t)}</td></tr>`).join('') || '<tr><td><div class="note">本次演示中还没有对该学生的操作。</div></td></tr>'}</table></div>`;
  const ob = s.l1obs, obsBox = (ob && !L1 ? `<div class="dbox" style="background:var(--pri-t);border-color:var(--soft2)"><b>辅导员 ${ST(ob.by).name} 记录的事实（${fmt(ob.at)}）</b>${ob.areas ? `<table class="t" style="margin-top:6px">${Object.entries(ob.areas).filter(([k, x]) => x.v).map(([k, x]) => `<tr><td style="width:110px">${({ contact: '联系结果', study: '学习参与', daily: '日常联系', diff: '已知困难', need: '支持需要' })[k]}</td><td>${x.v}${x.dir ? ' · ' + x.dir : ''}</td><td class="note">${x.src || ''}${x.win ? ' · ' + x.win : ''}</td></tr>`).join('')}</table>` : `<p>${(ob.items || []).join('、') || '—'}</p>`}${ob.note ? `<p>${esc(ob.note)}</p>` : ''}</div>` : '')
    + (s.queue === 'quality' && !L1 ? `<div class="dbox"><b>作答质量待核实</b><p>系统提示：${s.quality}${s.qnote ? `；辅导员说明：${esc(s.qnote)}` : ''}</p></div>` : '')
    + (s.pref ? `<div class="dbox"><b>联系偏好（${ST(s.pref.by).name} 记录于 ${fmt(s.pref.at)}）</b><p>${esc(prefTxt(s.pref))}</p></div>` : '')
    + (!L1 && (s.asks || []).length ? `<div class="dbox" style="background:var(--pale);border-color:var(--line2)"><b>学院协助请求</b>${s.asks.map(a => `<p>${esc(a.what)} · ${ST(s.follower).name} · ${a.done ? '<span class="pill g">完成</span>' : a.st ? `<span class="pill w">${a.st}</span>` : '<span class="pill">已发出</span>'} · 期限 ${fmt(a.due)}${a.log.length ? `<br><small class="note">${a.log.map(l => `${fmt(l.at)} ${l.st}${l.note ? '：' + esc(l.note) : ''}`).join('；')}</small>` : ''}</p>`).join('')}</div>` : '');
  const downBox = s.queue === 'down' && !L1 ? `<div class="dbox"><b>${ST(s.downBy).name} 申请把 ${s.lv} 级降为 ${s.downTo} 级</b><p>${esc(s.downWhy)}</p></div>` : '';
  return `<div class="dw-ov" data-act="dwClose"></div><div class="dw"><div class="dh"><div class="grow"><h2>${nm(s)} ${canLv() ? lvB(curLv(s)) : ''} ${layer(s)}</h2>
    <p>${canName() ? `${s.sid} · ${s.gender} · ${s.college} · ${s.year} · ${s.campus} · ${!s.phone ? '电话未填写' : s.stage === 'crisis' ? `+65 8*** ${s.phone.slice(-4)}（危机处理中，号码在危机通道按权限查看）` : `+65 ${s.phone}`}` : `${s.college} · ${s.year}`}</p>
    ${isL1() && s.stage !== 'L1' ? `<p>${s.stage === 'crisis' ? (() => { const k = CRISES.find(x => x.sid === s.id && x.st !== 'closed'); return k && k.recv ? `${I('check', 's')} 危机通道：${ST(k.recv.by).name} 已接收（${fmt(k.recv.at)}），正在处理` : '危机通道：已通知值班，等待确认接收'; })() : s.ack ? `${I('check', 's')} ${ST(s.ack.by).name} 已确认接手（${fmt(s.ack.at)}）· 下一步：${esc(s.ack.next || '')}` : s.viewed ? `${ST(s.viewed.by).name} 已查看，尚未确认接手` : s.stage === 'L2' ? '已交给咨询中心，等待对方接手' : ''}</p>` : ''}${s.walkin ? '<p><span class="pill w">名单外登记</span> 没有普测数据</p>' : ''}
    ${why(s) ? `<p class="whyl">为什么在这里：${esc(why(s, 3))}</p>` : ''}<p>现在在：${holderTxt}${!L1 && s.owner && s.stage !== 'follow' ? ` · 负责咨询师 ${ST(s.owner).name}` : ''}${canLv() ? (s.conf ? ` · 已确认 ${s.conf} 级` : ` · 初判 ${s.ai} 级，待确认`) : ''}</p></div><button class="btn ghost" data-act="dwClose">${I('x')}</button></div>
    ${acts.length ? `<div class="acts"><small>${RN[r]}</small>${acts.join('')}</div>` : `<div class="acts ro"><small>${I('lock', 's')} 只读</small><span class="note">该学生现在在「${holderTxt}」，${r === 'L2' ? '不在你的队列里' : '不需要你处理'}。</span></div>`}
    <div class="db"><div class="tabs">${TABS.filter(([k]) => !locked(k) && (S.full || S.dmore || k === tab || ['rep', 'tl', 'talk', 'ex', 'bk'].includes(k) || (L1 && k === 'tl'))).map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-act="dtab" data-arg="${k}">${locked(k) ? I('lock', 's') : ''}${n}</button>`).join('')}${S.full ? '' : `<button class="lnk" data-act="dmore">${S.dmore ? '收起' : `更多 ${TABS.filter(([k]) => !(['rep', 'tl', 'talk', 'bk'].includes(k) && !locked(k)) && k !== tab).length}`}</button>`}</div>${downBox}${obsBox}${body}</div></div>`;
}
