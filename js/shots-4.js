// 桥段 + 导歌三 + 副歌三 + 尾声：冷掉的咖啡与晚餐、删掉的话、灰照片、光轨里奔跑、斑马线；
// 自拍定时的十秒、满街花开、最后一张；一墙照片、拼成的手、白头、灰照片终于显影、新的一盒
(() => {
  const { W, H, TAU, clamp, lerp, ease, sstep, bar, beatTime, beatAt, css, mix, hash, pulse, fract, noise1 } = MV;
  const A = MV.art, F = MV.fx, X = MV.instax, D = MV.draw, S = MV.S;
  const P = S.plateShot, T = b => bar(b);
  const COLD = { warm: -0.16, sat: 0.6, vignette: 0.55, leak: 0, fade: 0.07 };

  // ---------- 桥段：别等 ----------
  P({ id: 'S38', name: '咖啡', at: 44.39, chapter: '桥段', img: 's38-coffee', tin: { type: 'fade', dur: 1.4 }, look: COLD,
    c0: { x: 0.5, y: 0.5, z: 1.06 }, c1: { x: 0.48, y: 0.5, z: 1.14 }, motes: { n: 20, a: 0.25, color: '#dfe8ff' }, seed: 47,
    under(ctx, s) {
      // 他那杯的热气越来越弱，断掉
      const k = 1 - sstep(s.t0 + 0.3, s.t1 - 0.2, s.t);
      for (let i = 0; i < 8; i++) { const ph = fract(s.t * 0.35 + i / 8); D.glow(ctx, 880 + Math.sin(ph * 7 + i) * 18, 560 - ph * 220, 30 + ph * 40, '#ffffff', 0.16 * (1 - ph) * k, 'screen'); }
    } });
  P({ id: 'S39', name: '晚餐', at: 45.37, chapter: '桥段', img: 's39-dinner', tin: { type: 'fade', dur: 1.2 }, look: COLD,
    c0: { x: 0.5, y: 0.5, z: 1.08 }, c1: { x: 0.52, y: 0.5, z: 1.16 }, motes: false, seed: 53,
    under(ctx, s) { const fl = 0.75 + 0.25 * noise1(s.t * 9); const k = 1 - 0.5 * sstep(s.t0, s.t1, s.t); D.glow(ctx, 960, 560, 260 * fl * k, '#ffb862', 0.35 * fl * k); } });
  P({ id: 'S40', name: '删掉', at: 46.38, chapter: '桥段', img: 's40-phone', tin: { type: 'fade', dur: 0.9 }, look: { warm: -0.1, sat: 0.72, vignette: 0.55, fade: 0.06 },
    c0: { x: 0.5, y: 0.42, z: 1.12 }, c1: { x: 0.5, y: 0.4, z: 1.22 }, motes: false, seed: 59,
    // 手机屏幕（图上是一块倾斜的白屏）：几条旧消息，输入框里一个个字长出来，又一个个删掉，发送键始终没按
    extra(ctx, s, c, m) {
      if (!m) return;
      const P0 = m.toScreen(605 / 1536, 160 / 1024), P1 = m.toScreen(840 / 1536, 140 / 1024), P2 = m.toScreen(690 / 1536, 665 / 1024);
      ctx.save();
      ctx.transform((P1[0] - P0[0]) / 100, (P1[1] - P0[1]) / 100, (P2[0] - P0[0]) / 210, (P2[1] - P0[1]) / 210, P0[0], P0[1]);
      const rr = (x, y, w, h, r, col) => { ctx.fillStyle = col; ctx.beginPath(); X.rr(ctx, x, y, w, h, Math.max(0.01, r)); ctx.fill(); };
      rr(0, 0, 100, 22, 0, 'rgba(238,240,245,0.95)');
      ctx.fillStyle = '#c9cfdb'; ctx.beginPath(); ctx.arc(14, 12, 6, 0, TAU); ctx.fill(); rr(24, 9, 30, 6, 3, '#c9cfdb');
      rr(8, 34, 52, 14, 7, '#e9ebf0'); rr(8, 52, 38, 14, 7, '#e9ebf0'); rr(44, 74, 48, 14, 7, '#9cc0ff'); rr(8, 96, 44, 14, 7, '#e9ebf0');
      // 输入框
      rr(6, 182, 74, 18, 9, '#eef0f4'); ctx.fillStyle = '#7aa6ff'; ctx.beginPath(); ctx.arc(89, 191, 8, 0, TAU); ctx.fill();
      const u = sstep(s.t0 + 0.05, s.t0 + 0.95, s.t), v = sstep(s.t0 + 1.15, s.t1 - 0.05, s.t);
      const n = Math.round(Math.max(0, u - v) * 9);
      ctx.fillStyle = '#5a6070';
      for (let i = 0; i < n; i++) rr(11 + i * 7, 187, 5, 8, 1.5, '#5a6070');
      if (Math.floor(s.t * 3) % 2 === 0) { ctx.fillStyle = '#3d7bff'; ctx.fillRect(11 + n * 7, 185, 1.2, 12); }
      ctx.restore();
    } });
  P({ id: 'S41', name: '午夜', at: 47.03, chapter: '桥段', img: 's41-asleep', tin: { type: 'fade', dur: 1.2 }, look: COLD,
    c0: { x: 0.5, y: 0.5, z: 1.04 }, c1: { x: 0.5, y: 0.52, z: 1.12 }, motes: false, seed: 61,
    beams: [{ x: 1700, y: -60, ang: 2.3, w: 300, len: 1500, a: 0.1 }], beamColor: '#cfdcff' });
  // 梦泡：她头顶浮起一个圆，里面是铅笔线勾出来的铁塔和屋顶，然后“啪”地碎了
  MV.shot({
    id: 'S42', name: '梦', at: 48.34, chapter: '桥段', tin: { type: 'fade', dur: 0.8 }, look: COLD,
    draw(ctx, s) {
      const t = s.t;
      A.plate(ctx, 's41-asleep', A.move(t, s.t0, s.t1, { x: 0.5, y: 0.52, z: 1.12 }, { x: 0.5, y: 0.5, z: 1.18 }));
      if (s.clean) return;
      const grow = ease.outBack(sstep(s.t0 + 0.05, s.t0 + 0.7, t)), pop = sstep(T(49.15), T(49.3), t);
      const r = 230 * grow * (1 + pop * 0.3), cx = 1220, cy = 250;
      for (let k = 0; k < 3; k++) { const q = sstep(s.t0 + k * 0.12, s.t0 + 0.3 + k * 0.12, t) * (1 - pop); if (q > 0) { ctx.fillStyle = css('#ffffff', 0.55 * q); ctx.beginPath(); ctx.arc(860 + k * 95, 420 - k * 55, (9 + k * 7) * q, 0, TAU); ctx.fill(); } }
      if (r > 2 && pop < 1) {
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
        ctx.globalAlpha = 1 - pop;
        A.draw(ctx, 's07-paris-dream', cx - r * 1.05, cy - r * 1.05, r * 2.1, r * 2.1, { fx: 0.72, fy: 0.6 });
        ctx.restore();
        ctx.strokeStyle = css('#ffffff', 0.7 * (1 - pop)); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
        D.glow(ctx, cx - r * 0.45, cy - r * 0.45, r * 0.3, '#ffffff', 0.4 * (1 - pop));
      }
      F.graphite(ctx, pop > 0 ? sstep(T(49.15), T(49.36), t) : 0, { region: [cx - 320, cy - 320, 640, 640], n: 160, seed: 71 });
    },
  });
  // 灰照片：对着空椅子按下快门，相纸吐出来，一直灰着
  MV.shot({
    id: 'S43', name: '灰照片', at: 49.36, chapter: '桥段', tin: { type: 'cut' }, look: Object.assign({}, COLD, { sat: 0.45 }),
    draw(ctx, s) {
      const t = s.t, ts = S.shotTime(8);
      A.plate(ctx, 's43-empty-chair', A.move(t, s.t0, s.t1, { x: 0.5, y: 0.5, z: 1.12 }, { x: 0.5, y: 0.5, z: 1.06 }));
      if (s.clean) return;
      S.vf(ctx, t, { a: 1 - sstep(ts + 0.2, ts + 0.6, t) });
      S.flash(ctx, t, ts, 0.55);
      const u = ease.outCubic(sstep(ts + 0.25, ts + 1.0, t));
      if (u > 0) { ctx.fillStyle = css('#101018', 0.4 * u); ctx.fillRect(0, 0, W, H); S.photo(ctx, 'p01-laugh', W / 2, lerp(1250, 560, u), 380, -0.03, { dev: sstep(ts + 0.4, s.t1, t), gray: true }); }
      if (t > ts - 0.2) { ctx.save(); ctx.translate(1720, 150); X.flip(ctx, 0, 0, 110, 2, 1, clamp((t - ts) / 0.35), { alpha: sstep(ts - 0.2, ts, t) * (1 - sstep(s.t1 - 0.3, s.t1, t)) }); ctx.restore(); }
    },
  });
  // 光轨：她跑过夜里的街
  const trailPaths = (() => { const out = []; for (let i = 0; i < 9; i++) { const y0 = 640 + i * 34, pts = []; for (let k = 0; k <= 40; k++) { const u = k / 40; pts.push([lerp(-300, W + 300, u), y0 + Math.sin(u * 5 + i) * 40 * (1 + i * 0.1) - u * 120]); } out.push(pts); } return out; })();
  P({ id: 'S44', name: '光轨', at: 50.35, chapter: '桥段', img: 's44-run', keys: S.alternate(['s44-run', 'k44-stride'], 50.2, 51.7, 0.125, 'cut'), tin: { type: 'whip', dur: 0.7, dir: 1 }, look: { warm: 0.02, sat: 0.85, vignette: 0.5, leak: 0.1, leakSeed: 84 },
    c0: { x: 0.42, y: 0.5, z: 1.15, r: 0.02 }, c1: { x: 0.58, y: 0.5, z: 1.22, r: -0.02 }, motes: false, seed: 67, push: 0.02,
    under(ctx, s) { F.trails(ctx, s.t, trailPaths, { speed: 0.9 }); } });
  P({ id: 'S45', name: '斑马线', at: 51.55, chapter: '桥段', img: 's45-crosswalk', keys: [['s45-crosswalk', 51.4], ['k45-near', 51.86, 'fade', 0.9]], tin: { type: 'whip', dur: 0.5, dir: 1 }, look: { warm: 0.04, sat: 0.9, vignette: 0.5, leak: 0.12, leakSeed: 88 },
    c0: { x: 0.5, y: 0.5, z: 1.05 }, c1: { x: 0.5, y: 0.5, z: 1.3 }, ease: ease.inQuad, motes: false, seed: 71 });

  // ---------- 导歌三：自拍定时（红灯从第 52.6 小节闪到第 56 小节，正好十秒） ----------
  const timer0 = T(52.6);
  const led = t => X.selfTimer(t - timer0, T(56) - timer0);
  P({ id: 'S46', name: '定时', at: 52.11, chapter: '导歌三', img: 's46-mailbox', tin: { type: 'fade', dur: 0.9 }, look: { warm: 0.06, vignette: 0.55, leak: 0.1, leakSeed: 92 },
    c0: { x: 0.45, y: 0.55, z: 1.25 }, c1: { x: 0.45, y: 0.55, z: 1.15 }, motes: false, seed: 73,
    extra(ctx, s, c, m) { const l = led(s.t); if (l && m) { const [x, y] = m.toScreen(0.244, 0.505); D.glow(ctx, x, y, 70, '#ff4a3a', 0.95); D.glow(ctx, x, y, 16, '#fff0e8', 0.9); } } });
  P({ id: 'S47', name: '跑回去', at: 53.37, chapter: '导歌三', img: 's46-mailbox', keys: [['s46-mailbox', 0], ['s47-run-back', 52, 'cut']], tin: { type: 'fade', dur: 1.0 }, look: { warm: 0.08, vignette: 0.55, leak: 0.14, leakSeed: 96 },
    c0: { x: 0.6, y: 0.45, z: 1.3 }, c1: { x: 0.62, y: 0.42, z: 1.55 }, motes: false, seed: 79,
    extra(ctx, s, c, m) {
      const l = led(s.t);
      if (l && m && !A.has('s47-run-back')) { const [lx, ly] = m.toScreen(0.244, 0.505); D.glow(ctx, lx, ly, 80, '#ff4a3a', 0.9); }
      if (l) { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = css('#ff6a5a', 0.06); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
      // 花苞随着红灯亮一下
      for (let i = 0; i < 40; i++) { const x = 900 + hash(i, 3) * 900, y = 60 + hash(i, 5) * 380; D.glow(ctx, x, y, 14 + hash(i, 7) * 12, '#ffc6d6', (l ? 0.55 : 0.15) * (0.5 + 0.5 * hash(i, 9))); }
    } });
  MV.shot({
    id: 'S48', name: '最后一秒', at: 55, chapter: '导歌三', tin: { type: 'fade', dur: 0.8 },
    look: { warm: 0.04, vignette: 0.65, leak: 0.08 },
    draw(ctx, s) {
      const t = s.t, l = led(t);
      const m = A.plate(ctx, 's46-mailbox', A.move(t, s.t0, s.t1, { x: 0.45, y: 0.55, z: 1.15 }, { x: 0.38, y: 0.52, z: 1.6 }, ease.inCubic), { dim: 0.25 });
      if (s.clean || !m) return;
      if (l) { const [lx, ly] = m.toScreen(0.244, 0.505); D.glow(ctx, lx, ly, 120, '#ff4a3a', 1); D.glow(ctx, lx, ly, 22, '#fff0e8', 0.95); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = css('#ff5a4a', 0.08); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
      // 花苞轻轻发抖
      for (let i = 0; i < 60; i++) { const x = 700 + hash(i, 13) * 1200 + Math.sin(t * 30 + i) * 2, y = 40 + hash(i, 15) * 420; D.glow(ctx, x, y, 12 + hash(i, 17) * 14, '#ffc6d6', 0.25 + 0.35 * sstep(s.t0, s.t1, t)); }
    },
  });

  // ---------- 副歌三：花开 ----------
  const petalBurst = (ctx, t, t0, o = {}) => {
    const d = t - t0; if (d < 0) return;
    const { n = 160, seed = 101, cx = W / 2, cy = H / 2 } = o;
    for (let i = 0; i < n; i++) {
      const a = hash(i, seed) * TAU, sp = 300 + hash(i, seed + 1) * 1400, k = (1 - Math.exp(-d * 1.8)) / 1.8;
      const x = cx + Math.cos(a) * sp * k + Math.sin(d * 1.3 + i) * 40, y = cy + Math.sin(a) * sp * k + d * d * 40 + d * 50;
      D.petal(ctx, x, y, 9 + hash(i, seed + 2) * 10, d * (1 + hash(i, seed + 3) * 3) + i, Math.sin(d * 3 + i), ['#ffd6e0', '#f7b8c8', '#fff1f4'][i % 3], 1 - sstep(4, 6, d));
    }
  };
  const WARM = { warm: 0.1, leak: 0.25, vignette: 0.42 };
  MV.shot({
    id: 'S49', name: '最后一张', at: 56, chapter: '副歌三', tin: { type: 'cut' }, look: Object.assign({ leakSeed: 100 }, WARM),
    draw(ctx, s) {
      const t = s.t, ts = S.shotTime(9);
      A.plate(ctx, 's49-bloom', A.move(t, s.t0, s.t1, { x: 0.5, y: 0.5, z: 1.25 }, { x: 0.5, y: 0.5, z: 1.1 }, ease.outCubic));
      petalBurst(ctx, t, ts);
      if (s.clean) return;
      S.flash(ctx, t, ts, 1);
      S.bigCount(ctx, t, ts + 0.1, 1, 0, { x: 1480, y: 300, size: 230, life: s.t1 - ts });
    },
  });
  MV.shot({
    id: 'S50', name: '显影', at: 56.36, chapter: '副歌三', tin: { type: 'fade', dur: 0.8 }, look: Object.assign({ leakSeed: 104 }, WARM),
    draw(ctx, s) {
      const t = s.t;
      A.plate(ctx, 's49-bloom', { x: 0.5, y: 0.5, z: 1.15 }, { soft: 12, dim: 0.1 });
      D.petals(ctx, t, { n: 50, seed: 7, size: 11, wind: 60, fall: 70 });
      const u = ease.inOutCubic(sstep(s.t0 + 0.4, s.t1 + 0.1, t));
      S.photo(ctx, 'p10-last', W / 2, lerp(560, 640, u), lerp(470, 2400, u), lerp(-0.04, 0, u), { dev: sstep(s.t0 - 0.2, s.t0 + 1.2, t), sheen: sstep(s.t0, s.t0 + 1.4, t) });
    },
  });
  P({ id: 'S51', fg: 'petals', punch: 0.015, name: '花下', at: 57.39, chapter: '副歌三', img: 's51-bloom-hug', tin: { type: 'fade', dur: 1.0 }, look: Object.assign({ leakSeed: 108 }, WARM),
    c0: { x: 0.5, y: 0.5, z: 1.05 }, c1: { x: 0.5, y: 0.48, z: 1.14 }, seed: 83,
    under(ctx, s) { D.petals(ctx, s.t, { n: 60, seed: 11, size: 10, wind: 50, fall: 60 }); } });
  // 花瓣悬停：时间停住，镜头绕着他们转
  MV.shot({
    id: 'S52', name: '悬停', at: 58.39, chapter: '副歌三', tin: { type: 'fade', dur: 0.8 }, look: Object.assign({ leakSeed: 112 }, WARM),
    draw(ctx, s) {
      const t = s.t, u = sstep(s.t0, s.t1, t);
      A.plate(ctx, 's51-bloom-hug', { x: 0.5, y: 0.47, z: 1.14 + u * 0.08, r: lerp(-0.02, 0.03, u) });
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(lerp(-0.04, 0.06, u)); ctx.scale(1 + u * 0.15, 1 + u * 0.15); ctx.translate(-W / 2, -H / 2);
      D.petals(ctx, T(58.3), { n: 70, seed: 11, size: 12, wind: 50, fall: 60 });
      ctx.restore();
    },
  });
  P({ id: 'S53', fg: 'petals', punch: 0.015, name: '心跳', at: 59.36, chapter: '副歌三', img: 's51-bloom-hug', keys: [['s51-bloom-hug', 0], ['s53-chest', 58, 'cut']], tin: { type: 'cut' }, look: Object.assign({ leakSeed: 116 }, WARM),
    c0: { x: 0.5, y: 0.45, z: 1.3 }, c1: { x: 0.5, y: 0.45, z: 1.4 }, push: 0.02, seed: 89,
    under(ctx, s) { const k = pulse(s.t, 6); D.glow(ctx, 960, 480, 300 + 120 * k, '#ffd0dc', 0.18 + 0.3 * k); D.petals(ctx, s.t, { n: 60, seed: 13, size: 11 + k * 3, wind: 40, fall: 50 }); } });
  P({ id: 'S54', fg: 'petals', name: '天亮', at: 60.36, chapter: '副歌三', img: 's57-curb', tin: { type: 'fade', dur: 1.2 }, look: Object.assign({ leakSeed: 120 }, WARM),
    c0: { x: 0.5, y: 0.5, z: 1.15 }, c1: { x: 0.5, y: 0.48, z: 1.06 }, seed: 97,
    beams: [{ x: 1900, y: 200, ang: 2.75, w: 360, len: 2000, a: 0.2 }],
    under(ctx, s) { D.petals(ctx, s.t, { n: 40, seed: 17, size: 10 }); } });
  P({ id: 'S55', fg: 'petals', punch: 0.015, name: '太阳雨', at: 61.37, chapter: '副歌三', img: 's55-sunshower', tin: { type: 'fade', dur: 1.0 }, look: Object.assign({ leakSeed: 124 }, WARM),
    c0: { x: 0.5, y: 0.5, z: 1.06 }, c1: { x: 0.5, y: 0.47, z: 1.14 }, seed: 101,
    under(ctx, s) { D.rain(ctx, s.t, { n: 160, alpha: 0.3, angle: 0.08, len: 40, color: '#fff6e8' }); D.petals(ctx, s.t, { n: 60, seed: 19, size: 10 }); } });
  P({ id: 'S56', fg: 'petals', punch: 0.015, name: '又哭又笑', at: 62.42, chapter: '副歌三', img: 's55-sunshower', keys: [['s55-sunshower', 0], ['s56-lift', 61, 'cut']], tin: { type: 'fade', dur: 0.8 }, look: Object.assign({ leakSeed: 128 }, WARM),
    c0: { x: 0.5, y: 0.55, z: 1.3, r: -0.03 }, c1: { x: 0.5, y: 0.52, z: 1.45, r: 0.04 }, seed: 103,
    under(ctx, s) { D.rain(ctx, s.t, { n: 120, alpha: 0.25, angle: 0.08, len: 40, color: '#fff6e8' }); D.petals(ctx, s.t, { n: 70, seed: 23, size: 12, wind: 140 }); } });
  // 路边：照片的白边从四周合拢——回到这张照片外面
  MV.shot({
    id: 'S57', name: '路边', at: 63.4, chapter: '副歌三', tin: { type: 'fade', dur: 1.0 }, look: Object.assign({ leakSeed: 132 }, WARM),
    draw(ctx, s) {
      const t = s.t, u = ease.inOutCubic(sstep(s.t0 + 0.2, T(64.3), t));
      const w = lerp(W * 1.6, 560, u);
      // 先画照片外面的屋子（照片墙那面墙），再画越来越小的照片
      A.plate(ctx, 's04-frames', { x: 0.5, y: 0.45, z: 1.1 }, { alpha: u });
      S.photo(ctx, A.has('s57-curb') ? 's57-curb' : 'p10-last', W / 2, lerp(H / 2 + 140, 560, u), w, lerp(0, -0.04, u), { dev: 1, fy: 0.5, shadow: u > 0.3 });
    },
  });

  // ---------- 尾声 ----------
  const PHOTOS = ['p01-laugh', 'p02-selfie', 'p03-sunrise', 'p04-mugs', 'p05-funny', 'p07-fireworks', 'p08-her', 'p10-last', 'e01-paris', 'e02-restaurant', 'e03-wedding', 'e04-middle', 'e05-old-reading'];
  // 墙上五个空相框（在 s04-frames 上的位置，0..1）
  const FRAMES = [[264, 227, 424, 457], [472, 227, 633, 457], [687, 227, 850, 457], [901, 227, 1066, 457], [1116, 227, 1280, 457]].map(r => [r[0] / 1536, r[1] / 1024, r[2] / 1536, r[3] / 1024]);
  const IN_FRAMES = ['p01-laugh', 'p02-selfie', 'p10-last', 'p08-her', 'GRAY']; // 中间那张是最后一张
  const ON_STRING = ['p03-sunrise', 'p04-mugs', 'STARS', 'p05-funny', 'p07-fireworks'];
  const drawCard = (ctx, id, x, y, w, rot, o = {}) => {
    if (id === 'STARS') X.photo(ctx, x, y, w, rot, Object.assign({ draw: (g, pw, ph) => { A.draw(g, 's26-rooftop-night', 0, 0, pw, ph, { fx: 0.6, fy: 0.2 }); g.save(); g.scale(pw / 460, ph / 620); F.starTrails(g, 240, 120, 2.2, { n: 120, rmax: 600 }); g.restore(); } }, o));
    else if (id === 'GRAY') {
      const k = o.grayK ?? 0.92;
      X.photo(ctx, x, y, w, rot, Object.assign({ draw: (g, pw, ph) => {
        A.draw(g, 'p11-old-table', 0, 0, pw, ph, { fy: 0.4 });
        g.fillStyle = css('#a4a8b2', k); g.fillRect(0, 0, pw, ph);
        if (k > 0.05) { g.globalCompositeOperation = 'color'; g.fillStyle = css('#a8b4cc', k * 0.6); g.fillRect(0, 0, pw, ph); g.globalCompositeOperation = 'source-over'; }
      } }, o));
    }
    else S.photo(ctx, id, x, y, w, rot, o);
  };
  // 一根绳子，夹着几张照片
  const stringPhotos = (ctx, t, t0, ids, o = {}) => {
    const y0 = o.y ?? 470, sag = o.sag ?? 34, xa = o.xa ?? 330, xb = o.xb ?? W - 330, cw = o.w ?? 128;
    ctx.save(); ctx.strokeStyle = 'rgba(110,80,58,0.9)'; ctx.lineWidth = 2.2; ctx.beginPath();
    for (let k = 0; k <= 40; k++) { const u = k / 40, x = lerp(xa - 60, xb + 60, u), y = y0 + Math.sin(u * Math.PI) * sag; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
    ids.forEach((id, i) => {
      const u = (i + 0.5) / ids.length, x = lerp(xa, xb, u), ys = y0 + Math.sin(((x - xa + 60) / (xb - xa + 120)) * Math.PI) * sag;
      const a = sstep(t0 + i * 0.18, t0 + i * 0.18 + 0.3, t); if (a <= 0) return;
      const rot = Math.sin(t * 1.2 + i) * 0.03 + (hash(i, 3) - 0.5) * 0.1;
      const ch = cw * 86 / 54;
      drawCard(ctx, id, x, ys + ch / 2 + 6 + (1 - a) * 24, cw, rot, { alpha: a });
      ctx.fillStyle = '#c8a27a'; ctx.fillRect(x - 5, ys - 6 + (1 - a) * 24, 10, 22);
    });
  };
  // 相框里的照片：卡片缩在相框的白卡纸里
  const framePhotos = (ctx, m, t, t0, o = {}) => {
    FRAMES.forEach((r, i) => {
      const [x0, y0] = m.toScreen(r[0], r[1]), [x1, y1] = m.toScreen(r[2], r[3]);
      const fw = x1 - x0, fh = y1 - y0, cw = Math.min(fw * 0.74, fh * 0.8 * 54 / 86);
      let cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = cw, rot = 0, a = 1;
      if (i === 2 && o.arrive) {
        // 上一镜结尾那张照片（画面中间、宽 560）直接飞进中间的相框
        const k = ease.inOutCubic(sstep(t0 - 0.05, t0 + 0.7, t));
        cx = lerp(W / 2, cx, k); cy = lerp(560, cy, k); w = lerp(560, cw, k); rot = lerp(-0.04, 0, k);
      } else {
        const order = [3, 1, 0, 2, 4][i];
        a = sstep(t0 + 0.5 + order * 0.25, t0 + 0.75 + order * 0.25, t);
        if (a <= 0) return;
        cy += (1 - ease.outBack(a)) * -30;
      }
      drawCard(ctx, IN_FRAMES[i], cx, cy, w, rot, { alpha: a, shadow: false, grayK: o.grayK, sheen: i === 4 ? o.sheen || 0 : 0 });
    });
  };
  MV.shot({
    id: 'S58', name: '填满', at: 64, chapter: '尾声', tin: { type: 'cut' }, look: { warm: 0.1, leak: 0.18, leakSeed: 140, vignette: 0.45 },
    draw(ctx, s) {
      const t = s.t;
      const m = A.plate(ctx, 's04-frames', A.move(t, s.t0, s.t1, { x: 0.5, y: 0.45, z: 1.1 }, { x: 0.5, y: 0.42, z: 1.02 }));
      F.beams(ctx, t, [{ x: -60, y: -60, ang: 0.6, w: 280, len: 1800, a: 0.12 }]);
      if (!m) return;
      framePhotos(ctx, m, t, s.t0, { arrive: true });
      stringPhotos(ctx, t, s.t0 + 1.6, ON_STRING, { y: 520 });
    },
  });
  // 一年又一年：照片从相框和绳子上漫出来，铺满墙
  const SCATTER = Array.from({ length: 90 }, (_, i) => {
    const u = 0.05 + hash(i, 31) * 0.9, v = 0.08 + hash(i, 37) * 0.6;
    // 让开五个相框（各留一点边），相框里的照片和那张灰照片一直看得见
    const skip = FRAMES.some(r => u > r[0] - 0.035 && u < r[2] + 0.035 && v > r[1] - 0.06 && v < r[3] + 0.05);
    return { u, v, rot: (hash(i, 41) - 0.5) * 0.4, w: 88 + hash(i, 43) * 40, id: PHOTOS[i % PHOTOS.length], skip };
  });
  const wallScatter = (ctx, m, n, popAge) => {
    for (let i = 0; i < Math.min(n, SCATTER.length); i++) {
      const p = SCATTER[i]; if (p.skip) continue;
      const [x, y] = m.toScreen(p.u, p.v), age = popAge ? popAge(i) : 9, pop = 1 + 0.2 * Math.exp(-age * 4) * Math.sin(age * 12);
      ctx.save(); ctx.translate(x, y); ctx.scale(pop, pop);
      S.photo(ctx, p.id, 0, 0, p.w * m.sc, p.rot, { shadow: false });
      ctx.restore();
    }
  };
  MV.shot({
    id: 'S59', name: '一年又一年', at: 66, chapter: '尾声', tin: { type: 'fade', dur: 1.0 }, look: { warm: 0.1, leak: 0.2, leakSeed: 144, vignette: 0.45 },
    draw(ctx, s) {
      const t = s.t, u = sstep(s.t0, s.t1, t);
      const m = A.plate(ctx, 's04-frames', { x: 0.5, y: 0.42, z: lerp(1.02, 1.0, u) });
      if (!m) return;
      // 灰照片也在一年年里慢慢浮出一点影子
      framePhotos(ctx, m, t, -100, { grayK: lerp(0.92, 0.66, u) }); stringPhotos(ctx, t, -100, ON_STRING, { y: 520 });
      const b = (beatAt(t) - beatAt(s.t0)) * 4;
      wallScatter(ctx, m, Math.floor(b), i => b - i);
    },
  });
  // 拼图：几百张照片拼成一幅大图——两只握在一起的手。开场前预先拼好一张 3840×2160 的大图
  let mosaicCanvas = null;
  const buildMosaic = () => {
    if (mosaicCanvas) return mosaicCanvas;
    const im = A.img('e06-hands'); if (!im) return null;
    const cols = 40, rows = 22, Wc = 3840, Hc = 2160;
    const sm = D.makeCanvas(cols, rows), sg = sm.getContext('2d');
    sg.drawImage(im, 0, im.naturalHeight * 0.0625, im.naturalWidth, im.naturalHeight * 0.875, 0, 0, cols, rows);
    const d = sg.getImageData(0, 0, cols, rows).data;
    const c = D.makeCanvas(Wc, Hc), g = c.getContext('2d');
    g.fillStyle = '#efe4d2'; g.fillRect(0, 0, Wc, Hc);
    const pool = [...PHOTOS, 's14-hug', 's20-sunrise', 's21-rain', 's22-mugs', 's27-rooftop-dawn', 's31-fireworks', 's37-snow-profile', 's51-bloom-hug', 's55-sunshower', 's18-dance'].filter(id => A.has(id));
    const cw = Wc / cols, ch = Hc / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = (j * cols + i) * 4, col = `rgb(${d[k]},${d[k + 1]},${d[k + 2]})`, x = i * cw, y = j * ch;
      A.draw(g, pool[Math.floor(hash(i * 131 + j * 17, 7) * pool.length)], x + 3, y + 3, cw - 6, ch - 6, { fy: 0.35 });
      g.globalCompositeOperation = 'color'; g.globalAlpha = 0.8; g.fillStyle = col; g.fillRect(x, y, cw, ch);
      g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.65; g.fillRect(x, y, cw, ch);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    }
    return (mosaicCanvas = c);
  };
  const prep = MV.prepare;
  MV.prepare = async () => { await prep(); buildMosaic(); };
  MV.shot({
    id: 'S60', name: '拼图', at: 68, chapter: '尾声', tin: { type: 'fade', dur: 1.2 }, look: { warm: 0.08, leak: 0.18, leakSeed: 148, vignette: 0.4 },
    draw(ctx, s) {
      const t = s.t, M = buildMosaic();
      ctx.fillStyle = '#efe4d2'; ctx.fillRect(0, 0, W, H);
      if (!M) return;
      const u = ease.inOutCubic(sstep(s.t0, s.t1 - 0.8, t));
      const z = lerp(3.4, 1.0, u), sw = M.width / z, sh = M.height / z;
      ctx.drawImage(M, (M.width - sw) / 2, (M.height - sh) * 0.45, sw, sh, 0, 0, W, H);
      // 最后几拍：大图本身慢慢透出来
      ctx.globalAlpha = 0.5 * sstep(s.t1 - 1.8, s.t1, t); A.plate(ctx, 'e06-hands', { x: 0.5, y: 0.5, z: 1.0 }); ctx.globalAlpha = 1;
    },
  });
  P({ id: 'S61', name: '白头', at: 70, chapter: '尾声', img: 's61-old-couple', keys: [['s61-old-couple', 69.6], ['k61-selfie', 70.85, 'fade', 1.2]], tin: { type: 'fade', dur: 1.4 }, look: { warm: 0.1, leak: 0.18, leakSeed: 152, vignette: 0.45 },
    c0: { x: 0.5, y: 0.5, z: 1.15 }, c1: { x: 0.5, y: 0.47, z: 1.05 }, seed: 107,
    beams: [{ x: -60, y: -60, ang: 0.6, w: 280, len: 1800, a: 0.12 }],
    extra(ctx, s, c, m) { const l = X.selfTimer(s.t - T(70.6), T(72) - T(70.6)); if (l && m && (s.t < T(70.6) || !A.has('k61-selfie'))) { const [x, y] = m.toScreen(0.418, 0.545); D.glow(ctx, x, y, 46, '#ff4a3a', 0.85); D.glow(ctx, x, y, 10, '#fff0e8', 0.9); } S.flash(ctx, s.t, T(72) - 0.02, 0.7); } });
  // 那张灰照片终于慢慢显出影来：空椅子上坐着他，对面坐着她（白发的两个人）
  MV.shot({
    id: 'S62', name: '灰照片显影', at: 72, chapter: '尾声', tin: { type: 'flash', dur: 1.4 }, look: { warm: 0.12, leak: 0.15, leakSeed: 156, vignette: 0.5 },
    draw(ctx, s) {
      const t = s.t;
      const push = ease.inOutCubic(sstep(s.t0 + 0.2, T(74.2), t));
      const cam = { x: lerp(0.5, 0.78, push), y: lerp(0.42, 0.334, push), z: lerp(1.02, 3.0, push) * (1 + 0.04 * sstep(T(74.2), T(76.5), t)) };
      const m = A.plate(ctx, 's04-frames', cam);
      if (!m) return;
      A.plate(ctx, 's04-frames', cam, { soft: 8, alpha: push * 0.9 });                       // 推近后背景虚掉
      wallScatter(ctx, m, 90);
      stringPhotos(ctx, t, -100, ON_STRING, { y: m.toScreen(0.5, 0.405)[1], w: 128 * m.sc / 1.275, xa: m.toScreen(0.178, 0)[0], xb: m.toScreen(0.822, 0)[0], sag: 34 * m.sc / 1.275 });
      const dev = ease.inOutSine(sstep(T(73.4), T(75.6), t));
      framePhotos(ctx, m, t, -100, { grayK: lerp(0.66, 0, dev), sheen: sstep(T(75.4), T(76.3), t) });
      // 显影时相框周围泛起一点暖光
      const [fx, fy] = m.toScreen(0.78, 0.334);
      D.glow(ctx, fx, fy, 260 * m.sc / 1.275 * 0.5, '#ffd9a8', 0.25 * dev);
      D.petals(ctx, t * 0.5, { n: 24, seed: 29, size: 10, wind: 30, fall: 30 });
    },
  });
  MV.shot({
    id: 'S63', name: '新的一盒', at: 76, chapter: '片尾', tin: { type: 'fade', dur: 1.6 }, look: { warm: 0.06, leak: 0.1, leakSeed: 160, vignette: 0.6 },
    draw(ctx, s) {
      const t = s.t;
      A.plate(ctx, 's02-load', A.move(t, s.t0, s.t0 + 6, { x: 0.52, y: 0.44, z: 1.22 }, { x: 0.52, y: 0.46, z: 1.3 }), { dim: 0.15 });
      F.motes(ctx, t, { n: 30, seed: 163, a: 0.5 });
      if (!s.clean) S.bigCount(ctx, t, T(76.6), 0, 10, { x: W / 2, y: 470, size: 260, life: 6 });
      const L = MV.app && MV.app.lyrics;
      if (L && L.title && !s.clean) {
        const a = sstep(T(77.2), T(77.8), t);
        ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.fillStyle = '#fff6e8'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 20;
        ctx.font = '700 64px "Noto Serif SC", serif'; ctx.fillText(L.title.song, W / 2, 760);
        ctx.font = '400 26px "Noto Sans SC", sans-serif'; ctx.fillText(L.title.artist, W / 2, 810);
        ctx.restore();
      }
      ctx.fillStyle = css('#000000', sstep(T(77.8), MV.audioData.duration - 0.2, t)); ctx.fillRect(0, 0, W, H);
    },
  });
})();
// 歌词版式：副歌字大一点；尾声放到画面偏下的中间、字距拉开
(() => {
  const st = MV.LYRIC_STYLE = MV.LYRIC_STYLE || {};
  for (const i of [11, 12, 13, 14, 15, 16, 17, 18, 19, 30, 31, 32, 33, 34, 35, 36, 37, 38]) st[i] = { size: 52 };
  for (let i = 49; i <= 57; i++) st[i] = { size: 54 };
  for (let i = 58; i <= 62; i++) st[i] = { size: 56, spacing: 0.3, y: 940, backdrop: 0.5 };
})();
