/* v1.18 · 学生端的演示数据也存在本机；重置先确认 */
const KEEP = lyKeep('ly_keep_stu_' + LY_VER, { S: [() => S, v => { S = v; }] });
const _rK18 = render; render = function () { const r = _rK18.apply(this, arguments); KEEP.later(); return r; };
const _bootK18 = boot; boot = function () { _bootK18.apply(this, arguments); if (KEEP.load()) { try { $('#scen').value = S.scen; } catch (e) {} render(); }
  $('#resetBtn').onclick = () => lyResetAsk(() => { KEEP.clear(true); reset(S.scen); render(); }); };
