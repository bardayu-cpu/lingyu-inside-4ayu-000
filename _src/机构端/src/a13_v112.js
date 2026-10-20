/* =====================================================================
   v1.12 · 采购方演示后加的三项（2026-10-13）
   1. 预咨询小屿：学生预约时整理「想聊什么」，咨询师在预约和档案里看到摘要；位置由学校设置
   2. 施测方案多种触达：勾选渠道 + 发送时间；统一海报（5 个模板 + 换底图）；触达总览与再提醒
   3. 辅导员「学生工作」：谈心记录（中心可发起）、管理范围由系统管理员配置、导出、学院系统占位
===================================================================== */
Object.assign(RULES, { intakeMode: 'A', intakeBrief: '关闭', l1Scope: '本学院' });
RULES.l1Cols = { u1: COLLEGES.filter(c => FOLLOWER_OF[c] === 'u1'), u2: COLLEGES.filter(c => FOLLOWER_OF[c] === 'u2') };
const IKM = { A: 'A · 预约申请提交后（推荐）', B: 'B · 选好时段后、提交前', C: 'C · 关闭' };
const isCenter = () => ['L2', 'L3'].includes(S.role);

/* ---------- 1. 预咨询摘要 ---------- */
(() => { const b1 = BOOK.find(b => b.id === 'b1'), b2 = BOOK.find(b => b.id === 'b2');
  if (b1) b1.intake = { st: 'sent', at: ago(4.5), ver: 1, viewed: false, mode: 'A', sum: { topics: ['学业压力', '情绪低落'], trouble: '这学期课程跟不上，越落越多，最近什么都提不起劲，也不太想见人', dur: '几个月', impact: '影响很大', expect: '想有人听我说说', extra: '希望老师说话慢一点，我比较紧张' } };
  if (b2) b2.intake = { st: 'skipped', at: ago(2.8), ver: 1, mode: 'A' };
})();
const ikOf = b => b && b.intake;
function intakeTag(b) { if (isL1() || S.role === 'ADM' || b.kind !== '预咨询') return ''; const it = ikOf(b);
  if (!it || it.st === 'none') return '<small class="ikt">预咨询小屿：学生还没聊</small>';
  if (it.st === 'skipped') return '<small class="ikt">预咨询小屿：学生跳过</small>';
  if (it.st === 'draft') return '<small class="ikt">预咨询小屿：学生已保存，未发送</small>';
  return `<small class="ikt on"><button class="lnk" data-act="mo" data-arg="intake:${b.id}">${I('chat', 's')}预咨询摘要${it.viewed ? '' : ' · 新'}</button></small>`; }
function intakeBox(b, wide) { const it = ikOf(b), s = SU(b.sid); if (!it || !it.sum) return '';
  const r = (k, v) => v ? `<tr><td style="width:120px" class="note">${k}</td><td>${v}</td></tr>` : '';
  return `<div class="dbox ikbox"><b>${I('chat', 's')}预咨询摘要 · ${nm(s)}<span class="sp"></span><small class="note">学生 ${fmt(it.at)} 发送${it.ver > 1 ? ` · 第 ${it.ver} 版` : ''}${it.viewed ? ' · 已查看' : ''}</small></b>
    ${it.crisis ? `<p style="color:var(--crit);margin:6px 0 0">${I('alert', 's')} 对话中出现安全表达，已按危机流程处理</p>` : ''}
    <table class="t" style="margin-top:6px">${r('想聊的话题', it.sum.topics.join('、'))}${r('最困扰的事（原话）', `「${esc(it.sum.trouble)}」`)}${r('持续多久', it.sum.dur)}${r('影响', it.sum.impact)}${r('希望得到的帮助', it.sum.expect)}${r('补充', esc(it.sum.extra).replace(/\n/g, '<br>'))}</table>
    <p class="note" style="margin:6px 0 0">由预咨询小屿整理、学生本人确认后发送；只收集信息，不评分，不改变等级。${wide ? '' : ' 辅导员看不到。'}</p></div>`; }
var markViewed = b => { const it = ikOf(b); if (it && it.st === 'sent' && !it.viewed && me() === b.cid) { it.viewed = true; log('查看预咨询摘要', SU(b.sid), { cat: '查看', noTl: 1 }); } };

