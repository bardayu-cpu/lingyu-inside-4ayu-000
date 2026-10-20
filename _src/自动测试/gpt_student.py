"""Focused browser regressions for the GPT student and preview repairs.
Run: python3 gpt_student.py Q09 (or all).
"""
from browser_env import launch_browser
from pathlib import Path
import os
import sys
from playwright.sync_api import sync_playwright

TARGETS = set(sys.argv[1:] or ['all'])
failures = []
checks = 0

def chk(value, text):
    global checks
    checks += 1
    if not value:
        failures.append(text)
        print('FAIL:', text)

def want(key):
    return 'all' in TARGETS or key in TARGETS

with sync_playwright() as p:
    browser = launch_browser(p)
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    context.route('https://**/*', lambda route: route.fulfill(status=200, body='{}', content_type='application/json'))
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(Path(os.environ['STU_HTML']).as_uri())
    E = page.evaluate

    if want('Q09'):
        E("reset('C');prepare('home');render();ACT.zIvc();ACT.ivAcc();render()")
        page.locator('[data-act=ikTog]').first.click()
        page.locator('[data-act=ikNextQ]').click()
        text = '这段尚未点击下一题的文字要保留在草稿里'
        page.locator('#ikTxt').fill(text)
        page.locator('[data-act=ikX]').click()
        chk('首页' in page.locator('#modal').inner_text() and '我的预约' not in page.locator('#modal').inner_text(), 'Q09 invite exit points to Home')
        page.locator('[data-act=ikSave]').click()
        chk(E('S.ivc.ik.ans.trouble') == text, 'Q09 current answer is saved before Next')
        page.locator('[data-act=ivIkGo]').click()
        chk(page.locator('#ikTxt').input_value() == text and E('S.ik.i') == 1, 'Q09 resumes same question with unsent text')
        # Pending multi-select and own text also survive, including with no completed answer.
        E("reset('C');prepare('home');render();ACT.zIvc();ACT.ivAcc();render()")
        page.locator('#ikOwn').fill('新的话题')
        page.locator('[data-act=ikX]').click()
        chk(E('S.modal') == 'ikClose', 'Q09 first current-only answer opens save prompt')
        page.locator('[data-act=ikSave]').click()
        page.locator('[data-act=ivIkGo]').click()
        chk(page.locator('#ikOwn').input_value() == '新的话题' and E('S.ik.i') == 0, 'Q09 multi input survives current-only close/save')
        # Probe state must not duplicate the first short answer when resumed.
        E("ACT.ikNextQ();render()")
        page.locator('#ikTxt').fill('很累')
        page.locator('[data-act=ikNextQ]').click()
        page.locator('#ikTxt').fill('主要在晚上出现')
        page.locator('[data-act=ikX]').click()
        page.locator('[data-act=ikSave]').click()
        page.locator('[data-act=ivIkGo]').click()
        chk(E('S.ik.probe') and page.locator('#ikTxt').input_value() == '主要在晚上出现', 'Q09 probe input and step resume')
        page.locator('[data-act=ikNextQ]').click()
        chk(E('S.ik.ans.trouble') == '很累；主要在晚上出现', 'Q09 resumed probe appends once')

    if want('Q08'):
        E("reset('A');prepare('home');render();ACT.go('book');render()")
        page.locator('[data-act=pickSlot]').first.click()
        page.locator('[data-act=bookSubmit]').click()
        page.locator('[data-act=ikNo]').click()
        E('ACT.zMove();render()')
        chk('新时间需要你接受才会确认' in page.locator('#modal').inner_text(), 'Q08 modal requires acceptance')
        E("S.modal=null;S.page='mybook';render()")
        body = page.locator('#app').inner_text()
        chk('新时间需要你接受才会确认' in body and '不用操作' not in body and '待接受新时间' in body, 'Q08 body and badge agree on required acceptance')
        page.locator('[data-act=movedOk]').click()
        chk(E('S.bk.st') == '已确认' and '待接受新时间' not in page.locator('#app').inner_text(), 'Q08 acceptance changes status to confirmed')

    if want('Q13'):
        page.goto(Path(os.environ['ADM_HTML']).as_uri())
        E("enter('c5','L3');go('booking');S.tabs.booking='ai';S.tabs.aisub='bank';render()")
        page.locator('[data-act=ikBank][data-arg=h]').click()
        page.locator('[data-ik=open]').fill('高危预览草稿开场白：接受邀请后我们先聊一聊。')
        page.locator('[data-act=mo][data-arg="iktPrev:t1"]').click()
        preview = page.locator('#modal').inner_text()
        chk('高危咨询 · 接受邀约后' in preview and '第一题上面' in preview, 'Q13 high-risk preview is invitation first-question entry')
        chk('高危预览草稿开场白' in preview and '还没保存' in preview, 'Q13 preview includes unsaved high-risk opening')
        chk('提交预约后学生看到的大窗口' not in preview and '这次先不用' not in preview and '好的，开始' not in preview, 'Q13 ordinary welcome and buttons excluded from high-risk preview')
        page.locator('[data-act=moClose]').click()
        E('ACT.iktUndo();render()')
        page.locator('[data-act=ikBank][data-arg=n]').click()
        page.locator('[data-act=mo][data-arg="iktPrev:t1"]').click()
        chk('普通咨询 · 模板一' in page.locator('#modal').inner_text() and '这次先不用' in page.locator('#modal').inner_text(), 'Q13 normal-bank welcome preview retained')

    if want('Q14'):
        page.goto(Path(os.environ['ADM_HTML']).as_uri())
        E("enter('a1','ADM');go('settings');S.tabs.settings='intake';render()")
        text = page.locator('#app').inner_text()
        chk('A · 预约申请提交后' in text and '预约成功之后' not in text, 'Q14 admin placement option and comparison table say request submitted')
        chk(page.locator('[data-bind=intakeMode]').input_value() == 'A', 'Q14 placement default unchanged')

    if want('Q16'):
        page.goto(Path(os.environ['ADM_HTML']).as_uri())
        E("enter('c5','L3');go('booking');S.tabs.booking='sched';render()")
        page.locator('[data-act=schPick][data-arg="c1|10/21"]').click()
        save = page.locator('[data-act=mSave]')
        save.scroll_into_view_if_needed()
        first = page.locator('.mdetail [data-act=mslot]').first
        first.click()
        save.scroll_into_view_if_needed()
        a = save.bounding_box()
        b = page.locator('.abtn').bounding_box()
        overlap = max(0, min(a['x']+a['width'], b['x']+b['width'])-max(a['x'], b['x'])) * max(0, min(a['y']+a['height'], b['y']+b['height'])-max(a['y'], b['y']))
        chk(overlap == 0, 'Q16 assistant does not overlap the schedule save button at 1440x1000')
        chk(E("(() => {const e=document.querySelector('[data-act=mSave]'),r=e.getBoundingClientRect();return document.elementFromPoint(r.right-8,r.bottom-8)===e})()"), 'Q16 save button lower-right corner is clickable')
        save.click()
        chk('已保存' in page.locator('#toast').inner_text(), 'Q16 schedule save action remains reachable')

    if want('R19'):
        page.goto(Path(os.environ['STU_HTML']).as_uri())
        for lang in ['zh', 'en']:
            E("reset('A');prepare('home');setLang('" + lang + "');render()")
            quizzes = E('DATA.fun.map(x=>({k:x.k,n:x.items.length,max:x.ab?1:x.opts.length-1}))')
            for quiz in quizzes:
                for answer in [0, quiz['max']]:
                    E('(v => {const x=DATA.fun.find(x=>x.k===v.k);S.fun.cur=v.k;S.fun.res[v.k]={a:x.items.map(()=>v.a),at:new Date(NOW)};S.page="funres";render()})', {'k': quiz['k'], 'a': answer})
                    text = page.locator('.res').inner_text()
                    chk(not any(word in text for word in ['得分', 'Score', '%', '压力较低', '中等压力', '压力较高', '幸福感偏低', 'Low stress', 'Moderate stress', 'High stress', 'Wellbeing on the low side']), f'R19 {lang}/{quiz["k"]}/{answer} hides numeric scores and risk classification')
                    chk(page.locator('.res .gauge,.res .lvl,.res .trait .bar').count() == 0 and len(text) > 8, f'R19 {lang}/{quiz["k"]}/{answer} retains advice without score gauge')
                    chk(page.locator('[data-act=funStart]').count() == 1, f'R19 {lang}/{quiz["k"]}/{answer} retains retake action')
        # Completion must invite only level 4 or 5, with no risk number in the student card.
        for level in range(1, 6):
            E("reset('A');prepare('chat');S.task.scaleLv=" + str(min(level, 4)) + ";S.task.concern=0;S.task.crisis=" + ('true' if level == 5 else 'false') + ";finish();render()")
            chk(E('S.modal') == ('invite' if level >= 4 else 'done'), f'screening level {level} has the required completion/invitation card')
            chk(not any(word in page.locator('#modal').inner_text() for word in ['风险等级', '得分', '级']), f'screening level {level} hides risk numbers')
            if level >= 4:
                page.locator('[data-act=inviteNo]').click()
                chk(E('S.modal') == 'done', f'screening level {level} decline returns to end card')
                E("S.invited=false;S.bk=null;finish();render()")
                page.locator('[data-act=inviteGo]').click()
                chk(E('S.page') == 'book' and E('S.modal') is None, f'screening level {level} accept opens booking')

    if want('R17'):
        page.goto(Path(os.environ['ADM_HTML']).as_uri())
        E("enter('c5','L3');go('booking');S.tabs.booking='ai';render()")
        ids = E("({iv:ivMine().find(x=>x.ik&&x.ik.st==='sent'&&x.ik.sum).sid,book:BOOK.find(x=>x.intake&&x.intake.st==='sent'&&x.intake.sum).id})")
        for arg in ['ivIk:' + ids['iv'], 'intake:' + ids['book']]:
            before = E("AUDIT.filter(x=>x.t.startsWith('查看预咨询摘要')).length")
            for _ in range(2):
                E('(a=>{ACT.mo(a);render()})', arg)
                E('render();render()')
                E('ACT.moClose();render()')
            chk(E("AUDIT.filter(x=>x.t.startsWith('查看预咨询摘要')).length") == before + 2, 'R17 each open audits once, redraw does not: ' + arg)
        E("enter('a1','ADM');go('home');render()")
        before = E('AUDIT.length')
        E('(a=>{ACT.mo(a);render()})', 'ivIk:' + ids['iv'])
        chk(E('S.mo') is None and E('AUDIT.length') == before, 'R17 administrator cannot invoke invitation summary action')

    if want('COPY-STU'):
        page.goto(Path(os.environ['STU_HTML']).as_uri())
        chk('我是小屿，可以和你聊聊最近的生活' in page.locator('#app').inner_text(), 'COPY-STU launch explains purpose in plain Chinese')
        chk('完整链路' not in page.locator('#app').inner_text() and '每一个真实的自己' not in page.locator('#app').inner_text(), 'COPY-STU launch removes system jargon and grand claims')
        E("reset('A');prepare('chat');S.fast=true;userSay(DATA.crisisDemo);render()")
        page.wait_for_timeout(100)
        chk('无法提供现场帮助' in page.locator('#app').inner_text() and '请立即联系' in page.locator('#app').inner_text(), 'COPY-STU crisis reply clearly names AI limits and immediate help action')
        E("reset('A');prepare('chat');S.task.scaleLv=1;S.task.concern=0;S.task.crisis=false;finish();render()")
        chk('谢谢你的回答' in page.locator('#modal').inner_text() and '本身就是一件不容易的事' not in page.locator('#modal').inner_text(), 'COPY-STU ordinary completion uses concrete next steps')
        E("S.modal=null;S.page='mybook';render()")
        chk('目前没有预约' in page.locator('#app').inner_text() and '提交预约申请' in page.locator('#app').inner_text(), 'COPY-STU booking empty state explains available action')
        E("prepare('help');render()")
        page.locator('details[data-k=q3] summary').click()
        chk('提交预约申请后，请等待老师确认' in page.locator('#app').inner_text(), 'COPY-STU help distinguishes request, counsellor confirmation and accepted new time')

    chk(not errors, 'no browser page errors: ' + repr(errors))
    browser.close()

print(f'gpt_student {",".join(sorted(TARGETS))}: {checks - len(failures)} passed, {len(failures)} failed')
raise SystemExit(bool(failures))
