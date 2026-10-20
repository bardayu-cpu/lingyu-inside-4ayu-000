"""1440×1000 visual evidence and copy checks for the delivered full demo."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_env import launch_browser
OUT=Path(__file__).resolve().parents[1]/'验证记录/screenshots'
OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=launch_browser(p);page=browser.new_page(viewport={'width':1440,'height':1000});errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('https://script.google.com/**',lambda r:r.fulfill(status=200,body='ok'))
    page.goto(Path(os.environ['TRIAL_HTML']).as_uri());page.wait_for_timeout(800)
    page.fill('#nm','版本复核');page.click('[data-do=nameOk]')
    fr=lambda title:next(f for f in page.frames if f.parent_frame and f.frame_element().get_attribute('title')==title)
    A,S=fr('机构端'),fr('学生端')
    page.click('[data-side="机构端"]')
    for tab,name in [('inv','01-主动邀约'),('man','02-人工咨询'),('pool','03-号池配置'),('sched','04-排班表')]:
        A.evaluate("tab=>{enter('c5','L3');go('booking');S.tabs.booking=tab;render()}",tab)
        page.wait_for_timeout(180)
        assert A.locator('#pg').inner_text().strip(),name
        assert A.evaluate('document.documentElement.scrollWidth<=innerWidth'),name+' horizontal overflow'
        if tab=='inv':assert '本窗口尚可承接' not in A.locator('#pg').inner_text()
        page.screenshot(animations='disabled',path=str(OUT/(name+'.png')))
    A.evaluate("enter('a1','ADM');ACT.setTab('duty');render()")
    page.screenshot(animations='disabled',path=str(OUT/'05-管理员只读值班表.png'))
    page.click('[data-side="学生端"]')
    S.evaluate("reset('A');prepare('home');ACT.zIvc();render()")
    page.wait_for_timeout(600);page.screenshot(animations='disabled',path=str(OUT/'06-学生邀约卡.png'))
    S.evaluate("ACT.ivAcc();render()")
    page.wait_for_timeout(600);page.screenshot(animations='disabled',path=str(OUT/'07-预咨询开场.png'))
    S.evaluate("S.page='home';S.modal=null;S._ivIk=false;S.bk=null;S.ivc.st='acc';render()")
    assert '聊完就可以' not in S.locator('body').inner_text(),'no unconditional appointment promise'
    assert '暂时没有时需要等待通知' in S.locator('body').inner_text(),'wait condition explained'
    assert not errors,errors
    browser.close()
print('gpt_visual: 7 screenshots; copy and layout checks passed; 1440 x 1000; 0 page errors')
