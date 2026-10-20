/* =====================================================================
   演示外壳：场景、页面跳转、备忘录、演示按钮开关（不属于产品）
===================================================================== */
const JUMPS = [
  ['launch', '01 启动页'], ['consent', '02 知情同意'], ['phone', '03 手机验证'], ['info', '04 基本信息'],
  ['home', '05 个人中心'], ['intro', '06 任务说明'], ['scale', '07 标准化问卷'], ['bridge', '07b 进入访谈过渡'], ['chat', '08 小屿访谈'], ['crisis', '09 危机回复'],
  ['done', '11 完成 / 预约邀请'], ['ai', 'AI 访谈 / 我的访谈记录'], ['myq', '我的问卷'], ['cpage', '老师主页'], ['report', '13 我的报告'], ['book', '14 预约中心'], ['mybook', '16 我的预约'], ['intake', '16b 预咨询小屿'],
  ['garden', '19 心理园区'], ['msgs', '消息中心'], ['help', '帮助中心'], ['profile', '个人信息'], ['fb', '访谈反馈'],
];
const MEMO = {
  launch: ['启动页', ['学校门面：无导航，不写具体任务（登录后提醒）', '底部为系统定位与技术支持落款', '老用户已同意当前版本，点「开始体验」直接进手机验证', '演示限制：浏览器后退 / 刷新会回到启动页，正式产品有路由与会话保存']],
  consent: ['知情同意', ['滚动读完才能勾选；同一勾选包含《隐私政策》《用户服务协议》', '记录同意时间与版本；版本更新才需重新同意', '每步都可「上一步」']],
  phone: ['手机验证', ['区号默认 +65，可选其他国家 / 地区（v1.13）；+65 校验 8 位，其他按区号位数；改号后旧验证码作废', '已有资料的学生验证后直接进入个人中心']],
  info: ['基本信息', ['学号 + 手机号比对学校名单；名单外给出 UCC 联系方式，可返回改手机号', '1 位自填紧急联系人，另 1 位由学校导入']],
  home: ['个人中心', ['登录后有待办先弹窗；必做 / 选做分别措辞', '最近足迹只记学生做过的事，每条可点开', '推荐内容按新生 / 老用户区分', '不放预约卡，顶部「预约咨询」角标显示状态', '普测选了「这次不参加」：任务卡写「你已选择不参加，可以随时回来参加」，不再弹提醒（v1.13）']],
  intro: ['任务说明', ['写明来自谁', '14 天内做过的同一份问卷可勾选沿用', '必做普测可选「这次不参加」：确认不影响其他服务；机构端名单显示「已拒绝」，不再提醒（v1.13）']],
  survey: ['标准化问卷', ['独立页面，不出现小屿', '风险题即时弹出安全提示（中性口吻），可「我点错了」，可「请 UCC 今天联系我」；风险标记不撤回', 'PHQ-9、GAD-7 选项文字不改，第一题下加「好几天：指 1–6 天」（v1.13）']],
  bridge: ['进入访谈过渡', ['说明接下来是 AI 对话，约 2.6 秒后自动进入']],
  session: ['访谈窗口', ['小屿回复期间禁用输入；承接语按回答轻重分 3 组共 15 句，同一次访谈不重复（v1.13）', '危机表达：说明是 AI、给热线、暂停对话，提供「请 UCC 今天联系我」', '继续聊时小屿先承接再重提问题', '「先停一下」合并原暂停 / 稍后继续', '完成后先看卡片，再弹预约邀请（4–5 级）']],
  ai: ['AI 访谈', ['顶部「AI 访谈」和菜单「我的访谈记录」是同一页', '上面是现在要做的（开始 / 继续 / 重新对话），下面是记录', '重新对话不改变任务完成状态，上一轮进历史', '每条记录可查看对话、卡片、填写反馈（只能提交一次）']],
  myq: ['我的问卷', ['只列要做的和做过的（含做过的自我了解）', '已截止的写明联系 UCC 重新开放']],
  surveys: ['心理问卷', ['学校任务与「自我了解」分开', '自我了解 9 项，结果只给本人，不发给学校；中途离开自动保存']],
  report: ['我的报告', ['卡片不含等级与分数，文案不引用学生没说过的话', '分享图对所有人一样，不随分档变化']],
  book: ['预约中心', ['按时间 / 按咨询师 / 按校区；日历显示可约老师头像', '首次只能约初级池做预咨询；有负责咨询师只能约 TA；更换通过后排除原咨询师', '已有预约时顶部显示预约卡', '改期模式：提交新时间才作废旧预约、才扣次数；可「放弃改期」，离开页面自动退出']],
  mybook: ['我的预约', ['所有预约都要老师确认（v1.19）：提交申请 → 老师确认 → 咨询 → 完成；学生自己约普通号，提交后默认请做一次 AI 预咨询，可以跳过', '可能被老师婉拒（不计次）或超时（提醒 UCC 跟进）', '改期 / 取消需老师同意，结果弹窗告知', '每 14 天改期、取消各 1 次；老师改约引起的不计次；用完锁定并给求助电话']],
  cpage: ['老师主页', ['介绍、可约时间（30 天全部）', '我和 TA 的咨询：次数、首次、累计时长、下一次，只显示时间和类型']],
  msgs: ['消息中心', ['每条消息落到对应页面：任务→说明页，老师→主页，预约→我的预约', '任务完成后对应消息自动已读', '重要提醒同步短信']],
  help: ['帮助中心', ['热线可点击拨打', 'UCC 联系方式（演示占位）', '协议与文件：知情同意书、隐私政策、用户服务协议']],
  garden: ['心理园区', ['视频 / 音频 / 图文 / 本校活动分区铺开', '文章看全文，活动可报名，视频音频记录进度']],
  profile: ['个人信息', ['手机号不可自改，给出 UCC 联系方式', '紧急联系人：1 位可改（不能与本人号码相同），1 位来自学校']],
  fb: ['访谈反馈', ['沿用 1.0；提交后显示已反馈']],
  intake: ['预咨询小屿 · 接待台（v1.13）', ['提交预约申请后弹出大窗口，小屿一次问一题，可上一题、跳过；回答太短会追问一次', '问题由中心在机构端「预约咨询 · AI 预咨询 · 题库配置」里编辑（普通咨询、高危咨询两套），改完存新版本；模板二（多问睡眠饮食、身边的支持）给 3 个月内没做普测的同学，默认关闭，系统管理员可打开', '只收集不评分；出现危机表达在窗口里给求助卡，并照原危机流程', '最后是可修改的表单，勾选同意后才发给接待老师；中途关闭可先保存；老师查看后只能追加', '位置由学校在「设置 · 预咨询」里选：A 提交申请后（默认）/ B 选时段后提交前（时段暂留 15 分钟，到时自动提交并保存草稿）/ C 关闭', '演示：⚡ 快进填写']],
};
function renderShell() {
  const pg = S.page === 'bridge' ? 'bridge' : S.page === 'survey' ? 'scale' : S.page === 'session' ? (S.task.phase === 'done' ? 'done' : S.task.crisis ? 'crisis' : 'chat') : S.page;
  $('#jump').value = JUMPS.some(j => j[0] === pg) ? pg : '';
  $('#scen').value = S.scen;
}
function renderMemo() {
  const m = MEMO[S.page === 'talks' ? 'ai' : S.page === 'fun' || S.page === 'funres' ? 'surveys' : S.page]; $('#memo').innerHTML = window.memoOpen && m ? `<div class="memo"><h4>${m[0]}</h4><ul>${m[1].map(x => `<li>${x}</li>`).join('')}</ul></div>` : '';
}
/* 跳到某页时，补齐这一页需要的前置状态 */
function prepare(p) {
  S.modal = null; S.menu = false; S.after = null;
  if (['launch', 'splash', 'consent', 'phone', 'info'].includes(p)) { S.auth = false; if (p === 'info') S.profile = null; if (p !== 'splash' && p !== 'launch') S.consent = { read: true, ok: true }; S.page = p; return; }
  S.auth = true; if (!S.profile) S.profile = { ...P() };
  const fillKey = SCENES[S.scen].fill === 'crisis' ? 'high' : SCENES[S.scen].fill;
  const t1 = () => { const t = newTask(DATA.tasks[0]); DATA.scales.forEach(sc => t.ans[sc.k] = [...FILLS[fillKey][sc.k]]); t.scaleLv = RULE.scaleLevel(t.ans); t.scaleAt = new Date(NOW); S.tasks[0] = t; S.task = t; return t; };
  if (p === 'intro') { S.task = S.tasks[0]; if (S.task.phase !== 'none') { S.tasks[0] = newTask(DATA.tasks[0]); S.task = S.tasks[0]; } S.page = 'intro'; return; }
  if (p === 'bridge') { const t = t1(); toChat(t); clearTimeout(S.bridgeT); S.page = 'bridge'; return; }
  if (p === 'scale') { const t = newTask(DATA.tasks[0]); t.phase = 'scale'; S.tasks[0] = t; S.task = t; S.page = 'survey'; return; }
  if (p === 'chat' || p === 'crisis') {
    const t = t1(); t.phase = 'chat';
    t.msgs = [{ who: 'bot', text: DATA.greet }, { who: 'bot', text: DATA.script[0].q }, { who: 'me', text: DATA.script[0].tags[1] }, { who: 'bot', text: DATA.script[1].q }];
    t.qi = 1; t.rounds = 1; S.page = 'session'; S.scrollEnd = true;
    if (p === 'crisis') { S.fast = true; userSay(DATA.crisisDemo); S.fast = false; }
    return;
  }
  if (p === 'done') { const t = t1(); t.phase = 'chat'; t.msgs = [{ who: 'bot', text: DATA.greet }, { who: 'bot', text: DATA.script[0].q }]; S.invited = false; ACT.zChat(); S.page = 'session'; S.scrollEnd = true; return; }
  if (['report', 'talks', 'fb'].includes(p) && S.tasks[0].phase !== 'done') { const t = t1(); Object.assign(t, { phase: 'done', rounds: 6, doneAt: new Date(NOW), msgs: demoTranscript() }); t.lv = t.scaleLv; }
  if (p === 'cpage') S.cp = S.cp || S.owner || 'c1';
  if (p === 'intake') { if (!S.bk && !SCENES[S.scen].returning) S.bk = { cid: 'c1', di: 2, ti: 1, mode: '线下', topics: ['学业压力'], st: '已确认', kind: '预咨询', intake: { st: 'none', ver: 0 } }; ikStart(false); return; }
  if (p === 'mybook' && !S.bk && !SCENES[S.scen].returning) S.bk = { cid: 'c1', di: 2, ti: 1, mode: '线下', topics: ['学业压力'], st: '已确认', kind: '预咨询' };
  S.page = p;
}
function boot() {
  DATA_ZH = DATA;
  $('#scen').innerHTML = Object.entries(SCENES).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('');
  $('#jump').innerHTML = '<option value="" disabled>— 跳到页面 —</option>' + JUMPS.map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
  $('#scen').onchange = e => { reset(e.target.value); render(); };
  $('#jump').onchange = e => { prepare(e.target.value); render(); };
  $('#resetBtn').onclick = () => { reset(S.scen); render(); };
  $('#memoBtn').onclick = () => { window.memoOpen = !window.memoOpen; render(); };
  $('#zapT').onchange = e => document.body.classList.toggle('demo-on', e.target.checked);
  reset('A'); render();
}
