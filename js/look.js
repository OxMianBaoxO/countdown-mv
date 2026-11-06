// 胶片后期与调色：颗粒、漏光、暗角、褪色的黑、整体冷暖与饱和度；光圈叶片；全片色板
(() => {
  const { W, H, TAU, clamp, lerp, hash, noise1, rng, css, mix } = MV;
  const D = MV.draw;

  // ---------- 色板 ----------
  MV.C = {
    cream: '#f6eedf', paper: '#fbf7ee', ink: '#2b2638', inkSoft: '#4a4458',
    coral: '#e8735a', tomato: '#d9534a', mustard: '#e9b949', butter: '#f5d27a', peach: '#f2b8a0',
    sage: '#a9c2a5', teal: '#4e8c8f', tealDeep: '#2f5f66', mint: '#9fd8c7', mintDark: '#6fb4a3',
    navy: '#2e4a7d', navyDeep: '#1f2f52', camel: '#c49a6c', skin: '#f4d6c1', skinShade: '#e3b59d', blush: '#f19a8e',
    hair: '#1d1b24', hairHi: '#3b3747', white: '#fff8ec',
    night: '#1b2140', nightMid: '#26305a', amber: '#ffc27a', neon: '#ff8fa3', gold: '#ffd98a',
    cold: '#7f8ea3', coldDeep: '#4f5b70', sakura: '#f7c9d4', sakuraDeep: '#f09ab3', sakuraWhite: '#fff1f4', bark: '#4a3a3f',
    wood: '#c08a5b', woodDark: '#8f5f3b', wall: '#e9dcc6', wallShade: '#d8c7ad',
  };

  const film = {
    DEFAULT: { vignette: 0.42, grain: 0.055, warm: 0, sat: 1, fade: 0.05, leak: 0, leakSeed: 1 },
  };

  // 复用的离屏画布
  const scratchMap = new Map();
  film.scratch = (w, h, key = 'a') => {
    let c = scratchMap.get(key);
    if (!c || c.width !== w || c.height !== h) { c = D.makeCanvas(w, h); scratchMap.set(key, c); }
    return c;
  };

  let grainTile = null;
  function grain() {
    if (grainTile) return grainTile;
    grainTile = D.makeCanvas(256, 256);
    const g = grainTile.getContext('2d'), img = g.createImageData(256, 256), r = rng(4242);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (r() + r() + r() + r() - 2) * 105;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return grainTile;
  }

  // 后期：在画布像素坐标里做，base 把虚拟 1920×1080 映射到画布
  film.post = (ctx, t, base, L) => {
    const s = base[0], x0 = base[1], y0 = base[2], w = W * s, h = H * s;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
    // 去饱和：saturation 混合一层灰
    if (L.sat < 0.999) { ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = clamp(1 - L.sat); ctx.fillStyle = '#808080'; ctx.fillRect(x0, y0, w, h); }
    // 冷暖：柔光叠一层橙或蓝
    if (Math.abs(L.warm) > 0.003) {
      ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = clamp(Math.abs(L.warm));
      ctx.fillStyle = L.warm > 0 ? '#ffa65a' : '#5a7fd0'; ctx.fillRect(x0, y0, w, h);
    }
    if (L.tint) { ctx.globalCompositeOperation = L.tint[2] || 'soft-light'; ctx.globalAlpha = L.tint[1]; ctx.fillStyle = L.tint[0]; ctx.fillRect(x0, y0, w, h); }
    // 漏光：边缘几团暖光缓慢漂移
    if (L.leak > 0.003) {
      ctx.globalCompositeOperation = 'screen';
      const seed = L.leakSeed || 1;
      for (let i = 0; i < 3; i++) {
        const side = (hash(i, seed) * 4) | 0;
        const drift = noise1(t * 0.13 + i * 7 + seed) * 0.5 + 0.5;
        let lx, ly;
        if (side === 0) { lx = x0 + w * (0.1 + 0.8 * drift); ly = y0 - h * 0.08; }
        else if (side === 1) { lx = x0 + w * 1.06; ly = y0 + h * (0.1 + 0.8 * drift); }
        else if (side === 2) { lx = x0 + w * (0.1 + 0.8 * drift); ly = y0 + h * 1.08; }
        else { lx = x0 - w * 0.06; ly = y0 + h * (0.1 + 0.8 * drift); }
        const r = h * (0.45 + 0.35 * hash(i, seed + 3));
        const col = ['#ff7a3d', '#ff4f6d', '#ffc06a'][i % 3];
        const a = L.leak * (0.55 + 0.45 * Math.sin(t * 0.7 + i * 2.1 + seed));
        const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
        g.addColorStop(0, css(col, a)); g.addColorStop(0.5, css(col, a * 0.35)); g.addColorStop(1, css(col, 0));
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
      }
    }
    // 褪色的黑：胶片的黑不是死黑
    if (L.fade > 0.003) { ctx.globalCompositeOperation = 'lighten'; ctx.globalAlpha = 1; ctx.fillStyle = css(mix('#000000', '#3a3040', clamp(L.fade * 6))); ctx.fillRect(x0, y0, w, h); }
    // 暗角
    if (L.vignette > 0.003) {
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      const g = ctx.createRadialGradient(x0 + w / 2, y0 + h / 2, h * 0.32, x0 + w / 2, y0 + h / 2, Math.hypot(w, h) * 0.6);
      g.addColorStop(0, 'rgba(20,12,24,0)'); g.addColorStop(1, `rgba(20,12,24,${L.vignette})`);
      ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
    }
    // 颗粒（每秒 24 次换位）
    if (L.grain > 0.003) {
      const f = Math.floor(t * 24), ox = Math.floor(hash(f, 1) * 256), oy = Math.floor(hash(f, 2) * 256);
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = L.grain;
      ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(grain(), 'repeat'); ctx.fillRect(x0 + ox, y0 + oy, w, h);
    }
    ctx.restore();
  };

  // ---------- 光圈叶片 ----------
  // r：通光孔半径（0 = 全闭），R：外径；rot：叶片转角。坐标为调用时的当前坐标系
  film.aperture = (ctx, x, y, r, R, rot = 0, px = 1, o = {}) => {
    const { n = 7, color = '#17141d', edge = '#4b4558', alpha = 1 } = o;
    if (r >= R * 0.995) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    const v = [];
    for (let i = 0; i < n; i++) { const a = rot + (i / n) * TAU; v.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
    // 叶片底色（带孔）
    ctx.beginPath(); ctx.arc(x, y, R * 1.6, 0, TAU);
    if (r > 0.5) { ctx.moveTo(v[0][0], v[0][1]); for (let i = n - 1; i >= 0; i--) ctx.lineTo(v[i][0], v[i][1]); ctx.closePath(); }
    ctx.fillStyle = color; ctx.fill();
    // 每片叶子：沿孔的一条边往外延伸，明暗交替
    const L = R * 1.7;
    for (let i = 0; i < n; i++) {
      const a = v[i], b = v[(i + 1) % n];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      if (r <= 0.5) { const ang = rot + (i / n) * TAU + Math.PI / 2 + Math.PI / n; dx = Math.cos(ang); dy = Math.sin(ang); }
      const fx = b[0] + dx * L, fy = b[1] + dy * L;
      const c = v[(i + 2) % n]; let ex = c[0] - b[0], ey = c[1] - b[1]; const e = Math.hypot(ex, ey) || 1; ex /= e; ey /= e;
      if (r <= 0.5) { const ang = rot + ((i + 1) / n) * TAU + Math.PI / 2 + Math.PI / n; ex = Math.cos(ang); ey = Math.sin(ang); }
      const gx = c[0] + ex * L, gy = c[1] + ey * L;
      ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(fx, fy); ctx.lineTo(gx, gy); ctx.lineTo(c[0], c[1]); ctx.closePath();
      const g = ctx.createLinearGradient(b[0], b[1], (fx + gx) / 2, (fy + gy) / 2);
      g.addColorStop(0, i % 2 ? '#2a2532' : '#211d29'); g.addColorStop(1, '#0f0d13');
      ctx.fillStyle = g; ctx.fill();
      // 叶片边缘的一道高光
      ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(fx, fy);
      ctx.strokeStyle = css(edge, 0.9); ctx.lineWidth = 2.2 * px; ctx.stroke();
    }
    // 外圈镜筒
    ctx.beginPath(); ctx.arc(x, y, R * 1.6, 0, TAU); ctx.arc(x, y, R * 1.02, 0, TAU, true); ctx.fillStyle = color; ctx.fill();
    ctx.restore();
  };

  MV.film = film;
})();
