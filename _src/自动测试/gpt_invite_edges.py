"""边界回归：真实跨端协议和容量分配的独立小场景，全部使用 1440×1000。"""
from browser_env import launch_browser
from pathlib import Path
from playwright.sync_api import sync_playwright
import os

count=0
errors=[]
def chk(ok,label):
    global count
    assert ok,label
    count+=1
    print('PASS',label)

with sync_playwright() as p:
    browser=launch_browser(p)
    def page(kind='ADM_HTML'):
        pg=browser.new_page(viewport={'width':1440,'height':1000})
        pg.on('pageerror',lambda e:errors.append(str(e)))
        pg.route('https://script.google.com/**',lambda r:r.fulfill(status=200,body='ok'))
        pg.goto(Path(os.environ[kind]).as_uri());pg.wait_for_timeout(400)
        return pg
    def admin_case(js):
        pg=page()
        result=pg.evaluate(js)
        pg.close()
        return result
    # 暂留仅能从未保护的号中取；保留后排的受限老师号。
    r=admin_case("""(()=>{const sid=CORE.lin.id;SU(sid).owner=null;const slots=[{key:'c1|2026-10-20|09:00',cid:'c1',date:'2026-10-20',time:'09:00',modes:['线下'],place:'中心',st:'open'},{key:'c1|2026-10-21|09:00',cid:'c1',date:'2026-10-21',time:'09:00',modes:['线下'],place:'中心',st:'open'},{key:'c2|2026-10-20|09:00',cid:'c2',date:'2026-10-20',time:'09:00',modes:['线下'],place:'中心',st:'open'}];schedSlots=()=>slots;const x={id:'edge-held',sid,st:'entry',allowedCid:'c2',holdKey:slots[2].key,entryUntil:'2026-10-14T10:00:00'};ivb().list=[x];RULES.pool.inv=100;RULES.pool.hold=1;RULES.slotPool={};RULES.slotRatio=null;const P=ivPool();return {contains:P.invite.some(s=>s.key===x.holdKey),matches:!!ivMatch([x],P.invite)};})()""")
    chk(r['contains'] and r['matches'],'held slot survives temporary hold allocation')
    # 预约桥实际使用 moveAccept，批次必须同步变成正式预约。
    r=admin_case("""(()=>{ivb().list=[{id:'edge-move',sid:CORE.lin.id,st:'sub',bid:'edge-book'}];const b={id:'edge-book',sid:CORE.lin.id,ivId:'edge-move'};ivBookChanged(b,'moveAccept');return ivb().list[0].st;})()""")
    chk(r=='ok','moveAccept confirms batch and appointment together')
    # 指定老师、方式和地点都影响实际可选集合。
    r=admin_case("""(()=>{const sid=CORE.lin.id;SU(sid).owner=null;const slots=[['c1','线下','中心'],['c2','线下','中心'],['c2','线上','异地'],['c2','线上','中心']].map(([cid,mode,place],i)=>({key:cid+'|2026-10-'+(20+i)+'|09:00',cid,date:'2026-10-'+(20+i),time:'09:00',modes:[mode],place,st:'open'}));schedSlots=()=>slots;ivb().list=[{id:'edge-constraints',sid,st:'entry',allowedCid:'c2',allowedMode:'线上',allowedPlace:'中心',entryUntil:'2026-10-14T10:00:00',holdKey:slots[3].key}];RULES.pool.inv=100;RULES.pool.hold=0;RULES.slotPool={};RULES.slotRatio=null;return slots.map(s=>ivSlotAllowed(sid,s.cid,s.date,s.time));})()""")
    chk(r==[False,False,False,True],f'allowed counsellor/mode/place enforced: {r}')
    # 已提交或确认后不在 entry 集合，改期列表仍须与预约接收端使用同一池。
    r=admin_case("""(()=>{const lin=CORE.lin.id,chen=CORE.chen.id;SU(lin).owner=SU(chen).owner=null;const slots=[20,21,22,23].map(day=>({key:'c1|2026-10-'+day+'|09:00',cid:'c1',date:'2026-10-'+day,time:'09:00',modes:['线下'],place:'中心',st:'open'}));schedSlots=()=>slots;BOOK.splice(0,BOOK.length,{id:'edge-inv',sid:lin,cid:'c1',day:3,t:0,st:'ok',ivId:'edge-x'},{id:'edge-normal',sid:chen,cid:'c1',day:3,t:1,st:'ok'});ivb().list=[{id:'edge-x',sid:lin,st:'ok',bid:'edge-inv'}];RULES.pool.inv=50;RULES.pool.hold=0;RULES.slotPool={};RULES.slotRatio=null;const publicMap=ivAllowedPublic();return ['lin','chen'].map(core=>{const sid=LY_CORE()[core].id,b=lyBook(SU(sid));const received=slots.filter(s=>ivSlotAllowed(sid,s.cid,s.date,s.time,b.id)).map(s=>s.key);return {core,visible:publicMap[core].slice().sort(),received:received.slice().sort()};});})()""")
    chk(all(x['visible']==x['received'] for x in r),f'normal and invite reschedule visibility matches receive gate: {r}')
    # 打开新时段后，队列应在当前 render/tick 自动晋级。
    r=admin_case("""(()=>{enter('c5','L3','t');const sid=CORE.lin.id;SU(sid).owner='c1';Object.values(SCHM).forEach(byDay=>Object.values(byDay).forEach(row=>row.fill('off')));Object.values(SCHED).forEach(rows=>rows.forEach(row=>row.fill('off')));BOOK.splice(0,BOOK.length);RULES.pool.inv=100;RULES.pool.hold=0;RULES.slotPool={};RULES.slotRatio=null;ivb().list=[{id:'edge-queue',sid,st:'queue',lv:4,resp:'c1',readyAt:new Date(NOW)}];ivAllocate();const before=ivb().list[0].st;S.schSel={c:'c1',k:'10/20'};S.mdraft={'10/20':['open','off','off','off']};ACT.mSave();render();const x=ivb().list[0];return {before,after:x.st,held:!!x.holdKey};})()""")
    chk(r['before']=='queue' and r['after']=='entry' and r['held'],f'newly published schedule advances queue: {r}')
    # 协议使用新 ID 时，即使客户端修订号重从 1 开始也要发送。
    pg=page('TRIAL_HTML');pg.fill('#nm','邀约边界回归');pg.click('[data-do=nameOk]');pg.wait_for_timeout(300)
    r=pg.evaluate("""(()=>{const base={inst:'edge',scen:'A',core:'lin',bk:null,cb:false,crisis:false,done:[],decl:[],inv:[]};const p={...base,ivc:{id:'demo-old',rv:5,st:'no'}},c={...base,ivc:{id:'demo-new',rv:1,st:'wait',demo:true}};return fromStu(p,c).some(e=>e.t==='ivcReply'&&e.ivc.id==='demo-new');})()""")
    chk(r,'new demo invitation ID is sent even when its rv is smaller')
    fr=lambda t:next(f for f in pg.frames if f.parent_frame and f.frame_element().get_attribute('title')==t)
    A,S=fr('机构端'),fr('学生端')
    A.evaluate("ivb().list=[];RULES.pool.inv=100;RULES.pool.hold=0;S.uid=null;render()")
    S.evaluate("reset('A');prepare('home');render()");pg.wait_for_timeout(200)
    S.evaluate("ACT.zIvc();render()");pg.wait_for_timeout(400)
    r={'student':S.evaluate("S.ivc && ({id:S.ivc.id,rv:S.ivc.rv,sv:S.ivc.sv})"),'server':A.evaluate("ivb().list.find(x=>x.sid===CORE.lin.id) && ({id:ivb().list.find(x=>x.sid===CORE.lin.id).id,rv:ivb().list.find(x=>x.sid===CORE.lin.id).replyRv})")}
    chk(r['server'] and r['student']['id']==r['server']['id'] and bool(r['student']['sv']),f'logged-out institution still acknowledges invitation reply: {r}')
    r=S.evaluate("""(()=>{S.bk={cid:'c1',di:1,ti:1,kind:'预咨询',st:'待确认',inv:true,ivId:'edge-source',topics:[],mode:'线下',intake:{st:'sent'}};S.ivc={id:'edge-source',st:'sub',rv:1};S.resch={approval:false,moved:false};S.pick={cid:'c1',di:2,ti:2};S.form={mode:'线下',topics:[]};ACT.bookSubmit();return {inv:S.bk&&S.bk.inv,id:S.bk&&S.bk.ivId};})()""")
    chk(r.get('inv') and r.get('id')=='edge-source',f'pending invite reschedule retains source and invitation ID: {r}')
    r=S.evaluate("""(()=>{S.bk={cid:'c1',di:1,ti:1,kind:'预咨询',st:'已确认',inv:true,ivId:'edge-source',topics:[],mode:'线下',intake:{st:'sent'},pend:{type:'resch',cid:'c1',di:2,ti:2,mode:'线下',topics:[]}};ACT.zPend();return {inv:S.bk&&S.bk.inv,id:S.bk&&S.bk.ivId};})()""")
    chk(r.get('inv') and r.get('id')=='edge-source',f'approved invite reschedule retains source and invitation ID: {r}')
    chk(not errors,'no browser script errors: '+str(errors))
    print(f'gpt_invite_edges: {count} passed')
    browser.close()