/* ---------- 2. 触达 ---------- */
const CH = [['sms', '短信', '名单内学生的手机', 1], ['mail', '学校邮箱', 'NTU 邮箱，含说明和链接', 1], ['pack', '辅导员转发包', '发给各学院辅导员：转发文案 + 二维码 + 海报', 1], ['home', '学生端首页', '学生登录后首页的任务卡', 1], ['qr', '二维码', '打印或课堂投屏，扫码登录后按学生归因', 0], ['poster', '宣传海报', '全校统一一张，5 个模板，可换底图', 0]];
const WHEN = ['发布时立即发', '定时发', '跟随每一波'];
const defCh = () => ({ sms: { on: 1, when: '发布时立即发' }, mail: { on: 1, when: '发布时立即发' }, pack: { on: 1, when: '跟随每一波' }, home: { on: 1, when: '发布时立即发' }, qr: { on: 1 }, poster: { on: 1 } });
const POSTER_TPL = [['暖米色小屿', '#fbf3e3', '#f3dfb8', '#5c4a1f', '#d9902c'], ['简约校园', '#eef3f1', '#d5e3dd', '#1f3d35', '#3d6b5c'], ['新生季', '#fff1ea', '#ffd9c7', '#6a2f1c', '#e2703f'], ['考试周减压', '#eef0fb', '#d7dcf5', '#26306a', '#5464c8'], ['夜间安心', '#1f2a3a', '#2c3a52', '#f3ead6', '#e6b860']];
let defPoster = p => ({ tpl: 0, title: '花 15 分钟，和自己聊聊', sub: (p && p.name) || '2026 秋季学期心理健康普测', due: (p && p.due) ? `${p.due} 截止` : '10/19 截止', contact: 'UCC · +65 6000 0000（示意）', bg: null });
const t1p = planOf('t1'); if (t1p) { t1p.ch = defCh(); t1p.poster = defPoster(t1p); }
/* 每位学生从哪个渠道第一次进入（扫码按登录归因） */
const VIA = ['sms', 'sms', 'sms', 'home', 'home', 'mail', 'pack', 'pack', 'qr', 'poster'];
const viaOf = (k, i) => VIA[(k.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + i * 7) % VIA.length];
SURV().forEach((s, i) => { s.via = s.via || viaOf(s.id, i); });
PENDING.forEach((p, i) => { if (p.st !== '未开始') p.via = p.via || viaOf(p.sid || p.name, i); });
function reachData(p) {
  const chOn = CH.filter(([k]) => (p.ch || defCh())[k] && (p.ch || defCh())[k].on);
  if (p.id === 't1') { const done = SURV(), op = PENDING.filter(x => x.st !== '未开始'), N = ROSTER;
    const rows = chOn.map(([k, n, d, send]) => ({ k, n, sent: send ? N : null, open: done.filter(s => s.via === k).length + op.filter(x => x.via === k).length, done: done.filter(s => s.via === k).length }));
    return { N, open: done.length + op.length, done: done.length, rows }; }
  const N = p.roster || 0, D = p.done || 0, O = Math.min(N, D + Math.round(N * 0.12)), w = { sms: .4, mail: .1, pack: .15, home: .2, qr: .1, poster: .05 }, tw = chOn.reduce((a, [k]) => a + w[k], 0) || 1;
  return { N, open: O, done: D, rows: chOn.map(([k, n, d, send]) => ({ k, n, sent: send ? N : null, open: Math.round(O * w[k] / tw), done: Math.round(D * w[k] / tw) })) };
}
const chName = k => (CH.find(c => c[0] === k) || [k, k])[1];
const isToday = d => d && sameDay(d, NOW);
function reachPanel(p) {
  const R = reachData(p), pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '—', ch = p.ch || defCh();
  let list = '';
  if (p.id === 't1') { const f = S.f, sel = S.rsel || (S.rsel = {});
    let pl = PENDING.map((x, i) => ({ ...x, i, stt: x.st === '未开始' ? '未打开' : '已打开未完成' }));
    if (f.rst) pl = pl.filter(x => x.stt === f.rst); if (f.rcol) pl = pl.filter(x => x.college === f.rcol); if (f.rch) pl = pl.filter(x => x.via === f.rch);
    const per = 12, pages = Math.max(1, Math.ceil(pl.length / per)), pg = Math.min(S.rpg || 1, pages), nsel = Object.values(sel).filter(Boolean).length;
    list = `<h4 style="margin:18px 0 8px">还没完成的人 · 可以再提醒一次</h4>
    <div class="filters"><select data-bind="f.rst" data-rerender><option value="">全部状态</option>${['未打开', '已打开未完成'].map(x => `<option ${f.rst === x ? 'selected' : ''}>${x}</option>`).join('')}</select><select data-bind="f.rcol" data-rerender><option value="">全部学院</option>${COLLEGES.map(c => `<option ${f.rcol === c ? 'selected' : ''}>${c}</option>`).join('')}</select><select data-bind="f.rch" data-rerender><option value="">全部进入渠道</option>${CH.map(([k, n]) => `<option value="${k}" ${f.rch === k ? 'selected' : ''}>${n}</option>`).join('')}</select><span class="note">${pl.length} 人</span><span style="flex:1"></span>
      <button class="btn sec xs" data-act="mo" data-arg="remind:sel" ${nsel ? '' : 'disabled'}>提醒所选（${nsel}）</button><button class="btn pri xs" data-act="mo" data-arg="remind:all">提醒筛选出的 ${pl.length} 人</button></div>
    <table class="t"><tr><th style="width:32px"></th><th>学生</th><th>学院</th><th>状态</th><th>从哪里进入</th><th>已提醒</th><th>最近一次</th></tr>${pl.slice((pg - 1) * per, pg * per).map(x => `<tr><td><input type="checkbox" ${sel[x.i] ? 'checked' : ''} data-act="rsel" data-arg="${x.i}"></td><td>${x.name}<small>${x.sid}</small></td><td>${x.college}</td><td><span class="pill ${x.stt === '未打开' ? '' : 'w'}">${x.stt}</span></td><td>${x.via ? chName(x.via) : '—'}</td><td>${x.rem} 次</td><td>${x.remAt ? `${fmt(x.remAt)} · ${chName(x.remCh)}${isToday(x.remAt) ? '<small>今天已提醒</small>' : ''}` : '—'}</td></tr>`).join('')}</table>
    <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:8px">${Array.from({ length: pages }, (_, i) => `<button class="btn ${pg === i + 1 ? 'pri' : 'sec'} xs" data-act="rpg" data-arg="${i + 1}">${i + 1}</button>`).join('')}</div>`; }
  return `<div class="reach"><div class="grid g4" style="margin-bottom:12px">${[['已下发', R.N, '去重后的人数'], ['已打开', R.open, pct(R.open, R.N)], ['已完成', R.done, pct(R.done, R.N)], ['还没打开', R.N - R.open, pct(R.N - R.open, R.N)]].map(k => `<div class="kpi"><small>${k[0]}</small><b>${k[1]}</b><span>${k[2]}</span></div>`).join('')}</div>
    <table class="t"><tr><th>渠道</th><th>发送时间</th><th>下发人数</th><th>从这里打开</th><th>从这里完成</th><th>完成率</th></tr>${R.rows.map(r => `<tr><td><b>${r.n}</b></td><td>${ch[r.k] && ch[r.k].when ? ch[r.k].when + (ch[r.k].when === '定时发' && ch[r.k].at ? ' · ' + ch[r.k].at : '') : '—'}</td><td>${r.sent ?? '—'}</td><td>${r.open}</td><td>${r.done}</td><td>${r.sent ? pct(r.done, r.sent) : pct(r.done, r.open)}</td></tr>`).join('')}
      <tr class="sum"><td><b>合计（去重）</b></td><td></td><td><b>${R.N}</b></td><td><b>${R.open}</b></td><td><b>${R.done}</b></td><td><b>${pct(R.done, R.N)}</b></td></tr></table>
    <p class="note">「打开」= 点开链接并登录，邮件是否被阅读无法准确统计。二维码和海报没有下发人数，扫码登录后按学生归因；同一学生从多个渠道进入，按第一次进入的渠道计算。</p>
    <div class="assets"><span class="note">素材：</span>${ch.qr && ch.qr.on ? `<button class="btn sec xs" data-act="qrDl" data-arg="${p.id}">${I('dl', 's')}下载二维码</button>` : ''}${ch.poster && ch.poster.on ? `<button class="btn sec xs" data-act="mo" data-arg="poster:${p.id}">${I('edit', 's')}海报（${POSTER_TPL[(p.poster || defPoster(p)).tpl][0]}）</button>` : ''}${ch.mail && ch.mail.on ? `<button class="btn sec xs" data-act="mo" data-arg="mailPrev:${p.id}">邮件预览</button>` : ''}${ch.pack && ch.pack.on ? `<button class="btn sec xs" data-act="mo" data-arg="packPrev:${p.id}">辅导员转发包</button>` : ''}</div>${list}</div>`;
}
/* 海报：canvas 绘制，可下载 */
function fakeQR(ctx, x, y, s, seed) { const n = 25, c = s / n; ctx.fillStyle = '#fff'; ctx.fillRect(x - 8, y - 8, s + 16, s + 16); ctx.fillStyle = '#111';
  let r = seed * 9301 + 49297; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const f = (a, b) => a < 7 && b < 7; if (f(i, j) || f(n - 1 - i, j) || f(i, n - 1 - j)) continue; if (rnd() > .52) ctx.fillRect(x + i * c, y + j * c, c, c); }
  [[0, 0], [n - 7, 0], [0, n - 7]].forEach(([a, b]) => { ctx.fillRect(x + a * c, y + b * c, 7 * c, 7 * c); ctx.fillStyle = '#fff'; ctx.fillRect(x + (a + 1) * c, y + (b + 1) * c, 5 * c, 5 * c); ctx.fillStyle = '#111'; ctx.fillRect(x + (a + 2) * c, y + (b + 2) * c, 3 * c, 3 * c); }); }
