# 榜单浏览体验 Implementation Plan

> 执行：superpowers:executing-plans，逐项验证，不中途增加审批。

**Goal:** 实现吸顶筛选/表头和当前结果内详情连续浏览。
**Architecture:** 原生 CSS sticky + Ant Design Table sticky；ResizeObserver 计算筛选栏高度。沿现有 visible 数据传递相邻项目给 Drawer，保持 lazy 加载。
**Tech Stack:** React、Ant Design、Vite、Playwright。
**Spec:** docs/superpowers/specs/2026-10-25-ranking-browsing-design.md

## 约束
- 只修改浏览交互，保持现有配色、原始简介、筛选/排序状态与 URL 兼容。
- 中英文、390px 手机和桌面可用；首屏应用脚本压缩后仍低于250kB。

## 步骤与验收
- [x] 添加 Playwright 行为测试并观察失败：滚动后筛选/表头位置，横向同步，移动端无溢出。
- [x] App测量筛选高度，RepositoryViews传给Table sticky，移除阻止吸顶的祖先overflow，验证表头不遮挡首行。
- [x] 添加详情导航测试：当前排序与筛选、首尾、单结果、分享链接结果外、切换时内容回顶、关闭恢复位置及键盘焦点。
- [x] Drawer复用当前结果导航，保留URL更新和已有抽屉功能，通过对应测试。
- [x] 运行Node/Python/浏览器回归、首屏预算；检查桌面/手机截图；独立只读终审，修复实质问题。
- [ ] 按现有发布方式提交推送并验证CI、Pages和线上目标交互。

## 执行记录

先运行5项新测试，均因吸顶或导航尚未实现失败。实现后专项5项通过。原生Drawer使用preventScroll恢复焦点，已验证导航后关闭仍回到原卡片；页面状态异步加载引发的正常重排由浏览器锚定保持可见位置，因此按原卡片的屏幕位置验证，而不强制还原绝对scrollY。筛选高度采用向上取整避免亚像素重叠，表头测试使用同一口径。

验证：Node 23项、Python 46项、Playwright 63项全部通过；首屏250kB预算与可选组件延迟加载回归通过。已检查1440px/390px吸顶截图与390px英文详情截图；独立只读审查未发现实质问题。
