"""R12/Q07: expiry enforced on both ends, exact deadline text and one reminder."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
from browser_env import launch_browser
with sync_playwright() as p:
 b=launch_browser(p);a=b.new_page(viewport={'width':1440,'height':1000});errors=[];a.on('pageerror',lambda e:errors.append(str(e)))
 a.goto(Path(os.environ['ADM_HTML']).as_uri());a.evaluate("enter('c5','L3','test');IVB=RULES.ivb={name:'deadline',by:'c5',at:new Date(NOW),list:[{sid:CORE.lin.id,lv:4,resp:'c1',st:'new'}],piles:{bad:[],skip:[],has:[]}};ACT.ivSendGo('all');render()")
 assert a.evaluate("ivb().list[0].due===ivStamp(ivb().list[0].replyUntil)"),'same displayed and stored deadline'
 a.evaluate("NOW.setTime(+new Date(ivb().list[0].replyUntil)-23*H);render();render()")
 assert a.evaluate("ivb().list[0].reminder===1"),'24 hour reminder once'
 a.evaluate("NOW.setTime(+new Date(ivb().list[0].replyUntil)+1);render()")
 assert a.evaluate("ivb().list[0].st==='late' && ivb().list[0].lateType==='reply'"),'card expires'
 a.evaluate("LY_in({t:'ivcReply',core:'lin',ivc:{id:ivb().list[0].id,rv:99,st:'acc'}})")
 assert a.evaluate("ivb().list[0].st==='late'"),'server refuses stale acceptance'
 a.evaluate("Object.assign(ivb().list[0],{st:'entry',entryUntil:new Date(+NOW-1).toISOString()});render()")
 assert a.evaluate("ivb().list[0].st==='late' && ivb().list[0].lateType==='entry'"),'entry expires and returns to teacher'
 s=b.new_page(viewport={'width':1440,'height':1000});s.on('pageerror',lambda e:errors.append(str(e)));s.goto(Path(os.environ['STU_HTML']).as_uri());s.evaluate("reset('A');prepare('home');ACT.zIvc();S.ivc.replyUntil=new Date(+NOW-1).toISOString();ACT.ivAcc();render()")
 assert s.evaluate("S.ivc.st==='late' && S.page!=='intake'"),'student cannot accept expired card'
 s.evaluate("Object.assign(S.ivc,{st:'entry',entryUntil:new Date(+NOW-1).toISOString()});S.bk=null;ACT.bookSubmit();render()")
 assert s.evaluate("!S.bk && S.ivc.st==='late'"),'student cannot apply after entry deadline'
 assert '模拟日期' in s.inner_text('.demo'),'frozen demo date explicit'
 assert not errors,errors
 b.close()
print('gpt_deadlines: 8 passed; 0 page errors')
