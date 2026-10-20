/* =====================================================================
   v1.14 · 谈心邀约（学生端）
   · 老师在机构端「谈心」里发邀约，学生在消息中心收到：「辅导员 周老师 约你 10/14 周三 15:00–15:30 在学院办公室聊聊」，不写原因
   · 学生可以回：好的 / 换个时间（选日期 + 上午、下午或晚上，最多 3 个时段，理由选填）/ 这次不用了
   · 老师提出新时间后，学生再确认一次
   · 场景 B（陈嘉怡）单独打开时自带一条邀约；试用版里以机构端为准
===================================================================== */
const INV_PARTS = [['上午', 'Morning'], ['下午', 'Afternoon'], ['晚上', 'Evening']];
const invDay = d => `${d.getMonth() + 1}/${d.getDate()} 周${'日一二三四五六'[d.getDay()]}`;
const invDayEn = d => `${WDS()[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
const invHM = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const invWhen = v => { const a = new Date(v.start), b = new Date(v.end); return L(`${invDay(a)} ${invHM(a)}–${invHM(b)}`, `${invDayEn(a)}, ${invHM(a)}–${invHM(b)}`); };
/* v1.16（决定 7）：统一写「全名 老师（岗位）」 */
const invWho = v => L(`${v.who} 老师（${v.tag || '老师'}）`, `${v.who} (${({ 辅导员: 'college advisor', 任课老师: 'lecturer', 心理中心: 'counselling centre' })[v.tag] || 'teacher'})`);
const invWhere = v => v.mode === '面对面' ? L(`在${v.place === '办公室' || !v.place ? '学院办公室' : v.place}`, v.place === '办公室' || !v.place ? 'at the college office' : `at the ${({ 寝室: 'dorm', 教室: 'classroom' })[v.place] || 'agreed place'}`)
  : L(`用${v.mode}`, `by ${({ 电话: 'phone', 语音: 'voice call', 视频: 'video call', 即时消息: 'message', 邮件: 'email' })[v.mode] || v.mode}`);
const invLine = v => L(`${invWho(v)} 约你 ${invWhen(v)} ${invWhere(v)}聊聊`, `${invWho(v)} would like to chat with you ${invWhen(v)} ${invWhere(v)}`);
/* 学生看到的状态（不显示任何等级或原因） */
const invSt = v => ({
  wait: [L('等你回复', 'Waiting for your reply'), 'w'], wait2: [L('老师提了新时间，等你确认', 'New time proposed — please confirm'), 'w'],
  change: [L('已发给老师，等老师给新时间', 'Sent — waiting for a new time'), 'n'], ok: [L('已确认', 'Confirmed'), 'ok'], no: [L('你回复了这次不用了', 'You said not this time'), 'n'],
  frozen: [L('这次约谈先暂停，老师之后会再联系你', 'On hold — your teacher will get back to you'), 'n'], cancel: [L('老师取消了这次约谈', 'Cancelled by your teacher'), 'n'],
  expired: [L('已过期', 'Expired'), 'n'], done: [L('已经聊过', 'Done'), 'n'] })[v.st] || ['', 'n'];
const invZE = f => { const k = LANG; LANG = 'zh'; const z = f(); LANG = 'en'; const e = f(); LANG = k; return [z, e]; };
const invNeed = v => ['wait', 'wait2'].includes(v.st);

function invAdd(v, quiet) { S.invs = S.invs || []; const o = Object.assign({ r: null, rv: 0, slots: [], why: '' }, v); S.invs.push(o);
  if (!quiet) S.inbox.unshift({ at: new Date(NOW), ico: 'chat', t: invZE(() => L(`${invWho(o)} 约你聊聊`, 'A chat invitation')), d: invZE(() => o.msg && LANG === 'zh' ? o.msg : invLine(o)), link: 'inv:' + o.id, read: false, sms: o.sms });
  return o; }
/* 以老师那边为准更新（试用版联动） */
function invUpd(v) { S.invs = S.invs || []; const o = S.invs.find(x => x.id === v.id); if (!o) return invAdd(v);
  const moved = o.start !== v.start, st0 = o.st, who0 = o.who; Object.assign(o, { st: v.st, ver: v.ver, start: v.start, end: v.end, mode: v.mode, place: v.place, link: v.link || '', who: v.who, tag: v.tag });
  const ask = () => { o.r = null; o.chg = true; S.inv = o.id; S.ivf = null; S.modal = 'inv'; };
  if (v.st === 'wait2' && (st0 !== 'wait2' || moved)) { ask(); addMsg('edit', invZE(() => L(`${invWho(o)}给了新的时间`, 'Your teacher proposed a new time')), invZE(() => invLine(o)), 'inv:' + o.id, o.sms); }
  else if (v.st === 'wait' && moved && st0 !== 'frozen') { ask(); addMsg('edit', invZE(() => L(`${invWho(o)}调整了约谈时间，请再确认一次`, 'Chat time changed — please confirm again')), invZE(() => invLine(o)), 'inv:' + o.id, o.sms); }
  else if (v.st === 'cancel' && st0 !== 'cancel') addMsg('chat', invZE(() => L(`${invWho(o)}取消了这次约谈`, 'Your teacher cancelled the chat')), invZE(() => invWhen(o)), 'inv:' + o.id);
  else if (v.st === 'frozen' && st0 !== 'frozen') addMsg('chat', ['这次约谈先暂停', 'Chat on hold'], ['老师之后会再联系你。', 'Your teacher will get back to you.'], 'inv:' + o.id);
  else if (st0 === 'frozen' && ['wait', 'ok', 'wait2'].includes(v.st)) addMsg('chat', ['约谈恢复了', 'Chat back on'], invZE(() => invLine(o)), 'inv:' + o.id);
  else if (st0 === 'frozen' && v.st === 'expired') addMsg('chat', ['原定的约谈时间已过', 'The planned chat time has passed'], ['老师会再和你约时间。', 'Your teacher will arrange a new time.'], 'inv:' + o.id);
  else if (moved && v.st === 'ok') addMsg('edit', invZE(() => L(`${invWho(o)}调整了约谈时间`, 'Chat time changed')), invZE(() => invLine(o)), 'inv:' + o.id);
  if (who0 && v.who !== who0 && !['cancel', 'done'].includes(v.st)) addMsg('chat', invZE(() => L(`约谈改由 ${invWho(o)} 负责`, 'A different teacher will meet you')), invZE(() => invLine(o)), 'inv:' + o.id);
  return o; }

MODALS.inv = () => { const v = (S.invs || []).find(x => x.id === S.inv); if (!v) return ''; const [stT, stC] = invSt(v), F = S.ivf || (S.ivf = { slots: [], why: '', open: false });
  const days = DAYS.slice(0, 7), slotsH = F.slots.map((s, i) => `<span class="pill n">${LANG === 'en' ? `${invDayEn(new Date(s.d))} · ${INV_PARTS.find(p => p[0] === s.part)[1]}` : `${s.day} ${s.part}`}<a class="lnk" data-act="ivSlotDel" data-arg="${i}" style="margin-left:6px">×</a></span>`).join(' ');
  const pick = F.open ? `<div class="fld" style="text-align:left;margin-top:12px"><div class="lab">${L('你方便的时间（最多 3 个）', 'When suits you (up to 3)')}</div>
      <div class="chips" style="margin-bottom:8px">${days.map((d, i) => `<button class="${F.di === i ? 'on' : ''}" data-act="ivDay" data-arg="${i}">${LANG === 'en' ? invDayEn(d) : invDay(d)}</button>`).join('')}</div>
      <div class="seg" style="margin-bottom:8px">${INV_PARTS.map(([z, e]) => `<button data-act="ivPart" data-arg="${z}" ${F.di == null || F.slots.length >= 3 ? 'disabled' : ''}>${L(z, e)}</button>`).join('')}</div>
      <div style="margin-bottom:10px">${slotsH || `<small class="note">${L('先选日期，再点上午、下午或晚上', 'Pick a day, then a part of the day')}</small>`}</div>
      <div class="lab">${L('想说一句原因（选填）', 'Anything to add? (optional)')}</div><input class="inp" data-bind="ivf.why" value="${esc(F.why)}" placeholder="${L('比如：那天下午有课', 'e.g. I have class that afternoon')}"></div>` : '';
  const acts = !invNeed(v) || v.r ? `<div class="acts"><button class="btn pri" data-act="close">${L('知道了', 'Got it')}</button></div>`
    : F.open ? `<div class="acts"><button class="btn sec" data-act="ivBack">${L('返回', 'Back')}</button><button class="btn pri" data-act="ivSend" ${F.slots.length ? '' : 'disabled'}>${L('发给老师', 'Send')}</button></div>`
    : `<div class="acts" style="flex-wrap:wrap"><button class="btn ghost" data-act="ivR" data-arg="这次不用了">${L('这次不用了', 'Not this time')}</button><button class="btn sec" data-act="ivChg">${L('换个时间', 'Another time')}</button><button class="btn pri" data-act="ivR" data-arg="好的">${L('好的', 'Sounds good')}</button></div>`;
  return `<div class="mo"><div class="okmark" style="background:var(--pri-t);color:var(--gold2)">${I('chat')}</div>
    <h3>${v.st === 'wait2' ? L('老师给了新的时间', 'A new time from your teacher') : L('约你聊聊', 'A chat invitation')}</h3>
    ${v.chg && invNeed(v) && !v.r ? `<p class="ivchg">${L('老师更新了时间，请再确认一次', 'Your teacher updated the time — please confirm again')}</p>` : ''}
    <div class="ivwhen"><b>${invWhen(v)}</b><span class="pill ${stC}">${v.r && invNeed(v) ? L(`你回复了：${v.r}`, 'Reply sent') : stT}</span></div>
    <div class="box2"><div><span>${L('邀请老师', 'From')}</span><b>${invWho(v)}</b></div><div><span>${v.mode === '面对面' ? L('地点', 'Place') : L('方式', 'How')}</span><b>${invWhere(v).replace(/^在|^用/, '')}</b></div>${v.mode === '视频' ? `<div><span>${L('会议链接', 'Meeting link')}</span><b>${v.link ? `<a href="${esc(v.link)}" target="_blank" rel="noopener">${L('点这里进入', 'Join')}</a>` : L('老师会另行发给你', 'Your teacher will send it')}</b></div>` : ''}</div>
    ${v.slots && v.slots.length && v.st === 'change' ? `<p class="note">${L(`你给的时间：${v.slots.map(s => `${s.day} ${s.part}`).join('、')}`, `Times you offered: ${v.slots.length}`)}</p>` : ''}
    ${invNeed(v) && !v.r && !F.open ? `<p class="note">${L('只是聊聊近况，不用准备什么。方便的话点「好的」；时间不合适可以换个时间。', 'Just a catch-up — nothing to prepare. Tap “Sounds good”, or pick another time if this one doesn’t work.')}</p>` : ''}
    ${pick}${acts}</div>`; };

Object.assign(ACT, {
  ivOpen(id) { S.inv = id; S.ivf = null; S.modal = 'inv'; },
  ivChg() { S.ivf.open = true; },
  ivBack() { S.ivf.open = false; },
  ivDay(i) { S.ivf.di = +i; },
  ivPart(p) { const F = S.ivf, d = DAYS[F.di]; if (F.slots.length >= 3 || F.slots.some(s => s.d === d.toISOString() && s.part === p)) return; F.slots.push({ day: invDay(d), d: d.toISOString(), part: p }); },
  ivSlotDel(i) { S.ivf.slots.splice(+i, 1); },
  ivR(r) { const v = S.invs.find(x => x.id === S.inv); v.chg = false; v.r = r; v.rv++; v.slots = []; v.why = ''; v.st = r === '好的' ? 'ok' : 'no'; S.modal = null;
    addFoot('chat', invZE(() => L(r === '好的' ? `答应了${invWho(v)}的约谈（${invWhen(v)}）` : `回复${invWho(v)}：这次不用了`, r === '好的' ? 'Accepted a chat invitation' : 'Declined a chat invitation')), 'ivOpen:' + v.id);
    toast(r === '好的' ? L('已告诉老师，到时见', 'Your teacher has been told') : L('已告诉老师，这次不用了', 'Your teacher has been told')); },
  ivSend() { const v = S.invs.find(x => x.id === S.inv), F = S.ivf; if (!F.slots.length) return toast(L('请至少选一个时段', 'Pick at least one time'));
    Object.assign(v, { r: '换个时间', rv: v.rv + 1, slots: F.slots.map(s => ({ day: s.day, part: s.part })), why: (F.why || '').trim(), st: 'change' }); S.modal = null; S.ivf = null;
    toast(L('已发给老师，老师会给你新的时间', 'Sent — your teacher will propose a new time')); }
});
/* 消息中心：邀约消息打开弹窗 */
const _msgOpenInv = ACT.msgOpen; ACT.msgOpen = function (i) { const x = S.inbox[+i]; if (x.link && x.link.startsWith('inv:')) { x.read = true; return ACT.ivOpen(x.link.slice(4)); } return _msgOpenInv(i); };
/* 场景 B 自带一条邀约（单独打开学生端时；试用版里会被机构端的数据覆盖） */
const _resetInv = reset; reset = function (scen) { _resetInv.apply(this, arguments); S.invs = [];
  if ((scen || 'A') === 'B') { const o = invAdd({ id: 'iv1', st: 'wait', ver: 1, start: new Date(2026, 9, 14, 15, 0).toISOString(), end: new Date(2026, 9, 14, 15, 30).toISOString(), mode: '面对面', place: '办公室', who: '周也', tag: '辅导员', sms: true }, true);
    S.inbox.unshift({ at: new Date(NOW.getTime() - 2 * 3600e3), ico: 'chat', t: invZE(() => L(`${invWho(o)} 约你聊聊`, 'A chat invitation')), d: invZE(() => invLine(o)), link: 'inv:iv1', read: false, sms: true }); } };
