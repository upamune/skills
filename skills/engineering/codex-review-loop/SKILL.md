---
name: codex-review-loop
description: "Run a tight GitHub PR review loop with @Codex review: wait for the exact head commit, address every finding, test, push, and repeat until Codex returns no findings. Use when a PR exists and the user asks to keep fixing Codex review feedback until the PR is clean."
---

# Codex Review Loop

Drive a pull request through a tight `review -> fix -> verify -> push` loop. Do not declare success from a stale review or from resolving only the newest comments: the latest PR head must receive a completed Codex review with zero new findings, and no applicable Codex thread may remain unresolved.

## Inputs

- PR number or URL, optional; otherwise detect the PR for the current branch.
- One-off review focus, optional; append it after `@codex review`.
- Maximum iterations, optional; default to 10.

## 1. Bind the loop to one PR

Require `git` and authenticated `gh`. Resolve the repository and PR:

```bash
gh repo view --json nameWithOwner --jq .nameWithOwner
gh pr view <PR_OR_CURRENT_BRANCH> \
  --json number,url,state,headRefName,headRefOid,baseRefName,isCrossRepository
git status --short
git rev-parse HEAD
```

Read the repository's applicable `AGENTS.md` files before changing code.

- Require an open PR. This skill has no non-PR fallback.
- Work on the PR head branch. Switch only when the worktree is clean enough to do so safely.
- Record pre-existing modified and untracked paths. Never discard or include unrelated user changes. Stop if a required fix overlaps changes that cannot be separated safely.
- Confirm the local commit and the PR `headRefOid` agree after pushing.
- For fork PRs or protected branches, confirm the current checkout can push to the PR head before starting the loop.

Fetch every unresolved Codex-authored review thread on the PR with GitHub GraphQL `reviewThreads`, including each thread's id, root comment database id, path, line, and body. Build the initial backlog:

- If an old finding still applies to the current head, treat it as a finding to fix before requesting another review.
- If the current head already addresses it, verify the fix, reply with evidence, and resolve that exact thread.
- If it is not applicable, reply with concrete evidence and resolve that exact thread only when repository practice permits.
- If its status cannot be established safely, mark it `blocked` and stop for user direction.

Process applicable backlog items with the fix, verification, commit, push, reply, and exact-thread resolution rules in steps D and E before posting the first new review trigger.

This step is complete when the repository, PR number, head branch, exact head SHA, and pre-existing worktree state are known; every previously unresolved Codex thread is addressed or explicitly blocked; and the agent can safely push fixes.

## 2. Run the tight loop

Repeat at most the configured number of iterations. Each posted `@codex review` comment consumes one iteration, even if the response later becomes stale or fails.

### A. Trigger a review for the exact head

Push committed fixes first. Capture the current PR head as `EXPECTED_SHA`, then create the trigger comment through the API so its id and timestamp are unambiguous:

```bash
gh api "repos/$REPO/issues/$PR/comments" \
  -f body='@codex review' \
  --jq '{id,created_at,html_url}'
```

If the user supplied a focus, use `@codex review for <focus>` instead. Record the trigger comment id and `created_at`.

Do not post another trigger for the same iteration. A visible `eyes` reaction is acknowledgement, not completion.

### B. Wait for Codex, not merely GitHub checks

Poll every 30 seconds for up to 20 minutes. During every poll, verify that the PR head is still `EXPECTED_SHA`. If another actor changes the head, discard the stale wait result and stop the run with both SHAs. Do not reset, rebase, merge, force-push, or silently adopt concurrent changes; the user can restart the skill from the new head.

The current GitHub author is `chatgpt-codex-connector[bot]`. Inspect events created by that author after the recorded trigger:

```bash
gh api "repos/$REPO/pulls/$PR/reviews" --paginate
gh api "repos/$REPO/pulls/$PR/comments" --paginate
gh api "repos/$REPO/issues/$PR/comments" --paginate
gh api "repos/$REPO/issues/comments/$TRIGGER_ID/reactions" --paginate
gh api "repos/$REPO/issues/$PR/reactions" --paginate
```

