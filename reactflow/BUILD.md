# 构建与部署说明

## 环境

- Node.js 24.22.1、npm 10.9.4（实测通过）
- 依赖：Vite 8 + React 19 + TypeScript + `@xyflow/react` 12.12.1（MIT）
- **没有 fork xyflow 仓库**，只用 `@xyflow/react` 当库依赖；`npm install` 可正常联网安装。

## 构建

```bash
cd reactflow-canvas
npm install
npm run build   # tsc -b && vite build
```

实测构建结果（2026-11-10）：

```
vite v8.3.7 building client environment for production...
dist/index.html                   0.46 kB
dist/assets/index-B3BMDkjk.css   18.85 kB
dist/assets/index-Cx89DEl2.js   425.41 kB (gzip 135.22 kB)
✓ built in 420ms
```

`dist/` 另有脚手架自带的 `favicon.svg`、`icons.svg`（未使用，可删）。
本地冒烟验证：`npx vite preview --port 4173` 后访问
`http://localhost:4173/video-canvas-workbench/`，返回的 HTML 标题为
“视频生成画布工作台”，JS/CSS 均带 `/video-canvas-workbench/` 前缀；
打包后的 JS 里包含面馆台词（如“帅哥，你筷子拿反了”）和“转 Seedance”模板。

## 部署到 GitHub Pages

`vite.config.ts` 已设 `base: '/video-canvas-workbench/'`，对应
https://buyanwz.github.io/video-canvas-workbench/

1. 把本目录内容（**不要**推 `node_modules/`，146MB）推到
   `buyanwz/video-canvas-workbench` 仓库。建议做法：用 GitHub Actions
   在 push 时自动 `npm install && npm run build` 并把 `dist/` 发布到 Pages；
   或者本地构建后把 `dist/` 的内容推到 `gh-pages` 分支。
2. 仓库 Settings → Pages → Source 选 GitHub Actions（或 `gh-pages` 分支）。
3. 注意：如果仓库 / 用户主页曾配过自定义域名（如 `buyan.asia`），
   Pages 地址会被重定向到自定义域名；域名 DNS 不通会打不开。
   本项目只用默认 `github.io` 地址，如遇重定向，先在 Pages 设置里
   清空自定义域名（自定义域名配在 `buyanwz.github.io` 用户主页仓库上，
   不在 `video-canvas-workbench` 仓库里）。

## 数据兼容

- 数据模型与单文件版（`~/workspace/github-video-canvas/index.html`）
  完全一致：clip 的 `title / who / time / dur / scene / line / camera /
  sound / mediaLink / color / custom`，另加可选的 `pos`（节点在画布上的位置）。
- IndexedDB 库名 `video-canvas-db`、localStorage 键 `video-canvas-v2`
  与单文件版相同，同一浏览器里两版可共用数据；JSON 导出格式也相同。
- 内置模板与单文件版一字相同（`src/data.ts` 的 `DEMO_FN`）。

## 限制

- **没有实时同步**：10 个人协作靠导出 / 导入 JSON 或 Git 提交项目 JSON，
  同一时间只由一个人改同一个项目，改完导出发给全组。
- **不上传视频**：工作台不保存任何视频文件，素材只存链接。
- 构建产物是静态站，可离线打开 `dist/index.html` 吗？——不行，
  打包后的 JS/CSS 用的是 `/video-canvas-workbench/` 绝对路径，
  需通过 HTTP 服务访问（GitHub Pages 或 `vite preview`）；单文件版
  仍可下载后直接双击打开。
