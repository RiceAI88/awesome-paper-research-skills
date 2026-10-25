# Search Experience Implementation Plan

> 使用 superpowers:executing-plans 在当前会话完成，并在最后进行一次独立只读审查。

**Goal:** 提升站内工具搜索体验，不新增页面或外部服务。
**Architecture:** search.js封装同义词匹配/高亮范围；domain.filterItems复用该匹配；SearchBox复用Ant Design Input与候选listbox；SearchHighlight用于榜单和候选文本。
**Tech Stack:** React、Ant Design、Vite、Node测试、Playwright。
**Spec:** docs/superpowers/specs/2026-10-25-search-experience-design.md

## 约束
- 保留原始简介、URL/收藏/任务筛选和快捷键兼容。
- 手机、键盘、中文组合输入、深浅色可用；首屏脚本压缩后低于250kB。

## 验收步骤
- [x] 先写失败测试：同义词、精确名字、英文词边界、特殊字符与原文不变；实现搜索与高亮函数。
- [x] 先写浏览器失败测试：候选、方向键/回车/关闭、任务选择、触摸、中文输入法、现有过滤与高亮；实现SearchBox和结果高亮。
- [x] 验证全部Node/Python/浏览器测试及首屏预算，检查桌面手机和深浅色截图，完成独立只读审查。
- [ ] 提交并按现有流程发布，确认CI、Pages和线上专项交互。

## 执行记录

Node新增4项测试先RED后GREEN。浏览器新增6项覆盖任务/仓库候选、键盘上下/Enter/Escape/Tab、组合输入、触摸、深浅色、候选代码失败时基本搜索继续可用。额外等待两帧揭示重新展开时active被清空的问题，已将“关闭时重置”和“展开导航”分开，专项通过。

候选控制和展示在SearchSuggestions.jsx，聚焦后加载；SearchBox保留原Input DOM和组合输入状态，加载fallback为空避免重排。SearchHighlight和highlight.js以React mark分段显示原文。普通仓库/推荐来源链接改为原生a，保持href/target/rel与原样式，避免基础文本链接携带完整Typography功能。未修改Vite配置或抬高性能预算。手机初始应用脚本247984 bytes，低于250000。

全量验证：Node27、Python46、Playwright69项均通过；已检查390px英文浅色/深色候选截图。

用户中途提出页面/图表改版并询问意见，已核实“投稿审稿”当前默认匹配20项，独立“评审反馈”分类0项，已反馈方案；本次未实施新的页面/图表结构调整。

独立只读终审未发现实质问题；额外用真实Chromium触摸事件确认候选列表可滚动且不误选。
