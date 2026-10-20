/* =====================================================================
   v1.14 · 谈话记录：整页填写（必填 4 项，其余按情况展开）、查看、追加、申请更正、分享、SIS 同步（占位）
===================================================================== */
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const recDayLbl = v => { const d = new Date(v + 'T00:00'), n = Math.round((new Date(NOW).setHours(0, 0, 0, 0) - d) / 864e5); return isNaN(d) ? '' : `${d.getMonth() + 1}月${d.getDate()}日${['（今天）', '（昨天）', '（前天）'][n] || ''}`; };
const recAt = R => { const m = /^(\d{1,2}):(\d{2})$/.exec((R.tm || '').trim()); if (!R.date || !m || +m[1] > 23 || +m[2] > 59) return null; const d = new Date(R.date + 'T00:00'); if (isNaN(d)) return null; d.setHours(+m[1], +m[2], 0, 0); return d; };
/* 从待谈心进来时，自动关联这个学生今天及以前的有效邀约 */
const activeInv = sid => INV.filter(v => v.sid === sid && v.by === me() && ['ok', 'wait', 'wait2', 'change', 'expired'].includes(v.st) && !v.outcome && v.start <= new Date(new Date(NOW).setHours(23, 59, 59))).sort((a, b) => b.start - a.start)[0];
const recNew = (sid, ivid) => { const v = ivid ? INV.find(x => x.id === ivid) : sid && activeInv(sid), s = sid && SU(sid), its = s ? myItems().filter(x => x.sid === sid && x.st === 'open' && itDue(x)) : [];
  const prev = s && TALKS.filter(t => !t.draft && (t.sids || [t.sid]).includes(sid) && (recOwner(t) || recVis(t) === 'full')).sort((a, b) => b.at - a.at)[0];
  return { sids: s ? [sid] : [], who: ['本人'], date: ymd(v && v.start <= NOW ? v.start : NOW), tm: v && v.start <= NOW ? `${pad(v.start.getHours())}:${pad(v.start.getMinutes())}` : `${pad(NOW.getHours())}:${pad(NOW.getMinutes())}`, plan: v ? v.start : null, inv: v ? v.id : null,
    mode: v ? v.mode : '', place: v ? v.place : '', result: '', situ: '', types: [], need: '', topic: '', next: '不需要', center: false, cwhy: '',
    done: v && v.items.length ? v.items.filter(id => its.some(x => x.id === id)) : its.map(x => x.id), shares: [], sis: null, prev: prev ? prev.id : null, same: !!prev, pp: {}, dirty: false }; };