const IMG = {}; const img = src => { if (!IMG[src]) { const i = new Image(); i.onload = () => { if (S.mo && S.mo.startsWith('poster')) render(); }; i.src = src; IMG[src] = i; } return IMG[src]; };
function drawPoster(P, w = 600) { const h = w * 1.5, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'), [nm0, bg1, bg2, ink, acc] = POSTER_TPL[P.tpl], k = w / 600;
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, bg1); g.addColorStop(1, bg2); x.fillStyle = g; x.fillRect(0, 0, w, h);
  if (P.bg) { const im = img(P.bg); if (im.complete && im.naturalWidth) { const r = Math.max(w / im.naturalWidth, h / im.naturalHeight); x.drawImage(im, (w - im.naturalWidth * r) / 2, (h - im.naturalHeight * r) / 2, im.naturalWidth * r, im.naturalHeight * r); x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(0, h * .52, w, h * .48); } }
  if (P.tpl === 1) { x.fillStyle = acc; x.fillRect(0, 0, w, 14 * k); } if (P.tpl === 2) { x.fillStyle = acc + '33'; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(80 * k + i * 95 * k, 120 * k + (i % 2) * 40 * k, 34 * k, 0, 7); x.fill(); } } if (P.tpl === 3) { x.strokeStyle = acc + '55'; x.lineWidth = 3 * k; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(w / 2, 330 * k, (90 + i * 36) * k, 0, 7); x.stroke(); } } if (P.tpl === 4) { x.fillStyle = '#fff8'; for (let i = 0; i < 40; i++) x.fillRect((i * 137 % 600) * k, (i * 89 % 420) * k, 2 * k, 2 * k); x.fillStyle = acc; x.beginPath(); x.arc(470 * k, 110 * k, 46 * k, 0, 7); x.fill(); x.fillStyle = bg1; x.beginPath(); x.arc(490 * k, 96 * k, 44 * k, 0, 7); x.fill(); }
  if (!P.bg) { const m = img(typeof MASCOT_FULL !== 'undefined' ? MASCOT_FULL : MASCOT); if (m.complete && m.naturalWidth) { const mh = 300 * k, mw = mh * m.naturalWidth / m.naturalHeight; x.drawImage(m, w / 2 - mw / 2, 160 * k, mw, mh); } }
  x.fillStyle = ink; x.textAlign = 'center'; x.font = `600 ${18 * k}px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif`; x.fillText('NTU 大学心理咨询中心 · 灵屿', w / 2, 70 * k);
  x.font = `700 ${40 * k}px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif`; x.fillText(P.title, w / 2, 520 * k);
  x.font = `${22 * k}px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif`; x.fillText(P.sub, w / 2, 562 * k);
  x.fillStyle = acc; const bw = 220 * k; x.beginPath(); x.roundRect ? x.roundRect(w / 2 - bw / 2, 590 * k, bw, 40 * k, 20 * k) : x.rect(w / 2 - bw / 2, 590 * k, bw, 40 * k); x.fill(); x.fillStyle = '#fff'; x.font = `600 ${19 * k}px sans-serif`; x.fillText(P.due, w / 2, 617 * k);
  fakeQR(x, w / 2 - 75 * k, 655 * k, 150 * k, 7); x.fillStyle = ink; x.font = `${16 * k}px sans-serif`; x.fillText('扫码，用 NTU 账号登录参与', w / 2, 852 * k);
  x.font = `${14 * k}px sans-serif`; x.globalAlpha = .8; x.fillText(P.contact, w / 2, 878 * k); x.font = `${12 * k}px sans-serif`; x.fillText('结果只用于为你提供支持，不进入任何成绩或档案 · 二维码为示意', w / 2, 893 * k); x.globalAlpha = 1;
  return cv; }
const posterOf = id => { if (String(id).startsWith('l1~')) { const pid = id.slice(3), key = me() + '~' + pid; S.l1p = S.l1p || {}; return S.l1p[key] = S.l1p[key] || JSON.parse(JSON.stringify(posterOf(pid))); }   // 辅导员自己的一份，按人分开存（v1.17）
  if (id === 'wiz') { S.wiz.poster = S.wiz.poster || defPoster(S.wiz); return S.wiz.poster; } const p = planOf(id); p.poster = p.poster || defPoster(p); return p.poster; };

/* ---------- 3. 学生工作 · 谈心记录 ---------- */
const scopeCols = u => RULES.l1Scope === '仅自己跟进的学生' ? [] : (RULES.l1Cols[u] || []);
const inScope = (s, u = me()) => s.follower === u || scopeCols(u).includes(s.college);
const scopeTxt = (u = me()) => RULES.l1Scope === '仅自己跟进的学生' ? '仅你跟进的学生' : `${scopeCols(u).join('、')}（${RULES.l1Scope}）`;
const TALKS = [];
const inCenter = s => ['L2', 'L3', 'crisis'].includes(s.stage) || !!s.owner || (s.asks || []).some(a => !a.done);
const talkVis = t => { const s = SU(t.sid); if (isL1()) return t.by === me(); if (S.role === 'ADM' || S.role === 'L1s') return false; return t.center || t.share || inCenter(s); };
function addTalk(o) { const t = Object.assign({ id: 'tk' + (TALKS.length + 1), at: new Date(NOW), by: me() }, o); TALKS.push(t); const s = SU(t.sid);
  s.tl.push({ at: t.at, t: `辅导员谈心记录（${t.mode}）${t.center ? '，希望中心介入' : ''}`, who: ST(t.by).name, k: 'talk', tid: t.id }); return t; }
(() => { const fs = STU.filter(s => s.follower === 'u1' && s.stage === 'follow' && !s.owner), up = STU.find(s => s.stage === 'L2' && s.queue === 'up' && s.follower === 'u1'), plain = STU.find(s => s.college === '计算与数据科学学院' && s.stage === 'done' && s.follower !== 'u1') || STU.find(s => s.stage === 'done' && FOLLOWER_OF[s.college] === 'u1');
  const mk2 = (s, h, o) => { if (!s) return; const t = addTalk(Object.assign({ sid: s.id, by: 'u1' }, o)); t.at = ago(h); s.tl[s.tl.length - 1].at = ago(h); };
  mk2(fs[0], 24 * 8, { mode: '面谈', place: '学院辅导员办公室', points: '学生说期中前几周作业很多，作息有些乱，周末会和室友出去走走。上课出勤正常。', need: '希望能调整一门课的作业截止时间', next: '1 周后', nextAt: ago(24), from: '自发' });
  mk2(up, 50, { mode: '面谈', place: '学院辅导员办公室', points: '学生主动说起父亲上月住院，最近经常往返医院，两门课缺勤，说话时多次停顿、情绪低落。', need: '想先休息一段时间，不确定要不要请假', next: '1 周后', nextAt: later(24 * 5), center: true, from: '自发' });
  if (up) { up.src = `${up.src}；辅导员谈心后希望中心介入`; }
  mk2(plain, 24 * 3, { mode: '电话', place: '', points: '新生入学后的例行关心，学生说适应得还可以，已加入两个社团。', need: '', next: '不需要', from: '自发' });
  const chen = CORE.chen; if (chen) { chen.asks = chen.asks || []; chen.asks.push({ what: '请安排一次谈心', note: '想请你当面关心一下学生最近的学习和生活情况，不需要提心理中心的事', by: 'c1', at: ago(3), due: later(24), st: '', log: [], done: null }); log('请学院协助：请安排一次谈心（期限 明天）', chen, { k: 'ask' }); }
})();
const nextTalkH = { '1 周后': 168, '2 周后': 336, '1 个月后': 720 };
function talkTable(list, withStu = true) { if (!list.length) return `<div class="empty"><img src="${MASCOT}" alt="">还没有谈心记录</div>`;
  return `<table class="t"><tr><th>时间</th>${withStu ? '<th>学生</th>' : ''}<th>方式</th><th>谈话要点（事实）</th><th>学生表达的需要</th><th>下次</th><th>中心</th></tr>${list.slice().sort((a, b) => b.at - a.at).map(t => { const s = SU(t.sid);
    return `<tr><td>${fmt(t.at)}<small>${t.from === '中心请求' ? '中心请求' : '自发'} · ${ST(t.by).name}</small></td>${withStu ? `<td><b>${isL1() ? s.name : nm(s)}</b><small>${s.college} · ${s.year}</small></td>` : ''}<td>${t.mode}${t.place ? `<small>${esc(t.place)}</small>` : ''}</td><td style="max-width:340px">${esc(t.points)}</td><td>${esc(t.need) || '—'}</td><td>${t.next === '不需要' ? '—' : t.next}${t.nextAt ? `<small>${t.nextAt < NOW ? '<span class="due r">已到期</span>' : fmt(t.nextAt)}</small>` : ''}</td><td>${t.center ? '<span class="pill w">希望中心介入</span>' : t.share ? '<span class="pill">让中心知道</span>' : '<span class="note">仅学院</span>'}</td></tr>`; }).join('')}</table>`; }
