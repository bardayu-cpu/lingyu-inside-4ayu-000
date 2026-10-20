/* =====================================================================
   全组排班（L3）：月度总览 → 点开某人某周看细节 → L3 可调整并同步给本人
   每位咨询师在自己的「排班」里提交本人时段；本周数据与预约共用同一份
===================================================================== */
const SC = ['c1', 'c2', 'c3', 'c4', 'c5'];
const dkey = d => `${d.getMonth() + 1}/${d.getDate()}`;
const SCHM = {};
SC.forEach((c, ci) => { SCHM[c] = {};
  [9, 10].forEach(m => { for (let day = 1; day <= 31; day++) { const d = new Date(2026, m, day); if (d.getMonth() !== m || [0, 6].includes(d.getDay())) continue;
    const di = DAYS.findIndex(x => dkey(x) === dkey(d)); SCHM[c][dkey(d)] = di >= 0 ? SCHED[c][di] : TIMES.map((_, ti) => ((ci + day + ti) % 3 === 0 ? 'off' : 'open')); } }); });
/* 日期和钟点是跨端唯一键；SCHED 仅保留旧周视图兼容引用。 */
function schedSlots() { const out = []; SC.forEach(cid => Object.entries(SCHM[cid]).forEach(([k, row]) => { const [m, day] = k.split('/').map(Number), date = new Date(2026, m - 1, day), di = DXL.findIndex(d => sameDay(d, date)); row.forEach((v, ti) => out.push({ key: slotKey(cid, date, TIMES[ti]), cid, date: slotISO(date), time: TIMES[ti], mode: '线下/线上', modes: ['线下', '线上'], place: '心理咨询中心', st: v === 'off' ? 'closed' : v === 'bk' || di >= 0 && slotConflict(cid, di, ti) ? 'bk' : 'open' })); })); return out; }
const monday = d => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const isPast = d => d < new Date(2026, 9, 12);
function schedGroup() {
  const m = S.mon ?? 9, days = Object.keys(SCHM.c1).filter(k => +k.split('/')[0] === m + 1).map(k => new Date(2026, m, +k.split('/')[1]));
  const today = dkey(NOW), wk = DAYS.map(dkey), sel = S.schSel;
  const cell = (c, d) => { const k = dkey(d), a = SCHM[c][k], o = a.filter(v => v === 'open').length, b = a.filter(v => v === 'bk').length, past = isPast(d), on = sel && sel.c === c && monday(new Date(2026, +sel.k.split('/')[0] - 1, +sel.k.split('/')[1])).getTime() === monday(d).getTime();
    return `<td class="mc ${past ? 'past' : ''} ${on ? 'on' : ''} ${wk.includes(k) ? 'wk' : ''}" ${past ? '' : `data-act="schPick" data-arg="${c}|${k}"`} title="${ST(c).name} ${k}：开放 ${o}，已约 ${b}"><i style="opacity:${past ? .25 : .25 + o * .19}"></i><span>${o}${b ? `<b>·${b}</b>` : ''}</span></td>`; };
  let detail = '';
  if (sel) { const st = monday(new Date(2026, +sel.k.split('/')[0] - 1, +sel.k.split('/')[1])), wd = [0, 1, 2, 3, 4].map(i => { const d = new Date(st); d.setDate(st.getDate() + i); return d; }).filter(d => SCHM[sel.c][dkey(d)]);
    const dr = S.mdraft || {}, val = (k, ti) => (dr[k] || SCHM[sel.c][k])[ti], n = Object.keys(dr).reduce((a, k) => a + dr[k].filter((v, i) => v !== SCHM[sel.c][k][i]).length, 0);
    detail = `<div class="card mdetail"><h3>${photo(sel.c)}${ST(sel.c).name} · ${dkey(wd[0])}–${dkey(wd[wd.length - 1])} 的排班<span class="sp"></span><small>${ST(sel.c).title} · ${STAFF[sel.c].pre ? '接待预咨询' : '不接待预咨询'}</small><button class="btn ghost xs" data-act="schClose">${I('x', 's')}</button></h3>
      <div class="sch" style="grid-template-columns:70px repeat(${wd.length},1fr)"><div></div>${wd.map(d => `<div class="hd">${dkey(d)} 周${'日一二三四五六'[d.getDay()]}</div>`).join('')}${TIMES.map((t, ti) => `<div class="hd">${t}</div>${wd.map(d => { const k = dkey(d), v = val(k, ti), past = (() => { const x = new Date(d); const [h, mm] = t.split(':'); x.setHours(+h, +mm); return x < NOW; })();
        return v === 'bk' ? '<button class="bk" title="已有预约，要先改约">已预约</button>' : past ? '<button disabled class="past">已过</button>' : `<button class="${v === 'open' ? 'open' : ''} ${dr[k] && dr[k][ti] !== SCHM[sel.c][k][ti] ? 'chg' : ''}" data-act="mslot" data-arg="${k}|${ti}">${v === 'open' ? '开放' : '关闭'}</button>`; }).join('')}`).join('')}</div>
      <div class="wfoot"><span class="note">${n ? `<b style="color:var(--warn)">调整了 ${n} 处</b>，保存后会同步到${ST(sel.c).name}的排班，并通知她 / 他` : `这是${ST(sel.c).name}自己提交的排班；你可以直接调整，保存后同步给本人。`}</span><span class="sp"></span>${n ? '<button class="btn ghost" data-act="mDiscard">放弃</button>' : ''}<button class="btn pri" data-act="mSave" ${n ? '' : 'disabled'}>保存并同步给${ST(sel.c).name}</button></div></div>`; }
  return `<div class="card"><h3>${I('cal')}全组排班 · 2026 年 ${m + 1} 月<span class="sp"></span><button class="btn ghost xs" data-act="mon" data-arg="9" ${m === 9 ? 'disabled' : ''}>${I('left', 's')}10 月</button><button class="btn ghost xs" data-act="mon" data-arg="10" ${m === 10 ? 'disabled' : ''}>11 月${I('right', 's')}</button></h3>
    <p class="note" style="margin-top:0">每格数字 = 当天开放的时段数，「·n」= 已约 n 个；颜色越深开放越多。点任一格，下面展开那一周的细节。</p>
    <div class="mwrap"><table class="mtab"><tr><th></th>${days.map(d => `<th class="${wk.includes(dkey(d)) ? 'wk' : ''}">${d.getDate()}<small>${'日一二三四五六'[d.getDay()]}</small></th>`).join('')}<th>本月开放</th></tr>
    ${SC.map(c => `<tr><td class="who2">${photo(c)}<span>${ST(c).name}<small>${ST(c).title}</small></span></td>${days.map(d => cell(c, d)).join('')}<td><b>${days.filter(d => !isPast(d)).reduce((a, d) => a + SCHM[c][dkey(d)].filter(v => v === 'open').length, 0)}</b></td></tr>`).join('')}</table></div>
    ${UNPUB().length ? `<p class="note" style="color:var(--warn)">${UNPUB().map(u => `${ST(u.cid).name} ${u.day}`).join('、')} 还没有开放任何时段。<button class="lnk" data-act="schRemind">提醒他们</button></p>` : ''}</div>${detail}`;
}
Object.assign(ACT, {
  mon(m) { S.mon = +m; S.schSel = null; S.mdraft = null; },
  schPick(a) { const [c, k] = a.split('|'); if (S.mdraft && Object.keys(S.mdraft).length && (!S.schSel || S.schSel.c !== c)) return toast('先保存或放弃当前的调整'); S.schSel = { c, k }; if (!S.mdraft) S.mdraft = {}; },
  schClose() { S.schSel = null; S.mdraft = null; },
  mslot(a) { const [k, ti] = a.split('|'), c = S.schSel.c; S.mdraft = S.mdraft || {}; if (!S.mdraft[k]) S.mdraft[k] = SCHM[c][k].slice(); S.mdraft[k][ti] = S.mdraft[k][ti] === 'open' ? 'off' : 'open'; },
  mDiscard() { S.mdraft = {}; },
  mSave() { if (S.role !== 'L3' || !S.schSel) return toast('只有中心负责人可调整全组排班'); const c = S.schSel.c, ch = []; if (!schedCanPublish(c, S.mdraft || {})) return toast('改班影响已有预约或有效入口，请先补足替代安排'); Object.entries(S.mdraft || {}).forEach(([k, arr]) => { arr.forEach((v, i) => { if (v !== SCHM[c][k][i]) ch.push(`${k} ${TIMES[i]} ${v === 'open' ? '开放' : '关闭'}`); }); SCHM[c][k].splice(0, TIMES.length, ...arr); const di = DAYS.findIndex(d => dkey(d) === k); if (di >= 0) SCHED[c][di] = SCHM[c][k]; });
    notify(c, '站内 + 短信', `${ST(me()).name} 调整了你的排班：${ch.join('、')}`, null); log(`调整 ${ST(c).name} 的排班：${ch.join('、')}`, null, { cat: '预约', obj: '排班' }); S.mdraft = {}; toast(`已保存，并同步给${ST(c).name}`); },
  schRemind() { UNPUB().forEach(u => notify(u.cid, '站内 + 短信', `请提交 ${u.day} 的排班`, null)); log(`提醒提交排班：${UNPUB().map(u => ST(u.cid).name).join('、')}`, null, { cat: '预约', obj: '排班' }); toast('已提醒'); },
});

