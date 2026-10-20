from browser_env import launch_browser
import pathlib
from playwright.sync_api import sync_playwright
# v1.13 机构端新增：预咨询模板设置、新预约、谈心任务派发、谈心记录规则
F = pathlib.Path(__import__('os').environ['ADM_HTML']).as_uri()
SH = pathlib.Path(str(__import__('pathlib').Path(__file__).resolve().parents[1] / 'build/shots')); SH.mkdir(exist_ok=True)
ok = 0; fails = []; errs = []
def chk(c, msg):
    global ok
    if c: ok += 1
    else: fails.append(msg); print('FAIL', msg)
with sync_playwright() as p:
    b = launch_browser(p); pg = b.new_page(viewport={'width': 1440, 'height': 1000})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    J = pg.evaluate
    def load(): pg.goto(F); pg.wait_for_timeout(250)
    def login(u, r, brief=False):
        pg.select_option('#roleSel', f'{u}|{r}'); pg.wait_for_timeout(60); J("S.full=true;render()")
        if not brief: J("S.hv='work';render()")
    def act(a, arg=None, scope=''):
        sel = f'{scope} [data-act="{a}"]' + (f'[data-arg="{arg}"]' if arg is not None else '')
        pg.locator(sel.strip()).first.click(); pg.wait_for_timeout(50)
    txt = lambda s='body': pg.inner_text(s)
    def shot(n): pg.wait_for_timeout(150); pg.screenshot(path=str(SH / f'v13_{n}.png'))
    # ---- 预咨询模板（L3 改内容，ADM 改位置和开关）
    load(); login('c4', 'L3'); J("go('booking');S.tabs.booking='ai';S.tabs.aisub='bank';render()")
    chk('预计学生用时约' in txt('#pg') and '版本记录' in txt('#pg') and pg.locator('.iktq').count() == 6, 'L3 sees intake tab, 6 questions'); shot('01_ikt')
    J("go('settings');S.tabs.settings='intake';render()"); chk(pg.locator('[data-bind=intakeMode][disabled]').count() == 1, 'L3 (no ADM) cannot change position'); J("go('booking');S.tabs.booking='ai';S.tabs.aisub='bank';render()")
    for i in range(2): act('iktAdd')
    chk(pg.locator('.iktq').count() == 8 and pg.locator('[data-act=iktAdd][disabled]').count() == 1, 'max 8 questions')
    chk('超过 5 分钟' in txt('#pg') or J("iktSecs(iktD().t1)") <= 300, 'yellow warning when > 5 min')
    J("iktD().t1.forEach(q=>{if(q.type==='single')q.type='text'});render()"); chk('超过 5 分钟' in txt('#pg') and pg.locator('.iktime.warn').count() == 1, 'long template warns')
    act('iktUndo'); chk(pg.locator('.iktq').count() == 6 and not J("iktDirty()"), 'undo')
    pg.fill('[data-ik="q|t1|0|say"]', '这次想先聊点什么？'); pg.wait_for_timeout(80)
    chk(J("iktDirty()") and '有未保存的修改' in txt('#pg'), 'edit marks dirty')
    act('mo', 'iktPrev:t1'); chk('这次想先聊点什么' in txt('.mo') and '李文老师' in txt('.mo'), 'student-view preview'); act('moClose')
    act('iktSave'); chk(J("RULES.ikt.ver") == 2 and '预咨询题库 · 普通咨询 · 第 2 版' in J("AUDIT[0].t"), 'save v2 + audit')
    act('iktRestore', '1'); chk(J("RULES.ikt.ver") == 3 and J("RULES.ikt.t1[0].say").startswith('这次最想'), 'restore v1 as v3')
    load(); login('a1', 'ADM'); J("go('settings');S.tabs.settings='intake';render()")
    chk(pg.locator('[data-ik="q|t1|0|say"]').count() == 0, 'ADM cannot edit questions (moved to booking)')
    act('iktT2'); act('iktSave'); chk(J("RULES.ikt.t2on") is True and '模板二 启用' in J("AUDIT[0].t"), 'ADM switches template 2')
    # ---- 新预约（第一次预约直接成功）
    load(); login('c1', 'L2'); J("go('booking');render()")
    chk('待确认申请' in txt('#pg') and pg.locator('[data-act=bSeen]').count() == 0, 'v1.19 no 新预约, pinned applications'); shot('02_fresh')
    load(); login('c1', 'L2', brief=True); chk('新预约（' not in txt('.brief'), 'L2 brief has no 新预约')
    # ---- 谈心任务（v1.14 改成独立「谈心」页面，详细流程见 adm14；这里只留入口和频率设置的回归）
    load(); login('u1', 'L1', brief=True); bt = txt('.brief')
    chk('人待谈' in bt and 'PHQ' not in bt, 'L1 brief: talk card, no scores'); shot('03_tt_brief')
    n = J("myItems('u1').filter(x=>x.st==='open'&&itDue(x)).length"); chk(n > 0 and J("myItems('u1').some(itOver)"), f'u1 has tasks ({n}), some overdue')
    J("go('talk');render()"); chk('待谈心' in txt('#pg') and '超期' in txt('#pg'), 'talk page task list')
    # 频率修改只影响之后 + 审计
    load(); login('c4', 'L3'); J("go('settings');S.tabs.settings='talkf';render()"); chk('关注等级 → 谈心频率' in txt('#pg'), 'L3 talk frequency tab'); shot('05_tf')
    before = J("ITEMS.filter(x=>x.st==='open'&&x.src==='auto').map(x=>x.id+'|'+(+x.due))")
    pg.select_option('[data-tf="2|n"]', '3'); pg.wait_for_timeout(80)
    chk(J("RULES.talkFreq[2].n") == 3 and '谈心频率' in J("AUDIT[0].t") and J("ITEMS.filter(x=>x.st==='open'&&x.src==='auto').map(x=>x.id+'|'+(+x.due))") == before, 'freq change audited, existing tasks unchanged')
    load(); login('a1', 'ADM'); J("go('settings');S.tabs.settings='talkf';render()"); chk(pg.locator('[data-tf][disabled]').count() == 8, 'ADM read-only frequency')
    # ---- 多渠道触达
    load(); login('c5', 'L3'); J("go('survey');S.plan='t1';ACT.ptab('t1|noti');render()"); t = txt('#pg')   # v1.18：渠道在「通知设置」，名单在「测试详情」
    J("ACT.ptab('t1|det');render()"); t += txt('#pg'); chk('送达失败' in t and '个人链接' in t and '公共链接' in t and '已退订 / 已拒绝' in t, 'reach: links, delivery failure, unsub/declined'); shot('08_reach')
    act('failExp', 't1'); chk('导出送达失败名单' in J("AUDIT[0].t"), 'L3 export failure list audited')
    J("ACT.ptab('t1|noti');render()"); act('autoAdd', 't1'); chk(J("planOf('t1').auto.length") == 3 and '新增自动提醒规则' in J("AUDIT[0].t"), 'auto rule added + audited')
    act('autoT', 't1|a1'); chk(J("planOf('t1').auto[0].on") == 0 and '停用' in J("AUDIT[0].t"), 'auto rule toggled')
    pg.select_option('[data-bind=remQuota]', '3'); pg.wait_for_timeout(80); chk(J("RULES.remQuota") == 3 and '提醒上限' in J("AUDIT[0].t"), 'quota configurable + audited')
    pg.select_option('[data-bind=remQuota]', '2'); pg.wait_for_timeout(80)
    J("ACT.ptab('t1|det');render()"); pg.select_option('[data-bind="f.rst"]', '已退订'); chk(pg.locator('.reach input[data-act=rsel]').count() == 0, 'unsubscribed not selectable')
    pg.select_option('[data-bind="f.rst"]', '')
    J("ACT.ptab('t1|noti');render()"); act('mo', 'copyEd:t1'); chk('短信 · English' in txt('.mo') and '退订链接' in J("planOf('t1').copy.sms"), 'bilingual copy editor'); act('copySave', 't1')
    act('mo', 'mailPrev:t1'); chk('Stop reminders' in txt('.mo') and '个人链接' in txt('.mo'), 'mail preview bilingual + unsubscribe'); act('moClose')
    load(); login('c1', 'L2'); J("go('survey');S.plan='t1';render()"); chk(pg.locator('[data-act=failExp]').count() == 0, 'non-L3 cannot export')
    # 辅导员：普测进度
    load(); login('u1', 'L1'); J("go('work');S.tabs.work='prog';render()"); t = txt('#pg')
    chk('请不要强制要求学生参加' in t and '还没完成' in t, 'L1 progress tab with voluntary notice'); shot('09_l1prog')
    chk(not J("l1Prog().some(x=>x.unsub||x.declined)"), 'L1 list excludes unsub / declined')
    i = J("PENDING.indexOf(l1Prog().find(x=>(x.rem||0)<RULES.remQuota&&!isToday(x.remAt)))")
    act('mo', f'remind:l1one|{i}'); chk('UCC' in txt('.mo') and '不显示你的名字' in txt('.mo'), 'reminder sent in UCC name'); act('remindGo', f'l1one|{i}')
    chk(J(f"PENDING[{i}].remBy") == 'u1' and '以 UCC 名义' in J("AUDIT[0].t"), 'L1 reminder counted + audited')
    J(f"PENDING[{i}].rem=RULES.remQuota;render()"); chk(pg.locator(f'[data-arg="remind:l1one|{i}"][disabled]').count() == 1, 'quota reached -> disabled')
    chk('undefined' not in txt('#pg'), 'no undefined')
    print('ok', ok, 'fail', len(fails)); [print(' -', f) for f in fails]; print('errs', errs[:5])
