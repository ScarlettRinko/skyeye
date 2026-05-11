# Skyeye China

一个静态网页版天眼猜城市游戏。

## 本地预览

直接打开 `index.html`，或者在项目目录运行一个静态服务器：

```bash
python -m http.server 4187
```

然后访问 `http://127.0.0.1:4187/`。

## Vercel 部署

这是纯静态项目，不需要安装依赖，也不需要构建命令。

在 Vercel 导入 GitHub 仓库时：

- Framework Preset: `Other`
- Build Command: 留空
- Output Directory: 留空或 `.`
- Install Command: 留空
