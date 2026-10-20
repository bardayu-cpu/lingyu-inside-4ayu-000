/* =====================================================================
   v1.18 · 演示数据存在本机：刷新、关掉再开都不丢；点「重置」先确认，确认后才回到初始数据
   · 每个版本单独存，换版本从初始数据开始（旧版本的数据结构可能对不上）
   · 自动测试里（navigator.webdriver）默认不存，避免一次测试的操作带进下一次；ly_keep_force=1 可强制打开
===================================================================== */
const lyKeep = (key, roots) => {
  let off = false, tm = null;
  try { off = !!navigator.webdriver && localStorage.getItem('ly_keep_force') !== '1'; } catch (e) { off = true; }
  const enc = vals => { const seen = new Map(); let n = 0;
    const f = v => { if (v === null || typeof v !== 'object') return typeof v === 'function' ? undefined : v;
      if (v instanceof Date) return { $d: +v };
      if ((typeof Node !== 'undefined' && v instanceof Node) || v instanceof Map || v instanceof Set) return undefined;
      if (seen.has(v)) return { $r: seen.get(v) };
      const id = n++; seen.set(v, id);
      if (Array.isArray(v)) return { $i: id, $a: v.map(x => { const y = f(x); return y === undefined ? null : y; }) };
      const o = {}; Object.keys(v).forEach(k => { const y = f(v[k]); if (y !== undefined) o[k] = y; }); return { $i: id, $o: o }; };
    const out = {}; Object.keys(vals).forEach(k => { out[k] = f(vals[k]); }); return out; };
  const dec = (data, targets) => { const reg = {};
    const f = (v, into) => { if (v === null || typeof v !== 'object') return v;
      if ('$d' in v) return new Date(v.$d);
      if ('$r' in v) return reg[v.$r];
      if ('$a' in v) { const a = into || []; if (into) a.length = 0; reg[v.$i] = a; v.$a.forEach(x => a.push(f(x))); return a; }
      if ('$o' in v) { const o = into || {}; if (into) Object.keys(o).forEach(k => delete o[k]); reg[v.$i] = o; Object.keys(v.$o).forEach(k => { o[k] = f(v.$o[k]); }); return o; }
      return v; };
    const out = {}; Object.keys(data).forEach(k => { out[k] = f(data[k], targets[k]); }); return out; };
  const save = () => { if (off) return; try { const vals = {}; Object.keys(roots).forEach(k => { vals[k] = roots[k][0](); }); localStorage.setItem(key, JSON.stringify({ at: Date.now(), d: enc(vals) })); } catch (e) {} };
  const later = () => { if (off) return; clearTimeout(tm); tm = setTimeout(save, 300); };
  const load = () => { if (off) return false; let raw = null; try { raw = localStorage.getItem(key); } catch (e) {} if (!raw) return false;
    try { const p = JSON.parse(raw).d, tg = {};
      Object.keys(roots).forEach(k => { const cur = roots[k][0](); if (cur && typeof cur === 'object' && !(cur instanceof Date) && roots[k][2]) tg[k] = cur; });
      const v = dec(p, tg); Object.keys(v).forEach(k => { if (k in roots && !tg[k]) roots[k][1](v[k]); }); return true;
    } catch (e) { try { localStorage.removeItem(key); } catch (x) {} return false; } };
  const clear = again => { const was = off; off = true; clearTimeout(tm); try { localStorage.removeItem(key); } catch (e) {} if (again) off = was; };
  try { window.addEventListener('pagehide', save); } catch (e) {}
  return { save, later, load, clear, on: () => !off };
};
/* 「重置」确认框：两端共用 */
const lyResetAsk = (go) => { const o = document.createElement('div'); o.className = 'lyrs';
  o.innerHTML = '<div class="lyrs-b"><h3>重置演示数据？</h3><p>会清掉你在这一端做过的所有操作（比如记录、邀约、改派、设置），回到初始数据。提交的「我的意见」不受影响。</p><div class="lyrs-a"><button class="lyrs-n">取消</button><button class="lyrs-y">重置</button></div></div>';
  if (!document.getElementById('lyrs-css')) { const s = document.createElement('style'); s.id = 'lyrs-css';
    s.textContent = '.lyrs{position:fixed;inset:0;background:rgba(20,30,28,.38);display:flex;align-items:center;justify-content:center;z-index:2147483600}.lyrs-b{background:#fff;border-radius:14px;padding:22px 24px;width:420px;max-width:calc(100vw - 32px);box-shadow:0 12px 40px rgba(0,0,0,.18);font-size:14px;color:#1f2d2b}.lyrs-b h3{margin:0 0 8px;font-size:17px}.lyrs-b p{margin:0 0 18px;line-height:1.6;color:#4a5a57}.lyrs-a{display:flex;justify-content:flex-end;gap:10px}.lyrs-a button{border-radius:8px;padding:8px 16px;font-size:14px;cursor:pointer;border:1px solid #c9d3d1;background:#fff}.lyrs-a .lyrs-y{background:#b4442f;border-color:#b4442f;color:#fff}';
    document.head.appendChild(s); }
  const close = () => o.remove(); o.addEventListener('click', e => { if (e.target === o || e.target.classList.contains('lyrs-n')) close(); else if (e.target.classList.contains('lyrs-y')) { close(); go(); } });
  document.body.appendChild(o); };
