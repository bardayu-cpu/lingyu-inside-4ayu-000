/* =====================================================================
   v1.14 · 宣传海报：6 张底图（小屿已在图里），文案位置固定、限字数；学校 / 学院 logo 只能放 3 个固定位置
   p4–p6 底部自带一行平台说明（用户 10/19 确认保留），底部的字和 logo 都放在它上方
===================================================================== */
const PINK = '#6b4a1f', PACC = '#e8962e';
/* zone：文字区在上方 t / 下方 b；qr：二维码位置；no：会压到小屿、不能放 logo 的位置 */
const PTPL = [
  { n: '门口迎宾', zone: 'b' }, { n: '坐下聊聊', zone: 'b' }, { n: '探索时光', zone: 'b' },
  { n: '左上迎接', zone: 'b', no: ['tl'] }, { n: '左下陪伴', zone: 't', qr: 'r' }, { n: '右下邀请', zone: 't', qr: 'l' }];
const PFIELD = [['org', '机构名（小字）', 20], ['title', '主标题', 14], ['titleEn', '主标题 · English', 40], ['sub', '副标题', 24], ['due', '截止', 16], ['contact', '联系方式', 30]];
const PFIX = { cap: '扫码，用学校账号登录参与', foot: '结果只用于为你提供支持，不进入任何成绩或档案' };
const LOGO_POS = [['tl', '左上角'], ['tr', '右上角'], ['bc', '底部居中']];
const LOGO_K = [['school', '学校 logo'], ['college', '学院 logo']];
const pLen = s => [...(s || '')].length, pCut = (s, n) => [...(s || '')].slice(0, n).join('');
defPoster = p => ({ tpl: 0, org: '大学心理咨询中心 · 灵屿', title: '给自己 15 分钟', titleEn: 'Take 15 minutes for yourself', sub: '心理健康普测已开放，结果只用于为你提供支持',
  due: `截止 ${(p && p.due) || '10/19'}`, contact: '如有疑问请联系大学心理咨询中心', bg: null, zone: 'b', logos: {} });
PLANS.forEach(p => { if (p.poster) p.poster = defPoster(p); });
const pZone = P => P.bg ? (P.zone || 'b') : PTPL[P.tpl].zone;
const logoDef = (P, k) => { const no = P.bg ? [] : (PTPL[P.tpl].no || []); return k === 'school' ? (no.includes('tl') ? 'tr' : 'tl') : (no.includes('tl') ? 'bc' : 'tr'); };

drawPoster = function (P, w = 600) {
  const h = w * 1.5, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'), k = w / 600, T = PTPL[P.tpl] || PTPL[0], zone = pZone(P);
  const F = (wt, sz) => `${wt} ${sz * k}px -apple-system,"PingFang SC","Microsoft YaHei","Helvetica Neue",sans-serif`;
  x.fillStyle = '#fbf3e3'; x.fillRect(0, 0, w, h);
  const bg = img(P.bg || POSTER_BG[P.tpl]); if (bg.complete && bg.naturalWidth) { const r = Math.max(w / bg.naturalWidth, h / bg.naturalHeight); x.drawImage(bg, (w - bg.naturalWidth * r) / 2, (h - bg.naturalHeight * r) / 2, bg.naturalWidth * r, bg.naturalHeight * r); }
  const txt = (s, y, f, a = 1, al = 'center', X = w / 2) => { if (!s) return; x.globalAlpha = a; x.fillStyle = PINK; x.textAlign = al; x.font = f; x.fillText(s, X, y * k); x.globalAlpha = 1; };
  const pill = y => { x.font = F(600, 16); const bw = Math.max(150 * k, x.measureText(P.due).width + 40 * k); x.fillStyle = PACC; x.beginPath(); x.roundRect ? x.roundRect(w / 2 - bw / 2, y * k, bw, 34 * k, 17 * k) : x.rect(w / 2 - bw / 2, y * k, bw, 34 * k); x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(P.due, w / 2, (y + 23) * k); };
  if (zone === 'b') {
    txt(P.org, 530, F(600, 15), .85); txt(P.title, 574, F(700, 34)); txt(P.titleEn, 602, F(500, 16), .85); txt(P.sub, 634, F(400, 18)); if (P.due) pill(648);
    fakeQR(x, 172 * k, 698 * k, 80 * k, 7); txt(PFIX.cap, 726, F(600, 14), 1, 'left', 270 * k);
    x.font = F(400, 12); const ws = [...(P.contact || '')], ln = ['']; ws.forEach(c => { if (x.measureText(ln[ln.length - 1] + c).width > 300 * k) ln.push(''); ln[ln.length - 1] += c; });
    ln.slice(0, 2).forEach((l, i) => txt(l, 748 + i * 16, F(400, 12), .85, 'left', 270 * k));
  } else {
    txt(P.org, 96, F(600, 15), .85); txt(P.title, 142, F(700, 34)); txt(P.titleEn, 170, F(500, 16), .85); txt(P.sub, 202, F(400, 18)); if (P.due) pill(216); txt(P.contact, 280, F(400, 13), .85);
    const qx = (T.qr === 'l' || (P.bg && T.qr !== 'r')) ? 48 : 600 - 48 - 92; fakeQR(x, qx * k, 676 * k, 92 * k, 7); txt(PFIX.cap, 792, F(500, 12), 1, 'center', (qx + 46) * k);
  }
  txt(PFIX.foot, 834, F(400, 11), .8);
  // logo：等比缩放，角上最高 6%、底部居中最高 40（避开底部那行字）、最宽 30%
  Object.entries(P.logos || {}).forEach(([kk, L]) => { if (!L || !L.src) return; const im = img(L.src); if (!(im.complete && im.naturalWidth)) return;
    const mh = (L.pos === 'bc' ? 40 : 54) * k, mw = 180 * k, r = Math.min(mh / im.naturalHeight, mw / im.naturalWidth), lw = im.naturalWidth * r, lh = im.naturalHeight * r;
    const lx = L.pos === 'tl' ? 28 * k : L.pos === 'tr' ? w - 28 * k - lw : w / 2 - lw / 2, ly = L.pos === 'bc' ? 818 * k - lh : 24 * k; x.drawImage(im, lx, ly, lw, lh); });
  return cv; };

