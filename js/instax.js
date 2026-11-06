// 拍立得：相机（正面/背面）、相纸盒、照片（显影、灰片、涂鸦）、取景框、翻牌计数、闪光、自拍红灯
(() => {
  const { W, H, TAU, clamp, lerp, ease, sstep, hash, css, mix, rgb } = MV;
  const D = MV.draw, C = MV.C;
  const X = {};

  const rr = (p, x, y, w, h, r) => { p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r); p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath(); };
  X.rr = rr;

  // ---------- 相机 ----------
  // 局部单位：机身宽 12、高 10，原点在机身中心。o.view: 'front' | 'back'
  X.BODY = { w: 12, h: 10 };
  X.camera = (ctx, x, y, s, o = {}) => {
    const { view = 'front', rot = 0, color = C.mint, shade = C.mintDark, flash = 0, led = 0, count = null, eject = 0, photo = null, lens = 1, alpha = 1, strap = true, door = 0, pack = 0 } = o;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= alpha;
    // 吐出来的照片在机身后面
    if (eject > 0 && photo) {
      const cw = 5.6, ch = cw * 86 / 54;
      ctx.save(); ctx.beginPath(); ctx.rect(-7, -60, 14, 55.05); ctx.clip();
      X.photo(ctx, 0, -5 - eject * ch + ch / 2, cw, 0, Object.assign({ shadow: false }, photo));
      ctx.restore();
    }
    // 背带
    if (strap) {
      ctx.strokeStyle = css('#efe3cc'); ctx.lineWidth = 0.42; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-6.1, -2.6); ctx.bezierCurveTo(-8.5, -1, -8.8, 3.5, -7.6, 6.6); ctx.stroke();
      ctx.strokeStyle = css('#d9c8aa'); ctx.lineWidth = 0.18; ctx.setLineDash([0.35, 0.3]);
      ctx.beginPath(); ctx.moveTo(-6.1, -2.6); ctx.bezierCurveTo(-8.5, -1, -8.8, 3.5, -7.6, 6.6); ctx.stroke(); ctx.setLineDash([]);
    }
    // 机身
    const body = new Path2D(); rr(body, -6, -5, 12, 10, 2.5);
    ctx.fillStyle = color; ctx.fill(body);
    ctx.save(); ctx.clip(body);
    ctx.fillStyle = css(shade, 0.55); ctx.fillRect(-6, 3.2, 12, 2);                  // 底部暗面
    ctx.fillStyle = css('#ffffff', 0.18); ctx.fillRect(-6, -5, 12, 1.15);              // 顶部受光
    ctx.fillStyle = css('#ffffff', 0.1); ctx.fillRect(-6, -5, 1.2, 10);
    ctx.restore();
    // 挂绳耳
    ctx.fillStyle = css(shade); ctx.fillRect(-6.35, -3, 0.45, 0.9); ctx.fillRect(5.9, -3, 0.45, 0.9);
    if (view === 'front') {
      // 出片口
      ctx.fillStyle = '#2b2a33'; const slot = new Path2D(); rr(slot, -3.2, -5.12, 6.4, 0.34, 0.15); ctx.fill(slot);
      // 镜头座
      ctx.fillStyle = C.cream; ctx.beginPath(); ctx.arc(-0.4, 0.7, 3.55, 0, TAU); ctx.fill();
      ctx.fillStyle = css('#000000', 0.06); ctx.beginPath(); ctx.arc(-0.25, 0.95, 3.55, 0, TAU); ctx.arc(-0.4, 0.7, 3.4, 0, TAU, true); ctx.fill();
      // 镜筒
      ctx.fillStyle = '#3a3a46'; ctx.beginPath(); ctx.arc(-0.4, 0.7, 2.95, 0, TAU); ctx.fill();
      ctx.strokeStyle = css('#5c5b6a'); ctx.lineWidth = 0.08;
      for (let i = 0; i < 36; i++) { const a = (i / 36) * TAU; ctx.beginPath(); ctx.moveTo(-0.4 + Math.cos(a) * 2.62, 0.7 + Math.sin(a) * 2.62); ctx.lineTo(-0.4 + Math.cos(a) * 2.9, 0.7 + Math.sin(a) * 2.9); ctx.stroke(); }
      // 镜片：深色玻璃 + 反光
      const g = ctx.createRadialGradient(-1.2, -0.2, 0.2, -0.4, 0.7, 2.5);
      g.addColorStop(0, '#3d4a66'); g.addColorStop(0.55, '#171725'); g.addColorStop(1, '#0b0b12');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(-0.4, 0.7, 2.45, 0, TAU); ctx.fill();
      if (lens < 1) MV.film.aperture(ctx, -0.4, 0.7, 2.2 * lens, 2.45, 0.4, 1 / s, { color: '#121018', edge: '#3b3548' });
      ctx.fillStyle = css('#9fb4e0', 0.55); ctx.beginPath(); ctx.ellipse(-1.25, -0.25, 0.75, 0.42, -0.6, 0, TAU); ctx.fill();
      ctx.fillStyle = css('#ffffff', 0.7); ctx.beginPath(); ctx.arc(-1.45, -0.4, 0.22, 0, TAU); ctx.fill();
      ctx.strokeStyle = css('#ffffff', 0.18); ctx.lineWidth = 0.12; ctx.beginPath(); ctx.arc(-0.4, 0.7, 1.75, 0.4, 1.4); ctx.stroke();
      // 取景窗
      const vf = new Path2D(); rr(vf, -5.0, -4.2, 2.1, 1.45, 0.4); ctx.fillStyle = '#23222c'; ctx.fill(vf);
      ctx.fillStyle = css('#8ea2c8', 0.45); ctx.fillRect(-4.75, -4.0, 0.5, 0.3);
      // 闪光灯
      const fl = new Path2D(); rr(fl, 1.85, -4.35, 3.55, 1.7, 0.45);
      ctx.fillStyle = mix('#e9eef2', '#fffbe8', flash); ctx.fill(fl);
      ctx.save(); ctx.clip(fl); ctx.strokeStyle = css('#b8c4cc', 0.8 * (1 - flash)); ctx.lineWidth = 0.09;
      for (let i = 0; i < 12; i++) { const xx = 1.95 + i * 0.3; ctx.beginPath(); ctx.moveTo(xx, -4.4); ctx.lineTo(xx, -2.6); ctx.stroke(); }
      ctx.restore();
      if (flash > 0.01) { D.glow(ctx, 3.6, -3.5, 9 + flash * 10, '#fff6dc', flash); D.flare(ctx, 3.6, -3.5, 18 * flash, '#fffaf0', flash * 0.9); }
      // 自拍红灯
      ctx.fillStyle = led > 0.5 ? '#ff5a4f' : '#7a3a3a'; ctx.beginPath(); ctx.arc(3.3, -1.55, 0.3, 0, TAU); ctx.fill();
      if (led > 0.01) D.glow(ctx, 3.3, -1.55, 2.6, '#ff4a3a', led * 0.95);
      // 快门键
      ctx.fillStyle = mix(C.coral, '#b84f3c', o.press || 0); ctx.beginPath(); ctx.arc(4.25, 1.6, 0.85, 0, TAU); ctx.fill();
      ctx.fillStyle = css('#ffffff', 0.28 * (1 - (o.press || 0))); ctx.beginPath(); ctx.arc(4.05, 1.35, 0.35, 0, TAU); ctx.fill();
    } else {
      // 背面：取景目镜、计数窗、后盖
      const ep = new Path2D(); rr(ep, -5.0, -4.3, 2.4, 1.7, 0.5); ctx.fillStyle = '#2b2a33'; ctx.fill(ep);
      ctx.fillStyle = css('#7d8fb5', 0.5); ctx.fillRect(-4.6, -4.0, 0.6, 0.35);
      // 后盖：door 0 关上 → 1 打开（向右翻开）
      const dw = 9.2 * (1 - door * 0.85);
      const dp = new Path2D(); rr(dp, -4.6, -2.0, dw, 6.3, 0.9);
      if (door > 0.02) {
        // 开着：里面的相纸仓
        const bay = new Path2D(); rr(bay, -4.6, -2.0, 9.2, 6.3, 0.9); ctx.fillStyle = '#26252e'; ctx.fill(bay);
        if (pack > 0) { // 推进去的相纸盒
          const px = lerp(7.5, 0, ease.outCubic(clamp(pack))), pk = new Path2D(); rr(pk, -4.2 + px, -1.6, 8.4, 5.5, 0.5);
          ctx.fillStyle = '#1b1a22'; ctx.fill(pk); ctx.fillStyle = css('#e8e2d6', 0.9); ctx.fillRect(-3.6 + px, -1.0, 7.2, 4.3);
          ctx.fillStyle = css('#2f2c3a', 0.9); ctx.fillRect(-3.6 + px, -1.0, 7.2, 0.5);
        }
      }
      ctx.fillStyle = mix(color, '#ffffff', 0.12); ctx.fill(dp);
      ctx.strokeStyle = css(shade, 0.9); ctx.lineWidth = 0.14; ctx.stroke(dp);
      ctx.fillStyle = css(shade); ctx.fillRect(-4.6 + dw - 0.5, 0.6, 0.25, 1.2); // 搭扣
      // 计数窗
      const cw = new Path2D(); rr(cw, 2.4, -4.45, 2.9, 1.95, 0.4); ctx.fillStyle = '#17161d'; ctx.fill(cw);
      if (count != null) {
        ctx.fillStyle = count === '' ? '#555' : '#ffefe0'; ctx.font = '700 1.35px Bahnschrift, "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(count), 3.85, -3.42);
        if (o.countGlow) D.glow(ctx, 3.85, -3.45, 3, '#ffd2a8', o.countGlow * 0.6);
      }
    }
    ctx.restore();
  };

  // ---------- 相纸盒（片名卡） ----------
  // 局部单位：宽 16、高 10。o.wrap 0..1：锡箔包装的完整程度（撕开时减小）
  X.filmBox = (ctx, x, y, s, o = {}) => {
    const { rot = 0, wrap = 1, title = null, credits = [], exp = '', light = 0, alpha = 1 } = o;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= alpha;
    // 盒子
    const box = new Path2D(); rr(box, -8, -5, 16, 10, 0.5);
    ctx.fillStyle = '#f7f1e6'; ctx.fill(box);
    ctx.save(); ctx.clip(box);
    // 左侧色带
    const bands = ['#e8735a', '#e9b949', '#9fd8c7', '#4e8c8f'];
    bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-8 + i * 0.9, -5, 0.9, 10); });
    ctx.fillStyle = css('#000000', 0.05); ctx.fillRect(-8, 3.6, 16, 1.4);
    ctx.restore();
    // 文字：歌名大字、歌手、署名（都来自 LRC 的片名与署名行）
    ctx.fillStyle = '#2b2638'; ctx.textBaseline = 'alphabetic';
    if (title) {
      ctx.textAlign = 'left';
      ctx.font = '700 3.1px "Noto Serif SC", serif'; ctx.fillText(title.song, -4.3, -0.9);
      ctx.font = '500 0.95px "Noto Sans SC", sans-serif'; ctx.fillStyle = '#4a4458'; ctx.fillText(title.artist, -4.25, 0.75);
    }
    ctx.font = '400 0.56px "Noto Sans SC", sans-serif'; ctx.fillStyle = '#6a6478';
    credits.forEach((c, i) => { ctx.fillText(`${c.role}  ${c.name}`, -4.25, 2.05 + i * 0.72); });
    // 右上：10 张的图标
    ctx.textAlign = 'center';
    for (let i = 0; i < 5; i++) { const sx = 4.2 + i * 0.62; const q = new Path2D(); rr(q, sx, -3.9, 0.48, 0.72, 0.06); ctx.fillStyle = '#2b2638'; ctx.fill(q); ctx.fillStyle = '#f7f1e6'; ctx.fillRect(sx + 0.06, -3.84, 0.36, 0.42); }
    ctx.fillStyle = '#2b2638'; ctx.font = '700 1.25px Bahnschrift, "Segoe UI", sans-serif'; ctx.fillText('10', 5.65, -1.45);
    ctx.font = '400 0.42px Bahnschrift, "Segoe UI", sans-serif'; ctx.fillText('INSTANT FILM', 5.65, -0.75);
    // 保质期
    if (exp) {
      ctx.save(); ctx.translate(5.6, 3.15); ctx.rotate(-0.04);
      const st = new Path2D(); rr(st, -1.9, -0.55, 3.8, 1.1, 0.12); ctx.strokeStyle = css('#c0392b', 0.85); ctx.lineWidth = 0.08; ctx.stroke(st);
      ctx.fillStyle = css('#c0392b', 0.9); ctx.font = '700 0.62px Bahnschrift, Consolas, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(exp, 0, 0.03);
      ctx.restore();
    }
    // 锡箔包装（盖在盒子外，撕开时从右往左卷）
    if (wrap > 0.001) {
      const fw = 16.6 * wrap, fp = new Path2D(); rr(fp, -8.3, -5.3, fw, 10.6, 0.6);
      const g = ctx.createLinearGradient(-8, -5, 8, 5);
      g.addColorStop(0, '#d9dde6'); g.addColorStop(0.3, '#f6f7fb'); g.addColorStop(0.55, '#b9bfcc'); g.addColorStop(0.8, '#eef0f5'); g.addColorStop(1, '#c4c9d4');
      ctx.fillStyle = g; ctx.fill(fp);
      ctx.save(); ctx.clip(fp); ctx.strokeStyle = css('#ffffff', 0.5); ctx.lineWidth = 0.06;
      for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo(-8.3 + i * 1.3, -5.3); ctx.lineTo(-8.3 + i * 1.3 + 3, 5.3); ctx.stroke(); }
      ctx.restore();
      // 撕口的锯齿边
      if (wrap < 0.999) {
        const ex = -8.3 + fw; ctx.fillStyle = '#e3e6ee'; ctx.beginPath(); ctx.moveTo(ex, -5.3);
        for (let i = 0; i <= 12; i++) ctx.lineTo(ex + (i % 2 ? 0.35 : -0.05), -5.3 + i * (10.6 / 12));
        ctx.lineTo(ex - 0.6, 5.3); ctx.lineTo(ex - 0.6, -5.3); ctx.closePath(); ctx.fill();
      }
    }
    if (light > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css('#fff3d6', light * 0.25); ctx.fill(box); }
    ctx.restore();
  };

  // ---------- 照片 ----------
  // 卡片尺寸 54×86（mini），画面 46×62。w：卡片宽（像素），中心在 (x, y)
  X.CARD = { w: 54, h: 86, ix: 4, iy: 6.5, iw: 46, ih: 62 };
  X.photo = (ctx, x, y, w, rot = 0, o = {}) => {
    const { img = null, dev = 1, gray = false, shadow = true, light = 0, alpha = 1, draw = null, doodle = null, caption = null, sheen = 0, tint = null, curl = 0 } = o;
    const K = X.CARD, sc = w / K.w;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha *= alpha;
    const card = new Path2D(); rr(card, -K.w / 2, -K.h / 2, K.w, K.h, 1.6);
    if (shadow) {
      ctx.save(); ctx.shadowColor = 'rgba(30,20,30,0.32)'; ctx.shadowBlur = 14 * sc; ctx.shadowOffsetY = 5 * sc;
      ctx.fillStyle = '#f8f4ea'; ctx.fill(card); ctx.restore();
    }
    ctx.fillStyle = '#fbf8f0'; ctx.fill(card);
    // 卡片的细微纸纹
    ctx.fillStyle = css('#e9e2d3', 0.5); ctx.fillRect(-K.w / 2, K.h / 2 - 4, K.w, 4);
    const ix = -K.w / 2 + K.ix, iy = -K.h / 2 + K.iy;
    ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, K.iw, K.ih); ctx.clip();
    // 显影：奶白偏蓝 → 影像浮出 → 暖起来
    ctx.fillStyle = '#cfd3dc'; ctx.fillRect(ix, iy, K.iw, K.ih);
    const d = gray ? Math.min(dev, 0.12) : dev;
    if (d > 0.02) {
      ctx.globalAlpha = alpha * sstep(0.05, 0.75, d);
      if (img) ctx.drawImage(img, ix, iy, K.iw, K.ih);
      else if (draw) { ctx.save(); ctx.translate(ix, iy); ctx.scale(K.iw / 460, K.ih / 620); draw(ctx, 460, 620); ctx.restore(); }
      ctx.globalAlpha = alpha;
      const milk = (1 - sstep(0.1, 1, d));
      if (milk > 0.01) { ctx.globalCompositeOperation = 'color'; ctx.fillStyle = css('#9fb0cf', milk * 0.7); ctx.fillRect(ix, iy, K.iw, K.ih); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = css('#dfe2ea', milk * 0.75); ctx.fillRect(ix, iy, K.iw, K.ih); }
    }
    if (gray) { ctx.fillStyle = css('#9a9ea8', sstep(0.2, 1, dev) * 0.85); ctx.fillRect(ix, iy, K.iw, K.ih); }
    if (tint) { ctx.globalCompositeOperation = tint[2] || 'soft-light'; ctx.fillStyle = css(tint[0], tint[1]); ctx.fillRect(ix, iy, K.iw, K.ih); ctx.globalCompositeOperation = 'source-over'; }
    // 光泽：一道斜着扫过的高光
    if (sheen > 0) {
      const sx = lerp(-60, 60, sheen);
      const g = ctx.createLinearGradient(sx - 14, -40, sx + 14, 40);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(ix, iy, K.iw, K.ih);
    }
    ctx.restore();
    if (doodle) { ctx.save(); ctx.translate(ix, iy); doodle(ctx, K.iw, K.ih); ctx.restore(); }
    if (caption) caption(ctx, 0, K.h / 2 - 9, K.w);
    if (light > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css('#fff1d0', light * 0.3); ctx.fill(card); }
    void curl;
    ctx.restore();
  };

  // 照片内容的缓存：同一个 key 只画一次（460×620 的画面，按需要的分辨率）
  const pics = new Map();
  X.picture = (key, draw, res = 1) => {
    const k = key + '@' + res;
    let c = pics.get(k);
    if (!c) {
      c = D.makeCanvas(Math.round(460 * res), Math.round(620 * res));
      const g = c.getContext('2d'); g.scale(res, res); draw(g, 460, 620);
      pics.set(k, c);
    }
    return c;
  };
  // 从某个镜头某一刻的画面里裁出取景框那一块，当作照片内容（保证照片和拍下的画面一致）
  X.grab = (shotId, t, frame, res = 1) => {
    return X.picture('grab:' + shotId + ':' + t + ':' + frame.join(','), (g, w, h) => {
      const sh = MV.director.list.find(s => s.id === shotId);
      if (!sh) return;
      const [fx, fy, fw, fh] = frame;
      g.save(); g.scale(w / fw, h / fh); g.translate(-fx, -fy);
      g.beginPath(); g.rect(fx, fy, fw, fh); g.clip();
      const st = MV.director.state(sh, t); st.clean = true;
      sh.draw(g, st);
      g.restore();
    }, res);
  };

  // ---------- 取景框 ----------
  // 全屏覆盖：边缘压暗、中间竖幅框线（就是照片会拍下的范围）、计数徽章
  X.FRAME = (() => { const h = 860, w = Math.round(h * 46 / 62); return [Math.round((W - w) / 2), Math.round((H - h) / 2) - 10, w, h]; })();
  X.viewfinder = (ctx, o = {}) => {
    const { a = 1, frame = X.FRAME, count = null, pulse = 0, dim = 0.42, hint = 0, focus = 1, rec = 0 } = o;
    if (a <= 0.001) return;
    const [fx, fy, fw, fh] = frame;
    ctx.save(); ctx.globalAlpha *= a;
    // 框外压暗
    ctx.beginPath(); ctx.rect(-50, -50, W + 100, H + 100); const fr = new Path2D(); rr(fr, fx, fy, fw, fh, 18);
    ctx.fillStyle = css('#120f18', dim);
    const outer = new Path2D(); outer.rect(-50, -50, W + 100, H + 100); outer.addPath(fr);
    ctx.fill(outer, 'evenodd');
    // 目镜的圆角暗边
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, 'rgba(10,8,14,0)'); g.addColorStop(1, 'rgba(10,8,14,0.65)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 框线与四角
    ctx.strokeStyle = css('#fff7ea', 0.75); ctx.lineWidth = 1.5; ctx.stroke(fr);
    ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = css('#fff7ea', 0.95);
    const L = 46;
    for (const [cx, cy, dx, dy] of [[fx, fy, 1, 1], [fx + fw, fy, -1, 1], [fx, fy + fh, 1, -1], [fx + fw, fy + fh, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(cx + dx * 8, cy + dy * (L + 8)); ctx.lineTo(cx + dx * 8, cy + dy * 8); ctx.lineTo(cx + dx * (L + 8), cy + dy * 8); ctx.stroke();
    }
    // 中心对焦圈
    ctx.lineWidth = 1.5; ctx.strokeStyle = css('#fff7ea', 0.55 * focus);
    ctx.beginPath(); ctx.arc(fx + fw / 2, fy + fh / 2, 26 + (1 - focus) * 14, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx + fw / 2 - 8, fy + fh / 2); ctx.lineTo(fx + fw / 2 + 8, fy + fh / 2); ctx.moveTo(fx + fw / 2, fy + fh / 2 - 8); ctx.lineTo(fx + fw / 2, fy + fh / 2 + 8); ctx.stroke();
    // 计数徽章
    if (count != null) {
      const bx = fx + fw + 26, by = fy + fh - 70, sc = 1 + pulse * 0.25;
      ctx.save(); ctx.translate(bx + 46, by + 30); ctx.scale(sc, sc);
      const b = new Path2D(); rr(b, -46, -30, 92, 60, 14); ctx.fillStyle = css('#14111b', 0.55); ctx.fill(b);
      // 小相纸图标
      ctx.strokeStyle = css('#fff7ea', 0.8); ctx.lineWidth = 2; const ic = new Path2D(); rr(ic, -34, -15, 20, 28, 2.5); ctx.stroke(ic);
      ctx.fillStyle = css('#fff7ea', 0.8); ctx.fillRect(-31, -12, 14, 16);
      ctx.fillStyle = '#fff7ea'; ctx.font = '700 36px Bahnschrift, "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(count), 14, 2);
      ctx.restore();
    }
    // 闪光就绪的小灯
    if (rec > 0) { ctx.fillStyle = css('#ff8a3d', rec); ctx.beginPath(); ctx.arc(fx + fw + 48, fy + 40, 7, 0, TAU); ctx.fill(); D.glow(ctx, fx + fw + 48, fy + 40, 40, '#ff8a3d', rec * 0.6); }
    if (hint > 0) { /* 预留 */ }
    ctx.restore();
  };

  // ---------- 翻牌计数（MG 大字） ----------
  // 机械翻牌：from 翻到 to，u 0..1；size 是牌的高度
  X.flip = (ctx, x, y, size, from, to, u, o = {}) => {
    const { color = '#1d1a24', ink = '#fff6ea', alpha = 1, shadow = true } = o;
    const w = size * 0.74 * (String(Math.max(from, to)).length > 1 ? 1.45 : 1), h = size;
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= alpha;
    const tile = (txt, half, sq = 1) => {
      // half: 'top' | 'bottom'；sq：纵向压缩（翻动中的那片）
      ctx.save();
      ctx.beginPath(); if (half === 'top') ctx.rect(-w / 2 - 2, -h / 2 - 2, w + 4, h / 2 + 1); else ctx.rect(-w / 2 - 2, 0 - 1, w + 4, h / 2 + 3); ctx.clip();
      if (sq !== 1) { ctx.scale(1, sq); }
      const p = new Path2D(); rr(p, -w / 2, -h / 2, w, h, size * 0.09); ctx.fillStyle = color; ctx.fill(p);
      ctx.fillStyle = css('#ffffff', half === 'top' ? 0.05 : 0); ctx.fill(p);
      ctx.fillStyle = ink; ctx.font = `700 ${size * 0.82}px Bahnschrift, "Segoe UI", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(txt), 0, size * 0.03);
      ctx.restore();
    };
    if (shadow) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = size * 0.18; ctx.shadowOffsetY = size * 0.06; const p = new Path2D(); rr(p, -w / 2, -h / 2, w, h, size * 0.09); ctx.fillStyle = color; ctx.fill(p); ctx.restore(); }
    const k = clamp(u);
    // 底：上半是新数字，下半是旧数字；翻动的一片先是旧数字上半往下压扁，再是新数字下半展开
    tile(to, 'top'); tile(from, 'bottom');
    if (k < 0.5) { const sq = Math.cos(k * Math.PI); tile(from, 'top', Math.max(0.001, sq)); ctx.fillStyle = css('#000000', 0.35 * k * 2); ctx.fillRect(-w / 2, 0, w, h / 2); }
    else { const sq = -Math.cos(k * Math.PI); tile(to, 'bottom', Math.max(0.001, sq)); }
    // 中缝
    ctx.fillStyle = css('#000000', 0.5); ctx.fillRect(-w / 2, -size * 0.008, w, size * 0.016);
    ctx.fillStyle = css(color); ctx.fillRect(-w / 2 - size * 0.03, -size * 0.06, size * 0.05, size * 0.12); ctx.fillRect(w / 2 - size * 0.02, -size * 0.06, size * 0.05, size * 0.12);
    ctx.restore();
  };

  // ---------- 闪光 ----------
  X.burst = (ctx, x, y, k, o = {}) => {
    if (k <= 0.001) return;
    const { r = 900, color = '#fff7e6' } = o;
    D.glow(ctx, x, y, r * (0.6 + 0.6 * k), color, k);
    D.flare(ctx, x, y, r * 1.6 * k, color, k * 0.9);
    D.flare(ctx, x, y, r * 1.1 * k, color, k * 0.6, 0.78);
  };

  // 自拍定时：10 秒倒数，前 8 秒慢闪，最后 2 秒快闪；u 为已过秒数
  X.selfTimer = (u, total = 10) => {
    if (u < 0 || u >= total) return 0;
    const fast = u > total - 2;
    const f = fast ? 6 : 1;
    return (u * f) % 1 < (fast ? 0.5 : 0.35) ? 1 : 0;
  };

  MV.instax = X;
})();
