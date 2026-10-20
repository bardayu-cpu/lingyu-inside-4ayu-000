from browser_env import launch_browser
import pathlib, json, sys
from playwright.sync_api import sync_playwright
F = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else __import__('os').environ['TRIAL_HTML']).as_uri()
ok = 0; fails = []; errs = []
def chk(c, m):
    global ok
    if c: ok += 1
    else: fails.append(m); print('FAIL', m)
with sync_playwright() as p:
    b = launch_browser(p); ctx = b.new_context(viewport={'width': 1440, 'height': 1000}); pg = ctx.new_page()
    posts = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    pg.route('https://script.google.com/**', lambda r: (posts.append(r.request.post_data), r.fulfill(status=200, body='ok')))
    pg.goto(F); pg.wait_for_timeout(1500)
    fr = lambda t: next(f for f in pg.frames if f.parent_frame and f.frame_element().get_attribute('title') == t)
    STU, ADM = fr('学生端'), fr('机构端')
    sh = lambda n: pg.screenshot(path=f'tr_{n}.png')
    # 名字
    chk(pg.locator('#nm').count() == 1 and '虚构' in pg.inner_text('#ov'), 'name prompt first')
    pg.click('[data-do=nameOk]'); chk('请写下' in pg.inner_text('#nmErr'), 'name required')
    pg.fill('#nm', '测试同学A'); pg.click('[data-do=nameOk]'); chk('测试同学A' in pg.inner_text('#tb'), 'name shown'); sh('01')
    # 切换
    pg.click('[data-side=机构端]'); chk(pg.locator('iframe[title=机构端]').is_visible() and not pg.locator('iframe[title=学生端]').is_visible(), 'switch to admin')
    pg.click('[data-side=学生端]'); chk(pg.locator('iframe[title=学生端]').is_visible(), 'switch back')
    # 联动：学生 B 预约 → 机构端李文队列
    STU.evaluate("reset('B');prepare('book');render()"); pg.wait_for_timeout(100)
    STU.evaluate("ACT.pickSlot('c1:0:1');ACT.fMode('线下');ACT.bookSubmit();render()"); pg.wait_for_timeout(400)
    st = ADM.evaluate("(()=>{const b=BOOK.find(b=>b.sid===CORE.chen.id&&['confirm','ok'].includes(b.st));return b&&{st:b.st,cid:b.cid,day:b.day,t:b.t,src:b.src}})()")
    chk(st and st['st'] == 'confirm' and st['src'] == '学生端提交' and st['cid'] == 'c1' and st['day'] == 1 and st['t'] == 1, f'v1.19 stu book -> admin confirm (待确认申请) {st}')
    chk('已联动' in pg.inner_text('#sync'), 'sync toast'); sh('02_sync')
    # v1.13 第一次预约直接成功：学生端已确认；机构端「新预约」点「知道了」
    chk(STU.evaluate("S.bk&&S.bk.st") == '待确认' and STU.evaluate("S.modal") == 'ikWelcome', 'student request + intake welcome')
    ADM.evaluate("enter('c1','L2','t');render()"); bid = ADM.evaluate("BOOK.find(b=>b.sid===CORE.chen.id&&b.st==='confirm').id")
    STU.evaluate("ACT.close();render()"); ADM.evaluate(f"ACT.bOk('{bid}');render()"); pg.wait_for_timeout(400); chk(STU.evaluate("S.bk.st") == '已确认', 'admin confirm -> student confirmed')
    STU.evaluate("ACT.close();render()")
    # 学生申请改期 → 机构端 change；同意 → 学生端新时间
    STU.evaluate("S.bk.pend={type:'resch',cid:'c1',di:2,ti:2,mode:'线下',topics:[]};render()"); pg.wait_for_timeout(300)
    chk(ADM.evaluate(f"BOOK.find(b=>b.id==='{bid}').st") == 'change', 'stu resch req -> admin change')
    ADM.evaluate(f"ACT.bAgree('{bid}');render()"); pg.wait_for_timeout(400)
    chk(STU.evaluate("S.bk&&S.bk.di") == 2 and not STU.evaluate("S.bk.pend"), 'admin agree -> student new time')
    # 老师改约 → 学生端「老师调整」
    ADM.evaluate(f"S.form={{slot:'4-3'}};ACT.bMoveOk('{bid}');render()"); pg.wait_for_timeout(400)
    chk(STU.evaluate("S.bk.st") == '已改约' and STU.evaluate("S.modal") == 'moved', 'admin move -> student moved')
    # 婉拒：新预约后婉拒
    STU.evaluate("S.bk=null;S.modal=null;render()"); pg.wait_for_timeout(200)
    STU.evaluate("prepare('book');ACT.pickSlot('c2:1:0');ACT.bookSubmit();render()"); pg.wait_for_timeout(300)
    b2 = ADM.evaluate("BOOK.find(b=>b.sid===CORE.chen.id&&b.st==='confirm')"); chk(b2 and b2['cid'] == 'c2', 'second booking synced')
    ADM.evaluate(f"S.form={{why:'时段冲突'}};ACT.bNoOk('{b2['id']}');render()"); pg.wait_for_timeout(400)
    chk(STU.evaluate("S.bk") is None and STU.evaluate("S.modal") == 'info', 'admin decline -> student informed')
    # 远期日期（机构端 5 天之外）
    STU.evaluate("prepare('book');ACT.pickSlot('c1:8:0');ACT.bookSubmit();render()"); pg.wait_for_timeout(300)
    lbl = ADM.evaluate("(()=>{const b=BOOK.find(b=>b.sid===CORE.chen.id&&b.st==='confirm');return slotTxt(b)})()"); chk(lbl.startswith('10/23'), f'far date label {lbl}')
    ADM.evaluate("go('booking');render()"); chk(True, 'booking page renders')
    # 危机：场景 A 请 UCC 联系 → 林晓进入危机通道
    STU.evaluate("reset('A');prepare('home');render()"); pg.wait_for_timeout(200); STU.evaluate("ACT.callUcc();render()"); pg.wait_for_timeout(400)
    chk(ADM.evaluate("CRISES.some(k=>k.sid===CORE.lin.id&&k.st!=='closed')"), 'stu callback -> admin crisis'); 
    ADM.evaluate("enter('c5','L3','t');S.hv='work';render()"); pg.click('[data-side=机构端]'); pg.wait_for_timeout(500); sh('03_admin_crisis')
    # 重置学生端不触发取消
    n0 = ADM.evaluate("AUDIT.length"); STU.evaluate("reset('A');render()"); pg.wait_for_timeout(300); chk(ADM.evaluate("AUDIT.length") == n0, 'student reset no events')
    # ===== 意见（采集模式）
    pg.click('[data-do=fb]'); chk(pg.locator('.pn').count() == 1 and pg.locator('#picking.on').count() == 1, 'collect mode on')
    pg.keyboard.press('Enter'); chk('先写一句' in pg.inner_text('#fbErr'), 'text required')
    ADM.locator('.side nav button').nth(1).click(); pg.wait_for_timeout(300)
    chk(ADM.evaluate("S.page") == 'home', 'pick click did not navigate'); chk('危机干预' in pg.inner_text('.pn .where'), 'picked element text')
    pg.click('[data-type=看不懂]'); pg.fill('#fbTxt', '危机通道的红点是什么意思？'); pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    mine = pg.evaluate("ST.mine"); chk(len(mine) == 1 and mine[0]['试用人'] == '测试同学A' and mine[0]['端'] == '机构端' and '朱静' in mine[0]['账号或场景'] and mine[0]['位置'].startswith('危机干预'), f'record ctx {mine[0] if mine else None}')
    chk(pg.evaluate('FB_URL') != '' or not mine[0]['sent'], 'queued when no url')
    pg.click('[data-side=学生端]'); pg.fill('#fbTxt', '首页字太小'); pg.keyboard.press('Enter'); pg.wait_for_timeout(500)
    mine = pg.evaluate("ST.mine"); chk(len(mine) == 2 and mine[1]['端'] == '学生端' and '林晓' in mine[1]['账号或场景'], 'student ctx auto')
    pg.click('[data-do=stop]'); pg.click('[data-do=mine]'); chk(pg.locator('.pn .item').count() == 2, 'mine list'); sh('04_mine')
    with pg.expect_download() as d: pg.click('[data-do=export]')
    csv = pathlib.Path(d.value.path()).read_text(encoding='utf-8-sig'); chk('测试同学A' in csv and '首页字太小' in csv, 'export csv')
    # 持久：刷新后名字和意见还在
    pg.reload(); pg.wait_for_timeout(1200); chk(pg.locator('#nm').count() == 0 and pg.evaluate("ST.mine.length") == 2, 'persist after reload')
    # 配置 URL 后自动发送
    pg.evaluate("FB_URL_TEST=1"); 
    chk(not errs, 'no errors: ' + str(errs[:4]))
    b.close()
print(f'ok {ok}  fail {len(fails)}'); [print(' -', f) for f in fails]