/* 海报弹窗：中心（发布施测方案的人）· 选底图、改字、放 logo */
const pCnt = (id, f, n) => `<small class="pcnt" data-pc="${id}|${f}">${pLen(posterOf(id)[f])} / ${n}</small>`;
const logoRow = (id, P, kk, n, fixedPos) => { const L = (P.logos || {})[kk], no = P.bg ? [] : (PTPL[P.tpl].no || []), other = Object.entries(P.logos || {}).filter(([o, v]) => o !== kk && v && v.src).map(([, v]) => v.pos);
  return `<div class="plogo"><b>${n}</b>${L && L.src ? `<img src="${L.src}" alt="">` : '<span class="note">未上传</span>'}
    <label class="btn sec xs">${L && L.src ? '替换' : '上传'}<input type="file" accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml" class="plogoin" data-pid="${id}" data-lk="${kk}" hidden></label>
    ${L && L.src ? `${fixedPos ? '' : `<select data-plpos="${id}|${kk}">${LOGO_POS.map(([p, pn]) => `<option value="${p}" ${L.pos === p ? 'selected' : ''} ${no.includes(p) || other.includes(p) ? 'disabled' : ''}>${pn}${no.includes(p) ? '（会压到小屿）' : other.includes(p) ? '（已占用）' : ''}</option>`).join('')}</select>`}<button class="lnk" data-act="pLogoClr" data-arg="${id}|${kk}">移除</button>` : ''}</div>`; };
