from browser_env import launch_browser
import pathlib
from playwright.sync_api import sync_playwright
# v1.13 预咨询小屿（接待台）· 合并试用版联动用例
F = pathlib.Path(__import__('os').environ['TRIAL_HTML']).as_uri()
ok = 0; fails = []; errs = []
def chk(c, m):
    global ok
    if c: ok += 1
    else: fails.append(m); print('FAIL', m)
with sync_playwright() as p:
    b = launch_browser(p); pg = b.new_page(viewport={'width': 1440, 'height': 1000})
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    pg.route('https://script.google.com/**', lambda r: r.fulfill(status=200, body='ok'))
    pg.goto(F); pg.wait_for_timeout(1500); pg.fill('#nm', 'T'); pg.click('[data-do=nameOk]')
    fr = lambda t: next(f for f in pg.frames if f.parent_frame and f.frame_element().get_attribute('title') == t)
    S, A = fr('学生端'), fr('机构端'); W = lambda: pg.wait_for_timeout(350)
    sh = lambda n: pg.screenshot(path=f'ik_{n}.png')
    adb = lambda core: A.evaluate(f"(()=>{{const b=BOOK.find(b=>b.sid===CORE.{core}.id&&['confirm','ok'].includes(b.st));return b&&{{id:b.id,st:b.st,fresh:!!b.fresh,ik:b.intake}}}})()")
    app = lambda: S.inner_text('#app'); mod = lambda: S.inner_text('#modal')
    # ---- A：预约成功 → 大窗口
    S.evaluate("reset('B');prepare('book');render()"); W(); S.evaluate("ACT.pickSlot('c1:0:1');ACT.bookSubmit();render()"); W()
    chk(S.evaluate("S.modal") == 'ikWelcome' and '等老师确认' in mod() and '预咨询小屿' in mod(), 'A: welcome window after booking'); sh('01_welcome')
    chk(S.evaluate("S.bk.st") == '待确认', 'first booking is a request')
    chk('上次普测时' not in mod(), 'no prev-topic sentence when no survey in 3 months')
    x = adb('chen'); chk(x and x['st'] == 'confirm' and not x['fresh'] and x['ik']['st'] == 'none', f'A: admin 待确认申请 + intake none {x}')
    S.evaluate("ACT.ikYes();render()"); W(); chk(S.evaluate("S.page") == 'intake' and '第 1 / 6 题' in app(), 'one question at a time, 1/6'); sh('02_desk')
    S.evaluate("ACT.ikTog('学业压力');ACT.ikNextQ();render()"); chk('第 2 / 6 题' in app(), 'multi -> next')
    S.evaluate("S.ik.txt='很累';ACT.ikNextQ();render()"); chk('能再多说一点' in app(), 'probe once on short answer')
    S.evaluate("S.ik.txt='每天上课都跟不上，晚上也睡不好';ACT.ikNextQ();render()"); chk('第 3 / 6 题' in app() and '；' in S.evaluate("S.ik.ans.trouble"), 'probe answer appended, then next')
    S.evaluate("ACT.ikPrevQ();render()"); chk('第 2 / 6 题' in app() and '跟不上' in S.input_value('#ikTxt'), 'back keeps answer')
    S.evaluate("ACT.ikNextQ();render()"); chk('第 3 / 6 题' in app(), 'next again (no 2nd probe)')
    S.evaluate("ACT.ikPick('2');ACT.ikPick('2');render()"); chk('第 5 / 6 题' in app(), 'single choice auto-advances')
    S.evaluate("ACT.ikSkipQ();render()"); chk('第 6 / 6 题' in app() and S.evaluate("S.ik.ans.expect") is None, 'skip this one')
    S.evaluate("ACT.ikSkipQ();render()"); chk(S.evaluate("S.ik.phase") == 'review' and '给接待老师的预咨询摘要' in app(), 'review form'); sh('03_review')
    chk(S.locator('[data-act=ikSendSum][disabled]').count() == 1, 'send disabled before consent')
    S.evaluate("ACT.ikOkT();ACT.ikSendSum();render()"); W()
    x = adb('chen'); rows = {r['k']: r['v'] for r in (x['ik']['sum'] or [])}
    chk(x['ik']['st'] == 'sent' and '跟不上' in rows.get('trouble', '') and rows.get('dur') == '几个月', f'sent -> admin has form summary {rows}')
    chk(S.evaluate("S.page") == 'mybook' and '已发给老师' in app(), 'mybook card: sent'); sh('04_card')
    # 老师查看 → 学生端「老师已查看」
    A.evaluate(f"enter('c1','L2','t');S.mo='intake:{x['id']}';render()"); W()
    chk('最困扰的事' in A.inner_text('.mo') and '学生跳过了' in A.inner_text('.mo'), 'admin form shows rows + skipped')
    chk(S.evaluate("S.bk.intake.viewed") is True and '老师已查看' in app(), 'viewed -> student sees seen')
    A.evaluate("S.mo=null;render()")
    # 追加补充（含危机词检测）
    S.evaluate("ACT.ikAdd();S.ikAddT='还有，我下周有考试';ACT.ikAddOk();render()"); W()
    chk('下周有考试' in str(adb('chen')['ik'].get('adds')), 'append synced as adds')
    # ---- 中途关闭 → 先保存 → 继续
    S.evaluate("reset('A');prepare('book');render()"); W(); S.evaluate("ACT.pickSlot('c1:1:1');ACT.bookSubmit();ACT.ikYes();ACT.ikTog('睡眠');ACT.ikNextQ();ACT.ikX();render()"); W()
    chk(S.evaluate("S.modal") == 'ikClose' and '先保存' in mod(), 'close with answers -> ask save / skip')
    S.evaluate("ACT.ikSave();render()"); W(); y = adb('lin')
    chk(y and y['ik']['st'] == 'draft' and S.evaluate("S.page") == 'mybook' and '已保存，未发送' in app(), f'draft saved + synced {y and y["ik"]["st"]}')
    S.evaluate("ACT.ikGo();render()"); chk('第 2 / 6 题' in app() and S.evaluate("S.ik.ans.topics") == ['睡眠'], 'continue from draft at next question')
    S.evaluate("ACT.ikX();ACT.ikQuit();render()"); W(); chk(adb('lin')['ik']['st'] == 'skipped' and '这次不填' in app(), 'skip this time synced')
    # ---- 这次先不用
    S.evaluate("reset('C');prepare('book');render()"); W(); S.evaluate("ACT.pickSlot('c2:1:2');ACT.bookSubmit();ACT.ikNo();render()"); W()
    z = adb('huang'); chk(z and z['ik']['st'] == 'skipped' and S.evaluate("S.page") == 'mybook', f'not now -> skipped {z and z["ik"]}')
    # ---- 危机：窗口内求助卡 + 立即进危机通道（不发送也一样）
    S.evaluate("reset('B');prepare('book');render()"); W(); S.evaluate("ACT.pickSlot('c1:0:2');ACT.bookSubmit();ACT.ikYes();ACT.ikTog('情绪低落');ACT.ikNextQ();S.ik.txt='我真的不想活了';ACT.ikNextQ();render()"); W()
    chk(S.evaluate("S.ik.crisis") and S.locator('.helpcard').count() == 1 and '我准备好了' in app(), 'crisis help card in desk'); sh('05_crisis')
    chk(A.evaluate("CRISES.some(k=>k.sid===CORE.chen.id&&k.st!=='closed')"), 'crisis -> admin crisis channel before sending')
    # ---- 机构端改模板 → 学生端用新题
    pg.click('[data-side=机构端]'); A.evaluate("enter('c5','L3','t');go('booking');S.tabs.booking='ai';S.tabs.aisub='bank';render()"); W()
    chk('预计学生用时' in A.inner_text('#pg') and '版本记录' in A.inner_text('#pg'), 'admin intake settings tab'); sh('06_settings')
    A.evaluate("iktD().t1.splice(4,1);iktD().t1[0].say='这次想先聊点什么？';ACT.iktSave();render()"); W()
    chk(A.evaluate("RULES.ikt.ver") == 2 and '预咨询题库 · 普通咨询' in A.evaluate("AUDIT[0].t"), 'template saved as v2 + audited')
    chk(S.evaluate("IK_CFG && IK_CFG.ver") == 2, 'template synced to student')
    pg.click('[data-side=学生端]'); S.evaluate("reset('D');prepare('book');render()"); W(); S.evaluate("ACT.pickSlot('c4:2:2');ACT.bookSubmit();render()"); W()
    if S.evaluate("S.modal") == 'ikWelcome': S.evaluate("ACT.ikYes();render()")
    chk(('第 1 / 5 题' in app() and '这次想先聊点什么' in app()) or S.evaluate("S.bk.kind") == '正式咨询', 'student uses new template (5 questions)')
    # 模板二：3 个月内没有普测
    A.evaluate("enter('a1','ADM','t');go('settings');S.tabs.settings='intake';ACT.iktT2();ACT.iktSave();render()"); W(); chk(S.evaluate("IK_CFG.t2on") is True, 't2 switch synced')
    S.evaluate("reset('A');prepare('book');render()"); W(); S.evaluate("ACT.pickSlot('c1:3:1');ACT.bookSubmit();ACT.ikYes();render()"); W()
    chk('第 1 / 8 题' in app(), 'template 2 for student without recent survey')
    # 版本恢复
    A.evaluate("enter('c5','L3','t');go('settings');S.tabs.settings='intake';ACT.iktRestore('1');render()"); W(); chk(A.evaluate("RULES.ikt.ver") == 4 and A.evaluate("RULES.ikt.t1.length") == 6, 'restore v1 -> saved as v4')
    # ---- B：选好时段后、提交前（倒计时）
    pg.click('[data-side=机构端]'); A.evaluate("enter('a1','ADM','t');go('settings');S.tabs.settings='intake';render()"); A.select_option('[data-bind=intakeMode]', 'B'); W(); pg.click('[data-side=学生端]')
    chk(S.evaluate("IK_MODE") == 'B', 'cfg B -> student')
    S.evaluate("reset('B');prepare('book');render()"); W(); S.evaluate("ACT.pickSlot('c1:2:1');ACT.bookSubmit();render()"); W()
    chk(S.evaluate("S.modal") == 'ikWelcome' and S.evaluate("S.bk") is None and '保留 15 分钟' in mod(), 'B: welcome before submit, slot held')
    S.evaluate("ACT.ikYes();ACT.ikTog('学业压力');ACT.ikNextQ();S.hold.until=Date.now()+90e3;render()"); pg.wait_for_timeout(1300)
    chk('快到时间了' in app(), 'B: 2-minute reminder'); sh('07_B')
    S.evaluate("ACT.zIkTime();render()"); W()
    chk(S.evaluate("S.bk && S.bk.intake.st") == 'draft' and S.evaluate("S.modal") == 'booked', 'B: timeout -> booking sent + answers saved as draft')
    x = adb('chen'); chk(x and x['ik']['st'] == 'draft', 'B: admin booking + draft')
    # ---- C：关闭
    pg.click('[data-side=机构端]'); A.select_option('[data-bind=intakeMode]', 'C'); W(); pg.click('[data-side=学生端]'); chk(S.evaluate("IK_MODE") == 'C', 'cfg C')
    S.evaluate("reset('A');prepare('book');render()"); W(); S.evaluate("ACT.pickSlot('c2:2:2');ACT.bookSubmit();render()"); W()
    chk(S.evaluate("S.modal") == 'booked' and '预约成功' in mod() and S.evaluate("S.page") != 'intake', 'C: no intake, booked modal')
    pg.click('[data-side=机构端]'); W(); sh('08_admin')
    print('ok', ok, 'fail', len(fails)); [print(' -', f) for f in fails]; print('errs', errs[:5])
