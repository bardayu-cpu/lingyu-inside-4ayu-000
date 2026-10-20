/* =====================================================================
   v1.19（2026-10-20）· 预约那一版 + 风险词分级定稿
   1. 风险词：默认清单换成「风险词分级定稿」599 个词，分一级 / 二级 / 三级；否定说法不触发
   2. 所有预约都要老师确认：撤掉 v1.13「第一次预约直接成功」「新预约 · 知道了」
   3. 「预约咨询」改成 5 个页签：主动邀约 · AI 预咨询 · 人工咨询 · 排班表 · 号池配置
   4. 预咨询题库分「普通咨询」「高危咨询」两套，放到「AI 预咨询 · 题库配置」；值班表挪到「排班表」
===================================================================== */

/* ---------- 1. 风险词（来自「风险词分级定稿」；原表里的「医院」改成「心理中心」；v1.19.1 按 Ayu 补一级：想死、自杀、不想活、轻生、结束生命） ---------- */
const CW19 = [
  [1, "约死行为", "黄泉路上不孤单|黄泉路上做个伴|集体自杀|教唆自杀|劝人死|死了比活着好|死群|死亡是解脱|一起解脱|一起烧炭|一起死|一起跳楼|诱导自杀|约烧炭|约死|约死平台|约跳|自杀群|自杀贴吧"],
  [1, "直接自杀意念", "想死|自杀|不想活|轻生|结束生命|不如死了|不想活了|了断自己|了结生命|了结自己|杀死自己|死了算了|死是我唯一的出路|我不活了|我现在就去死|我想去死|我想死|我要自杀|我又想来一次|想结束生命|想自杀|想自我了断|只有死才能解脱|自我终结|end my life|kill myself|kms|unalive myself"],
  [1, "自杀方法", "吃药自杀|从楼上跳下去|大量服药|割脖子|割喉|割手腕|割腕|喝农药|开煤气|勒死自己|上吊|烧炭|跳海|跳河|跳江|跳楼|投河|投湖|我吃了一瓶药|我刚吞了药|我已经吃药了|卧轨|想跳楼|一氧化碳|自焚|自缢"],
  [1, "自杀计划与准备", "查自杀方法|打算自杀|今天就结束|今晚就动手|煤气开了|门窗封好了|哪里适合跳楼|哪种死法最快|绳子套好了|搜集了方法|搜索自杀方法|炭已经点了|我本来要跳被人拦住了|我在楼顶|我站在桥边|我正在天台|我走到天台又回来了|写好遗书|写了告别信|遗书已经写好了|已经想好了怎么做|怎么死不痛苦|怎样自杀成功率高|准备自杀"],
  [1, "自伤行为", "我已经割了|血止不住"],
  [2, "告别行为", "把宠物托付给你|把东西都送人|把密码告诉你们|不要想我|财产分配|东西都收拾好了|东西给你们|对不起爸妈|告别信|就当没认识过我|看看你们最后一眼|时间差不多了|替我照顾|忘了我|遗书|以后你们好好的|永别了|再见了大家|照顾好爸妈|最后见一面|最后一次|最后一条消息|goodbye"],
  [2, "情绪危机信号", "被世界抛弃|被所有人抛弃|彻底绝望|大家没有我会更好|负担|感到绝望|孤立无援|极度孤独|绝望|绝望了|看不到希望|累赘|没有价值|没有退路了|没有未来|没有我大家会更好|没有我他们会更好|没有希望|少了我大家会轻松|谁也帮不了我|什么都无所谓了|生不如死|痛不欲生|痛苦得想死|未来一片黑暗|我是多余的|我只会拖累别人|我只会拖累你们|无法忍受|无路可走|无助|走投无路|better off dead"],
  [2, "隐喻性表达", "不存在了|不想看到明天|不用再受苦|不再醒来|彻底解脱|彻底消失|从来没有出生过就好了|但愿我没出生|得到解脱|归于尘土|结束痛苦|解脱|了结这一切|没有明天|去另一个世界|去天国|去天堂|时间到了|睡着不再醒来|踏上不归路|脱离苦海|往生|希望睡着后别醒|一觉不醒|永别|永久下线|永远的解脱|永远的离开|永远的宁静|再也不想醒来|长眠|紫砂|自纱|自鲨|end it all|wish I were dead"],
  [2, "约死行为", "活着就是受罪|解脱群|路上有人陪|求同伴|一起离开|一起上路|一起跳|一起走|一起走吧|有没有一起的|有人一起吗|自杀微博"],
  [2, "直接自杀意念", "熬不下去了|不想再继续了|撑不下去了|活着没意思|活着没有意义|坚持不下去了|结束这一切|死了就好了|我曾经自杀过|我以前试过自杀"],
  [2, "自杀方法", "安眠药|刀片|毒药|服药|割手臂|煤气|美工刀|溺水|农药|跳下去|用刀|窒息|撞车"],
  [2, "自杀计划与准备", "安排好一切|藏药|查了很多资料|等大家都睡了|等他们不在家|定好了时间|东西已经收拾好了|囤药|该交代的都交代了|工具准备好了|计划好了|交代后事|买绳子|选好地点|选好了地方|选好了日子|已经决定了|约好了|攒药|找好了地方|准备刀片|准备好了"],
  [2, "自杀计划与准备 / 告别行为", "遗嘱"],
  [2, "自伤行为", "拔头发|不吃饭惩罚自己|不让自己伤口愈合|惩罚自己|打自己|打自己耳光|非自杀性自伤|割大腿|割得不够深|割肚子|割手|割自己|故意不吃药|划大腿|划口子|划伤手臂|划伤自己|划手臂|看着血流出来|抠伤口|烙伤|掐自己|扇自己耳光|伤害自己是应该的|烧伤自己|身体痛比心里痛好|烫自己|疼痛让我感觉活着|我不配活着|享受疼痛|想感受疼痛|血让我平静|烟头烫|咬伤自己|咬自己|用头撞|再割深一点|只有这样才能好受点|抓破|抓伤自己|撞墙|自残|自虐|自伤|cut myself"],
  [3, "告别行为", "把东西整理好|东西送给|对不起|该来的总会来|感谢你们的陪伴|命该如此|清空账号|删除聊天记录|我会想你们的|谢谢你们|谢谢你一直陪我|要开心|缘分尽了|账号密码|照顾好自己|注销社交账号"],
  [3, "精神障碍", "暴食|被害妄想|边缘型人格|不是自己|痴呆|创伤后应激|催吐|赌博成瘾|多动症|噩梦障碍|反社会人格|疯了|孤独症|幻觉|幻视|幻听|记忆力衰退|焦虑症|解离|进食障碍|惊恐发作|精神病|精神分裂|酒精依赖|控制不住自己|梦魇|脑子有问题|强迫思维|强迫症|躯体化|人格解体|人格障碍|认知障碍|失常|失眠症|失去理智|适应障碍|双相|贪食|网瘾|妄想|无法思考|物质依赖|吸毒|现实解体|像变了一个人|厌食|药物滥用|疑病症|抑郁|抑郁发作|抑郁症|游戏成瘾|躁狂|躁郁症|重度抑郁|自闭症|自恋型人格|ADHD|PTSD"],
  [3, "情绪危机信号", "爱怎样怎样|暴躁|悲伤|被抛弃|崩溃|不安|不想动|彻底失败|撑不住了|吃不下饭|丢脸|动力|都是我造成的|度日如年|对不起所有人|多余|恶心自己|噩梦|乏力|烦躁|反应迟钝|废物|愤怒|负罪感|孤单|孤独|害怕|恨|恨自己|后悔|活得很累|活受罪|记不住东西|煎熬|尽头|紧张|决定不了事情|绝境|扛不住了|空虚|恐慌|恐惧|垮了|累|麻木|没脸见人|没人懂我|没人理解|没胃口|没兴趣|没用|没有动力|没有感觉|没有精力|没有人帮我|难过|脑子转不动|内疚|情感麻木|情绪崩溃|情绪波动大|情绪不稳定|全完了|人生失败者|忍不住哭|身心俱疲|什么都不想做|失败|失眠|受不了了|输了一切|睡不着|死胡同|逃不掉了|讨厌自己|体重下降|听天由命|痛彻心扉|头疼|透不过气|拖油瓶|完了|我不配|我不值得|无法集中注意力|无力感|无能|无所谓了|想哭|心惊胆战|心口疼|心如刀割|心痛|心在滴血|行尸走肉|压抑|一无是处|以前喜欢的东西现在没感觉了|易激怒|有时兴奋有时低落|郁闷|怨恨|早醒|早知如此|窒息感|自卑|自责|坐立不安|shame"],
  [3, "情绪危机信号 / 精神障碍", "焦虑"],
  [3, "隐喻性表达", "安静|变成星星|尘归尘|沉睡|灯灭了|登仙|渡劫|该走了|告别|化身天使|画句号|回老家|来生|离开|离去|历劫|落幕|落叶归根|涅槃|去见上帝|人生重开|入土为安|删档重来|退游|下辈子|消失|销号|谢幕|羽化|远行|重开|转世|走到尽头|remake"],
  [3, "诱发因素", "癌症|霸凌|被背叛|被嘲笑|被出轨|被辞退|被分手|被孤立|被开除|被排挤|被曝光|被欺负|被歧视|被猥亵|丑闻|负债累累|挂科|官司|还不起|毁容|活不了多久|家暴|键盘侠|绝症|考砸了|离婚了|离世|没考上|没钱治病|名誉扫地|虐待|朋友去世|贫困|破产|欠债|强奸|亲人去世|去世|去世了|确诊|人肉|伤残|社会性死亡|社死|身败名裂|失恋|失去了他|失去了她|失业|瘫痪|童年创伤|网暴|刑事拘留|性侵|舆论|再也见不到|找不到工作|治不好了|走了|坐牢"],
  [3, "约死行为", "暗黑系|崔雪莉|存在主义|梵高|哥特|顾城|海子|黑界|荒诞|结伴而行|金钟铉|尼采|人间失格|丧文化|生而为人对不起|叔本华|死亡美学|太宰治|网戒|西西弗斯|虚无主义|抑郁症群|豫章书院|张国荣|组队"],
  [3, "直接自杀意念", "筋疲力尽|上次没成功|受够了|真的太累了"],
  [3, "直接自杀意念 / 情绪危机信号", "心力交瘁"]];
