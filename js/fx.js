// 叠在插画上的动态效果：光束、尘埃、虚化光斑、梦境显形（水彩晕开 + 铅笔线）、铅笔灰、星轨、光轨、白色涂鸦、呼气白雾
(() => {
  const { W, H, TAU, clamp, lerp, ease, sstep, hash, noise1, noise2, css, mix, fract } = MV;
  const D = MV.draw;
  const F = {};

  // ---------- 光 ----------
  // 窗外斜射进来的光束：beams = [{x, y, ang, w, len, a}]（屏幕坐标），缓慢呼吸
  F.beams = (ctx, t, beams, color = '#ffe2a8', k = 1) => {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    beams.forEach((b, i) => {
      const a = (b.a ?? 0.18) * k * (0.75 + 0.25 * Math.sin(t * 0.6 + i * 1.7));
      if (a <= 0.003) return;
      const dx = Math.cos(b.ang), dy = Math.sin(b.ang), nx = -dy, ny = dx, w0 = b.w * 0.5, w1 = b.w * (b.spread ?? 1.6) * 0.5;
      const g = ctx.createLinearGradient(b.x, b.y, b.x + dx * b.len, b.y + dy * b.len);
      g.addColorStop(0, css(color, a)); g.addColorStop(0.6, css(color, a * 0.5)); g.addColorStop(1, css(color, 0));
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(b.x + nx * w0, b.y + ny * w0); ctx.lineTo(b.x - nx * w0, b.y - ny * w0);
      ctx.lineTo(b.x + dx * b.len - nx * w1, b.y + dy * b.len - ny * w1); ctx.lineTo(b.x + dx * b.len + nx * w1, b.y + dy * b.len + ny * w1);
      ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  };
  // 光里飘的尘埃（发光的小点，确定性运动）
  F.motes = (ctx, t, o = {}) => {
    const { n = 70, seed = 3, region = [0, 0, W, H], color = '#fff1cf', a = 0.8, size = 1, drift = 10 } = o;
    const [rx, ry, rw, rh] = region;
    const dot = D.dotSprite(color), pa = ctx.globalAlpha;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < n; i++) {
      const z = 0.3 + 0.7 * hash(i, seed + 1);
      const x = rx + fract(hash(i, seed) + noise1(t * 0.07 + i * 3.1) * 0.06 + t * drift * (hash(i, seed + 4) - 0.4) / rw) * rw;
      const y = ry + fract(hash(i, seed + 2) - t * drift * 0.35 * z / rh + noise1(t * 0.05 + i * 1.7) * 0.05) * rh;
      const tw = 0.45 + 0.55 * Math.sin(t * (0.8 + hash(i, seed + 5) * 1.6) + i);
      const r = size * (1.2 + 3.2 * z * z);
      ctx.globalAlpha = pa * a * tw * z;
      ctx.drawImage(dot, x - r, y - r, r * 2, r * 2);
      if (z > 0.85) D.glow(ctx, x, y, r * 5, color, a * tw * 0.35, 'screen');
    }
    ctx.restore();
  };
  // 虚化光斑（夜景、跨年夜）
  F.bokeh = (ctx, t, o = {}) => {
    const { n = 26, seed = 7, region = [0, 0, W, H], colors = ['#ffc27a', '#ff9f8a', '#ffe6a8'], a = 0.35, r0 = 18, r1 = 70, drift = 6 } = o;
    const [rx, ry, rw, rh] = region;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < n; i++) {
      const x = rx + fract(hash(i, seed) + t * drift * (hash(i, seed + 3) - 0.5) / rw) * rw, y = ry + hash(i, seed + 1) * rh + Math.sin(t * 0.4 + i) * 6;
      const r = lerp(r0, r1, hash(i, seed + 2) ** 1.5);
      const c = colors[i % colors.length], al = a * (0.5 + 0.5 * Math.sin(t * 0.9 + i * 2.3));
      const g = ctx.createRadialGradient(x, y, r * 0.55, x, y, r);
      g.addColorStop(0, css(c, al * 0.55)); g.addColorStop(0.88, css(c, al * 0.7)); g.addColorStop(1, css(c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  };

  // ---------- 梦境显形 ----------
  // 水彩一样一团团晕开的遮罩：u 0→1 从没有到全覆盖。clip 可选 [x,y,w,h]
  const maskC = () => MV.film.scratch(960, 540, 'mask');
  function blobMask(u, seed, focus) {
    const m = maskC(), g = m.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 960, 540);
    if (u <= 0) return m;
    const n = 26, [fx, fy] = focus || [0.5, 0.5];
    for (let i = 0; i < n; i++) {
      const d = hash(i, seed);                       // 离焦点越远越晚开
      const cx = (fx + (hash(i, seed + 1) - 0.5) * 1.1 * Math.sqrt(d)) * 960, cy = (fy + (hash(i, seed + 2) - 0.5) * 1.0 * Math.sqrt(d)) * 540;
      const start = d * 0.55, k = clamp((u - start) / 0.45);
      if (k <= 0) continue;
      const r = (90 + 260 * hash(i, seed + 3)) * ease.outCubic(k) * (0.6 + 0.8 * u);
      const gr = g.createRadialGradient(cx, cy, r * 0.25, cx, cy, r);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
    }
    if (u > 0.85) { g.fillStyle = `rgba(255,255,255,${(u - 0.85) / 0.15})`; g.fillRect(0, 0, 960, 540); }
    return m;
  }
  // 把 drawB（梦里的画面）用晕开的遮罩叠到当前画面上
  F.dreamOver = (ctx, u, drawB, o = {}) => {
    if (u <= 0.001) return;
    const buf = MV.film.scratch(W, H, 'dream'), b = buf.getContext('2d');
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1; b.clearRect(0, 0, W, H);
    drawB(b);
    if (u < 0.999) {
      b.globalCompositeOperation = 'destination-in';
      b.drawImage(blobMask(u, o.seed || 5, o.focus), 0, 0, W, H);
      b.globalCompositeOperation = 'source-over';
    }
    ctx.save();
    if (o.clip) { const [x, y, w, h] = o.clip; ctx.beginPath(); MV.instax.rr(ctx, x, y, w, h, o.radius ?? 18); ctx.clip(); }
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.drawImage(buf, 0, 0);
    ctx.restore();
  };
  // 晕开的边缘上跑动的铅笔线：几条歪歪扭扭的短线随 u 出现又淡去
  F.pencil = (ctx, u, o = {}) => {
    const { n = 18, seed = 9, region = [0, 0, W, H], color = '#fdf6ea', a = 0.75 } = o;
    if (u <= 0.02 || u >= 0.98) return;
    const [rx, ry, rw, rh] = region;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      const s0 = hash(i, seed) * 0.7, life = clamp((u - s0) / 0.3);
      if (life <= 0 || life >= 1) continue;
      const x = rx + hash(i, seed + 1) * rw, y = ry + hash(i, seed + 2) * rh;
      const len = 60 + 140 * hash(i, seed + 3), ang = hash(i, seed + 4) * TAU;
      const draw = ease.outCubic(clamp(life * 2)), fade = 1 - sstep(0.55, 1, life);
      ctx.strokeStyle = css(color, a * fade); ctx.lineWidth = 1.4 + hash(i, seed + 5) * 1.4;
      ctx.beginPath();
      const steps = 14;
      for (let k = 0; k <= steps * draw; k++) {
        const v = k / steps, px = x + Math.cos(ang) * len * v + Math.sin(v * 9 + i) * 4, py = y + Math.sin(ang) * len * v + Math.cos(v * 7 + i) * 4;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  };
  // 梦散的时候：铅笔灰往上飘
  F.graphite = (ctx, u, o = {}) => {
    const { n = 120, seed = 21, region = [0, 0, W, H], color = '#e8e2f0' } = o;
    if (u <= 0 || u >= 1) return;
    const [rx, ry, rw, rh] = region, dot = D.dotSprite(color);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x0 = rx + hash(i, seed) * rw, y0 = ry + hash(i, seed + 1) * rh;
      const k = clamp((u - hash(i, seed + 2) * 0.4) / 0.6);
      if (k <= 0) continue;
      const x = x0 + (hash(i, seed + 3) - 0.3) * 120 * k, y = y0 - 160 * k * (0.5 + hash(i, seed + 4));
      const r = 1.2 + 2.4 * hash(i, seed + 5);
      ctx.globalAlpha = (1 - k) * 0.8; ctx.drawImage(dot, x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  };

  // ---------- 夜里的光 ----------
  // 星轨：以 (cx, cy) 为极点的同心弧，长度随曝光时间 u 增长
  F.starTrails = (ctx, cx, cy, u, o = {}) => {
    const { n = 180, seed = 31, rmax = 1500, a = 0.85 } = o;
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const r = 40 + Math.pow(hash(i, seed), 0.8) * rmax, a0 = hash(i, seed + 1) * TAU, len = u * (0.5 + 0.9 * hash(i, seed + 2));
      const br = Math.pow(hash(i, seed + 3), 2.2);
      const col = mix('#cfe0ff', '#ffe2c4', hash(i, seed + 4));
      ctx.strokeStyle = css(col, a * (0.25 + 0.75 * br)); ctx.lineWidth = 0.8 + 1.8 * br;
      ctx.beginPath(); ctx.arc(cx, cy, r, a0, a0 + Math.max(0.002, len)); ctx.stroke();
    }
    ctx.restore();
  };
  // 车灯光轨：沿着给定的曲线流动的发光长条
  F.trails = (ctx, t, paths, o = {}) => {
    const { colors = ['#ff9a4a', '#ff5a4a', '#ffd08a'], a = 0.85, speed = 0.6 } = o;
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.lineCap = 'round';
    paths.forEach((pts, i) => {
      const c = colors[i % colors.length];
      const head = fract(t * speed * (0.7 + hash(i, 5) * 0.6) + hash(i, 6));
      const f0 = clamp(head - 0.55), f1 = head;
      ctx.strokeStyle = css(c, a * 0.25); ctx.lineWidth = 16; ctx.beginPath(); D.strokePart(ctx, pts, f0, f1); ctx.stroke();
      ctx.strokeStyle = css(c, a); ctx.lineWidth = 3.2; ctx.beginPath(); D.strokePart(ctx, pts, f0, f1); ctx.stroke();
      ctx.strokeStyle = css('#ffffff', a * 0.7); ctx.lineWidth = 1.2; ctx.beginPath(); D.strokePart(ctx, pts, f0, f1); ctx.stroke();
    });
    ctx.restore();
  };
  // 冷空气里呼出的白雾：tt 为呼气开始后的秒数
  F.breath = (ctx, x, y, tt, o = {}) => {
    const { dir = 1, scale = 1, a = 0.5 } = o;
    if (tt < 0 || tt > 2.2) return;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let k = 0; k < 6; k++) {
      const s = tt - k * 0.06; if (s < 0) continue;
      const u = s / 2.2, px = x + dir * (30 + 140 * ease.outCubic(u)) * scale + Math.sin(s * 3 + k) * 8, py = y - (10 + 60 * u) * scale + k * 4;
      D.glow(ctx, px, py, (30 + 90 * u) * scale, '#f2f6ff', a * (1 - u) * (1 - k / 7), 'screen');
    }
    ctx.restore();
  };

  // ---------- 白色涂鸦笔 ----------
  // strokes：[[ [x,y], [x,y]… ], …]（相对 rect 的 0..1 坐标）；u 0..1 依次画出来
  F.doodle = (ctx, rect, strokes, u, o = {}) => {
    const { color = '#ffffff', w = 4, wobble = 1.2, t = 0 } = o;
    const [x0, y0, rw, rh] = rect;
    const total = strokes.reduce((s, st) => s + st.length - 1, 0);
    let budget = u * total;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 2;
    strokes.forEach((st, si) => {
      if (budget <= 0) return;
      ctx.beginPath();
      for (let k = 0; k < st.length; k++) {
        const jit = (q, s2) => noise2(q * 3 + si, t * 2 + s2) * wobble;
        const px = x0 + st[k][0] * rw + jit(k, 0), py = y0 + st[k][1] * rh + jit(k, 5);
        if (k === 0) { ctx.moveTo(px, py); continue; }
        const need = 1;
        if (budget >= need) { ctx.lineTo(px, py); budget -= need; }
        else { const a = st[k - 1]; ctx.lineTo(x0 + lerp(a[0], st[k][0], budget) * rw, y0 + lerp(a[1], st[k][1], budget) * rh); budget = 0; break; }
      }
      ctx.stroke();
    });
    ctx.restore();
  };

  MV.fx = F;
})();
