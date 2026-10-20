"""R9: cards remain unlimited; college limits govern protected manual entries (confirmed 6.4)."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_env import launch_browser
with sync_playwright() as p:
    b=launch_browser(p);a=b.new_page(viewport={'width':1440,'height':1000});errors=[]
    a.on('pageerror',lambda e:errors.append(str(e)));a.goto(Path(os.environ['ADM_HTML']).as_uri())
    a.evaluate("""enter('c5','L3');BOOK.forEach(b=>b.st='cancelled');RULES.pool.inv=100;RULES.pool.hold=0;RULES.pool.col={};RULES.slotPool={};RULES.slotRatio=null;
    Object.values(SCHM).forEach(days=>Object.values(days).forEach(row=>row.fill('open')));
    CORE.lin.owner=null;CORE.chen.owner=null;CORE.huang.owner=null;CORE.lin.college=CORE.chen.college=COLLEGES[0];CORE.huang.college=COLLEGES[1];
    ivb().list=[{id:'q-lin',sid:CORE.lin.id,resp:'c1',lv:4,st:'new'},{id:'q-chen',sid:CORE.chen.id,resp:'c1',lv:4,st:'new'},{id:'q-huang',sid:CORE.huang.id,resp:'c2',lv:4,st:'new'}];RULES.pool.col[COLLEGES[0]]=0;ACT.ivSendGo('all');""")
    assert a.evaluate("ivb().list.every(x=>x.st==='sent')"),'zero entry quota must not prevent invitations'
    a.evaluate("ivb().list.forEach(x=>x.st='queue');ivAllocate()")
    assert a.evaluate("ivb().list[0].st==='queue' && ivb().list[1].st==='queue' && ivb().list[2].st==='entry'"),'zero quota queues own college without blocking shared college'
    a.evaluate("RULES.pool.col[COLLEGES[0]]=1;ivAllocate()")
    assert a.evaluate("ivCollegeUsed(COLLEGES[0])===1 && ivb().list.filter(x=>x.st==='entry').length===2"),'one quota gives one real entry'
    before=a.evaluate('AUDIT.length');a.evaluate('ivAllocate();ivAllocate()')
    assert a.evaluate('AUDIT.length')==before,'stable allocations do not repeat audits'
    a.evaluate("RULES.pool.col[COLLEGES[0]]=0;ivAllocate()")
    assert a.evaluate("ivCollegeUsed(COLLEGES[0])===1"),'lower quota never withdraws issued entry'
    a.evaluate("RULES.pool.hold=1;RULES.pool.apps.push({id:'quota-approve',col:COLLEGES[0],n:1,by:'c1',why:'新增时段',at:new Date(NOW),st:'wait'});ACT.poolAppOk('quota-approve');render()")
    assert a.evaluate("RULES.pool.col[COLLEGES[0]]===2 && ivCollegeUsed(COLLEGES[0])===2"),'approval adds usable quota on top of existing commitments'
    state=a.evaluate('JSON.stringify(RULES.pool)');a.evaluate("ACT.poolAppOk('quota-approve')")
    assert a.evaluate('JSON.stringify(RULES.pool)')==state,'approval cannot release twice'
    a.evaluate("ivb().list[0].st='sub';ivb().list[1].st='ok'")
    assert a.evaluate('ivCollegeUsed(COLLEGES[0])===2'),'submitted and confirmed arrangements retain quota'
    a.evaluate("ivb().list[0].st='late'")
    assert a.evaluate('ivCollegeUsed(COLLEGES[0])===1'),'expired entry releases college quota'
    a.evaluate("delete RULES.pool.col[COLLEGES[0]];ivb().list[0].st='queue';ivAllocate()")
    assert a.evaluate("ivb().list[0].st==='entry'"),'unassigned college uses available shared capacity'
    a.evaluate("S.form={apc:COLLEGES[0],apn:'1.5',apw:'test'};const n=RULES.pool.apps.length;ACT.ivAppGo();window.noFraction=RULES.pool.apps.length===n")
    assert a.evaluate('window.noFraction'),'request quantities are positive integers'
    a.evaluate("go('booking');S.tabs.booking='pool';render()")
    assert '已占用额度' in a.locator('#pg').inner_text(),'quota display counts entries rather than cards'
    assert not errors,errors;b.close()
print('gpt_invite_quota: 12 passed; 0 page errors')
