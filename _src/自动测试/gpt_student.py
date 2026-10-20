"""Focused browser regressions for the GPT student and preview repairs.
Run: python3 gpt_student.py Q09 (or all).
"""
from browser_env import launch_browser
from pathlib import Path
import os
import sys
from playwright.sync_api import sync_playwright

TARGETS = set(sys.argv[1:] or ['all'])
failures = []
checks = 0

def chk(value, text):
    global checks
    checks += 1
    if not value:
        failures.append(text)
        print('FAIL:', text)

def want(key):
    return 'all' in TARGETS or key in TARGETS

with sync_playwright() as p:
    browser = launch_browser(p)
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    context.route('https://**/*', lambda route: route.fulfill(status=200, body='{}', content_type='application/json'))
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(Path(os.environ['STU_HTML']).as_uri())
    E = page.evaluate

    if want('Q09'):
        E("reset('C');prepare('home');render();ACT.zIvc();ACT.ivAcc();render()")
        page.locator('[data-act=ikTog]').first.click()
        page.locator('[data-act=ikNextQ]').click()
        text = '这段尚未点击下一题的文字要保留在草稿里'
        page.locator('#ikTxt').fill(text)
        page.locator('[data-act=ikX]').click()
        chk('首页' in page.locator('#modal').inner_text() and '我的预约' not in page.locator('#modal').inner_text(), 'Q09 invite exit points to Home')
        page.locator('[data-act=ikSave]').click()
        chk(E('S.ivc.ik.ans.trouble') == text, 'Q09 current answer is saved before Next')
        page.locator('[data-act=ivIkGo]').click()
        chk(page.locator('#ikTxt').input_value() == text and E('S.ik.i') == 1, 'Q09 resumes same question with unsent text')
        # Pending multi-select and own text also survive, including with no completed answer.
        E("reset('C');prepare('home');render();ACT.zIvc();ACT.ivAcc();render()")
        page.locator('#ikOwn').fill('新的话题')
        page.locator('[data-act=ikX]').click()
        chk(E('S.modal') == 'ikClose', 'Q09 first current-only answer opens save prompt')
        page.locator('[data-act=ikSave]').click()
        page.locator('[data-act=ivIkGo]').click()
        chk(page.locator('#ikOwn').input_value() == '新的话题' and E('S.ik.i') == 0, 'Q09 multi input survives current-only close/save')
        # Probe state must not duplicate the first short answer when resumed.
        E("ACT.ikNextQ();render()")
        page.locator('#ikTxt').fill('很累')
        page.locator('[data-act=ikNextQ]').click()
        page.locator('#ikTxt').fill('主要在晚上出现')
        page.locator('[data-act=ikX]').click()
        page.locator('[data-act=ikSave]').click()
        page.locator('[data-act=ivIkGo]').click()
        chk(E('S.ik.probe') and page.locator('#ikTxt').input_value() == '主要在晚上出现', 'Q09 probe input and step resume')
        page.locator('[data-act=ikNextQ]').click()
        chk(E('S.ik.ans.trouble') == '很累；主要在晚上出现', 'Q09 resumed probe appends once')

    if want('Q08'):
        E("reset('A');prepare('home');render();ACT.go('book');render()")
        page.locator('[data-act=pickSlot]').first.click()
        page.locator('[data-act=bookSubmit]').click()
        page.locator('[data-act=ikNo]').click()
        E('ACT.zMove();render()')
        chk('新时间需要你接受才会确认' in page.locator('#modal').inner_text(), 'Q08 modal requires acceptance')
        E("S.modal=null;S.page='mybook';render()")
        body = page.locator('#app').inner_text()
        chk('新时间需要你接受才会确认' in body and '不用操作' not in body and '待接受新时间' in body, 'Q08 body and badge agree on required acceptance')
        page.locator('[data-act=movedOk]').click()
        chk(E('S.bk.st') == '已确认' and '待接受新时间' not in page.locator('#app').inner_text(), 'Q08 acceptance changes status to confirmed')

    chk(not errors, 'no browser page errors: ' + repr(errors))
    browser.close()

print(f'gpt_student {",".join(sorted(TARGETS))}: {checks - len(failures)} passed, {len(failures)} failed')
raise SystemExit(bool(failures))
