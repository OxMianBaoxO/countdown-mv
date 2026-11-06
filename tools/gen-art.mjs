// 批量让 GPT（本机 Codex 的图像生成）画插画。任务表在 art/jobs.json，结果存成 art/<id>.png，已有的跳过。
// 用法：node tools/gen-art.mjs [并发数=3] [只跑这些 id…]
// 每个任务：{ id, orient: 'landscape'|'portrait', scene, chars?: true, base?: 'art/xxx.png', after?: ['id'] }
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CODEX = 'C:/Users/32190/AppData/Local/OpenAI/Codex/bin/37f54d68e5533a51/codex.exe';
const GEN = path.join(process.env.USERPROFILE || 'C:/Users/32190', '.codex', 'generated_images');
const args = process.argv.slice(2);
const conc = +(args.find(a => /^\d+$/.test(a)) || 3);
const only = args.filter(a => !/^\d+$/.test(a));
const jobs = JSON.parse(fs.readFileSync(path.join(root, 'art/jobs.json'), 'utf8'));
const logFile = path.join(root, '.cache/gen-log.txt');
fs.mkdirSync(path.dirname(logFile), { recursive: true });
const log = s => { const line = `[${new Date().toLocaleTimeString()}] ${s}`; console.log(line); fs.appendFileSync(logFile, line + '\n'); };

const STYLE = path.join(root, 'art/test-living.png'), CHARS = path.join(root, 'art/ref-couple.png');
const out = id => path.join(root, 'art', id + '.png');

function promptFor(j) {
  const parts = ['Use your image generation tool to create exactly ONE image. Do not write code, do not run shell commands, do not create or copy files yourself. When done, reply with one short line.', ''];
  parts.push('Attached image 1 is the STYLE reference: match its art style, rendering quality, soft painterly anime-style lighting, gentle grain and warm film color palette exactly.');
  if (j.chars !== false) parts.push('Attached image 2 is the CHARACTER SHEET: the young woman (short straight black bob with blunt bangs, mustard-yellow knit cardigan, cream top, dark teal skirt, brown flats) and the young man (short messy black hair, round thin-rimmed glasses, navy-blue knit sweater with white shirt collar, dark gray trousers) must look exactly like these two characters (unless the scene says they wear other clothes or are older).');
  if (j.base) parts.push('The LAST attached image is the BASE: keep its exact composition, camera angle and framing, and change only what the scene describes.');
  parts.push('', `Image (${j.orient === 'portrait' ? 'portrait, 1024x1536' : 'landscape, 1536x1024'}): ${j.scene}`);
  parts.push('No text, no letters, no numbers, no logos, no watermark, no borders, no frames around the picture.');
  return parts.join('\n');
}

function run(j) {
  return new Promise(resolve => {
    const imgs = [STYLE]; if (j.chars !== false) imgs.push(CHARS); if (j.base) imgs.push(path.join(root, j.base));
    const a = ['exec', '--skip-git-repo-check', '-s', 'read-only', '--color', 'never'];
    for (const f of imgs) a.push('-i', f);
    a.push('--', '-');
    const p = spawn(CODEX, a, { cwd: root, windowsHide: true });
    let text = '';
    p.stdout.on('data', d => { text += d; }); p.stderr.on('data', d => { text += d; });
    p.stdin.end(promptFor(j));
    const timer = setTimeout(() => { p.kill(); }, 14 * 60 * 1000);
    p.on('exit', () => {
      clearTimeout(timer);
      const m = /session id:\s*([0-9a-f-]+)/i.exec(text);
      let ok = false;
      if (m) {
        const dir = path.join(GEN, m[1]);
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir).filter(f => f.endsWith('.png')).map(f => path.join(dir, f)).sort((x, y) => fs.statSync(y).mtimeMs - fs.statSync(x).mtimeMs);
          if (files.length) { fs.copyFileSync(files[0], out(j.id)); ok = true; }
        }
      }
      if (!ok) fs.writeFileSync(path.join(root, '.cache', `gen-fail-${j.id}.txt`), text);
      log(`${ok ? '完成' : '失败'} ${j.id}${ok ? '' : '（输出见 .cache/gen-fail-' + j.id + '.txt）'}`);
      resolve(ok);
    });
  });
}

const todo = jobs.filter(j => (!only.length || only.includes(j.id)) && !fs.existsSync(out(j.id)));
log(`开始：${todo.length} 张，并发 ${conc}`);
const running = new Set(), done = new Set(jobs.filter(j => fs.existsSync(out(j.id))).map(j => j.id)), failed = new Set();
await new Promise(resolveAll => {
  const pump = () => {
    if (!todo.length && !running.size) return resolveAll();
    while (running.size < conc) {
      const i = todo.findIndex(j => (j.after || []).every(d => done.has(d) || failed.has(d)));
      if (i < 0) break;
      const j = todo.splice(i, 1)[0];
      running.add(j.id);
      log(`开始 ${j.id}`);
      run(j).then(ok => { running.delete(j.id); (ok ? done : failed).add(j.id); pump(); });
    }
    if (!running.size && todo.length) { log('剩下的任务依赖失败的任务，跳过：' + todo.map(j => j.id).join(', ')); todo.length = 0; resolveAll(); }
  };
  pump();
});
log(`结束：成功 ${done.size}，失败 ${failed.size}`);
