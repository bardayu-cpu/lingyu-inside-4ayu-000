"""Render institution copy across staff roles and keep actionable controls usable."""
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
        rendered = 0
        for account, role in [('c5','L3'),('c1','L2'),('u1','L1'),('u3','L1s'),('a1','ADM')]:
            for view in ['brief', 'work']:
                page.evaluate("x => {enter(x[0],x[1]);go('home');ACT.hview(x[2]);render()}", [account,role,view])
                assert page.locator('#pg').inner_text().strip(), f'{role}: {view} must render'
                assert page.locator('#pg [data-act]').count(), f'{role}: {view} actions must remain available'
                text = page.inner_text('#pg')
                assert not any(old in text for old in ['处卡住了需要你推一下','必须你拍板','先保住','谁收到任务谁就谈']), f'{role}: unclear copy remains'
                rendered += 1
            if role == 'L1s':
                assert '不显示关注等级、分数或报告' in page.evaluate("answer('这些学生是几级？').html"), 'student committee copy must describe its actual limited scope'
        page.evaluate("enter('c5','L3');go('settings');S.tabs.settings='cwords';render()")
        assert '30 分钟' in page.inner_text('#pg') and '4 小时' in page.inner_text('#pg'), 'risk timing instructions must remain intact'
        assert page.locator('[data-act="unfzT"]').count(), 'freeze recovery control remains available'
        page.evaluate("go('talk');S.tabs.talk='recs';render()")
        assert page.locator('#pg').inner_text().strip(), 'talk records list must render'
        page.evaluate("S.rec = recNew(STU.find(s=>tkScope(s)).id);render()")
        assert '24 小时' in page.inner_text('#pg') and '不会向学校 SIS 发送数据' in page.inner_text('#pg'), 'record editing limit and demo integration boundary must remain clear'
        assert page.locator('[data-act="recSave"]').count(), 'record save controls remain available'
        assert not errors, errors
        print(f'gpt_admin_copy: {rendered} role/view combinations + risk settings + record list/editor passed; 1440 x 1000; no browser errors')
        browser.close()


if __name__ == '__main__':
    main()
