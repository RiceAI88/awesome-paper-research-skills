# 前 20 名安装文档核验记录

核验日期：2026-10-25。范围为当日榜单前 20 名；后续排名变化不会自动成为已核验项目。核验基于官方文档及固定提交快照，未执行安装或宣称实测。技能文件安装与完整应用部署的依赖分别注明；原文未明确的版本不作推测。

## 1. K-Dense-AI/scientific-agent-skills

- 方式：command
- 环境：支持 Agent Skills 标准的宿主（Claude Code、Codex、Cursor、Gemini CLI、Antigravity 等）；README列出 macOS、Linux 或 Windows + WSL2。
- 依赖：npx安装方式未注明Node.js版本；技能依赖使用uv，按各技能compatibility及setup安装包、系统工具和凭据。Python 3.13+仅是仓库开发/验证工具要求，不是全部技能的统一要求。
- 范围：在终端执行，按安装器提示选择所需技能及宿主；安装技能文件不会安装科学计算依赖。
- [安装原文](https://github.com/K-Dense-AI/scientific-agent-skills/blob/main/README.md#option-1-npx-supported-hosts) · [核验快照](https://github.com/K-Dense-AI/scientific-agent-skills/blob/593377bb048752abb0152deab9fbb1083a6087df/README.md#option-1-npx-supported-hosts)
- 定位：README.md L168–176 Option 1；L305–313 Prerequisites明确区分工具与逐技能依赖。

## 2. Imbad0202/academic-research-skills

- 方式：command
- 环境：最新Claude Code（插件需近期版本）；macOS、Linux已测试，Windows为尽力支持，未有Windows CI。
- 依赖：按官方要求设置ANTHROPIC_API_KEY或首次启动Claude时配置。核心提示词技能无需Python；写入范围守卫及少数可选命令需要真实Python，Windows守卫另需Git Bash。直接DOCX可选Pandoc；PDF可选tectonic及相应字体。
- 范围：在Claude Code会话内依次执行；安装后用/ars-plan或/ars-lit-review验证。
- [安装原文](https://github.com/Imbad0202/academic-research-skills/blob/main/README.md#quick-install) · [核验快照](https://github.com/Imbad0202/academic-research-skills/blob/09a5d0b15c7b50a20d9fc68d5947bb9897f438b5/README.md#quick-install)
- 定位：README.md L55–73 prerequisites and plugin install；docs/SETUP.md L15–40 Python/platform support；L63–97 optional output tools。

## 3. Yuan1z0825/nature-skills

- 方式：command
- 环境：本例宿主为Codex；另有Claude Code和其他宿主步骤。README未注明统一操作系统要求。
- 依赖：npx方式明确要求Node.js 18+。其他Python、R、浏览器或MCP依赖按所选技能配置；reader/paper2ppt/polishing/writing等技能另需nature-shared。本例figure未列统一额外依赖。
- 范围：在终端为当前项目的Codex仅安装nature-figure；此命令不安装完整技能集或Python/R/MCP依赖。
- [安装原文](https://github.com/Yuan1z0825/nature-skills/blob/main/README.md#51-npx-skills-安装方式) · [核验快照](https://github.com/Yuan1z0825/nature-skills/blob/8f28a61d42c2b251d224cdb0a59229df9879a68e/README.md#51-npx-skills-安装方式)
- 定位：README.md L149–196：Node.js 18+、项目/全局范围和单独nature-figure命令；L368–380：完整目录及按需依赖。

## 4. wanshuiyin/Auto-claude-code-research-in-sleep

- 方式：manual
- 环境：推荐Claude Code执行、Codex审阅；setup指南目标为本地macOS+远程Linux GPU服务器，README另给Windows PowerShell安装方式。
- 依赖：Claude Code；审阅技能需Codex CLI及使用python3的ARIS MCP桥接。论文写作工作流需LaTeX、latexmk及pdfinfo；想法发现/自动审阅不需LaTeX；GPU仅自动实验按需。没有统一Python/Node.js版本要求。
- 范围：按官方步骤克隆到稳定路径，再为目标项目安装；Claude Code、Codex和Windows路线不同，审阅桥接需单独配置。
- [安装原文](https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep/blob/main/README.md#install-skills) · [核验快照](https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep/blob/18bceb3c71c638bef58096274e1c9a6d323dbc0a/README.md#install-skills)
- 定位：README.md L1450–1497 Setup/Prerequisites/Install Skills；L1500–1531 clone、项目路径及Windows步骤；L1688–1690 GPU optional。

## 5. Orchestra-Research/AI-Research-SKILLs

- 方式：command
- 环境：安装器自动探测Claude Code、Hermes、OpenCode、Qoder、Cursor、Gemini CLI等；README提到Windows复制回退，未给完整操作系统支持矩阵。
- 依赖：官方使用npx启动安装器，README未注明Node.js版本或统一运行依赖清单；训练、推理等实际依赖应按所选子技能文档配置。
- 范围：在终端启动交互安装器，选择全部、快速入门、类别或单个技能；技能放在~/.orchestra/skills并链接至宿主，Windows回退为复制。
- [安装原文](https://github.com/Orchestra-Research/AI-Research-SKILLs/blob/main/README.md#-quick-install-recommended) · [核验快照](https://github.com/Orchestra-Research/AI-Research-SKILLs/blob/773a52944ba4747a18bd4ae9ade53fff041adcbc/README.md#-quick-install-recommended)
- 定位：README.md L84–107 Quick Install / What the installer does；L115–120 CLI commands。

## 6. Imbad0202/academic-research-skills-codex

- 方式：command
- 环境：Codex CLI或Codex Desktop插件宿主；README说明插件以实体文件避免Windows缓存软链接问题，未注明统一操作系统版本或最低Codex版本。
- 依赖：插件路线未列额外必需依赖；替代的直接技能安装方式需Python 3和Codex自带skill-installer。可选引用核查API密钥仅在选择相关功能时需要，不是正常路由的前置要求；具体子工具按文档配置。
- 范围：在终端使用Codex CLI添加市场并安装插件；安装后开启新的Codex会话，调用$academic-research-suite。
- [安装原文](https://github.com/Imbad0202/academic-research-skills-codex/blob/main/README.md#install-ars-codex-plugin) · [核验快照](https://github.com/Imbad0202/academic-research-skills-codex/blob/8d6a1f856ee3da9d3a5e2b7f292b3dfe72b592c5/README.md#install-ars-codex-plugin)
- 定位：README.md L103–135 plugin/desktop安装和重开会话；L137–152直接安装需python3；suite SKILL.md L255 optional bibliographic settings not required for normal routing。
- 文档限制：README链接的ars/docs/SETUP.md保留大量上游Claude安装内容；不可把该文件的Claude平台和依赖要求直接套用到Codex插件。

## 7. HKUSTDial/Supervisor-Skills

- 方式：manual
- 环境：Claude Code、Cursor、Codex等AI助手；未注明统一操作系统要求。
- 依赖：未列统一必要依赖清单；具体工具和依赖按所选子技能文档。
- 范围：将官方Quick Start中的安装提示词发给Claude Code、Cursor或Codex等AI助手，再按所选技能文档操作；README未提供可直接复制的终端安装命令。
- [安装原文](https://github.com/HKUSTDial/Supervisor-Skills/blob/main/README.md#快速开始-quick-start) · [核验快照](https://github.com/HKUSTDial/Supervisor-Skills/blob/a20d76ef3979b804d7dbf599d577826957e0a8a9/README.md#快速开始-quick-start)
- 定位：README.md L179–185 Quick Start只提供“Help me install Supervisor-Skills from … with Skills.”提示词。

## 8. hoochanlon/hamuleite

- 方式：reference
- 环境：未注明宿主Agent或统一操作系统要求。
- 依赖：未提供统一运行依赖；链接到的工具或技能应遵循各自官方文档。
- 范围：这是学术、教育与金融资源导航库；按目录浏览资料或所链接工具，未提供统一技能包安装步骤。
- [安装原文](https://github.com/hoochanlon/hamuleite/blob/master/README.md#list) · [核验快照](https://github.com/hoochanlon/hamuleite/blob/5b0b86b5b59477218db42d0a6e7b3282a7de2dc4/README.md#list)
- 定位：README.md L42–61 List为资源目录，包括“人文社会科学研究与写作 AI Skill 总览”，无安装章节。

## 9. ChenLiu-1996/figures4papers

- 方式：manual
- 环境：Cursor、Claude Code、Codex等AI编码助手；未注明统一操作系统要求。
- 依赖：仅按路径读取技能不需插件或软链接；实际绘图使用Python/matplotlib，版本和额外库按具体figure脚本或子文档，README未列统一安装依赖清单。
- 范围：无需安装：在AI编码助手打开仓库并在提示词中引用scientific-figure-making/SKILL.md及references。也可从仓库根目录按官方表格为Cursor/Claude Code/Codex建立软链接，之后刷新技能列表。
- [安装原文](https://github.com/ChenLiu-1996/figures4papers/blob/main/README.md#using-this-skill-in-an-ai-coding-agent) · [核验快照](https://github.com/ChenLiu-1996/figures4papers/blob/b709de17da7e8f9a72e51a5de5bced924a01eeab/README.md#using-this-skill-in-an-ai-coding-agent)
- 定位：README.md L79–91免安装路径式工作流；L111–121宿主软链接表。SKILL.md声明publication-ready matplotlib figures，未指定版本。

## 10. Master-cai/Research-Paper-Writing-Skills

- 方式：manual
- 环境：Codex、Claude Code或Gemini；未注明统一操作系统要求。
- 依赖：保留research-paper-writing完整目录及references；README未列Python、Node.js或其他统一运行依赖。
- 范围：先取得仓库并在仓库根目录操作；按Codex、Claude Code全局/项目或Gemini选择对应复制步骤。Codex路线依赖已正确配置的CODEX_HOME，故保留官方分步说明。
- [安装原文](https://github.com/Master-cai/Research-Paper-Writing-Skills/blob/main/README.md#installation) · [核验快照](https://github.com/Master-cai/Research-Paper-Writing-Skills/blob/77e7c2c1ba06f7d71844873147665437a03aac1b/README.md#installation)
- 定位：README.md L29–39 “Assume you are in the repository root”并复制到$CODEX_HOME/skills；L48–75给Claude及Gemini复制路径。

## 11. jihe520/MathModelAgent

- 方式：command
- 环境：Skills 安装未注明系统和宿主最低版本；doctor 文档覆盖 macOS、Linux、Windows。桌面版提供 macOS Apple/Intel 和 Windows 64 位。
- 依赖：安装命令使用 npx，README 未注明其版本。完整建模工作流按任务需要 Python 3、NumPy/SciPy/pandas/Matplotlib/scikit-learn/openpyxl；论文编译用 Typst 或 XeLaTeX（中文 LaTeX 模板必需）；流程图导出用 DrawIO；PDF 检查用 pdftoppm，mutool/ImageMagick 为备用。桌面版只需填写模型 API Key，无需自行安装 Python/Node.js/Redis；Web 自部署另需 Docker 或 Python/Node.js/Redis。
- 范围：在终端执行官方 Skills 安装命令；供现有 Claude Code / Codex 使用。它安装技能，不部署 Web 应用。桌面版另从 Releases 安装，已内置 Claude Code 和技能。
- [安装原文](https://github.com/jihe520/MathModelAgent/blob/main/README.md#install--usage) · [核验快照](https://github.com/jihe520/MathModelAgent/blob/03f4eb388b3862b7bde55b508dceaf3d6b39d5ac/README.md#install--usage)
- 定位：README lines 159–174: npx skills add jihe520/MathModelAgent --all; desktop lines 21–33; doctor core tools and Python package tables.

## 12. zLanqing/codex-claude-academic-skills

- 方式：manual
- 环境：Claude Code 或 Codex；README 未注明操作系统、宿主最低版本。
- 依赖：安装为目录复制；若克隆需要 Git。README 没有统一依赖清单，office 文档生成、写作辅助、MATLAB/Python 科学计算需按各子技能文档配置。
- 范围：按官方跨平台安装章节把三个技能目录复制到 Claude Code / Codex 全局目录，或当前项目的 .claude/skills / .codex/skills。原文克隆和插件示例仍含“你的用户名”及不同仓库名占位符，不提供可复制的一键命令。
- [安装原文](https://github.com/zLanqing/codex-claude-academic-skills/blob/main/README.md#跨平台安装) · [核验快照](https://github.com/zLanqing/codex-claude-academic-skills/blob/7ed6377f0efb6a38951b48ef03b19d996e454b1f/README.md#跨平台安装)
- 定位：README lines 153–190: git clone https://github.com/你的用户名/claude-academic-skills.git; global and project directory paths.

## 13. brycewang-stanford/Auto-Empirical-Research-Skills

- 方式：command
- 环境：插件方式要求 Claude Code v2.1+；未注明操作系统要求。Codex/CodeBuddy 也有整库导入路径。
- 依赖：安装插件需 Claude Code；具体研究/计算依赖按所选技能文档（Python、Stata 或 R/Quarto 等），没有整库统一运行依赖。克隆整库应递归拉取 skills/69-Paper-WorkFlow 子模块；Python 3.9+ 的评分器是另一个可选组件，不是插件前置要求。
- 范围：在终端安装官方 aer-skills 首方插件栈（9 个论文流程技能），随后在 Claude Code 中 /reload-plugins 或重启。该命令不安装整个资料库；其他 Python/Stata/R 栈和 Codex 整库路由导入见完整安装文档。
- [安装原文](https://github.com/brycewang-stanford/Auto-Empirical-Research-Skills/blob/main/INSTALL.md#1-one-command-install--first-party-plugins-recommended) · [核验快照](https://github.com/brycewang-stanford/Auto-Empirical-Research-Skills/blob/7a2437b8fc972774fa23cf9c572df12ff5fd1334/INSTALL.md#1-one-command-install--first-party-plugins-recommended)
- 定位：INSTALL lines 6–12 requirements/submodule; 21–41 shell commands and reload; 47–63 available stacks; 67–108 alternative import paths.

## 14. Adkid-Zephyr/anti-defensive-writing-Skill

- 方式：command
- 环境：Codex 插件方式，或 Claude Code / Cursor / 其他 Agent 的 Skill 方式；提示词适用于任何 AI。未注明系统和最低宿主版本。
- 依赖：原文明确零依赖，插件没有 MCP 服务或额外运行依赖。Python 3 仅用于开发者构建发布 ZIP，不是使用技能的要求。
- 范围：在支持插件命令的 Codex 终端添加本仓库 marketplace 并安装插件；新对话选择 Anti-Defensive Writing。也可按 README 复制 Skill 目录或直接粘贴提示词。
- [安装原文](https://github.com/Adkid-Zephyr/anti-defensive-writing-Skill/blob/main/README.md#codex-插件安装) · [核验快照](https://github.com/Adkid-Zephyr/anti-defensive-writing-Skill/blob/82d31402caa0db1790026824399044538483171b/README.md#codex-插件安装)
- 定位：README lines 12–27 plugin install and no extra runtime dependencies; lines 51–67 prompt/skill alternatives.

## 15. Norman-bury/research-writing-skill

- 方式：manual
- 环境：Codex CLI；文档同时提供 POSIX shell 和 Windows PowerShell 步骤，未注明最低版本。README 还适配 Claude Code、Cursor、OpenCode、Gemini CLI。
- 依赖：Codex 安装文档唯一明确前置是 Git；绘图等运行需求按子技能文档，涉及 Python/Miniconda 和绘图依赖；Pandoc 是 Word 导出相关的可选工具。
- 范围：按 Codex 安装文档克隆到 ~/.codex/research-writing-skill，再将 skills 连接到 ~/.agents/skills/research-writing，重启 Codex 并检查链接。Windows 有单独 PowerShell 目录连接步骤；其他平台见 README。
- [安装原文](https://github.com/Norman-bury/research-writing-skill/blob/main/.codex/INSTALL.md#安装步骤) · [核验快照](https://github.com/Norman-bury/research-writing-skill/blob/6f7959554b4614d879d79cb4ece9ed04a7c8a88c/.codex/INSTALL.md#安装步骤)
- 定位：Codex INSTALL lines 5–28: Git, clone, symlink, Windows mklink /J, restart; lines 30–36 verify; README installation lines 64–81.

## 16. yilewang/llm-for-zotero

- 方式：manual
- 环境：运行于 Zotero 桌面端；README 快速开始未注明 Zotero 最低版本或统一系统限制。Codex/Claude Code 设置分别讨论 macOS、Windows、Linux；Windows Codex 连接要求 Windows 本地安装而非 WSL。
- 依赖：基本安装需 Zotero 和可用模型后端；API 模式需供应商 Base URL、Key、模型。WebChat 需浏览器扩展及对应站点访问权限；Codex 模式需已登录的 Codex CLI/订阅资格；实验性 Claude Code 模式明确需 Node.js 18+ 和已安装登录的 Claude Code。MinerU 仅本地高级 PDF 解析路径需要。
- 范围：从官方 Releases 下载 .xpi，在 Zotero 的 Tools → Add-ons → Install Add-on From File 中安装，重启并在首选项配置模型供应商及连接测试。按所选后端完成额外配置。
- [安装原文](https://github.com/yilewang/llm-for-zotero/blob/main/README.md#quick-start) · [核验快照](https://github.com/yilewang/llm-for-zotero/blob/8737af2a0f6cad8df7aac00aa50c1fb093080e3d/README.md#quick-start)
- 定位：README lines 115–129 .xpi install/configure; 466–475 Codex installation; 537–544 Claude Code requirements; 724–727 MinerU; 796–803 WebChat prerequisites.

## 17. OpenNSWM-Lab/FAROS

- 方式：manual
- 环境：Python 3.11+、Node.js 18+；README 命令明确针对 Linux / WSL 的 Bash。
- 依赖：本地必需 Git、Python/venv、backend/requirements.txt、Node.js/npm 和已配置的模型服务。Docker Engine/CPU 沙箱为运行实验的计算节点必需；GPU 实验另需 NVIDIA 驱动/Container Toolkit；论文编译需 latexmk、XeLaTeX、ctex/CJK 字体。网关 Caddy/OpenSSH 仅相应部署角色需要。
- 范围：按快速开始分别在 backend 和 frontend 安装并启动服务，再在设置页配置和测试模型。运行生成代码、计算节点部署、论文编译需继续完成部署指南相应依赖。
- [安装原文](https://github.com/OpenNSWM-Lab/FAROS/blob/main/README.md#快速开始) · [核验快照](https://github.com/OpenNSWM-Lab/FAROS/blob/60ce4bc235f169d71f2d11dbe37445b4e402b528/README.md#快速开始)
- 定位：README lines 145–185 requirements, separate services, model configuration; deploy/README.md dependency matrix lines 18–36.

## 18. huangwb8/ChineseResearchLaTeX

- 方式：manual
- 环境：Skills 兼容 Claude Code、OpenAI Codex、Cursor、GitHub Actions、VS Code；安装指南列出 macOS/Linux/WSL 和 Windows。模板测试平台 Windows/macOS/Overleaf。
- 依赖：Skills 引导安装仅依赖 Python 3 标准库；具体技能按子文档配置。编译模板另需 TeX Live（推荐）或 MacTeX、XeLaTeX（必需）及 BibTeX；本地构建 wrapper 用 Python。LaTeX 公共包按模板需要安装。
- 范围：按官方 Skills 安装与更新指南选择自然语言安装或系统对应的 Python 引导安装；LaTeX 公共包安装和模板编译是另外的步骤，不把安装整个公共包当作 Skills 安装。
- [安装原文](https://github.com/huangwb8/ChineseResearchLaTeX/blob/main/docs/manual-setup-guide.md#skills-安装与更新) · [核验快照](https://github.com/huangwb8/ChineseResearchLaTeX/blob/d288ea832e4b2ffca5a0cca97576d3413391a342/docs/manual-setup-guide.md#skills-安装与更新)
- 定位：manual guide lines 203–237: bootstrap installation, Python standard library only, OS-specific commands and local/remote modes; README lines 175–188 environment; 248–260 skills.

## 19. openags/paper-search-mcp

- 方式：command
- 环境：Python 3.10+；Claude Code Skill 路线需要 Claude Code。安装段未注明统一操作系统限制，给出的下载命令采用 shell。
- 依赖：此路线明确需 uv 与 Claude Code；Skill 下载命令用 curl。API keys 为可选，按检索来源配置到 ~/.config/paper-search-mcp/.env。只上传 Skill ZIP 不会安装 Python 依赖或 CLI；远程 HTTP/OAuth 部署需要另外的服务配置。
- 范围：在终端按官方 Claude Code Skill 路线先安装 CLI，再下载 Skill 到用户级 ~/.claude/skills/paper-search；下一次启动 Claude Code 生效。此路线不需要 MCP 配置；MCP 客户端另按官方其他安装方法。
- [安装原文](https://github.com/openags/paper-search-mcp/blob/main/README.md#claude-code-skill--recommended-for-claude-code-users) · [核验快照](https://github.com/openags/paper-search-mcp/blob/cab1b5cc276a0cd004a0044003926a6440088049/README.md#claude-code-skill--recommended-for-claude-code-users)
- 定位：README Python 3.10+ badge; lines 260–284 uv + Claude Code, two required install steps, optional keys, restart; 390–411 ZIP limitations.

## 20. LigphiDonk/academic-figure-generator

- 方式：command
- 环境：Skills 安装未注明系统/最低宿主版本，手动示例列出 Gemini CLI 和 Claude Code。完整应用后端激活示例针对 macOS/Linux。
- 依赖：Skills 安装命令使用 npx，未注明版本，也未列独立技能的统一额外依赖。完整应用另外要求 Python 3.12+、Node.js 18+、已安装登录的 Claude Code CLI（Claude Agent SDK）、NanoBanana/Gemini 图片 API Key，并按 README 配置 .env、后端和前端依赖；不要把这些应用要求等同于提示词技能安装前置。
- 范围：在终端执行官方 npx skills 命令安装 academic-figure-prompt 技能，供 AI 编程助手生成论文配图提示词；完整 Web 平台部署另按快速开始配置，不由此命令完成。
- [安装原文](https://github.com/LigphiDonk/academic-figure-generator/blob/main/README.md#安装方式) · [核验快照](https://github.com/LigphiDonk/academic-figure-generator/blob/0a2bec6bb56d6b47143a81909f8d818716bdcbab/README.md#安装方式)
- 定位：README lines 231–247: npx skills add and Gemini CLI/Claude Code copy paths; lines 100–105 full-app prerequisites; 114–152 .env and separate services.
