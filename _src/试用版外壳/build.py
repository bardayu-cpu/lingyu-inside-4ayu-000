import base64, json, pathlib, sys
VER = 'v1.19.2-gpt'
ROOT = pathlib.Path(__file__).resolve().parent.parent
SP = ROOT / 'build'
SP.mkdir(exist_ok=True)
T = pathlib.Path(__file__).parent / 'src'
A = ROOT / '机构端/src'
U = ROOT / '学生端/src'
b64 = lambda p, t: f'data:{t};base64,' + base64.b64encode(open(p, 'rb').read()).decode()
M = b64(ROOT/'公共图片/mascot.png', 'image/png')
IKAV = b64(ROOT/'公共图片/xiaoyu_intake_av.png', 'image/png')
FB_URL = (T / 'fb_url.txt').read_text().strip() if (T / 'fb_url.txt').exists() else ''
def photos(r): return '{' + ','.join(f'{q.stem}:"' + b64(q, 'image/jpeg') + '"' for q in sorted((r / 'photos').glob('*.jpg'))) + '}'
# ---- 机构端
ajs = '\n'.join((A / f).read_text() for f in ['data.js', 'a1_core.js', 'a2_home.js', 'a3_people.js', 'a4_pages.js', 'a5_modal.js', 'a6_act.js', 'a7_assist.js', 'a8_plans.js', 'a9_sched.js', 'a10_l1.js', 'a11_clarity.js', 'a12_bridge.js', 'a13_v112.js', 'a14_v113.js', 'a15_v114.js', 'a16_talk.js', 'a17_talk_ui.js', 'a18_talk_rec.js', 'a19_talk_center.js', 'a20_talk_wire.js', 'a21_v116.js', 'a22_v117.js', 'keep.js', 'a23_v118.js', 'a24_v119.js','a25_gpt_invites.js','iv_import.js', 'shell.js', 'z_tail.js'])
adm = f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>灵屿 2.0 机构端</title><style>{(A / 'adm.css').read_text()}</style></head><body>
<div class="demo"><b>演示工具</b><span>快速登录</span><select id="roleSel"></select><span>页面</span><select id="jump"></select><span id="zaps" style="display:flex;gap:6px"></span><span class="sp"></span><label><input type="checkbox" id="zapT"> 演示按钮</label><button class="memo-btn" id="memoBtn">📝 备忘录</button><button id="resetBtn">重置</button></div>
<div id="app"></div><div id="drawer"></div><div id="modal"></div><div id="toast"></div><div id="memo"></div>
{(A / 'icons.svg').read_text()}
<script>const LY_VER="{VER}";const MASCOT="{M}";const MASCOT_IK="{IKAV}";const MASCOT_FULL="{b64(ROOT/'公共图片/mascot_full.png', 'image/png')}";const PHOTOS={photos(A)};const POSTER_BG=[{','.join(chr(34)+b64(str(q), 'image/jpeg')+chr(34) for q in sorted((ROOT/'公共图片/海报底图').glob('p*.jpg')))}];
{ajs}
{(T / 'adm_side.js').read_text()}
{(T / 'ly_frame.js').read_text()}
boot();</script></body></html>'''
# ---- 学生端
stu = f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>灵屿 2.0 学生端</title><style>{(U / 'stu.css').read_text()}</style></head><body>
<div class="demo"><b>演示工具</b><span>场景</span><select id="scen"></select><span>页面</span><select id="jump"></select><span class="sp"></span><label><input type="checkbox" id="zapT"> 演示按钮</label><button class="memo-btn" id="memoBtn">📝 备忘录</button><button id="resetBtn">重置</button></div>
<div id="app"></div><div id="modal"></div><div id="toast"></div><div id="memo"></div>
{(U / 'icons.svg').read_text()}
{(U / 'stu.html').read_text()}
<script>const LY_VER="{VER}";const MASCOT="{M}";const MASCOT_FULL="{b64(ROOT/'公共图片/mascot_full.png', 'image/png')}";const MASCOT_IK="{IKAV}";const MASCOT_IK_FULL="{b64(ROOT/'公共图片/xiaoyu_intake_full_s.png', 'image/png')}";const LAUNCH_BG="{b64(U / 'launch_bg.jpg', 'image/jpeg')}";const PHOTOS={photos(U)};
{(U / 'data.js').read_text()}
{(U / 'i18n.js').read_text()}
{(U / 'rules.js').read_text()}
{(U / 'app.js').read_text()}
{(U / 'intake.js').read_text()}
{(U / 'inv.js').read_text()}
{(U / 'v119.js').read_text()}
{(U / 'v119_gpt.js').read_text()}
{(U / 'shell.js').read_text()}
{(T / 'stu_bridge.js').read_text()}
{(A / 'keep.js').read_text()}
{(T / 'keep_stu.js').read_text()}
{(T / 'ly_frame.js').read_text()}
boot();</script></body></html>'''
J = lambda s: json.dumps(s, ensure_ascii=False).replace('</', '<\\/')
out = f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>灵屿 2.0 试用版 {VER}</title><style>{(T / 'shell.css').read_text()}</style></head><body>
<div class="tb" id="tb"></div><div class="stage" id="stage"></div>
<div class="sync" id="sync"></div><div class="picking" id="picking">提意见中：点页面上任意位置 → 在面板里写一句 → 回车提交<button data-do="pause">暂停点选</button></div>
<div id="pn"></div><div id="ov"></div>
<script>const VER="{VER}";const FB_URL={json.dumps(FB_URL)};const MASCOT="{M}";
const APP_STU={J(stu)};
const APP_ADM={J(adm)};
{(T / 'shell.js').read_text()}
boot();</script></body></html>'''
p = pathlib.Path(__file__).parent / f'灵屿2.0-试用版-{VER}.html'; p.write_text(out); print(p, len(out), 'FB_URL=' + (FB_URL or '(未配置)'))
pathlib.Path(f'{SP}/trial_parts').mkdir(exist_ok=True)
(pathlib.Path(f'{SP}/trial_parts') / 'adm.html').write_text(adm); (pathlib.Path(f'{SP}/trial_parts') / 'stu.html').write_text(stu)

if ROOT.name == '_src':
    (ROOT.parent / 'index.html').write_text(out, encoding='utf-8')
