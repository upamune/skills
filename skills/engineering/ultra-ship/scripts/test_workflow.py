"""Offline checks for optional work and completion boundaries.

Run: python3 -m unittest discover -s skills/engineering/ultra-ship/scripts -p 'test_*.py'
"""

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import checkpoint
import reviewers
import verify


def state():
    return {
        "phases": [
            {"id": pid, "status": "done", "note": "", "rounds": []}
            for pid, _, _ in checkpoint.PHASES
        ],
        "values": {},
    }


def phase(data, pid):
    return next(p for p in data["phases"] if p["id"] == pid)


class CompletionTests(unittest.TestCase):
    def test_optional_work_can_be_skipped_with_a_reason(self):
        data = state()
        for pid in ("review:thermo", "review:simplify", "review:deslop", "canvas"):
            phase(data, pid).update(status="skipped", note="Small configuration change")
        phase(data, "review:code-review")["rounds"] = [{"n": 1, "findings": []}]
        report = verify.Report()
        verify.check_checkpoint(report, data)
        verify.check_findings(report, data)
        with tempfile.TemporaryDirectory() as tmp:
            verify.check_canvas(report, Path(tmp), data)
        self.assertTrue(report.passed, report.items)

    def test_skipping_cannot_hide_required_or_unfinished_work(self):
        for pid, status, note in (
            ("canvas", "skipped", ""),
            ("review:code-review", "skipped", "Small change"),
            ("pr", "skipped", "Unavailable"),
            ("ci", "blocked", "Permission denied"),
        ):
            with self.subTest(pid=pid):
                data = state()
                phase(data, pid).update(status=status, note=note)
                report = verify.Report()
                verify.check_checkpoint(report, data)
                self.assertFalse(report.passed)

    def test_missing_required_phase_fails(self):
        data = state()
        data["phases"] = [p for p in data["phases"] if p["id"] != "review:code-review"]
        report = verify.Report()
        verify.check_checkpoint(report, data)
        self.assertFalse(report.passed)

    def test_pending_in_scope_finding_fails(self):
        data = state()
        for p in data["phases"]:
            if p["id"].startswith("review:"):
                p["rounds"] = [{"n": 1, "findings": []}]
        phase(data, "review:code-review")["rounds"][0]["findings"] = [
            {"id": "F1", "safe": True, "applied": False, "note": "Not fixed yet"}
        ]
        report = verify.Report()
        verify.check_findings(report, data)
        self.assertFalse(report.passed)

    def test_requested_canvas_still_requires_an_artifact(self):
        data = state()
        with tempfile.TemporaryDirectory() as tmp:
            data["values"]["canvas_path"] = "review.html"
            report = verify.Report()
            verify.check_canvas(report, Path(tmp), data)
            self.assertFalse(report.passed)
            (Path(tmp) / "review.html").write_text("<h1>Review</h1>")
            report = verify.Report()
            verify.check_canvas(report, Path(tmp), data)
            self.assertTrue(report.passed)

    def check_ci(self, data, result):
        pr = {"url": "https://example.invalid/pr/1", "state": "OPEN", "isDraft": True, "baseRefName": "main"}
        report = verify.Report()
        with patch.object(verify, "sh", side_effect=[(0, json.dumps(pr)), result]):
            verify.check_pr(report, True, data)
        return report.passed

    def test_no_ci_needs_a_recorded_configuration_check(self):
        data = state()
        self.assertFalse(self.check_ci(data, (0, "[]")))
        phase(data, "ci").update(status="skipped", note="No CI workflow is configured")
        self.assertFalse(self.check_ci(data, (0, "[]")))
        data["values"]["ci_status"] = "none"
        self.assertTrue(self.check_ci(data, (0, "[]")))
        self.assertTrue(self.check_ci(data, (1, "no checks reported on the 'topic' branch")))

    def test_no_ci_record_cannot_hide_real_failure_or_fetch_error(self):
        data = state()
        phase(data, "ci").update(status="skipped", note="No CI workflow is configured")
        data["values"]["ci_status"] = "none"
        for result in (
            (1, "HTTP 403: Resource not accessible"),
            (1, "network timeout"),
            (1, '[{"name":"test","bucket":"fail"}]'),
            (8, '[{"name":"test","bucket":"pending"}]'),
        ):
            with self.subTest(result=result):
                self.assertFalse(self.check_ci(data, result))

    def test_passing_ci_is_accepted(self):
        self.assertTrue(self.check_ci(state(), (0, '[{"name":"test","bucket":"pass"}]')))


class ReviewerTests(unittest.TestCase):
    def test_default_stays_with_current_agent_without_probing_external_clis(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(reviewers, "run_quiet") as probe:
            self.assertEqual([r.id for r in reviewers.pick(9, set())], ["host"])
            probe.assert_not_called()

    def test_explicit_reviewer_order_is_preserved(self):
        with patch.dict(os.environ, {"ULTRA_SHIP_REVIEWERS": "codex:gpt-5.6-sol,host"}):
            self.assertEqual([r.id for r in reviewers.ordered_ledger()], ["codex:gpt-5.6-sol", "host"])

    def test_unknown_reviewer_is_not_silently_substituted(self):
        with patch.dict(os.environ, {"ULTRA_SHIP_REVIEWERS": "not-a-reviewer"}):
            with self.assertRaises(SystemExit):
                reviewers.ordered_ledger()


if __name__ == "__main__":
    unittest.main()
