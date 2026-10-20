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
    q02()
    chk(not errs,'browser errors: '+str(errs))
    print(f'gpt_schedule: {checks} passed')
    browser.close()
