/* =====================================================================
   机构端演示数据：与学生端同一所学校、同一批咨询师、同一次普测
   演示范围：2026 秋季普测 · 第 1 波（试点 4 个学院），演示时间 2026-10-12（周一）10:00
   时钟：NOW 是唯一时间源；演示按钮「时间 +4 小时」与每次操作都推进它
===================================================================== */
const NOW = new Date(2026, 9, 12, 10, 0);
const H = 3600e3;
const ago = h => new Date(NOW - h * H);
const later = h => new Date(NOW.getTime() + h * H);

/* 机构端成员 */
const STAFF = {
  c1: { name: '李文', role: 'L2', title: '初级咨询师', campus: '主校区', pre: true },
  c2: { name: 'Maria', role: 'L2', title: '初级咨询师', campus: '主校区', pre: true },
  c3: { name: 'Daniel', role: 'L2', title: '初级咨询师', campus: 'Novena 校区', pre: true },
  c4: { name: '王磊', role: 'L3', title: '高级咨询师', campus: '主校区', pre: false },
  c5: { name: '朱静', role: 'L3', title: '中心负责人', campus: '主校区', pre: false },
  u1: { name: '周老师', role: 'L1', title: '学院辅导员（商学院、计算与数据科学学院）' },
  u2: { name: '郑老师', role: 'L1', title: '学院辅导员（工程学院、医学院）' },
  u3: { name: '林同学', role: 'L1s', title: '授权学生心理委员（商学院）' },
  a1: { name: '陈行政', role: 'ADM', title: '系统管理员' },
  stu: { name: '学生本人', role: 'STU', title: '学生端' },
  vp: { name: '学生事务处 何处长', role: 'EXT', title: '分管领导（危机二级升级对象）' },
};
/* 账号与权限：第一个是处理层级；含 ADM 表示兼有系统管理员权限（登录后合并显示，不用选） */
const ACCTS = {
  c5: ['L3', 'ADM'], c4: ['L3'], c1: ['L2'], u1: ['L1'], u3: ['L1s'], a1: ['ADM'],
};
const RN = { L1: 'L1 核验', L1s: 'L1 核验（学生委员）', L2: 'L2 复核', L3: 'L3 决策', ADM: '系统管理员', ADMx: '系统管理员权限（兼任）' };
const COLLEGES = ['计算与数据科学学院', '南洋商学院', '工程学院', '李光前医学院'];
const FOLLOWER_OF = { '计算与数据科学学院': 'u1', '南洋商学院': 'u1', '工程学院': 'u2', '李光前医学院': 'u2' };
const DIRS = ['学业', '人际', '睡眠', '情绪', '新生适应', '家庭', '恋爱', '生涯'];
const FS = ['焦虑', '抑郁', '睡眠障碍', '强迫', '创伤', 'ADHD'];
const LVN = { 5: '危机干预', 4: '密切关注', 3: '重点关注', 2: '日常关注', 1: '无特殊关注' };
const CYCLE = { 5: 1, 4: 3, 3: 14, 2: 30, 1: 30 };   // 随访周期（天）；危机结案后 24 小时

/* 值班表：驱动危机通知对象 */
const DUTY = [{ wk: '10/12–10/18', who: 'c4' }, { wk: '10/19–10/25', who: 'c5' }, { wk: '10/26–11/01', who: 'c4' }];

/* 确定性随机 */
let seed = 20261012; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = a => a[Math.floor(rnd() * a.length)];
const SUR = ['张', '王', '李', '刘', '陈', '杨', '黄', '赵', '吴', '周', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '高', '梁', '宋', '郑', '谢', '韩', 'Tan', 'Lim', 'Ng', 'Lee', 'Wong'];
const GIV = ['子涵', '欣怡', '浩然', '雨桐', '宇轩', '思琪', '俊杰', '梓萱', '博文', '佳怡', '一鸣', '诗雨', '嘉豪', '若曦', '明哲', '语嫣', '天佑', '晓彤', '睿', '安琪', 'Wei Jie', 'Hui Min', 'Jia Hui', 'Kai Xuan', 'Shu Ting'];
const nameOf = () => { const s = pick(SUR); const g = pick(GIV); return /[A-Za-z]/.test(s) ? `${s} ${/[A-Za-z]/.test(g) ? g : 'Jun'}` : s + (/[A-Za-z]/.test(g) ? '雨晨' : g); };