const CW_LV = { 1: '一级', 2: '二级', 3: '三级' }, CW_LVD = { 1: '重点风险信号', 2: '风险相关信号', 3: '关注信号' };
const CW19L = {}, CW19C = {}; CW19.forEach(([l, c, s]) => s.split('|').forEach(w => { CW19L[w] = l; CW19C[w] = c; }));
const CW19W = Object.keys(CW19L);
if (!RULES.cw19) { CRISIS_WORDS.splice(0, CRISIS_WORDS.length, ...CW19W); RULES.cw19 = 1; RULES.cwL = {}; }
const cwL = w => (RULES.cwL || {})[w] || CW19L[w] || 1;
const cwCat = w => CW19C[w] || '自己添加';
/* 文本标准化（全角转半角、大小写、空格）；否定说法：词前面同一句里 4 个字以内有「不、没、没有、不会、并非、否认」就不算命中 */
const cwNorm = x => String(x == null ? '' : x).replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/　|\s+/g, '').toLowerCase();
const CW_NEG = /不|没|并非|否认/;
const cwNeg = (t, i) => { const pre = t.slice(Math.max(0, i - 4), i).split(/[，。！？；、,.!?;…]/).pop(); return CW_NEG.test(pre); };
const cwFind = x => { const t = cwNorm(x), hit = [], neg = [];
  CRISIS_WORDS.forEach(w => { const k = cwNorm(w); if (!k) return; let i = t.indexOf(k), any = false, ok = false; while (i >= 0) { any = true; if (!cwNeg(t, i)) { ok = true; break; } i = t.indexOf(k, i + 1); } if (ok) hit.push(w); else if (any) neg.push(w); });
  return { hit, neg }; };
/* 一级、二级命中才算「有安全相关的表达」；三级只记为辅助信号 */
TALK_RE.test = x => { const { hit } = cwFind(x); if (hit.length) cwHits.push(...hit); return hit.some(w => cwL(w) <= 2); };
const _nc19 = newCrisis; newCrisis = function (s, src, type, urgent, words) {
  const hits = words || cwHits;
  if (/谈话记录|追加/.test(src || '') && hits.length) urgent = hits.some(w => cwL(w) === 1);
  const keep = cwHits; cwHits = []; try { return _nc19.call(this, s, src, type, urgent); } finally { cwHits = keep; } };

const cwPage19 = () => { const ed = S.role === 'L3', F = S.form, q = cwNorm(S.f.cwq || ''), open = S.cwOpen || {};
  const words = CRISIS_WORDS.map((w, i) => [w, i]).filter(([w]) => !q || cwNorm(w).includes(q));
  const chip = (w, i, l) => `<span class="chip">${esc(w)}${ed ? `${l > 1 ? `<button class="lnk" data-act="cwLv19" data-arg="${i}|-1" title="升为${CW_LV[l - 1]}">↑</button>` : ''}${l < 3 ? `<button class="lnk" data-act="cwLv19" data-arg="${i}|1" title="降为${CW_LV[l + 1]}">↓</button>` : ''}<button class="lnk" data-act="cwDel" data-arg="${i}" title="删除">×</button>` : ''}</span>`;
  const lvCard = l => { const L = words.filter(([w]) => cwL(w) === l), cats = {}; L.forEach(x => (cats[cwCat(x[0])] = cats[cwCat(x[0])] || []).push(x)); const all = q || open[l], cut = 12;
    const what = { 1: `保存时立即报告紧急情况，${RULES.urgentMin} 分钟内确认`, 2: `保存时报告，按一般时限 ${RULES.esc} 小时内确认`, 3: '只记为辅助信号，不单独报告' }[l];
    return `<div class="card"><h3>${CW_LV[l]} · ${CW_LVD[l]}（${L.length}）<span class="sp"></span><small>${what}</small></h3>
      ${Object.entries(cats).map(([c, xs]) => `<div class="cwg"><small>${esc(c)}（${xs.length}）</small><div class="chips cwl">${(all ? xs : xs.slice(0, cut)).map(([w, i]) => chip(w, i, l)).join('')}${!all && xs.length > cut ? `<span class="note">还有 ${xs.length - cut} 个</span>` : ''}</div></div>`).join('') || '<span class="note">没有符合的词</span>'}
      ${!q && L.length > 12 ? `<button class="btn ghost xs" data-act="cwOpen" data-arg="${l}">${open[l] ? '收起' : `展开全部 ${L.length} 个`}</button>` : ''}</div>`; };
  const miss = CW19W.filter(w => !CRISIS_WORDS.includes(w)).length;
  const fz = (cwPage2().match(/<div class="card"><h3>危机期间的谈心[\s\S]*$/) || [''])[0];
  return `<p class="intro">${I('info', 's')}<span>谈话记录、追加内容里出现这些词时按等级处理：<b>一级</b>立即报告紧急情况（${RULES.urgentMin} 分钟内确认），<b>二级</b>报告并按一般时限（${RULES.esc} 小时）确认，<b>三级</b>只记为辅助信号、不单独报告。词前面是否定说法（不、没、没有、不会、并非、否认）时不触发。默认清单来自「风险词分级定稿」；学生端和小屿对话的识别规则不在这里改。词库由心理中心负责人、高级咨询师维护，改动记入操作记录。</span></p>
    <div class="filters"><input class="in" style="width:240px" data-bind="f.cwq" data-rerender placeholder="搜一个词" value="${esc(S.f.cwq || '')}"><span class="note">共 ${CRISIS_WORDS.length} 个词${q ? ` · 符合 ${words.length} 个` : ''}</span></div>
    ${[1, 2, 3].map(lvCard).join('')}
    ${ed ? `<div class="card"><h3>添加<span class="sp"></span>${miss ? `<button class="btn sec xs" data-act="cwDef19">恢复默认清单里删掉的词（${miss} 个）</button>` : '<small>默认清单的词都在</small>'}</h3>
      <div class="g2 grid"><div>${fld('加一个词', `<div class="filters" style="margin:0"><input class="in" style="width:200px" data-bind="form.cw" placeholder="例如：撑不下去" value="${esc(F.cw || '')}"><div class="opts">${[1, 2, 3].map(l => `<button class="${(+F.cwl || 1) === l ? 'on' : ''}" data-act="fset" data-arg="cwl|${l}">${CW_LV[l]}</button>`).join('')}</div><button class="btn sec xs" data-act="cwAdd19">添加</button></div>`)}</div>
      <div>${fld('批量导入（一行一个词，后面写「，一级」「，二级」或「，三级」，不写按一级）', `<textarea data-bind="form.cwb" rows="4" placeholder="不想活了，一级&#10;撑不下去，二级">${esc(F.cwb || '')}</textarea><div style="margin-top:6px"><button class="btn sec xs" data-act="cwImp19">导入</button></div>`)}</div></div></div>` : '<p class="note">只有心理中心负责人、高级咨询师可以修改。</p>'}${fz}`; };
