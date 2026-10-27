# Awesome Paper Research Skills

> 面向中文用户的学术论文与科研 Agent Skill 每日排行榜。自动搜索、过滤并排名 GitHub 上与论文写作、文献综述、深度研究、评审反馈、实验复现相关的 Skill / Agent / Workflow 仓库。

[![Last update](https://img.shields.io/badge/updated-2026--10--27-0f766e)](#今日榜单)
[![Repositories](https://img.shields.io/badge/repositories-200-2563eb)](#今日榜单)
[![Min stars](https://img.shields.io/badge/min%20stars-100-334155)](#收录标准)
[![Online dashboard](https://img.shields.io/badge/online-dashboard-b3552a)](https://riceai88.github.io/awesome-paper-research-skills/)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e)](LICENSE)
[![Auto update](https://img.shields.io/badge/auto%20update-daily-6366f1)](.github/workflows/update-rankings.yml)

[English](#english) · [可视化页面](https://riceai88.github.io/awesome-paper-research-skills/) · [English Dashboard](https://riceai88.github.io/awesome-paper-research-skills/en/) · [月报](reports/) · [JSON](data/rankings.json) · [CSV](data/rankings.csv) · [RSS](feed.xml) · [Sitemap](sitemap.xml) · [排名方法](docs/methodology.md) · [更新日志](docs/changelog.md) · [贡献指南](CONTRIBUTING.md)

## 项目特色

- 🔄 **每日自动更新** — GitHub Actions 每天 02:20 UTC 运行，自动搜索、过滤、排名并提交。
- 🧭 **稳定收录与核验状态** — 搜索发现新项目，历史项目独立复查；临时请求失败保留旧数据并标记，新增和移除原因可追溯。
- 🏷️ **项目类型** — 根据默认分支 `SKILL.md` 文件检测区分 Skills、科研相关项目和待核验类型；不以文件数量代替质量或安装验证。
- 🎯 **精准双重信号过滤** — 必须同时命中"Skill/Agent/Workflow"与"Academic/Research/Paper"信号，挡住泛 AI 项目。
- 📈 **7 天 / 30 天趋势窗口** — 基于历史快照计算一周 Stars 增量，并展示 30 天 sparkline 趋势曲线，告别单日抖动假象。
- 🆕 **本周新收录** — 自动识别近 7 天新进入榜单的仓库。
- 🏷️ **适用 Agent 标签** — 推断每个仓库面向 Claude Code / Codex / OpenCode / Cursor / Gemini / MCP。
- 🌐 **双语可视化** — 中文优先，支持英文切换、搜索、分类筛选与多维度排序。
- 🎨 **深色模式 & 卡片视图** — 一键切换明暗主题，表格 / 卡片双视图，仓库详情抽屉，收藏夹与 URL 状态分享。
- ⌨️ **键盘快捷键** — `/` 搜索 · `t` 主题 · `l` 语言 · `v` 视图 · `f` 收藏 · `Esc` 关闭。
- 🔍 **SEO & 订阅** — 提供 sitemap、Open Graph、JSON-LD 结构化数据与 RSS 订阅源，方便被搜索引擎和 RSS 阅读器发现。
- 📦 **机器可读** — 提供 JSON / CSV 数据文件（含 license、forks、open issues 等字段），方便二次开发与订阅。

## 今日榜单

- 更新时间：`2026-10-27T16:17:18Z`
- 收录门槛：GitHub Stars ≥ `100`，排除 fork、归档仓库和明显非学术项目。
- 精准规则：必须同时命中 Skill/Agent/Workflow 信号 **和** Academic/Research/Paper 信号。
- 趋势指标：基于近 7 天新增 Stars、最近 push 时间、新仓库加权和总体 Stars 规模综合计算。
- 分类概览：深度研究 32 · 论文写作 47 · 文献综述 8 · 评审反馈 1 · 实验复现 6 · 学科专项 23 · 综合研究 83

| # | 仓库 | Stars | 趋势 | 分类 | 适用 Agent | 简介 | 最近更新 |
|---:|---|---:|---|---|---|---|---|
| 1 | [binary-husky/gpt_academic](https://github.com/binary-husky/gpt_academic) | 71,562 | 持续增长 (7d:0) | 论文写作 | 通用 | 为GPT/GLM等LLM大语言模型提供实用化交互接口，特别优化论文阅读/润色/写作体验，模块化设计，支持自定义快捷按钮&函数插件，支持Python和C++等项目剖析&自译解功能，… | 2026-01-25 |
| 2 | [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills) | 54,921 | 热门上升 (7d:+1855) | 学科专项 | Claude/Codex/Cursor | Turn any AI agent into an AI Scientist. The #1 Agent Skills library for science, used by… | 2026-10-26 |
| 3 | [Imbad0202/academic-research-skills](https://github.com/Imbad0202/academic-research-skills) | 54,156 | 热门上升 (7d:+1097) | 论文写作 | Claude | Academic Research Skills for Claude Code: research → write → review → revise → finalize | 2026-10-27 |
| 4 | [Yuan1z0825/nature-skills](https://github.com/Yuan1z0825/nature-skills) | 50,982 | 热门上升 (7d:+1489) | 深度研究 | Codex | 符合nature论文学术表达和科研绘图的Skill | 2026-10-27 |
| 5 | [mli/paper-reading](https://github.com/mli/paper-reading) | 34,030 | 持续增长 (7d:0) | 学科专项 | 通用 | 深度学习经典、新论文逐段精读 | 2025-03-22 |
| 6 | [amusi/CVPR2026-Papers-with-Code](https://github.com/amusi/CVPR2026-Papers-with-Code) | 22,927 | 稳定 (7d:0) | 学科专项 | 通用 | CVPR 2026 论文和开源项目合集 | 2026-03-08 |
| 7 | [kaixindelele/ChatPaper](https://github.com/kaixindelele/ChatPaper) | 19,973 | 稳定 (7d:0) | 评审反馈 | 通用 | Use ChatGPT to summarize the arXiv papers. 全流程加速科研，利用chatgpt进行论文全文总结+专业翻译+润色+审稿+审稿回复 | 2026-03-02 |
| 8 | [wanshuiyin/Auto-claude-code-research-in-sleep](https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep) | 18,163 | 热门上升 (7d:+405) | 学科专项 | Claude/Codex/MCP | ARIS ⚔️ (Auto-Research-In-Sleep) — Lightweight Markdown-only skills for autonomous ML res… | 2026-10-24 |
| 9 | [Orchestra-Research/AI-Research-SKILLs](https://github.com/Orchestra-Research/AI-Research-SKILLs) | 14,004 | 热门上升 (7d:+269) | 深度研究 | Claude/Codex/Gemini | Comprehensive open-source library of AI research and engineering skills for any AI model.… | 2026-10-11 |
| 10 | [Imbad0202/academic-research-skills-codex](https://github.com/Imbad0202/academic-research-skills-codex) | 13,617 | 热门上升 (7d:+418) | 综合研究 | Codex | Codex-native Academic Research Skills suite for human-in-the-loop academic research workf… | 2026-10-27 |
| 11 | [extreme-assistant/CVPR2024-Paper-Code-Interpretation](https://github.com/extreme-assistant/CVPR2024-Paper-Code-Interpretation) | 12,454 | 稳定 (7d:0) | 学科专项 | 通用 | cvpr2024/cvpr2023/cvpr2022/cvpr2021/cvpr2020/cvpr2019/cvpr2018/cvpr2017 论文/代码/解读/直播合集，极市团… | 2024-04-25 |
| 12 | [HKUSTDial/Supervisor-Skills](https://github.com/HKUSTDial/Supervisor-Skills) | 10,775 | 热门上升 (7d:+614) | 学科专项 | 通用 | 将博导十年科研经验炼化为可直接调用的 AI 技能。从 Idea 构思到论文投稿，你的 AI 科研副导师。 | 2026-10-16 |
| 13 | [hoochanlon/hamuleite](https://github.com/hoochanlon/hamuleite) | 9,948 | 热门上升 (7d:+32) | 学科专项 | 通用 | 🌊深度整合全球顶尖学术、金融与教育资源：学术板块汇聚 JSTOR、Taylor & Francis、剑桥大学出版社等权威平台的论文，并接入 Z-Library 影子图书馆的海量电… | 2026-10-25 |
| 14 | [ChenLiu-1996/figures4papers](https://github.com/ChenLiu-1996/figures4papers) | 9,144 | 热门上升 (7d:+400) | 学科专项 | 通用 | My Python scripts to make high-quality figures for publications in top AI conferences and… | 2026-10-19 |
| 15 | [LAMDA-NeSy/Research-Starter-Kit](https://github.com/LAMDA-NeSy/Research-Starter-Kit) | 9,055 | 持续增长 (7d:0) | 学科专项 | 通用 | 从0开始，掌握做科研、写论文的基本流程。 | 2026-09-01 |
| 16 | [AhmadHassan-BTed/Turnitout-Humanizer](https://github.com/AhmadHassan-BTed/Turnitout-Humanizer) | 8,167 | 持续增长 (7d:0) | 论文写作 | 通用 | FREE FOREVER, NO LIMITS 100% Programmatic, Zero-AI Plagiarism Remover & Similarity Evader… | 2026-10-26 |
| 17 | [Master-cai/Research-Paper-Writing-Skills](https://github.com/Master-cai/Research-Paper-Writing-Skills) | 7,859 | 热门上升 (7d:+238) | 学科专项 | Claude/Codex/Gemini | Skill package for ML/CV/NLP paper writing, curated and adapted from Prof. Peng Sida's ope… | 2026-06-23 |
| 18 | [dwzhu-pku/PaperBanana](https://github.com/dwzhu-pku/PaperBanana) | 7,459 | 持续增长 (7d:0) | 综合研究 | 通用 | PaperBanana: Automating Academic Illustration For AI Scientists | 2026-10-24 |
| 19 | [jihe520/MathModelAgent](https://github.com/jihe520/MathModelAgent) | 6,254 | 热门上升 (7d:+32) | 学科专项 | 通用 | 🤖📐专为数学建模设计的 Agent & skills ,自动完成数学建模，生成一份完整的可以直接提交的论文。 An Agent Designed for Mathematical… | 2026-10-26 |
| 20 | [WUBING2023/PaperSpine](https://github.com/WUBING2023/PaperSpine) | 6,091 | 持续增长 (7d:0) | 论文写作 | 通用 | PaperSpine5 — local-first, evidence-bound paper research, writing, figures, review and de… | 2026-10-14 |
| 21 | [zLanqing/codex-claude-academic-skills](https://github.com/zLanqing/codex-claude-academic-skills) | 5,384 | 热门上升 (7d:+281) | 综合研究 | Claude/Codex | 本仓库包含三个面向学术科研人员的Skills，覆盖从文献阅读、论文写作到科学计算的完整研究工作流。office-academic-skill 负责论文阅读报告与学术 PPT/Wo… | 2026-05-14 |
| 22 | [brycewang-stanford/Auto-Empirical-Research-Skills](https://github.com/brycewang-stanford/Auto-Empirical-Research-Skills) | 4,792 | 热门上升 (7d:+106) | 学科专项 | 通用 | 🔬 A curated collection of 23,000+ agent skills for empirical research across 8 social sci… | 2026-10-26 |
| 23 | [MLNLP-World/Paper-Writing-Tips](https://github.com/MLNLP-World/Paper-Writing-Tips) | 4,693 | 持续增长 (7d:0) | 论文写作 | 通用 | MLNLP社区用来帮助大家避免论文投稿小错误的整理仓库。 Paper Writing Tips | 2026-09-26 |
| 24 | [dennybritz/deeplearning-papernotes](https://github.com/dennybritz/deeplearning-papernotes) | 4,422 | 稳定 (7d:0) | 综合研究 | 通用 | Summaries and notes on Deep Learning research papers | 2018-02-13 |
| 25 | [esbatmop/MNBVC](https://github.com/esbatmop/MNBVC) | 4,294 | 持续增长 (7d:0) | 学科专项 | 通用 | MNBVC(Massive Never-ending BT Vast Chinese corpus)超大规模中文语料集。对标chatGPT训练的40T数据。MNBVC数据集不但包… | 2026-10-25 |
| 26 | [Adkid-Zephyr/anti-defensive-writing-Skill](https://github.com/Adkid-Zephyr/anti-defensive-writing-Skill) | 4,213 | 热门上升 (7d:+706) | 论文写作 | 通用 | 极致轻量｜阻止论文的防御性写作 \| Anti-defensive writing for academic papers — 学术写作原则 Skill + prompt pack… | 2026-10-27 |
| 27 | [hzwer/WritingAIPaper](https://github.com/hzwer/WritingAIPaper) | 4,134 | 稳定 (7d:0) | 论文写作 | 通用 | Writing AI Conference Papers: A Handbook for Beginners | 2025-07-16 |
| 28 | [km1994/nlp_paper_study](https://github.com/km1994/nlp_paper_study) | 4,032 | 持续增长 (7d:0) | 学科专项 | 通用 | 该仓库主要记录 NLP 算法工程师相关的顶会论文研读笔记 | 2026-10-11 |
| 29 | [jmiao24/Paper2Agent](https://github.com/jmiao24/Paper2Agent) | 3,893 | 持续增长 (7d:0) | 综合研究 | 通用 | Paper2Agent is a multi-agent AI system that automatically transforms research papers into… | 2026-09-17 |
| 30 | [guanyingc/latex_paper_writing_tips](https://github.com/guanyingc/latex_paper_writing_tips) | 3,839 | 稳定 (7d:0) | 论文写作 | 通用 | Tips for Writing a Research Paper using LaTeX | 2023-05-04 |
| 31 | [Norman-bury/research-writing-skill](https://github.com/Norman-bury/research-writing-skill) | 3,543 | 热门上升 (7d:+63) | 论文写作 | 通用 | 科研写作助手 (Research Writing Assistant) | 2026-06-10 |
| 32 | [DSXiangLi/DecryptPrompt](https://github.com/DSXiangLi/DecryptPrompt) | 3,448 | 持续增长 (7d:0) | 深度研究 | 通用 | 总结Prompt&LLM论文，开源数据&模型，AIGC应用 | 2026-10-26 |
| 33 | [yilewang/llm-for-zotero](https://github.com/yilewang/llm-for-zotero) | 3,430 | 热门上升 (7d:+71) | 综合研究 | Codex/MCP | An open-source research agent system for your Zotero library. | 2026-10-26 |
| 34 | [OpenNSWM-Lab/FAROS](https://github.com/OpenNSWM-Lab/FAROS) | 3,035 | 持续增长 (7d:0) | 综合研究 | 通用 | A blueprint-driven AutoResearch runtime for orchestrating AI research workflows from idea… | 2026-10-21 |
| 35 | [huangwb8/ChineseResearchLaTeX](https://github.com/huangwb8/ChineseResearchLaTeX) | 2,980 | 热门上升 (7d:+23) | 论文写作 | Claude/Codex | 中国科研常用LaTeX模板集 | 2026-10-17 |
| 36 | [Octoday-Hub/Embodied-AI](https://github.com/Octoday-Hub/Embodied-AI) | 2,940 | 持续增长 (7d:0) | 综合研究 | 通用 | 「Octoday Hub 星期八具身智能生态社区」聚合论文、项目、课程、工具、数据集、招聘等资源，连接全球开发者、研究者与产业伙伴。 | 2026-10-26 |
| 37 | [openags/paper-search-mcp](https://github.com/openags/paper-search-mcp) | 2,936 | 热门上升 (7d:+68) | 综合研究 | MCP | MCP, CLI, Skills for searching and downloading academic papers from multiple sources like… | 2026-10-02 |
| 38 | [AIScientists-Dev/academic-humanizer](https://github.com/AIScientists-Dev/academic-humanizer) | 2,856 | 热门上升 (7d:+547) | 综合研究 | Claude/Codex | Strip AI-writing tells from papers and grant proposals (NSF/NIH), while keeping scholarly… | 2026-07-03 |
| 39 | [LigphiDonk/academic-figure-generator](https://github.com/LigphiDonk/academic-figure-generator) | 2,753 | 热门上升 (7d:+76) | 综合研究 | 通用 | AI 驱动的学术论文配图生成平台。上传论文 → AI 分析内容生成 Prompt → 一键生成高质量科研配图，还有配套的skill可在主流agent中使用 | 2026-03-27 |
| 40 | [HiLab-git/SSL4MIS](https://github.com/HiLab-git/SSL4MIS) | 2,701 | 稳定 (7d:0) | 文献综述 | 通用 | Semi Supervised Learning for Medical Image Segmentation, a collection of literature revie… | 2025-06-07 |
| 41 | [yb2460/harness-anything](https://github.com/yb2460/harness-anything) | 2,647 | 热门上升 (7d:+313) | 文献综述 | 通用 | Harness Anything - AI agent control hub: WPS, MS Office, Zotero, Photoshop, 47 CLI comman… | 2026-10-09 |
| 42 | [HughYau/AcademicForge](https://github.com/HughYau/AcademicForge) | 2,612 | 持续增长 (7d:+9) | 综合研究 | 通用 | One Forge, All Skills: A curated skill collection for academic writing and research. 点开即用… | 2026-08-30 |
| 43 | [hithesis/hithesis](https://github.com/hithesis/hithesis) | 2,469 | 持续增长 (7d:0) | 论文写作 | 通用 | 嗨！thesis！哈尔滨工业大学毕业论文LaTeX模板 | 2026-10-27 |
| 44 | [Weizhena/Deep-Research-skills](https://github.com/Weizhena/Deep-Research-skills) | 2,431 | 热门上升 (7d:+43) | 深度研究 | Claude/Codex/OpenCode | Structured deep research skill for Claude Code/Open Code/Codex with human-in-the-loop con… | 2026-08-23 |
| 45 | [llmsresearch/paperbanana](https://github.com/llmsresearch/paperbanana) | 2,421 | 持续增长 (7d:+13) | 综合研究 | Gemini/MCP | Open source implementation and extension of Google Research’s PaperBanana for automated a… | 2026-09-17 |
| 46 | [Future-Scholars/paperlib](https://github.com/Future-Scholars/paperlib) | 2,307 | 稳定 (7d:0) | 综合研究 | 通用 | An open-source academic paper management tool. | 2026-04-01 |
| 47 | [bohyy/academic-ai-prompt](https://github.com/bohyy/academic-ai-prompt) | 2,224 | 热门上升 (7d:+64) | 综合研究 | 通用 | 一套为研究生和学术研究者设计的完整AI Prompt库 📖 包含内容： ✨ 40+ 精心设计的AI Prompt ✨ 论文选题系统方法（生成、评估、论证） ✨ 论文查找快速方案（… | 2026-09-02 |
| 48 | [chi111i/BypassAIGC](https://github.com/chi111i/BypassAIGC) | 2,194 | 稳定 (7d:0) | 深度研究 | 通用 | 论文润色，AIGC 降重工具(gptzero等检测网站) | 2026-08-28 |
| 49 | [aipoch/medical-research-skills](https://github.com/aipoch/medical-research-skills) | 1,993 | 持续增长 (7d:+19) | 综合研究 | 通用 | Hundreds of agent skills for medical research, including protocol design, data analysis,… | 2026-09-17 |
| 50 | [XiaoMaColtAI/math-modeling-skill](https://github.com/XiaoMaColtAI/math-modeling-skill) | 1,889 | 持续增长 (7d:+13) | 学科专项 | Claude/Codex | 数学建模技能 - 面向 CUMCM、MCM/ICM 等数学建模竞赛的三阶段工作流：建模分析、Python/MATLAB 编程与 DOCX 论文生成。包含丰富的算法资源库(优化/预… | 2026-10-26 |

## 本周新收录

近 7 天新进入榜单的仓库：

- **[binary-husky/gpt_academic](https://github.com/binary-husky/gpt_academic)** — 为GPT/GLM等LLM大语言模型提供实用化交互接口，特别优化论文阅读/润色/写作体验，模块化设计，支持自定义快捷按钮&函数插件，支持Python和C++等项… (71,562 ⭐, 论文写作)
- **[mli/paper-reading](https://github.com/mli/paper-reading)** — 深度学习经典、新论文逐段精读 (34,030 ⭐, 学科专项)
- **[amusi/CVPR2026-Papers-with-Code](https://github.com/amusi/CVPR2026-Papers-with-Code)** — CVPR 2026 论文和开源项目合集 (22,927 ⭐, 学科专项)
- **[kaixindelele/ChatPaper](https://github.com/kaixindelele/ChatPaper)** — Use ChatGPT to summarize the arXiv papers. 全流程加速科研，利用chatgpt进行论文全文总结+专业翻译+润色+审稿… (19,973 ⭐, 评审反馈)
- **[extreme-assistant/CVPR2024-Paper-Code-Interpretation](https://github.com/extreme-assistant/CVPR2024-Paper-Code-Interpretation)** — cvpr2024/cvpr2023/cvpr2022/cvpr2021/cvpr2020/cvpr2019/cvpr2018/cvpr2017 论文/代码/解… (12,454 ⭐, 学科专项)
- **[LAMDA-NeSy/Research-Starter-Kit](https://github.com/LAMDA-NeSy/Research-Starter-Kit)** — 从0开始，掌握做科研、写论文的基本流程。 (9,055 ⭐, 学科专项)
- **[AhmadHassan-BTed/Turnitout-Humanizer](https://github.com/AhmadHassan-BTed/Turnitout-Humanizer)** — FREE FOREVER, NO LIMITS 100% Programmatic, Zero-AI Plagiarism Remover & Similar… (8,167 ⭐, 论文写作)
- **[dwzhu-pku/PaperBanana](https://github.com/dwzhu-pku/PaperBanana)** — PaperBanana: Automating Academic Illustration For AI Scientists (7,459 ⭐, 综合研究)
- **[WUBING2023/PaperSpine](https://github.com/WUBING2023/PaperSpine)** — PaperSpine5 — local-first, evidence-bound paper research, writing, figures, rev… (6,091 ⭐, 论文写作)
- **[MLNLP-World/Paper-Writing-Tips](https://github.com/MLNLP-World/Paper-Writing-Tips)** — MLNLP社区用来帮助大家避免论文投稿小错误的整理仓库。 Paper Writing Tips (4,693 ⭐, 论文写作)

## 分类标准

| 分类 | 说明 |
|---|---|
| 深度研究 | 多阶段 research agent、source validation、autonomous discovery、deep research workflow |
| 论文写作 | 论文构思、写作、润色、LaTeX、proofreading、revision |
| 文献综述 | literature survey、citation、bibliography、source collection |
| 评审反馈 | peer review、reviewer feedback、critique、referee report |
| 实验复现 | experiment design、benchmark、evaluation、reproducibility |
| 学科专项 | 面向经济学、生物、医学、ML/CV/NLP 等具体领域 |
| 综合研究 | 覆盖多个科研流程的通用 research skill |

## 使用方式

1. 浏览上方榜单，优先查看 Stars、趋势（7 天增量）和分类。
2. 打开 [可视化页面](https://riceai88.github.io/awesome-paper-research-skills/) 使用搜索、分类筛选、排序和中英文切换。
3. 机器读取请使用 [data/rankings.json](data/rankings.json) 或 [data/rankings.csv](data/rankings.csv)。
4. 如需推荐新仓库，提交 Issue（附仓库链接和一句推荐理由）或直接 PR 修改 `config/ranking.json`。

## 收录标准

- 仓库必须明确服务学术、科研、论文、文献、评审或实验复现场景。
- 仓库必须具备 Skill、Agent、Workflow、Claude Code、Codex、OpenCode 或类似可复用工作流信号。
- 默认最低门槛为 100 Stars（可在 `config/ranking.json` 调整）。
- fork、归档仓库、明显非学术用途仓库不会收录。

## 自动更新

GitHub Actions 每天运行一次 [.github/workflows/update-rankings.yml](.github/workflows/update-rankings.yml)：

- 使用 GitHub Search API 搜索候选仓库 + 拉取种子仓库元数据。
- 应用精准过滤、分类和趋势计算（基于 `data/history/` 下的每日历史快照）。
- 更新 `README.md`、`data/rankings.json`、`data/rankings.csv`、`data/rankings.js`。
- 保存当日快照到 `data/history/YYYY-MM-DD.json`（保留近 60 天）。
- 如数据发生变化，自动提交到 `main`。

手动本地更新：

```bash
python scripts/update_rankings.py
python -m unittest discover -s tests -v
```

## English

**Awesome Paper Research Skills** is a daily-updated ranking of GitHub repositories that provide academic, paper-writing, literature-review, deep-research, peer-review, and experiment-reproducibility skills for AI coding agents (Claude Code, Codex, OpenCode, Cursor, Gemini, …).

New candidates are checked against their README: academic Skills/agent workflows and research-related tools/guides have separate admission paths. Discovery combines popular, recently updated and star-banded searches, with a bounded README review budget. Low-star, archived, forked, and clearly unrelated repositories are excluded. The trend column shows 7-day star growth, with a 30-day sparkline in the dashboard.

### Dashboard features

- Bilingual (Chinese-first, English switch), **dark mode**, and a responsive **table / card** dual view.
- Per-repo **trend sparkline**, **detail drawer**, **favorites** (with JSON export), and **shareable URL state** (filters/sort/view/lang/theme persisted in `#hash`).
- **Keyboard shortcuts**: `/` search · `t` theme · `l` language · `v` view · `f` favorites · `Esc` close.
- **SEO & subscription**: sitemap, Open Graph cover, JSON-LD `ItemList`, and an **RSS feed** of daily newcomers + trending repos.
- Machine-readable **JSON** / **CSV** (incl. license, forks, open issues, 30-day delta).

## 来源与致谢

本项目基于 [kael-odin/awesome-academic-research-skills](https://github.com/kael-odin/awesome-academic-research-skills) 导入并进行后续改版，感谢原作者 [kael-odin](https://github.com/kael-odin) 的开源贡献。

本仓库独立维护，保留原项目的 MIT 许可证和版权声明；不代表原作者或与原作者存在隶属关系。

## License

MIT
