"""R2/Q05: invitation, private draft, queue, preferences and booking cross both frames once."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
from browser_env import launch_browser
with sync_playwright() as p:
 b=launch_browser(p); page=b.new_page(viewport={'width':1440,'height':1000}); errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('https://script.google.com/**',lambda r:r.fulfill(status=200,body='ok'))
 page.goto(Path(os.environ['TRIAL_HTML']).as_uri()); page.wait_for_timeout(800)
 if page.locator('#nm').count(): page.fill('#nm','邀约联动'); page.click('[data-do=nameOk]')
 frames={f.frame_element().get_attribute('title'):f for f in page.frames if f.parent_frame}; s=frames['学生端']; a=frames['机构端']
 a.evaluate("enter('c5','L3','test');BOOK.filter(b=>b.sid===CORE.lin.id).forEach(b=>b.st='cancelled');IVB=RULES.ivb={name:'联动测试',by:'c5',at:new Date(NOW),list:[{sid:CORE.lin.id,lv:4,st:'new',resp:'c1'}],piles:{bad:[],skip:[],has:[]}};render()")
 s.evaluate("reset('A');prepare('home');S.bk=null;render()")
 page.wait_for_timeout(150)
 a.evaluate("ACT.ivSendGo('all');render()")
 page.wait_for_timeout(250)
 assert s.evaluate("S.ivc && S.ivc.st==='wait'"),'teacher send -> received card'
 pub=page.evaluate("JSON.stringify(last['机构端'].__ivc.lin)")
 assert 'lv' not in pub and 'score' not in pub, pub
 s.evaluate("S.ivQ=true;ACT.ivAcc();ACT.zIk();ACT.ikDraft();render()")
 page.wait_for_timeout(250)
 assert a.evaluate("ivb().list[0].st==='ik' && !ivb().list[0].ik"),'draft stays private'
 s.evaluate("ACT.ivIkGo();ACT.zIk();ACT.ikSendSum();render()")
 page.wait_for_timeout(400)
 assert a.evaluate("ivb().list[0].ik.st==='sent'"),'summary before booking'
 # Force capacity pause as a separate demo run so queue and turn can be observed.
 s.evaluate("S.ivc.demo=true;S.ivc.demoQueue=true;S.ivc.st='queue';S.ivQ=true;ivTouch();render()")
 page.wait_for_timeout(250)
 # preference reply, no more than three
 s.evaluate("S.ivc.st='entry';S.ivc.edue=ivDay(2);ACT.ivFit();ACT.ivFitT('10/15 上午');ACT.ivFitT('10/16 下午');ACT.ivFitOk();render()")
 page.wait_for_timeout(250)
 assert a.evaluate("ivb().list[0].st==='nofit' && ivb().list[0].fit.length===2"),'preferred times reach teacher'
 a.evaluate("ACT.ivReentry(ivb().list[0].id);render()")
 page.wait_for_timeout(250)
 assert s.evaluate("S.ivc.st==='entry'"),'teacher reopens after no fit'
 s.evaluate("S.page='book';S.bookTab='time';render()")
 s.locator('[data-act=pickSlot]').first.click(); s.evaluate("ACT.bookSubmit();render()")
 page.wait_for_timeout(450)
 assert a.evaluate("lyBook(CORE.lin).st==='confirm' && lyBook(CORE.lin).src==='主动邀约' && !!lyBook(CORE.lin).intake.sum"),'request carries source and summary'
 assert a.evaluate("ivb().list[0].bid===lyBook(CORE.lin).id && ivb().list[0].st==='sub'"),'batch links actual pending booking'
 count=a.evaluate("BOOK.filter(b=>b.sid===CORE.lin.id).length")
 s.evaluate("render();render();render()")
 page.wait_for_timeout(150)
 assert a.evaluate("BOOK.filter(b=>b.sid===CORE.lin.id).length")==count,'no duplicate cross frame action'
 a.evaluate("ACT.bOk(lyBook(CORE.lin).id);render()")
 page.wait_for_timeout(250)
 assert s.evaluate("S.bk.st==='已确认'"),'teacher confirms -> student'
 assert not errors,errors
 b.close()
print('gpt_invite_link: 10 passed; 0 page errors')