const recOf = () => S.rec;
const psych = R => R.types.includes('心理健康') || R.center || R.risk || recRisk(R) || myItems().some(x => R.done.includes(x.id) && x.src === 'center');
const sisDef = R => R.sis == null ? !psych(R) : R.sis;
const forcedWhy = R => [myItems().some(x => R.done.includes(x.id) && x.src === 'center') && '中心派的任务', R.center && '勾了「希望心理中心介入」', R.risk && '命中危机词'].filter(Boolean);
const tog = (k, v, on, txt) => `<button class="${on ? 'on' : ''}" data-act="rcT" data-arg="${k}|${v}">${txt || v}</button>`;
const rin = (k, ph, w = '100%') => `<input class="in" style="width:${w}" data-rb="${k}" value="${esc(S.rec[k] || '')}" placeholder="${ph}">`;
const rta = (k, ph) => `<textarea data-rb="${k}" placeholder="${ph}">${esc(S.rec[k] || '')}</textarea>`;
function recPage() { const R = S.rec, edit = R.id && TALKS.find(t => t.id === R.id), title = edit ? `谈话记录 ${tkId(edit)}` : '新的谈话记录';
  const studs = R.sids.map(SU), cand = R.pick != null ? STU.filter(s => tkScope(s) && !R.sids.includes(s.id) && (!R.pick || s.name.includes(R.pick) || s.sid.includes(R.pick))).slice(0, 6) : [];
  const talked = ['已谈', '只和第三方谈了'].includes(R.result), eff = R.result === '已谈' && R.who.includes('本人'), multi = R.sids.length > 1;
  const its = myItems().filter(x => R.sids.includes(x.sid) && x.st === 'open' && itDue(x)), fw = forcedWhy(R), sis = sisDef(R);
  const first = !R.prev || !R.same, lockC = edit && !edit.draft && recLocked(edit);
  const shareCand = R.spick != null ? TALKERS().filter(u => u !== me() && !R.shares.some(x => x.to === u) && (!R.spick || ST(u).name.includes(R.spick))).sort((a, b) => (STAFF[a].role === 'L1' && staffCols(a).includes((studs[0] || {}).college) ? 0 : 1) - (STAFF[b].role === 'L1' && staffCols(b).includes((studs[0] || {}).college) ? 0 : 1)).slice(0, 6) : [];
  return `<div class="card recp"><div class="crumb"><button class="lnk" data-act="recBack">谈心</button> / ${title}${R.dirty ? '<small class="note">· 有未保存的修改</small>' : ''}<span class="sp"></span><span class="note">草稿不完成任务</span>${edit && !edit.draft ? '' : '<button class="btn sec" data-act="recSave" data-arg="draft">保存草稿</button>'}<button class="btn pri" data-act="recSave" data-arg="">保存</button></div>
    ${lockC ? `<p class="note warn">这条记录已超过 24 小时${edit.corrOk ? '，中心已批准更正，可以再改一次' : '，只能追加'}。</p>` : ''}
    <h4>必填 4 项<small class="note">谈话对象、谈话时间、方式、结果；其余都是选填</small></h4>
    <div class="fld"><label class="rq">谈话对象</label><div class="chips">${studs.map(s => `<span class="chip">${s.name}<small>${s.college}</small>${edit && !edit.draft ? '' : `<button class="lnk" data-act="rcDel" data-arg="${s.id}">×</button>`}</span>`).join('')}${edit && !edit.draft ? '' : `<button class="btn ghost xs" data-act="rcPick">${I('plus', 's')}${studs.length ? '加一位学生（多人谈话）' : '选择学生'}</button>`}</div>
      ${R.pick != null ? `<div class="pickbox"><input class="in" style="width:240px" data-rb="pick" data-rr value="${esc(R.pick)}" placeholder="输入姓名或学号">${cand.map(s => `<button class="btn sec xs" data-act="rcAdd" data-arg="${s.id}">${s.name} · ${s.college}</button>`).join('') || `<span class="note" title="${HINT[isT() ? 'gone' : 'sMiss']}">没有找到 ${hintQ('sMiss')}</span>`}</div>` : ''}
      <div class="opts" style="margin-top:8px">${WHO.map(w => tog('who', w, R.who.includes(w))).join('')}</div><small class="note">谈话对象包含学生本人，才计入谈心频率。</small></div>
    <div class="grid g2 rqg"><div class="fld"><label class="rq">谈话时间${R.plan ? `<small>计划 ${fmt(R.plan)}</small>` : ''}</label><div class="opts"><input class="in" type="date" style="width:150px" data-rd value="${esc(R.date || '')}" max="${ymd(NOW)}"><input class="in" type="time" style="width:120px" data-rb="tm" value="${esc(R.tm)}"></div><small class="note">${R.date ? recDayLbl(R.date) : '请选日期'}${R.tm ? ' ' + esc(R.tm) : ''} · 不能选以后的时间</small></div>
      <div class="fld"><label class="rq">方式</label><div class="opts">${MODES.map(m => tog('mode', m, R.mode === m)).join('')}</div>${R.mode === '面对面' ? `<label style="margin-top:8px">地点</label><div class="opts">${PLACES.map(p => tog('place', p, R.place === p)).join('')}</div>` : ''}</div>
</div>
      <div class="fld"><label class="rq">结果</label><div class="opts">${RESULTS.map(r => tog('result', r, R.result === r)).join('')}</div></div>
    ${talked ? `<h4>谈了什么</h4>
      ${R.prev ? `<div class="fld"><label>关联上一次</label><div class="opts">${tog('same', '1', R.same, `是同一件事（${fmt(TALKS.find(t => t.id === R.prev).at).split(' ')[0]} 的记录）`)}${tog('same', '0', !R.same, '新事项')}</div></div>` : ''}
      <div class="fld"><label>${multi ? '共同部分 · ' : ''}学生的情况</label>${lockC && !edit.corrOk ? `<div class="sms">${esc(R.situ)}</div>` : rta('situ', '你看到了什么、学生怎么说、可能的原因（可以写「尚不了解」）')}</div>
      ${multi ? studs.map(s => { const p = R.pp[s.id] || {}; return `<div class="pp"><b>${s.name} · 个人部分</b><label class="ckl"><input type="checkbox" ${p.absent ? '' : 'checked'} data-act="rcPP" data-arg="${s.id}|absent"> 到场</label><label class="ckl"><input type="checkbox" ${p.done ? 'checked' : ''} data-act="rcPP" data-arg="${s.id}|done"> 个人部分写完了</label>
        <textarea data-rpp="${s.id}" placeholder="只和这位学生有关的情况">${esc(p.txt || '')}</textarea></div>`; }).join('') + '<p class="note">每个学生档案里只显示共同部分和他自己的那一段；按人计次，可以分人保存、分人完成。</p>' : ''}
      ${R.askWho ? `<div class="fld warnbox dbox"><label>共同部分里有安全相关的表达，涉及哪个学生？</label><div class="opts">${studs.map(s => tog('cw', s.id, R.cw === s.id, s.name)).join('')}${tog('cw', 'all', R.cw === 'all', '不确定是谁（在场的都标上）')}</div></div>` : ''}
      <div class="fld"><label>情况类型<small>可多选</small></label><div class="opts">${TYPES.map(t => tog('types', t, R.types.includes(t))).join('')}</div></div>
      <div class="grid g2"><div class="fld"><label>学生表达的需要<small>选填</small></label>${rta('need', '例如：希望延期提交一份作业')}</div><div class="fld"><label>主题<small>选填</small></label>${rin('topic', '一行，例如：期中压力')}</div></div>` : ''}
    <h4>后续</h4>
    <div class="grid g2"><div class="fld"><label>下次谈心<small>选填，填了就生成一个未来事项</small></label><div class="opts">${Object.keys(NEXTS).map(n => tog('next', n, R.next === n)).join('')}</div></div>
      <div class="fld"><label>希望心理中心介入</label><label class="ckl"><input type="checkbox" ${R.center ? 'checked' : ''} data-act="rcC"> 勾上会进中心的「转来的」，理由选填</label>${R.center ? rin('cwhy', '例如：学生说最近两周几乎每晚失眠，想找专业老师聊') : ''}</div></div>
    ${its.length ? `<div class="fld"><label>本次完成的事项</label>${its.map(x => `<label class="ckl ${eff ? '' : 'dim'}"><input type="checkbox" ${R.done.includes(x.id) && eff ? 'checked' : ''} ${eff ? `data-act="rcDone" data-arg="${x.id}"` : 'disabled'}> ${SU(x.sid).name} · ${ISRC[x.src]} · ${esc(itWhy(x))}</label>`).join('')}${eff ? '' : '<small class="note">只有和学生本人谈过（结果是「已谈」）才算完成；和家长、室友谈或联系不上，事项保留。</small>'}</div>` : ''}
    <label class="ckl"><input type="checkbox" ${R.backfill ? 'checked' : ''} data-act="rcB"> 这是补录的历史记录（不计入频率）</label>
    <h4>分享和同步</h4>
    <div class="fld"><label>分享给谁<small>默认只有你能看</small></label>${R.shares.map((x, i) => `<div class="shr"><b>${ST(x.to).name}</b><small>${tagOf(x.to)}${x.off ? ' · 已收回' : ''}</small><span class="opts">${PARTS.map(([p, n]) => `<button class="${x.parts.includes(p) ? 'on' : ''}" data-act="rcSP" data-arg="${i}|${p}">${n}</button>`).join('')}</span><select data-rsd="${i}">${[7, 30, 90].map(d => `<option value="${d}" ${x.days === d ? 'selected' : ''}>${d} 天</option>`).join('')}</select><button class="lnk" data-act="rcSDel" data-arg="${i}">移除</button></div>`).join('')}
      ${R.spick != null ? `<div class="pickbox"><input class="in" style="width:200px" data-rb="spick" data-rr value="${esc(R.spick)}" placeholder="搜老师的名字">${shareCand.map(u => `<button class="btn sec xs" data-act="rcSAdd" data-arg="${u}">${ST(u).name} · ${tagOf(u)}</button>`).join('') || `<span class="note">没有找到 ${hintQ('tMiss')}</span>`}</div>` : `<button class="btn ghost xs" data-act="rcSPick">${I('plus', 's')}加一位</button>`}
      <small class="note">基本信息（对象、时间、方式、结果）总是带上；其余逐项勾，默认全勾。系统外的人、系统管理员、学生心理委员不能选。</small>
      ${fw.length ? `<p class="note warn">${I('lock', 's')}这条记录会回传心理中心（${fw.join('、')}），不能移除。中心看到的是整条。</p>` : ''}</div>
    <div class="fld"><label>同步到学校 SIS</label><label class="ckl"><input type="checkbox" ${sis ? 'checked' : ''} data-act="rcSis"> 同步这条记录</label>${psych(R) && sis ? '<p class="note warn">这条记录含心理相关内容，同步后学校 SIS 的有权限人员都能看到。</p>' : ''}
      ${sis && first ? `<div class="grid g2"><div class="fld"><label>最初发现途径<small>SIS 必填</small></label><div class="opts">${['学生主动', '辅导员发现', '他人反映', '中心转来'].map(x => tog('src0', x, R.src0 === x)).join('')}</div></div><div class="fld"><label>最初发现时间<small>SIS 必填</small></label>${rin('t0', '例如：10/5', '120px')}</div></div>` : ''}
      <small class="note">这一版只对齐字段，不真的对接 SIS。保存后 24 小时内可以改。</small></div>
    <div class="crumb" style="border:0;margin-top:14px"><span class="sp"></span><span class="note">草稿不完成任务</span>${edit && !edit.draft ? '' : '<button class="btn sec" data-act="recSave" data-arg="draft">保存草稿</button>'}<button class="btn pri" data-act="recSave" data-arg="">保存</button></div></div>`; }

