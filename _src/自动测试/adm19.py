from browser_env import launch_browser
import pathlib, os
from playwright.sync_api import sync_playwright
# v1.19：风险词三级、所有预约要老师确认、预约咨询 5 个页签、两套题库、值班表挪到排班表
ok = 0; fails = []; errs = []
def chk(c, m):
    global ok
    if c: ok += 1
    else: fails.append(m); print('FAIL', m)
with sync_playwright() as p:
    b = launch_browser(p); pg = b.new_page(viewport={'width': 1440, 'height': 1000})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    F = pathlib.Path(os.environ['ADM_HTML']).as_uri(); E = pg.evaluate
    pg.goto(F); pg.wait_for_timeout(500)
    T = lambda s='#pg': pg.inner_text(s)
    tabs = lambda: [x.inner_text().split('\n')[0] for x in pg.locator('#pg > .tabs button').all()]
    # 风险词
    chk(E("CRISIS_WORDS.length") == 604 and E("[1,2,3].map(l=>CRISIS_WORDS.filter(w=>cwL(w)===l).length).join()") == '99,195,310', '604 words, 99/195/310')
    chk(all(E(f"TALK_RE.test('学生说{w}')") for w in ['想死','自杀','不想活','轻生','结束生命']) and not E("TALK_RE.test('学生说不想死')"), 'v1.19.1 five added level-1 words')
    chk(E("TALK_RE.test('我想死')") and not E("TALK_RE.test('我没有想死')") and not E("TALK_RE.test('最近很累')"), 'level 1 hits, negation and level 3 do not')
    chk(E("TALK_RE.test('我不知道，我想死')"), 'negation stops at punctuation')
    chk(E("!CRISIS_WORDS.some(w=>w.includes('医院'))"), 'no 医院 in words')
    s = E("STU.find(x=>x.stage!=='crisis' && !CRISES.some(k=>k.sid===x.id)).id")
    E(f"cwHits=[];TALK_RE.test('我想死');newCrisis(SU('{s}'),'谈话记录','test',false)"); chk(E(f"CRISES.find(k=>k.sid==='{s}').urgent") == True, 'level 1 -> urgent')
    E("enter('c5','L3');go('settings');S.tabs.settings='cwords';render()"); t = T(); chk('一级 · 重点风险信号（99）' in t and '展开全部' in t, 'crisis word page 3 levels')
    E("S.f.cwq='烧炭';render()"); chk('符合' in T(), 'search words')
    E("S.f.cwq='';ACT.cwLv19(CRISIS_WORDS.indexOf('我想死')+'|1');render()"); chk(E("cwL('我想死')") == 2 and '一级 → 二级' in E("AUDIT[0].t"), 'change level audited')
    # 设置：值班表挪走，预咨询只剩位置
    E("S.tabs.settings='mlist';render()"); chk('值班表' not in [x.inner_text() for x in pg.locator('#pg .stabs button').all()], 'duty removed from settings')
    E("S.tabs.settings='intake';render()"); t = T(); chk('题库配置' in t and '模板一 · 名单内' not in t, 'settings intake keeps position only')
    # 预约咨询 5 个页签
    E("go('booking');render()"); chk(tabs() == ['主动邀约', 'AI 预咨询', '人工咨询', '排班表', '号池配置'], 'five tabs in order'); chk(E("S.tabs.booking") == 'inv', 'L3 defaults to 主动邀约')
    t = T(); chk('容量缺口' in t and '核对结果' in t and '已发卡' in t and '申请额度' in t, 'invite tab parts')
    n0 = E("ivb().list.filter(x=>x.st==='new').length"); E("ACT.mo('ivSend:all');render()"); chk('确认后才发' in T('.mo'), 'send needs confirm')
    E("ACT.ivSendGo('all');render()"); chk(E("ivb().list.filter(x=>x.st==='new').length") == 0 and '发邀约卡' in E("AUDIT[0].t"), f'sent {n0} cards, audited')
    E("ACT.mo('ivAdd:');S.form.ivt='paste';S.form.ivIds='xxx,'+SURV().find(s=>curLv(s)<3&&!activeBook(s)).sid;ACT.ivAddGo();render()"); chk(E("S.ivRes.in.length") == 1 and E("S.ivRes.bad.length") == 1, 'add students, four piles')
    E("ACT.moClose&&ACT.moClose();S.mo=null;ACT.mo('ivApp:');S.form.apc='工程学院';S.form.apn='3';S.form.apw='等的人多';ACT.ivAppGo();render()"); chk(E("RULES.pool.apps.length") == 1, 'apply quota')
    E("ACT.btab('ai');render()"); t = T(); chk('预咨询摘要' in t and '题库配置' in t and '主动邀约' in t, 'AI tab summaries')
    n = E("AUDIT.length"); E("ACT.mo('ivIk:'+ivb().list.find(x=>x.ik&&x.ik.sum&&!x.bid).sid);render()"); chk('高危咨询题库' in T('.mo') and E("AUDIT.length") == n + 1, 'view invite summary audited')
    E("S.mo=null;ACT.aisub('bank');render()"); chk('普通咨询' in T() and '高危咨询' in T(), 'two banks')
    E("ACT.ikBank('h');render()"); chk(E("RULES.ikt===RULES.ikh") and '主动邀约来的学生' in T(), 'high-risk bank editor')
    E("ACT.iktDel('t1|7');ACT.iktSave();render()"); chk(E("RULES.ikh.ver") == 2 and E("RULES.iktN.ver") == 1 and '高危咨询' in E("AUDIT[0].t"), 'save high-risk bank only')
    chk(E("LY_snap().__cfg.ikh.ver") == 2 and E("LY_snap().__cfg.ikt.ver") == 1, 'both banks sent to student side')
    E("ACT.btab('man');render()"); chk(E("RULES.ikt===RULES.iktN"), 'bank resets when leaving'); t = T(); chk('待确认申请' in t and '看学生信息' in t and '改时间' in t and '新预约' not in t, 'pinned applications')
    bid = E("BOOK.find(b=>b.st==='confirm').id"); n = E("AUDIT.length"); E(f"ACT.bOpen('{bid}');render()"); chk(E("!!S.dw") and E("AUDIT.length") > n, 'open application audited')
    E("S.dw=null;ACT.btab('sched');render()"); t = T(); chk('值班表' in t and '改班和停诊登记' in t and '工作量' in t, 'schedule tab')
    E("S.mo='schedReg:';S.form={rgc:'c1',rgt:'病假停诊',rgd:'10/23 下午'};ACT.schedRegGo();render()"); chk(len(E("RULES.schedLog")) == 1, 'register sick leave')
    E("ACT.btab('pool');render()"); chk('申请卡（1 待处理）' in T(), 'apply card shown')
    E("ACT.poolR(90);render()"); chk(E("RULES.pool.inv") == 90 and '10 / 90' in E("AUDIT[0].t"), 'ratio change audited')
    E("ACT.poolAppOk(RULES.pool.apps[0].id);render()"); chk(E("RULES.pool.apps[0].st") == 'ok', 'approve apply card')
    # L2：默认人工咨询，号池只读
    E("enter('c1','L2');go('booking');render()"); chk(E("S.tabs.booking") == 'man', 'L2 defaults to 人工咨询')
    E("ACT.btab('pool');render()"); chk(pg.locator('[data-act=poolR][disabled]').count() == 3, 'L2 pool read-only')
    # 所有预约都要老师确认
    chk(E("BOOK.every(b=>!b.fresh)"), 'no fresh bookings'); E("ACT.zBook();render()"); chk(E("BOOK.slice(-1)[0].st") == 'confirm', 'demo booking needs confirm')
    print(f'adm19: {ok} passed, {len(fails)} failed, errors {len(errs)}'); [print(' -', f) for f in fails]; print(errs[:3])

raise SystemExit(bool(fails or errs))
