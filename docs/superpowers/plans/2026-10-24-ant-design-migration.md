# Ant Design Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 整体迁移到 React + Vite + Ant Design，兼容现有功能与线上部署。
**Architecture:** React 统一状态，纯 JS 模块负责筛选、分享链接、存储恢复；Ant Design 负责交互组件，SVG 保留趋势图。Vite 多入口构建后复制现有公开数据及月报。
**Tech Stack:** React、Vite、Ant Design、Node test runner、Playwright、Python unittest。
**Spec:** ../specs/2026-10-24-ant-design-migration-design.md（用户已确认）

## Global Constraints

- 主色 `#691eff`，保留用户指定系统字体栈、现有首页结构和六个任务入口。
- 保留 `ars-*` 本地存储、既有 hash 参数、中文 / 英文、明暗模式、收藏与对比。
- 保留 GitHub Pages `/awesome-paper-research-skills/` 子路径、数据下载、RSS、SEO、月报及每日更新。
- 不增加服务端、登录或业务功能；迁移验证通过后再部署。

## Review Focus

- 损坏的本地存储必须回退，不能导致白屏。
- 深链接覆盖保存偏好，旧收藏继续可用。
- 空数据、没有历史或不在榜单中的仓库必须安全呈现。
- 输入框与弹层内按键不能误触全局快捷键。
- 生产子路径、英文页及月报的资源必须完整。

### Task 1: Domain/state compatibility
**Files:** `src/domain.js`, `src/i18n.js`, `tests/frontend/domain.test.js`.
**Interfaces:** `filterItems(items,state)`, `restoreState(storage,hash,defaults,items)`, `serializeState(state)`, `detectAgents(item)`.
- [x] 测试组合筛选、六任务、五排序、损坏存储、旧 hash 与收藏，运行并确认失败。
- [x] 提取既有匹配规则与翻译，实现纯函数和参数校验；运行 Node 测试与 Python 全套测试。
- [x] 提交通过验证的模块。

### Task 2: React UI and production build
**Files:** `package.json`, `vite.config.js`, `scripts/build-site.mjs`, `src/main.jsx`, `src/App.jsx`, `src/components/*.jsx`, `src/styles.css`, `index.html`, `en/index.html`, `tests/frontend/ui.spec.js`.
**Interfaces:** Ant Design ConfigProvider theme and locale; global dataset loaded before React boot; JSX components use domain state.
- [x] 建立浏览器回归：搜索 / 任务、详情 / 收藏、三项对比、复制 / 下载、旧存储 / 分享链接、快捷键、空数据和手机布局；确认旧页面不能通过 Ant Design 控件检查。
- [x] 构建 React 页面与 Ant Design 组件，删除首页旧 DOM 应用入口；双入口保留元信息。
- [x] 构建脚本仅复制公开产物；检查英文、月报与数据下载资源。
- [x] 运行逻辑测试、生产构建、320/390/768/1440 浏览器回归与视觉检查；提交。

### Task 3: Deployment and verification
**Files:** `.github/workflows/ci.yml`, `.github/workflows/pages.yml`, `docs/frontend-development.md`, `tests/frontend/build.test.js`.
- [x] 产物测试断言中文 / 英文入口、数据、RSS、月报与样式完整且不包含开发脚本。
- [x] CI 增加 Node 测试和构建；Pages 用 Node 22、npm ci 和 dist；保留每日更新自动触发部署。
- [x] 全分支审查、修复重要问题，运行完整测试；合入 main 并推送。
- [ ] 等待 CI / Pages 成功并在正式网址复查核心交互；完成交付。
