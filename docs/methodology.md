# 排名方法

本仓库使用可解释规则筛选科研 Skills 及相关科研工具。关键词筛选是候选相关性判断，不等同于人工安装核验。所有规则都在 [`scripts/update_rankings.py`](../scripts/update_rankings.py) 中实现，可审计、可复现。

## 候选发现

- `config/ranking.json` 中的 `seed_repositories` 会被直接拉取元数据。
- `search_queries` 通过 GitHub Search API 搜索候选仓库（限定 `stars:>=100 fork:false archived:false`）。
- 搜索仅用于发现新项目：保留 20 组按 Stars 排序的热门搜索（每组最多 200 条），另外对 6 组精准学术查询执行最近 30 天有更新搜索，并按 100–499、500–1999、2000–9999、≥10000 Stars 分段、按最近更新排序（每组最多 100 条）。避免发现范围始终被同一批高 Stars 仓库占据。
- 这些搜索仍有截断限制，不保证覆盖全 GitHub；`incomplete_results`、排序、策略和截断会记入采集报告。
- 已收录项目、历史首次收录记录和候选库中的项目，每次均独立请求仓库元数据；不再因跌出搜索前 200 条而掉榜。名称按大小写不敏感去重，改名保留别名。
- `data/repository-catalog.json` 持久保存候选元数据、上次成功时间和判定理由；它不赋予候选“可信种子”权限。现有 Stars、过滤规则和排序方式保持不变。
- 临时 404、限流或网络失败：保留此前合格项目的旧数据并标注“数据待核验”。404 本身不能区分删除、私有化和暂时不可访问，不自动删除。
- 成功获取后确认归档、fork、低于门槛或不符合相关性规则，才从榜单移除；明确排除配置始终有效。当前不设固定展示总量上限（`max_results: 0`），页面每批加载 30 条；如维护者配置正数上限，超限候选仍保留在候选库并记入报告。
- `data/collection-report.json` 记录本次请求异常、拒绝理由、搜索覆盖及榜单上限外项目；`data/collection-events.json` 保留最近 1000 条新增、恢复、移除、改名和待核验变更（更早记录可查 Git 历史）。
- 全部仓库元数据请求都无法确认时，更新失败并保留已发布榜单；诊断报告通过 Actions artifact 留存。部分失败可以发布，但页面提示“部分数据待核验”。

已确认 Stars 才写入当天历史；待核验缓存不冒充新的观测。当天重复运行保留每个项目的首次观测值，但允许补回首次运行漏掉、现已成功核验的项目。

## 项目类型

- **N skills**：默认分支检测到 `SKILL.md` 文件；文件树被截断时以 `N+ skills` 显示下界。
- **科研相关项目**：完整文件树中未发现 `SKILL.md`，保留为相关工具、工作流等项目。
- **类型待核验**：文件树请求失败，或截断结果中未发现 `SKILL.md`。不会据此移除项目。
- 文件存在和数量不代表符合 Skill 规范、质量或安装兼容性。简介继续使用仓库作者原文。

## 分轨准入与 README 核验

所有项目仍需达到 100 Stars、非 fork、未归档、不在显式排除名单内。名称、Description 和 Topics 命中的明显非学术排除词仍生效。

新候选去重后，从未核验的项目优先，组内再优先科研信号明显的项目；已尝试的项目按核验时间排队，读取默认分支 README：

- **Skill 候选路径**：README 的项目自身用途声明描述明确的论文写作、文献处理、科研绘图或科研工作流等学术场景，并说明 Skill、Agent 平台、MCP 或科研工作流等能力。最终有无 `SKILL.md` 仍由完整文件树判断，README 文案本身不能把工具变成 Skill。
- **科研相关项目路径**：README 的项目自身用途声明描述明确的学术工作场景，并说明工具、指南、手册、助手、资料或工作流用途；不再强制要求出现 Skill 关键词。
- 单独的“科研”“PhD”“thesis”不构成学术用途证明；游戏内科研、泛 AI 资讯、生活/留学申请指南不因顺带提到论文而准入。
- README 的参考文献、致谢、相关项目等区块不作为本项目准入证据；README 原文只用于核验，不覆盖作者的 Description，不自动翻译或编写摘要。
- 单次更新最多请求 120 份 README。核验结果与 SHA、路径、上游 push 时间和核验时间缓存在候选库；14 天内且 push 未变化时复用成功结果，明确无 README 或请求失败的结果缓存 1 天。预算耗尽的候选明确记录为 deferred，后续继续核验；不为了新增数量直接纳入。
- README 暂时请求失败标为 pending；已收录项目的 README 暂时不存在也保留收录资格；已由文档准入的旧项目暂时保留原有收录资格，新项目不能冒充核验通过。已有符合原元数据规则的项目在迁移时保留资格。
- `readme_reviews` / `readme_budget` 记录核验状态、缓存命中及预算；这是一套可审计的自动规则，不代表人工安装或内容质量认证。

