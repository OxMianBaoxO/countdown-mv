// 查工程文件里有没有夹带唱词：和 assets/lyrics.lrc 的唱词连续重合 3 个字及以上就报出来。
// 只报文件和行号，从不打印唱词本身。用法：node tools/leak-check.mjs [文件或目录…]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sung = fs.readFileSync(path.join(root, 'assets/lyrics.lrc'), 'utf8')
  .split(/\r?\n/)
  .map(row => /^\[\d+:\d+(?:\.\d+)?\](.*)$/.exec(row))
  .filter(Boolean)
  .map(m => m[1].trim())
  .filter(text => text && !/[:：]/.test(text) && !/\s[-–—]\s/.test(text)); // 去掉片名行和署名行

const grams = new Set();
for (const line of sung) {
  const s = line.replace(/\s+/g, '');
  for (let i = 0; i + 3 <= s.length; i++) grams.add(s.slice(i, i + 3));
}

const targets = process.argv.slice(2).length ? process.argv.slice(2) : ['js', 'docs', 'css', 'index.html', 'README.md'];
const files = [];
const walk = p => {
  const abs = path.resolve(root, p);
  if (!fs.existsSync(abs)) return;
  if (fs.statSync(abs).isDirectory()) { for (const f of fs.readdirSync(abs)) walk(path.join(p, f)); return; }
  if (/\.(js|mjs|md|html|css|json|txt)$/.test(abs)) files.push(abs);
};
targets.forEach(walk);

let bad = 0;
for (const f of files) {
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    const s = line.replace(/\s+/g, '');
    let hits = 0;
    for (let k = 0; k + 3 <= s.length; k++) if (grams.has(s.slice(k, k + 3))) hits++;
    if (hits) { bad++; console.log(`${path.relative(root, f)}:${i + 1}  有 ${hits} 处与唱词重合`); }
  });
}
console.log(bad ? `共 ${bad} 行要改` : `检查了 ${files.length} 个文件，没有夹带唱词`);
process.exit(bad ? 1 : 0);