/* 学生 */
const STU = [];
let sn = 0;
function mk(o) {
  sn++; const college = o.college || pick(COLLEGES), year = o.year || pick(['大一', '大二', '大三']);
  const lv = o.lv;
  const ph = o.phq ?? Math.min(27, Math.max(0, Math.round([0, 2, 7, 12, 17, 21][lv] + (rnd() * 4 - 2))));
  const ga = o.gad ?? Math.min(21, Math.max(0, Math.round([0, 2, 6, 11, 15, 17][lv] + (rnd() * 4 - 2))));
  const dirs = o.dirs || (lv <= 1 ? [] : [pick(DIRS), ...(rnd() > .5 ? [pick(DIRS)] : [])]).filter((x, i, a) => a.indexOf(x) === i);
  const fs = o.fs || (lv <= 2 ? (lv === 2 && rnd() > .5 ? [pick(FS.slice(0, 3))] : []) : [pick(FS.slice(0, 3)), ...(rnd() > .6 ? [pick(FS)] : [])]).filter((x, i, a) => a.indexOf(x) === i);
  const s = Object.assign({
    id: 's' + sn, code: '#' + String(1000 + (sn * 7919) % 9000), name: o.name || nameOf(), sid: o.sid || `U26${String(10000 + Math.floor(rnd() * 89999))}${'ABCFKZ'[sn % 6]}`, gender: o.gender || pick(['女', '男']),
    college, year, campus: college === '李光前医学院' ? 'Novena 校区' : '主校区', phone: o.phone || `8${Math.floor(1000000 + rnd() * 8999999)}`,
    ec: o.ec || [['家长', '父亲', `9${Math.floor(1000000 + rnd() * 8999999)}`], ['家长', '母亲', `9${Math.floor(1000000 + rnd() * 8999999)}`]],
    ai: lv, lv, conf: o.conf ?? null, sig: o.sig || Math.max(1, Math.min(5, Math.round(1 + rnd() * 4))), dirs, fs, phq: ph, gad: ga, item9: o.item9 ?? (lv >= 5 ? 2 : lv === 4 && rnd() > .6 ? 1 : 0),
    done: o.done || ago(2 + rnd() * 140), rounds: o.rounds || 6, mins: o.mins || Math.round(14 + rnd() * 22),
    follower: o.follower || FOLLOWER_OF[college], owner: o.owner || null, assignee: o.assignee || null,
    stage: o.stage, queue: o.queue || null, since: o.since || ago(rnd() * 60), src: o.src || '系统分配', note: o.note || '',
    quality: o.quality || null, fdue: o.fdueH != null ? later(o.fdueH) : null, miss: 0, tries: 0, tl: [], hist: o.hist || [], core: o.core || null,
    invAt: null, q: { chg: 0, cancel: 0 }, plans: o.plans || ['t1'], walkin: o.walkin || 0,
  });
  s.tl.push({ at: s.done, t: `完成普测，系统初判 ${s.ai} 级（${LVN[s.ai]}）`, who: '系统', k: 'done' });
  STU.push(s); return s;
}