const talkDue = (u = me()) => STU.filter(s => inScope(s, u) && TALKS.some(t => t.sid === s.id && t.by === u && t.nextAt && t.nextAt <= NOW && !TALKS.some(t2 => t2.sid === s.id && t2.at > t.at)));
function workPage() {
  const tab = S.tabs.work || 'talk', mine = TALKS.filter(t => t.by === me()), stuIn = STU.filter(s => inScope(s));
  const tabs = [['talk', `谈心记录（${mine.length}）`], ['stu', `我管理的学生（${stuIn.length}）`], ['promo', `中心发来的宣传素材（${PROMO.length}）`]];
  let b = '';
  if (tab === 'talk') { const due = talkDue();
    b = `${due.length ? `<div class="dbox" style="background:var(--warn-bg);border-color:#ecd2ad"><b>谈心到期（${due.length}）</b>${due.map(s => `<p style="display:flex;align-items:center;gap:8px;margin:6px 0 0">${s.name} · ${s.college}<span class="sp"></span><button class="btn pri xs" data-act="mo" data-arg="talk:${s.id}">写谈心记录</button></p>`).join('')}</div>` : ''}
      <div class="filters"><button class="btn pri xs" data-act="mo" data-arg="talkPick:">${I('plus', 's')}写谈心记录</button><span style="flex:1"></span><button class="btn sec xs" data-act="mo" data-arg="talkExport:">${I('dl', 's')}导出</button><button class="btn ghost xs" disabled title="上线时对接学院原有系统">同步到学院系统 · 未接入</button></div>${talkTable(mine)}
      <p class="note">谈心记录只写事实，不写判断。中心能看到的：已在中心流程里的学生（复核、预约、随访、协助中）的记录，以及你勾选了「希望中心介入」或「让中心知道」的记录；其余只留在学院这边。学生和系统管理员看不到。</p>`; }
  if (tab === 'stu') { const q = (S.f.wq || '').trim(); let L = stuIn.filter(s => !q || s.name.includes(q) || s.sid.includes(q)); const per = 15, pages = Math.max(1, Math.ceil(L.length / per)), pg = Math.min(S.wpg || 1, pages);
    b = `<div class="filters"><input class="in" style="width:220px" data-bind="f.wq" data-rerender placeholder="搜索姓名或学号" value="${esc(q)}"><span class="note">${L.length} 人</span></div>
      <table class="t"><tr><th>学生</th><th>学院 · 年级</th><th>谈心次数</th><th>上次谈心</th><th>下次谈心</th><th></th></tr>${L.slice((pg - 1) * per, pg * per).map(s => { const ts = TALKS.filter(t => t.sid === s.id && t.by === me()).sort((a, b) => b.at - a.at), lt = ts[0];
        return `<tr><td><b>${s.name}</b><small>${s.sid}</small></td><td>${s.college} · ${s.year}</td><td>${ts.length}</td><td>${lt ? fmt(lt.at) : '—'}</td><td>${lt && lt.nextAt ? (lt.nextAt < NOW ? '<span class="due r">已到期</span>' : fmt(lt.nextAt)) : '—'}</td><td>${ts.length ? `<button class="btn ghost xs" data-act="mo" data-arg="talkHist:${s.id}">记录</button> ` : ''}<button class="btn sec xs" data-act="mo" data-arg="talk:${s.id}">写谈心记录</button></td></tr>`; }).join('')}</table>
      <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:8px">${Array.from({ length: pages }, (_, i) => `<button class="btn ${pg === i + 1 ? 'pri' : 'sec'} xs" data-act="wpg" data-arg="${i + 1}">${i + 1}</button>`).join('')}</div>
      <p class="note">这里只有身份信息，没有任何心理评估内容。</p>`; }
  if (tab === 'promo') b = PROMO.length ? PROMO.map(x => { const p = planOf(x.pid); return `<div class="dbox" style="background:#fff"><b>${p.name}<span class="sp"></span><small class="note">${fmt(x.at)} 由 ${ST(p.owner).name} 发来 · ${x.wave}</small></b>
      <div class="sms" style="margin:8px 0">${esc(packText(p))}</div><div style="display:flex;gap:8px"><button class="btn sec xs" data-act="copyPack" data-arg="${p.id}">复制转发文案</button><button class="btn sec xs" data-act="qrDl" data-arg="${p.id}">${I('dl', 's')}下载二维码</button>${p.ch && p.ch.poster && p.ch.poster.on ? `<button class="btn sec xs" data-act="posterDl" data-arg="${p.id}">${I('dl', 's')}下载海报</button>` : ''}</div></div>`; }).join('') : `<div class="empty"><img src="${MASCOT}" alt="">中心还没有发来宣传素材</div>`;
  return `<div class="card"><h3>${I('users')}学生工作<span class="sp"></span><small>你的管理范围：${scopeTxt()} · 由系统管理员配置</small></h3>
    <div class="tabs">${tabs.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-act="wtab" data-arg="${k}">${n}</button>`).join('')}</div>${b}</div>
    <div class="card"><h3>${I('info')}和心理中心相关的其他工作<span class="sp"></span></h3><p class="note" style="margin:0">核实、随访、中心请求的协助都在「工作台」；遇到紧急情况，用右上角「求助 / 报告」。</p></div>`;
}
const packText = p => `各位同学好：学校「${p.name}」已开放，约 15 分钟，请在 ${p.due} 前完成。用手机扫二维码或点链接，用 NTU 账号登录即可参与。结果只用于为大家提供支持，不会出现在任何成绩或档案中。lingyu.ntu.edu.sg/s/${p.id}`;
const PROMO = [{ pid: 't1', at: ago(24 * 6), wave: '第 1 波' }];

/* ---------- 接入：菜单、页面、队列、简报、抽屉、弹窗、设置 ---------- */
MENUS.L1.push(['work', '学生工作', 'edit']); TITLES.work = '学生工作'; PAGES.work = workPage;
const _q12 = queues; queues = function (u = me(), r = S.role) { const q = _q12(u, r); if (r === 'L1') q.push({ k: 'talks', n: '谈心到期', items: talkDue(u) }); return q; };
const _qb12 = queueBody; queueBody = function (q) { if (q.k !== 'talks') return _qb12(q); if (!q.items.length) return `<div class="empty"><img src="${MASCOT}" alt="">这一项都处理完了</div>`;
  return `<table class="t"><tr><th>学生</th><th>学院 · 年级</th><th>上次谈心</th><th>约定的下次</th><th></th></tr>${q.items.map(s => { const lt = TALKS.filter(t => t.sid === s.id && t.by === me()).sort((a, b) => b.at - a.at)[0]; return `<tr><td><b>${s.name}</b></td><td>${s.college} · ${s.year}</td><td>${fmt(lt.at)} · ${lt.mode}</td><td><span class="due r">${fmt(lt.nextAt)}</span></td><td><button class="btn pri xs" data-act="mo" data-arg="talk:${s.id}">写谈心记录</button></td></tr>`; }).join('')}</table>`; };
const _bL1 = briefL1; briefL1 = function () { const b = _bL1(), due = talkDue();
  if (due.length) b.secs.splice(b.secs[0] && b.secs[0].red ? 1 : 0, 0, { t: `谈心到期（${due.length}）`, all: 1, items: due.map(s => it(`${s.name} · 约定的下次谈心到了`, 'mo', `talk:${s.id}`, '写谈心记录')) });
  if (PROMO.length && S.role === 'L1') b.secs.push({ t: `中心发来的宣传素材（${PROMO.length}）`, items: PROMO.map(x => it(`「${planOf(x.pid).name}」${x.wave}：转发文案、二维码${planOf(x.pid).ch.poster.on ? '、海报' : ''}`, 'wtabGo', 'promo', '查看')) });
  return b; };
const _bL2 = briefL2; briefL2 = function () { const b = _bL2(), nw = BOOK.filter(x => x.cid === me() && ikOf(x) && ikOf(x).st === 'sent' && !ikOf(x).viewed && ['confirm', 'ok', 'change'].includes(x.st));
  if (nw.length) b.secs.splice(1, 0, { t: `新的预咨询摘要（${nw.length}）`, all: 1, items: nw.map(x => it(`${nm(SU(x.sid))} · ${slotTxt(x)} 的预咨询 · 学生想聊：${ikTopicsTxt(ikOf(x))}`, 'mo', `intake:${x.id}`, '查看')) });
  return b; };
const _dw12 = drawer; drawer = function () { const s = SU(S.dw.sid), keep = s.tl; s.tl = s.tl.filter(e => e.k !== 'talk' || talkVis(TALKS.find(t => t.id === e.tid)));
  let h; try { h = _dw12(); } finally { s.tl = keep; }
  const vis = TALKS.filter(t => t.sid === s.id && talkVis(t)), ab = BOOK.find(b => b.sid === s.id && ['confirm', 'ok', 'change', 'record', 'pool'].includes(b.st) && ikOf(b) && ikOf(b).sum);
  let extra = ''; if (isCenter() && ab) { extra += intakeBox(ab); markViewed(ab); }
  if (vis.length && S.role !== 'ADM') extra += `<div class="dbox" style="background:#fff"><b>${I('chat', 's')}辅导员谈心记录（${vis.length}）</b>${talkTable(vis, false)}</div>`;
  if (isL1() && S.role === 'L1' && inScope(s)) h = h.replace(/(<div class="acts"><small>[^<]*<\/small>)/, `$1<button class="btn sec xs" data-act="mo" data-arg="talk:${s.id}">写谈心记录</button>`);
  if (extra) h = h.replace(/(<div class="db"><div class="tabs">[\s\S]*?<\/div>)/, `$1${extra}`);
  return h; };
const _md12 = modal; modal = function () {
  const [k, id] = S.mo.split(':'), F = S.form;
  const box = (h, p, body, ok, act, arg, wide) => `<div class="ov" data-act="ovClose"><div class="mo ${wide ? 'wide' : ''}"><h3>${h}</h3>${p ? `<p>${p}</p>` : ''}${body}<div class="acts"><button class="btn sec" data-act="moClose">${ok ? '取消' : '关闭'}</button>${ok ? `<button class="btn pri" data-act="${act}" data-arg="${arg ?? id}">${ok}</button>` : ''}</div></div></div>`;
  if (k === 'intake') { const b = BOOK.find(x => x.id === id); markViewed(b); return box(`预咨询摘要 · ${nm(SU(b.sid))}`, `${b.kind} · ${slotTxt(b)} · ${ST(b.cid).name}`, intakeBox(b, 1), '', '', '', 1); }
  if (k === 'askDone') { const s = SU(id), a = openAsk(s); if (a && a.what === '请安排一次谈心') { S.mo = `talk:${id}`; S.form = { fromAsk: 1 }; return modal(); } }
  if (k === 'talkPick') { const L = STU.filter(s => inScope(s)).filter(s => !F.q || s.name.includes(F.q) || s.sid.includes(F.q)).slice(0, 8);
    return box('写谈心记录 · 选择学生', `你的管理范围：${scopeTxt()}`, `<input class="in" style="width:100%" data-bind="form.q" placeholder="输入姓名或学号" value="${esc(F.q || '')}" oninput="clearTimeout(window._tq);window._tq=setTimeout(()=>{render();const i=document.querySelector('[data-bind=\\'form.q\\']');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},250)">
      <table class="t" style="margin-top:8px">${L.map(s => `<tr><td>${s.name}<small>${s.sid}</small></td><td>${s.college} · ${s.year}</td><td><button class="btn sec xs" data-act="mo" data-arg="talk:${s.id}">选择</button></td></tr>`).join('')}</table>`, ''); }
  if (k === 'talk') { const s = SU(id), a = openAsk(s), fromAsk = a && a.what === '请安排一次谈心';
    const tg = (key, txt) => `<label class="ckl"><input type="checkbox" ${F[key] ? 'checked' : ''} data-act="tkT" data-arg="${key}"> ${txt}</label>`;
    return box(`谈心记录 · ${s.name}`, `${s.college} · ${s.year}${fromAsk ? ` · <span class="pill w">中心请求：${ST(a.by).name}（期限 ${fmt(a.due)}）</span>` : ''}`,
      `${fromAsk && a.note ? `<p class="note" style="margin-top:-4px">中心的说明：${esc(a.note)}</p>` : ''}${fld('什么时候', opts('when', ['今天', '昨天', '前天']))}${fld('方式', opts('mode', ['面谈', '电话', '线上']))}${fld('地点（选填）', `<input class="in" style="width:100%" data-bind="form.place" value="${esc(F.place || '')}" placeholder="例如：学院辅导员办公室">`)}
      ${fld('谈话要点（只写事实，不写判断）', ta('points', '例如：学生说最近两周经常熬夜赶作业，缺了两次早课'))}${fld('学生表达的需要（选填）', ta('need', '例如：希望延期提交一份作业'))}${fld('下次谈心', opts('next', ['1 周后', '2 周后', '1 个月后', '不需要']))}
      ${tg('center', '希望心理中心介入（学生会交给咨询师）')}${tg('share', '让中心知道这条记录（不转交）')}<p class="note">听到学生的安全表达，请不要只写记录，用右上角「求助 / 报告」报告紧急情况。</p>`, '保存', 'talkGo', id, 1); }
  if (k === 'talkHist') { const s = SU(id); return box(`谈心记录 · ${s.name}`, `${s.college} · ${s.year}`, talkTable(TALKS.filter(t => t.sid === id && t.by === me()), false), '', '', '', 1); }
  if (k === 'talkExport') return box('导出谈心记录', '导出的文件只含谈心记录和学生身份信息，不含任何心理评估内容；每次导出都记入操作记录。', fld('范围', opts('rng', ['我写的', '我管理范围内的全部'])) + fld('时间', opts('per', ['近 30 天', '本学期', '全部'])) + '<p class="note">字段：时间、学生姓名、学号、学院、方式、地点、谈话要点、学生的需要、下次谈心、是否希望中心介入。</p>', '导出 CSV', 'talkExpGo', '');
  if (k === 'remind') { const n = k === 'remind' && id === 'sel' ? Object.values(S.rsel || {}).filter(Boolean).length : remindList().length;
    return box(`再提醒一次 · ${n} 人`, '每人每天最多提醒一次；今天已提醒过的会自动跳过。', fld('用哪个渠道提醒', opts('ch', ['短信', '学校邮箱', '学生端首页', '辅导员转发包'])), '发送提醒', 'remindGo', id); }
  if (k === 'poster') { const P = posterOf(id), cv = drawPoster(P, 300);
    return box('宣传海报', '全校统一一张。选模板或上传底图，改好文字后下载；随辅导员转发包一起发出。', `<div class="poster"><img src="${cv.toDataURL()}" alt="海报预览"><div class="pform">
      ${fld('模板', `<div class="opts">${POSTER_TPL.map((t, i) => `<button class="${P.tpl === i && !P.bg ? 'on' : ''}" data-act="pTpl" data-arg="${id}|${i}"><i class="sw2" style="background:linear-gradient(${t[1]},${t[2]})"></i>${t[0]}</button>`).join('')}</div>`)}
      ${fld('换底图（可选）', `<input type="file" accept="image/*" data-pid="${id}" class="pbg">${P.bg ? ` <button class="lnk" data-act="pBgClr" data-arg="${id}">恢复模板底图</button>` : ''}`)}
      ${['title|主标题', 'sub|副标题', 'due|截止', 'contact|联系方式'].map(x => { const [f, n] = x.split('|'); return fld(n, `<input class="in" style="width:100%" data-pbind="${id}|${f}" value="${esc(P[f])}">`); }).join('')}</div></div>`, '下载海报 PNG', 'posterDl', id, 1); }
  if (k === 'mailPrev') { const p = planOf(id); return box('邮件预览', '发件人：NTU University Counselling Centre &lt;ucc@ntu.edu.sg&gt;（示意）', `<div class="sms" style="white-space:pre-line">主题：${p.name} 已开放（约 15 分钟）\n\n同学你好：\n\n${p.name}已开放，请在 ${p.due} 前完成。点击下方链接，用 NTU 账号登录即可开始。\n\n结果只用于为你提供支持，不会出现在任何成绩或档案中。如有疑问，请联系大学心理咨询中心。\n\n[ 开始 ] lingyu.ntu.edu.sg/s/${p.id}</div>`, ''); }
  if (k === 'packPrev') { const p = planOf(id); return box('辅导员转发包', '会发到各学院辅导员的「学生工作 · 宣传素材」，并短信提醒。', `<div class="sms">${esc(packText(p))}</div><p class="note">附件：二维码（PNG）${p.ch && p.ch.poster && p.ch.poster.on ? '、宣传海报（PNG）' : ''}。</p>`, ''); }
  return _md12(); };
function remindList() { const f = S.f; return PENDING.filter(x => (!f.rst || (x.st === '未开始' ? '未打开' : '已打开未完成') === f.rst) && (!f.rcol || x.college === f.rcol) && (!f.rch || x.via === f.rch)); }
const _st12 = settings; settings = function () { let h = _st12(); const tab = S.tabs.settings || 'tiers', ed = isAdm();
  if (false && h.includes('class="rules"') && h.includes('多久随访一次')) h = h.replace('<div class="grid g3" style="margin-top:16px">', `<div class="rule" style="margin-top:12px;border:1px solid var(--line2);border-radius:12px;padding:12px 14px"><span class="lv"><img src="${MASCOT_IK}" alt="" style="width:26px;height:26px;border-radius:8px;vertical-align:middle;margin-right:6px">预咨询小屿</span><p>学生<b>第一次预约</b>时，预咨询小屿用约 3 分钟帮他整理想聊的内容，学生确认后发给接待老师。放在哪一步：<select data-bind="intakeMode" data-rerender ${ed ? '' : 'disabled'}>${Object.entries(IKM).map(([v, n]) => `<option value="${v}" ${RULES.intakeMode === v ? 'selected' : ''}>${n}</option>`).join('')}</select></p>
    <table class="t" style="margin-top:6px"><tr><th>选项</th><th>好处</th><th>风险</th></tr><tr class="${RULES.intakeMode === 'A' ? 'sel' : ''}"><td>A · 预约申请提交后</td><td>时段先锁住，不会被抢；不给求助增加门槛</td><td>学生可能跳过不聊，老师拿不到摘要</td></tr><tr class="${RULES.intakeMode === 'B' ? 'sel' : ''}"><td>B · 选好时段后、提交前</td><td>聊完才提交，摘要齐全；时段暂留 15 分钟，不会被抢</td><td>多一步，可能有学生聊到一半放弃；15 分钟后时段释放</td></tr><tr class="${RULES.intakeMode === 'C' ? 'sel' : ''}"><td>C · 关闭</td><td>流程最短</td><td>老师见面前对学生想聊什么一无所知</td></tr></table>
    <p class="note">任何一种都可以跳过；对话里出现危机表达照危机流程处理。名单外或普测超过 3 个月的学生，另加 4 题简表：${`<select data-bind="intakeBrief" data-rerender ${ed ? '' : 'disabled'}>${['关闭', '开启'].map(v => `<option ${RULES.intakeBrief === v ? 'selected' : ''}>${v}</option>`).join('')}</select>`}（默认关闭）。</p></div><div class="grid g3" style="margin-top:16px">`);
  if (tab === 'map' && ed) h = h.replace(/(<div style="margin-top:10px"><button class="btn sec xs" data-act="mo" data-arg="import:map">)/, `<div class="card" style="margin-top:14px"><h3>辅导员的管理范围<span class="sp"></span><small>决定「学生工作」里谁能写、能看谁的谈心记录</small></h3>
    <p style="font-size:13.5px">辅导员可以管理：<select data-bind="l1Scope" data-rerender>${['本学院', '仅自己跟进的学生', '指定学院'].map(v => `<option ${RULES.l1Scope === v ? 'selected' : ''}>${v}${v === '本学院' ? '（默认）' : ''}</option>`).join('')}</select></p>
    ${RULES.l1Scope === '指定学院' ? `<table class="t">${['u1', 'u2'].map(u => `<tr><td style="width:100px">${ST(u).name}</td><td><div class="opts">${COLLEGES.map(c => `<button class="${RULES.l1Cols[u].includes(c) ? 'on' : ''}" data-act="l1Col" data-arg="${u}|${c}">${c}</button>`).join('')}</div></td></tr>`).join('')}</table>` : ''}
    <p class="note">不管范围多大，辅导员都只看到关注等级，看不到分数、报告和对话。</p></div>$1`);
  return h; };
PAGES.settings = settings;
const _wz12 = wizard; wizard = function () { const w = S.wiz; w.ch = w.ch || defCh(); w.poster = w.poster || defPoster(w); let h = _wz12();
  if (w.step === 2) h = h.replace('<p class="note">每一波发布前都会做产能检查', `${fld('触达方式（可多选；每种方式单独设置发送时间）', `<table class="t chtab">${CH.map(([k, n, d, send]) => { const c = w.ch[k] = w.ch[k] || { on: 0, when: WHEN[0] };
      return `<tr class="${c.on ? 'sel' : ''}"><td style="width:36px"><input type="checkbox" ${c.on ? 'checked' : ''} data-act="wzCh" data-arg="${k}"></td><td><b>${n}</b><small>${d}</small></td><td style="text-align:right">${!c.on ? '' : send ? `<select data-bind="wiz.ch.${k}.when" data-rerender>${WHEN.map(x => `<option ${c.when === x ? 'selected' : ''}>${x}</option>`).join('')}</select>${c.when === '定时发' ? ` <input class="in" style="width:120px" data-bind="wiz.ch.${k}.at" value="${esc(c.at || '10/26 09:00')}">` : ''}` : k === 'poster' ? `<button class="btn sec xs" data-act="mo" data-arg="poster:wiz">设计海报（${POSTER_TPL[w.poster.tpl][0]}）</button>` : `<button class="btn ghost xs" data-act="qrDl" data-arg="wiz">预览二维码</button>`}</td></tr>`; }).join('')}</table>`)}
    <p class="note">截止前 1 天，系统会用短信自动再提醒一次还没完成的人；发布后在方案详情的「触达与催办」里看每个渠道的打开和完成情况，还可以手动再提醒。</p><p class="note">每一波发布前都会做产能检查`);
  if (w.step === 3) h = h.replace('<h4 style="margin-top:16px">学生会收到的短信</h4>', `<h4 style="margin-top:16px">触达方式</h4><table class="t">${CH.filter(([k]) => w.ch[k] && w.ch[k].on).map(([k, n]) => `<tr><td>${n}</td><td>${w.ch[k].when ? w.ch[k].when + (w.ch[k].when === '定时发' ? ' · ' + (w.ch[k].at || '10/26 09:00') : '') : k === 'poster' ? `模板：${POSTER_TPL[w.poster.tpl][0]}${w.poster.bg ? '（自定义底图）' : ''}` : '发布后可下载'}</td></tr>`).join('') || '<tr><td class="note">没有选择触达方式</td></tr>'}</table><h4 style="margin-top:16px">学生会收到的短信</h4>`);
  return h; };
const _pr12 = planRun; planRun = function (p) { return _pr12(p).replace(/<\/div>$/, `<h4 style="margin:18px 0 8px">触达与催办</h4>${reachPanel(p)}</div>`); };
const _pub12 = ACT.pubOk;
Object.assign(ACT, {
  wtab(k) { S.tabs.work = k; }, wtabGo(k) { go('work'); S.tabs.work = k; }, wpg(n) { S.wpg = +n; }, rpg(n) { S.rpg = +n; },
  rsel(i) { S.rsel = S.rsel || {}; S.rsel[i] = !S.rsel[i]; },
  tkT(k) { S.form[k] = !S.form[k]; },
  talkGo(id) { const s = SU(id), F = S.form; if (!F.mode) return toast('请选择谈心方式'); if (!(F.points || '').trim()) return toast('请写下谈话要点'); if (!F.next) return toast('请选择下次谈心时间');
    const a = openAsk(s), fromAsk = a && a.what === '请安排一次谈心', at = later(-24 * ({ 今天: 0, 昨天: 1, 前天: 2 }[F.when || '今天']));
    const t = addTalk({ sid: id, mode: F.mode, place: F.place || '', points: F.points.trim(), need: (F.need || '').trim(), next: F.next, nextAt: nextTalkH[F.next] ? later(nextTalkH[F.next]) : null, center: !!F.center, share: !!F.share, from: fromAsk ? '中心请求' : '自发' }); t.at = at;
    log(`写谈心记录（${F.mode}）${F.center ? '，希望中心介入' : F.share ? '，让中心知道' : ''}`, s, { k: 'talkLog', noTl: 1 });
    if (fromAsk) { a.st = '完成'; a.log.push({ at: new Date(NOW), st: '完成', note: '已谈心，见谈心记录' }); a.done = { at: new Date(NOW), note: '已谈心' }; notify(a.by, '站内', `${ST(me()).name} 已完成谈心：${nm(s)}${F.center ? '，希望中心介入' : ''}`, s.id); }
    if (F.center) { if (s.stage === 'crisis') notify('c5', '站内', `${ST(me()).name} 谈心后补充了情况：${nm(s)}`, s.id);
      else if (['L2', 'L3'].includes(s.stage)) notify(s.stage === 'L2' ? s.assignee : 'c5', '站内', `${ST(me()).name} 谈心后希望中心介入：${nm(s)}`, s.id);
      else { move(s, 'L2', 'up', { assignee: s.owner || l2For(s), src: `辅导员谈心后希望中心介入${t.need ? '：' + t.need : ''}` }); notify(s.assignee, '站内', `${ST(me()).name} 谈心后交给你 1 位学生`, s.id); } }
    else if (F.share && inCenter(s)) notify(s.assignee || s.owner || 'c5', '站内', `${ST(me()).name} 让中心知道一条谈心记录：${nm(s)}`, s.id);
    S.mo = null; toast(F.center ? '已保存，并交给咨询师' : fromAsk ? '已保存，并回复了中心的请求' : '已保存谈心记录'); },
  talkExpGo() { const F = S.form, per = { '近 30 天': 30, 本学期: 120, 全部: 9999 }[F.per || '近 30 天'], L = TALKS.filter(t => (F.rng === '我管理范围内的全部' ? inScope(SU(t.sid)) : t.by === me()) && (NOW - t.at) / 864e5 <= per);
    const cols = ['时间', '学生姓名', '学号', '学院', '方式', '地点', '谈话要点', '学生的需要', '下次谈心', '希望中心介入'], q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = '﻿' + [cols.join(',')].concat(L.map(t => { const s = SU(t.sid); return [fmt(t.at), s.name, s.sid, s.college, t.mode, t.place, t.points, t.need, t.next, t.center ? '是' : '否'].map(q).join(','); })).join('\n');
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `谈心记录-${ST(me()).name}.csv`; a.click(); } catch (e) {}
    log(`导出谈心记录 ${L.length} 条（${F.rng || '我写的'}，${F.per || '近 30 天'}）`, null, { cat: '导出', obj: '谈心记录' }); S.mo = null; toast(`已导出 ${L.length} 条，已记入操作记录`); },
  remindGo(id) { const F = S.form; if (!F.ch) return toast('请选择渠道'); const L = id === 'sel' ? PENDING.filter((x, i) => (S.rsel || {})[i]) : remindList(); let n = 0, skip = 0;
    L.forEach(x => { if (isToday(x.remAt)) { skip++; return; } x.rem++; x.remAt = new Date(NOW); x.remCh = { 短信: 'sms', 学校邮箱: 'mail', 学生端首页: 'home', 辅导员转发包: 'pack' }[F.ch]; n++; });
    if (F.ch === '辅导员转发包') { const by = {}; L.forEach(x => by[FOLLOWER_OF[x.college]] = (by[FOLLOWER_OF[x.college]] || 0) + 1); Object.entries(by).forEach(([u, c]) => notify(u, '站内 + 短信', `中心请你提醒学院里 ${c} 位还没完成普测的同学`, null)); }
    log(`再提醒未完成的学生：${n} 人（${F.ch}）${skip ? `，${skip} 人今天已提醒过，跳过` : ''}`, null, { cat: '流转', obj: '施测方案' }); S.rsel = {}; S.mo = null; toast(`已提醒 ${n} 人${skip ? `；${skip} 人今天已提醒过，跳过` : ''}`); },
  wzCh(k) { const c = S.wiz.ch[k]; c.on = c.on ? 0 : 1; if (!c.when && !['qr', 'poster'].includes(k)) c.when = WHEN[0]; },
  pTpl(a) { const [id, i] = a.split('|'), P = posterOf(id); P.tpl = +i; P.bg = null; },
  pBgClr(id) { posterOf(id).bg = null; },
  posterDl(id) { const P = posterOf(id), cv = drawPoster(P, 900); try { const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = '灵屿-宣传海报.png'; a.click(); } catch (e) {} if (id !== 'wiz') log(`下载宣传海报（${POSTER_TPL[P.tpl][0]}）`, null, { cat: '配置', obj: '施测方案' }); toast('已下载海报'); },
  qrDl(id) { const cv = document.createElement('canvas'); cv.width = cv.height = 360; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 360, 360); fakeQR(x, 40, 40, 280, 7); try { const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = '灵屿-普测二维码.png'; a.click(); } catch (e) {} toast('已下载二维码（示意）'); },
  copyPack(id) { try { navigator.clipboard && navigator.clipboard.writeText(packText(planOf(id))).catch(() => {}); } catch (e) {} toast('已复制转发文案'); },
  l1Col(a) { const [u, c] = a.split('|'), L = RULES.l1Cols[u]; RULES.l1Cols[u] = L.includes(c) ? L.filter(x => x !== c) : [...L, c]; log(`辅导员管理范围 · ${ST(u).name}：${RULES.l1Cols[u].join('、') || '无'}`, null, { cat: '配置', obj: '角色与权限' }); },
  pubOk() { const w = S.wiz; _pub12(); if (!S.wiz && w && w.ch && w.ch.pack && w.ch.pack.on) { const p = PLANS[PLANS.length - 1].name === w.name ? PLANS[PLANS.length - 1] : PLANS.find(x => x.name === w.name); if (p) { PROMO.unshift({ pid: p.id, at: new Date(NOW), wave: w.waveBy.length ? '第 1 波' : '全部' }); ['u1', 'u2'].forEach(u => notify(u, '站内 + 短信', `中心发来「${p.name}」的宣传素材，请转发给学生`, null)); } } },
});
document.addEventListener('input', e => { const b = e.target.dataset.bind, pb = e.target.dataset.pbind, v = e.target.value;
  if (pb) { const [id, f] = pb.split('|'); posterOf(id)[f] = v; clearTimeout(window._pt); window._pt = setTimeout(() => { const i = document.querySelector('.poster img'); if (i) i.src = drawPoster(posterOf(id), 300).toDataURL(); }, 200); return; }
  if (b === 'intakeMode' || b === 'intakeBrief' || b === 'l1Scope') { const was = RULES[b]; RULES[b] = v; const n = { intakeMode: '预咨询小屿的位置', intakeBrief: '预咨询 4 题简表', l1Scope: '辅导员管理范围' }[b];
    log(`${b === 'l1Scope' ? '角色与权限' : '分层规则'} · ${n}：${b === 'intakeMode' ? IKM[was] : was} → ${b === 'intakeMode' ? IKM[v] : v}`, null, { cat: '配置', obj: b === 'l1Scope' ? '角色与权限' : '分层规则' }); toast(`已生效：${n} → ${b === 'intakeMode' ? IKM[v] : v}，已记入操作记录`); render(); } });
document.addEventListener('change', e => { if (!e.target.classList.contains('pbg')) return; const f = e.target.files && e.target.files[0], id = e.target.dataset.pid; if (!f) return; const r = new FileReader(); r.onload = () => { posterOf(id).bg = r.result; render(); }; r.readAsDataURL(f); });
/* 施测方案 t1：新增「触达与催办」标签（默认） */
const _sv12 = surveyT1; surveyT1 = function () { const tab = S.tabs.survey || 'reach'; S.tabs.survey = tab === 'reach' ? 'cfg' : tab; let h; try { h = _sv12(); } finally { S.tabs.survey = tab; }
  h = h.replace('<div class="card"><div class="tabs">', `<div class="card"><div class="tabs"><button class="${tab === 'reach' ? 'on' : ''}" data-act="svtab" data-arg="reach">触达与催办</button>`);
  if (tab === 'reach') { h = h.replace('class="on" data-act="svtab" data-arg="cfg"', 'class="" data-act="svtab" data-arg="cfg"'); h = h.replace(/<div class="kv"><span>量表顺序[\s\S]*$/, `${reachPanel(planOf('t1'))}</div>`); }
  return h; };
/* 合并试用版联动：学生端发来预咨询摘要；把「已查看」和学校设置的位置传回学生端 */
if (typeof LY_in === 'function') {
  const _lyIn12 = LY_in; LY_in = function (ev) { if (ev.t === 'book') { const r = _lyIn12(ev), s = LY_CORE()[ev.core], b = s && lyBook(s); if (b) b.intake = { st: 'none', ver: 0 }; return r; } if (ev.t !== 'intake') return _lyIn12(ev);
    const s = LY_CORE()[ev.core], b = s && lyBook(s), x = ev.intake; if (!b || !x) return '';
    const old = b.intake || {}, add = old.st === 'sent' && x.st === 'sent';
    b.intake = { st: x.st, at: new Date(NOW), ver: x.ver, viewed: false, mode: x.mode, crisis: x.crisis, sum: x.sum };
    const what = { sent: add ? '修改或补充了预咨询摘要' : '发送了预咨询摘要', draft: '保存了预咨询摘要（未发送）', skipped: '跳过了预咨询小屿' }[x.st] || '';
    if (!what) return ''; log(`学生在学生端${what}`, s, { cat: '预约', k: 'book', sys: 1 });
    if (x.st === 'sent') notify(b.cid, '站内', `${nm(s)} ${what}：${slotTxt(b)} 的预咨询`, b.id);
    if (S.uid) render(); return `${s.name} ${what}${x.st === 'sent' ? `，${ST(b.cid).name} 在预约列表和档案里能看到` : ''}`; };
  const _lySnap12 = LY_snap; LY_snap = function () { const o = _lySnap12(); Object.entries(LY_CORE()).forEach(([k, s]) => { const b = lyBook(s); if (o[k] && b) o[k].iv = !!(b.intake && b.intake.viewed); }); o.__cfg = { intakeMode: RULES.intakeMode }; return o; };
}
/* 演示备忘录（v1.12 新增部分） */
setTimeout(() => { try {
  const add = (r, p, arr) => { MEMO[r] = MEMO[r] || {}; MEMO[r][p] = (MEMO[r][p] || []).concat(arr); };
  add('L1', 'work', ['v1.12 新增「学生工作」：谈心记录、我管理的学生、中心发来的宣传素材。', '谈心记录只写事实。勾「希望心理中心介入」，学生会进入咨询师的待复核；勾「让中心知道」只通知、不转交。', '中心可以通过「请学院协助 → 请安排一次谈心」发起（陈嘉怡就是一例），写完谈心记录，这条请求自动完成。', '管理范围由系统管理员在「设置 → 辅导员分管」里配置，默认本学院。', '导出 CSV 会记入操作记录；「同步到学院系统」上线时再对接。']);
  ['L2', 'L3'].forEach(r => add(r, 'booking', ['v1.12：学生第一次预约时，预咨询小屿会帮他整理想聊的内容，学生确认后发给接待老师。预约列表里点「预咨询摘要」查看（李文的陈嘉怡就有一份；林晓跳过了）。辅导员看不到摘要。']));
  add('L3', 'survey', ['v1.12：方案可以勾选多种触达方式（短信、学校邮箱、辅导员转发包、学生端首页、二维码、海报），每种单独设置发送时间。', '「触达与催办」里按渠道看打开和完成，还没完成的人可以再提醒一次（每人每天最多一次，记入操作记录）。', '海报全校统一一张，5 个模板，可以换底图，下载后随辅导员转发包发出。']);
  add('ADM', 'settings', ['v1.12：「流转规则」里可以设置预咨询小屿放在哪一步（提交后 / 提交前 / 关闭），并列出各自的好处和风险；「辅导员分管」里可以配置辅导员的管理范围。']);
  add('L3', 'settings', ['v1.12：「流转规则」里可以设置预咨询小屿放在哪一步；「辅导员分管」里可以配置辅导员的管理范围。']);
} catch (e) {} }, 0);
