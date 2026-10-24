# 前端开发

前端采用 React + Vite + Ant Design。Node.js 需要 22.12 或更高版本。

```bash
npm ci
npm run dev
```

开发地址为 Vite 输出地址下的 `/awesome-paper-research-skills/`，英文页为其 `en/` 子路径。

```bash
npm run build
npm test
python3 -m unittest discover -s tests -v
npx playwright install chromium
npm run test:e2e
```

前端单元测试使用 Node test runner；产物测试在构建后检查下载、SEO、月报与多入口。浏览器测试使用 Playwright，默认自动启动生产预览服务。用 `SITE_URL=https://riceai88.github.io/awesome-paper-research-skills/ npm run test:e2e` 可验证线上版本。

构建输出在 `dist/`，该目录不提交到 Git。Pages 工作流执行 `npm ci` 和 `npm run build`，只部署 `dist/`。Python 每日更新脚本仍维护根目录中的榜单与历史数据，自动提交后触发 Pages 重新构建。前端通过静态数据文件读取榜单；不调用需要令牌的 GitHub API。

`src/domain.js` 保存任务匹配、筛选排序和旧状态兼容逻辑；`src/i18n.js` 是双语文案；`src/App.jsx` 管理状态、布局与 Ant Design 主题；`src/components/` 包含榜单、详情和趋势组件。

所有新界面使用 Ant Design 的 `ConfigProvider`，主色为 `#691eff`，字体为既定系统字体栈。原 `assets/styles.css` 仅用于保留的静态月报，首页使用打包后的 `src/styles.css`。

收藏、对比和偏好继续使用原 `ars-*` localStorage 键，分享链接沿用既有 hash 参数。迁移不要求清理浏览器数据。