/* —— 学生端的 4 位演示学生（量表分与学生端一致） —— */
const CORE = {
  lin: mk({ core: 'A', name: '林晓', sid: 'U2620318A', gender: '女', college: '计算与数据科学学院', year: '大二', phone: '81234567', lv: 2, sig: 3, phq: 6, gad: 5, dirs: ['学业', '睡眠'], fs: ['睡眠障碍'],
    ec: [['林建华', '父亲', '91234567'], ['王秀英', '母亲', '95556601']], stage: 'L1', queue: 'verify', since: ago(20), done: ago(20), mins: 24 }),
  chen: mk({ core: 'B', name: '陈嘉怡', sid: 'U2531145C', gender: '女', college: '南洋商学院', year: '大二', phone: '82345678', lv: 4, sig: 4, phq: 16, gad: 12, item9: 0, dirs: ['学业', '情绪'], fs: ['焦虑', '抑郁'],
    ec: [['陈美玲', '母亲', '92345678'], ['陈国华', '父亲', '95556602']], stage: 'L2', queue: 'review4', assignee: 'c1', since: ago(39), done: ago(39), mins: 29 }),
  huang: mk({ core: 'C', name: '黄子轩', sid: 'U2440672F', gender: '男', college: '李光前医学院', year: '大三', phone: '83456789', lv: 5, sig: 5, phq: 16, gad: 12, item9: 2, dirs: ['情绪', '睡眠'], fs: ['抑郁', '睡眠障碍'],
    ec: [['黄国强', '父亲', '93456789'], ['李丽', '母亲', '95556603']], stage: 'crisis', since: ago(1.3), done: ago(1.3), mins: 12 }),
  wang: mk({ core: 'D', name: '王思远', sid: 'U2350981K', gender: '男', college: '工程学院', year: '大四', phone: '84567890', lv: 2, sig: 2, phq: 6, gad: 5, dirs: ['生涯', '睡眠'], fs: [],
    ec: [['王丽', '母亲', '94567890'], ['王建国', '父亲', '95556604']], stage: 'follow', owner: 'c4', conf: 2, fdueH: 26 * 24, done: ago(96), mins: 22,
    hist: [{ t: '2026 春季学期普测', lv: 2 }, { t: '新生适应追踪（第 1 次）', lv: null }] }),
};
CORE.huang.tl.push({ at: ago(1.3), t: '作答中 PHQ-9 第 9 题选「一半以上的天数」，即时转入危机通道', who: '系统', r: 1, k: 'crisis' });
CORE.huang.tl.push({ at: ago(1.1), t: '访谈中出现危机表达：「其实我最近有时候觉得活着没意思」', who: '系统', r: 1, k: 'crisis' });
CORE.huang.tl.push({ at: ago(1), t: '学生点击「请 UCC 今天联系我」', who: '学生', r: 1, k: 'crisis' });
CORE.wang.tl.push({ at: ago(95), t: 'L1 郑老师 完成学院核实', who: '郑老师', k: 'l1keep' });
CORE.wang.tl.push({ at: ago(70), t: '指派负责咨询师：王磊', who: '朱静', k: 'assign' });
CORE.wang.q.chg = 1;

