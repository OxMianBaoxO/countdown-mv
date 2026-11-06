// 生成逐字对齐用的初始窗口：每句从 LRC 时间起唱，到下一句前结束，分段按字数分配（拍为单位，相对句首）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'js/audio-data.js'), 'utf8');
const A = JSON.parse(src.slice(src.indexOf('MV.audioData = ') + 15, src.lastIndexOf(';')));
const beats = A.beatsDP;
const beatAt = t => { let i = 0; while (i + 1 < beats.length && beats[i + 1] <= t) i++; return i + (t - beats[i]) / ((beats[i + 1] ?? beats[i] + A.beatLen) - beats[i]); };
const lines = fs.readFileSync(path.join(root, 'assets/lyrics.lrc'), 'utf8').split(/\r?\n/)
  .map(r => /^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/.exec(r)).filter(m => m && m[3].trim() && !/[:：]/.test(m[3]) && !/\s[-–—]\s/.test(m[3]))
  .map(m => ({ t: +m[1] * 60 + +m[2], parts: m[3].trim().split(/\s+/) }));
const out = {};
lines.forEach((L, i) => {
  const next = lines[i + 1] ? lines[i + 1].t : L.t + 5.5;
  const b0 = beatAt(L.t), span = Math.max(1, beatAt(Math.min(next - 0.15, L.t + 6)) - b0);
  const total = L.parts.reduce((s, p) => s + [...p].length, 0);
  let acc = 0; const starts = [], sing = [];
  for (const p of L.parts) { const n = [...p].length; starts.push(+(span * acc / total).toFixed(3)); sing.push(+(span * n / total * 0.92).toFixed(3)); acc += n; }
  out[i + 1] = { starts, sing };
});
fs.writeFileSync(path.join(root, '.cache/seed-timing.js'), 'MV.LYRIC_TIMING = ' + JSON.stringify(out) + ';\n');
console.log('写好', Object.keys(out).length, '句的初始窗口');
