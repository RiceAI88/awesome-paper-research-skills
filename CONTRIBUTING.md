# 参与维护

欢迎推荐有明确科研用途的 Skills、科研工具、工作流和资料，也欢迎修正文档、补充安装证据或改进页面体验。

## 推荐一个项目

最简单的方式是使用[推荐新仓库模板](https://github.com/RiceAI88/awesome-paper-research-skills/issues/new?labels=recommendation&template=recommend-repo.yml)提交 Issue，请附上：

- GitHub 仓库链接。
- 适合解决的科研任务，例如文献检索、论文阅读、科研绘图或实验复现。
- README 中说明用途的段落，以及 `SKILL.md`、安装说明或使用文档的链接（如有）。

当前基本门槛为 100 Stars、非 fork、未归档且有明确学术／科研用途。Skills 与科研相关工具／指南采用不同的准入路径；仅在参考链接中提到“科研”不等于项目自身符合要求。完整规则见[排名方法](docs/methodology.md)。

项目通过相关性筛选后，还会检查默认分支的文件证据：

| 类型 | 判断依据 | 页面展示 |
|---|---|---|
| Skills | 检测到 `SKILL.md` 文件 | 默认榜单；截断文件树中的数量只代表下界 |
| 科研相关项目 | 完整文件树中未发现 `SKILL.md` | 打开“含科研相关项目”后展示 |
| 类型待核验 | 文件请求失败，或截断结果无法确定 | 保留待核验记录，不混入前两类榜单 |

文件存在不等于通过规范或安装验证。简介保留作者原文，不自动翻译；提供的中文补充或安装信息需要说明来源。

## 通过 PR 推荐

1. Fork 仓库，在 [`config/ranking.json`](config/ranking.json) 的 `seed_repositories` 中加入 `owner/repo`，不要重复已有项目。
2. 在 PR 中说明用途，并附对应文档链接。种子列表用于直接复查项目，不等于把它认证为可安装的 Skill。
3. 运行 Python 测试：

   ```bash
   python3 -m unittest discover -s tests -v
   ```

4. [推荐仓库检查工作流](.github/workflows/verify-pr.yml)会对新增种子的 Stars、fork、归档等基础信息检查并评论；[CI](.github/workflows/ci.yml)负责完整测试。基础检查通过不代表已核对安装过程。

不必为了推荐一个项目手动修改排行榜、历史快照或 Stars。它们由采集工作流维护，下一次成功采集后按规则生成。

## 改进采集与排名

| 修改内容 | 对应文件 |
|---|---|
| Stars 门槛、种子、搜索词、排除列表、README 核验预算 | [`config/ranking.json`](config/ranking.json) |
| 元数据筛选、类型信息、趋势、历史快照和输出 | [`scripts/update_rankings.py`](scripts/update_rankings.py) |
| 最近更新／Stars 区间搜索、README 用途核验 | [`scripts/discovery.py`](scripts/discovery.py) |
| 持久候选库、独立复查、缓存与采集报告 | [`scripts/collection.py`](scripts/collection.py) |

修改规则时，请补充能复现实际问题的测试，例如 README 只引用了别的科研项目、请求失败后误掉榜、类型待核验误入 Skills 列表等。避免只为当前某个仓库写特例。

采集需要访问 GitHub API；完整运行见[更新工作流](.github/workflows/update-rankings.yml)，本地运行入口为 `python3 scripts/update_rankings.py`。常规文档或前端修改无需重新采集整个 GitHub 数据集。

## 修改 README

README 由 [`scripts/update_rankings.py`](scripts/update_rankings.py) 的 `render_readme` 自动生成。修改项目介绍或榜单展示时，应同时修改生成函数，再使用已发布数据重新生成：

```bash
python3 - <<'PY'
import json
from pathlib import Path
from scripts.update_rankings import render_readme

data = json.loads(Path('data/rankings.json').read_text(encoding='utf-8'))
Path('README.md').write_text(render_readme(data), encoding='utf-8')
PY
python3 -m unittest discover -s tests -v
```

这一步不访问 GitHub、不刷新 Stars、不改历史记录。只修改 README 会在下一次采集时被覆盖。

`assets/readme-dashboard.png` 是实际界面的静态截图，界面大改时再更新；不要用它表示实时项目数量。原作者致谢与许可证声明应保留。

## 贡献前端与可视化

首页采用 **React + Vite + Ant Design + Motion**，图表使用 Ant Design Charts。需要 Node.js 22.12 或更高版本。

```bash
npm ci
npm run dev
```

打开 Vite 输出地址下的 `/awesome-paper-research-skills/`；英文入口位于 `en/` 子路径。

| 修改内容 | 对应位置 |
|---|---|
| 页面布局与状态、组件 | [`src/App.jsx`](src/App.jsx)、[`src/components/`](src/components/) |
| 场景匹配、筛选、排序、分享状态 | [`src/domain.js`](src/domain.js) |
| 中文与英文文案 | [`src/i18n.js`](src/i18n.js) |
| 基础样式与当前靛紫主题 | [`src/styles.css`](src/styles.css)、[`src/indigo.css`](src/indigo.css) |
| 图表数据与渲染 | [`src/insights.js`](src/insights.js)、[`src/components/Insights.jsx`](src/components/Insights.jsx) |

新增文案同时维护中英文，保持键盘操作、手机布局、深浅主题和“减少动态效果”偏好可用。新增数据字段应兼容缺失值与旧快照，不把推断或未知信息写成已验证事实。

验证前端：

```bash
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

构建产物位于 `dist/`，不提交到 Git。GitHub Pages 部署构建后的产物；原来的 `assets/styles.css` 用于静态月报，不是当前首页样式入口。更多说明见[前端开发](docs/frontend-development.md)。

## 历史与首次收录记录

`data/history/` 保存近 60 天历史快照，用于增长计算；`data/first-seen.json` 保存首次收录记录，不能因为改名或恢复上榜而重置。“今日新增”按北京时间自然日判断，“本周新收录”采用 UTC 自然周；初始导入的基线项目不计入新增。

`data/collection-report.json` 和 `data/collection-events.json` 记录采集状态及项目变化。修正数据问题时优先修复生成逻辑，不手改快照凑数。精选来源变更与安装核对分别参考[精选维护](docs/editorial-maintenance.md)和[安装核验](docs/installation-audit.md)。

## English

Contributions are welcome. Open an issue with the repository URL, its specific research use case, and links to the README, `SKILL.md` or installation instructions. Research-related tools and guides are accepted through a separate admission path and are not presented as verified Skills.

For documentation changes, edit `render_readme` before regenerating README from existing data. For frontend work, use Node.js 22.12+, React/Vite and the test commands above. Keep upstream attribution and the MIT license intact.