/* —— 其余学生：按等级分布到各层 —— */
const add = (n, o) => { const r = []; for (let i = 0; i < n; i++) r.push(mk(typeof o === 'function' ? o(i) : { ...o })); return r; };
const crisis2 = mk({ lv: 5, sig: 5, stage: 'crisis', college: '工程学院', since: ago(20), done: ago(20), dirs: ['家庭', '情绪'], fs: ['抑郁'] });
crisis2.tl.push({ at: ago(20), t: '访谈中出现危机表达，转入危机通道', who: '系统', r: 1, k: 'crisis' });
// 4 级
add(4, i => ({ lv: 4, stage: 'L2', queue: 'review4', assignee: 'c1', since: ago([6, 14, 30, 51][i]), sig: [3, 4, 4, 5][i], college: COLLEGES[i] }));
add(2, i => ({ lv: 4, stage: 'L2', queue: 'review4', assignee: 'c2', since: ago(8 + i * 10) }));
const hard = mk({ lv: 4, sig: 5, stage: 'L3', queue: 'hard', assignee: 'c1', since: ago(6), src: '李文上推：既往自伤史', college: '南洋商学院', item9: 1 });
hard.tl.push({ at: ago(6), t: 'L2 李文 上推 L3，原因：既往自伤史（学生访谈中提到高中时有过）', who: '李文', k: 'up2' });
const down = mk({ lv: 4, sig: 3, stage: 'L3', queue: 'down', assignee: 'c2', since: ago(4), src: 'Maria 申请降为 2 级', college: '工程学院' });
down.downTo = 2; down.downWhy = '电话联系后：近期压力来自一次考试，已经缓解，有家人支持，PHQ-9 复评 6 分'; down.downBy = 'c2';
down.tl.push({ at: ago(4), t: `L2 Maria 申请降为 2 级：${down.downWhy}`, who: 'Maria', k: 'down' });
const declined = mk({ lv: 4, sig: 4, stage: 'L2', queue: 'declined', assignee: 'c1', since: ago(10), src: '拒绝了预约邀请', college: '计算与数据科学学院', conf: 4 });
declined.tl.push({ at: ago(30), t: 'L2 李文 确认 4 级，发出预约邀请', who: '李文', k: 'conf' }, { at: ago(10), t: '学生选择「暂不需要」', who: '学生', k: 'stu' });
add(1, { lv: 4, stage: 'follow', conf: 4, owner: 'c2', fdueH: 30 });
// 3 级
add(5, i => ({ lv: 3, stage: 'L1', queue: 'verify', since: ago([10, 22, 40, 76, 80][i]), college: COLLEGES[i % 2] }));
add(3, i => ({ lv: 3, stage: 'L1', queue: 'verify', since: ago(12 + i * 9), college: COLLEGES[2 + (i % 2)] }));
add(6, i => ({ lv: 3, stage: 'L2', queue: 'batch', assignee: 'c1', since: ago(20 + i * 6), src: '学院已核实' }));
const upA = mk({ lv: 3, stage: 'L2', queue: 'up', assignee: 'c1', since: ago(26), src: '周老师 交给咨询师：近期家庭变故', college: '南洋商学院' });
upA.tl.push({ at: ago(26), t: 'L1 周老师 交给咨询师：近期重大变故', who: '周老师', k: 'l1up' });
const upB = mk({ lv: 3, stage: 'L2', queue: 'up', assignee: 'c1', since: ago(5), src: '随访反馈「加重」', college: '计算与数据科学学院', conf: 3 });
upB.tl.push({ at: ago(5), t: '随访反馈：风险趋势「加重」，转入 L2', who: '周老师', k: 'fb' });
add(4, { lv: 3, stage: 'follow', conf: 3, fdueH: 5 * 24 });
// 2 级
add(14, i => ({ lv: 2, stage: 'L1', queue: 'verify', since: ago(4 + i * 4), college: COLLEGES[i % 4] }));
add(25, { lv: 2, stage: 'follow', conf: 2, fdueH: 20 * 24 });
add(3, i => ({ lv: 2, stage: 'follow', conf: 2, fdueH: -[2, 10, 50][i], college: COLLEGES[i % 2] }));
add(4, { lv: 2, stage: 'L2', queue: 'sample', assignee: 'c1', since: ago(30), src: '系统抽查（15%）', conf: 2 });
// 1 级
add(1, { lv: 1, stage: 'L1', queue: 'verify', quality: '问卷部分作答用时过短（量表 3 分钟，不含访谈）', since: ago(30), college: '南洋商学院' });
add(98, { lv: 1, stage: 'done', conf: 1 });
STU.forEach(s => {
  if (s.lv === 4 && s.queue === 'review4') s.src = '系统分配（4 级跳过 L1）';
  if (s.stage === 'follow' && !s.owner && s.lv <= 3) s.tl.push({ at: new Date(s.done.getTime() + 20 * H), t: `L1 ${STAFF[s.follower].name} 核验：维持`, who: STAFF[s.follower].name, k: 'l1keep' });
  if (s.queue === 'batch') s.tl.push({ at: s.since, t: `L1 ${STAFF[s.follower].name} 核验：维持`, who: STAFF[s.follower].name, k: 'l1keep' });
  if (s.stage === 'follow') s.cycle = CYCLE[s.conf || s.lv];
});
// 授权学生委员林同学：分到商学院 2 位 2 级学生
STU.filter(s => s.stage === 'L1' && s.lv === 2 && s.college === '南洋商学院').slice(0, 2).forEach(s => s.follower = 'u3');

