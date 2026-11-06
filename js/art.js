// 插画底图：GPT 画的场景（assets/art/*.jpg）。负责预加载、按镜头运镜铺满画面、在矩形里贴图
(() => {
  const { W, H, clamp, lerp, ease } = MV;
  const imgs = new Map();
  const A = {};

  A.load = async ids => {
    await Promise.all(ids.map(id => new Promise(res => {
      if (imgs.has(id)) return res();
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => { imgs.set(id, im); res(); };
      im.onerror = () => { console.warn('缺图：' + id); res(); };
      im.src = `assets/art/${id}.jpg`;
    })));
    // 先解码，免得第一次出现时卡一帧
    await Promise.all([...imgs.values()].map(im => (im.decode ? im.decode().catch(() => {}) : null)));
  };
  A.img = id => imgs.get(id) || null;
  A.has = id => imgs.has(id);
  // 虚化版底图：先缩到 1/k 再放大回原尺寸（不用 ctx.filter——滤镜第一次用时 GPU 结果不稳定，导出会对不上）
  const softs = new Map();
  A.softImg = (id, k = 10) => {
    const key = id + '@' + k;
    let c = softs.get(key);
    const im = imgs.get(id);
    if (!c && im) {
      const iw = im.naturalWidth, ih = im.naturalHeight;
      const a = MV.draw.makeCanvas(Math.max(8, Math.round(iw / k)), Math.max(8, Math.round(ih / k)));
      const ga = a.getContext('2d'); ga.imageSmoothingQuality = 'high'; ga.drawImage(im, 0, 0, a.width, a.height);
      const b = MV.draw.makeCanvas(Math.round(iw / 2), Math.round(ih / 2));
      const gb = b.getContext('2d'); gb.imageSmoothingQuality = 'high'; gb.drawImage(a, 0, 0, b.width, b.height);
      c = MV.draw.makeCanvas(iw, ih);
      const gc = c.getContext('2d'); gc.imageSmoothingQuality = 'high'; gc.drawImage(b, 0, 0, iw, ih);
      softs.set(key, c);
    }
    return c || null;
  };

  // 铺满全屏：cam = { x, y：画面中心在图上的位置（0..1），z：放大倍数（1 = 刚好铺满），r：旋转 }
  A.plate = (ctx, id, cam = {}, o = {}) => {
    const im0 = imgs.get(id);
    if (!im0) { if (o.missing) { ctx.fillStyle = o.missing; ctx.fillRect(0, 0, W, H); } return null; }
    const im = o.soft ? A.softImg(id, o.soft) : im0;
    const iw = im0.naturalWidth, ih = im0.naturalHeight;
    const z = cam.z ?? 1, r = cam.r || 0;
    // 有旋转时多放大一点，免得露出边角
    const rotPad = 1 + Math.abs(Math.sin(r)) * 0.9;
    const sc = Math.max(W / iw, H / ih) * z * rotPad;
    const hw = W / (2 * sc * iw), hh = H / (2 * sc * ih);
    const cx = clamp(cam.x ?? 0.5, hw, 1 - hw), cy = clamp(cam.y ?? 0.5, hh, 1 - hh);
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.op) ctx.globalCompositeOperation = o.op;
    if (o.filter) ctx.filter = o.filter;
    ctx.translate(W / 2 + (cam.dx || 0), H / 2 + (cam.dy || 0));
    if (r) ctx.rotate(r);
    ctx.scale(sc, sc);
    ctx.drawImage(im, -cx * iw, -cy * ih, iw, ih);
    ctx.restore();
    // 压暗（代替 brightness 滤镜）
    if (o.dim) { ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha; ctx.fillStyle = `rgba(10,6,14,${o.dim})`; ctx.fillRect(-50, -50, W + 100, H + 100); ctx.restore(); }
    // 返回图到屏幕的映射，方便在图上的某个点放特效
    return { sc, cx, cy, iw, ih, r, toScreen: (u, v) => { const x = (u - cx) * iw * sc, y = (v - cy) * ih * sc; return [W / 2 + (cam.dx || 0) + x * Math.cos(r) - y * Math.sin(r), H / 2 + (cam.dy || 0) + x * Math.sin(r) + y * Math.cos(r)]; } };
  };

  // 在矩形里贴图（cover 裁切）。fx, fy：裁切时的对齐（0..1）
  A.draw = (ctx, id, x, y, w, h, o = {}) => {
    const im = imgs.get(id); if (!im) return;
    const iw = im.naturalWidth, ih = im.naturalHeight;
    const sc = Math.max(w / iw, h / ih) * (o.z || 1);
    const sw = w / sc, sh = h / sc;
    const sx = (iw - sw) * (o.fx ?? 0.5), sy = (ih - sh) * (o.fy ?? 0.5);
    ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha; if (o.filter) ctx.filter = o.filter;
    ctx.drawImage(im, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
  };

  // 运镜：在 [a, b] 秒内从 c0 到 c1
  A.move = (t, a, b, c0, c1, e = ease.inOutSine) => {
    const u = e(clamp((t - a) / (b - a)));
    const out = {};
    for (const k of new Set([...Object.keys(c0), ...Object.keys(c1)])) out[k] = lerp(c0[k] ?? (k === 'z' ? 1 : k === 'x' || k === 'y' ? 0.5 : 0), c1[k] ?? (k === 'z' ? 1 : k === 'x' || k === 'y' ? 0.5 : 0), u);
    return out;
  };

  MV.art = A;
})();
MV.prepare = () => MV.art.load(MV.ART_LIST || []);