/* 查看一条记录：按分享勾选的范围显示；写的人能管理分享 */
function recView() { const t = TALKS.find(x => x.id === S.rv), v = recVis(t), mine = recOwner(t), see = p => v === 'full' || (Array.isArray(v) && v.includes(p)), none = '<span class="note">未分享</span>';
  if (!v) return `<div class="card"><div class="crumb"><button class="lnk" data-act="recBack">谈心</button> / ${tkId(t)}</div><div class="empty">${expiredShare(t) ? HINT.exp : '你没有查看这条记录的权限'}<p><button class="btn sec xs" data-act="mo" data-arg="tkContact:${t.id}">联系分享人</button></p></div></div>`;
  const ids = t.sids || [t.sid], pp = t.pp || {}, visP = id => mine || v === 'full' && (S.role === 'L3' || !t.cw || t.cw === 'all' || t.cw === id) || false;
  return `<div class="card recp"><div class="crumb"><button class="lnk" data-act="recBack">谈心</button> / 谈话记录 ${tkId(t)}<span class="sp"></span>${mine && !t.draft ? (recLocked(t) ? `${hintB('修改', 'lock', 'btn sec')}<button class="btn sec" data-act="mo" data-arg="tkAdd:${t.id}">追加</button>` : `<button class="btn sec" data-act="tkEdit" data-arg="${t.id}">修改</button>`) : ''}${!mine ? `<button class="btn sec" data-act="mo" data-arg="tkContact:${t.id}">联系分享人</button>` : ''}</div>
    <div class="kv"><span>谈话对象</span><b>${ids.map(id => SU(id).name).join('、')}${(t.who || []).filter(w => w !== '本人').length ? ` · ${(t.who || []).filter(w => w !== '本人').join('、')}` : ''}</b><span>谈话时间</span><b>${fmt(t.at)}${t.plan ? `<small>计划 ${fmt(t.plan)}</small>` : ''}<small>录入 ${fmt(t.savedAt)}</small></b><span>方式</span><b>${t.mode}${t.mode === '面对面' ? ` · ${t.place}` : ''}</b><span>结果</span><b>${t.result}</b><span>写的人</span><b>${ST(t.by).name}（${tagOf(t.by)}）</b></div>
    <h4>学生的情况${ids.length > 1 ? ' · 共同部分' : ''}</h4>${see('situ') ? `<div class="sms">${esc(t.situ) || '—'}</div>` : none}
    ${ids.length > 1 ? ids.filter(visP).map(id => `<h4>${SU(id).name} · 个人部分${(pp[id] || {}).absent ? '（未到场）' : ''}</h4>${see('situ') ? `<div class="sms">${esc((pp[id] || {}).txt) || '—'}</div>` : none}`).join('') : ''}
    ${see('situ') ? (t.adds || []).map(a => `<p class="tkadd">补充 · ${fmt(a.at)}${a.who ? ` · ${SU(a.who).name}` : ''}：${esc(a.t)}</p>`).join('') : ''}
    <div class="kv" style="margin-top:12px"><span>情况类型</span><b>${see('types') ? (t.types || []).join('、') || '—' : none}</b><span>学生表达的需要</span><b>${see('need') ? esc(t.need) || '—' : none}</b><span>下次谈心</span><b>${see('next') ? t.next || '不需要' : none}</b>${mine || v === 'full' ? `<span>希望中心介入</span><b>${t.center ? `是${t.cwhy ? '：' + esc(t.cwhy) : ''}` : '否'}</b>` : ''}</div>
    ${t.risk ? `<p class="tkrisk">${I('alert', 's')}含安全相关内容 · 已报告紧急情况</p>` : ''}
    ${mine ? `<h4>谁能看</h4>${(t.shares || []).length ? `<table class="t"><tr><th>分享给</th><th>能看</th><th>有效期</th><th></th></tr>${t.shares.map((x, i) => `<tr><td>${ST(x.to).name}<small>${tagOf(x.to)}</small></td><td>基本信息、${x.parts.map(p => PARTS.find(q => q[0] === p)[1]).join('、') || '—'}</td><td>${x.off ? '已收回' : shareOn(x) ? fmt(x.exp).split(' ')[0] + ' 前' : '已过期'}</td><td>${x.off ? '' : `<button class="btn ghost xs" data-act="shExt" data-arg="${t.id}|${i}">延长 30 天</button><button class="btn ghost xs" data-act="mo" data-arg="shEdit:${t.id}|${i}">改范围</button><button class="btn ghost xs" data-act="shOff" data-arg="${t.id}|${i}">收回</button>`}</td></tr>`).join('')}</table>` : '<p class="note">只有你能看。</p>'}
      ${t.forced ? '<p class="note">这条记录回传心理中心，不能移除；被分享的人看不到「心理中心」这一项。</p>' : ''}<p class="note">同步 SIS：${t.sis ? '已勾选（这一版只对齐字段）' : '不同步'}${(t.hist || []).length ? ` · 已修改 ${t.hist.length} 次，修改前的内容保留` : ''}</p>` : ''}</div>`; }

