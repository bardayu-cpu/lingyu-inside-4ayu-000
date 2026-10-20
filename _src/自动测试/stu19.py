from browser_env import launch_browser
import os
from playwright.sync_api import sync_playwright
# v1.19：主动邀约（邀约卡 → 预咨询 → 入口 → 申请）、所有预约都要老师确认
ok = 0; fails = []; errs = []
def chk(c, m):
    global ok
    if c: ok += 1
    else: fails.append(m); print('FAIL', m)
with sync_playwright() as p:
    b = launch_browser(p); pg = b.new_page(viewport={'width': 1440, 'height': 1000})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.environ['STU_HTML']); pg.wait_for_timeout(400); E = pg.evaluate
    # 普通号：提交后是待确认，默认弹预咨询，可跳过
    E("reset('A');prepare('home');render();ACT.go('book');render()")
    E("(()=>{const e=document.querySelector('[data-act=pickSlot]');e.click()})()"); E("ACT.bookSubmit();render()")
    chk(E("S.bk.st") == '待确认', 'normal booking is a request'); chk(E("S.modal") == 'ikWelcome', 'normal booking asks for intake')
    chk('等老师确认' in pg.inner_text('#modal'), 'welcome top says waiting for confirmation')
    E("ACT.ikNo();render()"); chk(E("S.bk.intake.st") == 'skipped', 'intake skippable')
    t = pg.inner_text('#app'); chk('提交申请' in t and '老师确认' in t, 'timeline uses teacher confirm')
    # 邀约卡
    E("reset('C');prepare('home');render()"); chk(pg.locator('[data-act=zIvc]').count() == 1, 'demo button for invite card')
    E("ACT.zIvc();render()"); m = pg.inner_text('#modal'); chk('心理中心邀请你聊一聊' in m and '3 分钟' in m and '这次不参加' in m, 'card copy (8.1)')
    E("ACT.ivNo();render()"); chk('确定这次不参加吗' in pg.inner_text('#modal'), 'decline asks to confirm')
    E("ACT.ivcOpen();render();ACT.ivAcc();render()"); chk(E("S.page") == 'intake' and E("S.ik.inv") and E("S.ik.qs.length") == 8, 'accept starts high-risk intake')
    chk('心理中心邀请你聊一聊' in pg.inner_text('#app'), 'high-risk opening text')
    E("ACT.zIk();render();ACT.ikSendSum();render()"); chk(E("S.page") == 'book' and E("S.ivc.st") == 'entry' and not E("S.bk"), 'after intake goes to pick time')
    t = pg.inner_text('#app'); chk('可以选和老师见面的时间了' in t and E('S.ivc.edue') in t and '小屿温馨提醒' not in t, 'entry strip with deadline'); chk(pg.locator('[data-act=ivFit]').count() == 1, 'none-fit link')
    E("(()=>{document.querySelector('[data-act=pickSlot]').click()})()"); E("ACT.bookSubmit();render()")
    chk(E("S.bk.st") == '待确认' and E("S.bk.inv") and E("S.bk.intake.st") == 'sent' and E("S.modal") == 'booked', 'submit request carries intake, no second intake window')
    chk(E("S.ivc.st") == 'sub', 'invite marked submitted')
    # 排队
    E("reset('C');prepare('home');render();ACT.zIvQ();ACT.zIvc();ACT.ivAcc();ACT.zIk();ACT.ikSendSum();render()"); chk(E("S.ivc.st") == 'queue' and E("S.modal") == 'ivcQ', 'queue message')
    chk('谢谢你，老师已经收到' in pg.inner_text('#modal'), 'queue copy (8.2)')
    E("ACT.close();render();ACT.zIvTurn();render()"); chk(E("S.ivc.st") == 'entry' and E('S.ivc.edue') in pg.inner_text('#app'), 'your turn notice')
    # 时间都不合适
    E("ACT.go('book');render();ACT.ivFit();render()"); E("document.querySelectorAll('[data-act=ivFitT]')[0].click()"); E("document.querySelectorAll('[data-act=ivFitT]')[1].click()"); E("ACT.ivFitOk();render()")
    chk(E("S.ivc.st") == 'nofit' and len(E("S.ivc.fit")) == 2, 'none-fit saves up to 3 times')
    # 预咨询中途退出（没答）也能往下走
    E("reset('C');prepare('home');render();ACT.zIvc();ACT.ivAcc();ACT.ikX();render()"); chk(E("S.ivc.st") == 'entry' and E("S.ivc.ik.st") == 'skipped', 'closing intake without answers still gives entry')
    print(f'stu19: {ok} passed, {len(fails)} failed, errors {len(errs)}'); [print(' -', f) for f in fails]; print(errs[:3])

raise SystemExit(bool(fails or errs))
