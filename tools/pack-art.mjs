// 把 art/*.png（GPT 画的原图）压成网页用的 assets/art/*.jpg；原图比 jpg 新才重压。
// 同时写出 js/art-list.js：播放器开场时预加载这些图
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ffmpeg = process.env.FFMPEG || 'D:/oopz/ffmpeg.exe';
const src = path.join(root, 'art'), dst = path.join(root, 'assets/art');
fs.mkdirSync(dst, { recursive: true });
const ids = [];
let made = 0;
for (const f of fs.readdirSync(src).filter(f => f.endsWith('.png')).sort()) {
  const id = f.slice(0, -4), out = path.join(dst, id + '.jpg');
  ids.push(id);
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(path.join(src, f)).mtimeMs) continue;
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(src, f), '-q:v', '2', out]);
  made++;
}
fs.writeFileSync(path.join(root, 'js/art-list.js'), `// 由 tools/pack-art.mjs 生成：assets/art 里的插画\nMV.ART_LIST = ${JSON.stringify(ids)};\n`);
console.log(`共 ${ids.length} 张，新压 ${made} 张`);
