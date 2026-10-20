/* =====================================================================
   业务规则（学生端看不到等级，规则只在后台生效）
   对应功能文档：第 2 节 核心口径 · 第 5 节 小屿访谈 · 第 6 节 危机 · 第 7 节 预约
===================================================================== */
const RULE = {
  /* 量表分段 → 等级（1 无特殊关注 … 4 密切关注；5 危机干预只由风险信号触发） */
  scaleLevel(ans) {
    const sum = a => (a || []).reduce((s, v) => s + (v || 0), 0);
    const band = (s, cut) => 1 + cut.filter(c => s >= c).length;           // 文档 §2
    return Math.min(4, Math.max(band(sum(ans.phq9), [5, 10, 15]), band(sum(ans.gad7), [5, 10, 15])));
  },
  /* 风险题：PHQ-9 第 9 题选「好几天」及以上 → 即时提示 + 危机干预（文档 §6） */
  riskHit(k, i, v) { const sc = DATA.scales.find(s => s.k === k); return sc.risk === i && v >= 1; },
  /* 访谈中的危机表达（文档 §5、§6） */
  crisisRe: /不想活|活不下去|活着没意思|活着没意义|不想活了|想死|去死|寻死|自杀|轻生|结束生命|结束自己|自残|自伤|割腕|跳楼|跳河|吃安眠药|伤害自己|死了算了|死了就好|不如死|消失就好了|撑不下去了|kill myself|killing myself|self[- ]harm|cut myself|kill myself|suicid|end my life|hurt myself|better off dead|no point in living|want to die/i,
  concernRe: /睡不着|提不起劲|撑不住|好累|没意义|没有希望|撑得很辛苦|can’t sleep|can't sleep|exhausted|hopeless|barely holding/i,
  /* 访谈最多把等级上调 1 级，且不超过 4 级（文档 §5） */
  finalLevel(t) { return t.crisis ? 5 : Math.min(4, t.scaleLv + (t.concern >= 2 ? 1 : 0)); },
  /* 4–5 级在完成后弹出预约邀请（文档 §7） */
  invite(lv) { return lv >= 4; },
  /* 可选咨询师：已有负责咨询师 → 只能约 TA；否则只能选初级池做预咨询（文档 §7） */
  canBook(c, owner) { return owner ? c.id === owner : c.pool === 'pre'; },
  lockWhy(c, owner) {
    if (owner) return '你已有负责咨询师，如需更换请先申请';
    return c.pool === 'senior' ? '由中心在预咨询后安排' : '';
  },
};

/* 趣味测试计分：结果只给学生自己看 */
const FUNSCORE = {
  big5(t, a) { const s = {}; t.items.forEach(([, k, sign], i) => { const v = a[i] + 1; s[k] = (s[k] || 0) + (sign > 0 ? v : 6 - v); });
    return Object.keys(t.traits).map(k => ({ k, pct: Math.round((s[k] - 2) / 8 * 100) })); },
  type16(t, a) { const c = {}; t.items.forEach(([, , , d], i) => { c[d] = (c[d] || 0) + (a[i] === 0 ? 1 : -1); });
    return Object.keys(t.dims).map(d => ({ d, side: c[d] >= 0 ? 0 : 1 })); },
  pss(t, a) { return t.items.reduce((s, [, rev], i) => s + (rev ? 4 - a[i] : a[i]), 0); },          // 0–40：0–13 较低，14–26 中等，27–40 较高
  who5(t, a) { return a.reduce((s, v) => s + v, 0) * 4; },                                         // 0–100：低于 50 偏低
  /* 新增：均分或总分，按 bands 分档 */
  brs: (t, a) => +(t.items.reduce((s, [, rev], i) => s + (rev ? 5 - a[i] : a[i] + 1), 0) / t.items.length).toFixed(1),
  ucla3: (t, a) => a.reduce((s, v) => s + v + 1, 0),
  scs: (t, a) => +(t.items.reduce((s, [, rev], i) => s + (rev ? 5 - a[i] : a[i] + 1), 0) / t.items.length).toFixed(1),
  gse: (t, a) => a.reduce((s, v) => s + v + 1, 0),
  rse(t, a) { return t.items.reduce((s, [, rev], i) => s + (rev ? 4 - a[i] : a[i] + 1), 0); },      // 10–40：低于 25 偏低
};

/* 演示时间：2026 年 10 月 12 日（周一）10:00。可预约日期为之后 30 天内的工作日 */
const NOW = new Date(2026, 9, 12, 10, 0);
/* 未来 30 天内的工作日 */
const DAYS = (() => { const r = []; const d = new Date(NOW); for (let i = 1; i <= 30; i++) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) r.push(new Date(d)); } return r; })();
/* 时段：咨询师在后台开放；需至少提前 24 小时；已被他人占用的显示为已约满 */
function slotState(ci, di, ti) {
  if (S._schedSnapshot) {
    if (!DAYS[di] || !DATA.times[ti]) return 'closed';
    const date = new Date(DAYS[di]), cid = DATA.counsellors[ci] && DATA.counsellors[ci].id, key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const slot = S._schedSnapshot.find(x => x.cid === cid && x.date === key && x.time === DATA.times[ti]);
    if (!slot || slot.st === 'closed') return 'closed';
    const [h,m] = DATA.times[ti].split(':'); date.setHours(+h,+m,0,0);
    if (date - NOW < 24 * 3600e3) return 'early';
    return slot.st === 'open' ? 'open' : 'taken';
  }
  if ((di * 5 + 2) % 7 === 0 || (ci + di) % 4 === 3) return 'closed';           // 有些日子老师不排班
  const open = (ci * 3 + di * 2 + ti) % 3 !== 0;
  if (!open) return 'closed';
  const start = new Date(DAYS[di]); const [h, m] = DATA.times[ti].split(':'); start.setHours(+h, +m);
  if (start - NOW < 24 * 3600e3) return 'early';
  if ((ci * 7 + di * 3 + ti * 5) % 6 === 0) return 'taken';
  return 'open';
}
