# 视频生成画布工作台（React Flow 版）

React Flow（@xyflow/react，MIT）无限画布版的视频生成分镜工作台。
**没有 fork xyflow 整个仓库**——只把它当作库依赖使用。

线上地址：https://buyanwz.github.io/video-canvas-workbench/

## 能做什么

- **React Flow 无限画布**：缩放、平移、迷你地图；每张分镜卡片是一个自定义节点，显示标题、人物、时间/时长、画面、台词；卡片按顺序用箭头连起来（第 1 条 → 第 2 条 → …）。
- **自由拖动**：拖节点任意摆放，位置会保存；也可以点“自动排版”恢复整齐排列；右边还有 ↑/↓ 顺序按钮（会改变连线顺序）。
- **右边可视化编辑**：点节点，右边改标题、人物 A/B、时间、时长、画面、台词（一字不差）、运镜、音效、素材链接、卡片颜色。
- **自定义字段**：给卡片加“参考图：图1”“配音：儿童男声”等。
- **添加功能**：名字 + 转换模板，占位符 `{scene} {line} {who} {dur} {camera} {sound} {time} {title}`。内置“转 Seedance”和“转 Muse”，和单文件版模板一字相同，都可以改、可以删。
- **多项目**：新建 / 切换 / 改名 / 复制 / 删除项目，预装“面馆示例”（6 条分镜，见 `projects/noodle-demo.json`）。
- **导出 / 导入 JSON**：当前项目、全部项目；导入兼容单文件版导出的格式（`video-canvas-all`、`video-canvas-project`、裸卡片数组、旧 `{clips, funcs}`）。
- **复制全部**：按第一个功能模板，把当前项目所有卡片一次转成提示词并复制（剪贴板 API → execCommand → 手动选中，三层兜底）。
- **存储**：IndexedDB（本机浏览器），不支持时自动用 localStorage 备用；数据结构与单文件版相同，可互相导入。

## 视频原片放哪里（重要）

**不要把视频原片放进这个工作台，也不要放进 GitHub 仓库。**
GitHub 单个文件限 100MB、仓库约 1GB，超过 1G 的原片放不下。
正确做法：原片放在云盘 / 对象存储（例如 Cloudflare R2 免费 10GB），只把链接填进卡片的“素材链接”字段。

## 10 个人怎么协作

没有账号和实时同步，协作靠导出 / 导入 JSON（一个人改一个项目，改完导出发给全组）
或走 GitHub（项目 JSON 提交到 `projects/`，改动有版本历史）。
详见 `BUILD.md` 的限制说明。

## 本地开发

```bash
npm install
npm run dev     # 本地预览
npm run build   # 生成 dist/
```

详见 `BUILD.md`。

## 源码与备份

- 源码在 `reactflow/` 目录：`cd reactflow && npm install && npm run build`，构建产物在 `reactflow/dist/`，线上根目录的 `index.html` + `assets/` 就是这份构建产物。
- 单文件旧版备份在 `legacy/single-file/index.html`，下载后用浏览器直接打开就能用。
- 底座是 `@xyflow/react`（MIT），只当库依赖用，没有 fork 整个 xyflow 仓库。
