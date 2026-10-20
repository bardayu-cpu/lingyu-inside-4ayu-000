from browser_env import launch_browser
import pathlib
from playwright.sync_api import sync_playwright
# v1.19 合并试用版联动：高危咨询题库下发、邀约来的申请带摘要进机构端、老师确认回到学生端
F = pathlib.Path(__import__('os').environ['TRIAL_HTML']).as_uri()
ok = 0; fails = []; errs = []
def chk(c, m):
    global ok
    if c: ok += 1
    else: fails.append(m); print('FAIL', m)
with sync_playwright() as p:
    b = launch_browser(p); pg = b.new_page(viewport={'width': 1440, 'height': 1000})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('https://script.google.com/**', lambda r: r.fulfill(status=200, body='ok'))
    pg.goto(F); pg.wait_for_timeout(1500); pg.fill('#nm', 'T'); pg.click('[data-do=nameOk]')
    fr = lambda t: next(f for f in pg.frames if f.parent_frame and f.frame_element().get_attribute('title') == t)
    S, A = fr('学生端'), fr('机构端'); W = lambda: pg.wait_for_timeout(400)
    A.evaluate("enter('c5','L3','t');go('booking');S.tabs.booking='ai';S.tabs.aisub='bank';S.ikBank='h';render()"); W()
    A.evaluate("iktD().t1.splice(7,1);ACT.iktSave();render()"); W()
    chk(S.evaluate("IK_CFG_H && IK_CFG_H.ver") == 2 and S.evaluate("IK_CFG_H.t1.length") == 7, 'high-risk bank synced to student')
    chk(S.evaluate("IK_CFG && IK_CFG.ver") == 1, 'normal bank untouched')
    S.evaluate("reset('A');prepare('home');render();ACT.zIvc();ACT.ivAcc();render()"); W()
    chk(S.evaluate("S.ik.qs.length") == 7, 'student uses new high-risk bank')
    S.evaluate("ACT.zIk();ACT.ikSendSum();render()"); W()
    # Pick an actual offered slot; the former fixture is already occupied by another demo student.
    arg = S.evaluate("""(()=>{const k=S._slotAllowed.find(k=>k.startsWith('c1|'));
      if(!k) throw new Error('No real c1 invitation slot offered');
      const [cid,date,time]=k.split('|');return cid+':'+DAYS.findIndex(d=>d.toISOString().slice(0,10)===date)+':'+DATA.times.indexOf(time);})()""")
    S.evaluate("arg=>{ACT.pickSlot(arg);ACT.bookSubmit();render()}", arg); W()
    x = A.evaluate("(()=>{const b=BOOK.find(b=>b.sid===CORE.lin.id&&b.st==='confirm');return b&&{id:b.id,src:b.src,ik:b.intake&&b.intake.st}})()")
    chk(x and x['src'] == '主动邀约' and x['ik'] == 'sent', f'invite request reaches admin with intake {x}')
    A.evaluate(f"enter('c1','L2','t');go('booking');render()"); W(); chk('主动邀约' in A.inner_text('#pg') and '待确认申请' in A.inner_text('#pg'), 'shows in pinned list')
    A.evaluate(f"ACT.bOk('{x['id']}');render()"); W(); chk(S.evaluate("S.bk.st") == '已确认', 'teacher confirm -> student confirmed')
    print(f'trial_v119: {ok} passed, {len(fails)} failed, errors {len(errs)}'); [print(' -', f) for f in fails]; print(errs[:3])

raise SystemExit(bool(fails or errs))
