// 人物：她和他。扁平 MG 风格，无描边。
// 头部按球面放五官和发际线，能连续转头（背面 → 侧面 → 正面）；身体按朝向角压缩、换层；四肢两段 IK。
// 坐标：人物局部单位 u = 头的半径，原点在两脚之间的地面，y 向下为正（向上为负）。
(() => {
  const { TAU, clamp, lerp, ease, mix, css, mixc, sstep, hash, noise1 } = MV;
  const PI = Math.PI;

  // ---------- 角色设定 ----------
  const RIG = {
    her: { headCy: -9.12, chin: 0.98, neckW: 0.3, shY: -7.85, shHalf: 0.92, waistY: -5.75, waistHalf: 0.56, hipY: -4.85, hipHalf: 0.64,
      upper: 1.82, fore: 1.7, handR: 0.27, thigh: 2.35, shin: 2.4, foot: 0.62, thick: 0.52, hair: 'bob' },
    him: { headCy: -9.78, chin: 0.98, neckW: 0.36, shY: -8.45, shHalf: 1.1, waistY: -6.05, waistHalf: 0.76, hipY: -5.1, hipHalf: 0.72,
      upper: 1.98, fore: 1.86, handR: 0.3, thigh: 2.5, shin: 2.56, foot: 0.72, thick: 0.6, hair: 'short', glasses: true },
  };
  const C = MV.C;
  // 服装
  const OUTFIT = {
    her: {
      home: { top: C.mustard, topShade: '#c99a32', inner: C.cream, skirt: C.tealDeep, skirtShade: '#244b51', legs: C.skin, legsShade: C.skinShade, shoe: '#3b2f3a', sleeve: C.mustard },
      winter: { top: C.coral, topShade: '#bf5a46', inner: C.cream, skirt: '#3b3550', skirtShade: '#2c2840', legs: '#3a3346', legsShade: '#2b2534', shoe: '#2b2131', sleeve: C.coral, scarf: '#f3e6cf', coat: true },
      hike: { top: '#e7a83e', topShade: '#c58a2a', inner: C.cream, skirt: '#2f4b57', skirtShade: '#243b45', legs: '#2f4b57', legsShade: '#243b45', shoe: '#3b2f3a', sleeve: '#e7a83e', pants: true },
      night: { top: '#b9a6d6', topShade: '#9884b8', inner: C.cream, skirt: '#2c3a5c', skirtShade: '#202b45', legs: C.skin, legsShade: C.skinShade, shoe: '#2b2131', sleeve: '#b9a6d6' },
      old: { top: '#b48fb0', topShade: '#946f90', inner: '#f3e9de', skirt: '#4b5a72', skirtShade: '#3a465a', legs: '#6b6070', legsShade: '#564c5a', shoe: '#3b2f3a', sleeve: '#b48fb0' },
    },
    him: {
      home: { top: C.navy, topShade: '#243b66', collar: '#f4efe6', legs: '#5a5f6e', legsShade: '#474b58', shoe: '#2a2630', sleeve: C.navy },
      winter: { top: C.camel, topShade: '#a57d52', collar: '#2a2b3a', legs: '#3d4150', legsShade: '#2f3240', shoe: '#2a2630', sleeve: C.camel, scarf: '#3b4a6b', coat: true },
      hike: { top: '#3f6f8a', topShade: '#30566d', collar: '#e9e2d6', legs: '#4b4f5c', legsShade: '#3b3f4a', shoe: '#2a2630', sleeve: '#3f6f8a' },
      night: { top: '#33456e', topShade: '#283757', collar: '#f4efe6', legs: '#3d4150', legsShade: '#2f3240', shoe: '#2a2630', sleeve: '#33456e' },
      old: { top: '#8a6a52', topShade: '#6f5442', collar: '#efe8dc', legs: '#5a5a62', legsShade: '#47474e', shoe: '#2a2630', sleeve: '#8a6a52' },
    },
  };

  // 头发颜色随年龄：黑 → 灰 → 白
  const hairColor = age => (age < 0.45 ? mix(C.hair, '#4a4652', age / 0.45 * 0.35) : mix('#5a5662', '#ecebf0', clamp((age - 0.45) / 0.5)));
  const hairHi = age => (age < 0.45 ? mix(C.hairHi, '#6a6676', age / 0.45 * 0.4) : mix('#7a7684', '#ffffff', clamp((age - 0.45) / 0.5)));

  // ---------- 几何工具 ----------
  // 两段 IK：从 a 到目标 t，两段长 l1 l2，bend=±1 决定肘/膝朝哪边弯。返回中间关节
  function ik(a, t, l1, l2, bend) {
    let dx = t[0] - a[0], dy = t[1] - a[1];
    let d = Math.hypot(dx, dy);
    const maxD = (l1 + l2) * 0.999, minD = Math.abs(l1 - l2) + 1e-3;
    if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; }
    if (d < minD) { const k = minD / (d || 1); dx *= k; dy *= k; d = minD; }
    const base = Math.atan2(dy, dx);
    const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
    const ang = base + bend * Math.acos(cosA);
    const m = [a[0] + Math.cos(ang) * l1, a[1] + Math.sin(ang) * l1];
    return { m, end: [a[0] + dx, a[1] + dy] };
  }
  // 粗细渐变的肢体（两端圆头）加入路径
  function limb(p, a, b, ra, rb) {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
    if (d < 1e-4) { p.moveTo(a[0] + ra, a[1]); p.arc(a[0], a[1], Math.max(ra, rb), 0, TAU); return; }
    const an = Math.atan2(dy, dx), k = Math.acos(clamp((ra - rb) / d, -1, 1));
    p.moveTo(a[0] + ra * Math.cos(an + k), a[1] + ra * Math.sin(an + k));
    p.arc(a[0], a[1], ra, an + k, an - k + TAU, false);
    p.arc(b[0], b[1], rb, an - k, an + k, false);
    p.closePath();
  }
  // 平滑闭合曲线
  function smoothClosed(p, pts, k = 1) {
    const n = pts.length;
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k / 6, p1[1] + (p2[1] - p0[1]) * k / 6, p2[0] - (p3[0] - p1[0]) * k / 6, p2[1] - (p3[1] - p1[1]) * k / 6, p2[0], p2[1]);
    }
    p.closePath();
  }

  // ---------- 头 ----------
  // 球面点 (lon, lat) 在转角 yaw 下的屏幕位置与朝向 z（>0 朝镜头）
  const sph = (lon, lat, yaw, r = 1) => {
    const a = lon + yaw, cl = Math.cos(lat);
    return [Math.sin(a) * cl * r, -Math.sin(lat) * r, Math.cos(a) * cl];
  };
  // 发际线（纬度）随经度变化：返回该经度上头发的下边界
  const HAIRLINE = {
    // 齐刘海波波头：前额刘海在眉上，两侧和后面一直到下巴
    bob: lon => {
      const a = Math.abs(((lon + PI) % TAU + TAU) % TAU - PI);
      const front = 0.34 + 0.025 * Math.sin(lon * 9);
      return a < 0.82 ? front : a < 1.28 ? lerp(front, -1.0, ease.inOutSine((a - 0.82) / 0.46)) : -1.0;
    },
    // 短发：额前略高，鬓角在耳上，后脑到发根
    short: lon => {
      const a = Math.abs(((lon + PI) % TAU + TAU) % TAU - PI);
      if (a < 0.85) return 0.5 + 0.06 * Math.sin(lon * 7 + 1);
      if (a < 1.75) return lerp(0.5, 0.06, ease.inOutSine((a - 0.85) / 0.9));
      return lerp(0.06, -0.42, ease.inOutSine(clamp((a - 1.75) / 1.1)));
    },
    // 老年的她：低发髻，额前分开
    bun: lon => {
      const a = Math.abs(((lon + PI) % TAU + TAU) % TAU - PI);
      if (a < 0.9) return 0.62 - 0.12 * Math.abs(Math.sin(lon * 1.7));
      if (a < 1.6) return lerp(0.5, -0.05, ease.inOutSine((a - 0.9) / 0.7));
      return lerp(-0.05, -0.55, ease.inOutSine(clamp((a - 1.6) / 1.2)));
    },
  };

  // 把发区（纬度高于发际线的球冠）在当前转角下的可见部分做成路径
  function hairCap(p, line, yaw, r) {
    const N = 96, pts = [];
    for (let i = 0; i < N; i++) { const lon = -PI + (i / N) * TAU; pts.push(sph(lon, line(lon), yaw, r)); }
    // 找到 z 由负变正、由正变负的两个交点
    let iIn = -1, iOut = -1;
    for (let i = 0; i < N; i++) { const a = pts[i][2], b = pts[(i + 1) % N][2]; if (a < 0 && b >= 0) iIn = i; if (a >= 0 && b < 0) iOut = i; }
    if (iIn < 0 || iOut < 0) {
      // 整圈都可见或都不可见：可见时直接画闭合线以上的部分（头顶），否则就是整片后脑
      if (pts[0][2] >= 0) { p.moveTo(pts[0][0], pts[0][1]); for (const q of pts) p.lineTo(q[0], q[1]); p.closePath(); }
      else { p.moveTo(r, 0); p.arc(0, 0, r, 0, TAU); }
      return;
    }
    const cross = i => { const a = pts[i], b = pts[(i + 1) % N], u = a[2] / (a[2] - b[2]); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; };
    const A = cross(iIn), B = cross(iOut);
    p.moveTo(A[0], A[1]);
    for (let k = 1; k <= N; k++) { const i = (iIn + k) % N; p.lineTo(pts[i][0], pts[i][1]); if (i === iOut) break; }
    p.lineTo(B[0], B[1]);
    // 沿轮廓圆从 B 经头顶回到 A
    const aB = Math.atan2(B[1], B[0]), aA = Math.atan2(A[1], A[0]);
    // 选经过头顶（角度 -π/2）的那一段
    const norm = x => ((x % TAU) + TAU) % TAU;
    const ccwLen = norm(aA - aB); // 逆时针（角度增大）
    const top = norm(-PI / 2 - aB);
    if (top <= ccwLen) p.arc(0, 0, r, aB, aA, false); else p.arc(0, 0, r, aB, aA, true);
    p.closePath();
  }

  // 画头：中心在 (0,0)，半径 1（调用方已缩放）。o: {who, yaw, age, expr, tilt, hairStyle, sil, rim}
  function head(ctx, o, paint) {
    const { who = 'her', yaw = 0, age = 0, expr = {}, t = 0 } = o;
    const R = RIG[who];
    const style = o.hairStyle || (who === 'her' && age > 0.75 ? 'bun' : R.hair);
    const hc = hairColor(age), hh = hairHi(age);
    const sy = Math.sin(yaw), cy = Math.cos(yaw);
    const facing = cy; // >0：脸朝镜头
    // —— 脑后的发量（波波头比头大一圈，在脑后鼓出） ——
    if (style === 'bob') {
      const p = new Path2D();
      const back = -sy * 0.2, wide = 1.15 - 0.03 * Math.abs(sy);
      const pts = [];
      for (let i = 0; i <= 28; i++) {
        const a = -PI + (i / 28) * PI; // 上半圈
        pts.push([back + Math.cos(a) * wide, -0.06 + Math.sin(a) * 1.13]);
      }
      // 下沿：齐耳到下巴，发梢微微内扣；朝向侧面时前沿收进脸后
      const fr = sy > 0 ? 1 : -1;
      const swing = (o.hairSwing || 0);
      pts.push([back + wide + 0.02 * swing, 0.55]);
      pts.push([back + wide * 0.99 + 0.05 * swing, 0.86 + 0.03 * swing]);
      pts.push([back + wide * 0.86 + 0.04 * swing, 1.0]);
      pts.push([back + wide * 0.55, 1.06]);
      pts.push([back - wide * 0.55, 1.06]);
      pts.push([back - wide * 0.86 + 0.04 * swing, 1.0]);
      pts.push([back - wide * 0.99 + 0.05 * swing, 0.86 - 0.03 * swing]);
      pts.push([back - wide - 0.02 * swing, 0.55]);
      // 脸朝向的那一侧：侧过去时把这一侧的发型轮廓收进头的圆里（交给发区球冠去表现），免得头发垂到下巴前面
      const sideK = Math.abs(sy), fs2 = sy >= 0 ? 1 : -1;
      for (const q of pts) {
        if (Math.sign(q[0]) !== fs2 || q[1] < -0.2) continue;
        const r = Math.hypot(q[0], q[1]); if (r < 0.97) continue;
        const k = lerp(1, 0.97 / r, sstep(0.15, 0.85, sideK) * sstep(-0.2, 0.4, q[1]));
        q[0] *= k; q[1] *= k;
      }
      p.moveTo(pts[0][0], pts[0][1]); for (const q of pts) p.lineTo(q[0], q[1]); p.closePath();
      paint(p, hc, 'hairBack');
      void fr;
    } else if (style === 'bun') {
      const p = new Path2D();
      const bx = -sy * 0.95, by = 0.35;
      p.moveTo(bx + 0.5, by); p.arc(bx, by, 0.5, 0, TAU);
      paint(p, hc, 'hairBack');
    }
    // —— 耳朵（在脸后） ——
    for (const side of [-1, 1]) {
      const e = sph(side * PI / 2, -0.12, yaw);
      if (e[2] > -0.35 && (style === 'short' || style === 'bun')) {
        const p = new Path2D(); const w = 0.17 + 0.08 * (1 - Math.abs(e[2]));
        p.ellipse(e[0], e[1], w, 0.26, 0, 0, TAU);
        paint(p, C.skinShade, 'ear');
      }
    }
    // —— 脖子（全身时由 figure 在躯干之前画） ——
    if (!o.noNeck) {
      const p = new Path2D(); const nw = R.neckW;
      p.rect(-nw, 0.55, nw * 2, 1.0);
      paint(p, C.skinShade, 'neck');
    }
    // —— 头（皮肤） ——
    {
      const p = new Path2D(); p.moveTo(1, 0); p.arc(0, 0, 1, 0, TAU);
      // 下巴：略尖一点
      const cx = sy * 0.12;
      p.moveTo(-0.62 + cx, 0.78); p.quadraticCurveTo(cx, 1.12, 0.62 + cx, 0.78); p.closePath();
      paint(p, C.skin, 'skin');
    }
    // 侧脸鼻尖：越侧越凸出
    if (Math.abs(sy) > 0.25 && cy > -0.2) {
      const p = new Path2D(), s = Math.sign(sy), k = sstep(0.25, 0.95, Math.abs(sy)) * clamp(cy * 3 + 0.6);
      const nx = s * Math.sqrt(1 - 0.12 * 0.12) * 0.99, ny = 0.18;
      p.moveTo(nx, ny - 0.2); p.quadraticCurveTo(nx + s * 0.2 * k, ny + 0.04, nx - s * 0.02, ny + 0.16); p.closePath();
      paint(p, C.skin, 'nose');
    }
    // —— 五官（在可见面上） ——
    const feat = (lon, lat) => sph(lon, lat, yaw);
    if (cy > -0.25) {
      const blush = expr.blush ?? 0.55;
      for (const side of [-1, 1]) {
        const b = feat(side * 0.62, -0.38);
        if (b[2] > 0.05 && blush > 0.01) { const p = new Path2D(); p.ellipse(b[0], b[1], 0.2 * Math.max(0.3, b[2]), 0.11, 0, 0, TAU); paint(p, C.blush, 'blush', blush * 0.55 * clamp(b[2] * 2)); }
      }
      // 眼睛
      const eyeMode = expr.eye || 'open';
      const blink = expr.blink || 0;
      for (const side of [-1, 1]) {
        const e = feat(side * 0.4, -0.08);
        if (e[2] <= 0.08) continue;
        const w = 0.115 * clamp(e[2] * 1.4), h0 = 0.15;
        const mode = eyeMode === 'wink' && side === 1 ? 'closed' : eyeMode === 'wink' ? 'open' : eyeMode;
        const p = new Path2D();
        if (mode === 'open') {
          const h = h0 * (1 - blink);
          if (h > 0.02) { p.ellipse(e[0], e[1], w, h, 0, 0, TAU); paint(p, '#2a2230', 'eye'); }
          else { p.moveTo(e[0] - w * 1.2, e[1]); p.lineTo(e[0] + w * 1.2, e[1]); paint(p, '#2a2230', 'line', 1, 0.05); }
          if (h > 0.06 && o.big) { const q = new Path2D(); q.arc(e[0] + w * 0.35, e[1] - h * 0.35, w * 0.32, 0, TAU); paint(q, '#ffffff', 'eyeHi', 0.9); }
        } else if (mode === 'smile') {
          p.moveTo(e[0] - w * 1.4, e[1] + 0.03); p.quadraticCurveTo(e[0], e[1] - 0.16, e[0] + w * 1.4, e[1] + 0.03);
          paint(p, '#2a2230', 'line', 1, 0.055);
        } else if (mode === 'closed' || mode === 'sleep') {
          p.moveTo(e[0] - w * 1.4, e[1] - 0.01); p.quadraticCurveTo(e[0], e[1] + 0.09, e[0] + w * 1.4, e[1] - 0.01);
          paint(p, '#2a2230', 'line', 1, 0.05);
        } else if (mode === 'squeeze') {
          p.moveTo(e[0] - side * w * 1.3, e[1] - 0.08); p.lineTo(e[0] + side * w * 1.1, e[1]); p.lineTo(e[0] - side * w * 1.3, e[1] + 0.08);
          paint(p, '#2a2230', 'line', 1, 0.05);
        } else if (mode === 'wide') {
          p.ellipse(e[0], e[1], w * 1.15, h0 * 1.25, 0, 0, TAU); paint(p, '#2a2230', 'eye');
        }
        // 眉毛
        const br = feat(side * 0.42, 0.2 + 0.05 * (expr.brow || 0));
        if (br[2] > 0.1 && !(style === 'bob' && 0.2 + 0.05 * (expr.brow || 0) > 0.3)) {
          const q = new Path2D(), bw = 0.16 * clamp(br[2] * 1.3), sad = expr.sad ? side * 0.05 : 0;
          q.moveTo(br[0] - bw, br[1] + sad); q.quadraticCurveTo(br[0], br[1] - 0.05, br[0] + bw, br[1] - sad);
          paint(q, who === 'her' ? hc : mix(hc, '#2a2230', 0.3), 'line', 0.85, 0.045);
        }
        // 眼镜
        if (R.glasses && o.glasses !== false) {
          const g = new Path2D(), gw = 0.27 * Math.max(0.12, e[2]);
          g.ellipse(e[0], e[1] + 0.01, gw, 0.24, 0, 0, TAU);
          paint(g, '#2a2230', 'line', 0.9, 0.05);
        }
      }
      if (R.glasses && o.glasses !== false) {
        const l = feat(-0.4, -0.07), r = feat(0.4, -0.07);
        if (l[2] > 0.08 && r[2] > 0.08) { const g = new Path2D(); g.moveTo(l[0] + 0.27 * l[2], l[1] - 0.02); g.quadraticCurveTo((l[0] + r[0]) / 2, l[1] - 0.08, r[0] - 0.27 * r[2], r[1] - 0.02); paint(g, '#2a2230', 'line', 0.9, 0.045); }
        // 侧面的镜腿
        for (const side of [-1, 1]) {
          const a = feat(side * 0.75, -0.06), b = feat(side * 1.45, -0.04);
          if (a[2] > -0.1 && Math.abs(sy) > 0.35 && Math.sign(sy) !== side) { const g = new Path2D(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); paint(g, '#2a2230', 'line', 0.8, 0.04); }
        }
      }
      // 嘴
      const m = feat(0, -0.5);
      if (m[2] > 0.15) {
        const mw = 0.17 * clamp(m[2] * 1.2), mode = expr.mouth || 'smile';
        const p = new Path2D();
        if (mode === 'smile') { p.moveTo(m[0] - mw, m[1] - 0.02); p.quadraticCurveTo(m[0], m[1] + 0.1, m[0] + mw, m[1] - 0.02); paint(p, '#7a3b3f', 'line', 1, 0.05); }
        else if (mode === 'flat') { p.moveTo(m[0] - mw * 0.7, m[1]); p.lineTo(m[0] + mw * 0.7, m[1]); paint(p, '#7a3b3f', 'line', 1, 0.045); }
        else if (mode === 'sad') { p.moveTo(m[0] - mw * 0.8, m[1] + 0.05); p.quadraticCurveTo(m[0], m[1] - 0.04, m[0] + mw * 0.8, m[1] + 0.05); paint(p, '#7a3b3f', 'line', 1, 0.045); }
        else if (mode === 'o') { p.ellipse(m[0], m[1] + 0.02, mw * 0.45, 0.09, 0, 0, TAU); paint(p, '#7a3b3f', 'mouth'); }
        else if (mode === 'open' || mode === 'laugh' || mode === 'tongue') {
          const big = mode === 'laugh' ? 1.25 : 1;
          p.moveTo(m[0] - mw * big, m[1] - 0.05); p.quadraticCurveTo(m[0], m[1] + 0.3 * big, m[0] + mw * big, m[1] - 0.05); p.closePath();
          paint(p, '#7a3b3f', 'mouth');
          const q = new Path2D(); q.ellipse(m[0], m[1] + 0.1 * big, mw * 0.55 * big, 0.06 * big, 0, 0, TAU); paint(q, mode === 'tongue' ? '#ef6f7c' : '#e98a8f', 'mouth', 0.9);
          if (mode === 'tongue') { const tq = new Path2D(); tq.ellipse(m[0] + 0.03, m[1] + 0.2, mw * 0.45, 0.13, 0.2, 0, TAU); paint(tq, '#ef6f7c', 'mouth'); }
        }
      }
    }
    // —— 头发（球冠） ——
    {
      const p = new Path2D();
      hairCap(p, HAIRLINE[style], yaw, style === 'bob' ? 1.06 : 1.04);
      paint(p, hc, 'hair');
      // 高光：一道弧
      if (o.big || o.hl) {
        const q = new Path2D(), a0 = -PI * 0.78, a1 = -PI * 0.55, off = -sy * 0.15;
        q.arc(off, -0.02, 0.86, a0, a1); paint(q, hh, 'line', 0.55, 0.09);
      }
      // 短发：额前几缕翘起
      if (style === 'short') {
        const q = new Path2D();
        for (let k = 0; k < 4; k++) {
          const lon = -0.55 + k * 0.38, a = sph(lon, 0.58, yaw, 1.05), b = sph(lon + 0.22, 0.38, yaw, 1.04), c = sph(lon + 0.45, 0.56, yaw, 1.05);
          if (a[2] < 0 && c[2] < 0) continue;
          q.moveTo(a[0], a[1]); q.quadraticCurveTo(b[0], b[1] + 0.1, c[0], c[1]); q.lineTo(c[0], c[1] - 0.15); q.lineTo(a[0], a[1] - 0.15); q.closePath();
        }
        paint(q, hc, 'hair');
        // 头顶一撮
        const tq = new Path2D(), tx = -sy * 0.1;
        tq.moveTo(tx - 0.2, -1.0); tq.quadraticCurveTo(tx + 0.05, -1.32, tx + 0.32, -1.18); tq.quadraticCurveTo(tx + 0.12, -1.08, tx + 0.15, -0.95); tq.closePath();
        paint(tq, hc, 'hair');
      }
      if (style === 'bun') {
        // 头顶的分缝
        const q = new Path2D(), a = sph(0.08, 0.95, yaw, 1.05), b = sph(0.1, 0.62, yaw, 1.05);
        if (a[2] > -0.2) { q.moveTo(a[0], a[1]); q.lineTo(b[0], b[1]); paint(q, hh, 'line', 0.6, 0.04); }
      }
    }
  }

  // ---------- 全身 ----------
  // P: 见文件开头说明。返回关节位置（局部单位），方便调用方把道具放在手上
  function figure(ctx, who, P = {}) {
    const R = RIG[who];
    const O = OUTFIT[who][P.outfit || 'home'];
    const age = P.age || 0;
    const yaw = P.yaw ?? 0.6; // 身体朝向：0 正面，+π/2 朝画面右，π 背面
    const sy = Math.sin(yaw), cy = Math.cos(yaw);
    const old = sstep(0.6, 1, age);
    const lean = (P.lean || 0) + old * 0.12 * Math.sign(sy || 1);
    const crouch = P.crouch || 0;
    const bob = P.bob || 0;
    // 关节（局部单位）
    const hipDrop = crouch * 1.4;
    const hip = [P.hipX || 0, R.hipY + hipDrop + bob + (P.hipY || 0)];
    if (P.seat != null) { hip[1] = P.seat; }
    const spineLen = R.shY - R.hipY;
    const lean2 = lean + (P.sway || 0);
    const shC = [hip[0] + Math.sin(lean2) * -spineLen * 1, hip[1] + Math.cos(lean2) * spineLen];
    const shHalfX = R.shHalf * Math.abs(cy) + R.thick * 0.55 * Math.abs(sy);
    const rDir = [-cy, sy]; // 右侧方向：x 分量、深度分量
    // 肩关节放进躯干轮廓里一点，免得手臂根部像垫肩一样鼓出来
    const shIn = R.shHalf - 0.16, shDn = 0.3;
    const shR = [shC[0] + rDir[0] * shIn * Math.cos(lean2) - Math.sin(lean2) * shDn, shC[1] + rDir[0] * shIn * Math.sin(lean2) + Math.cos(lean2) * shDn];
    const shL = [shC[0] - rDir[0] * shIn * Math.cos(lean2) - Math.sin(lean2) * shDn, shC[1] - rDir[0] * shIn * Math.sin(lean2) + Math.cos(lean2) * shDn];
    const zR = rDir[1], zL = -rDir[1]; // 深度：>0 离镜头近
    const hpR = [hip[0] + rDir[0] * R.hipHalf * 0.75, hip[1]], hpL = [hip[0] - rDir[0] * R.hipHalf * 0.75, hip[1]];
    const headUp = R.headCy - R.shY;
    const neckBase = [shC[0], shC[1]];
    const hTilt = (P.headTilt || 0) + lean2 * 0.6;
    const headC = [neckBase[0] + Math.sin(lean2 + (P.neck || 0)) * -headUp + (P.headDX || 0), neckBase[1] + Math.cos(lean2 + (P.neck || 0)) * headUp + (P.headDY || 0) + old * 0.18];

    // 四肢目标
    const arm = (side) => {
      const sh = side === 'r' ? shR : shL, spec = (P.arms && P.arms[side]) || {};
      let hand;
      if (spec.hand) hand = spec.hand;
      else {
        const a = (spec.ang ?? (side === 'r' ? 0.12 : -0.12) * (cy >= 0 ? 1 : -1)) + lean2;
        const reach = (R.upper + R.fore) * (spec.reach ?? 0.97);
        hand = [sh[0] - Math.sin(a) * reach * 0.2 + Math.sin(a) * reach * 0, sh[1] + reach];
        hand = [sh[0] + Math.sin(-a) * reach, sh[1] + Math.cos(a) * reach];
      }
      const bend = spec.bend ?? (side === 'r' ? -1 : 1) * (sy >= 0 ? 1 : -1);
      const j = ik(sh, hand, R.upper, R.fore, bend);
      return { sh, el: j.m, hand: j.end };
    };
    const leg = (side) => {
      const hp = side === 'r' ? hpR : hpL, spec = (P.legs && P.legs[side]) || {};
      const foot = spec.foot || [hp[0] * 0.9 + (side === 'r' ? -0.05 : 0.05) * rDir[0], 0];
      const bend = spec.bend ?? (sy >= 0 ? -1 : 1);
      const j = ik(hp, foot, R.thigh, R.shin, bend);
      return { hp, kn: j.m, ft: j.end, toe: spec.toe ?? 0 };
    };
    const A = { r: arm('r'), l: arm('l') }, L = { r: leg('r'), l: leg('l') };

    // —— 绘制（paint 把路径交给渲染方式：正常 / 剪影 / 铅笔） ——
    const mode = P.mode || 'flat';
    const sil = P.sil, sketch = mode === 'sketch';
    const alpha = P.alpha ?? 1;
    ctx.save();
    ctx.translate(P.x || 0, P.y || 0);
    const s = P.s || 30;
    ctx.scale(s * (P.flipX ? -1 : 1), s);
    if (P.rot) ctx.rotate(P.rot);
    const paint = (path, color, kind, a = 1, lw = 0) => {
      if (lw) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = css(sil || (sketch ? P.ink || '#5b5570' : color), alpha * a);
        ctx.lineWidth = lw * (sketch ? 0.8 : 1); ctx.stroke(path); return;
      }
      if (sketch) {
        if (kind === 'eye' || kind === 'mouth' || kind === 'blush' || kind === 'eyeHi') { if (kind === 'eye') { ctx.fillStyle = css(P.ink || '#5b5570', alpha * a); ctx.fill(path); } return; }
        if (P.wash) { ctx.fillStyle = css(P.washColor ? P.washColor(color) : color, alpha * a * P.wash); ctx.fill(path); }
        ctx.strokeStyle = css(P.ink || '#5b5570', alpha * 0.9); ctx.lineWidth = (P.inkW || 1.6) / s; ctx.lineJoin = 'round';
        ctx.stroke(path); return;
      }
      if (sil) { if (kind === 'eye' || kind === 'mouth' || kind === 'blush' || kind === 'eyeHi') return; ctx.fillStyle = css(sil, alpha * a); ctx.fill(path); return; }
      ctx.fillStyle = css(color, alpha * a); ctx.fill(path);
    };

    // 腿
    const legW = who === 'her' ? 0.25 : 0.32;
    const drawLeg = (g, far) => {
      const p = new Path2D();
      const c = far ? O.legsShade : O.legs;
      limb(p, g.hp, g.kn, legW * 1.18, legW * 0.98); limb(p, g.kn, g.ft, legW * 0.98, legW * 0.7);
      paint(p, c, 'leg');
      // 鞋：圆头，鞋尖朝前
      const q = new Path2D(), fx = g.ft[0], fy = g.ft[1], dir = sy >= 0 ? 1 : -1;
      const fl = R.foot * (0.42 + 0.58 * Math.abs(sy)), tilt = g.toe;
      const hgt = who === 'her' ? 0.26 : 0.32;
      q.moveTo(fx - dir * fl * 0.42, fy - hgt);
      q.bezierCurveTo(fx + dir * fl * 0.35, fy - hgt * 1.25 - tilt * 0.15, fx + dir * fl * 1.05, fy - hgt * 0.7 - tilt * 0.3, fx + dir * fl * 1.02, fy - 0.04 - tilt * 0.3);
      q.lineTo(fx - dir * fl * 0.42, fy + 0.02);
      q.closePath();
      paint(q, far ? mix(O.shoe, '#000000', 0.25) : O.shoe, 'shoe');
    };
    // 手臂：袖子从肩到腕渐细，袖口一圈，手是顺着前臂方向的小椭圆加拇指
    const drawArm = (g, far) => {
      const p = new Path2D(), w = who === 'her' ? 0.25 : 0.3;
      limb(p, g.sh, g.el, w * 1.16, w * 0.98); limb(p, g.el, g.hand, w * 0.98, w * 0.84);
      paint(p, far ? O.topShade : O.sleeve, 'arm');
      const fa = Math.atan2(g.hand[1] - g.el[1], g.hand[0] - g.el[0]);
      const cuff = new Path2D(), cx = g.hand[0] - Math.cos(fa) * R.handR * 0.55, cyy = g.hand[1] - Math.sin(fa) * R.handR * 0.55;
      cuff.ellipse(cx, cyy, w * 0.42, w * 0.9, fa, 0, TAU);
      paint(cuff, mix(far ? O.topShade : O.sleeve, '#000000', 0.14), 'cuff');
      const hr = R.handR * 0.86;
      const hx = g.hand[0] + Math.cos(fa) * hr * 0.45, hy = g.hand[1] + Math.sin(fa) * hr * 0.45;
      const q = new Path2D(); q.ellipse(hx, hy, hr * 1.12, hr * 0.86, fa, 0, TAU);
      const side = (g === A.r ? 1 : -1) * (sy >= 0 ? 1 : -1);
      const ta = fa - side * 1.25;
      q.moveTo(hx + Math.cos(ta) * hr * 0.6 + hr * 0.36, hy + Math.sin(ta) * hr * 0.6);
      q.ellipse(hx + Math.cos(ta) * hr * 0.6, hy + Math.sin(ta) * hr * 0.6, hr * 0.42, hr * 0.3, fa - side * 0.5, 0, TAU);
      paint(q, far ? C.skinShade : C.skin, 'hand');
      if (P.onHand) P.onHand(ctx, g === A.r ? 'r' : 'l', g, far);
    };
    // 层次：远侧手臂、远侧腿 → 胯/裙 → 躯干 → 近侧腿 → 头 → 近侧手臂
    const farArm = zR < zL ? A.r : A.l, nearArm = zR < zL ? A.l : A.r;
    const farLeg = zR < zL ? L.r : L.l, nearLeg = zR < zL ? L.l : L.r;
    const front = Math.abs(sy) < 0.35; // 接近正面/背面：两腿并排都算“近”
    const backView = cy < -0.35;
    if (!P.armsFront) drawArm(farArm, !front);
    drawLeg(farLeg, !front);
    if (front) drawLeg(nearLeg, false);

    const lx = Math.cos(lean2), ly = Math.sin(lean2);
    const at = (u, x) => [lerp(hip[0], shC[0], u) + x * lx, lerp(hip[1], shC[1], u) + x * ly];
    const sw = shHalfX, ww = R.waistHalf * Math.abs(cy) + R.thick * 0.5 * Math.abs(sy), hw = R.hipHalf * Math.abs(cy) + R.thick * 0.55 * Math.abs(sy);
    const fdir = sy >= 0 ? 1 : -1; // 侧面时脸朝的方向
    const prof = Math.abs(sy);

    // 胯部（他、她穿裤子时）
    if (who === 'him' || O.pants) {
      const p = new Path2D();
      const a = at(0.02, -hw * 1.0), b = at(0.02, hw * 1.0);
      p.moveTo(a[0], a[1]); p.lineTo(b[0], b[1]);
      p.quadraticCurveTo(hip[0] + hw * 0.98, hip[1] + 0.35, hip[0] + hw * 0.55, hip[1] + 0.5);
      p.lineTo(hip[0] - hw * 0.55, hip[1] + 0.5);
      p.quadraticCurveTo(hip[0] - hw * 0.98, hip[1] + 0.35, a[0], a[1]);
      p.closePath();
      paint(p, O.legs, 'pants');
    }
    // 裙子
    if (who === 'her' && !O.pants) {
      const p = new Path2D(), sw2 = P.skirtSwing || 0;
      const top = at(0.28, 0)[1];
      const len = (P.seat != null ? 1.55 : 2.25) + (O.coat ? 0.35 : 0);
      const fl = P.seat != null ? 0.22 : 0.46;
      const hwS = hw * 1.02;
      if (P.seat != null) {
        // 坐着：裙摆盖在大腿上往前伸
        const kn = nearLeg.kn;
        p.moveTo(hip[0] - hwS * 1.05, top); p.lineTo(hip[0] + hwS * 1.05, top);
        p.quadraticCurveTo(kn[0] + fdir * 0.4, kn[1] - 0.6, kn[0] + fdir * 0.42, kn[1] + 0.12);
        p.quadraticCurveTo(kn[0], kn[1] + 0.42, kn[0] - fdir * 0.55, kn[1] + 0.3);
        p.quadraticCurveTo(hip[0] - fdir * 0.6, hip[1] + 0.45, hip[0] - fdir * hwS * 1.1, hip[1] + 0.05);
        p.closePath();
      } else {
        const bx = hip[0] + sw2 * 0.22;
        const L0 = [hip[0] - hwS, top], R0 = [hip[0] + hwS, top];
        const L1 = [bx - hwS - fl + sw2 * 0.1, top + len], R1 = [bx + hwS + fl + sw2 * 0.1, top + len];
        p.moveTo(L0[0], L0[1]); p.lineTo(R0[0], R0[1]);
        p.quadraticCurveTo(R0[0] + fl * 0.35, top + len * 0.55, R1[0], R1[1]);
        p.quadraticCurveTo((L1[0] + R1[0]) / 2, top + len + 0.16 + 0.05 * sw2, L1[0], L1[1]);
        p.quadraticCurveTo(L0[0] - fl * 0.35, top + len * 0.55, L0[0], L0[1]);
        p.closePath();
      }
      paint(p, O.skirt, 'skirt');
      // 裙子暗面：远离光的一侧
      if (P.seat == null) {
        const q = new Path2D(), sd = -fdir;
        const a0 = [hip[0] + sd * hwS, top], a1 = [hip[0] + sd * hwS * 0.25, top];
        q.moveTo(a0[0], a0[1]); q.lineTo(a1[0], a1[1]); q.lineTo(hip[0] + sd * (hwS * 0.3) + (P.skirtSwing || 0) * 0.1, top + len + 0.1);
        q.lineTo(hip[0] + sd * (hwS + fl) + (P.skirtSwing || 0) * 0.3, top + len); q.closePath();
        paint(q, O.skirtShade, 'shade', 0.7);
      }
    }
    if (!front) drawLeg(nearLeg, false);

    // 脖子 + 下巴下的阴影
    {
      const p = new Path2D(), nw = R.neckW, top = [headC[0], headC[1] + 0.5];
      limb(p, top, [shC[0], shC[1] + 0.12], nw, nw * 1.06);
      paint(p, C.skin, 'neck');
      const q = new Path2D(); q.ellipse(headC[0] + sy * 0.06, headC[1] + 0.98, nw * 0.95, 0.12, 0, 0, TAU);
      paint(q, C.skinShade, 'neckShade', 0.55);
    }
    // 躯干：斜肩、肩头圆、腋下收、腰、下摆
    {
      const bodyPath = new Path2D();
      const nk = 0.3 + 0.08 * (who === 'him' ? 1 : 0);
      const bust = (who === 'her' ? 0.06 : 0.1) * prof;
      const pts = [
        at(1.0, -nk), at(0.985, -sw * 0.62), at(0.94, -sw * 0.97), at(0.82, -sw * 1.0), at(0.68, -sw * 0.9 - (fdir < 0 ? bust : 0)),
        at(0.36, -ww), at(0.06, -hw * 1.02), at(-0.05, -hw * 0.98),
        at(-0.05, hw * 0.98), at(0.06, hw * 1.02), at(0.36, ww),
        at(0.68, sw * 0.9 + (fdir > 0 ? bust : 0)), at(0.82, sw * 1.0), at(0.94, sw * 0.97), at(0.985, sw * 0.62), at(1.0, nk),
      ];
      smoothClosed(bodyPath, pts, 0.75);
      paint(bodyPath, O.top, 'body');
      // 暗面
      const sd = -fdir, k = 0.3 + 0.35 * prof;
      const sh = new Path2D();
      smoothClosed(sh, [at(0.95, sd * sw * 0.96), at(0.82, sd * sw), at(0.66, sd * sw * 0.9), at(0.36, sd * ww), at(0.04, sd * hw), at(-0.05, sd * hw * 0.98),
        at(-0.05, sd * hw * (1 - k)), at(0.38, sd * ww * (1 - k)), at(0.7, sd * sw * (1 - k * 0.9)), at(0.92, sd * sw * (1 - k * 0.7))], 0.7);
      paint(sh, O.topShade, 'shade', backView ? 0.55 : 0.8);
      // 下摆罗纹
      const hem = new Path2D(), h0 = at(0.03, -hw * 1.02), h1 = at(0.03, hw * 1.02), h2 = at(-0.05, hw * 0.98), h3 = at(-0.05, -hw * 0.98);
      hem.moveTo(h0[0], h0[1]); hem.lineTo(h1[0], h1[1]); hem.lineTo(h2[0], h2[1]); hem.lineTo(h3[0], h3[1]); hem.closePath();
      paint(hem, O.topShade, 'hem', 0.55);
      // 领口
      if (!backView) {
        const c0 = at(1.0, sy * 0.16);
        const nx = c0[0], ny = c0[1], wc = Math.abs(cy);
        const p = new Path2D();
        if (who === 'her') {
          // 开衫：V 领露出里面的浅色上衣，门襟一直到下摆
          p.moveTo(nx - (nk + 0.02) * wc - 0.05, ny + 0.02); p.lineTo(nx + (nk + 0.02) * wc + 0.05, ny + 0.02);
          p.lineTo(nx + sy * 0.12 + 0.08 * wc, ny + 1.05); p.lineTo(nx + sy * 0.12 - 0.08 * wc, ny + 1.05); p.closePath();
          if (!O.coat) paint(p, O.inner, 'collar');
          const g = new Path2D(), b0 = at(0.62, sy * 0.26), b1 = at(-0.04, sy * 0.3);
          g.moveTo(b0[0], b0[1]); g.lineTo(b1[0], b1[1]);
          if (!O.coat) paint(g, O.topShade, 'line', 0.8, 0.04);
          if (!O.coat && !O.pants) for (let k2 = 0; k2 < 3; k2++) { const b = at(0.5 - k2 * 0.16, sy * 0.27 + 0.07 * wc); const q = new Path2D(); q.arc(b[0], b[1], 0.055, 0, TAU); paint(q, '#f6e7c4', 'button', 0.95); }
        } else {
          // 毛衣：白衬衫领尖从圆领里翻出来
          p.moveTo(nx - (nk + 0.05) * wc - 0.03, ny - 0.02); p.lineTo(nx - 0.05, ny + 0.32); p.lineTo(nx + 0.05, ny + 0.32);
          p.lineTo(nx + (nk + 0.05) * wc + 0.03, ny - 0.02); p.lineTo(nx + 0.18 * wc, ny + 0.16); p.lineTo(nx, ny + 0.04); p.lineTo(nx - 0.18 * wc, ny + 0.16); p.closePath();
          paint(p, O.collar, 'collar');
          const rib = new Path2D(); rib.ellipse(nx, ny + 0.02, (nk + 0.06) * wc + 0.04, 0.12, lean2, 0, PI); paint(rib, O.topShade, 'line', 0.7, 0.07);
        }
      }
      // 大衣：长到大腿，门襟
      if (O.coat) {
        const p = new Path2D(), cl = who === 'her' ? 1.9 : 1.6;
        const a = at(0.1, -hw * 1.05), b = at(0.1, hw * 1.05);
        p.moveTo(a[0], a[1]); p.lineTo(b[0], b[1]);
        p.lineTo(b[0] + 0.18, b[1] + cl); p.lineTo(a[0] - 0.18, a[1] + cl); p.closePath();
        paint(p, O.top, 'coat');
        const q = new Path2D(), m0 = at(0.9, sy * 0.2), m1 = [at(0.1, sy * 0.2)[0], at(0.1, 0)[1] + cl];
        q.moveTo(m0[0], m0[1]); q.lineTo(m1[0], m1[1]); paint(q, O.topShade, 'line', 0.9, 0.05);
      }
      // 围巾
      if (O.scarf) {
        const c0 = at(1.0, 0), sc = new Path2D();
        sc.ellipse(c0[0] + sy * 0.08, c0[1] - 0.02, 0.58 * Math.abs(cy) + 0.36, 0.3, lean2, 0, TAU);
        paint(sc, O.scarf, 'scarf');
        if (!backView) { const tail = new Path2D(), tx = c0[0] + 0.14 + sy * 0.18; tail.moveTo(tx, c0[1] + 0.1); tail.lineTo(tx + 0.3 + (P.scarfSwing || 0) * 0.3, c0[1] + 1.35); tail.lineTo(tx - 0.02 + (P.scarfSwing || 0) * 0.3, c0[1] + 1.4); tail.lineTo(tx - 0.2, c0[1] + 0.15); tail.closePath(); paint(tail, mix(O.scarf, '#000000', 0.12), 'scarf'); }
      }
    }
    // 头
    ctx.save();
    ctx.translate(headC[0], headC[1]);
    ctx.rotate(hTilt);
    const hy = yaw + (P.headYaw || 0);
    head(ctx, { who, yaw: hy, age, expr: P.expr || {}, t: P.t || 0, big: P.big, hl: P.hl, hairSwing: P.hairSwing, glasses: P.glasses, noNeck: true, hairStyle: P.hairStyle }, paint);
    ctx.restore();
    if (P.armsFront) drawArm(farArm, !front);
    drawArm(nearArm, false);
    if (P.after) P.after(ctx, { A, L, hip, shC, headC });
    ctx.restore();
    return { A, L, hip, shC, headC, s, x: P.x || 0, y: P.y || 0 };
  }

  // ---------- 常用姿势 ----------
  // 走路：phase 0..1 一个完整步态周期；stride 步幅（局部单位）
  function walk(who, phase, o = {}) {
    const R = RIG[who];
    const { stride = 1.6, lift = 0.55, yaw = 1.2, armSwing = 0.45, run = 0 } = o;
    const dir = Math.sin(yaw) >= 0 ? 1 : -1;
    const fwd = Math.abs(Math.sin(yaw));
    const legPos = ph => {
      const a = ph * TAU;
      // 支撑相走直线，摆动相抬脚
      const sw = Math.sin(a) > 0 ? Math.sin(a) : 0;
      return [dir * stride * fwd * Math.cos(a) * 0.5, -lift * sw * (1 + run)];
    };
    const fr = legPos(phase), fl = legPos(phase + 0.5);
    const bob = -Math.abs(Math.cos(phase * TAU * 2)) * 0.12 * (1 + run * 1.5) + 0.06;
    const sideOff = R.hipHalf * 0.5 * Math.abs(Math.cos(yaw));
    return {
      yaw, bob, lean: dir * (0.04 + run * 0.18),
      legs: { r: { foot: [fr[0] - sideOff * (Math.cos(yaw) >= 0 ? 1 : -1), fr[1]], toe: Math.max(0, -fr[1]) }, l: { foot: [fl[0] + sideOff * (Math.cos(yaw) >= 0 ? 1 : -1), fl[1]], toe: Math.max(0, -fl[1]) } },
      arms: { r: { ang: -dir * armSwing * Math.cos(phase * TAU) * (1 + run * 0.8) * fwd, reach: lerp(0.96, 0.62, run), bend: -dir }, l: { ang: dir * armSwing * Math.cos(phase * TAU) * (1 + run * 0.8) * fwd, reach: lerp(0.96, 0.62, run), bend: -dir } },
      skirtSwing: Math.sin(phase * TAU * 2) * 0.4 * (1 + run), hairSwing: Math.sin(phase * TAU * 2 + 0.6) * (0.4 + run),
    };
  }

  MV.people = { RIG, OUTFIT, figure, head, walk, hairColor, ik };
})();
