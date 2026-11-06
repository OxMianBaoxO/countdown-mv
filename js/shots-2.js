// 副歌一：第一张、被抱住的自拍、显影、贴在心口、捂热、乱跳的舞、白色涂鸦
(() => {
  const { W, H, TAU, clamp, lerp, ease, sstep, bar, css, mix, hash, pulse, fract } = MV;
  const A = MV.art, F = MV.fx, X = MV.instax, D = MV.draw, S = MV.S;
  const T = b => bar(b);

  // 羽毛：白色的小椭圆，飘、转（闭式运动）
  const feathers = (ctx, t, t0, o = {}) => {
    const { n = 60, seed = 61, a = 0.9 } = o;
    const d = t - t0; if (d < 0) return;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const sx = 760 + (hash(i, seed) - 0.5) * 300, sy = 520 + (hash(i, seed + 1) - 0.5) * 160;
      const vx = (hash(i, seed + 2) - 0.5) * 900, vy = -300 - hash(i, seed + 3) * 500;
      const k = 1 - Math.exp(-d * 2.2);
      const x = sx + vx * k / 2.2 + Math.sin(d * 2 + i) * 30, y = sy + vy * k / 2.2 + d * d * 30 + d * 60;
      const r = 7 + hash(i, seed + 4) * 9, rot = d * (1 + hash(i, seed + 5) * 2) + i;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.sin(d * 3 + i)));
      ctx.globalAlpha = a * (1 - sstep(3.5, 5, d));
      ctx.fillStyle = '#fffdf8'; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.8, r * 0.55, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(220,210,200,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-r * 1.8, 0); ctx.lineTo(r * 1.8, 0); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  };

  // ---------- S13 第一张 [16–17.4] ----------
  MV.shot({
    id: 'S13', name: '第一张', at: 16, chapter: '副歌一', tin: { type: 'cut' },
    look: { warm: 0.08, leak: 0.25, leakSeed: 13, vignette: 0.45 },
    draw(ctx, s) {
      const t = s.t, ts = S.shotTime(0);
      // 闪光那一下画面定格：底图停在按下时的位置，然后压暗
      A.plate(ctx, 's12-turn-smile', { x: 0.5, y: 0.42, z: 1.16 });
      if (s.clean) return;
      const dim = sstep(ts + 0.1, ts + 0.6, t);
      ctx.fillStyle = css('#1b1320', 0.45 * dim); ctx.fillRect(0, 0, W, H);
      // 取景框那一块“揭”下来变成一张照片：从框的大小缩成手上的大小，一边转一边显影
      const fr = X.FRAME, u = ease.inOutCubic(sstep(ts + 0.08, ts + 0.95, t));
      const w0 = fr[2] * 54 / 46, w1 = 430;
      const cx = lerp(fr[0] + fr[2] / 2, 760, u), cy = lerp(fr[1] + fr[3] / 2 + 60, 560, u);
      const dev = sstep(ts + 0.2, T(17.3), t);
      S.photo(ctx, 'p01-laugh', cx, cy, lerp(w0, w1, u), lerp(0, -0.09, u) + Math.sin(t * 1.3) * 0.01 * u, { dev, sheen: sstep(ts + 0.6, ts + 1.6, t), alpha: sstep(ts, ts + 0.06, t) });
      S.bigCount(ctx, t, ts + 0.1, 10, 9, { x: 1400, y: 470, size: 230, life: T(17.38) - ts });
      S.flash(ctx, t, ts, 1);
      F.motes(ctx, t, { n: 30, seed: 67, a: 0.5 * dim });
    },
  });

  // ---------- S14 被抱住 [17.4–18.4] ----------
  MV.shot({
    id: 'S14', name: '被抱住', at: 17.38, chapter: '副歌一', tin: { type: 'whip', dur: 0.6, dir: 1 },
    look: { warm: 0.08, leak: 0.22, leakSeed: 17, vignette: 0.4 },
    draw(ctx, s) {
      const t = s.t, ts = S.shotTime(1);
      const wob = Math.sin(t * 7) * 0.004 + (t < ts ? 0 : Math.exp(-(t - ts) * 8) * 0.01);
      // 她一个人举着相机自拍，他忽然从后面一把抱上来
      S.keyPlate(ctx, t, [['k14-alone', 17], ['s14-hug', 17.44, 'smear', 0.4]], A.move(t, s.t0, s.t1, { x: 0.5, y: 0.48, z: 1.1 * S.beatPush(t), r: -0.02 + wob }, { x: 0.5, y: 0.45, z: 1.2 * S.beatPush(t), r: 0.015 + wob }));
      F.motes(ctx, t, { n: 30, seed: 71, a: 0.5 });
      if (s.clean) return;
      S.flash(ctx, t, ts, 0.95);
      // 角落的小计数翻到 8
      if (t > ts - 0.2) { ctx.save(); ctx.translate(1720, 150); X.flip(ctx, 0, 0, 110, 9, 8, clamp((t - ts) / 0.35), { alpha: sstep(ts - 0.2, ts, t) * (1 - sstep(s.t1 - 0.3, s.t1, t)) }); ctx.restore(); }
    },
  });

  // ---------- S15 显影 [18.4–19.4] ----------
  MV.shot({
    id: 'S15', name: '显影', at: 18.41, chapter: '副歌一', tin: { type: 'fade', dur: 1.0 },
    look: { warm: 0.1, leak: 0.18, leakSeed: 19, vignette: 0.5 },
    draw(ctx, s) {
      const t = s.t;
      // 背景：沙发上的暖光，虚化
      A.plate(ctx, 's16-chest', { x: 0.5, y: 0.5, z: 1.3 }, { soft: 12, dim: 0.15 });
      const u = ease.inOutCubic(sstep(s.t0 + 0.5, s.t1 + 0.2, t));
      const w = lerp(520, 2300, u), dev = sstep(s.t0 - 0.4, s.t0 + 1.4, t);
      S.photo(ctx, 'p02-selfie', W / 2 + lerp(0, 0, u), H / 2 + lerp(20, 180, u), w, lerp(0.05, 0, u), { dev, sheen: sstep(s.t0, s.t0 + 1.5, t) });
      F.motes(ctx, t, { n: 30, seed: 73, a: 0.6 });
    },
  });

  // ---------- S16 贴在心口 [19.4–20.4] ----------
  MV.shot({
    id: 'S16', name: '贴在心口', at: 19.38, chapter: '副歌一', tin: { type: 'fade', dur: 1.0 },
    look: { warm: 0.1, leak: 0.2, leakSeed: 23, vignette: 0.45 },
    draw(ctx, s) {
      const t = s.t, beat = pulse(t, 8);
      S.kb(ctx, 's16-chest', t, s.t0, s.t1, { x: 0.46, y: 0.45, z: 1.12 * (1 + beat * 0.012) }, { x: 0.46, y: 0.42, z: 1.22 * (1 + beat * 0.012) });
      F.beams(ctx, t, [{ x: -80, y: -60, ang: 0.62, w: 260, len: 1700, a: 0.13 }]);
      F.motes(ctx, t, { n: 45, seed: 79, a: 0.6 });
      if (s.clean) return;
      D.glow(ctx, 860, 700, 240 + beat * 60, '#ffd7a8', 0.22 + beat * 0.25);
    },
  });

  // ---------- S17 捂热 [20.4–21.4] ----------
  MV.shot({
    id: 'S17', name: '捂热', at: 20.38, chapter: '副歌一', tin: { type: 'fade', dur: 1.0 },
    look: { warm: 0.14, leak: 0.2, leakSeed: 29, vignette: 0.5 },
    draw(ctx, s) {
      const t = s.t, beat = pulse(t, 6);
      S.kb(ctx, 's17-hands-warm', t, s.t0, s.t1, { x: 0.5, y: 0.5, z: 1.08 }, { x: 0.5, y: 0.5, z: 1.2 });
      if (s.clean) return;
      const k = sstep(s.t0, s.t1, t);
      D.glow(ctx, 960, 560, 320 + beat * 80, '#ffcf8a', 0.25 + 0.3 * k + beat * 0.2);
      F.motes(ctx, t, { n: 40, seed: 83, a: 0.7, color: '#ffe3b5', region: [600, 300, 720, 520] });
    },
  });

  // ---------- S18 乱跳的舞 [21.4–22.4] ----------
  MV.shot({
    id: 'S18', name: '跳舞', at: 21.38, chapter: '副歌一', tin: { type: 'whip', dur: 0.6, dir: -1 },
    look: { warm: 0.08, leak: 0.25, leakSeed: 31, vignette: 0.4 },
    draw(ctx, s) {
      const t = s.t, beat = pulse(t, 7);
      const sway = Math.sin(t * 2.2) * 0.012;
      // 每拍换一个舞姿
      S.keyPlate(ctx, t, S.alternate(['s18-dance', 'k18-spin'], 21.38, 22.6, 0.25, 'smear', 0.35), A.move(t, s.t0, s.t1, { x: 0.48, y: 0.5, z: 1.06 + beat * 0.02, r: sway }, { x: 0.52, y: 0.48, z: 1.14 + beat * 0.02, r: -sway }));
      F.beams(ctx, t, [{ x: -60, y: -60, ang: 0.6, w: 280, len: 1800, a: 0.12 }]);
      if (s.clean) return;
      feathers(ctx, t, s.t0 - 0.4, { n: 70 });
    },
  });

  // ---------- S19 白色涂鸦 [22.4–24.2] ----------
  // 他的照片上画白头发、皱纹、拐杖；她的照片上也被画了一头白发
  // 涂鸦坐标：相对照片画面（0..1）。他的照片：头发轮廓上描一层白发、眼角的皱纹、白胡子、右下角一根拐杖
  const HAIR_HIM = [
    [[0.4, 0.215], [0.44, 0.155], [0.5, 0.135], [0.56, 0.125], [0.62, 0.13], [0.68, 0.15], [0.74, 0.19], [0.785, 0.235]],
    [[0.42, 0.245], [0.46, 0.17], [0.5, 0.225], [0.55, 0.15], [0.6, 0.215], [0.65, 0.16], [0.7, 0.225], [0.755, 0.19]],
    [[0.44, 0.262], [0.41, 0.255]], [[0.44, 0.282], [0.41, 0.288]], [[0.705, 0.262], [0.735, 0.255]], [[0.705, 0.282], [0.735, 0.29]],
    [[0.49, 0.326], [0.52, 0.314], [0.545, 0.322], [0.57, 0.314], [0.6, 0.326]],
    [[0.885, 0.95], [0.885, 0.63], [0.9, 0.595], [0.93, 0.6], [0.94, 0.625]],
  ];
  // 她的照片（自拍里她在左边）：一头白发
  const HAIR_HER = [
    [[0.06, 0.4], [0.12, 0.31], [0.2, 0.272], [0.3, 0.255], [0.4, 0.265], [0.47, 0.29], [0.52, 0.335]],
    [[0.08, 0.445], [0.12, 0.35], [0.17, 0.42], [0.22, 0.31], [0.27, 0.4], [0.32, 0.3], [0.37, 0.39], [0.43, 0.31], [0.48, 0.38]],
    [[0.05, 0.5], [0.06, 0.43]], [[0.53, 0.42], [0.54, 0.36]],
  ];
  MV.shot({
    id: 'S19', name: '白色涂鸦', at: 22.42, chapter: '副歌一', tin: { type: 'fade', dur: 1.0 },
    look: { warm: 0.08, leak: 0.15, leakSeed: 37, vignette: 0.45 },
    draw(ctx, s) {
      const t = s.t, t0 = s.t0;
      const zoom = ease.inOutCubic(sstep(t0 + 0.6, T(23.1), t));
      const cam19 = A.move(t, t0, T(23.2), { x: 0.48, y: 0.5, z: 1.08 }, { x: 0.5, y: 0.6, z: 1.5 });
      A.plate(ctx, 's19-couch-doodle', cam19);
      if (zoom > 0.5) A.plate(ctx, 's19-couch-doodle', cam19, { soft: 12, alpha: clamp((zoom - 0.5) * 2) });
      if (s.clean) return;
      // 两张照片落在画面上，依次被画
      const show = sstep(T(22.9), T(23.25), t);
      const k1 = sstep(T(23.1), T(23.75), t), k2 = sstep(T(23.55), T(24.05), t);
      const shine = sstep(T(23.72), T(23.98), t);
      if (show > 0) {
        ctx.fillStyle = css('#1b1320', 0.35 * show); ctx.fillRect(0, 0, W, H);
        const p1 = [700, 540 + (1 - show) * 60], p2 = [1230, 520 + (1 - show) * 80];
        S.photo(ctx, 'p01-laugh', p1[0], p1[1], 420, -0.08, { dev: 1, alpha: show, doodle: (g, iw, ih) => F.doodle(g, [0, -0.0449 * ih, iw, 1.112 * ih], HAIR_HIM, k1, { w: 0.9, t, wobble: 0.15 }) });
        S.photo(ctx, 'p02-selfie', p2[0], p2[1], 420, 0.07, { dev: 1, alpha: show, doodle: (g, iw, ih) => F.doodle(g, [0, -0.0449 * ih, iw, 1.112 * ih], HAIR_HER, k2, { w: 0.9, t, wobble: 0.15 }) });
      }
      // 白线越来越亮，铺满画面
      if (shine > 0) { ctx.fillStyle = css('#ffffff', ease.inCubic(shine)); ctx.fillRect(0, 0, W, H); }
    },
  });

  MV.CHAPTERS = [{ at: 4, name: '主歌一' }, { at: 16, name: '副歌一' }, { at: 24, name: '主歌二' }, { at: 36, name: '副歌二' }, { at: 56, name: '副歌三' }];
})();