const cwLvOf = t => ({ 一级: 1, 二级: 2, 三级: 3, 1: 1, 2: 2, 3: 3, 高: 1, 中: 2 })[t];
Object.assign(ACT, {
  cwOpen(l) { S.cwOpen = Object.assign({}, S.cwOpen, { [l]: !(S.cwOpen || {})[l] }); },
  cwLv19(a) { const [i, d] = a.split('|'), w = CRISIS_WORDS[+i], was = cwL(w), l = Math.min(3, Math.max(1, was + +d)); if (!w || l === was) return; RULES.cwL = RULES.cwL || {}; RULES.cwL[w] = l;
    log(`危机词库 ·「${w}」${CW_LV[was]} → ${CW_LV[l]}`, null, { cat: '配置', obj: '危机词库' }); toast('已改，之后保存的记录按新等级'); },
  cwAdd19() { const w = (S.form.cw || '').trim(), l = +S.form.cwl || 1; if (!w) return toast('请写一个词'); if (w.length < 2) return toast('至少两个字，太短容易误报'); if (CRISIS_WORDS.includes(w)) return toast('词库里已经有了');
    CRISIS_WORDS.push(w); RULES.cwL = RULES.cwL || {}; RULES.cwL[w] = l; S.form.cw = ''; log(`危机词库 · 添加「${w}」（${CW_LV[l]}）`, null, { cat: '配置', obj: '危机词库' }); toast('已添加'); },
  cwImp19() { const L = (S.form.cwb || '').split(/\n+/).map(x => x.trim()).filter(Boolean), add = [], skip = [];
    L.forEach(x => { const m = x.match(/^(.+?)[，,\s]+(一级|二级|三级|[123]|高|中)$/), w = (m ? m[1] : x).trim(), l = m ? cwLvOf(m[2]) : 1; if (w.length < 2 || CRISIS_WORDS.includes(w)) { skip.push(w); return; } CRISIS_WORDS.push(w); RULES.cwL = RULES.cwL || {}; RULES.cwL[w] = l; add.push(`${w}（${CW_LV[l]}）`); });
    if (!add.length) return toast(L.length ? '都已经在词库里，或少于两个字' : '请先粘贴要导入的词'); S.form.cwb = ''; log(`危机词库 · 批量导入 ${add.length} 个：${add.join('、')}`, null, { cat: '配置', obj: '危机词库' }); toast(`已导入 ${add.length} 个${skip.length ? `，跳过 ${skip.length} 个（重复或太短）` : ''}`); },
  cwDef19() { const add = CW19W.filter(w => !CRISIS_WORDS.includes(w)); add.forEach(w => CRISIS_WORDS.push(w)); log(`危机词库 · 恢复默认清单里的 ${add.length} 个词：${add.join('、')}`, null, { cat: '配置', obj: '危机词库' }); toast(`已恢复 ${add.length} 个`); } });

/* ---------- 2. 所有预约都要老师确认 ---------- */
if (!RULES.allConfirm) { BOOK.forEach(b => { b.fresh = false; }); RULES.allConfirm = 1; }
if (typeof LY_in === 'function') {
  const _lyIn19 = LY_in; LY_in = function (ev) { if (ev.t === 'intake' && (!ev.intake || !['sent', 'skipped'].includes(ev.intake.st))) return ''; if (ev.t !== 'book') return _lyIn19(ev);
    const r = _lyIn19(ev), s = LY_CORE()[ev.core], b = s && lyBook(s); if (!b || b.cid !== ev.cid || b.day !== lyDay(ev.date) || b.t !== ev.ti) return r;
    if (b.st === 'ok' && b.fresh) { b.st = 'confirm'; b.fresh = false; if (S.uid) render(); }
    if (ev.inv) b.src = '主动邀约';
    return `${s.name} 提交了预约申请，已出现在 ${ST(b.cid).name} 的「待确认申请」里`; };
}
const _zBook19 = ACT.zBook; ACT.zBook = function () { const n0 = BOOK.length, t0 = toast; let msg = ''; toast = m => { msg = m; }; try { _zBook19.apply(this, arguments); } finally { toast = t0; }
  BOOK.slice(n0).forEach(b => { b.st = 'confirm'; b.fresh = false; }); const n = BOOK.length - n0;
  toast(n ? `学生提交了 ${n} 个预约申请，出现在咨询师的「待确认申请」里（都满足提前 24 小时）` : msg); };

/* ---------- 3. 号池、主动邀约批次（演示数据；数字都是可调的默认值） ---------- */
RULES.pool = RULES.pool || { inv: 20, hold: 4, ivLv: 3, col: {}, apps: [], R: 120, FIX: 50 };
const poolN = () => ivPool();
const IV_ST = { new: ['未发卡', ''], sent: ['已发卡 · 待回复', 'w'], no: ['这次不参加', ''], late: ['没回复', 'r'], ik: ['预咨询中', 'p'], queue: ['排队等入口', 'w'], entry: ['有入口 · 待选时间', 'p'], sub: ['已申请 · 待老师确认', 'w'], ok: ['已确认', 'g'], nofit: ['时间都不合适', 'w'], adjust: ['中心调整 · 待重新安排', 'w'] };
const IV_KPI = [['sent', '已发卡'], ['acc', '接受'], ['no', '不参加'], ['ik', '预咨询中'], ['queue', '排队等入口'], ['entry', '有入口'], ['sub', '已申请'], ['ok', '已确认']];
const ivResp = s => { const c = s.owner || s.assignee; return c && STAFF[c] && ['L2', 'L3'].includes(STAFF[c].role) ? c : l2For(s); };
const IK_DEMO = [{ topics: ['情绪低落', '睡眠'], trouble: '最近总是提不起劲，晚上很晚才睡着，早上起不来，课也落下了', dur: '一个月左右', impact: '影响很大', sleep: '变化很大', support: '不太确定', expect: '想有人听我说说', extra: '' },
  { topics: ['学业压力'], trouble: '期中考试没考好，觉得自己跟不上，越想越焦虑', dur: '一两周', impact: '有些影响', sleep: '有些变化', support: '有', expect: '想要具体的建议', extra: '希望能约晚一点的时间' },
  { topics: ['人际关系', '情绪低落'], trouble: '和室友闹得很僵，回宿舍就很压抑', dur: '几个月', impact: '有些影响', sleep: '有些变化', support: '没有', expect: '想解决一个具体问题', extra: '' }];
const ikSum = (o, qs) => (qs || RULES.ikh.t1).map(q => ({ k: q.k, name: q.name, v: Array.isArray(o[q.k]) ? o[q.k].join('、') : o[q.k] || '' }));
let IVB = null;
const ivb = () => { if (IVB) return IVB; if (RULES.ivb) return IVB = RULES.ivb;
  const crisis = s => CRISES.some(k => k.sid === s.id && k.st !== 'closed');
  const C = SURV().filter(s => curLv(s) >= RULES.pool.ivLv).sort((a, b) => curLv(b) - curLv(a) || (a.done || 0) - (b.done || 0));
  const skip = C.filter(crisis), has = C.filter(s => !crisis(s) && activeBook(s)), inn = C.filter(s => !crisis(s) && !activeBook(s));
  const pat = ['ok', 'ok', 'sub', 'sub', 'entry', 'entry', 'entry', 'queue', 'queue', 'queue', 'ik', 'ik', 'sent', 'sent', 'sent', 'sent', 'no', 'no'];
  const list = inn.map((s, i) => { const st = pat[i] || 'new', x = { sid: s.id, lv: curLv(s), st, resp: ivResp(s), at: st === 'new' ? null : ago(30), due: st === 'new' ? null : `${new Date(NOW - 30 * H + 48 * H).getMonth() + 1}/${new Date(NOW - 30 * H + 48 * H).getDate()} ${new Date(NOW - 30 * H + 48 * H).getHours()}:00` };
    if (['queue', 'entry', 'sub', 'ok'].includes(st)) x.ik = i % 4 === 3 ? { st: 'skipped', at: ago(20) } : { st: 'sent', at: ago(26 - i), sum: ikSum(IK_DEMO[i % 3]), viewed: st === 'ok' };
    if (st === 'ik') x.ik = { st: 'draft', at: ago(3) };
    if (st === 'entry') x.edue = `${new Date(+NOW + 48 * H).getMonth() + 1}/${new Date(+NOW + 48 * H).getDate()} 18:00`;
    if (st === 'sub' || st === 'ok') { const cid = x.resp, k = openSlots(cid, 24)[i % 3]; if (k) { const [d, t] = k.split('-').map(Number);
      const b = { id: 'bv' + (i + 1), sid: s.id, cid, day: d, t, mode: '线下', kind: '预咨询', st: st === 'sub' ? 'confirm' : 'ok', src: '主动邀约', at: ago(st === 'sub' ? 5 : 20), req: null, intake: x.ik.sum ? { st: 'sent', at: x.ik.at, ver: 1, viewed: x.ik.viewed, mode: 'A', tk: 'h', sum: x.ik.sum } : { st: 'skipped', at: x.ik.at, ver: 1, mode: 'A' } };
      BOOK.push(b); setSlot(cid, d, t, 'bk'); x.bid = b.id; } else x.st = 'entry'; }
    return x; });
  IVB = RULES.ivb = { name: '2026 秋季普测 · 第 1 批', at: ago(30), by: 'c5', list, piles: { bad: [], skip: skip.map(s => ({ sid: s.id, why: '危机中，由危机流程接手' })), has: has.map(s => ({ sid: s.id, why: '已有在途预约，由负责老师确认是否用这次预约承接' })) } };
  return IVB; };