/* ---------- 保存 ---------- */
const recRisk = R => TALK_RE.test([R.situ, R.need, R.topic, R.cwhy, ...Object.values(R.pp || {}).map(p => p.txt)].join(' '));
// 比较命中的词项，不能用“以前已命中过”的布尔值吞掉本次新增表达。
const talkRiskWords = txt => cwFind(txt).hit.filter(w => cwL(w) <= 2);
// 新报告附到未结案危机；升级后保留首次触发及旧接收记录，单独计本次紧急确认时间。
const talkRiskReport = (t, s, words, src) => {
  const urgent = words.some(w => cwL(w) === 1), k0 = CRISES.find(k => k.sid === s.id && k.st !== 'closed');
  if (k0) {
    k0.recs = [...new Set([...(k0.recs || []), t.id])]; k0.src.push({ t: src, at: new Date(NOW), rec: t.id });
    if (urgent && (!k0.urgent || k0.recv || k0.st !== 'new')) {
      if (k0.recv) k0.recvHistory = [...(k0.recvHistory || []), k0.recv];
      k0.urgent = true; k0.urgentAt = new Date(NOW); k0.st = 'new'; k0.recv = null; k0.esc = 0; delete k0.shown;
      crisisNotify(k0, new Date(NOW));
    } else [s.owner || 'c5', dutyNow()].filter((u, i, a) => a.indexOf(u) === i).forEach(u => notify(u, urgent && u === dutyNow() ? '短信 + 电话' : '站内', `${src}：${nm(s)}${urgent ? `，请 ${RULES.urgentMin} 分钟内确认` : ''}`, k0.id));
    log(`谈话记录新增${urgent ? '一级' : '二级'}风险表达，已附到现有危机（${tkId(t)}）${urgent ? `，${RULES.urgentMin} 分钟内确认` : ''}`, s, { k: 'report', cat: '危机', noTl: 1 });
    return k0;
  }
  const k = newCrisis(s, src, '学院报告', urgent, words);
  if (k) { k.by = me(); k.fromRec = t.id; }
  log(`谈话记录命中危机词，自动报告${urgent ? '紧急情况' : '风险情况'}`, s, { k: 'report', cat: '危机', r: 1 }); return k;
};
const recDone = (t, ids, R) => ITEMS.filter(x => ids.includes(x.id) && x.st === 'open').forEach(x => { x.st = 'done'; x.rec = t.id; x.doneAt = new Date(NOW); const s = SU(x.sid), a = (s.asks || []).find(q => q.item === x.id && !q.done);
  if (a) { a.st = '完成'; a.log.push({ at: new Date(NOW), st: '完成', note: '已谈心，见谈话记录' }); a.done = { at: new Date(NOW), note: '已谈心' }; notify(a.by, '站内', `${ST(me()).name} 已完成谈心：${nm(s)}`, s.id); } });