/* 危机记录（src 每条带时间，与学生时间线同源） */
const CRISES = [
  { id: 'k1', sid: CORE.huang.id, st: 'new', at: ago(1.3), src: CORE.huang.tl.filter(e => e.k === 'crisis').map(e => ({ t: e.t, at: e.at })), type: '主动意图', recv: null, acts: [], calls: [], esc: 0 },
  { id: 'k2', sid: crisis2.id, st: 'handling', at: ago(20), src: [{ t: '访谈原话：「家里的事让我觉得撑不下去了」', at: ago(20) }], type: '被动意图', recv: { by: 'c4', at: ago(18.5) }, esc: 0,
    acts: [{ at: ago(18.2), step: 'contact', to: '本人', res: '已接通', min: 12, by: 'c4', note: '学生在宿舍，情绪平稳，同意今天下午来中心' }, { at: ago(17), step: 'assess', res: '已约当面评估', by: 'c4', note: '10/12 14:00 中心 3 号室' }, { at: ago(16.5), step: 'parent', res: '已告知', to: '母亲', by: 'c4', note: '母亲知情，今晚会给学生打电话' }], calls: [] },
  { id: 'k3', sid: null, st: 'closed', at: ago(24 * 9), name: '学生 #4417', college: '南洋商学院', src: [{ t: '访谈原话：「想消失」', at: ago(24 * 9) }], type: '被动意图', recv: { by: 'c5', at: ago(24 * 9 - 2) }, esc: 0,
    closed: { at: ago(24 * 7), note: '当面评估后签署安全计划，转为密切关注，由王磊跟进', lv: 4, owner: 'c4', state: '安全，在校', plan: '已签署', parent: '已知情' }, acts: [{ at: ago(24 * 8.9), step: 'contact', to: '本人', res: '已接通', min: 8, by: 'c5' }, { at: ago(24 * 8.8), step: 'assess', res: '评估完成 · 可回宿舍并保持联系', by: 'c5' }, { at: ago(24 * 8.7), step: 'plan', res: '已签署', by: 'c5' }, { at: ago(24 * 8.6), step: 'parent', res: '已告知', to: '父亲', by: 'c5' }], calls: [] },
];

/* 通知（短信 / 电话 / 站内），带送达与确认状态 */
const NOTI = [];
function notify(to, ch, t, ref, st = '已送达', at = new Date(NOW)) { NOTI.unshift({ id: 'n' + (NOTI.length + 1), to, ch, t, ref, st, at }); }
const escTxt = k => { let u = 30, e = 4; try { u = RULES.urgentMin; e = RULES.esc; } catch (x) {} return k.urgent ? u + ' 分钟' : e + ' 小时'; };   // 种子数据加载时 RULES 还没定义
function crisisNotify(k, at) {
  const y = STU.find(s => s.id === k.sid), duty = DUTY[0].who, lbl = y ? `${y.college} 一名学生` : '一名学生';
  notify(duty, '短信 + 电话', `危机：${lbl}，请 ${escTxt(k)}内确认接收`, k.id, '已送达', at);
  ['c1', 'c2', 'c3'].forEach(c => notify(c, '站内', `危机通道新增 1 条（只读）`, k.id, '已送达', at));
  if (y) notify(FOLLOWER_OF[y.college], '短信', `你跟进的学院有 1 条危机正在处理（脱敏），如需协助负责人会联系你`, k.id, '已送达', at);
  k.notified = [`${STAFF[duty].name}（值班）`, '李文、Maria、Daniel（只读）', y ? `${STAFF[FOLLOWER_OF[y.college]].name}（脱敏）` : ''].filter(Boolean);
}
crisisNotify(CRISES[0], CRISES[0].at); crisisNotify(CRISES[1], CRISES[1].at);
NOTI.filter(n => n.ref === 'k2' && n.to === 'c4').forEach(n => n.st = '已确认');
CRISES[2].notified = ['朱静（值班）', '全部咨询师（只读）'];