function posterBox(id) { const P = posterOf(id), cv = drawPoster(P, 300);
  return `<div class="ov" data-act="ovClose"><div class="mo wide"><h3>宣传海报</h3><p>全校统一一张，随辅导员转发包一起发出。选一张底图，改好文字，需要的话放上学校或学院 logo，然后下载。</p>
  <div class="poster"><img src="${cv.toDataURL()}" alt="海报预览"><div class="pform">
    <div class="fld"><label>底图</label><div class="ptpls">${PTPL.map((t, i) => `<button class="${P.tpl === i && !P.bg ? 'on' : ''}" data-act="pTpl" data-arg="${id}|${i}" title="${t.n}"><img src="${POSTER_BG[i]}" alt=""><span>${t.n}</span></button>`).join('')}</div>
      <div style="margin-top:6px"><label class="btn sec xs">上传自己的底图<input type="file" accept="image/*" data-pid="${id}" class="pbg" hidden></label>${P.bg ? ` 文字区：<select data-pzone="${id}"><option value="b" ${pZone(P) === 'b' ? 'selected' : ''}>下方</option><option value="t" ${pZone(P) === 't' ? 'selected' : ''}>上方</option></select> <button class="lnk" data-act="pBgClr" data-arg="${id}">换回模板底图</button>` : ''}</div></div>
    ${PFIELD.map(([f, n, m]) => `<div class="fld"><label>${n}${pCnt(id, f, m)}</label><input class="in" style="width:100%" maxlength="${m}" data-pbind="${id}|${f}" data-max="${m}" value="${esc(P[f] || '')}"></div>`).join('')}
    <p class="note">二维码说明「${PFIX.cap}」和底部小字「${PFIX.foot}」是固定的，不能改。文字的位置、字号、颜色按底图固定。</p>
    <div class="fld"><label>logo<small>PNG / JPG / SVG，2 MB 以内；只能放左上、右上、底部居中</small></label>${LOGO_K.map(([kk, n]) => logoRow(id, P, kk, n)).join('')}</div>
  </div></div><div class="acts"><button class="btn sec" data-act="moClose">关闭</button><button class="btn pri" data-act="posterDl" data-arg="${id}">下载海报 PNG</button></div></div></div>`; }
/* 辅导员：宣传素材里下载海报前，只能换学院 logo（文案不能改） */
const l1Poster = pid => { const P = posterOf(pid), mine = (S.l1logo || {})[pid]; return Object.assign({}, P, { logos: Object.assign({}, P.logos, mine ? { college: { src: mine, pos: (P.logos.college && P.logos.college.pos) || logoDef(P, 'college') } } : {}) }); };
function posterL1Box(pid) { const P = l1Poster(pid), cv = drawPoster(P, 300), mine = (S.l1logo || {})[pid];
  return `<div class="ov" data-act="ovClose"><div class="mo wide"><h3>下载宣传海报</h3><p>海报内容由心理中心统一制作，文字不能改。你可以把「学院 logo」换成本学院的。</p>
  <div class="poster"><img src="${cv.toDataURL()}" alt="海报预览"><div class="pform"><div class="fld"><label>学院 logo<small>PNG / JPG / SVG，2 MB 以内</small></label><div class="plogo">${P.logos.college && P.logos.college.src ? `<img src="${P.logos.college.src}" alt="">` : '<span class="note">中心没放学院 logo</span>'}
    <label class="btn sec xs">${mine ? '再换一个' : '换成本学院的'}<input type="file" accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml" class="plogoin" data-pid="${pid}" data-lk="l1" hidden></label>${mine ? `<button class="lnk" data-act="pL1Clr" data-arg="${pid}">恢复中心的</button>` : ''}</div>
    <p class="note">位置跟中心设置的一样${P.logos.college && P.logos.college.pos ? `（${LOGO_POS.find(p => p[0] === P.logos.college.pos)[1]}）` : `（${LOGO_POS.find(p => p[0] === logoDef(P, 'college'))[1]}）`}。</p></div></div></div>
  <div class="acts"><button class="btn sec" data-act="moClose">关闭</button><button class="btn pri" data-act="posterDlL1" data-arg="${pid}">下载海报 PNG</button></div></div></div>`; }
