# 视频生成画布工作台

一个免费、不用登录、不用服务器的视频生成画布工作台，适合工作室多人一起用。

## 打开方式

直接打开：

https://buyanwz.github.io/video-canvas-workbench/

也可以下载本仓库的 `index.html`，用浏览器打开即用。整个工作台就是这一个文件，没有外部 CDN、没有登录、没有服务器。

## 能做什么

- 左边画布：分镜卡片按顺序排，点选、拖动换顺序、上移 / 下移、复制、删除。
- 右边可视化编辑（不用写代码）：改选中卡片的标题、人物（A / B）、时间、时长、画面、台词、运镜、音效、素材链接。
- 台词一字不差：台词只用于配音，画面内不烧录字幕。
- 自定义字段：给卡片加“参考图”“配音”等字段。
- 添加功能：自己起个名字、填个转换模板（可用 `{scene} {line} {who} {dur} {camera} {sound} {time} {title}`），内置“转 Seedance”和“转 Muse”，都可以改、可以删。
- 多项目：新建 / 切换 / 改名 / 复制 / 删除项目。预装一个“面馆示例”项目（6 条分镜），见 `projects/noodle-demo.json`。
- 复制全部：按第一个功能模板，把当前项目所有卡片一次转成提示词并复制。

## 数据存在哪里

数据存在你自己浏览器的 IndexedDB 里（不支持时自动用 localStorage 备用）。换电脑、换浏览器、清浏览器数据都会丢本地数据，所以请经常导出 JSON 备份。

## 10 个人怎么协作

这个工作台没有账号和实时同步，协作靠下面两种免费方式：

1. **导出 / 导入 JSON（推荐，平时就用这个）**
   - 每个人都打开同一个 Pages 链接。
   - 改完后点右边“导出当前项目 JSON”或“导出全部项目 JSON”，把 JSON 文件发给同事（微信 / 钉钉 / 云盘都行）。
   - 同事在工作台里点“导入 JSON”，项目就出现在他的画布里。
   - 约定一个规则避免互相覆盖：同一时间只由一个人改同一个项目，改完导出发给全组；或者每人负责不同项目。

2. **通过 GitHub 仓库协作**
   - 项目 JSON 也可以提交到本仓库的 `projects/` 目录（例如 `projects/xxx.json`），大家用 Git 拉取 / 提交，改动有版本历史，改错了可以回滚。
   - 工作台本身的改动（改 `index.html`）也走 GitHub：提 Pull Request，合并后 GitHub Pages 自动更新。

## 视频原片放哪里（重要）

**不要把视频原片放进这个工作台，也不要放进 GitHub 仓库。**

- GitHub 单个文件限 100MB，仓库建议在 1GB 以内，超过 1G 的原片根本放不下。
- 正确做法：原片放在云盘 / 对象存储（例如 Cloudflare R2 免费 10GB、Google Drive 等），只把链接填进卡片的“素材链接”字段。
- 工作台和导出的 JSON 里只存分镜、台词、提示词和链接，不存视频文件本身。

## 文件说明

- `index.html`：完整工作台，唯一需要部署的文件。
- `projects/noodle-demo.json`：预装的“面馆示例”项目（6 条分镜），可直接在工作台里导入。
- `README.md`：本说明。

## 部署（GitHub Pages）

1. 把本仓库推到 GitHub，仓库名 `video-canvas-workbench`，公开（Public）。
2. 在仓库 Settings → Pages → Source 选 `Deploy from a branch`，分支选 `main`，目录选 `/ (root)`。
3. 等一两分钟，打开 https://buyanwz.github.io/video-canvas-workbench/ 即可使用。