/* 预约：DAYS = 本周一至周五（10/12–10/16） */
const TIMES = ['09:00', '10:30', '14:00', '15:30'];
const DAYS = [0, 1, 2, 3, 4].map(i => new Date(2026, 9, 12 + i));
const DXL = (() => { const r = [], d = new Date(2026, 9, 12); while (r.length < 40) { if (d.getDay() % 6) r.push(new Date(d)); d.setDate(d.getDate() + 1); } return r; })();   // 学生端可约到更远的日子
const bk = (o, h) => Object.assign({ at: ago(h), mode: '线下', kind: '预咨询', src: '自主预约' }, o);
const BOOK = [
  bk({ id: 'b1', sid: CORE.chen.id, cid: 'c1', day: 1, t: 1, st: 'ok', fresh: true, lv4: true }, 5),
  bk({ id: 'b2', sid: CORE.lin.id, cid: 'c1', day: 2, t: 2, mode: '线上', st: 'ok', fresh: true }, 3),
  bk({ id: 'b3', sid: CORE.wang.id, cid: 'c4', kind: '正式咨询', day: 1, t: 2, st: 'change', src: '学生申请改期', req: { type: '改期', day: 4, t: 2 } }, 26),
  bk({ id: 'b4', sid: STU[20].id, cid: 'c2', day: 0, t: 2, st: 'ok', src: '邀请' }, 50),
  bk({ id: 'b5', sid: STU[40].id, cid: 'c1', day: -1, t: 2, st: 'record' }, 70),
  bk({ id: 'b6', sid: STU[60].id, cid: 'c3', day: 3, t: 1, mode: '线上', st: 'ok', fresh: true }, 30),
  bk({ id: 'b7', sid: STU[70].id, cid: 'c2', day: 2, t: 0, st: 'pool', src: '超时未确认 → 待办池' }, 75),
  bk({ id: 'b8', sid: STU[80].id, cid: 'c1', day: 4, t: 3, st: 'confirm', src: '待办池指派' }, 20),
  bk({ id: 'b9', sid: STU[90].id, cid: 'c1', day: 0, t: 3, st: 'ok', src: '邀请' }, 40),
];
/* 排班：咨询师 × 工作日 × 时段（open / off / bk） */
const SCHED = {};
['c1', 'c2', 'c3', 'c4', 'c5'].forEach((c, ci) => { SCHED[c] = DAYS.map((_, di) => TIMES.map((_, ti) => ((ci + di * 2 + ti) % 4 === 0 ? 'off' : 'open'))); });
SCHED.c3[2] = ['off', 'off', 'off', 'off'];   // Daniel 10/14 还没提交时段
BOOK.forEach(b => { if (b.day >= 0 && SCHED[b.cid]) SCHED[b.cid][b.day][b.t] = 'bk'; });

/* 普测任务（分波次） */
const TASKS = [
  { id: 't1', name: '2026 秋季学期心理健康普测', from: 'UCC', scales: 'PHQ-9 · GAD-7 · 小屿访谈', due: '10/19', waves: [
    { n: 1, name: '第 1 波 · 试点 4 个学院', st: 'run', roster: 0, pub: '10/05' }, { n: 2, name: '第 2 波 · 大二、大三', st: 'wait', pub: '10/19', roster: 2140 },
    { n: 3, name: '第 3 波 · 大四与研究生', st: 'wait', pub: '10/26', roster: 1980 }, { n: 4, name: '第 4 波 · 补测', st: 'wait', pub: '11/02', roster: 0 }] },
  { id: 't2', name: '期中压力小调查', from: '南洋商学院 周老师', scales: 'GAD-7', due: '10/30', waves: [{ n: 1, name: '商学院', st: 'run', pub: '10/12', roster: 180 }] },
];
const PENDING = [];
for (let i = 0; i < 64; i++) { const st = i < 18 ? '作答中' : i < 26 ? '中断' : '未开始'; PENDING.push({ name: nameOf(), sid: `U26${10000 + Math.floor(rnd() * 89999)}X`, college: pick(COLLEGES), st, left: st === '未开始' ? '问卷 + 访谈' : pick(['访谈', 'GAD-7 + 访谈', '访谈后半段']), due: '10/19', rem: 1 }); }
const ROSTER = STU.length + PENDING.length;   // 第 1 波名单人数，固定
TASKS[0].waves[0].roster = ROSTER;

