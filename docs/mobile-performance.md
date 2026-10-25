# 手机首屏性能对比（2026-10-25）

条件：Chromium，390×844、DPR 2，CPU 4 倍降速、下载 1.6 Mbps、上传 0.75 Mbps、150ms 延迟；每次新浏览器上下文、禁用缓存、不滚动，三次运行取中位数。使用同一 Vite preview 服务及 gzip；公开更新状态 API 固定为空响应，排除外部接口波动。基线为提交 234ddf9；优化后包含前 20 名新增安装信息。

| 指标 | 优化前 | 优化后 | 变化 |
| --- | ---: | ---: | ---: |
| First contentful paint | 3,156 ms | 2,612 ms | -17.2% |
| Observed largest contentful paint | 3,156 ms | 2,612 ms | -17.2% |
| Sample point after search UI visible + 500ms | 3,737 ms | 3,175 ms | -15.0% |
| Observed long-task blocking estimate | 649 ms | 614 ms | -5.4% |
| First search response | 102 ms | 103 ms | +1.0% |
| Initial scripts including ranking/history data | 388,888 bytes | 294,309 bytes | -24.3% |

说明：这是可重复的实验室模拟，不是真实手机或线上 CDN 的承诺。LCP 在固定采样点观测；长任务阻塞估算为采样前所有超过 50ms 的长任务超出部分之和，并非 Lighthouse 完整 TBT 测试。搜索时延基本持平，不宣称交互速度显著提高。绝对毫秒数受本机负载影响。

实施：表格、详情和对比弹窗按需加载；消息上下文只使用 Ant Design message.useMessage；纯容器不再携带 Card 的 Tabs/Skeleton 代码；运行环境与依赖长说明随详情组件加载。保留完整列表、搜索、筛选、收藏、URL 详情、主题、原始简介、图表和动画。

回归预算只统计 `/assets/` 内应用脚本（压缩后低于 250 kB），排除随每日榜单自然增长的 data/rankings.js 和 data/history.js。上表初始脚本总量包含这两项数据，因此与预算口径不同。

复测命令：

```sh
node scripts/measure-mobile.mjs http://127.0.0.1:4173/awesome-paper-research-skills/ /tmp/mobile-performance.json
```
