// Small, explicit intent vocabulary. Product-name queries stay literal.
const groups = [
  {
    task: "write",
    queries: [
      "润色",
      "论文润色",
      "学术润色",
      "proofread",
      "proofreading",
      "polish",
      "polishing",
    ],
    terms: ["润色", "proofread", "proofreading", "polish", "polishing"],
  },
  {
    task: "write",
    queries: ["论文写作", "学术写作", "paper writing", "academic writing"],
    terms: [
      "论文写作",
      "学术写作",
      "paper writing",
      "paper-writing",
      "academic writing",
      "academic-writing",
      "manuscript",
    ],
  },
  {
    task: "figures",
    queries: [
      "绘图",
      "科研绘图",
      "论文配图",
      "画图",
      "图表",
      "figure",
      "figures",
      "plot",
      "plots",
      "plotting",
      "diagram",
      "diagrams",
    ],
    terms: [
      "绘图",
      "论文配图",
      "画图",
      "图表",
      "figure",
      "figures",
      "plot",
      "plots",
      "plotting",
      "diagram",
      "diagrams",
    ],
  },
  {
    task: "find",
    queries: [
      "文献检索",
      "论文检索",
      "找文献",
      "literature search",
      "paper search",
    ],
    terms: [
      "文献检索",
      "论文检索",
      "literature search",
      "literature-search",
      "paper search",
      "paper-search",
      "literature retrieval",
    ],
  },
  {
    task: "find",
    queries: [
      "文献管理",
      "参考文献管理",
      "reference management",
      "citation management",
    ],
    terms: [
      "文献管理",
      "reference management",
      "reference-management",
      "citation management",
      "zotero",
      "mendeley",
      "endnote",
    ],
  },
  {
    task: "read",
    queries: [
      "读论文",
      "论文阅读",
      "文献阅读",
      "paper reading",
      "paper reader",
    ],
    terms: [
      "读论文",
      "论文阅读",
      "文献阅读",
      "paper reading",
      "paper-reading",
      "paper reader",
      "paper-reader",
      "read papers",
    ],
  },
  {
    task: "read",
    queries: ["翻译", "论文翻译", "translate", "translation", "translating"],
    terms: ["翻译", "translate", "translation", "translating"],
  },
  {
    task: "reproduce",
    queries: [
      "复现",
      "实验复现",
      "复现实验",
      "reproduce",
      "reproducibility",
      "replication",
    ],
    terms: [
      "复现",
      "reproduce",
      "reproducibility",
      "reproducible",
      "replication",
    ],
  },
  {
    task: "review",
    queries: ["审稿", "同行评审", "peer review", "peer-review"],
    terms: [
      "审稿",
      "同行评审",
      "peer review",
      "peer-review",
      "reviewer",
      "reviewers",
      "referee",
    ],
  },
];
const normalize = (query) => query.trim().toLowerCase();
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function suggestedTaskIds(query) {
  const q = normalize(query);
  return [
    ...new Set(
      groups
        .filter((group) => group.queries.includes(q))
        .map((group) => group.task),
    ),
  ];
}
export function createSearch(query) {
  const q = normalize(query);
  const aliases = [
    ...new Set(
      groups
        .filter((group) => group.queries.includes(q))
        .flatMap((group) => group.terms),
    ),
  ].filter((term) => term !== q);
  const word = "[\\p{L}\\p{N}_]";
  const patterns = q
    ? [
        new RegExp(escape(q), "giu"),
        ...aliases.map(
          (term) =>
            new RegExp(
              (/^[a-z0-9]/i.test(term) ? `(?<!${word})` : "") +
                escape(term) +
                (/[a-z0-9]$/i.test(term) ? `(?!${word})` : ""),
              "giu",
            ),
        ),
      ]
    : [];
  return {
    patterns,
    matches(text) {
      if (!patterns.length) return true;
      return patterns.some((pattern) => {
        pattern.lastIndex = 0;
        return pattern.test(text);
      });
    },
  };
}
