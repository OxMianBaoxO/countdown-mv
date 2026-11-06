// 导演：按小节排镜头，处理转场、歌词层与后期
(() => {
  const { W, H, clamp, lerp, ease, sstep, bar, beatAt, barAt, beatTime, css, hash } = MV;
  const D = MV.draw;
  const list = [];
  MV.shot = def => { list.push(def); return def; };

  let buf = null, buf2 = null;
  const ensure = (c, w, h) => { if (!c || c.width !== w || c.height !== h) { c = D.makeCanvas(w, h); } return c; };

  const director = {
    list,
    init() {
      list.sort((a, b) => a.at - b.at);
      list.forEach((s, i) => { s.t0 = bar(s.at); s.i = i; });
      list.forEach((s, i) => { s.t1 = i + 1 < list.length ? list[i + 1].t0 : 1e9; });
    },
    shotAt(t) { let i = 0; while (i + 1 < list.length && list[i + 1].t0 <= t) i++; return i; },
    state(shot, t) {
      const lt = t - shot.t0, d = shot.t1 - shot.t0;
      return { t, lt, d, p: lt / d, t0: shot.t0, t1: shot.t1, b: beatAt(t) - beatAt(shot.t0), B: beatAt(t), m: barAt(t), shot };
    },
    drawShot(ctx, shot, t) {
      ctx.save();
      shot.draw(ctx, this.state(shot, t));
      ctx.restore();
    },
    // 渲染一帧。base: 虚拟 1920×1080 → 画布像素的变换
    render(ctx, t, base, lyrics) {
      const cw = ctx.canvas.width, ch = ctx.canvas.height;
      const i = this.shotAt(t);
      const cur = list[i], next = list[i + 1], prev = list[i - 1];
      // 当前所处的转场：入场转场以下一镜开头为中心
      let tr = null;
      // 转场下限：太短的叠化像跳切，统一给足时间（以拍为单位）
      const MIN = { fade: 1.4, dip: 1.3, wipe: 1.0, iris: 1.0, slide: 1.0, shutter: 0.8, flash: 0.9, whip: 0.6 };
      const span = (sh) => { const tt = sh.tin; if (!tt || tt.type === 'cut') return null; const d = Math.max(tt.dur ?? 1, MIN[tt.type] || 0) * MV.audioData.beatLen; const c = tt.center ?? 0.5; return [sh.t0 - d * c, sh.t0 + d * (1 - c), tt]; };
      if (next) { const sp = span(next); if (sp && t >= sp[0]) tr = { a: cur, b: next, sp }; }
      if (!tr) { const sp = span(cur); if (sp && t < sp[1] && prev) tr = { a: prev, b: cur, sp }; }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cw, ch);
      const apply = c => c.setTransform(base[0], 0, 0, base[0], base[1], base[2]);
      const clip = c => { c.beginPath(); c.rect(0, 0, W, H); c.clip(); };
      if (!tr) {
        ctx.save(); apply(ctx); clip(ctx); this.drawShot(ctx, cur, t); ctx.restore();
      } else {
        const [s0, s1, tt] = tr.sp;
        const u = clamp((t - s0) / (s1 - s0));
        const k = (tt.ease || ease.inOutCubic)(u);
        buf = ensure(buf, cw, ch);
        const b = buf.getContext('2d');
        b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, cw, ch);
        // 横移转场：前一镜往一边推出去，后一镜从另一边推进来（像镜头横摇）
        const sl = tt.type === 'slide' ? (tt.dir || 1) * W * k : 0;
        ctx.save(); apply(ctx); clip(ctx); if (sl) { ctx.translate(-sl, 0); clip(ctx); } this.drawShot(ctx, tr.a, t); ctx.restore();
        b.save(); apply(b); clip(b); if (sl) { b.translate((tt.dir || 1) * W - sl, 0); clip(b); } this.drawShot(b, tr.b, t); b.restore();
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (tt.type === 'fade') { ctx.globalAlpha = k; ctx.drawImage(buf, 0, 0); }
        else if (tt.type === 'slide') { ctx.drawImage(buf, 0, 0); }
        else if (tt.type === 'dip') {
          // 经过纯色：前半 A 渐隐到色，后半 B 从色浮现
          const col = tt.color || '#000000';
          if (k < 0.5) { ctx.fillStyle = css(col, ease.inOutSine(k * 2)); ctx.fillRect(0, 0, cw, ch); }
          else { ctx.fillStyle = css(col); ctx.fillRect(0, 0, cw, ch); ctx.globalAlpha = ease.inOutSine((k - 0.5) * 2); ctx.drawImage(buf, 0, 0); }
        } else if (tt.type === 'iris') {
          const x = base[1] + (tt.x ?? W / 2) * base[0], y = base[2] + (tt.y ?? H / 2) * base[0];
          const R = Math.hypot(Math.max(x, cw - x), Math.max(y, ch - y)) * 1.05;
          const r = lerp(tt.r0 ?? 0, R, k);
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(buf, 0, 0);
          if (tt.ring) { ctx.strokeStyle = css(tt.ring, 0.8 * (1 - k)); ctx.lineWidth = 4 * base[0]; ctx.stroke(); }
        } else if (tt.type === 'wipe') {
          // 软边擦除：方向 ang（弧度），边缘宽 soft（虚拟像素）
          const ang = tt.ang ?? 0, soft = (tt.soft ?? 240) * base[0];
          const cx = cw / 2, cy = ch / 2, ex = Math.cos(ang), ey = Math.sin(ang);
          const half = (Math.abs(ex) * cw + Math.abs(ey) * ch) / 2 + soft;
          const pos = lerp(-half, half, k);
          b.save(); b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'destination-in';
          const g = b.createLinearGradient(cx + ex * (pos - soft), cy + ey * (pos - soft), cx + ex * pos, cy + ey * pos);
          g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
          b.fillStyle = g; b.fillRect(0, 0, cw, ch); b.restore();
          ctx.drawImage(buf, 0, 0);
        } else if (tt.type === 'shutter') {
          // 光圈叶片：前一半收拢盖住 A，后一半张开露出 B
          const x = base[1] + (tt.x ?? W / 2) * base[0], y = base[2] + (tt.y ?? H / 2) * base[0];
          const R = Math.hypot(Math.max(x, cw - x), Math.max(y, ch - y)) * 1.08;
          if (k >= 0.5) { ctx.drawImage(buf, 0, 0); }
          const open = k < 0.5 ? 1 - ease.inCubic(k * 2) : ease.outCubic((k - 0.5) * 2);
          MV.film.aperture(ctx, x, y, R * open, R, (k < 0.5 ? k : 1 - k) * 1.6 + (tt.rot || 0), base[0]);
        } else if (tt.type === 'flash') {
          // 闪光：一下打白，白光里换成 B，再慢慢褪去
          const peak = tt.peak ?? 0.18;
          if (u >= peak) ctx.drawImage(buf, 0, 0);
          const wa = u < peak ? ease.outQuad(u / peak) : 1 - ease.inOutSine((u - peak) / (1 - peak));
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css(tt.color || '#fff8ee', wa); ctx.fillRect(0, 0, cw, ch);
          ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = css(tt.color || '#fff8ee', wa * 0.85); ctx.fillRect(0, 0, cw, ch);
        } else if (tt.type === 'whip') {
          // 甩镜：两镜一起朝一个方向急甩，中间拉出运动模糊
          const dir = tt.dir || 1, off = dir * cw * ease.inOutCubic(u);
          ctx.globalCompositeOperation = 'copy'; ctx.globalAlpha = 1;
          const tmp = MV.film.scratch(cw, ch), tg = tmp.getContext('2d');
          tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'copy'; tg.drawImage(ctx.canvas, 0, 0);
          ctx.globalCompositeOperation = 'source-over';
          const blur = Math.sin(Math.PI * u) * 0.12 * cw;
          for (let s = 0; s < 6; s++) {
            const o = (s / 5 - 0.5) * blur;
            ctx.globalAlpha = s === 0 ? 1 : 0.32;
            ctx.drawImage(tmp, -off + o, 0); ctx.drawImage(buf, dir * cw - off + o, 0);
          }
        } else { ctx.globalAlpha = k; ctx.drawImage(buf, 0, 0); }
        ctx.restore();
      }
      // 歌词层
      ctx.save(); apply(ctx); clip(ctx);
      MV.type.render(ctx, t, lyrics);
      ctx.restore();
      // 后期
      MV.film.post(ctx, t, base, this.look(t));
      return cur;
    },
    // 当前镜头的后期参数（镜头可在定义里写 look: {vignette, grain, warm}）
    look(t) {
      const sh = list[this.shotAt(t)];
      return Object.assign({}, MV.film.DEFAULT, sh && sh.look);
    },
    // 把某个镜头某一时刻画到一张小图里（相册里的旧照片用）
    snapshot(id, t, w, h) {
      const sh = list.find(s => s.id === id);
      const key = id + ':' + t + ':' + w;
      this._snaps = this._snaps || new Map();
      let c = this._snaps.get(key);
      if (!c && sh) {
        c = D.makeCanvas(w, h); const g = c.getContext('2d');
        const sc = w / W; g.setTransform(sc, 0, 0, sc, 0, 0);
        g.beginPath(); g.rect(0, 0, W, H); g.clip();
        this.drawShot(g, sh, t);
        this._snaps.set(key, c);
      }
      return c;
    },
  };
  MV.director = director;

})();
