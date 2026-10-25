# Ranking First Implementation Plan

> 使用executing-plans执行；按dispatching-parallel-agents将独立图表域分给子agent，最后统一验证。

**Goal:** 首屏更快到榜单，入口和图表更清晰。
**Architecture:** 复用现有组件重排，原生details压缩路径/分类，任务计数复用过滤规则，SVG图表保留现框架。
**Spec:** docs/superpowers/specs/2026-10-25-ranking-first-design.md
**Constraints:** 原文/数据口径/安装来源不变；仅按批准方案改浏览结构、呈现与统计；手机与双语；首屏应用JS<250kB。

- [x] 图表数学先RED后GREEN，趋势增长率/分类Bar/暖色线型，独立代理仅改图表域。
- [x] 根任务计数与近30日推送统计先测试，入口重排/分类次级/新手路径折叠/警示简化。
- [x] 新增布局验收并适配旧测试到新的意图：榜单在图表前、路径紧凑、胶囊counts、分类Bar、统计真实、手机无溢出。
- [x] Node/Python/Playwright、截图、首屏预算、独立只读审查。
- [ ] 提交发布并线上验证。

## 验收记录

- 任务计数与日期口径测试先失败后通过；图表增长率覆盖单点、零基准、下降、缺失日期。
- 新布局和跳转回归经历RED→GREEN，覆盖延迟表格以及初始空结果恢复。
- 独立只读审查发现空结果ready状态过期：改以视图及空/非空结果组合标识ready；对应测试RED→GREEN，无待处理审查项。
- 最终构建通过；Node 31/31、Python 46/46、Playwright 76/76（含手机首屏JS预算<250kB）通过。
- 桌面与中英文手机截图检查；SVG三线不同颜色/线型，全部分类数量位于图表边界内。
- 投稿审稿任务匹配20项；它与空的独立评审反馈主分类含义不同，保留原匹配规则并展示实际计数。