const ivDue = n => { const d = new Date(NOW); d.setDate(d.getDate() + n); return `${d.getMonth() + 1}/${d.getDate()} 18:00`; };
const ivMine = () => ivb().list.filter(x => S.role === 'L3' || x.resp === me());
const ivMatches = (x, k) => k === 'sent' ? x.st !== 'new' : k === 'acc' ? !!x.acceptedAt || ['ik', 'queue', 'entry', 'sub', 'ok', 'nofit'].includes(x.st) : x.st === k;
const ivCnt = L => Object.fromEntries(IV_KPI.map(([k]) => [k, L.filter(x => ivMatches(x, k)).length]));

/* 预咨询题库：普通咨询（原来的模板）、高危咨询（主动邀约来的学生用） */
const IKH_Q = ['topics', 'trouble', 'dur', 'impact', 'sleep', 'support', 'expect', 'extra'];
if (!RULES.ikh) { RULES.ikh = { ver: 1,
  open: '你好，我是预咨询小屿。心理中心邀请你聊一聊，在你选和老师见面的时间之前，我想先问你几个问题，大约 3 分钟。你的回答会整理好给之后接待你的老师看，只收集，不打分。',
  openEn: 'Hi, I’m Xiaoyu on the intake desk. UCC has invited you to talk. Before you pick a time to meet, I’d like to ask a few questions — about 3 minutes. Your answers go to the counsellor who meets you. Nothing is scored.',
  close: '谢谢你。我把你说的整理成了下面这张表，你可以直接修改，确认没问题再发给老师。发完就可以选和老师见面的时间了。',
  closeEn: 'Thank you. Here’s what you shared — edit anything you like, then send it. After that you can pick a time to meet.',
  t1: IKH_Q.map(k => iktClone(IKT_Q[k])), t2: [], t2on: false };
  RULES.ikh.hist = [{ ver: 1, at: ago(24 * 2), by: 'c5', note: '默认题库', snap: (({ hist, ...o }) => iktClone(o))(RULES.ikh) }]; }
RULES.iktN = RULES.iktN || RULES.ikt; RULES.ikt = RULES.iktN;   // 本机存的数据里两套题库是两个对象，换页签时 RULES.ikt 指向当前那套
const IKB = { n: RULES.iktN, h: RULES.ikh }, IKB_N = { n: '普通咨询', h: '高危咨询' };
let ikBankCur = 'n'; const iktDs = {};
const ikBankSet = k => { if (ikBankCur === k) return; iktDs[ikBankCur] = S.iktD; S.iktD = iktDs[k] || null; RULES.ikt = IKB[k]; ikBankCur = k; };
const bankSnap = k => { const o = iktClone(IKB[k]); delete o.hist; return o; };
['iktSave', 'iktRestore'].forEach(n => { const f = ACT[n]; ACT[n] = function () { const a0 = AUDIT[0], r = f.apply(this, arguments); if (AUDIT[0] !== a0 && AUDIT[0]) AUDIT[0].t = AUDIT[0].t.replace('预咨询模板', `预咨询题库 · ${IKB_N[ikBankCur]}`); return r; }; });
if (typeof LY_snap === 'function') { const _lySnap19 = LY_snap; LY_snap = function () { const o = _lySnap19(); o.__cfg = Object.assign({}, o.__cfg, { ikt: bankSnap('n'), ikh: bankSnap('h') }); return o; }; }

/* ---------- 4. 「预约咨询」5 个页签（按学生走的顺序） ---------- */
const BKT = [['inv', '主动邀约'], ['ai', 'AI 预咨询'], ['man', '人工咨询'], ['sched', '排班表'], ['pool', '号池配置']];
const bkTab = () => { const t = ({ list: 'man' })[S.tabs.booking] || S.tabs.booking; return BKT.some(x => x[0] === t) ? t : S.role === 'L3' ? 'inv' : 'man'; };
const _booking18 = booking; booking = function () { if (isL1()) return _booking18();
  const tab = bkTab(); S.tabs.booking = tab;
  const top = `<div class="tabs">${BKT.map(([k, n]) => { const c = k === 'man' ? BOOK.filter(b => b.st === 'confirm' && (S.role === 'L3' || b.cid === me())).length : 0; return `<button class="${tab === k ? 'on' : ''}" data-act="btab" data-arg="${k}">${n}${c ? `<i class="r">${c}</i>` : ''}</button>`; }).join('')}</div>`;
  return top + ({ inv: bkInv, ai: bkAi, man: bkMan, sched: bkSched, pool: bkPool })[tab](); };
PAGES.booking = booking;
const bkBtnFix = h => h.replace(/>改约<\/button>/g, '>改时间</button>').replace(/(<button class="btn pri xs" data-act="bOk" data-arg="([^"]+)">确认<\/button>)/g, (m, a, id) => { const b = BOOK.find(x => x.id === id); return `<button class="btn ghost xs" data-act="bOpen" data-arg="${id}">看学生信息</button> ${a}`; });

/* 人工咨询：最上面是待确认的申请，下面是已约、改期取消、待写记录、待办池 */
const bkMan = () => { const r = S.role; let list = BOOK.slice(); if (r === 'L2') list = list.filter(b => b.cid === me());
  const F = { adjust: b => b.st === 'adjust', change: b => b.st === 'change', ok: b => b.st === 'ok', record: b => b.st === 'record', pool: b => b.st === 'pool', all: () => true };
  const subs = [['ok', '已约'], ['adjust', '中心调整 · 待重新安排'], ['change', '改期 / 取消申请'], ['record', '待写记录'], ...(r === 'L3' ? [['pool', '待办池']] : []), ['all', '全部']];
  const sub = subs.some(x => x[0] === S.tabs.bsub) ? S.tabs.bsub : 'ok', pend = list.filter(b => ['confirm', 'move'].includes(b.st));
  const unpub = UNPUB().filter(u => r === 'L3' || u.cid === me()).map(u => `${ST(u.cid).name} ${u.day}`).join('、');
  return (unpub ? `<div class="head n" style="padding:10px 16px">${I('cal')}<div class="grow"><b style="font-size:13.5px">请提前 2 天提交排班：${unpub} 还没有开放任何时段</b></div><button class="btn sec xs" data-act="btab" data-arg="sched">去排班</button></div>` : '') +
    `<div class="card bkpin"><h3>${I('inbox')}待确认申请（${pend.length}）<span class="sp"></span><small>学生提交的是申请，老师确认后才算约好</small></h3>${pend.length ? bkBtnFix(bookTable(pend)) : `<div class="empty"><img src="${MASCOT}" alt="">没有等你确认的申请</div>`}
      <p class="note">打开申请能看到这个学生的预咨询摘要、普测结果和档案，能看到哪些按你的账号权限；每次查看记入操作记录。<b>确认</b>后变成正式预约；<b>改时间</b>要学生再确认一次；<b>婉拒</b>写一句原因，学生回到选时间那一步。</p></div>
    <div class="card"><div class="tabs">${subs.map(([k, n]) => `<button class="${sub === k ? 'on' : ''}" data-act="bsub" data-arg="${k}">${n}<i class="${k === 'pool' && list.filter(F[k]).length ? 'r' : ''}">${list.filter(F[k]).length}</i></button>`).join('')}</div>${bookTable(list.filter(F[sub]))}
    <p class="note" style="margin-top:10px">规则：所有预约都要老师确认，学生自己约普通号和主动邀约来的学生都一样。提前 24 小时预约；学生每 14 天可改期、取消各 1 次（老师改约不计）。确认时限：危机 ${RULES.lim.book5} 小时，其余 ${RULES.lim.book} 小时；超时自动进入待办池，由中心负责人指派。</p></div>`; };

