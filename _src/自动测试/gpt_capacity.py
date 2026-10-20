"""R7: real slots, one-to-one eligibility, protected entries, queue and dynamic capacity."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
from browser_env import launch_browser
with sync_playwright() as p:
 b=launch_browser(p); page=b.new_page(viewport={'width':1440,'height':1000}); errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(Path(os.environ['ADM_HTML']).as_uri())
 page.evaluate("""enter('c5','L3','test'); BOOK.forEach(b=>b.st='cancelled');SC.forEach(c=>Object.values(SCHM[c]).forEach(row=>row.fill('off'))); RULES.pool.inv=100;RULES.pool.hold=0;RULES.slotPool={};RULES.slotRatio=null;CORE.lin.owner=null;CORE.huang.owner=null;CORE.wang.owner=null;IVB=RULES.ivb={name:'capacity',by:'c5',at:new Date(NOW),list:[],piles:{bad:[],skip:[],has:[]}};
 SCHM.c1['10/16'][2]='open';SCHM.c2['10/16'][2]='open';
 IVB.list=[{id:'one',sid:CORE.lin.id,allowedCid:'c1',st:'queue',lv:4,resp:'c1'},{id:'two',sid:CORE.huang.id,st:'queue',lv:3,resp:'c2'}];ivAllocate();render();""")
 assert page.evaluate("ivb().list.every(x=>x.st==='entry') && new Set(ivb().list.map(x=>x.holdKey)).size===2"),'distinct compatible holds'
 assert page.evaluate("!ivSlotAllowed(CORE.huang.id,'c1','2026-10-16','14:00') && ivSlotAllowed(CORE.huang.id,'c2','2026-10-16','14:00')"),'unrestricted student cannot take restricted student only slot'
 assert page.evaluate("!ivCanCloseSlots(['c1|2026-10-16|14:00'])"),'planned close protects entry'
 page.evaluate("RULES.pool.hold=100;ivPool()"); assert page.evaluate("ivEntries().every(x=>ivPool().invite.some(s=>s.key===x.holdKey))"),'hold budget cannot hide protected keys'; page.evaluate("RULES.pool.hold=0;RULES.pool.inv=0;ivPool()")
 assert page.evaluate("ivPool().inv===2 && ivPool().norm===0"),'ratio cannot remove protected slots'
 page.evaluate("ivb().list.push({id:'three',sid:CORE.wang.id,st:'queue',lv:3,resp:'c1'});ivAllocate()")
 assert page.evaluate("ivb().list[2].st==='queue'"),'capacity exhaustion queues'
 page.evaluate("RULES.pool.inv=100;SCHM.c3['10/19'][2]='open';ivAllocate()")
 assert page.evaluate("ivb().list[2].st==='entry'"),'new real capacity advances queue'
 page.evaluate("SCHM.c1['10/16'][2]='off';ivScheduleChanged({reason:'病假停诊'});render()")
 assert page.evaluate("ivb().list[0].st==='adjust'"),'sudden suspension adjusts impossible entry'
 assert page.evaluate("ivPool().slots.length===2 && RULES.pool.R===ivPool().slots.length-ivEntries().filter(x=>x.holdKey).length"),'numbers reflect actual schedule'
 assert page.evaluate('(()=>{const p=ivPool();return p.norm+p.inv-p.protected===RULES.pool.R})()'),'reassignable counts exclude protected entries exactly once'
 assert not errors,errors
 b.close()
print('gpt_capacity: 10 passed; 0 page errors')
