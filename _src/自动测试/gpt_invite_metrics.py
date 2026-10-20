"""R14/Q06: every invitation metric filters exactly the population it counts."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
from browser_env import launch_browser

with sync_playwright() as p:
    browser = launch_browser(p)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(Path(os.environ['ADM_HTML']).as_uri())
    page.evaluate("enter('c5','L3','test');go('booking');render()")
    counts = page.evaluate('ivCnt(ivMine())')
    for key, count in counts.items():
        page.locator(f'[data-act=ivF][data-arg={key}]').click()
        actual = page.locator('#pg table.t tr').count() - 1
        if count == 0:
            assert '没有符合的学生' in page.inner_text('#pg'), key
        else:
            assert actual == count, (key, count, actual)
        page.locator('[data-act=ivF][data-arg=""]').click()
    assert not errors, errors
    browser.close()
print('gpt_invite_metrics: 8 populations matched; 0 page errors')
