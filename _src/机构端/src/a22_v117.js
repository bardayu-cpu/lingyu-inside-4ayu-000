/* =====================================================================
   v1.17 · v1.16 三份审查（Sonnet 15、GPT 20、实操 7）的修复和界面优化
   · 谈心页右侧直接显示他人记录摘要也记查看审计（GPT 9）
   · 学生累计未回应次数和明细（实操缺失项）
   · 已有在途邀约时「发邀约」直接说明，不再卡住（Q01）
===================================================================== */
/* 打开一个学生时，右侧会显示别人写的记录摘要：每人每个学生记一次查看 */
const seeOthers = (s, recs) => { const o = recs.filter(t => !t.draft && !recOwner(t) && recVis(t)); if (!o.length) return; S.seen = S.seen || {}; const k = me() + '~' + s.id; if (S.seen[k]) return; S.seen[k] = 1;
  log(`查看谈话记录摘要（${o.map(tkId).join('、')}）`, s, { cat: '查看', noTl: 1, obj: '谈话记录' }); };

const _md17 = modal; modal = function () { const [k, id] = (S.mo || '').split(':');
  if (k === 'tkMiss') { const s = SU(id), L = missLog(s), n = L.length;
    return mbox(`连续未回应 · ${s.name}`, `连续 ${n} 次没约上。满 2 次会自动转给中心（老师取消、危机期间错过的不算）。${XF.some(x => x.sid === s.id && x.type === 'lost' && x.st !== 'closed') ? '<b>已经转给中心。</b>' : ''}`,
      n ? `<table class="t dense"><tr><th>时间</th><th>情况</th><th>对应</th></tr>${L.map(e => `<tr><td>${fmt(e.at)}</td><td>${esc(e.why)}</td><td>${e.inv ? '邀约' : ''}${e.rec ? `${e.inv ? ' · ' : ''}<button class="lnk" data-act="tkView" data-arg="${e.rec}">记录 ${tkId(TALKS.find(t => t.id === e.rec))}</button>` : ''}</td></tr>`).join('')}</table>` : '<p class="note">最近一次已经谈上了，连续次数清零。</p>'); }
  if (k === 'tkInv') { const L = myItems().filter(x => x.sid === id && x.st === 'open' && !ivActive(INV.find(v => v.id === x.inv)));
    if (!L.length) { const s = SU(id), v = INV.find(y => y.sid === id && y.by === me() && ivActive(y));
      return mbox(`发邀约 · ${s.name}`, v ? `已经约过了：${ivTime(v)}（${VST[v.st]}）。要改时间或取消，请在「已约」里操作这条邀约。` : '这个学生现在没有可以约的事项。', '', v ? '去「已约」' : '', v ? 'tkInvSee' : '', ''); } }
  return _md17.apply(this, arguments); };
ACT.tkInvSee = () => { S.mo = null; S.tabs.talk = 'inv'; };
