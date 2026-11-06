// 前奏 + 主歌一 + 导歌一：抽屉里的相机 → 舍不得按的快门 → 保质期 → 他回头
// 画面用 GPT 画的插画（assets/art），代码负责运镜、光、取景框、梦境显形、计数与转场。唱词只从 LRC 读取。
(() => {
  const { W, H, TAU, clamp, lerp, ease, sstep, bar, beatTime, beatAt, css, mix, hash, pulse } = MV;
  const A = MV.art, F = MV.fx, X = MV.instax, D = MV.draw;
  const S = MV.S = MV.S || {};

  // ---------- 共用：剩余相纸、取景框、闪光、照片 ----------
  // 每次按快门的时刻（小节）与按完后还有几张
  S.SHOTS = [[16, 9], [17.5, 8], [24.3, 7], [26.6, 6], [29.5, 5], [30.6, 4], [36, 3], [37.5, 2], [49.6, 1], [56, 0]];
  S.loadedAt = 3.1;
  S.countAt = t => {
    if (t < bar(S.loadedAt)) return null;
    let c = 10; for (const [b, n] of S.SHOTS) if (t >= bar(b)) c = n; return c;
  };
  S.shotTime = k => bar(S.SHOTS[k][0]);
  // 取景框：a 透明度；raise 0..1（举起的过程：框从大到正常）
  S.vf = (ctx, t, o = {}) => {
    const a = o.a ?? 1; if (a <= 0.001) return;
    const k = 1 + (1 - a) * 0.18;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(k, k); ctx.translate(-W / 2, -H / 2);
    X.viewfinder(ctx, { a, count: S.countAt(t), pulse: o.pulse || 0, dim: o.dim ?? 0.4, focus: o.focus ?? 1, rec: o.rec || 0 });
    ctx.restore();
  };
  // 快门后的闪光：tShot 之后迅速打白再褪去
  S.flash = (ctx, t, tShot, k = 1) => {
    const d = t - tShot; if (d < -0.05 || d > 1.6) return;
    const v = d < 0 ? (d + 0.05) / 0.05 : Math.exp(-d * 4.2);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = css('#fff6e8', clamp(v * k)); ctx.fillRect(0, 0, W, H); ctx.restore();
  };
  // 照片卡片（内容是一张竖幅插画）：dev 显影程度
  S.photo = (ctx, id, x, y, w, rot, o = {}) => {
    X.photo(ctx, x, y, w, rot, Object.assign({ draw: (g, pw, ph) => A.draw(g, id, 0, 0, pw, ph, { fy: o.fy ?? 0.4 }) }, o));
  };
  // 大号翻牌计数：在 t0 从 from 翻到 to
  S.bigCount = (ctx, t, t0, from, to, o = {}) => {
    const d = t - t0, life = o.life ?? 1.6; if (d < -0.2 || d > life) return;
    const inA = sstep(-0.2, 0.05, d), outA = 1 - sstep(life - 0.4, life, d);
    const pop = 1 + 0.18 * Math.exp(-Math.max(0, d) * 7) * Math.sin(Math.max(0, d) * 24);
    ctx.save(); ctx.translate(o.x ?? W / 2, o.y ?? H / 2); ctx.scale(pop, pop);
    X.flip(ctx, 0, 0, o.size ?? 240, from, to, clamp(d / 0.35), { alpha: inA * outA });
    ctx.restore();
  };
  // 贴图 + 呼吸般的慢推
  S.kb = (ctx, id, t, t0, t1, c0, c1, o) => A.plate(ctx, id, A.move(t, t0, t1, c0, c1, o && o.ease), o);
  // 节拍上轻微的“心跳”推近
  S.beatPush = (t, k = 0.012) => 1 + k * pulse(t, 7);
  // 重拍冲击：只在每小节第一拍上推一下
  S.downPunch = (t, k = 0.02) => { const f = MV.fract(MV.barAt(t)) * 4 * MV.audioData.beatLen; return 1 + k * Math.exp(-f * 7); };
  // 手持的微微晃动（取景框里看出去的镜头）
  S.hand = (t, k = 1) => ({ dx: MV.noise1(t * 0.9 + 3.1) * 6 * k, dy: MV.noise1(t * 0.8 + 17.3) * 5 * k, r: MV.noise1(t * 0.6 + 9.7) * 0.004 * k });
  // 关键帧：同一构图的几张“动作”图按时间切换。keys = [[图, 小节, 方式, 时长(拍)]]，方式 fade | cut | smear（快速动作，带一点拖影）
  S.keyPlate = (ctx, t, keys, cam, o = {}) => {
    const live = keys.filter(k => A.has(k[0]));
    if (!live.length) return A.plate(ctx, keys[0][0], cam, o);
    const BL = MV.audioData.beatLen, dur = k => (k[2] === 'cut' ? 0 : (k[3] ?? 0.6) * BL);
    let j = 0;
    for (let q = 1; q < live.length; q++) if (t >= bar(live[q][1]) - dur(live[q]) / 2) j = q;
    if (j === 0) return A.plate(ctx, live[0][0], cam, o);
    const inc = live[j], d = dur(inc), t1 = bar(inc[1]);
    const k = d ? clamp((t - (t1 - d / 2)) / d) : 1;
    if (k >= 1) return A.plate(ctx, inc[0], cam, o);
    const m = A.plate(ctx, live[j - 1][0], cam, o);
    if (inc[2] === 'smear') {
      const e = ease.inOutCubic(k);
      A.plate(ctx, inc[0], Object.assign({}, cam, { dx: (cam.dx || 0) + (1 - e) * 30 }), Object.assign({}, o, { alpha: (o.alpha ?? 1) * e * 0.5 }));
      A.plate(ctx, inc[0], cam, Object.assign({}, o, { alpha: (o.alpha ?? 1) * e }));
    } else A.plate(ctx, inc[0], cam, Object.assign({}, o, { alpha: (o.alpha ?? 1) * ease.inOutSine(k) }));
    return m;
  };
  // 两张图按固定节奏来回切（跑步、跳舞）
  S.alternate = (ids, b0, b1, step, mode = 'cut', durB = 0.3) => { const out = []; let i = 0; for (let b = b0; b < b1; b += step) out.push([ids[i++ % ids.length], b, mode, durB]); return out; };

  const T = b => bar(b);

  // ---------- S01 抽屉 [0–2] ----------
  MV.shot({
    id: 'S01', name: '抽屉', at: 0, chapter: '前奏',
    look: { warm: 0.08, leak: 0.18, leakSeed: 3, vignette: 0.5 },
    draw(ctx, s) {
      const t = s.t;
      const m = S.kb(ctx, 's01-drawer', t, T(-0.1), T(2.3), { x: 0.32, y: 0.42, z: 1.42 }, { x: 0.52, y: 0.5, z: 1.12 }, { ease: ease.inOutSine });
      F.beams(ctx, t, [{ x: -80, y: -60, ang: 0.62, w: 260, len: 1700, a: 0.16 }, { x: 260, y: -120, ang: 0.62, w: 160, len: 1600, a: 0.1 }]);
      F.motes(ctx, t, { n: 60, region: [0, 0, W, H], a: 0.7 });
      // 片名与署名（来自 LRC 的片名行与署名行）
      const L = MV.app && MV.app.lyrics; if (!L || s.clean) return;
      const g = ctx.createLinearGradient(0, H * 0.55, 0, H); g.addColorStop(0, 'rgba(20,12,18,0)'); g.addColorStop(1, 'rgba(20,12,18,0.55)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const ta = sstep(T(0.35), T(0.9), t) * (1 - sstep(T(1.75), T(2.05), t));
      if (L.title && ta > 0.01) {
        ctx.save(); ctx.globalAlpha = ta; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.shadowColor = 'rgba(30,15,20,0.5)'; ctx.shadowBlur = 24;
        ctx.fillStyle = '#fff6e8'; ctx.font = '700 132px "Noto Serif SC", serif';
        const chars = [...L.title.song], sp = 168;
        chars.forEach((ch, i) => { const d = sstep(T(0.35) + i * 0.18, T(0.35) + i * 0.18 + 0.6, t); ctx.globalAlpha = ta * d; ctx.fillText(ch, W / 2 + (i - (chars.length - 1) / 2) * sp, 830 + (1 - d) * 16); });
        ctx.globalAlpha = ta * sstep(T(0.7), T(1.1), t); ctx.font = '400 30px "Noto Sans SC", sans-serif'; ctx.fillStyle = '#f6e6cf';
        ctx.fillText([...L.title.artist].join(' '), W / 2, 890);
        ctx.restore();
      }
      // 署名：按 LRC 里的时间一行行出现在右下角
      ctx.save(); ctx.textAlign = 'right'; ctx.font = '400 22px "Noto Sans SC", sans-serif';
      L.credits.forEach((c, i) => {
        const t0 = [1.34, 2.55, 4.53, 5.65][i] ?? 1.3 + i;
        const a = sstep(t0, t0 + 0.5, t) * (1 - sstep(T(1.8), T(2.05), t));
        if (a <= 0.01) return;
        ctx.globalAlpha = a; ctx.fillStyle = '#f6e6cf'; ctx.fillText(`${c.role}  ${c.name}`, W - 70, 905 + i * 34 - 2 * 34 + (1 - a) * 6);
      });
      ctx.restore();
    },
  });

  // ---------- S02 装片 [2–4] ----------
  MV.shot({
    id: 'S02', name: '装片', at: 2, chapter: '前奏', tin: { type: 'fade', dur: 1.5 },
    look: { warm: 0.08, leak: 0.12, leakSeed: 5, vignette: 0.45 },
    draw(ctx, s) {
      const t = s.t, click = T(S.loadedAt);
      const shake = Math.exp(-Math.max(0, t - click) * 9) * (t > click ? 1 : 0);
      const m = S.kb(ctx, 's02-load', t, T(1.6), T(4.2), { x: 0.5, y: 0.5, z: 1.05 }, { x: 0.52, y: 0.44, z: 1.22 });
      if (shake > 0.01) ctx.translate(Math.sin(t * 90) * 5 * shake, Math.cos(t * 70) * 4 * shake);
      F.beams(ctx, t, [{ x: 120, y: -80, ang: 0.85, w: 220, len: 1500, a: 0.12 }]);
      F.motes(ctx, t, { n: 40, seed: 9, a: 0.6 });
      if (s.clean) return;
      // 合上后盖的“咔”：一圈光
      D.ring(ctx, 1000, 420, t - click, { dur: 0.7, r0: 30, r1: 420, color: '#fff2d6', width: 5, alpha: 0.8 });
      // 计数亮起 10
      S.bigCount(ctx, t, click + 0.25, 0, 10, { x: 1500, y: 300, size: 220, life: T(3.85) - click });
    },
  });

  // ---------- 主歌一：取景框里的“以后” ----------
  // 每一镜：现实的插画 + 框里浮出的梦（铅笔水彩），放下相机时梦散成铅笔灰
  const dreamShot = (def) => MV.shot(Object.assign({
    chapter: '主歌一', tin: def.tin || { type: 'whip', dur: 0.8, dir: 1 },
    look: Object.assign({ warm: 0.06, leak: 0.08, vignette: 0.42 }, def.look),
    draw(ctx, s) {
      const t = s.t, t0 = s.t0, t1 = s.t1;
      const c = A.move(t, t0 - 0.5, t1 + 0.5, def.c0, def.c1);
      const m = A.plate(ctx, def.real, c);
      if (def.beams) F.beams(ctx, t, def.beams);
      F.motes(ctx, t, { n: 45, seed: def.seed || 11, a: 0.55 });
      if (s.clean) return;
      // 举起（0→0.25 拍）……梦显形……放下（结尾前 0.9 拍）
      const raise = sstep(t0 + 0.05, t0 + 0.45, t), lower = sstep(t1 - 0.55, t1 - 0.1, t);
      const vfa = raise * (1 - lower);
      const du = sstep(t0 + 0.4, t0 + (t1 - t0) * 0.62, t);
      const fade = sstep(t1 - 0.9, t1 - 0.35, t);
      if (def.dream && du > 0) {
        F.dreamOver(ctx, du * (1 - fade), g => A.plate(g, def.dream, def.dreamCam ? def.dreamCam(c) : c), { clip: X.FRAME, focus: def.focus || [0.5, 0.45], seed: def.seed || 5 });
        F.pencil(ctx, du, { region: X.FRAME, seed: def.seed || 9 });
        F.graphite(ctx, fade, { region: X.FRAME, seed: (def.seed || 3) + 1 });
      }
      if (def.extra && m) def.extra(ctx, s, c, m);
      S.vf(ctx, t, { a: vfa, pulse: def.pulse ? pulse(t, 5) * 0.4 : 0 });
    },
  }, def));

  dreamShot({ id: 'S03', name: '窗外的花苞', at: 4, real: 's03-window', dream: 's03-window-dream', tin: { type: 'shutter', dur: 1.2 },
    c0: { x: 0.42, y: 0.45, z: 1.12 }, c1: { x: 0.36, y: 0.42, z: 1.2 }, focus: [0.45, 0.4], seed: 13,
    beams: [{ x: 1500, y: 700, ang: 3.6, w: 300, len: 1400, a: 0.1 }] });
  dreamShot({ id: 'S04', name: '空相框', at: 5, real: 's04-frames', dream: 's04-frames-dream',
    c0: { x: 0.5, y: 0.4, z: 1.14 }, c1: { x: 0.54, y: 0.38, z: 1.22 }, focus: [0.5, 0.35], seed: 17, pulse: true });
  dreamShot({ id: 'S05', name: '剪报', at: 6, real: 's05-fridge', dream: 's05-restaurant-dream',
    c0: { x: 0.5, y: 0.45, z: 1.1 }, c1: { x: 0.5, y: 0.42, z: 1.22 }, focus: [0.5, 0.45], seed: 19,
    dreamCam: () => ({ x: 0.5, y: 0.5, z: 1.1 }) });
  dreamShot({ id: 'S06', name: '地图与行李箱', at: 7, real: 's06-map', dream: null,
    c0: { x: 0.45, y: 0.4, z: 1.12 }, c1: { x: 0.5, y: 0.3, z: 1.28 }, seed: 23,
    // 纸飞机从地图上起飞（铅笔线画的），沿弧线飞出框外
    extra(ctx, s) {
      const u = clamp((s.t - (s.t0 + 0.5)) / (s.t1 - s.t0 - 0.4));
      if (u <= 0) return;
      const p = [lerp(820, 1900, ease.inCubic(u)), lerp(560, -120, ease.inQuad(u)) - Math.sin(u * Math.PI) * 120];
      const ang = -0.5 - u * 0.3;
      ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang); ctx.scale(1.4, 1.4);
      ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.fillStyle = 'rgba(255,250,240,0.35)';
      ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(-40, -30); ctx.lineTo(-18, 0); ctx.lineTo(-40, 26); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(-18, 0); ctx.stroke();
      ctx.restore();
      // 虚线航迹
      ctx.save(); ctx.setLineDash([10, 14]); ctx.strokeStyle = 'rgba(255,250,240,0.7)'; ctx.lineWidth = 2.2; ctx.beginPath();
      for (let k = 0; k <= 30; k++) { const v = u * k / 30; const q = [lerp(820, 1900, ease.inCubic(v)), lerp(560, -120, ease.inQuad(v)) - Math.sin(v * Math.PI) * 120]; if (k) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }
      ctx.stroke(); ctx.restore();
    } });

  // ---------- S07 巴黎 [8–10]：梦从框里涌出来铺满全屏，又被收回去 ----------
  MV.shot({
    id: 'S07', name: '巴黎', at: 8, chapter: '主歌一', tin: { type: 'whip', dur: 0.7, dir: -1 },
    look: { warm: 0.05, leak: 0.2, leakSeed: 8, vignette: 0.35 },
    draw(ctx, s) {
      const t = s.t, t0 = s.t0, t1 = s.t1;
      const back = sstep(T(9.55), T(9.95), t); // 梦收回去
      A.plate(ctx, 's07-desk-back', A.move(t, T(9.3), T(10.2), { x: 0.4, y: 0.5, z: 1.2 }, { x: 0.42, y: 0.48, z: 1.1 }));
      F.beams(ctx, t, [{ x: -100, y: -40, ang: 0.55, w: 260, len: 1700, a: 0.14 }]);
      const grow = ease.inOutCubic(sstep(t0 + 0.1, T(8.7), t));
      const fr = X.FRAME, full = [-40, -40, W + 80, H + 80];
      const clip = fr.map((v, i) => lerp(v, full[i], grow));
      const cam = A.move(t, t0, T(9.8), { x: 0.42, y: 0.5, z: 1.25 }, { x: 0.62, y: 0.45, z: 1.08 });
      F.dreamOver(ctx, 1 - back, g => { A.plate(g, 's07-paris-dream', cam); }, { clip, radius: lerp(18, 0, grow), focus: [0.6, 0.5], seed: 29 });
      if (!s.clean) {
        F.pencil(ctx, 1 - back, { region: [0, 0, W, H], seed: 31, n: 24 });
        F.graphite(ctx, back, { region: [0, 0, W, H], seed: 33, n: 220 });
        S.vf(ctx, t, { a: (1 - grow) * (1 - back) });
      }
    },
  });
  dreamShot({ id: 'S08', name: '戒指', at: 10, real: 's08-hand-ring', dream: null, tin: { type: 'fade', dur: 1.2 },
    c0: { x: 0.5, y: 0.5, z: 1.08 }, c1: { x: 0.52, y: 0.48, z: 1.2 }, seed: 37,
    extra(ctx, s, c, m) {
      const [x, y] = m.toScreen(0.42, 0.557), k = 0.5 + 0.5 * Math.sin(s.t * 3.2), on = sstep(s.t0 + 0.5, s.t0 + 1.2, s.t) * (1 - sstep(s.t1 - 0.9, s.t1 - 0.4, s.t));
      D.glow(ctx, x, y, 120 + 40 * k, '#fff1c8', (0.3 + 0.25 * k) * on); D.flare(ctx, x + 18, y - 22, 70 + 30 * k, '#fffaf0', (0.5 + 0.4 * k) * on, 0.3);
    } });
  dreamShot({ id: 'S09', name: '以后', at: 11, real: 's07-desk-back', dream: 's09-days-dream', dreamCam: () => ({ x: 0.5, y: 0.5, z: 1.06 }), focus: [0.5, 0.45], tin: { type: 'fade', dur: 1.2 },
    c0: { x: 0.42, y: 0.48, z: 1.1 }, c1: { x: 0.38, y: 0.5, z: 1.02 }, seed: 41,
    beams: [{ x: -100, y: -40, ang: 0.55, w: 260, len: 1700, a: 0.14 }] });

  // ---------- 导歌一 ----------
  MV.shot({
    id: 'S10', name: '保质期', at: 12, chapter: '导歌一', tin: { type: 'fade', dur: 1.2 },
    look: { warm: -0.02, leak: 0.05, vignette: 0.5 },
    draw(ctx, s) {
      const t = s.t;
      const m = S.kb(ctx, 's10-expiry', t, T(11.6), T(13.6), { x: 0.5, y: 0.45, z: 1.05 }, { x: 0.42, y: 0.5, z: 1.32 });
      F.motes(ctx, t, { n: 30, seed: 43, a: 0.4 });
      if (s.clean || !m) return;
      // 秒针：钟心在图上的 (0.876, 0.179)
      { const [cx, cy] = m.toScreen(0.876, 0.179), R = 0.085 * m.iw * m.sc, a = (MV.tick(t) / 60) * TAU - Math.PI / 2;
        ctx.save(); ctx.strokeStyle = 'rgba(196,72,52,0.9)'; ctx.lineWidth = 0.004 * m.iw * m.sc; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * R * 0.2, cy - Math.sin(a) * R * 0.2); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke(); ctx.restore(); }
      // 日历：每拍一页从顶上翻起、飞走
      { const b = beatAt(t) - beatAt(s.t0); const [gx, gy] = m.toScreen(0.62, 0.16), pw = 0.2 * m.iw * m.sc, ph = 0.34 * m.ih * m.sc;
        for (let k = Math.max(0, Math.floor(b) - 2); k <= Math.floor(b); k++) { const u = clamp(b - k); if (u <= 0) continue;
          ctx.save(); ctx.translate(gx + u * u * 700, gy - Math.sin(u * Math.PI) * 120 + u * 260); ctx.rotate(u * 1.6 + k * 0.3); ctx.globalAlpha = 1 - sstep(0.6, 1, u);
          const sw2 = pw * (1 - u * 0.45), sh2 = ph * (1 - u * 0.55) * Math.abs(Math.cos(u * 2.2)) + 6;
          const pg = ctx.createLinearGradient(0, 0, 0, sh2); pg.addColorStop(0, '#fffaf1'); pg.addColorStop(1, '#e9dfcf');
          ctx.fillStyle = pg; ctx.shadowColor = 'rgba(80,50,30,0.25)'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.moveTo(-sw2 / 2, 0); ctx.lineTo(sw2 / 2, 0); ctx.quadraticCurveTo(sw2 / 2 + 10, sh2 * 0.6, sw2 / 2 - 14, sh2); ctx.lineTo(-sw2 / 2 + 6, sh2); ctx.closePath(); ctx.fill(); ctx.restore(); } }
      // 保质期印章：盖在盒子侧面空白标签里
      { const a = sstep(T(12.35), T(12.5), t), [x0, y0] = m.toScreen(0.327, 0.488), [x1, y1] = m.toScreen(0.458, 0.628);
        if (a > 0) { const pop = 1 + 0.25 * (1 - ease.outBack(a)); ctx.save(); ctx.translate((x0 + x1) / 2, (y0 + y1) / 2); ctx.rotate(-0.06); ctx.scale(pop, pop); ctx.globalAlpha = a * 0.92;
          ctx.fillStyle = '#c0392b'; ctx.font = `700 ${(y1 - y0) * 0.3}px Bahnschrift, Consolas, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('EXP', 0, -(y1 - y0) * 0.17); ctx.font = `700 ${(y1 - y0) * 0.26}px Bahnschrift, Consolas, monospace`; ctx.fillText('2026.11', 0, (y1 - y0) * 0.2); ctx.restore(); } }
      // 秒针一样一拍一跳的小刻度条（画面上方），提醒时间在走
      const k = MV.tick(t);
      ctx.save(); ctx.globalAlpha = 0.55 * sstep(T(12), T(12.3), t);
      for (let i = 0; i < 60; i++) {
        const lit = (i <= (k % 60));
        ctx.fillStyle = lit ? '#fff2dc' : 'rgba(255,242,220,0.25)';
        ctx.fillRect(560 + i * 13.5, 64, 4, i % 5 ? 14 : 24);
      }
      ctx.restore();
    },
  });
  MV.shot({
    id: 'S11', name: '再一次举起', at: 13.35, chapter: '导歌一', tin: { type: 'fade', dur: 1.0 },
    look: { warm: 0.04, leak: 0.1, vignette: 0.45 },
    draw(ctx, s) {
      const t = s.t;
      const push = S.beatPush(t, 0.01);
      // 先犹豫着把相机捧在胸前，第 14 小节才举起来
      S.keyPlate(ctx, t, [['k11-before', 13], ['s11-her-raise', 14.15, 'fade', 1.4]], A.move(t, s.t0 - 0.3, T(15.2), { x: 0.5, y: 0.48, z: 1.04 * push }, { x: 0.56, y: 0.45, z: 1.28 * push }));
      F.beams(ctx, t, [{ x: -60, y: -60, ang: 0.6, w: 240, len: 1700, a: 0.12 }]);
      F.motes(ctx, t, { n: 40, seed: 47, a: 0.5 });
    },
  });
  MV.shot({
    id: 'S12', name: '他回头', at: 15, chapter: '导歌一', tin: { type: 'shutter', dur: 1.0 },
    look: { warm: 0.07, leak: 0.12, vignette: 0.5 },
    draw(ctx, s) {
      const t = s.t, t1 = T(16);
      // 静默里他还背对着敲键盘；第 11 句唱到一半他回过头来，冲镜头一笑
      const cam12 = Object.assign(A.move(t, s.t0, t1, { x: 0.5, y: 0.45, z: 1.06 }, { x: 0.5, y: 0.42, z: 1.16 }, ease.outCubic), S.hand(t, 0.8));
      S.keyPlate(ctx, t, [['k12-back', 15], ['k12-mid', 15.5, 'smear', 0.5], ['s12-turn-smile', 15.72, 'smear', 0.45]], cam12);
      F.motes(ctx, t, { n: 40, seed: 53, a: 0.55, drift: 3 });
      if (s.clean) return;
      // 静默里，取景框像心跳那样一缩一放
      S.vf(ctx, t, { a: 1, pulse: pulse(t, 6) * 0.6, focus: sstep(s.t0, s.t0 + 1.2, t) });
    },
  });
})();
