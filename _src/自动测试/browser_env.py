"""Portable paths and browser selection for the source-package regressions."""
import os
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
os.environ.setdefault('ADM_HTML', str(ROOT / '机构端/灵屿2.0-机构端演示-v1.19.2-gpt.html'))
os.environ.setdefault('STU_HTML', str(ROOT / 'build/trial_parts/stu.html'))
os.environ.setdefault('TRIAL_HTML', str(ROOT / '试用版外壳/灵屿2.0-试用版-v1.19.2-gpt.html'))

def launch_browser(playwright):
    candidates = [os.environ.get('CHROMIUM_PATH'), shutil.which('chromium'),
                  shutil.which('google-chrome'), '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                  '/opt/pw-browsers/chromium']
    executable = next((p for p in candidates if p and Path(p).is_file()), None)
    return playwright.chromium.launch(headless=True, **({'executable_path': executable} if executable else {}))
