import unittest

from scripts.update_rankings import render_readme


def entry(name, kind, **extra):
    return {
        "repo": f"example/{name}", "url": f"https://github.com/example/{name}",
        "repository_kind": kind, "stars": 200, "description": f"Original {name} description",
        "agents": ["codex"], "star_delta_7d": 0, **extra,
    }


def dataset(items):
    return {"metadata": {"generated_at": "2026-10-28T02:20:00Z", "min_stars": 100, "total": len(items)}, "items": items}


class ReadmeTest(unittest.TestCase):
    def test_separate_types_and_rerank_skills_without_mutating_dataset(self):
        data = dataset([entry("tool", "related", stars=500), entry("alpha", "skill"), entry("pending", "unknown"), entry("beta", "skill")])
        text = render_readme(data)
        skills = text.split("## Skills 榜单\n")[1].split("## 科研相关项目\n")[0]
        related = text.split("## 科研相关项目\n")[1].split("## 收录与更新\n")[0]
        self.assertIn("Skills **2**", text)
        self.assertIn("科研相关项目 **1**", text)
        self.assertIn("类型待核验 **1**", text)
        self.assertIn("| 1 | [example/alpha]", skills)
        self.assertIn("| 2 | [example/beta]", skills)
        self.assertNotIn("example/tool", skills)
        self.assertNotIn("example/pending", skills + related)
        self.assertIn("example/tool", related)
        self.assertNotIn("example/alpha", related)
        self.assertNotIn("rank", data["items"][1])

    def test_daily_arrivals_follow_beijing_day_and_exclude_baseline_and_related(self):
        items = [
            entry("today", "skill", first_seen_at="2026-10-27T16:01:00Z"),
            entry("yesterday", "skill", first_seen_at="2026-10-27T15:59:00Z"),
            entry("baseline", "skill", first_seen_date="2026-10-28", first_seen_is_baseline=True),
            entry("tool", "related", first_seen_at="2026-10-28T00:00:00Z"),
            entry("legacy", "skill", first_seen_date="2026-10-28"),
            entry("invalid", "skill", first_seen_at="2026-10-28T01:00:00"),
            entry("invalid-date", "skill", first_seen_date="20261028"),
        ]
        text = render_readme(dataset(items))
        daily = text.split("## 今日新增 Skills\n")[1].split("## Skills 榜单\n")[0]
        self.assertIn("新增 Skills **2**", daily)
        for name in ["today", "legacy"]:
            self.assertIn(f"[example/{name}]", daily)
        for name in ["yesterday", "baseline", "tool", "invalid", "invalid-date"]:
            self.assertNotIn(f"[example/{name}]", daily)
        self.assertIn("2026-10-28 10:20 UTC+8", text)

    def test_empty_daily_list_does_not_claim_new_repositories(self):
        text = render_readme(dataset([]))
        self.assertIn("本次更新日暂无新收录的 Skills", text)
        self.assertIn("暂无已确认类型的 Skills", text)
        self.assertIn("暂无科研相关项目", text)
        self.assertNotIn("## 本周新收录", text)

    def test_table_escapes_original_description_and_formats_signed_growth(self):
        text = render_readme(dataset([entry("alpha", "skill", description="Original | description", star_delta_7d=-3)]))
        self.assertIn("Original \\| description", text)
        self.assertIn("| -3 |", text)
        self.assertNotIn("+-3", text)

    def test_generator_keeps_navigation_preview_and_upstream_credit(self):
        text = render_readme(dataset([entry("alpha", "skill")]))
        for task in ["find", "read", "write", "figures", "reproduce", "review"]:
            self.assertIn(f"#task={task}", text)
        self.assertIn("assets/readme-dashboard.png", text)
        self.assertIn("kael-odin/awesome-academic-research-skills", text)
        self.assertIn("MIT 许可证和版权声明", text)
        self.assertIn("README 会由采集脚本自动生成", text)
        self.assertEqual(text, render_readme(dataset([entry("alpha", "skill")]), window_snapshot={"old": {}}))
