# Skyeye 345

Skyeye 345 是一个网页版天眼猜城市游戏，题库覆盖 345 座中国城市。玩家需要根据卫星影像判断目标城市，并在每次猜测后根据距离、方向和行政区划轮廓继续缩小范围。

本项目由 Codex 生成。

## 本地预览

直接打开 `index.html`，或者在项目目录运行一个静态服务器：

```bash
python -m http.server 4187
```

然后访问 `http://127.0.0.1:4187/`。

## Vercel 部署

本项目不需要安装依赖，也不需要构建命令。前端页面为静态文件，`api/boundary.js` 是用于线上读取行政区划边界的 Vercel API 代理。

在 Vercel 导入 GitHub 仓库时：

- Framework Preset: `Other`
- Build Command: 留空
- Output Directory: 留空或 `.`
- Install Command: 留空