const _md14 = modal; modal = function () { const [k, id] = (S.mo || '').split(':'); if (k === 'poster') return posterBox(id); if (k === 'posterL1') return posterL1Box(id); return _md14(); };
const pRefresh = () => { clearTimeout(window._pt); window._pt = setTimeout(() => { const i = document.querySelector('.poster img'), [k, id] = (S.mo || '').split(':'); if (i && id) i.src = drawPoster(k === 'posterL1' ? l1Poster(id) : posterOf(id), 300).toDataURL(); }, 120); };
const pLog = (id, t) => { if (String(id).startsWith('l1~')) return log(`${t}（辅导员自己的版本）`, null, { cat: '配置', obj: '宣传素材' }); if (id !== 'wiz') log(t, null, { cat: '配置', obj: '施测方案' }); };
Object.assign(ACT, {
  pTpl(a) { const [id, i] = a.split('|'), P = posterOf(id); P.tpl = +i; P.bg = null; Object.entries(P.logos || {}).forEach(([kk, L]) => { if (L && (PTPL[+i].no || []).includes(L.pos)) L.pos = logoDef(P, kk); }); pLog(id, `宣传海报换底图：${PTPL[+i].n}`); },
  pBgClr(id) { posterOf(id).bg = null; pLog(id, '宣传海报换回模板底图'); },
  pLogoClr(a) { const [id, kk] = a.split('|'), P = posterOf(id); delete P.logos[kk]; pLog(id, `宣传海报移除${LOGO_K.find(x => x[0] === kk)[1]}`); },
  pL1Clr(pid) { delete (S.l1logo || {})[pid]; },
  posterDl(id) { const P = posterOf(id), cv = drawPoster(P, 900); try { const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = '灵屿-宣传海报.png'; a.click(); } catch (e) {}
    if (isL1()) { S.mo = `posterL1:${id}`; return; } pLog(id, `下载宣传海报（${P.bg ? '自己的底图' : PTPL[P.tpl].n}）`); toast('已下载海报'); },
  posterDlL1(pid) { const cv = drawPoster(l1Poster(pid), 900); try { const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = '灵屿-宣传海报.png'; a.click(); } catch (e) {}
    log(`下载宣传海报${(S.l1logo || {})[pid] ? '（换成了本学院 logo）' : ''}`, null, { cat: '配置', obj: '宣传素材' }); S.mo = null; toast('已下载海报'); },
});
/* 输入：限字数（粘贴也截断），实时字数；改完一个字段记一次操作记录 */
document.addEventListener('input', e => { const pb = e.target.dataset.pbind; if (!pb) return; const n = +e.target.dataset.max, [id, f] = pb.split('|');
  if (n && pLen(e.target.value) > n) { e.target.value = pCut(e.target.value, n); posterOf(id)[f] = e.target.value; }
  const c = document.querySelector(`[data-pc="${pb}"]`); if (c) c.textContent = `${pLen(e.target.value)} / ${n}`; pRefresh(); }, true);
document.addEventListener('change', e => { const t = e.target, d = t.dataset;
  if (d.pbind) { const [id, f] = d.pbind.split('|'); pLog(id, `修改宣传海报文案：${PFIELD.find(x => x[0] === f)[1]}`); return; }
  if (d.pzone) { posterOf(d.pzone).zone = t.value; render(); return; }
  if (d.plpos) { const [id, kk] = d.plpos.split('|'), P = posterOf(id); P.logos[kk].pos = t.value; pLog(id, `宣传海报${LOGO_K.find(x => x[0] === kk)[1]}位置：${LOGO_POS.find(p => p[0] === t.value)[1]}`); render(); return; }
  if (t.classList.contains('plogoin')) { const f = t.files && t.files[0]; if (!f) return;
    if (!/^image\/(png|jpeg|svg\+xml)$/.test(f.type) && !/\.(png|jpe?g|svg)$/i.test(f.name)) { toast('只支持 PNG、JPG、SVG'); t.value = ''; return; }
    if (f.size > 2 * 1024 * 1024) { toast('图片超过 2 MB，请压缩后再传'); t.value = ''; return; }
    const r = new FileReader(); r.onload = () => { const id = d.pid, kk = d.lk;
      if (kk === 'l1') { S.l1logo = S.l1logo || {}; S.l1logo[id] = r.result; render(); return; }
      const P = posterOf(id); P.logos = P.logos || {}; const had = P.logos[kk] && P.logos[kk].src; P.logos[kk] = { src: r.result, pos: (P.logos[kk] && P.logos[kk].pos) || logoDef(P, kk) };
      const other = Object.entries(P.logos).find(([o, v]) => o !== kk && v && v.pos === P.logos[kk].pos); if (other) P.logos[kk].pos = LOGO_POS.map(p => p[0]).find(p => p !== other[1].pos && !(P.bg ? [] : (PTPL[P.tpl].no || [])).includes(p));
      pLog(id, `宣传海报${had ? '替换' : '上传'}${LOGO_K.find(x => x[0] === kk)[1]}`); render(); }; r.readAsDataURL(f); } });
/* 辅导员「宣传素材」里的「下载海报」先打开只能换学院 logo 的弹窗 */
const _ma14 = ACT.mo; ACT.mo = function (a) { return _ma14.apply(this, arguments); };
const _wp14 = workPage; workPage = function () { const h = _wp14(); return isL1() ? h.replace(/data-act="posterDl" data-arg="([^"]+)"/g, 'data-act="mo" data-arg="posterL1:$1"') : h; };
PAGES.work = workPage;
