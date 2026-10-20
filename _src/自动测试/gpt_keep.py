"""R1 / H: real trial refresh with keep.js enabled, rather than webdriver default-off."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_env import launch_browser


def frames(page):
    found = {f.frame_element().get_attribute('title'): f for f in page.frames if f.parent_frame}
    return found['学生端'], found['机构端']


def proof(page, student, admin):
    return {
        'student': student.evaluate("({inst:S._ly,booking:S.bk&&{st:S.bk.st,cid:S.bk.cid,di:S.bk.di,ti:S.bk.ti},keep:KEEP.on()})"),
        'admin': admin.evaluate("""({keep:KEEP.on(),bookCount:BOOK.length,
          bookingIds:BOOK.map(b=>b.id),linBookings:BOOK.filter(b=>b.sid===CORE.lin.id).map(b=>({id:b.id,st:b.st})),
          banks:{distinct:RULES.iktN!==RULES.ikh,normalVersion:RULES.iktN.ver,highVersion:RULES.ikh.ver,
            normalTitle:RULES.iktN.t1[0].name,highTitle:RULES.ikh.t1[0].name},
          batch:JSON.stringify(ivb()),pool:JSON.stringify(RULES.pool),
          bookingAuditCount:AUDIT.filter(a=>a.k==='book').length})"""),
        'receivedBooks': page.evaluate("__keepApplied.filter(x => /提交了预约|预约申请/.test(x.msg || '')).length"),
    }


def summary(state):
    return {
        'bookingCount': state['admin']['bookCount'], 'linBookings': state['admin']['linBookings'],
        'banks': state['admin']['banks'], 'studentState': state['student']['booking']['st'],
        'keepEnabled': state['student']['keep'] and state['admin']['keep'],
        'receivedBooks': state['receivedBooks'],
    }


def refresh_check(page, before, label):
    page.reload()
    page.wait_for_timeout(1400)
    student, admin = frames(page)
    after = proof(page, student, admin)
    assert after['student'] == before['student'], f'{label}: student booking or instance changed'
    assert after['admin'] == before['admin'], f'{label}: admin data changed or booking duplicated'
    assert after['receivedBooks'] == 0, f'{label}: restored booking was resent'
    print(label + ':', json.dumps(dict(summary(after), sameBatch=after['admin']['batch'] == before['admin']['batch'],
        samePool=after['admin']['pool'] == before['admin']['pool']), ensure_ascii=False))
    return student, admin


def main():
    with sync_playwright() as p:
        browser = launch_browser(p)
        context = browser.new_context(viewport={'width': 1440, 'height': 1000})
        context.add_init_script("""try { localStorage.setItem('ly_keep_force', '1'); } catch (e) {}
          window.__keepApplied = [];
          window.addEventListener('message', e => { const d=e.data; if(d && d.ly && d.t==='applied' && d.side==='机构端') __keepApplied.push(d); });""")
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.route('https://script.google.com/**', lambda route: route.fulfill(status=200, body='ok'))
        page.goto(Path(os.environ['TRIAL_HTML']).as_uri())
        page.wait_for_timeout(1200)
        if page.locator('#nm').count():
            page.fill('#nm', 'R1 persistence regression')
            page.click('[data-do=nameOk]')
        student, admin = frames(page)
        assert student.evaluate('KEEP.on()') and admin.evaluate('KEEP.on()'), 'keep must be enabled despite webdriver'
        admin.evaluate("""() => {
          enter('c5','L3','test'); go('booking'); S.tabs.booking='ai'; S.tabs.aisub='bank'; S.ikBank='n'; render();
          iktD().t1[0].name += ' · keep-normal'; ACT.iktSave(); render();
          ACT.ikBank('h'); render(); iktD().t1[0].name += ' · keep-high'; ACT.iktSave(); render();
          ACT.btab('inv'); render(); ACT.ivSendGo('all'); render();
          ACT.btab('pool'); render(); ACT.poolR(50); ACT.poolH(-2); render();
        }""")
        page.wait_for_timeout(500)
        student.evaluate("reset('A');prepare('home');render()")
        page.wait_for_timeout(250)
        student.evaluate("""(() => { const key=(S._slotAllowed || [])[0]; let arg='c1:0:1';
          if(key){const [cid,date,time]=key.split('|');arg=cid+':'+DAYS.findIndex(d=>d.toISOString().slice(0,10)===date)+':'+DATA.times.indexOf(time);}
          ACT.pickSlot(arg);ACT.bookSubmit();render(); })()""")
        page.wait_for_timeout(500)
        booking = admin.evaluate("BOOK.find(b=>b.sid===CORE.lin.id && b.st==='confirm').id")
        assert student.evaluate("S.bk.st==='待确认'"), 'booking must be pending before first refresh'
        pending = proof(page, student, admin)
        student, admin = refresh_check(page, pending, 'Pending booking refresh')
        admin.evaluate("id => { ACT.bOk(id); render(); }", booking)
        page.wait_for_timeout(500)
        assert student.evaluate("S.bk.st==='已确认'"), 'booking must be confirmed before refresh'
        before = proof(page, student, admin)
        print('Before confirmed refresh:', json.dumps(summary(before), ensure_ascii=False))
        for number in (1, 2):
            student, admin = refresh_check(page, before, f'Confirmed booking refresh {number}')
        assert not errors, errors
        print('gpt_keep: passed; R1 not reproduced with keep enabled; pending + two confirmed refreshes, distinct banks, retained batch/pool, no duplicate appointments or browser errors')
        context.close()
        browser.close()


if __name__ == '__main__':
    main()
