"""Recover the bundled demo images from a known baseline index.html."""
import base64
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
baseline = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / 'index.html'
source = baseline.read_text(encoding='utf-8')

def value(text, name):
    match = re.search(r'\b(?:const\s+)?' + re.escape(name) + r'\s*=\s*', text)
    if not match:
        raise ValueError(f'Missing inline asset: {name}')
    return json.JSONDecoder().raw_decode(text[match.end():])[0]

def save(uri, target):
    if not uri.startswith('data:image/') or ';base64,' not in uri:
        raise ValueError(f'Invalid image: {target}')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(base64.b64decode(uri.split(',', 1)[1], validate=True))

student, institution = value(source, 'APP_STU'), value(source, 'APP_ADM')
for name, filename in [('MASCOT', 'mascot.png'), ('MASCOT_IK', 'xiaoyu_intake_av.png'), ('MASCOT_FULL', 'mascot_full.png')]:
    save(value(institution, name), ROOT / '公共图片' / filename)
save(value(student, 'MASCOT_IK_FULL'), ROOT / '公共图片/xiaoyu_intake_full_s.png')
save(value(student, 'LAUNCH_BG'), ROOT / '学生端/src/launch_bg.jpg')
for text, folder in [(student, '学生端'), (institution, '机构端')]:
    match = re.search(r'\bPHOTOS\s*=\s*\{(.*?)\}', text, re.S)
    for name, uri in re.findall(r'(\w+)\s*:\s*"(data:image/[^\"]+)"', match.group(1)):
        save(uri, ROOT / folder / 'src/photos' / (name + '.jpg'))
for i, uri in enumerate(value(institution, 'POSTER_BG'), 1):
    save(uri, ROOT / '公共图片/海报底图' / f'p{i}.jpg')
print('Recovered all inline image assets from', baseline)
