# 猜城 345

猜城 345（Chinale 345）是一个网页版中国城市猜测游戏，题库覆盖 345 座城市。当前包含两个平行玩法：

- 天眼 345（Skyeye 345）：根据卫星影像判断目标城市。
- 版图 345（Boundary 345）：根据地级行政区版图、县级划分和驻地点判断目标城市。

两个玩法共享题库、输入检索、城市选择器、猜测记录、距离方向反馈和战绩逻辑。公共游戏引擎在 `src/core/game-core.js`，Vue 入口在 `src/main.js`，页面结构拆在 `src/components/`，每个玩法独立放在 `src/games/`，以后新增玩法只需要增加一个游戏配置文件并在入口中注册。

台湾六城的区级版图使用本地轻量 TopoJSON，来源为 Taiwan.md 整理自 `waiting7777/taiwan-vue-components` 的 MIT 授权数据。

本项目由 Codex 生成。

## 本地预览

安装依赖并启动 Vite 开发服务器：

```bash
npm install
npm run dev
```

然后访问 `http://127.0.0.1:4197/`。

## Vercel 部署

前端使用 Vue 3 + Vite 构建，`api/boundary.js` 是用于线上读取行政区划边界和县级版图边界的 Vercel API 代理。

在 Vercel 导入 GitHub 仓库时：

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
