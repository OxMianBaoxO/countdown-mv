// 主歌二 + 导歌二 + 副歌二：日出、雨、两个杯子、便利贴、眼睛、鬼脸、星轨、黎明；跨年夜倒数、零点烟花、吻、雪
(() => {
  const { W, H, TAU, clamp, lerp, ease, sstep, bar, beatTime, beatAt, css, mix, hash, pulse, fract } = MV;
  const A = MV.art, F = MV.fx, X = MV.instax, D = MV.draw, S = MV.S;
  const T = b => bar(b);

  // 通用的插画镜头：底图慢推 + 可选的光束/尘埃/取景框/快门
  S.plateShot = def => MV.shot(Object.assign({}, def, {
    draw(ctx, s) {
      const t = s.t, c = A.move(t, s.t0 - (def.lead ?? 0.4), s.t1 + (def.tail ?? 0.4), def.c0 || {}, def.c1 || def.c0 || {}, def.ease);
      if (def.push) c.z = (c.z ?? 1) * S.beatPush(t, def.push);
      if (def.punch) c.z = (c.z ?? 1) * S.downPunch(t, def.punch);
      if (def.hand) { const h = S.hand(t, def.hand); c.dx = h.dx; c.dy = h.dy; c.r = (c.r || 0) + h.r; }
      const m = def.keys ? S.keyPlate(ctx, t, def.keys, c, def.plateOpt || {}) : A.plate(ctx, def.img, c, def.plateOpt || {});
      if (def.beams) F.beams(ctx, t, def.beams, def.beamColor);
      if (def.motes !== false) F.motes(ctx, t, Object.assign({ n: 35, seed: (def.seed || 1) * 7, a: 0.5 }, def.motes || {}));
      if (def.under) def.under(ctx, s, c, m);
      // 前景：比主体更近、更虚的一层，跟着镜头走得更快
      if (def.fg === 'bokeh') F.bokeh(ctx, t, { n: 7, seed: (def.seed || 1) * 3 + 5, region: [-140, -100, W + 280, H + 200], r0: 90, r1: 180, a: 0.15, drift: 16 });
      else if (def.fg === 'snow') D.snow(ctx, t, { n: 14, seed: 77 + (def.seed || 0), alpha: 0.5, depth: [0.92, 1], speed: 1.5, wind: 40 });
      else if (def.fg === 'petals') { ctx.save(); ctx.globalAlpha = 0.42; D.petals(ctx, t, { n: 9, seed: (def.seed || 1) * 5 + 3, size: 28, wind: 240, fall: 130, colors: ['#ffd6e0', '#fff1f4'] }); ctx.restore(); }
      if (s.clean) return;
      if (def.extra) def.extra(ctx, s, c, m);
      if (def.vf) S.vf(ctx, t, typeof def.vf === 'function' ? def.vf(s) : {});
      if (def.shot != null) {
        const ts = S.shotTime(def.shot), [, n] = S.SHOTS[def.shot];
        S.flash(ctx, t, ts, def.flashK ?? 0.85);
        if (t > ts - 0.2 && t < s.t1) { ctx.save(); ctx.translate(def.flipAt ? def.flipAt[0] : 1720, def.flipAt ? def.flipAt[1] : 150); X.flip(ctx, 0, 0, def.flipSize || 110, n + 1, n, clamp((t - ts) / 0.35), { alpha: sstep(ts - 0.2, ts, t) * (1 - sstep(s.t1 - 0.3, s.t1, t)) }); ctx.restore(); }
      }
    },
  }));
  const P = S.plateShot;

  // ---------- 主歌二 ----------
  MV.shot({
    id: 'S20', name: '日出', at: 24.0, chapter: '主歌二', tin: { type: 'dip', color: '#000000', dur: 1.0, center: 0.2 },
    look: { warm: 0.1, leak: 0.22, leakSeed: 41, vignette: 0.5 },
    draw(ctx, s) {
      const t = s.t, ts = S.shotTime(2);
      A.plate(ctx, 's20-sunrise', A.move(t, s.t0, s.t1, { x: 0.5, y: 0.55, z: 1.18 }, { x: 0.5, y: 0.5, z: 1.06 }));
      const dawn = sstep(T(24.12), T(24.75), t);
      D.glow(ctx, 960, 640, 520 * (0.4 + dawn), '#ffcf7a', 0.35 * dawn);
      ctx.fillStyle = css('#05040a', 0.97 * (1 - dawn)); ctx.fillRect(0, 0, W, H);
      if (s.clean) return;
      // 黑暗里只剩相机上的一点红灯
      const led = (1 - dawn) * (0.6 + 0.4 * Math.sin(t * 5));
      if (led > 0.01) { ctx.fillStyle = css('#ff5a4f', led); ctx.beginPath(); ctx.arc(1240, 720, 5, 0, TAU); ctx.fill(); D.glow(ctx, 1240, 720, 60, '#ff4a3a', led * 0.7); }
      S.flash(ctx, t, ts, 0.5);
      if (t > ts - 0.2) { ctx.save(); ctx.translate(1720, 150); X.flip(ctx, 0, 0, 110, 8, 7, clamp((t - ts) / 0.35), { alpha: sstep(ts - 0.2, ts, t) * (1 - sstep(s.t1 - 0.3, s.t1, t)) }); ctx.restore(); }
    },
  });
  P({ id: 'S21', name: '雨', at: 25.12, chapter: '主歌二', img: 's21-rain', tin: { type: 'fade', dur: 1.0 }, look: { warm: -0.1, sat: 0.85, vignette: 0.5, leak: 0.05 },
    c0: { x: 0.5, y: 0.5, z: 1.08 }, c1: { x: 0.5, y: 0.47, z: 1.18 }, motes: false, seed: 3,
    under(ctx, s) { D.rain(ctx, s.t, { n: 260, alpha: 0.35, angle: 0.12, len: 46, color: '#dfe9ff' }); } });
  P({ id: 'S22', name: '两个杯子', at: 26.13, chapter: '主歌二', img: 's22-mugs', shot: 3, tin: { type: 'whip', dur: 0.6, dir: 1 }, look: { warm: 0.08, leak: 0.12, vignette: 0.42 },
    c0: { x: 0.5, y: 0.5, z: 1.1 }, c1: { x: 0.5, y: 0.48, z: 1.2 }, seed: 5,
    // 日复一日：每拍一道光从左扫到右
    under(ctx, s) {
      const b = beatAt(s.t), f = fract(b);
      F.beams(ctx, s.t, [{ x: lerp(-200, 1400, f), y: -100, ang: 1.1 - f * 0.5, w: 380, len: 1600, a: 0.18 * Math.sin(Math.PI * f) }]);
      for (let k = 0; k < 2; k++) { const x0 = [860, 1060][k]; for (let i = 0; i < 6; i++) { const ph = fract(s.t * 0.4 + i / 6 + k * 0.3); D.glow(ctx, x0 + Math.sin(ph * 6 + i) * 14, 470 - ph * 160, 26 + ph * 30, '#ffffff', 0.12 * (1 - ph), 'screen'); } }
    } });
  P({ id: 'S23', name: '便利贴', at: 27.05, chapter: '主歌二', img: 's23-mirror', tin: { type: 'fade', dur: 1.0 }, look: { warm: 0.05, leak: 0.08, vignette: 0.42 },
    c0: { x: 0.5, y: 0.45, z: 1.06 }, c1: { x: 0.5, y: 0.42, z: 1.12 }, seed: 7,
    // 每半拍贴上一张画着小心形的便利贴，一张压一张贴满镜面
    under(ctx, s) {
      const n = Math.floor((beatAt(s.t) - beatAt(s.t0)) * 2) + 1;
      const cols = ['#fbe7a1', '#f8c8c8', '#c8e6d4', '#cfe0f5', '#f6d4b0'];
      for (let i = 0; i < Math.min(n, 28); i++) {
        const age = (beatAt(s.t) - beatAt(s.t0)) * 2 - i;
        const pop = age < 0 ? 0 : 1 + 0.25 * Math.exp(-age * 5) * Math.sin(age * 16);
        const x = 620 + hash(i, 3) * 680, y = 230 + hash(i, 5) * 420, r = (hash(i, 7) - 0.5) * 0.5, sz = 92;
        ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(pop, pop);
        ctx.shadowColor = 'rgba(40,30,30,0.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
        ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-sz / 2, -sz / 2, sz, sz); ctx.shadowColor = 'transparent';
        ctx.fillStyle = css('#000000', 0.06); ctx.fillRect(-sz / 2, -sz / 2, sz, 14);
        ctx.fillStyle = '#e0566a'; ctx.beginPath(); ctx.moveTo(0, 20); ctx.bezierCurveTo(-34, -4, -16, -30, 0, -12); ctx.bezierCurveTo(16, -30, 34, -4, 0, 20); ctx.fill();
        ctx.restore();
      }
    } });
  P({ id: 'S24', name: '眼睛', at: 28.12, chapter: '主歌二', img: 's24-eye', tin: { type: 'fade', dur: 1.0 }, look: { warm: 0.06, leak: 0.1, vignette: 0.55 },
    c0: { x: 0.5, y: 0.5, z: 1.05 }, c1: { x: 0.5, y: 0.5, z: 1.35 }, ease: ease.inQuad, motes: { n: 20 }, seed: 9 });
  P({ id: 'S25', name: '看你', at: 29.12, chapter: '主歌二', img: 's25-funny', keys: [['k25-before', 29], ['s25-funny', 29.42, 'smear', 0.4]], hand: 0.8, shot: 4, tin: { type: 'shutter', dur: 1.0 }, look: { warm: 0.08, leak: 0.15, vignette: 0.45 },
    c0: { x: 0.5, y: 0.45, z: 1.15 }, c1: { x: 0.5, y: 0.43, z: 1.08 }, seed: 11,
    plateOpt: null, vf: s => ({ a: 1 - sstep(S.shotTime(4) + 0.3, S.shotTime(4) + 0.7, s.t), focus: sstep(s.t0, s.t0 + 0.6, s.t) }) });
  P({ id: 'S26', name: '星轨', at: 30.13, chapter: '主歌二', img: 's26-rooftop-night', shot: 5, flashK: 0.25, tin: { type: 'fade', dur: 1.2 }, look: { warm: -0.06, leak: 0.05, vignette: 0.5 },
    c0: { x: 0.5, y: 0.55, z: 1.15 }, c1: { x: 0.5, y: 0.45, z: 1.05 }, motes: false, seed: 13,
    under(ctx, s) { const u = sstep(s.t0, s.t1, s.t); F.starTrails(ctx, 1180, 160, 0.15 + u * 2.6, { n: 220, rmax: 1300, a: 0.75 }); } });
  P({ id: 'S27', name: '同一片天', at: 31.03, chapter: '主歌二', img: 's27-rooftop-dawn', tin: { type: 'fade', dur: 1.2 }, look: { warm: 0.12, leak: 0.18, leakSeed: 44, vignette: 0.45 },
    c0: { x: 0.5, y: 0.5, z: 1.05 }, c1: { x: 0.53, y: 0.48, z: 1.15 }, seed: 15,
    // 每一拍天色暖一分
    under(ctx, s) { const k = sstep(s.t0, s.t1, s.t); ctx.fillStyle = css('#ffb36b', 0.12 * k * (0.7 + 0.3 * pulse(s.t, 4))); ctx.globalCompositeOperation = 'soft-light'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; } });

  // ---------- 导歌二：跨年夜倒数（10 → 1 落在拍上，最后四拍在贴斯停的静默里） ----------
  const cdBeat = n => 144 - n; // 数到 n 的那一拍；0 是第 144 拍 = 第 36 小节重拍
  const countdown = (ctx, t, o = {}) => {
    const b = beatAt(t);
    for (let n = 10; n >= 1; n--) {
      const d = b - cdBeat(n); if (d < -0.1 || d > 1.0) continue;
      const a = sstep(-0.1, 0.05, d) * (1 - sstep(0.55, 1.0, d));
      const sc = (o.big ? 1.25 : 1) * (1 + 0.25 * Math.exp(-Math.max(0, d) * 6));
      const R = o.rect, x = R ? (R[0] + R[2]) / 2 : (o.x ?? W / 2), y = R ? (R[1] + R[3]) / 2 : (o.y ?? 330), size = R ? (R[3] - R[1]) * 0.78 : (o.size || 220);
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.globalAlpha = a;
      ctx.font = `700 ${size}px Bahnschrift, "Segoe UI", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255,190,110,0.8)'; ctx.shadowBlur = 40; ctx.fillStyle = '#fff4df'; ctx.fillText(String(n), 0, 0);
      ctx.restore();
    }
  };
  P({ id: 'S28', fg: 'bokeh', name: '人潮', at: 32.01, chapter: '导歌二', img: 's28-square', tin: { type: 'fade', dur: 1.4 }, look: { warm: 0.05, leak: 0.12, leakSeed: 48, vignette: 0.5 },
    c0: { x: 0.5, y: 0.5, z: 1.15 }, c1: { x: 0.5, y: 0.48, z: 1.05 }, motes: false, seed: 17,
    under(ctx, s) { F.bokeh(ctx, s.t, { n: 30, seed: 19, a: 0.3 }); D.snow(ctx, s.t, { n: 60, alpha: 0.4, speed: 0.6 }); countdown(ctx, s.t); } });
  P({ id: 'S29', fg: 'bokeh', name: '十九八', at: 33.38, chapter: '导歌二', img: 's29-breath', tin: { type: 'fade', dur: 1.0 }, look: { warm: 0.06, leak: 0.12, leakSeed: 52, vignette: 0.5 },
    c0: { x: 0.5, y: 0.5, z: 1.06 }, c1: { x: 0.5, y: 0.48, z: 1.16 }, motes: false, seed: 19,
    under(ctx, s) {
      F.bokeh(ctx, s.t, { n: 24, seed: 23, a: 0.3 });
      // 每拍呼出一口白气
      const b = beatAt(s.t), k = Math.floor(b);
      for (const kk of [k, k - 1, k - 2]) { const tt = s.t - beatTime(kk); F.breath(ctx, kk % 2 ? 720 : 1200, 520, tt, { dir: kk % 2 ? 1 : -1, a: 0.35 }); }
      countdown(ctx, s.t, { y: 200, size: 180 });
    } });
  MV.shot({
    id: 'S30', name: '三二一', at: 35, chapter: '导歌二', tin: { type: 'fade', dur: 0.8 },
    look: { warm: 0.02, leak: 0.06, vignette: 0.62 },
    draw(ctx, s) {
      const t = s.t;
      const m = A.plate(ctx, 's28-square', A.move(t, s.t0, s.t1, { x: 0.58, y: 0.3, z: 1.1 }, { x: 0.62, y: 0.24, z: 1.5 }, ease.inCubic), { dim: 0.38 });
      F.bokeh(ctx, t, { n: 20, seed: 29, a: 0.18, drift: 1 });
      if (s.clean || !m) return;
      const [x0, y0] = m.toScreen(0.4674, 0.0371), [x1, y1] = m.toScreen(0.817, 0.328);
      const fl = pulse(t, 5); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = css('#fff1d6', 0.25 + 0.35 * fl); ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.restore();
      countdown(ctx, t, { rect: [x0, y0, x1, y1] });
    },
  });

  // ---------- 副歌二：零点 ----------
  const bursts = (ctx, t, t0, list) => list.forEach((f, i) => D.firework(ctx, f[0], 1100, f[0] + (f[2] || 0), f[1], t - t0 - (f[3] || 0), { seed: i + 3, n: 70, r: f[4] || 240, colors: f[5] || ['#ffd98a', '#ff9f8a', '#fff4df'], rise: 0.5, life: 2.4 }));
  const FW = [[620, 260, 30, 0, 260], [1320, 220, -20, 0.15, 280, ['#ffb3c7', '#ffe8a8']], [960, 160, 0, 0.7, 320], [380, 330, 20, 1.2, 200, ['#bde6ff', '#fff4df']], [1560, 340, -30, 1.5, 220, ['#ffd98a', '#ff8fa3']]];
  P({ id: 'S31', fg: 'bokeh', name: '零点烟花', at: 36, chapter: '副歌二', img: 's31-fireworks', punch: 0.025, shot: 6, flashK: 0.8, tin: { type: 'cut' }, look: { warm: 0.06, leak: 0.25, leakSeed: 56, vignette: 0.45 },
    c0: { x: 0.5, y: 0.5, z: 1.1 }, c1: { x: 0.5, y: 0.46, z: 1.02 }, motes: false, seed: 23, push: 0.015,
    under(ctx, s) { bursts(ctx, s.t, T(35.8), FW); D.snow(ctx, s.t, { n: 50, alpha: 0.35, speed: 0.6 }); } });
  P({ id: 'S32', fg: 'bokeh', name: '烟花下的吻', at: 37.35, chapter: '副歌二', img: 's32-kiss', keys: [['k32-gaze', 37], ['s32-kiss', 37.44, 'fade', 0.7]], punch: 0.015, shot: 7, flashK: 0.75, tin: { type: 'fade', dur: 0.9 }, look: { warm: 0.08, leak: 0.25, leakSeed: 60, vignette: 0.5 },
    c0: { x: 0.5, y: 0.5, z: 1.15 }, c1: { x: 0.5, y: 0.5, z: 1.05 }, motes: false, seed: 29,
    under(ctx, s) { bursts(ctx, s.t, s.t0 - 0.3, [[500, 220, 20, 0, 230], [1450, 200, -10, 0.4, 260, ['#ffb3c7', '#ffe8a8']]]); D.snow(ctx, s.t, { n: 70, alpha: 0.4, speed: 0.6 }); },
    extra(ctx, s) {
      // 他拍下的她：照片从右下角滑进来显影
      const ts = S.shotTime(7), u = ease.outCubic(sstep(ts + 0.2, ts + 0.9, s.t));
      if (u > 0) S.photo(ctx, 'p08-her', lerp(2100, 1560, u), lerp(1300, 760, u), 300, 0.12 - u * 0.04, { dev: sstep(ts + 0.25, ts + 1.3, s.t) });
    } });
  // 凝住的烟花：火星停在空中，镜头从中间穿过去
  MV.shot({
    id: 'S33', name: '凝住的烟花', at: 38.41, chapter: '副歌二', tin: { type: 'fade', dur: 0.9 },
    look: { warm: 0.06, leak: 0.2, leakSeed: 64, vignette: 0.5 },
    draw(ctx, s) {
      const t = s.t, z = lerp(1.0, 1.6, ease.inOutSine(sstep(s.t0, s.t1, t)));
      A.plate(ctx, 's31-fireworks', { x: 0.5, y: 0.45, z: 1.05 * (1 + (z - 1) * 0.4) });
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
      const frozen = T(38.2) - T(35.8);
      bursts(ctx, T(35.8) + frozen, T(35.8), FW);
      ctx.restore();
    },
  });
  P({ id: 'S34', fg: 'bokeh', name: '心跳的城', at: 39.38, chapter: '副歌二', img: 's28-square', keys: [['s28-square', 0], ['s34-skyline', 38, 'cut']], punch: 0.02, tin: { type: 'fade', dur: 1.0 }, look: { warm: 0.06, leak: 0.18, leakSeed: 68, vignette: 0.5 },
    c0: { x: 0.5, y: 0.42, z: 1.08 }, c1: { x: 0.5, y: 0.42, z: 1.16 }, motes: false, seed: 31,
    under(ctx, s) { const k = pulse(s.t, 5); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = css('#ffb062', 0.16 * k); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; F.bokeh(ctx, s.t, { n: 30, seed: 33, a: 0.25 + 0.3 * k }); D.snow(ctx, s.t, { n: 70, alpha: 0.4, speed: 0.6 }); } });
  P({ id: 'S35', fg: 'snow', name: '口袋', at: 40.37, chapter: '副歌二', img: 's35-pocket', tin: { type: 'fade', dur: 1.0 }, look: { warm: 0.1, leak: 0.15, leakSeed: 72, vignette: 0.5 },
    c0: { x: 0.5, y: 0.5, z: 1.08 }, c1: { x: 0.5, y: 0.5, z: 1.18 }, motes: false, seed: 37,
    under(ctx, s) { D.snow(ctx, s.t, { n: 90, alpha: 0.5, speed: 0.5 }); } });
  P({ id: 'S36', fg: 'bokeh', name: '转圈', at: 41.37, chapter: '副歌二', img: 's29-breath', keys: [['s29-breath', 41], ['s36-spin', 41.37, 'cut']], punch: 0.02, tin: { type: 'whip', dur: 0.6, dir: 1 }, look: { warm: 0.08, leak: 0.2, leakSeed: 76, vignette: 0.45 },
    c0: { x: 0.5, y: 0.5, z: 1.2, r: -0.05 }, c1: { x: 0.5, y: 0.5, z: 1.25, r: 0.08 }, motes: false, seed: 41,
    under(ctx, s) { D.snow(ctx, s.t, { n: 110, alpha: 0.5, speed: 0.8, wind: 60 }); F.bokeh(ctx, s.t, { n: 26, seed: 43, a: 0.3, drift: 30 }); } });
  P({ id: 'S37', fg: 'snow', name: '雪落白头', at: 42.42, chapter: '副歌二', img: 's37-snow-profile', tin: { type: 'fade', dur: 1.2 }, look: { warm: 0.08, leak: 0.12, leakSeed: 80, vignette: 0.5 },
    c0: { x: 0.5, y: 0.5, z: 1.05 }, c1: { x: 0.5, y: 0.47, z: 1.16 }, motes: false, seed: 43,
    under(ctx, s) { D.snow(ctx, s.t, { n: 120, alpha: 0.55, speed: 0.4 }); },
    // 想起涂鸦里那一头白发：照片在角落一闪而过
    extra(ctx, s) {
      const a = sstep(T(43.3), T(43.6), s.t) * (1 - sstep(T(44.0), T(44.35), s.t));
      if (a > 0.01) S.photo(ctx, 'p01-laugh', 1600, 300, 230, 0.1, { dev: 1, alpha: a * 0.9 });
    } });
})();
