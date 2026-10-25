# 精选文档维护

精选推荐的依据记录在 `config/editorial-sources.json`，检测结果写入
`data/editorial-status.json`。每天的 `Update rankings` 工作流以及该工作流的手动
`workflow_dispatch` 都会检查一次，在 Actions job summary 显示本次状态、文档路径和对比链接。
检测本身不创建 Issue、评论或邮件，也不会自动修改推荐理由、安装说明或核验基线。

## 检测范围与含义

当前跟踪 `config/editorial.json` 中四个精选项目的推荐 `source_url`、安装
`source_url`，以及 `config/installation-details.json` 对应项目的
`additional_sources`。忽略 URL 锚点后按文档路径去重，共四份 README 和一份
`docs/SETUP.md`。新增精选或更换来源时，维护者需要同步扩充此清单。

每份文档记录跟踪的 `ref`、人工核验的 `reviewed_commit`、文件内容的
`blob_sha` 和固定到核验提交的 `source_url`。检测先解析该 ref 当前提交，再读取固定提交
上的文档，以内容 blob SHA 比较。省略 ref 时使用仓库默认分支；本次清单明确使用 main。
只有代码提交、Star 或仓库活跃度改变而文档内容未变时，不触发重新核验。

- `current`：本次成功读取，文档内容与人工核验基线一致。
- `changed`：至少一份文档内容变化或被删除，`needs_review: true`。
- `error`：限流、权限或网络故障等导致检查不完整，不能解释为文档仍然有效。
  文件读取返回 HTTP 404 标记为 `removed`，要求重新核验；ref/仓库解析失败标记为错误。
  同一组路径和 blob 基线先前已有待复核标记时，连续检测错误仍保留 `needs_review: true`。

仓库存在错误时整体状态优先显示 `error`，同时保留已发现的文档变更和待复核标记。
检测错误会正常生成报告，不因外部 API 故障使整个排名更新失败。清单格式无效则退出非零。

## 人工重新核验

1. 打开报告中的核验版本、当前版本和提交对比链接，逐份检查推荐用途、安装命令、
   宿主、环境与依赖要求。文档变更只是复核提示，不自动判断推荐失效。
2. 如依据改变，仅更新受影响的推荐或安装说明；保留需要人工判断的限制。
3. 在同一轮复核中，把该项目每份文档的 `reviewed_commit`、`blob_sha`、固定提交
   `source_url` 和项目 `reviewed_at` 改为已实际阅读核验的版本。获取文件 SHA 可使用
   GitHub Contents API：`GET /repos/{owner}/{repo}/contents/{path}?ref={reviewed_commit}`。
   请保留用于后续跟踪的分支 `ref`，不要改成固定提交来消除变更提示。
4. 运行 `python3 scripts/check_editorial_docs.py` 并查看结果；只有所有文档成功读取
   且与新基线一致时，该项目恢复 `current`。不要直接编辑生成报告来清除待复核状态。

脚本只使用 Python 标准库。GitHub Actions 提供 `GITHUB_TOKEN`；本地可设置该环境变量
提高 GitHub API 配额，也可匿名运行。无需安装或执行被检测项目的任何内容。

## 初始基线

2026-10-25：paper-search-mcp、academic-research-skills 和 nature-skills 沿用
`installation-details.json` 已核验提交读取文件 blob。paper-craft-skills 原无已核验
提交，实际阅读 `3be47a2a53cc35a411c587bca5231a08de57287a` 的 README，确认其
论文方法图、演示材料、深度文章用途与既有 `npx skills add zsyggg/paper-craft-skills`
命令后建立基线。检测脚本永不推进这些基线或 `reviewed_at`。

验证命令：`python3 -m unittest discover -s tests -v`。测试通过注入 fetch 函数覆盖内容
不变、变化、删除、限流、网络错误、连续错误保留待复核、新基线取消旧待复核继承，以及
无关代码提交等情形，不调用外部 API。

## 页面提醒

精选卡片默认显示来源状态，展开推荐依据后可查看检查时间及变更对比链接；
精选项目的详情和工具对比也显示待复核提示。检查报告超过 72 小时会标记过期；
报告缺失、人工基线已修改但未重新生成报告、时间无效时显示待检查。
已发现的待复核状态不会因检查过期或后续接口失败而消失。
“来源文档未变化”仅表示内容与人工核验版本一致，不代表实际安装测试成功。

工具对比中的适用任务沿用现有分类、简介与主题关键词规则，作为筛选参考；
必要依赖复用已核验的安装资料，缺失时明确提示尚未核对。
维护状态沿用榜单的停更提示规则，未触发规则不等于确认活跃维护。
