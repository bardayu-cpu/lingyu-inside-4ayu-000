"""Run the requested v119 suites; any assertion or page error fails the run."""
import os
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent
results = HERE.parent / 'build/test-results'
results.mkdir(parents=True, exist_ok=True)
failed = []
for name in (sys.argv[1:] or ['adm19.py', 'stu19.py', 'trial_v119.py']):
    run = subprocess.run([sys.executable, str(HERE / name)], text=True, capture_output=True, env=os.environ.copy())
    log = run.stdout + run.stderr
    (results / (Path(name).stem + '.txt')).write_text(log, encoding='utf-8')
    print(log, end='')
    if run.returncode:
        failed.append(name)
if failed:
    print('FAILED:', ', '.join(failed))
sys.exit(bool(failed))