/* 分层规则（系统管理员可改，改动即时影响流转） */
const RULES = {
  esc: 4, esc2: 12, t3end: '批量确认', samp2: 15, samp1: 5, cap: 60,
  urgentMin: 30, lim: { pendMax: 168, pending: 168, quality: 72, verify3: 72, verify2: 168, review4: 48, up: 72, batch: 168, sample: 168, declined: 48, noresp: 48, hard: 72, down: 48, fdue: 48, review3: 72, book: 48, book5: 12 },
};
/* 权限矩阵：列 = L1、L2、L3、系统管理员；lock 里的格子不可改（规则 8 等硬约束） */
const PERMS = [
  ['看关注等级与信号格', 0, 1, 1, 0], ['看学生实名与手机号', 1, 1, 1, 0], ['看量表得分与结构化报告', 0, 1, 1, 0], ['看作答明细与对话全文', 0, 1, 1, 0],
  ['核验：维持 / 存疑上推', 1, 0, 1, 0], ['写随访反馈', 1, 1, 1, 0], ['确认 / 调整等级', 0, 1, 1, 0], ['审批高风险降级', 0, 0, 1, 0], ['危机接收与结案（可突破保密）', 0, 0, 1, 0],
  ['分配与改派', 0, 0, 1, 0], ['发布普测、导入名单', 0, 0, 1, 0], ['导出原始数据', 0, 0, 1, 0], ['配置分层规则与权限', 0, 0, 0, 1], ['查看审计日志', 0, 0, 1, 1]];
const PLOCK = new Set(['0:1', '2:1', '3:1', '0:4', '1:4', '2:4', '3:4', '4:4', '5:4', '6:4', '7:4', '8:4', '9:4', '10:4', '11:4', '12:4', '6:1', '7:1', '8:1', '9:1', '10:1', '11:1', '12:1', '12:2', '12:3', '8:3', '7:2', '13:4']);
const CONSENT = { ver: 'v2.0', l1: '学院辅导员可以看到学生姓名与联系方式，但看不到任何心理评估内容（等级、分数、报告、对话）；经授权的学生心理委员只看到编号' };

/* 小屿访谈原话（用于档案「完整对话」与报告原话跳转） */
const SCRIPT = ['先聊一个轻松的——最近睡眠怎么样？容易入睡吗？', '平时学习压力大的时候，你一般怎么放松自己？', '那最近有没有什么事情让你觉得特别烦，或者情绪起伏比较大？', '你现在的这种状态大概持续多久了？是最近一两周，还是更早一些？', '当你感到难受的时候，身边有可以聊一聊的人吗？', '最后一个问题：如果用一个词形容最近的自己，你会选哪个？'];
const ANS = {
  1: ['还行，偶尔熬夜', '跑步或者打游戏', '没什么特别的', '就这一两周', '室友会陪我聊', '还行'],
  2: ['还行，偶尔熬夜', '跑步或者打游戏', '课程压力有点大', '就这一两周', '室友会陪我聊', '有点累'],
  3: ['不太好，经常睡不着', '找朋友聊聊', '课程压力有点大', '一个多月了', '偶尔和家人说', '有点累'],
  4: ['几乎每晚都睡不好', '好像没什么办法', '最近什么都提不起劲', '一个多月了', '不太想让别人担心', '撑得很辛苦'],
  5: ['几乎每晚都睡不好', '好像没什么办法', '最近什么都提不起劲', '开学前就开始了', '不太想让别人担心', '其实我最近有时候觉得活着没意思'],
};