/* 停诊以具体日期、时段落库；计划性减班不能绕过已有预约和入口保护。 */
function schedRegRange(raw) {
  const m = String(raw || '').trim().match(/^(?:(\d{4})[-/])?(\d{1,2})[-/](\d{1,2})(?:\s*(上午|下午|晚上|全天))?$/);
  if (!m) return null; const d = new Date(m[1] ? +m[1] : NOW.getFullYear(), +m[2] - 1, +m[3]);
  if (d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return null;
  return { date: slotISO(d), day: DXL.findIndex(x => sameDay(x, d)), key: dkey(d), times: TIMES.map((_, i) => i).filter(i => !m[4] || m[4] === '全天' || (m[4] === '上午' ? +TIMES[i].slice(0,2) < 12 : m[4] === '下午' ? +TIMES[i].slice(0,2) >= 12 && +TIMES[i].slice(0,2) < 18 : +TIMES[i].slice(0,2) >= 18)) };
}
function schedCloseRange(cid, range, type, reason) {
  if (!SCHM[cid] || !SCHM[cid][range.key] || !range.times.length) return false;
  const affected = BOOK.filter(b => b.cid === cid && b.day === range.day && range.times.includes(b.t) && bookOccupies(b));
  const closure = { cid, date: range.date, times: range.times.map(t => TIMES[t]), type, reason };
  if (type !== '病假停诊' && (affected.length || typeof ivCanCloseSlots === 'function' && !ivCanCloseSlots(range.times.map(t => slotKey(cid, range.date, TIMES[t]))))) return false;
  range.times.forEach(t => { SCHM[cid][range.key][t] = 'off'; if (SCHED[cid][range.day]) SCHED[cid][range.day][t] = 'off'; });
  affected.forEach(b => { b.adjustFrom = { day: b.day, t: b.t, st: b.st }; b.st = 'adjust'; b.adjustReason = reason || '老师临时有事'; b.req = null; bookChanged(b, 'adjust'); notify('stu', '站内 + 短信', '原定的时间因老师临时有事取消了，老师会尽快重新和你约。', b.id); });
  if (typeof ivScheduleChanged === 'function') ivScheduleChanged(closure);
  return { affected: affected.length };
}

function schedCanPublish(cid, rows) { const closing = []; for (const [key, arr] of Object.entries(rows)) { const [m,d] = key.split('/').map(Number), date = new Date(NOW.getFullYear(),m-1,d), day = DXL.findIndex(x=>sameDay(x,date)); for (let t=0;t<arr.length;t++) { if (arr[t] === SCHM[cid][key][t]) continue; if (day >= 0 && slotConflict(cid,day,t)) return false; if (arr[t] === 'off') closing.push(slotKey(cid,date,TIMES[t])); } } return typeof ivCanCloseSlots !== 'function' || ivCanCloseSlots(closing); }
function schedWorkload(period = 'week') {
  const start = period === 'month' ? new Date(NOW.getFullYear(), NOW.getMonth(), 1) : monday(NOW); start.setHours(0, 0, 0, 0);
  const end = new Date(start); if (period === 'month') end.setMonth(end.getMonth() + 1); else end.setDate(end.getDate() + 7);
  const inPeriod = d => new Date(d) >= start && new Date(d) < end;
  return SC.map(cid => { const slots = schedSlots().filter(x => x.cid === cid && inPeriod(x.date + 'T00:00:00') && x.st !== 'closed');
    return { cid, total: slots.length, open: slots.filter(x => x.st === 'open').length, booked: BOOK.filter(b => b.cid === cid && bookOccupies(b) && b.st !== 'record' && inPeriod(DD(b.day))).length }; });
}
ACT.workPeriod = function (p) { if (['week', 'month'].includes(p)) S.tabs.workPeriod = p; };