const addNext = (t, ids) => ids.forEach(id => { const st0 = later(NEXTS[t.next] * 24), x = addItem({ sid: id, to: me(), src: 'next', startAt: st0, due: new Date(st0.getTime() + 7 * 864e5), rec: t.id, why: `上次谈话约定 ${t.next}` }); if (inCrisis(id)) { x.prevSt = 'open'; x.st = 'frozen'; x.frozenAt = new Date(NOW); } });   // 危机中生成的事项直接冻结，结案时一起决定
function recSave(draft) { const R = S.rec, edit = R.id && TALKS.find(t => t.id === R.id), formal = !!edit && !edit.draft, first = !formal;
  if (edit && !recOwner(edit)) return toast('只有写这条记录的人（或岗位接任者）可以修改');
  if (formal && draft) return toast('已保存的记录不能改回草稿');
  if (formal && recLocked(edit)) return toast(HINT.lock);
  if (!R.sids.length) return toast('请选择学生');
  if (!edit && R.sids.some(id => !tkScope(SU(id)))) return toast('这个学生不在你的管理范围里，不能写记录');
  const at = recAt(R); if (!at) return toast('请选择谈话日期，时间按 14:30 的格式填'); if (at > NOW) return toast('谈话时间不能晚于现在');
  if (!draft) { if (!R.who.length) return toast('请选择谈话对象'); if (!R.mode) return toast('请选择方式'); if (!R.result) return toast('请选择结果'); }
  const commonWords = talkRiskWords([R.situ, R.need, R.topic, R.cwhy].join(' ')), oldCommon = formal ? talkRiskWords([edit.situ, edit.need, edit.topic, edit.cwhy].join(' ')) : [];
  const addedCommon = commonWords.filter(w => !oldCommon.includes(w)), personalWords = {}, addedPersonal = {};
  R.sids.forEach(id => { personalWords[id] = talkRiskWords((R.pp[id] || {}).txt || ''); const old = formal ? talkRiskWords(((edit.pp || {})[id] || {}).txt || '') : []; addedPersonal[id] = personalWords[id].filter(w => !old.includes(w)); });
  const multi = R.sids.length > 1, riskC = commonWords.length > 0, riskP = R.sids.filter(id => personalWords[id].length), cHit = addedCommon.length > 0, pHit = R.sids.filter(id => addedPersonal[id].length);
  if (!draft && cHit && multi && !R.cw) { R.askWho = true; return toast('共同部分里有安全相关的表达，请先指定涉及哪个学生'); }
  R.risk = riskC || riskP.length > 0 || (formal && !!edit.risk);       // 先算危机，再算 SIS 默认值
  if (!draft && sisDef(R) && (!R.prev || !R.same) && (!R.src0 || !(R.t0 || '').trim())) return toast('同步 SIS 要补最初发现途径和时间；不同步可以取消勾选');
  const oldSh = edit ? edit.shares || [] : [], wasCenter = formal && !!edit.center, oldNext = formal ? edit.next : null, oldResult = formal ? edit.result : null;
  const shares = R.shares.map(x => { const o0 = x.at && oldSh.find(y => y.to === x.to && +y.at === +x.at);   // 按分享时间对上原来那条；已收回的人重新加是新的一条
    if (o0 && x.off && !o0.off) return Object.assign({}, o0, { off: x.off });
    if (o0) { const y = Object.assign({}, o0, { parts: x.parts.slice(), days: x.days }); if (!o0.off && x.days !== (o0.days || 30)) y.exp = new Date((o0.at || NOW).getTime() + x.days * 864e5); return y; }
    return { to: x.to, parts: x.parts.slice(), days: x.days, at: new Date(NOW), exp: later(x.days * 24) }; });
  const fresh = shares.filter(x => !x.off && (first || !oldSh.some(y => y.to === x.to && +y.at === +x.at))), revoked = shares.filter(x => x.off && oldSh.some(y => y.to === x.to && +y.at === +x.at && !y.off));
  const o = { sid: R.sids[0], sids: R.sids.slice(), who: R.who.slice(), at, plan: R.plan, mode: R.mode, place: R.mode === '面对面' ? R.place : '', result: R.result, situ: (R.situ || '').trim(), types: R.types.slice(), need: (R.need || '').trim(), topic: (R.topic || '').trim(),
    next: R.next, center: R.center, cwhy: (R.cwhy || '').trim(), pp: JSON.parse(JSON.stringify(R.pp)), backfill: !!R.backfill, sis: sisDef(R), src0: R.src0, t0: R.t0, prev: R.same ? R.prev : null, cw: R.cw, draft: !!draft, inv: R.inv };
  o.points = o.situ;
  let t; if (edit) { if (formal) edit.hist.push({ at: new Date(NOW), situ: edit.situ, need: edit.need }); Object.assign(edit, o); t = edit; if (formal) { if (edit.corrOk) edit.corrOk = 0; if (!edit.savedAt0) edit.savedAt0 = edit.savedAt; } }
  else { t = addTalk(Object.assign(o, { by: me(), from: '自发' })); t.at = at; t.adds = []; t.hist = []; }
  const e = SU(t.sid).tl.find(x => x.tid === t.id); if (e) { e.k = 'talkr'; e.at = at; e.t = draft ? '谈话记录草稿' : `谈话记录（${o.mode} · ${o.result}）`; }
  if (first) t.savedAt = new Date(NOW); t.shares = shares;
  R.sids.forEach(id => { const p = t.pp[id]; if (p && p.txt && !p.savedAt && !draft) p.savedAt = new Date(NOW); });
  if (draft) { log(`保存谈话记录草稿（${tkId(t)}）`, SU(t.sid), { k: 'talkLog', noTl: 1, obj: '谈话记录' }); S.rec = null; S.tabs.talk = 'recs';
    return toast(riskC || riskP.length ? '草稿已保存。草稿里有安全相关的表达，草稿不会自动报告；情况紧急请马上保存正式记录或报告紧急情况' : '草稿已保存，在「谈心记录」里可以接着写；草稿不完成任务'); }
  /* 危机词：只对这次新出现的表达报告，不用老师再选 */
  const hitIds = cHit ? (multi ? (R.cw === 'all' ? R.sids.filter(id => !(R.pp[id] || {}).absent) : [R.cw]) : R.sids.slice()) : []; pHit.forEach(id => hitIds.includes(id) || hitIds.push(id));
  if (R.risk) t.risk = 1;
  const here = R.sids.filter(id => !(R.pp[id] || {}).absent), eff = !t.backfill && t.result === '已谈' && t.who.includes('本人'), centerIt = myItems().filter(x => R.done.includes(x.id) && x.src === 'center');
  t.forced = !!(t.center || t.risk || centerIt.length || (edit && edit.forced));
  const doneIds = eff ? R.done.filter(id => here.includes((ITEMS.find(x => x.id === id) || {}).sid) && (ITEMS.find(x => x.id === id) || {}).st === 'open') : []; recDone(t, doneIds, R);
  if (t.inv && (first || oldResult !== t.result)) { const v = INV.find(x => x.id === t.inv);
    if (v && !['cancel', 'frozen'].includes(v.st)) { const s = SU(v.sid);
      if (['学生未到', '联系不上'].includes(t.result)) { v.st = 'expired'; v.outcome = t.result; v.miss = true; v.rec = t.id; ITEMS.filter(x => x.inv === v.id).forEach(x => { x.inv = null; }); lostCheck(s); }
      else { v.st = 'done'; v.outcome = '已谈待记录'; v.miss = false; v.rec = t.id; } } }
  if (!t.inv && MISSR.includes(t.result) && (first || oldResult !== t.result)) R.sids.forEach(id => lostCheck(SU(id), me()));
  if (first && NEXTS[t.next]) addNext(t, R.sids);
  else if (formal && oldNext !== t.next) { ITEMS.filter(x => x.src === 'next' && x.rec === t.id && x.st === 'open').forEach(x => { x.st = 'closed'; x.closeWhy = '修改了下次谈心'; }); if (NEXTS[t.next]) addNext(t, R.sids); }
  if (t.center && !wasCenter) R.sids.forEach(id => addXf('interv', SU(id), { note: t.cwhy, rec: t.id }));
  if (fresh.length) fresh.forEach(x => notify(x.to, '站内', '有 1 条谈话记录分享给你', null));
  revoked.forEach(x => log(`收回分享：${tkId(t)} → ${ST(x.to).name}`, SU(t.sid), { cat: '流转', noTl: 1, obj: '谈话记录' }));
  log(`${formal ? '修改' : '保存'}谈话记录（${t.mode} · ${t.result}${t.center ? '，希望中心介入' : ''}${fresh.length ? `，分享给 ${fresh.map(x => ST(x.to).name).join('、')}` : ''}${t.sis ? '，勾选同步 SIS' : ''}）`, SU(t.sid), { k: 'talkLog', noTl: 1, obj: '谈话记录' });
  S.rec = null; S.tabs.talk = 'recs';
  if (hitIds.length) { const ks = hitIds.map(id => {
      const words = [...(cHit && (R.cw === 'all' || !multi || R.cw === id) ? addedCommon : []), ...addedPersonal[id]];
      return talkRiskReport(t, SU(id), words, `${ST(me()).name} 的谈话记录里出现安全相关的表达（保存时自动报告）`); }).filter(Boolean);
    if (ks[0]) S.mo = `tkCrisis:${ks[0].id}`; return; }
  toast(doneIds.length ? `已保存，完成了 ${doneIds.length} 个事项` : '已保存'); }