/* 主动邀约：批次、核对四堆、发邀约卡、进度、容量缺口、申请额度 */
const bkInv = () => { const B = ivb(), L = ivMine(), c = ivCnt(L), P = poolN(), wait = ivb().list.filter(x => ['new', 'sent', 'ik', 'queue'].includes(x.st)).length, gap = Math.max(0, B.list.filter(x => !['no', 'ok'].includes(x.st)).length - P.can - B.list.filter(x => x.st === 'sub').length);
  const f = S.f.ivst || '', rows = L.filter(x => !f || ivMatches(x, f)), nNew = L.filter(x => x.st === 'new').length, tiers = [...new Set(L.filter(x => x.st === 'new').map(x => x.lv >= 4 ? 4 : x.lv))];
  return `<p class="intro">${I('info', 's')}<span>普测命中主动邀约等级（${RULES.pool.ivLv} 级及以上，在「号池配置」里设）的学生，由老师按批确认后发<b>邀约卡</b>。学生接受后马上做 AI 预咨询（不占号），做完按顺序自动拿到<b>人工预约入口</b>，号不够就排队。邀约卡和入口的 24 小时提醒按规则自动发；普测结束后系统不会主动给任何学生发卡。</span></p>
    <div class="card"><h3>${I('users')}${B.name}<span class="sp"></span><small>${fmt(B.at)} 由 ${ST(B.by).name} 建 · ${S.role === 'L3' ? '全部学生' : '你负责的学生'}</small>${S.role === 'L3' ? `<button class="btn sec xs" data-act="mo" data-arg="ivAdd:">${I('plus', 's')}加学生</button>` : ''}</h3>
      <div class="kv"><span>核对结果</span><b>进入批次 ${B.list.length} 人 · 对不上 ${B.piles.bad.length} · 不走预约队列 ${B.piles.skip.length}（${B.piles.skip.map(x => `${nm(SU(x.sid))}：${x.why}`).join('；') || '—'}） · 已有安排 ${B.piles.has.length}${B.piles.has.length ? `（${B.piles.has.map(x => nm(SU(x.sid))).join('、')}，已有在途预约）` : ''}</b></div>
      <div class="grid g4" style="margin:12px 0">${IV_KPI.map(([k, n]) => `<button class="kpi ${f === k ? 'on' : ''}" data-act="ivF" data-arg="${k}"><small>${n}</small><b>${c[k]}</b><span>${k === 'sent' ? `累计发出 · 本批共 ${L.length} 人` : k === 'acc' ? `累计接受率 ${c.sent ? Math.round(c.acc / c.sent * 100) : 0}%` : k === 'ok' ? `成功率 ${c.ok + c.sub + c.entry ? Math.round(c.ok / (c.ok + c.sub + c.entry) * 100) : 0}%` : '点这里筛选'}</span></button>`).join('')}</div>
      <div class="dbox ${gap ? 'warn' : ''}"><b>${I('alert', 's')}容量缺口</b><p style="margin:4px 0 0">本批 ${B.list.length} 人，已确认 ${c.ok} 人、不参加 ${c.no} 人；本窗口尚可承接 ${P.can + B.list.filter(x => x.st === 'sub').length} 人（含申请中为学生保留的时段）${gap ? `，<b>至少 ${gap} 人这一窗口约不上</b>。缺口由中心负责人处理：分阶段排到下一个 30 天、加排班、转辅导员谈心或团体辅导，或继续等（负责老师按等待期限复核）。` : '，够用。'}</p>
        <div style="margin-top:8px;display:flex;gap:8px">${S.role === 'L3' && gap ? `<button class="btn sec xs" data-act="btab" data-arg="pool">去号池配置调额度</button>` : ''}<button class="btn sec xs" data-act="mo" data-arg="ivApp:">申请额度</button></div></div></div>
    <div class="card"><h3>名单<span class="sp"></span>${f ? `<button class="btn ghost xs" data-act="ivF" data-arg="">看全部</button>` : ''}${nNew ? `${tiers.map(t => `<button class="btn sec xs" data-act="mo" data-arg="ivSend:${t}">只发 ${t >= 4 ? '4 级及以上' : `${t} 级`}（${L.filter(x => x.st === 'new' && (t >= 4 ? x.lv >= 4 : x.lv === t)).length}）</button>`).join('')}<button class="btn pri xs" data-act="mo" data-arg="ivSend:all">发邀约卡（${nNew} 人）</button>` : ''}</h3>
      <table class="t"><tr><th>学生</th><th>等级</th><th>负责老师</th><th>状态</th><th>截止</th><th>预咨询</th></tr>${rows.map(x => { const s = SU(x.sid), it = x.ik, [t, cl] = IV_ST[x.st];
        return `<tr><td><b>${nm(s)}</b><small>${s.college}</small></td><td>${lvV(s)}</td><td>${ST(x.resp).name}</td><td><span class="pill ${cl}">${t}</span></td><td>${x.st === 'entry' ? `入口 ${x.edue}` : x.st === 'sent' ? `回复 ${x.due}` : x.st === 'nofit' ? esc((x.fit || []).join('、')) : '—'}</td><td>${it && it.sum ? `<button class="lnk" data-act="mo" data-arg="ivIk:${x.sid}">${I('chat', 's')}看摘要</button>` : it ? `<span class="note">${{ skipped: '跳过了', draft: '已保存，未发送' }[it.st] || '—'}</span>` : '—'}${['nofit', 'late', 'adjust'].includes(x.st) ? `<button class="btn sec xs" data-act="ivReentry" data-arg="${x.id}">重新提供入口</button>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="6" class="note">没有符合的学生</td></tr>'}</table>
      <p class="note">顺序：先按等级分档（4 级及以上一档、3 级一档），同档按普测完成时间。邀约卡 48 小时有效，人工入口 48 小时内要提交申请；到期没处理的回到负责老师那里，由老师决定是否再发。</p></div>`; };

/* R4：未发送草稿不进入机构端个案数据；清理旧演示版本已泄露的草稿。 */
BOOK.forEach(b => { if (b.intake && b.intake.st === 'draft') b.intake = { st: 'none', ver: 0 }; });
/* AI 预咨询：摘要 + 题库配置 */
const aiRows = () => { const R = [];
  BOOK.filter(b => b.intake && b.intake.st && ['sent', 'skipped'].includes(b.intake.st) && ['confirm', 'ok', 'change', 'record', 'pool', 'done'].includes(b.st) && ikMayView(b)).forEach(b => R.push({ sid: b.sid, src: b.src === '主动邀约' ? '主动邀约' : '自己约普通号', it: b.intake, b, booked: true }));
  ivMine().filter(x => x.ik && !x.bid).forEach(x => R.push({ sid: x.sid, src: '主动邀约', it: x.ik, booked: false }));
  return R; };
const bkAi = () => { const sub = S.tabs.aisub || 'sum';
  const head = `<div class="stabs">${[['sum', '预咨询摘要'], ['bank', '题库配置']].map(([k, n]) => `<button class="${sub === k ? 'on' : ''}" data-act="aisub" data-arg="${k}">${n}</button>`).join('')}</div>`;
  if (sub === 'bank') return `<div class="card">${head}${bankPage()}</div>`;
  const f = S.f, R = aiRows().filter(r => (!f.aisrc || r.src === f.aisrc) && (!f.aicol || SU(r.sid).college === f.aicol) && (!f.aibk || (f.aibk === 'y') === r.booked));
  const tag = r => { const it = r.it, t = []; if (it.st === 'sent' && !it.viewed) t.push('<span class="pill p">新</span>'); if (it.newAdd) t.push('<span class="pill w">有新追加</span>'); if (it.crisis) t.push('<span class="pill r">出现危机表达</span>'); if (it.st === 'skipped') t.push('<span class="pill">跳过了</span>'); if (it.st === 'draft') t.push('<span class="pill">已保存，未发送</span>'); return t.join(' '); };
  return `<div class="card">${head}<p class="intro">${I('info', 's')}<span>主动邀约来的、自己约普通号来的学生做完的预咨询都在这里。只收集，不评分，不改变等级；辅导员看不到。打开摘要记入操作记录。</span></p>
    <div class="filters"><select data-bind="f.aisrc" data-rerender><option value="">全部来源</option>${['主动邀约', '自己约普通号'].map(x => `<option ${f.aisrc === x ? 'selected' : ''}>${x}</option>`).join('')}</select><select data-bind="f.aicol" data-rerender><option value="">全部学院</option>${COLLEGES.map(c => `<option ${f.aicol === c ? 'selected' : ''}>${c}</option>`).join('')}</select><select data-bind="f.aibk" data-rerender><option value="">约没约都看</option><option value="y" ${f.aibk === 'y' ? 'selected' : ''}>已提交预约</option><option value="n" ${f.aibk === 'n' ? 'selected' : ''}>还没约</option></select><span class="note">${R.length} 人</span></div>
    <table class="t"><tr><th>学生</th><th>来源</th><th>时间</th><th>标记</th><th>预约</th><th></th></tr>${R.map(r => { const s = SU(r.sid);
      return `<tr><td><b>${nm(s)}</b><small>${s.college}</small></td><td>${r.src}</td><td>${r.it.at ? fmt(new Date(r.it.at)) : '—'}</td><td>${tag(r)}</td><td>${r.b ? `${slotTxt(r.b)} · ${ST(r.b.cid).name}${BST[r.b.st] ? ' ' + BST[r.b.st] : ''}` : '<span class="note">还没约</span>'}</td><td>${r.it.sum ? `<button class="btn ghost xs" data-act="mo" data-arg="${r.b ? `intake:${r.b.id}` : `ivIk:${r.sid}`}">看摘要</button>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="6" class="note">没有符合的记录</td></tr>'}</table></div>`; };
const _ikS19 = intakeSettings; intakeSettings = function () { const h = _ikS19(), P = h.split('<div class="card">');
  if (!S._ikBankView) return P[0] + '<div class="card">' + P[1] + (iktDirty() ? `<div class="iktbar"><span class="note" style="color:var(--warn)">有未保存的修改</span><span class="sp"></span><button class="btn ghost" data-act="iktUndo">放弃修改</button><button class="btn pri" data-act="iktSave">保存</button></div>` : '') + `<div class="card"><h3>题目和开场白</h3><p class="note" style="margin:0">题目、开场白和版本记录挪到了「预约咨询 · AI 预咨询 · 题库配置」，分普通咨询、高危咨询两套，由中心负责人维护。</p></div>`;
  let body = P.slice(2).map(x => '<div class="card">' + x).join(''); if (ikBankCur === 'h') body = body.replace(/<div class="tabs">[\s\S]*?<\/div>/, '').replace('一次只问一道题；', '主动邀约的学生接受邀约后马上做；一次只问一道题；').replace('开场白（学生提交预约后看到的大窗口）', '开场白（学生接受邀约后，显示在第一题上面）').replace('可以用的变量：{接待老师}、{上次聊到的话题}。', '这时还没有接待老师，开场白里不要用 {接待老师}。');
  return `<p class="intro">${I('info', 's')}<span>${ikBankCur === 'h' ? '高危咨询题库：主动邀约来的学生接受邀约后马上做，做完再拿人工预约入口。' : '普通咨询题库：学生自己约普通号，提交申请后默认请他做一次，可以跳过。'}两套各自有版本、预览、恢复。只收集，不评分，不改变等级。${iktEdC() ? '' : '只有中心负责人能修改。'}</span></p>` + body; };
const bankPage = () => { const k = S.ikBank || 'n'; let h; S._ikBankView = 1; try { h = intakeSettings(); } finally { S._ikBankView = 0; }
  return `<div class="tabs">${Object.entries(IKB_N).map(([b, n]) => `<button class="${k === b ? 'on' : ''}" data-act="ikBank" data-arg="${b}">${n}（第 ${IKB[b].ver} 版 · ${IKB[b].t1.length} 题）</button>`).join('')}</div>${h}`; };
const _rB19 = render; render = function () { ikBankSet(S.page === 'booking' && S.tabs.booking === 'ai' && S.tabs.aisub === 'bank' && S.ikBank === 'h' ? 'h' : 'n'); return _rB19.apply(this, arguments); };

/* 排班表：咨询排班 + 值班表（从「设置 · 成员管理」挪过来）+ 工作量 + 改班和停诊登记 */
const bkSched = () => { const ed = S.role === 'L3', wk = ['c1', 'c2', 'c3', 'c4', 'c5'].map(c => [c, BOOK.filter(b => b.cid === c && ['ok', 'confirm', 'change'].includes(b.st)).length, SCHED[c].flat().filter(v => v === 'open').length]);
  const reg = (RULES.schedLog || []).slice().reverse();
  return (S.role === 'L3' ? schedGroup() : sched()) +
    `<div class="grid g2" style="margin-top:16px"><div class="card"><h3>${I('alert', 's')}值班表<span class="sp"></span><small>${ed ? '中心负责人可改，改动记入操作记录' : '只读'}</small></h3>
      <table class="t"><tr><th>周</th><th>值班咨询师（第一通知对象）</th><th>升级对象</th></tr>${DUTY.map((d, i) => `<tr><td>${d.wk}</td><td><select data-bind="duty.${i}" data-rerender ${ed ? '' : 'disabled'}>${['c4', 'c5'].map(x => `<option value="${x}" ${d.who === x ? 'selected' : ''}>${ST(x).name}</option>`).join('')}</select></td><td>${RULES.esc} 小时 → 中心负责人 · 12 小时 → 分管领导</td></tr>`).join('')}</table></div>
    <div class="card"><h3>工作量 · 本周<span class="sp"></span><small>已约 / 待确认 · 还开着的时段</small></h3><table class="t"><tr><th>咨询师</th><th>预约</th><th>开放时段</th></tr>${wk.map(([c, n, o]) => `<tr><td>${ST(c).name}</td><td>${n}</td><td>${o}</td></tr>`).join('')}</table></div></div>
    <div class="card" style="margin-top:16px"><h3>改班和停诊登记<span class="sp"></span><button class="btn sec xs" data-act="mo" data-arg="schedReg:">登记一次</button></h3>
      ${reg.length ? `<table class="t"><tr><th>登记时间</th><th>老师</th><th>类型</th><th>日期</th><th>说明</th></tr>${reg.map(x => `<tr><td>${fmt(new Date(x.at))}</td><td>${ST(x.cid).name}</td><td>${x.type}</td><td>${esc(x.day)}</td><td>${esc(x.why)}</td></tr>`).join('')}</table>` : '<p class="note" style="margin:0">还没有登记。</p>'}
      <p class="note">临时改班、病假停诊要登记，中心负责人会收到通知。受影响的预约记为「中心调整 · 待重新安排」，不算学生的「时间都不合适」。</p></div>`; };

/* 号池配置：中心负责人改，其他人只看 */
const bkPool = () => { const ed = S.role === 'L3', P = RULES.pool, N = poolN(), used = c => ivb().list.filter(x => x.st !== 'new' && SU(x.sid).college === c).length, dis = ed ? '' : 'disabled';
  return `<p class="intro">${I('info', 's')}<span>号按未来 30 天滚动开放，分<b>普通号</b>（学生自己约）和<b>主动邀约号</b>（只给收到邀约的学生）。AI 预咨询不占号。${ed ? '改动记入操作记录，并通知中心老师。' : '只有中心负责人能改，这里只读。'}</span></p>
    <div class="grid g2"><div class="card"><h3>普通号 / 主动邀约号比例</h3>
      <div class="opts">${[[80, '平时 80 / 20'], [50, '50 / 50'], [10, '普测期间 10 / 90']].map(([n, t]) => `<button class="${100 - P.inv === n ? 'on' : ''}" data-act="poolR" data-arg="${100 - n}" ${dis}>${t}</button>`).join('')}</div>
      <p style="font-size:13.5px;margin:10px 0 0">未来 30 天里能重新分配的号有 <b>${P.R}</b> 个，现在普通号 <b>${N.norm}</b> 个、主动邀约号 <b>${N.inv}</b> 个；另有 ${P.FIX} 个已约或正在保护邀约，不受影响。</p>
      <p class="note">系统不自动切换。普测开始和结束时会提醒中心负责人要不要调。</p></div>
    <div class="card"><h3>主动邀约号：可发 / 暂留</h3>
      <div class="kv"><span>可发额度</span><b>${N.can} 个</b><span>暂留额度</span><b>${N.hold} 个 · 留给之后才做完普测、可能更紧急的学生</b></div>
      ${ed ? `<div style="display:flex;gap:8px;margin-top:10px"><button class="btn sec xs" data-act="poolH" data-arg="-2" ${N.hold < 2 ? 'disabled' : ''}>放 2 个成可发</button><button class="btn ghost xs" data-act="poolH" data-arg="2" ${N.can < 2 ? 'disabled' : ''}>再留 2 个</button></div>` : ''}</div></div>
    <div class="grid g2" style="margin-top:16px"><div class="card"><h3>按学院分可发额度<span class="sp"></span><small>不填就是全中心共用</small></h3>
      <table class="t"><tr><th>学院</th><th>额度</th><th>已发邀约</th></tr>${COLLEGES.map(c => `<tr><td>${c}</td><td><input class="in" style="width:80px" type="number" min="0" data-pool="col|${c}" value="${P.col[c] ?? ''}" placeholder="共用" ${dis}></td><td>${used(c)}</td></tr>`).join('')}</table></div>
    <div class="card"><h3>申请卡（${P.apps.filter(a => a.st === 'wait').length} 待处理）</h3>
      ${P.apps.length ? `<table class="t"><tr><th>学院</th><th>要多少</th><th>为什么</th><th>申请人</th><th></th></tr>${P.apps.slice().reverse().map(a => `<tr><td>${a.col}</td><td>${a.n}</td><td>${esc(a.why)}</td><td>${ST(a.by).name}<small>${fmt(new Date(a.at))}</small></td><td>${a.st === 'wait' ? (ed ? `<button class="btn pri xs" data-act="poolAppOk" data-arg="${a.id}">从暂留里放</button> <button class="btn ghost xs" data-act="poolAppNo" data-arg="${a.id}">不批</button>` : '<span class="pill w">待处理</span>') : a.st === 'ok' ? '<span class="pill g">已批</span>' : '<span class="pill">未批</span>'}</td></tr>`).join('')}</table>` : '<p class="note" style="margin:0">还没有申请。发邀约的老师觉得额度不够，可以在「主动邀约」里点「申请额度」。</p>'}</div></div>
    <div class="card" style="margin-top:16px"><h3>主动邀约等级</h3><p style="font-size:13.5px;margin:0">普测命中 <select data-pool="ivLv" ${dis}>${[3, 4, 5].map(l => `<option value="${l}" ${P.ivLv === l ? 'selected' : ''}>${l} 级及以上</option>`).join('')}</select> 的学生可以进主动邀约批次。改了只影响之后新建的批次。</p></div>`; };
document.addEventListener('change', e => { const p = e.target.dataset.pool; if (!p || S.role !== 'L3') return; const P = RULES.pool, v = e.target.value;
  if (p === 'ivLv') { const was = P.ivLv; P.ivLv = +v; log(`号池配置 · 主动邀约等级：${was} 级及以上 → ${v} 级及以上`, null, { cat: '配置', obj: '号池' }); toast('已改，之后新建的批次按新等级'); }
  else { const c = p.split('|')[1], was = P.col[c]; if (v === '') delete P.col[c]; else P.col[c] = Math.max(0, +v); log(`号池配置 · ${c} 可发额度：${was ?? '共用'} → ${v === '' ? '共用' : v}`, null, { cat: '配置', obj: '号池' }); toast('已保存'); }
  render(); });
const poolNoti = t => ['c1', 'c2', 'c3', 'c4', 'c5'].filter(u => u !== me()).forEach(u => notify(u, '站内', t, null));
Object.assign(ACT, {
  btab(k) { S.tabs.booking = k; },
  aisub(k) { S.tabs.aisub = k; },
  ikBank(k) { if (iktDirty()) return toast('先保存或放弃这套题库的修改，再切换'); S.ikBank = k; },
  ivF(k) { S.f.ivst = S.f.ivst === k ? '' : k; },
  bOpen(id) { const b = BOOK.find(x => x.id === id); if (!b) return; log('查看预约申请（预咨询摘要、普测结果、档案，按账号权限）', SU(b.sid), { cat: '查看', noTl: 1 }); markViewed(b); ACT.open(b.sid); },
  poolR(v) { if (S.role !== 'L3') return; const P = RULES.pool, was = P.inv; if (+v === was) return; P.inv = +v; const N = poolN(); log(`号池配置 · 普通号 / 主动邀约号：${100 - was} / ${was} → ${100 - P.inv} / ${P.inv}（普通号 ${N.norm} 个、主动邀约号 ${N.inv} 个）`, null, { cat: '配置', obj: '号池' }); poolNoti(`号池比例调整为普通 ${100 - P.inv} / 主动邀约 ${P.inv}`); toast('已调整，已通知中心老师'); },
  poolH(d) { if (S.role !== 'L3') return; const P = RULES.pool, was = P.hold; P.hold = Math.max(0, P.hold + +d); log(`号池配置 · 暂留额度 ${was} → ${P.hold}`, null, { cat: '配置', obj: '号池' }); toast(+d < 0 ? '已放成可发' : '已留出'); },
  poolAppOk(id) { const P = RULES.pool, a = P.apps.find(x => x.id === id); if (!a || S.role !== 'L3') return; if (P.hold < a.n) return toast(`暂留额度只剩 ${P.hold} 个，可以先从别的学院挪`); P.hold -= a.n; P.col[a.col] = (P.col[a.col] || 0) + a.n; a.st = 'ok';
    log(`号池配置 · 批准 ${a.col} 的额度申请 ${a.n} 个（从暂留里放）`, null, { cat: '配置', obj: '号池' }); notify(a.by, '站内', `你申请的 ${a.n} 个额度已批准`, null); toast('已批准，已通知申请人'); },
  poolAppNo(id) { const a = RULES.pool.apps.find(x => x.id === id); if (!a || S.role !== 'L3') return; a.st = 'no'; log(`号池配置 · 没有批准 ${a.col} 的额度申请`, null, { cat: '配置', obj: '号池' }); notify(a.by, '站内', '你的额度申请没有批准', null); toast('已处理'); },
  ivAppGo() { const F = S.form, n = +F.apn; if (!F.apc) return toast('请选学院'); if (!(n > 0)) return toast('请写要多少个'); if (!(F.apw || '').trim()) return toast('请写一句为什么');
    RULES.pool.apps.push({ id: 'ap' + (RULES.pool.apps.length + 1), col: F.apc, n, why: F.apw.trim(), by: me(), at: new Date(NOW), st: 'wait' }); log(`主动邀约 · 申请额度：${F.apc} ${n} 个`, null, { cat: '预约', obj: '号池' }); notify('c5', '站内', `${ST(me()).name} 申请 ${F.apc} 的邀约额度 ${n} 个`, null); S.mo = null; toast('已提交，中心负责人会在「号池配置」里处理'); },
  ivSendGo(t) { const L = ivMine().filter(x => x.st === 'new' && (t === 'all' || (+t >= 4 ? x.lv >= 4 : x.lv === +t))); if (!L.length) return; L.forEach(x => { x.st = 'sent'; x.at = new Date(NOW); x.due = ivDue(2); });
    log(`主动邀约 · 发邀约卡 ${L.length} 人（${t === 'all' ? '全部' : +t >= 4 ? '4 级及以上' : `${t} 级`}）`, null, { cat: '预约', obj: '主动邀约' }); S.mo = null; toast(`已发给 ${L.length} 位学生，24 小时后自动提醒一次`); },
  ivAddGo() { const B = ivb(), F = S.form, ids = [...new Set([...(F.ivPick || []), ...(F.ivIds || '').split(/[\s,，、]+/).filter(Boolean)])], res = { in: [], bad: [], skip: [], has: [] };
    ids.forEach(id => { const s = STU.find(x => x.id === id || x.sid === id); if (!s) return res.bad.push(`${id}：不在名册`);
      if (CRISES.some(k => k.sid === s.id && k.st !== 'closed')) return res.skip.push(`${nm(s)}：危机中`);
      if (B.list.some(x => x.sid === s.id)) return res.has.push(`${nm(s)}：已在批次里`); if (activeBook(s)) return res.has.push(`${nm(s)}：已有在途预约`);
      B.list.push({ sid: s.id, lv: curLv(s), st: 'new', resp: ivResp(s) }); res.in.push(nm(s)); });
    if (!ids.length) return toast('请勾选学生或粘贴学号'); log(`主动邀约 · 加学生：进入批次 ${res.in.length} · 对不上 ${res.bad.length} · 不走预约队列 ${res.skip.length} · 已有安排 ${res.has.length}`, null, { cat: '预约', obj: '主动邀约' }); S.ivRes = res; S.mo = 'ivRes:'; },
  schedRegGo() { const F = S.form; if (!F.rgc || !F.rgt || !(F.rgd || '').trim()) return toast('请选老师、类型，写日期');
    if (S.role !== 'L3' && !(S.role === 'L2' && F.rgc === me())) return toast('只能登记本人排班');
    const range = schedRegRange(F.rgd); if (!range) return toast('请输入有效日期，例如 2026-10-23 或 10/23 下午');
    let result = null; if (F.rgt !== '改班') { result = schedCloseRange(F.rgc, range, F.rgt, (F.rgw || '').trim()); if (!result) return toast('这个日期没有可关时段，或仍影响已有预约 / 有效入口；请先补足替代安排'); }
    RULES.schedLog = RULES.schedLog || []; RULES.schedLog.push({ at: new Date(NOW), cid: F.rgc, type: F.rgt, day: F.rgd.trim(), date: range.date, times: range.times.map(t => TIMES[t]), affected: result ? result.affected : 0, why: (F.rgw || '').trim() });
    log(`排班 · ${ST(F.rgc).name} ${F.rgt}：${F.rgd.trim()}${result ? `；关闭 ${range.times.length} 个时段，${result.affected} 个预约进入中心调整` : ''}`, null, { cat: '预约', obj: '排班' });
    notify('c5', '站内 + 短信', `${ST(F.rgc).name} 登记了${F.rgt}：${F.rgd.trim()}${result ? `；${result.affected} 个预约待重新安排` : ''}`, null); S.mo = null; toast(result ? '已关闭时段，受影响预约进入中心调整，并已通知中心负责人' : '已登记，中心负责人会收到通知'); },
  ivPickT(id) { const L = S.form.ivPick = S.form.ivPick || []; const i = L.indexOf(id); if (i >= 0) L.splice(i, 1); else L.push(id); } });
const _md19 = modal; modal = function () { const [k, id] = (S.mo || '').split(':'), F = S.form;
  if (k === 'ivSend') { const L = ivMine().filter(x => x.st === 'new' && (id === 'all' || (+id >= 4 ? x.lv >= 4 : x.lv === +id))), P = poolN(), q = Math.max(0, P.can - ivMine().filter(x => ['entry', 'sub', 'ok'].includes(x.st)).length);
    return mbox(`发邀约卡 · ${L.length} 人`, '确认后才发。学生收到的卡上不写原因、等级和「普测筛出」。', `<div class="dbox"><p style="margin:0">「心理中心邀请你聊一聊。接受后，小屿会先花 3 分钟了解一下你最近的情况，然后你可以自己选和老师见面的时间。请在 ${ivDue(2)} 前回复。」<br>[接受] [这次不参加]</p></div><p class="note">按现在的号，接受的人里大约前 ${q} 位能很快拿到人工入口，其余要排队。邀约卡不占号，24 小时提醒一次。</p>`, '确认发送', 'ivSendGo', id); }
  if (k === 'ivApp') return mbox('申请额度', '发给中心负责人，在「号池配置 · 申请卡」里处理。', fld('学院', `<div class="opts">${COLLEGES.map(c => `<button class="${F.apc === c ? 'on' : ''}" data-act="fset" data-arg="apc|${c}">${c}</button>`).join('')}</div>`) + fld('要多少个号', `<input class="in" type="number" min="1" style="width:100px" data-bind="form.apn" value="${esc(F.apn || '')}">`) + fld('为什么', `<textarea data-bind="form.apw" rows="2" placeholder="例如：名单里等着的人多，本周已排满">${esc(F.apw || '')}</textarea>`), '提交', 'ivAppGo', '');
  if (k === 'ivAdd') { const tab = F.ivt || 'pick', inB = new Set(ivb().list.map(x => x.sid)), C = SURV().filter(s => curLv(s) >= 2 && !inB.has(s.id)).sort((a, b) => curLv(b) - curLv(a)).slice(0, 20), pk = F.ivPick || [];
    return mbox('加学生到批次', '三种方式都行。系统核对后分四堆：进入批次、对不上、不走预约队列、已有安排。', `<div class="opts" style="margin-bottom:10px">${[['pick', '从普测结果里勾'], ['paste', '粘贴学号'], ['file', '导入表格']].map(([k2, n]) => `<button class="${tab === k2 ? 'on' : ''}" data-act="fset" data-arg="ivt|${k2}">${n}</button>`).join('')}</div>` +
      (tab === 'pick' ? `<table class="t"><tr><th></th><th>学生</th><th>等级</th><th>学院</th></tr>${C.map(s => `<tr><td><input type="checkbox" data-act="ivPickT" data-arg="${s.id}" ${pk.includes(s.id) ? 'checked' : ''}></td><td>${nm(s)}</td><td>${lvV(s)}</td><td>${s.college}</td></tr>`).join('')}</table>`
        : tab === 'paste' ? fld('学号（一行一个，或用逗号隔开）', `<textarea data-bind="form.ivIds" rows="4" placeholder="${SURV().slice(0, 2).map(s => s.sid).join('&#10;')}">${esc(F.ivIds || '')}</textarea>`)
        : `<div class="dbox"><p style="margin:0">上传 Excel 或 CSV，第一列是学号。演示里没有真的上传，用「粘贴学号」试一样的核对。</p></div>`), '核对并加入', 'ivAddGo', '', true); }
  if (k === 'ivRes') { const r = S.ivRes || { in: [], bad: [], skip: [], has: [] };
    return mbox('核对结果', '', [['进入批次', r.in], ['对不上', r.bad], ['不走预约队列', r.skip], ['已有安排', r.has]].map(([n, L]) => `<div class="kv"><span>${n}（${L.length}）</span><b>${L.join('、') || '—'}</b></div>`).join(''), '', '', ''); }
  if (k === 'ivIk') { const x = ivMine().find(v => v.sid === id), s = SU(id), it = x && x.ik; if (!it || !it.sum) return _md19();
    return mbox(`预咨询摘要 · ${nm(s)}`, `学生 ${fmt(new Date(it.at))} 发送 · 高危咨询题库`, `<div class="ikform2">${it.sum.map(r => `<div class="${(r.v || '').length > 24 || r.k === 'trouble' ? 'w' : ''}"><label>${esc(r.name)}</label><p>${r.v ? (r.k === 'trouble' ? `「${esc(r.v)}」` : esc(r.v)) : '<span class="note">学生跳过了</span>'}</p></div>`).join('')}</div><p class="note">由预咨询小屿整理、学生本人确认后发送；只收集信息，不评分，不改变等级。每次查看都记入操作记录。</p>`, '', '', '', true); }
  if (k === 'schedReg') return mbox('改班和停诊登记', '登记后中心负责人会收到通知。', fld('老师', `<div class="opts">${['c1', 'c2', 'c3', 'c4', 'c5'].filter(c => S.role === 'L3' || c === me()).map(c => `<button class="${F.rgc === c ? 'on' : ''}" data-act="fset" data-arg="rgc|${c}">${ST(c).name}</button>`).join('')}</div>`) + fld('类型', `<div class="opts">${['改班', '病假停诊', '计划性关时段'].map(t => `<button class="${F.rgt === t ? 'on' : ''}" data-act="fset" data-arg="rgt|${t}">${t}</button>`).join('')}</div>`) + fld('日期', `<input class="in" style="width:200px" data-bind="form.rgd" value="${esc(F.rgd || '')}" placeholder="例如 10/23 下午">`) + fld('说明（可不写）', `<input class="in" data-bind="form.rgw" value="${esc(F.rgw || '')}">`), '登记', 'schedRegGo', '');
  return _md19(); };

/* ---------- 5. 设置：值班表挪走；预咨询只留「放在哪一步」 ---------- */
SG.forEach(g => { g[2] = g[2].filter(x => x[0] !== 'duty'); });
const _st19 = settings; settings = function () { let h = _st19();
  if (S.tabs.settings === 'cwords') { const t = h.indexOf('<div class="tabs">'), e = h.indexOf('</div>', t) + 6; h = h.slice(0, e) + cwPage19() + '</div>'; }
  return h.replace('预咨询的设置暂时放在这里，预约咨询那一版会挪到「预约咨询 · AI 预咨询」。', '这里只设置预咨询放在预约的哪一步、是否启用模板二。题目和开场白在「预约咨询 · AI 预咨询 · 题库配置」里。'); };
PAGES.settings = settings;
const _setTab19 = ACT.setTab; ACT.setTab = function (k) { if (k === 'duty') { if (S.role === 'ADM') return toast('值班表在「预约咨询 · 排班表」里，由心理中心维护'); go('booking'); S.tabs.booking = 'sched'; return; } return _setTab19.apply(this, arguments); };
const _data19 = data; data = function () { return _data19().replace('值班按「成员管理 · 值班表」统计，咨询排班等预约那一版加上。', '值班按「预约咨询 · 排班表」里的值班表统计。'); };
PAGES.data = data;
ivb();

/* R17：每次用户打开摘要写一次审计；重复渲染不再写审计。 */
const _moSummaryAudit19 = ACT.mo; ACT.mo = function (arg) { const [kind, id] = String(arg || '').split(':'); let student = null, intake = null;
  if (kind === 'ivIk') { const x = ivMine().find(v => v.sid === id); intake = x && x.ik; student = x && SU(x.sid); if (!student || !intake || intake.st !== 'sent' || !intake.sum) return toast('没有权限查看这份摘要'); }
  if (kind === 'intake') { const b = BOOK.find(v => v.id === id); intake = b && ikOf(b); student = b && SU(b.sid); if (!b || !ikMayView(b) || !intake || intake.st !== 'sent' || !intake.sum) return toast('没有权限查看这份摘要'); }
  const result = _moSummaryAudit19.apply(this, arguments);
  if (student && S.mo === arg) { intake.viewed = true; log(kind === 'ivIk' ? '查看预咨询摘要（主动邀约）' : '查看预咨询摘要', student, { cat: '查看', noTl: 1 }); }
  return result; };
