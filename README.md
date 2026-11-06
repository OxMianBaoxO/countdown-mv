<div align="center">

<img src="media/cover.jpg" alt="最后一张 · 《倒数》" width="100%">

# 最后一张 · 《倒数》

**邓紫棋《倒数》MG 动画 MV —— 一盒只有十张的拍立得**

<img src="https://img.shields.io/badge/%E6%97%B6%E9%95%BF-3%3A49-e8a87c?style=for-the-badge" alt="时长 3:49">
<img src="https://img.shields.io/badge/%E7%94%BB%E8%B4%A8-1080p%20%C2%B7%2060fps-e8a87c?style=for-the-badge" alt="画质 1080p · 60fps">
<img src="https://img.shields.io/badge/%E9%95%9C%E5%A4%B4-63%20%E4%B8%AA-e8a87c?style=for-the-badge" alt="镜头 63 个">
<img src="https://img.shields.io/badge/%E6%B8%B2%E6%9F%93-Canvas%20%E5%AE%9E%E6%97%B6-e8a87c?style=for-the-badge&logo=html5&logoColor=white" alt="渲染 Canvas 实时">

<br><br>

<a href="https://github.com/OxMianBaoxO/countdown-mv/releases/latest"><img src="https://img.shields.io/badge/%E2%96%B6%20%E8%A7%82%E7%9C%8B%E6%88%90%E7%89%87-%E4%B8%8B%E8%BD%BD%201080p%20MP4-111111?style=for-the-badge&labelColor=e8a87c" alt="观看成片"></a>

</div>

<br>

## ✨ 亮点

- 🎞️ **插画 × 代码**：GPT 绘制原画，运镜、光影、粒子、景深全部由网页实时计算
- 📸 **拍立得系统**：取景框、显影、翻牌计数、自拍红灯，都是程序动画
- 🌸 **胶片质感**：颗粒、漏光、暗角、冷暖调色与光圈转场
- 🛠️ **自动化工具**：无头 Edge 截帧、拼联系表、测帧耗时

## 🖼️ 剧照

<table>
  <tr>
    <td width="50%"><img src="media/shot-1.jpg" width="100%"></td>
    <td width="50%"><img src="media/shot-2.jpg" width="100%"></td>
  </tr>
  <tr>
    <td width="50%"><img src="media/shot-3.jpg" width="100%"></td>
    <td width="50%"><img src="media/shot-4.jpg" width="100%"></td>
  </tr>
</table>

## 🎧 关于音乐

> [!NOTE]
> 这是**非官方同人作品**，歌曲版权归原作者及唱片公司所有。仓库里只有画面源码，**不含音频和歌词文件**。
>
> 想在本地运行，请自备正版音频，放到 `assets/song.mp3`（音乐）和 `assets/lyrics.lrc`（歌词）。只想看成片的话，直接去 [Releases](https://github.com/OxMianBaoxO/countdown-mv/releases/latest) 下载 MP4。

---

邓紫棋《倒数》的 MG 动画 MV。画面是 GPT 画的插画，代码负责运镜、光影、粒子、取景框、拍立得显影、翻牌计数、转场、歌词与胶片质感，全部在网页里实时渲染。

故事：一盒拍立得只有十张。她一直舍不得用，要留给樱花开的时候、去那家餐厅的时候、去巴黎的时候、求婚的时候——直到看见相纸盒上的保质期，她第一次按下了快门。后来的每一张都给了日常；第九张对着空椅子，怎么也显不出影。最后一张用自拍定时器，十秒倒数，两个人第一次一起出现在照片里，闪光亮起的那一刻，满街的花苞一齐开了。

## 怎么看

- 双击 `播放MV.cmd`：启动本地服务器（端口 8799）并用默认浏览器打开。
- 或者在本目录运行 `node tools/serve.mjs 8799`，打开 http://127.0.0.1:8799/ 。
- 不要直接双击 `index.html`（file:// 打开时浏览器不让读音乐和歌词）。

快捷键：空格 暂停 · F 全屏 · ← → 快退快进 5 秒 · 1～5 跳到各段 · D 显示镜号与帧率 · [ ] 调整音画偏移

## 素材

- `assets/song.mp3`、`assets/lyrics.lrc`：你提供的音乐和歌词。歌词只从 LRC 读取，代码和文档里不写歌词（`node tools/leak-check.mjs` 检查）。
- `art/*.png`：GPT 画的原图（`art/jobs.json` 是每张图的画面描述）；`assets/art/*.jpg` 是给网页用的压缩版。
  - 补图：`node tools/gen-art.mjs 3`（只画缺的）；压缩：`node tools/pack-art.mjs`。
- 字体用系统里的思源宋体 / 思源黑体（Noto Serif SC / Noto Sans SC）和 Bahnschrift。

## 文件

| 文件 | 内容 |
|---|---|
| `docs/分镜脚本.md` | 立意、视觉语言、63 个镜头 |
| `js/shots-1.js` | 前奏 + 主歌一 + 导歌一：抽屉、装片、取景框里的"以后"、保质期、他回头 |
| `js/shots-2.js` | 副歌一：第一张、自拍、显影、贴在心口、捂热、跳舞、白色涂鸦 |
| `js/shots-3.js` | 主歌二 + 导歌二 + 副歌二：日出、雨、两个杯子、便利贴、眼睛、星轨、跨年夜倒数、零点烟花、吻、雪 |
| `js/shots-4.js` | 桥段 + 导歌三 + 副歌三 + 尾声：冷掉的咖啡、灰照片、光轨、自拍定时、花开、一墙照片、拼图、白头 |
| `js/instax.js` | 拍立得：相机、照片显影、取景框、翻牌计数、自拍红灯 |
| `js/fx.js` | 光束、尘埃、光斑、梦境晕开、铅笔线、星轨、光轨、白雾、涂鸦 |
| `js/look.js` | 胶片后期（颗粒、漏光、暗角、冷暖）与光圈转场 |
| `js/art.js` | 插画底图的加载与运镜 |
| `js/director.js` `js/app.js` `js/core.js` `js/lrc.js` `js/type.js` | 播放引擎：镜头表、转场、歌词、节拍（82 BPM） |
| `tools/shoot.mjs` | 在独立的无头 Edge 里截帧、拼联系表、测帧耗时 |

截帧检查：`node tools/shoot.mjs sheet 0 229 2 --cols 8 --tw 240`（图在 `.cache/shots/`）。

---

<div align="center">
<sub>用代码一帧一帧画出来的 MV · 由 <a href="https://github.com/OxMianBaoxO">@OxMianBaoxO</a> 制作</sub>
</div>
