"""Q12: ADM workbench duty link opens a safe read-only view."""
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
        page.goto(Path(os.environ['ADM_HTML']).as_uri())
        page.evaluate("enter('a1','ADM');go('home');ACT.hview('brief');render()")
        duty = page.evaluate('JSON.stringify(DUTY)')
        assert page.locator('[data-act="setTab"][data-arg="duty"]').count(), 'existing workbench link must remain available'
        page.locator('[data-act="setTab"][data-arg="duty"]').first.click()
        assert page.evaluate("S.page === 'home' && S.role === 'ADM' && !S.dw"), 'ADM must stay outside case / appointment pages'
        assert '值班表（只读）' in page.inner_text('#modal'), 'ADM link must open actual duty information'
        assert page.locator('#modal table tbody tr').count() >= page.evaluate('DUTY.length'), 'all duty rows must be present'
        assert page.locator('#modal input,#modal select,#modal textarea').count() == 0, 'read-only modal has no editing controls'
        assert page.locator('#modal [data-act="go"],#modal [data-act="setTab"],#modal [data-bind]').count() == 0, 'read-only modal must not link to appointment or settings editors'
        assert not page.evaluate("STU.some(s => document.querySelector('#modal').innerText.includes(s.sid))"), 'no student identifiers in duty view'
        assert page.evaluate("AUDIT[0].t === '查看值班表（只读）' && !AUDIT[0].sid"), 'view must be audited without a case ID'
        page.locator('#modal [data-act="moClose"]').click()
        assert page.evaluate('JSON.stringify(DUTY)') == duty, 'view and close must not change duty roster'
        for account, role in [('c1', 'L2'), ('c5', 'L3')]:
            page.evaluate("x => {enter(x[0],x[1]);ACT.setTab('duty');render()}", [account, role])
            assert page.evaluate("S.page === 'booking' && S.tabs.booking === 'sched' && !S.mo"), f'{role}: original schedule route retained'
        assert not errors, errors
        print('gpt_admin_duty: 11 checks passed; 1440 x 1000; no browser errors')
        browser.close()


if __name__ == '__main__':
    main()