## 趋势分

趋势分由以下信号加权组成：

- **近 7 天新增 Stars**（`star_delta_7d`）—— 主信号，权重 1.2。
- 最近 push 的时间新鲜度（90 天内衰减）。
- 新仓库加权（180 天内衰减）。
- 当前 Stars 规模（`log10` 平滑）。

### 为什么用 7 天而不是 1 天？

早期版本对比单日 Stars 增量（`star_delta_1d`），但 GitHub API 返回的计数在 24 小时内经常不变，导致趋势几乎恒为 0、所有仓库都显示"稳定"。改用 7 天滚动窗口后，趋势能真实反映一周内的增长势头。

### 历史快照

每日运行会把当天榜单保存到 `data/history/YYYY-MM-DD.json`（保留近 60 天）。趋势分和"本周新收录"都基于这些快照计算：

- `star_delta_7d` = 今日 Stars − 7 天前快照中的 Stars（容忍缺失天数，向前查找最近可用快照）。
- `star_delta_30d` = 今日 Stars − 30 天前快照中的 Stars（同样容忍缺失；无更长历史时退化为 7 天值）。
- `data/history.js` = 近 60 天每仓库的 `[{date, stars}]` 序列，供前端 sparkline 渲染（缺失天数自动跳过，曲线连接可用点）。
- “本周新收录”按持久首次收录记录判断是否属于当前 UTC 自然周，不含初始基线项目。
- “今日新增 Skills”按北京时间自然日显示本站首次收录、且有 `SKILL.md` 文件证据的项目，不是仓库创建日期或再次上榜日期。科研相关项目另行计数，类型待核验项目不混入 Skills 数量。
- 新收录记录保留 `first_seen_at` 精确时间；旧记录只有 `first_seen_date` 时按已有日期展示，不伪造时间。改名、掉榜后恢复、当天重复更新不会重置首次收录。打开页面跨日后会自动刷新“今日”判断。
- 今日没有新增时如实显示空状态；主榜仍按 Stars 排序，今日新增筛选支持链接分享和清空。

首次运行（无历史快照）时，`star_delta_7d` 退化为 `star_delta_1d`，`star_delta_30d` 退化为 `star_delta_7d`，且不显示新收录区块——避免首日刷屏。

## 主排序

主榜单按 **Stars 降序** 排列，趋势分作为辅助识别近期上升仓库。可视化页面支持按趋势、Stars、最近更新重新排序。

## 分类

每个仓库按关键词命中数归入 7 个分类之一（见 README）。分类按固定优先级匹配，确保结果稳定。

## 数据字段

`data/rankings.json` 中每个仓库包含：

- 基础：`repo`、`stars`、`star_delta_1d` / `star_delta_7d` / `star_delta_30d`、`trend_score`、`trend`、`category`、`description`、`language`、`topics`、`url`、`homepage`。
- 丰富：`forks`、`open_issues`、`watchers`、`size_kb`、`default_branch`、`has_issues`、`has_wiki`、`has_discussions`、`license`（含 `key` / `name` / `spdx_id`）。
- 质量：`skills_count`（git trees API 统计的 `SKILL.md` 数量，抓取失败为 `null`）、`stale`（≥30 天无 push 且 7 天零增长）、`verifies_citations`（描述/主题命中引用核验类关键词）。
- 审计：`precision_signals`（命中的精准过滤信号，便于复现与调试）、`exclude_repositories`（永远不入榜的仓库，如榜单自身）。

所有字段均为**只新增不删除**，旧消费者向前兼容。CSV（`data/rankings.csv`）包含上述基础 + 丰富字段的扁平子集。

## SEO 与订阅资产

每次更新同步生成（见 `scripts/update_rankings.py` 的 `write_seo_assets`）：

- `sitemap.xml` — 首页 + 数据端点 + 文档，带 `lastmod` / `changefreq` / `priority`（只含规范 URL，不含 `#` 锚点片段）。
- `feed.xml` — RSS 2.0，每日条目 = 本周新收录 + 7 天趋势前 10，含 `atom:self` 自引用；日期为规范要求的 RFC-822 格式。
- `assets/og-cover.svg` — 1200×630 Open Graph 封面，展示当日总量、总 Stars、更新日期与榜首仓库；CI 中同时栅格化为 `assets/og-cover.png`（Open Graph / Twitter 抓取器不渲染 SVG，PNG 才是社交平台真正显示的图片；由可选依赖 `cairosvg` 生成，本地缺失时自动跳过，仅保留 SVG）。
- `robots.txt` — 允许全部抓取并指向 sitemap。
- `index.html` 内嵌 JSON-LD `ItemList`（前端动态填充前 20 名）。

这些资产让搜索引擎、社交平台与 RSS 阅读器都能稳定发现并展示榜单。
