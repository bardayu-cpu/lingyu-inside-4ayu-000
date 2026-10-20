"""Invite bridge regression: drafts, acknowledgements, retained notes and action guards."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_env import launch_browser


def main():
    with sync_playwright() as p:
        browser = launch_browser(p)
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.route('https://script.google.com/**', lambda route: route.fulfill(status=200, body='ok'))
        page.goto(Path(os.environ['TRIAL_HTML']).as_uri())
        page.wait_for_timeout(1100)
        try:
            page.wait_for_selector('iframe[title="学生端"]', state='attached', timeout=12000)
            page.wait_for_selector('iframe[title="机构端"]', state='attached', timeout=12000)
        except Exception:
            raise AssertionError(f'trial frames failed to initialize: {errors}')
        if page.locator('#nm').count():
            page.fill('#nm', 'Invite privacy regression')
            page.click('[data-do=nameOk]')
        frame = lambda name: next(f for f in page.frames if f.parent_frame and f.frame_element().get_attribute('title') == name)
        student, admin = frame('学生端'), frame('机构端')
        student.wait_for_function("typeof LY_snap === 'function'", timeout=12000)
        admin.wait_for_function("typeof LY_snap === 'function'", timeout=12000)
        wait = lambda: page.wait_for_timeout(450)
        page.evaluate("""window.privacyEvents=[];const oldPrivacyFromStu=fromStu;fromStu=function(){const ev=oldPrivacyFromStu.apply(this,arguments);privacyEvents.push(...ev);return ev;}""")
        student.evaluate("reset('A');prepare('home');render()")
        wait()
        admin.evaluate("""enter('c5','L3');BOOK.forEach(b=>b.st='cancelled');
          SC.forEach(c=>Object.values(SCHM[c]).forEach(r=>r.fill('open')));CORE.lin.owner=null;
          RULES.pool.inv=100;RULES.pool.hold=0;RULES.slotPool={};RULES.slotRatio=null;
          IVB=RULES.ivb={id:'privacy',name:'privacy',at:new Date(NOW),by:'c5',list:[{id:'privacy-lin',sid:CORE.lin.id,
          lv:4,resp:'c1',st:'sent',sv:1,replyUntil:new Date(+NOW+48*H).toISOString(),due:ivDue(2)}],piles:{bad:[],skip:[],has:[]}};
          render();ACT.logout();render();""")
        wait()
        assert student.evaluate("S.ivc && S.ivc.id==='privacy-lin' && S.ivc.st==='wait'"), 'institution invite arrives at student'
        student.evaluate('ACT.ivAcc();render()')
        wait()
        assert admin.evaluate("!S.uid && ivb().list[0].st==='ik' && ivb().list[0].replyRv>0"), 'logged-out admin still processes student acceptance'
        assert student.evaluate("S.ivc.rv>0 && S.ivc.ack===S.ivc.rv && S.ivc.sv>1"), 'logged-out receiver returns revision acknowledgement'
        student.evaluate("S.ik.sel=['睡眠'];S.ik.own='PRIVATE_DRAFT_ONLY_7';ACT.ikDraft();render()")
        wait()
        assert student.evaluate("S.ivc.ik.st==='draft' && JSON.stringify(S.ivc.ik).includes('PRIVATE_DRAFT_ONLY_7')"), 'draft stays available locally after acknowledgement'
        assert not admin.evaluate("JSON.stringify(ivb()).includes('PRIVATE_DRAFT_ONLY_7') || JSON.stringify(LY_snap()).includes('PRIVATE_DRAFT_ONLY_7')"), 'draft text never reaches institution state or public snapshot'
        assert page.evaluate("privacyEvents.filter(e=>e.t==='ivcReply').every(e=>!JSON.stringify(e).includes('PRIVATE_DRAFT_ONLY_7'))"), 'draft is absent from bridge messages'
        print('Acceptance acknowledgement without admin login; draft remains local: passed')
        student.evaluate('ACT.ivIkGo();ACT.zIk();ACT.ikSendSum();render()')
        wait()
        assert student.evaluate("S.ivc.st==='entry' && S.ivc.ik.st==='sent'"), 'sending intake advances to a protected entry'

        def submit():
            arg = student.evaluate("""(()=>{const old=S.bk, k=S._slotAllowed.find(k=>{const [c,d,t]=k.split('|');return !old||c!==old.cid||DAYS[old.di].toISOString().slice(0,10)!==d||DATA.times[old.ti]!==t});const [c,d,t]=k.split('|');return c+':'+DAYS.findIndex(v=>v.toISOString().slice(0,10)===d)+':'+DATA.times.indexOf(t)})()""")
            student.evaluate('a=>{ACT.pickSlot(a);ACT.bookSubmit();render()}', arg)
            wait()
            return admin.evaluate('lyBook(CORE.lin).id')

        bid = submit()
        admin.evaluate("id=>{enter('c1','L2');ACT.bOpen(id);render()}", bid)
        wait()
        assert student.evaluate('S.bk.intake.viewed'), 'teacher viewing enables append'
        student.evaluate("S.ikAddT='SENT_NOTE_KEEP_9';ACT.ikAddOk();render()")
        wait()
        assert admin.evaluate("lyBook(CORE.lin).intake.adds.some(a=>a.t==='SENT_NOTE_KEEP_9') && ivb().list[0].ik.adds.some(a=>a.t==='SENT_NOTE_KEEP_9')"), 'sent note updates booking and invitation copies'
        admin.evaluate("id=>{S.dw=null;S.form={why:'时段冲突',note:'请另选方便的时间'};ACT.bNoOk(id);render()}", bid)
        wait()
        assert student.evaluate("!S.bk && S.ivc.st==='entry' && S.ivc.ik.adds.some(a=>a.t==='SENT_NOTE_KEEP_9')"), 'teacher decline retains latest note for re-entry'
        bid = submit()
        assert admin.evaluate("lyBook(CORE.lin).intake.adds.some(a=>a.t==='SENT_NOTE_KEEP_9')"), 'resubmission retains sent note'
        print('Sent note -> teacher decline -> re-entry -> resubmit: passed')
        admin.evaluate("enter('c5','L3');RULES.pool.inv=50;RULES.slotRatio=null;render()")
        wait()
        student.evaluate('S.modal=null;ACT.reschOk();render()')
        wait()
        bid = submit()
        assert student.evaluate("S.bk.inv && S.bk.ivId==='privacy-lin' && S.bk.intake.adds.some(a=>a.t==='SENT_NOTE_KEEP_9')"), 'pending reschedule retains invitation identity locally'
        assert admin.evaluate("lyBook(CORE.lin).ivId==='privacy-lin' && lyBook(CORE.lin).src==='主动邀约' && lyBook(CORE.lin).intake.adds.some(a=>a.t==='SENT_NOTE_KEEP_9') && ivb().list[0].bid===lyBook(CORE.lin).id"), 'new pending booking retains source, intake and batch link'
        stable = page.evaluate('privacyEvents.length')
        student.evaluate('render();render()')
        admin.evaluate('render();render()')
        wait()
        assert page.evaluate('privacyEvents.length') == stable, 'repeated renders do not replay cross-end actions'
        print('Pending reschedule preserves invitation, batch link and note; stable renders do not resend: passed')
        admin.evaluate("""id=>{const x=ivb().list[0];x.entryUntil=new Date(+NOW+H).toISOString();
          NOW.setTime(+NOW+2*H);S.form={why:'时段冲突',note:'请重新选时间'};ACT.bNoOk(id);render();}""", bid)
        wait()
        assert admin.evaluate("ivb().list[0].st==='entry' && new Date(ivb().list[0].entryUntil)>NOW && !!ivb().list[0].holdKey"), 'a request submitted in time must retain a valid protected entry when declined after its original submission deadline'
        assert student.evaluate("!S.bk && S.ivc.st==='entry' && S.ivc.ik.adds.some(a=>a.t==='SENT_NOTE_KEEP_9')"), 'student can select again after the old submission deadline without losing the summary'
        print('Teacher decline after old submission deadline returns a valid protected entry: passed')
        bid = submit()
        admin.evaluate("""id=>{NOW.setTime(+NOW+30*H);SC.forEach(c=>Object.values(SCHM[c]).forEach(row=>row.forEach((v,i)=>{if(v==='open')row[i]='off'})));
          S.mo='bNo:'+id;S.form={why:'时段冲突'};ACT.bNoOk(id);render();}""", bid)
        wait()
        assert admin.evaluate("id=>lyBook(CORE.lin).id===id && lyBook(CORE.lin).st==='confirm'", bid), 'without a matching replacement, decline must retain the original pending request'
        assert student.evaluate("!!S.bk && S.bk.st==='待确认'"), 'failed decline must not clear the student booking'
        print('No replacement time for renewed window: original pending request retained: passed')
        admin.evaluate("""enter('c5','ADM');const x=ivb().list[0];x.st='nofit';x.resp='c5';
          ivb().list.push({id:'privacy-new',sid:CORE.chen.id,lv:4,resp:'c5',st:'new',sv:1});
          ACT.ivReentry('privacy-lin');ACT.ivSendGo('all');render();""")
        assert admin.evaluate("ivb().list[0].st==='nofit' && ivb().list.find(x=>x.id==='privacy-new').st==='new'"), 'ADM dual-role account cannot mutate re-entry or send cards'
        assert not errors, errors
        print('ADM action permissions: passed')
        print('gpt_invite_privacy: 6 groups passed; 1440 x 1000; no browser errors')
        browser.close()


if __name__ == '__main__':
    main()