Accept completion only when one of these signals belongs to this trigger and `EXPECTED_SHA`:

1. A submitted Codex review whose `commit_id` is `EXPECTED_SHA`.
2. A Codex completion comment after the trigger that names the reviewed commit.
3. A `+1` reaction from Codex on either the trigger comment or the PR itself, which is the no-findings signal used by some GitHub integration versions. For a PR-level reaction, require its `created_at` to be at or after the recorded trigger time; a pre-existing reaction does not count.

Treat a Codex error, authentication message, missing acknowledgement, or timeout as a blocked iteration. Report it; do not pretend that silence means zero findings.

This step is complete only when a terminal Codex response is correlated with the trigger and the unchanged expected head.

### C. Extract only this review's findings

For a submitted review, select root pull-request review comments whose `pull_request_review_id` matches that review id. Exclude replies and comments from earlier reviews because those were handled in the initial backlog. The review body may summarize the same inline findings; do not double-count it.

If there are no root comments and Codex gave a clean completion signal, the loop is green. Go to the final gate.

Otherwise make an iteration ledger containing every finding's comment id, priority if present, path, line, and disposition:

- `fix`: the issue is valid and can be corrected safely.
- `not-applicable`: the claim is false or intentional; retain concrete evidence.
- `blocked`: fixing it needs product intent, unavailable access, or a prohibited/destructive action.

Do not optimize for silence by weakening tests, deleting safeguards, changing repository review rules, or making speculative broad rewrites. A repeated disputed finding is not a clean review.

This step is complete when every finding from exactly one Codex review appears once in the ledger with evidence-backed disposition.

### D. Fix and verify every actionable finding

For each `fix` item:

1. Read the surrounding implementation, tests, and applicable repository instructions.
2. Make the smallest coherent fix that addresses the root cause.
3. Add or update a regression test when the behavior is testable.
4. Run the narrow test first, then the repository's required validation for the affected area.

For `not-applicable`, reply in the thread with concise evidence rather than changing correct code. Stop for user direction if any item is `blocked`.

Never use destructive cleanup or data-loss operations as a shortcut to make validation pass. Follow repository-specific safety instructions exactly.

This step is complete when every non-blocked finding is fixed or rebutted with evidence and all required validation passes.

### E. Commit, push, and close addressed threads

Review the diff before staging. Stage only the files or hunks owned by this iteration; never use a blanket stage when pre-existing changes exist. Follow the repository's commit convention, with this fallback:

```bash
git commit -m "fix: address Codex review findings"
git push
```

Reply to each addressed Codex comment with the fix commit or the evidence. Resolve only the exact threads represented in the ledger, and only after the fix is pushed and verified. Never bulk-resolve unrelated or unaddressed threads.

Refresh the PR and confirm its `headRefOid` equals the pushed local `HEAD`. Return to step A with a new iteration number.

This step is complete when the verified fixes are on the PR head, addressed threads are accounted for, and local and remote SHAs match.

## 3. Apply the final gate

Report success only when all of these are true:

- The most recent manual trigger completed against the current PR `headRefOid`.
- That Codex response contains zero new root findings.
- No unresolved Codex thread from the initial backlog or any loop iteration remains applicable.
- Required tests for the last change passed.
- No loop-owned changes remain uncommitted or unpushed.
- Pre-existing user changes remain intact.

Hitting the iteration limit, timing out, receiving an integration error, or leaving a disputed or blocked finding is an incomplete result, not success.

## Report

```text
Codex Review Loop complete.
  PR:               <url>
  Clean head:       <sha>
  Iterations:       <n>
  Findings fixed:   <n>
  Findings rebutted:<n>
  Remaining:        0
```

For an incomplete result, replace `complete` with `stopped`, give the stopping reason, and list every remaining finding with path, line, priority, and disposition.
