/* =====================================================================
   v1.8 · L1「联系与观察任务卡」（5 个区域、逐条来源、按本次核实事项判断）、随访记录、
   紧急报告 / 新建求助、确认接手、学院协助（带状态）、作答质量、待补充上限
   原则：辅导员补充事实、做支持性联系、及时上报；不做风险判断，「不清楚」不会被记成「没问题」
===================================================================== */
const SRC = ['本人', '任课老师', '考勤 / 系统记录', '宿舍或同学转述', '其他'];
const WIN = ['近一周', '近两周', '近一个月'];
const AREAS = () => S.role === 'L1s'
  ? [['daily', '日常状态', '这位同学最近和大家的来往，和他平时比（安静、独处本身不算异常）', ['没变化', '有变化', '不清楚']], ['diff', '已知困难', '你本来就知道的近期困难（不需要去打听）', ['没有', '有', '不清楚']]]
  : [['contact', '联系结果', '这次有没有和学生本人说上话', ['已联系上', '未联系上', '没有联系，只核对了资料']],
     ['study', '学习参与', '出勤、作业、考试出席，和他平时比', ['没变化', '有变化', '不清楚', '不适用']],
     ['daily', '日常联系', '和同学、老师的日常往来，和本人平时比（安静、独处本身不算异常）', ['没变化', '有变化', '不清楚', '不适用']],
     ['diff', '已知困难', '本人主动告知、或通过正常工作获知的近期困难（不需要主动打听）', ['没有', '有', '不清楚']],
     ['need', '本人的支持需要', '学生自己提出想要什么帮助', ['没提到', '提了', '没机会问']]];
