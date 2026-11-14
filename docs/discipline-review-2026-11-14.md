# 专业归属核验记录 · 2026-11-14

本轮抓取库存中 199 个 Skill 仓库的官方 README，针对专业适用范围作人工检查，新增 19 个有明确文档依据的归属记录，累计 48 个。抓取不等于完成核验，核验也不代表实际安装或专业任务实测。

- `config/disciplines.json` 仅存已核对的适用专业或通用标记。
- `config/discipline-sources.json` 保存官方链接、README blob SHA、原文摘录与核验日期，用户可在详情中查看。
- 不从仓库名称或泛泛的“科研”字样推断专业，也不把通用工具重复算作各专业专属数量。

## 本轮补充

- 人文：humanities-thesis-skill、academic-paper-skills、academic-literature-route、PaperForge，覆盖有明确依据的文学、历史、哲学、语言学等研究任务。
- 社科：MGMT-Paper-Skills、econ-TopJournal-writing-Skill、claude-code-my-workflow、Auto-Empirical-Research-Skills，按文档细分管理、经济、政治与实证统计。
- 专业工具：mathematical-modeling-review、research-agent-skills，分别按数学建模及其列出的科学领域标注。
- 期刊集合：Awesome-Journal-Skills，核对农业系统、艺术史、历史、哲学、文学的独立目录，均存在 README 与 skills 子目录。按一个仓库计数，不将子模块当作新增仓库。
- 通用：Supervisor-Skills、PaperSpine、academic-humanizer、journal-adapt-writing-skill、claude-deep-research-skill、reference-checker-skill、cn-academic-spark、co-researcher。

具体专业仍可能没有已核对项目。例如，一个农业系统模块不能自动推广为兽医学适用，一个艺术史模块不能自动推广为设计学适用。

## 定向发现与后续维护

本轮使用 GitHub 仓库搜索检查农业、历史研究、哲学、人文、艺术史方向，保留 ≥100 Stars、非 fork、未归档条件。搜索结果只是候选，不能直接作为专业归属依据。

新增候选 [humanities-writing-companion](https://github.com/tizzy916/humanities-writing-companion) 已核对官方 README：明确服务人文学者，提供开放 SKILL.md 格式、研究问题到修改的工作流。加入种子列表，下一轮采集仍须经过正常元数据与 README 准入流程，本次不手工伪造采集时间、增长或新收录记录。

自动搜索补充人文、哲学、历史、艺术史、农学、作物研究和中文史料等关键词，沿用最近更新与 Stars 分段搜索。人文写作/学者的明确研究用途需同时具备 Agent Skill 信号与使用/工作流说明，普通软件“设计哲学”工具不因此获准入。

新项目由自动任务发现和核验，专业映射继续以文档核对为准。发现专业归属未核验时仍留在总榜，不能用“0”表示全球没有相关 Skills。欢迎通过“推荐 Skill”提交仓库、专业、科研任务与官方文档线索。
