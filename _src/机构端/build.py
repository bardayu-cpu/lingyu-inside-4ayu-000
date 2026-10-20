import base64,pathlib
VER = 'v1.19.2-gpt'
ROOT = pathlib.Path(__file__).resolve().parent.parent
SP = ROOT / 'build'
SP.mkdir(exist_ok=True)
r=pathlib.Path(__file__).parent/'src'
m='data:image/png;base64,'+base64.b64encode(open(ROOT/'公共图片/mascot.png','rb').read()).decode()
mik='data:image/png;base64,'+base64.b64encode(open(ROOT/'公共图片/xiaoyu_intake_av.png','rb').read()).decode()
mfull='data:image/png;base64,'+base64.b64encode(open(ROOT/'公共图片/mascot_full.png','rb').read()).decode()
pbg='['+','.join('"data:image/jpeg;base64,'+base64.b64encode(q.read_bytes()).decode()+'"' for q in sorted((ROOT/'公共图片/海报底图').glob('p*.jpg')))+']'
ph='{'+','.join(f'{q.stem}:"data:image/jpeg;base64,'+base64.b64encode(q.read_bytes()).decode()+'"' for q in sorted((r/'photos').glob('*.jpg')))+'}'
js='\n'.join((r/f).read_text() for f in ['data.js','a1_core.js','a2_home.js','a3_people.js','a4_pages.js','a5_modal.js','a6_act.js','a7_assist.js','a8_plans.js','a9_sched.js','a10_l1.js','a11_clarity.js','a12_bridge.js','a13_v112.js','a14_v113.js','a15_v114.js','a16_talk.js','a17_talk_ui.js','a18_talk_rec.js','a19_talk_center.js','a20_talk_wire.js','a21_v116.js', 'a22_v117.js','keep.js','a23_v118.js','a24_v119.js','shell.js','z_tail.js'])
html=f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>灵屿 2.0 机构端演示 {VER}</title><style>{(r/'adm.css').read_text()}</style></head><body>
<div class="demo"><b>灵屿 2.0 演示</b><span>机构端 {VER}</span><span>快速登录</span><select id="roleSel"></select><span>页面</span><select id="jump"></select><span id="zaps" style="display:flex;gap:6px"></span><span class="sp"></span><label><input type="checkbox" id="zapT"> 演示按钮</label><button class="memo-btn" id="memoBtn">📝 备忘录</button><button id="resetBtn">重置</button></div>
<div id="app"></div><div id="drawer"></div><div id="modal"></div><div id="toast"></div><div id="memo"></div>
{(r/'icons.svg').read_text()}
<script>const LY_VER="{VER}";const MASCOT="{m}";const MASCOT_IK="{mik}";const MASCOT_FULL="{mfull}";const PHOTOS={ph};const POSTER_BG={pbg};
{js}
boot();</script></body></html>'''
out=pathlib.Path(__file__).parent/f'灵屿2.0-机构端演示-{VER}.html'; out.write_text(html); print(out, len(html))
(SP/'adm_all.js').write_text(js)
