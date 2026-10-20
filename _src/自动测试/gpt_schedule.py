from browser_env import launch_browser
from pathlib import Path
from playwright.sync_api import sync_playwright
import os, sys
checks=0

def chk(v,m):
    global checks
    assert v,m
    checks+=1

with sync_playwright() as p:
    browser=launch_browser(p)
    pg=browser.new_page(viewport={'width':1440,'height':1000})
    errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.route('https://script.google.com/**',lambda r:r.fulfill(status=200,body='ok'))
    pg.goto(Path(os.environ['TRIAL_HTML']).as_uri());pg.wait_for_timeout(700)
    pg.fill('#nm','排班回归');pg.click('[data-do=nameOk]')
    fr=lambda t: next(f for f in pg.frames if f.parent_frame and f.frame_element().get_attribute('title')==t)
    A,S=fr('机构端'),fr('学生端')
    A.evaluate("enter('c5','L3','t');go('booking');render()")
    def wait():pg.wait_for_timeout(200)
    def q01():
        r=A.evaluate("""(()=>{const day=3,t=3,cid='c1'; BOOK.filter(b=>b.cid===cid&&b.day===day&&b.t===t).forEach(b=>b.st='cancelled'); setSlot(cid,day,t,'open'); SCHM[cid][dkey(DD(day))][t]='open'; const event={t:'book',core:'lin',cid,date:DD(day).toISOString(),ti:t}; LY_in(event); const a=lyBook(CORE.lin); const n=BOOK.length; LY_in({...event,core:'chen'}); const collision=BOOK.slice(n).some(b=>b.sid===CORE.chen.id); const dup={id:'dup',sid:CORE.wang.id,cid,day,t,st:'confirm',at:new Date(NOW)}; BOOK.push(dup); ACT.bOk('dup'); return {collision,a:a&&a.st,duplicate:dup.st,reject:!!RULES.bookReject.chen};})()""")
        chk(r['a']=='confirm' and not r['collision'] and r['reject'],'Q01 submit rejects slot conflict')
        chk(r['duplicate']=='confirm','Q01 confirm rechecks conflict')
    def q02():
        A.evaluate("const day=8,t=0,cid='c1'; setSlot(cid,day,t,'open');render()")
        wait()
        chk(S.evaluate("(()=>{const di=DAYS.findIndex(d=>d.getDate()===22&&d.getMonth()===9);return slotState(ci('c1'),di,0)})()")=='open','Q02 later calendar opening synced by date')
        A.evaluate("const bb={id:'future-book',sid:CORE.huang.id,cid:'c1',day:8,t:0,st:'confirm',at:new Date(NOW)};BOOK.push(bb);setSlot('c1',8,0,'bk');render()")
        wait()
        chk(S.evaluate("(()=>{const di=DAYS.findIndex(d=>d.getDate()===22&&d.getMonth()===9);return slotState(ci('c1'),di,0)})()")=='taken','Q02 booking marks calendar and student slot occupied')
        chk(A.evaluate("SCHM.c1['10/22'][0]")=='bk','Q02 occupancy retained outside legacy five-day SCHED')
    q01()
    def r05():
        S.evaluate("reset('A');prepare('home');S.bk={cid:'c1',di:2,ti:3,st:'待确认',kind:'预咨询',mode:'线下',topics:[]};render()")
        wait()
        bid=A.evaluate("lyBook(CORE.lin).id")
        A.evaluate("setSlot('c1',4,1,'open');S.form={slot:'4-1'}")
        A.evaluate("ACT.bMoveOk("+repr(bid)+");render()")
        wait()
        chk(A.evaluate("BOOK.find(b=>b.id==="+repr(bid)+").st")=='move','R5 institution remains proposal pending')
        chk(S.evaluate("S.bk.st")=='已改约','R5 student is asked to accept proposal')
        S.evaluate("ACT.movedOk();render()")
        wait()
        chk(A.evaluate("BOOK.find(b=>b.id==="+repr(bid)+").st")=='ok','R5 student ack confirms institution')
        chk(S.evaluate("S.bk.st")=='已确认','R5 confirmation returns to student')
        n=A.evaluate("AUDIT.filter(x=>x.t.includes('学生接受老师提议')).length")
        S.evaluate("render()");wait()
        chk(A.evaluate("AUDIT.filter(x=>x.t.includes('学生接受老师提议')).length")==n,'R5 ack emitted once')
    q02()
    def r06():
        S.evaluate("reset('B');prepare('home');S.bk=null;render()")
        wait()
        A.evaluate("BOOK.filter(b=>b.sid===CORE.chen.id).forEach(b=>b.st='cancelled');setSlot('c1',5,2,'open');render()")
        wait()
        S.evaluate("S.ivc={st:'sub',edue:'10/20 18:00',entryUntil:'2026-10-20T18:00:00',ik:{st:'sent',sum:[{name:'诉求',v:'想聊聊'}]}};S.bk={cid:'c1',di:4,ti:2,st:'待确认',kind:'预咨询',mode:'线下',topics:[],inv:true,intake:S.ivc.ik};render()")
        wait()
        # Student date index 3 is institution date index 4.
        bid=A.evaluate("lyBook(CORE.chen).id")
        A.evaluate("S.form={why:'时段冲突',note:'周五临时外出'};ACT.bNoOk("+repr(bid)+");render()")
        wait()
        chk(S.evaluate("S.bk===null && S.ivc.st==='entry'"),'R6 decline returns invited student to entry')
        chk(S.evaluate("S.ivc.edue==='10/20 18:00' && S.ivc.ik.st==='sent'"),'R6 deadline and intake retained')
        chk(A.evaluate("BOOK.find(b=>b.id==="+repr(bid)+").st")=='no','R6 declined application remains auditable')
        chk(S.evaluate("S.info.body.includes('周五临时外出') && S.inbox[0].d[0].includes('周五临时外出')"),'Q15 actual reason and note in primary notification and inbox')
    r05()
    def q03():
        S.evaluate("reset('A');prepare('home');S.bk=null;render()")
        wait()
        A.evaluate("BOOK.filter(b=>b.sid===CORE.lin.id).forEach(b=>b.st='cancelled');setSlot('c1',7,1,'open');render()")
        wait()
        S.evaluate("S.bk={cid:'c1',di:6,ti:1,st:'待确认',kind:'预咨询',mode:'线下',topics:[]};render()")
        wait()
        bid=A.evaluate("lyBook(CORE.lin).id")
        A.evaluate("ACT.bOk("+repr(bid)+");render()")
        wait()
        A.evaluate("S.form={rgc:'c1',rgt:'计划性关时段',rgd:'2026-10-21'};ACT.schedRegGo();render()")
        chk(A.evaluate("BOOK.find(b=>b.id==="+repr(bid)+").st")=='ok','Q03 planned closure blocked while appointment exists')
        A.evaluate("S.form={rgc:'c1',rgt:'病假停诊',rgd:'2026-10-21',rgw:'突发病假'};ACT.schedRegGo();render()")
        wait()
        chk(A.evaluate("BOOK.find(b=>b.id==="+repr(bid)+").st")=='adjust','Q03 affected appointment becomes center-adjusted')
        chk(A.evaluate("SCHM.c1['10/21'].every(v=>v==='off')"),'Q03 suspension immediately closes date slots')
        chk(S.evaluate("S.bk.centerAdjusted && S.bk.st.includes('中心调整')"),'Q03 student informed without cancellation quota')
        chk(S.evaluate("S.ops.filter(x=>x.type==='cancel').length")==0,'Q03 no student quota charged')
        chk(A.evaluate("NOTI.some(n=>n.to==='c5'&&n.txt&&n.txt.includes('病假停诊')) || NOTI.some(n=>n.to==='c5'&&JSON.stringify(n).includes('病假停诊'))"),'Q03 leader notified')
        A.evaluate("setSlot('c2',8,1,'open');S.form={who:'Maria',slot:'8-1'};ACT.assignBOk("+repr(bid)+");render()")
        wait()
        chk(S.evaluate("S.bk.cid==='c2' && !S.bk.centerAdjusted && S.bk.st==='待确认'"),'Q03 leader reassigns replacement time awaiting confirmation')
    r06()
    q03()
    chk(not errs,'browser errors: '+str(errs))
    print(f'gpt_schedule: {checks} passed')
    browser.close()
