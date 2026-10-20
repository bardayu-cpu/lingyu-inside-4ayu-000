"""R15: every pool change is audited and notifies each center teacher once."""
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
        page.evaluate("enter('c5','L3');go('booking');ACT.btab('pool');render()")
        expected = ['c1', 'c2', 'c3', 'c4']

        def before():
            return page.evaluate('({n:NOTI.length,a:AUDIT.length})')

        def changed(start, label):
            actual = page.evaluate('n => NOTI.slice(0,NOTI.length-n).map(x=>x.to).sort()', start['n'])
            assert actual == expected, f'{label}: one notification per other center teacher: {actual}'
            assert page.evaluate('AUDIT.length') == start['a'] + 1, f'{label}: one audit entry'
            print(label + ': one audit, one notification each to c1 / c2 / c3 / c4')

        start = before()
        page.evaluate('ACT.poolR(50);render()')
        changed(start, 'Ratio')
        start = before()
        page.evaluate('ACT.poolH(-2);render()')
        changed(start, 'Hold release')
        start = before()
        page.locator('[data-pool="ivLv"]').select_option('4')
        changed(start, 'Invitation level')
        college = page.evaluate('COLLEGES[0]')
        start = before()
        page.locator('[data-pool="col|' + college + '"]').fill('8')
        page.locator('[data-pool="col|' + college + '"]').blur()
        changed(start, 'College quota')
        page.evaluate("RULES.pool.apps.push({id:'gpt-ap',col:COLLEGES[0],n:1,why:'回归验证',by:'c1',at:new Date(NOW),st:'wait'});render()")
        start = before()
        page.evaluate("ACT.poolAppOk('gpt-ap');render()")
        changed(start, 'Approval (applicant not duplicated)')
        start = before()
        page.evaluate("ACT.poolAppOk('gpt-ap');ACT.poolR(50);ACT.poolH(0);render()")
        assert before() == start, 'repeated / no-op actions must not notify or audit again'
        page.evaluate("enter('c1','L2');go('booking');ACT.btab('pool');render()")
        start = before()
        state = page.evaluate('JSON.stringify(RULES.pool)')
        page.evaluate("ACT.poolH(2);ACT.poolR(20);ACT.poolAppOk('gpt-ap');render()")
        assert before() == start and page.evaluate('JSON.stringify(RULES.pool)') == state, 'L2 remains read-only'
        assert not errors, errors
        print('gpt_pool_notifications: 7 checks passed; 1440 x 1000; no browser errors')
        browser.close()


if __name__ == '__main__':
    main()
