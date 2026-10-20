"""R9 permission boundary: direct actions enforce institutional roles."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_env import launch_browser
with sync_playwright() as p:
    b=launch_browser(p);page=b.new_page(viewport={'width':1440,'height':1000});errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(Path(os.environ['ADM_HTML']).as_uri())
    page.evaluate("enter('c5','L3');ivb().list=[{sid:CORE.lin.id,lv:4,resp:'c1',st:'new'},{sid:CORE.chen.id,lv:4,resp:'c2',st:'new'}];ivIdentity()")
    for role in ['ADM','L1']:
        before=page.evaluate('({batch:JSON.stringify(ivb()),audit:AUDIT.length})')
        page.evaluate("role=>{S.role=role;S.uid='c5';ACT.ivSendGo('all')}",role)
        assert page.evaluate('({batch:JSON.stringify(ivb()),audit:AUDIT.length})')==before,role+' cannot send'
    page.evaluate("enter('c1','L2');ACT.ivSendGo('all')")
    assert page.evaluate("ivb().list[0].st==='sent' && ivb().list[1].st==='new'"),'L2 sends own students only'
    n=page.evaluate('AUDIT.length');page.evaluate("ACT.ivSendGo('all')")
    assert page.evaluate('AUDIT.length')==n,'repeated action does not audit/send again'
    page.evaluate("enter('c5','L3');ACT.ivSendGo('all')")
    assert page.evaluate("ivb().list.every(x=>x.st==='sent' && x.replyUntil)"),'L3 sends remaining students'
    assert not errors,errors
    b.close()
print('gpt_invite_permissions: 5 passed; 0 page errors')
