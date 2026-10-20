/* =====================================================================
   v1.10 · 清爽：必须处理的默认展开，其余默认收起；「一键展开全部」全局切换
===================================================================== */
const _ov110 = overview, _team110 = team;
const foldCard = (key, icon, title, sum, full) => (S.full || (S.cx || {})[key]) ? full.replace('</h3>', `${S.full ? '' : ` <button class="lnk" data-act="cx" data-arg="${key}">收起</button>`}</h3>`)
  : `<div class="card fold"><h3>${I(icon)}${title}<span class="sp"></span><small>${sum}</small><button class="btn ghost xs" data-act="cx" data-arg="${key}">展开</button></h3></div>`;
overview = function () { const rows = OVROWS(), od = rows.reduce((a, r) => a + (+r[3] || 0), 0);
  return foldCard('ov', 'layers', '分层概览', `各层合计逾期 ${od} 项${od ? ' · 展开看在哪一层' : ''}`, _ov110()); };
team = function () { const ppl = [['u1', 'L1'], ['u2', 'L1'], ['u3', 'L1s'], ['c1', 'L2'], ['c2', 'L2'], ['c3', 'L2'], ['c4', 'L3']].map(([c, r]) => [c, queues(c, r).flatMap(q => q.items || []).filter(s => overdue(s) || fOver(s)).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
  return foldCard('team', 'users', '团队进展', ppl.length ? `有超时：${ppl.map(([c, n]) => `${ST(c).name} ${n}`).join('、')}` : '没有人超时', _team110()); };
Object.assign(ACT, { fullT() { S.full = !S.full; }, dmore() { S.dmore = !S.dmore; }, cx(k) { S.cx = S.cx || {}; S.cx[k] = !S.cx[k]; } });