const DIRS2 = ['改善', '出现困难', '性质不明'];
const reqOf = s => s.req || (S.role === 'L1s' ? { text: '请留意这位同学近两周的日常状态（不需要主动打听）', must: ['daily'] } : { text: '请核对近两周的学习参与，并尝试和学生本人建立联系', must: ['contact', 'study'] });
const OUT = [['ok', '已完成本次核实，没有需要转交的新情况', '完成学院这一步；不代表学生没有风险，原有的专业处理照常进行'], ['more', '信息还不够，继续了解', '进入你的「待补充信息」，到约定时间提醒你'], ['help', '请中心协助联系 / 由中心决定', '学院这边联系不上或拿不到信息时，交回中心'], ['up', '有新的情况，交给咨询师', '连同你记录的事实交给咨询师，对方确认接手后你会收到通知'], ['urgent', '发现紧急安全线索', '立即进入危机通道，30 分钟内必须有人确认']];
const lastContacts = s => s.tl.filter(e => ['fb1', 'l1keep', 'l1up', 'l1add', 'contact'].includes(e.k)).slice(-3).reverse();
const nextH = x => ({ 今天稍后: 4, 明天: 24, '3 天后': 72, '1 周后': 168 })[x] || 24;
const NDAYS = () => Array.from({ length: 7 }, (_, i) => { const d = new Date(NOW); d.setDate(d.getDate() + i); return d; });
const NTIMES = ['09:00', '11:00', '13:00', '14:30', '16:30', '19:00'];
function nextAt(F) { if (F.next !== '指定时间') return later(nextH(F.next)); const d = NDAYS()[+(F.nd || 0)], [h, m] = (F.nt || '09:00').split(':'); const x = new Date(d); x.setHours(+h, +m, 0, 0); return x; }
const nextPick = F => `${opts('next', ['今天稍后', '明天', '3 天后', '1 周后', '指定时间'])}${F.next === '指定时间' ? `<div style="display:flex;gap:8px;margin-top:6px"><select class="in" data-bind="form.nd" data-rerender>${NDAYS().map((d, i) => `<option value="${i}" ${String(F.nd || 0) === String(i) ? 'selected' : ''}>${d.getMonth() + 1}/${d.getDate()} 周${'日一二三四五六'[d.getDay()]}</option>`).join('')}</select><select class="in" data-bind="form.nt" data-rerender>${NTIMES.map(t => `<option ${F.nt === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>` : ''}<div style="margin-top:6px">${opts('nk', ['双方已约好', '我打算再试一次'])}</div>`;
const nextTxt = F => `${F.next === '指定时间' ? fmt(nextAt(F)) : F.next}${F.nk ? `（${F.nk}）` : ''}`;
const pendMax = s => s.pend ? new Date(s.pend.first.getTime() + RULES.lim.pendMax * H) : null;
const pendLocked = s => s.pend && (s.pend.count >= 2 || NOW > pendMax(s));

function cardEval(s, F) {
  const A = AREAS(), a = F.a || {}, req = reqOf(s), val = k => (a[k] || {}).v;
  const unanswered = A.filter(([k]) => !val(k)).map(x => x[1]);
  const known = k => k === 'contact' ? val(k) === '已联系上' : val(k) && !['不清楚', '没机会问'].includes(val(k));
  const mustUnknown = req.must.filter(k => A.some(x => x[0] === k) && !known(k)).map(k => A.find(x => x[0] === k)[1]);
  const concern = A.filter(([k]) => (a[k] || {}).dir === '出现困难' || (a[k] || {}).dir === '性质不明' || (k === 'diff' && val(k) === '有') || (k === 'need' && val(k) === '提了')).map(x => x[1]);
  const needDir = A.filter(([k]) => val(k) === '有变化' && !(a[k] || {}).dir).map(x => x[1]);
  const needSrc = A.filter(([k]) => ['study', 'daily'].includes(k) && ['有变化', '没变化'].includes(val(k)) && !(a[k] || {}).src || (k === 'diff' && val(k) === '有' && !(a[k] || {}).src)).map(x => x[1]);
  const okWhy = unanswered.length ? `还有 ${unanswered.length} 个区域没填` : needDir.length ? `请说明「${needDir[0]}」的变化方向` : concern.length ? `你记录了「${concern[0]}」，请交给咨询师` : mustUnknown.length ? `本次要核实的「${mustUnknown.join('、')}」还不清楚` : needSrc.length ? `请补上「${needSrc[0]}」的信息来源` : '';
  const sugg = concern.length ? 'up' : mustUnknown.length && !unanswered.length ? (pendLocked(s) ? 'help' : 'more') : !okWhy ? 'ok' : '';
  return { okWhy, sugg, concern, mustUnknown, needDir, needSrc };
}
function taskCard(s, F) {
  const A = AREAS(), a = F.a || {}, req = reqOf(s), E = cardEval(s, F), out = F.out || '', lock = pendLocked(s);
  const crisisNow = s.stage === 'crisis';
  const areaRow = ([k, n, tip, vs]) => { const x = a[k] || {}; return `<div class="area"><div class="ah2"><b>${n}${req.must.includes(k) ? ' <span class="pill p">本次必核</span>' : ''}</b><small>${tip}</small></div>
      <div class="opts">${vs.map(v => `<button class="${x.v === v ? 'on' : ''} ${['有变化', '有', '提了'].includes(v) ? 'y' : ''}" data-act="area" data-arg="${k}|v|${v}">${v}</button>`).join('')}</div>
      ${x.v === '有变化' ? `<div class="sub"><span>变化方向</span>${DIRS2.map(v => `<button class="${x.dir === v ? 'on' : ''}" data-act="area" data-arg="${k}|dir|${v}">${v}</button>`).join('')}</div>` : ''}
      ${(['study', 'daily'].includes(k) && ['有变化', '没变化'].includes(x.v)) || (k === 'diff' && x.v === '有') ? `<div class="sub"><span>信息来源</span>${SRC.map(v => `<button class="${x.src === v ? 'on' : ''}" data-act="area" data-arg="${k}|src|${v}">${v}</button>`).join('')}</div><div class="sub"><span>发生时间</span>${WIN.map(v => `<button class="${x.win === v ? 'on' : ''}" data-act="area" data-arg="${k}|win|${v}">${v}</button>`).join('')}</div>` : ''}</div>`; };
  const outDis = k => k === 'ok' ? E.okWhy : k === 'more' && lock ? `已经延期 ${s.pend.count} 次${NOW > pendMax(s) ? '，且超过最晚期限' : ''}，请交回中心` : '';
  return `<div class="ov" data-act="ovClose"><div class="mo wide"><h3>联系与观察任务 · ${nm(s)}</h3><p>${s.college} · ${s.year}${canName() && s.phone ? ` · ${s.sid} · ${crisisNow ? '+65 8*** ' + s.phone.slice(-4) + '（危机处理中，号码请在危机通道查看）' : `<b>+65 ${s.phone}</b> <button class="lnk" data-act="l1copy" data-arg="${s.id}">复制号码</button>`}` : ''}</p>
    <div class="tcard"><div><b>这次请你</b><p>${esc(req.text)}</p>${s.quality ? `<p class="note" style="margin:4px 0 0">另：系统提示「${s.quality}」，可以交给咨询师核实</p>` : ''}${s.pend ? `<p class="note" style="margin:4px 0 0;color:var(--warn)">第 ${s.pend.count + 1} 次补充 · 首次进入 ${fmt(s.pend.first)} · 最晚 ${fmt(pendMax(s))}</p>` : ''}</div>
      <div><b>最近的联系</b>${lastContacts(s).map(e => `<p class="note" style="margin:2px 0">${fmt(e.at)} · ${esc(e.t.replace(/^L1 /, '').slice(0, 40))}</p>`).join('') || '<p class="note" style="margin:2px 0">还没有记录</p>'}${s.pref ? `<p class="note" style="margin:2px 0;color:var(--warn)">联系偏好：${esc(prefTxt(s.pref))}</p>` : ''}</div>
      <div><b>当前负责</b><p>${s.stage === 'L1' ? '你（学院核实）' : layerTxt(s)}</p></div></div>
    <p class="note" style="margin:-4px 0 8px">写你知道的事实；不知道就选「不清楚」，不会被当成没问题。不需要为了填卡去打听隐私。</p>
    ${A.map(areaRow).join('')}
    ${fld('补充（写事实，不写判断）', ta('note', '例如：近两周缺了 3 次课（考勤记录），本人电话里说在赶论文'))}
    <div class="fld"><label>你的结论 ${E.sugg ? `<span class="note">（建议选「${OUT.find(x => x[0] === E.sugg)[1]}」）</span>` : ''}</label>${OUT.map(([k, n, d]) => { const dis = outDis(k); return `<button class="outc ${out === k ? 'on' : ''} ${k === 'urgent' ? 'urg' : ''}" ${dis ? 'disabled' : `data-act="fset" data-arg="out|${k}"`}><b>${n}</b><small>${dis || d}</small></button>`; }).join('')}</div>
    ${out === 'more' ? fld('什么时候再了解', nextPick(F)) : ''}
    <div class="acts"><button class="btn sec" data-act="moClose">取消</button><button class="btn ${out === 'urgent' ? 'red' : 'pri'}" data-act="verifyGo" data-arg="${s.id}" ${out && !(out === 'more' && !F.next) ? '' : 'disabled'}>${out === 'urgent' ? '立即上报' : '提交'}</button></div></div></div>`;
}
const prefTxt = p => [p.who, p.what, p.ok && p.ok.length ? '愿意：' + p.ok.join('、') : ''].filter(Boolean).join('；');
function fbModal(s, F) {
  const L1 = isL1(), res = F.res;
  return `<div class="ov" data-act="ovClose"><div class="mo"><h3>写随访记录 · ${nm(s)}</h3><p>${L1 ? '' : `随访周期 ${s.cycle === 1 ? '24 小时' : (s.cycle || 14) + ' 天'} · `}${s.miss ? `已连续未接通 ${s.miss} 次 · ` : ''}${canName() && s.phone ? `+65 ${s.phone}` : ''}</p>
    ${s.pref ? `<p class="note" style="color:var(--warn)">联系偏好：${esc(prefTxt(s.pref))}</p>` : ''}
    ${fld('这次联系的结果', opts('res', ['已联系上', '未接通', '暂时不方便（约了下次）', '不愿意交流']))}
    ${res === '已联系上' ? fld('这次观察到的变化', opts('chg', ['好转', '没有明显变化', '变差', '本次不足以判断'])) + (F.chg === '变差' ? '<p class="note" style="color:var(--warn)">选「变差」会立即交给咨询师。听到紧急安全表达，请用「报告紧急情况」。</p>' : '') : ''}
    ${res === '未接通' ? '<p class="note">未接通不算完成：24 小时后再提醒你；连续 3 次未接通会交给咨询师。</p>' : ''}
    ${res === '暂时不方便（约了下次）' ? fld('下次联系', nextPick(F)) : ''}
    ${res === '不愿意交流' ? fld('不愿意和谁谈', opts('pw', ['不愿和我谈', '不愿和学校任何人谈', '不清楚'])) + fld('不想要的是', opts('px', ['不想谈私人情况', '不希望再被联系', '不需要心理咨询'])) + `<div class="fld"><label>愿意接受的（可多选）</label><div class="opts">${['之后再联系', '换一位老师联系', '线上文字联系', '只给资料', '暂时什么都不需要'].map(x => `<button class="${(F.po || []).includes(x) ? 'on' : ''}" data-act="poT" data-arg="${x}">${x}</button>`).join('')}</div></div><p class="note">会交给咨询师决定下一步，并按学生的意愿记录联系偏好；不会把这次记成「状态稳定」。</p>` : ''}
    ${fld('经过和备注（会完整保存在时间线里）', ta('note', '例如：打了两次，第二次学生回短信说在上课'))}
    <div class="acts"><button class="btn sec" data-act="moClose">取消</button><button class="btn pri" data-act="fbGo" data-arg="${s.id}" ${!res || (res === '已联系上' && !F.chg) || (res.startsWith('暂时') && !F.next) || (res === '不愿意交流' && (!F.pw || !F.px)) ? 'disabled' : ''}>提交</button></div></div></div>`;
}
function reportModal(F) {
  const mine = isL1() ? STU.filter(s => s.follower === me()) : [];
  return `<div class="ov" data-act="ovClose"><div class="mo wide"><h3>${F.urgentOnly ? '报告紧急情况' : '新建求助 / 报告'}</h3>
    <p>${F.urgentOnly ? `听到自伤、自杀等安全表达，或者学生失联、情况危急时使用。会立即电话和短信通知值班咨询师，${RULES.urgentMin} 分钟内没人确认会再次呼叫并通知中心负责人；你能看到每一步。` : '没参加普测的学生主动求助、室友或家长报告情况、老师发现异常，都从这里登记。'}如果有人正处在立即危险中，请先拨打 995 / 999，再在这里登记。</p>
    ${F.urgentOnly ? '' : fld('是否紧急', opts('urg', ['紧急：现在有安全风险', '不紧急：需要咨询师跟进']))}
    ${fld('信息来源', opts('who', ['学生本人', '室友 / 同学', '家长', '老师 / 辅导员', '其他']))}
    ${fld('是哪位学生', `${mine.length ? `<select class="in" data-bind="form.sid" data-rerender><option value="">名单外的学生（下面填写）</option>${mine.map(s => `<option value="${s.id}" ${F.sid === s.id ? 'selected' : ''}>${nm(s)} · ${s.college}</option>`).join('')}</select>` : ''}${F.sid ? '' : `<div style="display:flex;gap:8px;margin-top:6px"><input class="in" data-bind="form.name" value="${esc(F.name || '')}" placeholder="学生姓名"><select class="in" data-bind="form.col" data-rerender><option value="">学院</option>${COLLEGES.map(c => `<option ${F.col === c ? 'selected' : ''}>${c}</option>`).join('')}</select><input class="in" data-bind="form.ph" value="${esc(F.ph || '')}" placeholder="电话（知道的话）"></div>`}`)}
    ${fld('发生了什么（写事实）', ta('note', '例如：室友说他今晚发消息说「不想活了」，现在联系不上'))}
    ${fld('学生现在在哪、有没有人陪（知道的话）', `<input class="in" data-bind="form.where" value="${esc(F.where || '')}" placeholder="例如：在 Hall 9 宿舍，室友陪着">`)}
    <div class="acts"><button class="btn sec" data-act="moClose">取消</button><button class="btn ${F.urgentOnly || (F.urg || '').startsWith('紧急') ? 'red' : 'pri'}" data-act="reportGo">${F.urgentOnly || (F.urg || '').startsWith('紧急') ? '立即上报' : '提交'}</button></div></div></div>`;
}
const ASKST = ['已接受', '进行中', '部分完成', '受阻', '完成'];
const openAsk = s => (s.asks || []).find(x => !x.done);
const _modal16 = modal;
modal = function () {
  const [k, id] = S.mo.split(':'), s = SU(id), F = S.form;
  const box2 = (h, p, body, ok, act, arg) => `<div class="ov" data-act="ovClose"><div class="mo"><h3>${h}</h3>${p ? `<p>${p}</p>` : ''}${body}<div class="acts"><button class="btn sec" data-act="moClose">取消</button><button class="btn pri" data-act="${act}" data-arg="${arg || id}">${ok}</button></div></div></div>`;
  if (k === 'verify') return taskCard(s, F);
  if (k === 'fb') return fbModal(s, F);
  if (k === 'report') return reportModal(F);
  if (k === 'l1add') return box2(`追加情况 · ${nm(s)}`, `学生已经交给${layerTxt(s)}。你新了解到的事实会直接通知当前负责人。`, fld('信息来源', opts('src', SRC)) + fld('新的情况（写事实）', ta('note', '例如：今天下午他主动来办公室，说最近睡不好')) + '<p class="note">如果是紧急安全线索，请用「报告紧急情况」。</p>', '发送给负责人', 'l1addGo');
  if (k === 'ask') return box2(`请学院协助 · ${nm(s)}`, `会发给学院跟进人${ST(s.follower).name}。只说明需要他做什么，不会透露评估内容。`, fld('需要协助的事', opts('what', ['确认学生是否在校、近况如何', '请安排一次谈心', '协助联系学生', '协助落实学业安排（请假、延期等）', '其他'])) + fld('期限', opts('due', ['今天', '明天', '3 天内'])) + fld('补充说明', ta('note', '例如：学生两天没回电话，麻烦确认一下是否在宿舍')), '发出请求', 'askGo');
  if (k === 'askDone') { const a = openAsk(s); return box2(`更新协助进度 · ${nm(s)}`, `${ST(a.by).name} 请你：<b>${esc(a.what)}</b>${a.note ? `（${esc(a.note)}）` : ''} · 期限 ${fmt(a.due)}${a.st ? ` · 当前：${a.st}` : ''}`, fld('进度', opts('st', ASKST)) + fld(F.st === '受阻' ? '受阻原因（必填，例如：在等任课老师回复）' : '说明（写事实）', ta('note', F.st === '完成' ? '例如：已到宿舍确认，学生在，同意明天去中心' : '例如：已联系任课老师，等回复')), '更新并通知中心', 'askDoneGo'); }
  if (k === 'quality') return box2(`作答质量待核实 · ${nm(s)}`, `系统提示：${s.quality}。用时短不一定无效，交给咨询师决定是否需要重做。`, fld('你了解到的情况（选填）', ta('note', '例如：学生说那天在赶作业，随便点的')), '交给咨询师核实', 'qualityGo');
  if (k === 'ack') return box2(`确认接手 · ${nm(s)}`, `确认后，学院跟进人${ST(s.follower).name}${s.reporter && s.reporter !== s.follower ? `和登记人${ST(s.reporter).name}` : ''}会收到通知，并看到你的下一步。`, fld('下一步', opts('nx', ['今天内联系学生', '明天内联系学生', '先看资料，3 天内决定'])) + fld('补充（选填）', ta('note', '例如：先打电话，联系不上再请学院协助')), '确认接手', 'ackGo');
  if (k === 'capReq') return box2('今天做不完，请中心协调', `你今天一共 ${F.left || 0} 件待办，预计约 ${S._capMin || 0} 分钟。中心负责人会收到你的请求，可以改派或调整期限。`, fld('说明（选填）', ta('note', '例如：本周学院有招生活动，周四前时间很少')), '发送请求', 'capGo', '');
  return _modal16();
};

/* ---------- L1 工作台：紧急报告入口与回执 ---------- */
function l1Extras() {
  if (!isL1()) return '';
  const mine = CRISES.filter(k => k.by === me() && k.st !== 'closed');
  return `<div class="urgbar"><span>${I('alert', 's')}听到学生的安全表达、或学生失联？</span><button class="btn red xs" data-act="mo" data-arg="report:urgent">报告紧急情况</button></div>
    ${mine.map(k => { const y = SU(k.sid), n = NOTI.find(x => x.ref === k.id && x.to === DUTY[0].who), lim = kLim(k);
      const step = k.st !== 'new' ? `${ST(k.recv.by).name} 已确认接收（${fmt(k.recv.at)}），正在处理` : k.esc ? `值班 ${ST(DUTY[0].who).name} ${escTxt(k)}内未确认，已${k.urgent ? '再次呼叫并' : ''}通知中心负责人朱静${k.esc >= 2 ? '、分管领导' : ''}` : `已电话和短信通知值班 ${ST(DUTY[0].who).name}，等待确认（${cLeft(k) < 0 ? '已超时' : '剩 ' + dur(cLeft(k))}）`;
      return `<div class="head ${k.st === 'new' ? '' : 'n'}" style="padding:10px 16px">${I('alert')}<div class="grow"><b style="font-size:13.5px">你报告的${k.urgent ? '紧急' : '风险'}情况 · ${nm(y)}</b><small>${fmt(kClock(k))} 报告 · ${step}</small></div></div>`; }).join('')}`;
}
Object.assign(ACT, {
  area(a) { const [k, f, v] = a.split('|'); const A = Object.assign({}, S.form.a); A[k] = Object.assign({}, A[k], { [f]: v }); if (f === 'v' && v !== '有变化') delete A[k].dir; S.form.a = A; if (S.form.out === 'ok') S.form.out = ''; },
  poT(x) { const p = S.form.po || []; S.form.po = p.includes(x) ? p.filter(y => y !== x) : [...p, x]; },
  l1copy(id) { const s = SU(id); try { navigator.clipboard && navigator.clipboard.writeText('+65 ' + s.phone).catch(() => {}); } catch (e) {} log('复制学生联系方式', s, { cat: '查看', noTl: 1 }); toast('已复制号码'); },
  verifyGo(id) { const s = SU(id), F = S.form, E = cardEval(s, F), A = AREAS(), a = F.a || {}; if (!F.out) return toast('请选择结论');
    if (F.out === 'ok' && E.okWhy) return toast(E.okWhy);
    const sum = A.filter(([k]) => a[k] && a[k].v).map(([k, n]) => `${n}：${a[k].v}${a[k].dir ? '（' + a[k].dir + '）' : ''}${a[k].src ? '，来源 ' + a[k].src : ''}${a[k].win ? '，' + a[k].win : ''}`).join('；') + (F.note ? `；${F.note}` : '');
    s.l1obs = { by: me(), at: new Date(NOW), areas: JSON.parse(JSON.stringify(a)), note: F.note || '', items: E.concern, unknown: E.mustUnknown };
    if (F.out === 'urgent') { log(`L1 ${ST(me()).name} 报告紧急安全线索：${sum}`, s, { k: 'report', cat: '危机', r: 1 }); const k = newCrisis(s, `${ST(me()).name}（辅导员）报告紧急安全线索：${F.note || E.concern.join('、') || '见观察记录'}`, '学院报告', true); if (k) k.by = me(); close2(); return toast(`已上报：值班咨询师已收到电话和短信，${RULES.urgentMin} 分钟内必须确认`); }
    if (F.out === 'more') { if (!F.next) return toast('请选择什么时候再了解'); s.pend = s.pend ? Object.assign(s.pend, { count: s.pend.count + 1 }) : { first: new Date(NOW), count: 1 };
      log(`L1 ${ST(me()).name} 核实：信息还不够，${nextTxt(F)}再了解（${sum}）`, s, { k: 'l1keep' }); const first = s.pend; move(s, 'L1', 'pending', { next: nextAt(F), nextKind: F.nk || '', nextNotified: false, pend: first }); close2(); return toast(`已记为「信息还不够」，${nextTxt(F)}提醒你`); }
    if (F.out === 'help') { log(`L1 ${ST(me()).name} 请中心协助：${sum || '学院这边联系不上或拿不到信息'}`, s, { k: 'l1up' }); move(s, 'L2', 'up', { assignee: l2For(s), src: `学院请中心协助${s.pend ? `（已补充 ${s.pend.count} 次）` : ''}` }); notify(s.assignee, '站内', `${ST(me()).name} 请中心协助联系 1 位学生`, s.id); close2(); return toast('已交回中心，对方确认接手后你会收到通知'); }
    if (F.out === 'up') { log(`L1 ${ST(me()).name} 有新的情况，交给咨询师：${sum}`, s, { k: 'l1up' }); move(s, 'L2', 'up', { assignee: l2For(s), src: `${ST(me()).name}：${E.concern[0] || '有新的情况'}` }); notify(s.assignee, '站内', `${ST(me()).name} 交给你 1 位学生（附观察）`, s.id); close2(); return toast('已交给咨询师，对方确认接手后你会收到通知'); }
    S.mo = null; ACT.keep(id, null, null, `（已完成本次核实：${sum}）`); },
  fbGo(id) { const s = SU(id), F = S.form, k = isL1() ? 'fb1' : 'fb', note = F.note ? `；${F.note}` : '';
    if (F.res === '未接通') { s.miss = (s.miss || 0) + 1; log(`随访：未接通（第 ${s.miss} 次）${note}`, s, { k }); if (s.miss >= 3) { move(s, 'L2', 'up', { assignee: s.owner || l2For(s), src: '随访连续 3 次未接通' }); notify(s.owner || l2For(s), '站内', '1 位学生随访连续 3 次未接通', s.id); toast('连续 3 次未接通，已交给咨询师'); } else { s.fdue = later(24); toast(`未接通，24 小时后再提醒（第 ${s.miss} 次）`); } S.mo = null; return; }
    if (F.res.startsWith('暂时')) { s.fdue = nextAt(F); log(`随访：学生暂时不方便，约了${nextTxt(F)}再联系（本次不判断状态）${note}`, s, { k }); S.mo = null; return toast(`已约 ${nextTxt(F)}，到时提醒你`); }
    if (F.res === '不愿意交流') { s.pref = { who: F.pw, what: F.px, ok: F.po || [], by: me(), at: new Date(NOW) }; log(`随访：学生不愿意交流（${prefTxt(s.pref)}）${note}`, s, { k }); move(s, 'L2', 'up', { assignee: s.owner || l2For(s), src: `学生${F.px === '不希望再被联系' ? '不希望再被联系' : '不愿意交流'}（${F.pw}）` }); notify(s.owner || l2For(s), '站内', '1 位学生不愿意交流，请按联系偏好决定下一步', s.id); close2(); return toast('已交给咨询师，并记录了学生的联系偏好'); }
    log(`随访：已联系上，观察到的变化「${F.chg}」${note}`, s, { k });
    if (F.chg === '变差') { move(s, 'L2', 'up', { assignee: s.owner || l2For(s), src: '随访观察「变差」' }); notify(s.owner || l2For(s), '站内', '1 位学生随访观察「变差」', s.id); close2(); return toast('已交给咨询师'); }
    s.miss = 0; s.fdue = later(F.chg === '本次不足以判断' ? 72 : (s.cycle || 14) * 24); S.mo = null; toast(F.chg === '本次不足以判断' ? '已记录，3 天后再联系' : `已记录，下次随访 ${s.cycle === 1 ? '24 小时' : (s.cycle || 14) + ' 天'}后`); },
  reportGo() { const F = S.form, urg = F.urgentOnly || (F.urg || '').startsWith('紧急'); if (!F.urgentOnly && !F.urg) return toast('请选择是否紧急'); if (!F.who) return toast('请选择信息来源'); if (!F.note) return toast('请写下发生了什么');
    let s = F.sid && SU(F.sid); if (!s) { if (!F.name || !F.col) return toast('请填写学生姓名和学院');
      s = mk({ name: F.name, college: F.col, lv: 0, stage: 'L2', queue: 'up', done: new Date(NOW), since: new Date(NOW), walkin: 1, plans: [], assignee: l2For({ college: F.col }), dirs: [], fs: [], sid: '未填写', gender: '未填写', year: '未填写', phone: F.ph || '', ec: [] });
      s.tl = [{ at: new Date(NOW), t: `登记求助 / 报告（来源：${F.who}）`, who: ST(me()).name, k: 'report' }]; limitOf(s); }
    s.reporter = me();
    const txt = `${F.who}${urg ? '报告紧急情况' : '求助 / 报告'}：${F.note}${F.where ? '（' + F.where + '）' : ''}`;
    log(`登记${txt}`, s, { k: 'report', cat: urg ? '危机' : '流转', r: urg ? 1 : 0 });
    if (urg) { if (s.stage === 'crisis') { S.mo = null; return toast('这位学生已在危机通道中，已把新情况记入时间线'); } const k = newCrisis(s, `${ST(me()).name} 登记：${txt}`, isL1() ? '学院报告' : F.who === '学生本人' ? '主动求助' : '他人报告', true); if (k) k.by = me(); S.mo = null; return toast(`已上报：值班咨询师已收到电话和短信，${RULES.urgentMin} 分钟内必须确认`); }
    if (!s.walkin) { move(s, 'L2', 'up', { assignee: s.assignee || l2For(s), src: txt }); }
    notify(s.assignee, '站内', `新登记 1 条求助 / 报告（${F.who}）`, s.id); S.mo = null; toast(`已登记，交给咨询师跟进${isL1() && s.follower !== me() ? '；你可以在「被测名单 → 我登记的」里看到后续' : ''}`); },
  l1addGo(id) { const s = SU(id); if (!S.form.note) return toast('请写下新的情况'); log(`L1 ${ST(me()).name} 追加情况${S.form.src ? '（来源：' + S.form.src + '）' : ''}：${S.form.note}`, s, { k: 'l1add' }); const h = s.stage === 'L2' ? s.assignee : s.owner || (s.stage === 'L3' ? 'c5' : null); if (h) notify(h, '站内', `${ST(me()).name} 追加了 1 条情况`, s.id); S.mo = null; toast('已发送给当前负责人'); },
  askGo(id) { const s = SU(id), F = S.form; if (!F.what) return toast('请选择需要协助的事'); if (!F.due) return toast('请选择期限');
    s.asks = s.asks || []; s.asks.push({ what: F.what, note: F.note || '', by: me(), at: new Date(NOW), due: later({ 今天: 8, 明天: 24, '3 天内': 72 }[F.due]), st: '', log: [], done: null });
    log(`请学院协助：${F.what}（期限 ${F.due}）`, s, { k: 'ask' }); notify(s.follower, '站内 + 短信', `咨询中心请你协助：${F.what}（${F.due}）`, s.id); S.mo = null; toast(`已发给${ST(s.follower).name}`); },
  askDoneGo(id) { const s = SU(id), a = openAsk(s), F = S.form; if (!F.st) return toast('请选择进度'); if ((F.st === '受阻' || F.st === '完成' || F.st === '部分完成') && !F.note) return toast('请写下说明');
    a.st = F.st; a.log.push({ at: new Date(NOW), st: F.st, note: F.note || '' }); if (F.st === '完成') a.done = { at: new Date(NOW), note: F.note };
    log(`L1 ${ST(me()).name} 协助「${a.what}」：${F.st}${F.note ? '，' + F.note : ''}`, s, { k: 'l1add' }); notify(a.by, '站内', `${ST(me()).name} 更新了协助进度：${F.st}`, s.id); S.mo = null; toast(F.st === '完成' ? '已完成并回复中心' : `已更新为「${F.st}」，中心已收到`); },
  qualityGo(id) { const s = SU(id); s.qnote = S.form.note || ''; log(`L1 ${ST(me()).name}：作答质量待核实（${s.quality}）${s.qnote ? '，' + s.qnote : ''}`, s, { k: 'invalid' }); move(s, 'L2', 'quality', { assignee: l2For(s), src: `作答质量待核实：${s.quality}` }); notify(s.assignee, '站内', '1 位学生的作答质量待核实', s.id); close2(); toast('已交给咨询师核实'); },
  qOk(id) { const s = SU(id); log('核实作答质量：有效，按原流程处理', s, { k: 'invalid' }); notify(s.follower, '站内', `${ST(me()).name} 核实：${nm(s)} 的作答有效，请继续学院核实`, s.id); s.quality = null; move(s, 'L1', 'verify', {}); close2(); toast('已确认有效，回到学院核实，并通知了辅导员'); },
  qRedo(id) { const s = SU(id); log('核实作答质量：请学生重做', s, { k: 'invalid' }); notify(s.follower, '站内', `${ST(me()).name} 核实：已请 ${nm(s)} 重做普测`, s.id); move(s, 'redo', null); notify('stu', '短信', '请重新完成普测', s.id); close2(); toast('已请学生重做，并通知了辅导员'); },
  ackGo(id) { const s = SU(id); if (!S.form.nx) return toast('请选择下一步'); s.ack = { by: me(), at: new Date(NOW), next: S.form.nx }; log(`确认接手，下一步：${S.form.nx}${S.form.note ? '（' + S.form.note + '）' : ''}`, s, { k: 'ack' });
    [s.follower, s.reporter].filter((x, i, a) => x && a.indexOf(x) === i).forEach(u => notify(u, '站内', `${ST(me()).name} 已确认接手 ${nm(s)}，下一步：${S.form.nx}`, s.id)); S.mo = null; toast('已确认接手，并通知了学院'); },
  capGo() { log(`请中心协调工作量：今天共 ${S.form.left || 0} 件待办${S.form.note ? '（' + S.form.note + '）' : ''}`, null, { obj: '工作量' }); notify('c5', '站内', `${ST(me()).name} 今天有 ${S.form.left || 0} 件待办做不完，请求协调`, null); S.mo = null; toast('已发送给中心负责人'); },
});
/* 档案打开：只记「已查看」；确认接手是一个明确动作 */
const _open16 = open;
open = function (id) { _open16(id); const s = SU(id); if (s && S.dw && S.role === 'L2' && s.stage === 'L2' && s.assignee === me() && !s.viewed) s.viewed = { by: me(), at: new Date(NOW) }; };
const _moA = ACT.mo; ACT.mo = a => { _moA(a); if (a.startsWith('capReq')) S.form.left = S._capLeft || 0; };
