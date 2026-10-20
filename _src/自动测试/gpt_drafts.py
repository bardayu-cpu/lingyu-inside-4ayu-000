"""R4: saving private intake answers must not send them across either frame."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
from browser_env import launch_browser

with sync_playwright() as p:
    browser = launch_browser(p)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.route('https://script.google.com/**', lambda route: route.fulfill(status=200, body='ok'))
    page.goto(Path(os.environ['TRIAL_HTML']).as_uri())
    page.wait_for_timeout(900)
    if page.locator('#nm').count():
        page.fill('#nm', 'R4 regression')
        page.click('[data-do=nameOk]')
    frames = {f.frame_element().get_attribute('title'): f for f in page.frames if f.parent_frame}
    student, admin = frames['学生端'], frames['机构端']
    admin.evaluate("enter('c1','L2','test'); BOOK.filter(b=>b.sid===CORE.lin.id).forEach(b=>b.st='cancelled'); render()")
    student.evaluate("reset('A');prepare('home');render();ACT.go('book');render()")
    student.locator('[data-act=pickSlot]').first.click()
    student.evaluate("ACT.bookSubmit();ACT.ikYes();ACT.zIk();ACT.ikDraft();render()")
    page.wait_for_timeout(500)
    assert student.evaluate("S.bk.intake.st === 'draft' && !!S.bk.intake.sum"), 'draft must remain local'
    assert page.evaluate("last['学生端'].bk.intake === null"), 'parent snapshot must not contain draft answers'
    assert admin.evaluate("!lyBook(CORE.lin).intake || !lyBook(CORE.lin).intake.sum"), 'teacher must not receive draft'
    student.evaluate("ACT.ikGo();ACT.zIk();ACT.ikSendSum();render()")
    page.wait_for_timeout(500)
    assert admin.evaluate("lyBook(CORE.lin).intake.st === 'sent' && !!lyBook(CORE.lin).intake.sum"), 'explicit send must still work'
    admin.evaluate("LY_in({t:'intake',core:'lin',intake:{st:'draft',ver:999,sum:[{k:'private',v:'PRIVATE_DRAFT'}]}});render()")
    assert admin.evaluate("lyBook(CORE.lin).intake.st === 'sent' && lyBook(CORE.lin).intake.ver !== 999"), 'receiving end must reject a draft too'
    assert not errors, errors
    browser.close()
print('gpt_drafts: 5 passed; 0 page errors')
