/* 试用版 · 每一端都带的小桥：渲染后把状态告诉外壳；外壳要「点选位置」时负责高亮和捕获 */
(function () {
  if (window.parent === window) return;
  const send = m => { try { window.parent.postMessage(Object.assign({ ly: 1, side: LY_SIDE }, m), '*'); } catch (e) {} };
  const _r = render; render = function () { _r.apply(this, arguments); try { send({ t: 'snap', snap: LY_snap() }); } catch (e) {} };
  let picking = false, keep = false; const box = document.createElement('div'), sel = document.createElement('div');
  box.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #e2892c;background:rgba(226,137,44,.12);border-radius:6px;z-index:2147483646;display:none;transition:all .06s';
  document.body.appendChild(box); sel.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #3d5a4c;background:rgba(61,90,76,.10);border-radius:6px;z-index:2147483645;display:none'; document.body.appendChild(sel);
  let selEl = null; const place = (b, el) => { const r = el.getBoundingClientRect(); Object.assign(b.style, { display: 'block', left: r.left - 3 + 'px', top: r.top - 3 + 'px', width: r.width + 6 + 'px', height: r.height + 6 + 'px' }); };
  document.addEventListener('scroll', () => { if (selEl && selEl.isConnected) place(sel, selEl); }, true);
  const txt = el => (el.innerText || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  const path = el => { const p = []; for (let e = el, i = 0; e && e.nodeType === 1 && e !== document.body && i < 5; e = e.parentElement, i++) p.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '')); return p.join(' > '); };
  const pickable = el => { for (let e = el, i = 0; e && i < 4; e = e.parentElement, i++) if (txt(e)) return e; return el; };
  const stop = e => { if (!picking) return; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); };
  document.addEventListener('mousemove', e => { if (!picking) return; const el = pickable(e.target), r = el.getBoundingClientRect(); Object.assign(box.style, { display: 'block', left: r.left - 3 + 'px', top: r.top - 3 + 'px', width: r.width + 6 + 'px', height: r.height + 6 + 'px' }); }, true);
  ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart'].forEach(k => document.addEventListener(k, stop, true));
  document.addEventListener('click', e => { if (!picking) return; stop(e); const el = pickable(e.target); if (!keep) { picking = false; box.style.display = 'none'; document.documentElement.style.cursor = ''; } selEl = el; place(sel, el);
    const r = el.getBoundingClientRect(); send({ t: 'picked', el: { text: txt(el), path: path(el), x: Math.round(r.left), y: Math.round(r.top) }, ctx: LY_ctx() }); }, true);
  document.addEventListener('keydown', e => { if (picking && e.key === 'Escape') { if (!keep) { picking = false; box.style.display = 'none'; document.documentElement.style.cursor = ''; } selEl = null; sel.style.display = 'none'; send({ t: 'pickCancel' }); } }, true);
  window.addEventListener('message', e => { const d = e.data; if (!d || !d.ly || d.to !== LY_SIDE) return;
    if (d.t === 'pick') { picking = true; keep = !!d.keep; document.documentElement.style.cursor = 'crosshair'; }
    else if (d.t === 'unpick') { picking = false; box.style.display = 'none'; sel.style.display = 'none'; selEl = null; document.documentElement.style.cursor = ''; }
    else if (d.t === 'clearSel') { sel.style.display = 'none'; selEl = null; }
    else if (d.t === 'ctx') send({ t: 'ctx', id: d.id, ctx: LY_ctx() });
    else if (d.t === 'ev') { let m = ''; try { m = LY_in(d.ev); } catch (err) { m = ''; } send({ t: 'applied', msg: m }); } });
  setTimeout(() => { try { send({ t: 'snap', snap: LY_snap(), init: 1 }); } catch (e) {} }, 50);
})();
