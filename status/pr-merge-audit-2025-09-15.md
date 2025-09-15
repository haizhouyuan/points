# PR Merge Audit — 2025-09-15

Repository: haizhouyuan/points
Default branch: `main`
Local HEAD: synced to `origin/main`

## Executive Summary

- PR #1 and PR #2 are both OPEN and NOT merged.
- Their core code is NOT present in `main`.
- Both branches are not ancestors of `origin/main` and show substantial diffs vs `main`.
- Each PR contains tracked generated artifacts and sensitive files that should be removed from version control before merging.

## PR Status (GitHub)

- PR #1 — Phase 1 完成 - 核心业务逻辑系统实现
  - state: open, draft: false, merged_at: null, base: `main`, head: `phase1-business-logic-framework`
  - mergeable_state: dirty (has conflicts)

- PR #2 — Phase 2.2 + 2.4: Unified Integration
  - state: open, draft: false, merged_at: null, base: `main`, head: `phase2-advanced-gamification`
  - mergeable_state: dirty (has conflicts)

## Is content already in `main`?

Short answer: NO for both PRs.

Evidence (selected):

- `git merge-base --is-ancestor <branch> origin/main` → NO (for both PRs)
- PR #1 (`origin/phase1-business-logic-framework`)
  - 3-dot (branch-only files): 196 files differ vs `origin/main` (repo-wide)
  - 2-dot shortstat: 41,488 files changed, +69,922/−4,590,143 (large due to tracked generated artifacts; rename detection skipped)
  - src-only: 22 files changed, +4,620/−717
  - `git cherry -v origin/main origin/phase1-business-logic-framework` → unique_commits=2
  - Tag `phase1-complete` is on this branch, NOT contained in `main` history

- PR #2 (`origin/phase2-advanced-gamification`)
  - 3-dot (branch-only files): 19,221 files differ vs `origin/main` (repo-wide)
  - 2-dot shortstat: 31,183 files changed, +681,322/−3,207,395
  - src-only: 49 files changed, +15,188/−3,441
  - `git cherry -v origin/main origin/phase2-advanced-gamification` → unique_commits=11
  - Tags `v2.2.0-major-refactor` and `v2.1.9-stable` are contained in PR#2 branch, NOT in `main` history

## Key files absent in `main` (selected checks)

- PR #1 additions (absent in `origin/main`):
  - `src/services/` api-client.ts, auth.service.ts, business-logic.service.ts, gamification.service.ts, index.ts,
    navigation.service.ts, points.service.ts, task.service.ts, types.ts
  - `src/contexts/AuthContext.tsx`
  - Components: `src/components/HabitTrackerSection.tsx`, `RewardsSection.tsx`, `TaskHistorySection.tsx`

- PR #2 additions (absent in `origin/main`):
  - `src/services/analytics.service.ts`, `src/services/learning-path.service.ts`
  - Components: `src/components/LearningAnalyticsChart.tsx`, `LearningAnalyticsDashboard.tsx`,
    `LearningPathExecutor.tsx`, `LearningPathPlanner.tsx`, `LearningInsightsPanel.tsx`
  - Tests: `src/__tests__/analytics.service.test.ts`, `src/__tests__/learning-path.service.test.ts`

## Other observations

- Already merged PRs:
  - #6 (feature/docs-infrastructure-update) → merged
  - #3 (test-cicd-pipeline) → merged
- Remote branches still exist for merged work:
  - `origin/feature/docs-infrastructure-update` (no diff vs `main`)
  - `origin/test-cicd-pipeline` (contains tracked `backend/node_modules/**` etc.; historical artifact)
- Version branch `origin/stable/v2.1.x` has very large diffs and contains Phase 2 content; it does not align with a “stable” branch purpose.

## Risks and blockers (both PRs)

- Tracked generated/sensitive files need removal from VCS:
  - `.env`, `backend/.env*`
  - `backend/node_modules/**`
  - `backend/coverage/**`
  - `.playwright-mcp/*.png`
  - Large binary/coverage artifacts inflate diffs and complicate merges.

## Recommendations

1) Clean up branches before merge
   - Remove tracked generated/sensitive files from index on each PR branch (see commands below).
   - Ensure `.gitignore` covers these paths; more importantly, untrack what’s already committed.

2) Rebase onto latest `origin/main`
   - Resolve conflicts; keep changes focused on source code and docs only.

3) Split PR #2 into smaller, reviewable PRs
   - Proposed split: (a) Analytics service + UI + tests; (b) Learning Path service + UI + tests; (c) Docs and configs.

4) Remote branch hygiene
   - Delete merged branches: `feature/docs-infrastructure-update`, `test-cicd-pipeline`.
   - Clarify version line: if maintaining 2.1 stable, base a `release/v2.1.x` off tag `v2.1.9-stable`.

## Suggested command sequences (manual; not executed)

Clean tracked artifacts on a feature branch (example: PR #1):

```bash
git fetch --all --prune
git checkout phase1-business-logic-framework

# Untrack generated/sensitive files that were previously committed
git rm -r --cached backend/coverage || true
git rm -r --cached backend/node_modules || true
git rm -r --cached .playwright-mcp || true
git rm --cached .env backend/.env backend/.env.* || true

# Commit cleanup
git commit -m "chore(clean): untrack generated/sensitive files"

# Rebase onto latest main
git rebase origin/main
# Resolve conflicts as needed, then continue
git rebase --continue
git push -f origin HEAD
```

Split PR #2 into smaller PRs (high-level outline):

```bash
git checkout -b feat/analytics-from-pr2 origin/phase2-advanced-gamification
# Retain only analytics service + charts + tests; drop unrelated changes
# Commit; push; open PR → main

git checkout -b feat/learning-path-from-pr2 origin/phase2-advanced-gamification
# Retain only learning-path service + planner/executor + tests
# Commit; push; open PR → main

git checkout -b chore/docs-config-from-pr2 origin/phase2-advanced-gamification
# Retain docs and config/tiny fixes only
# Commit; push; open PR → main
```

Remote branch cleanup (after verification):

```bash
git push origin --delete feature/docs-infrastructure-update
git push origin --delete test-cicd-pipeline
```

Stable line adjustment (if needed):

```bash
# Create/force a clean stable line from tag
git branch -f release/v2.1.x v2.1.9-stable
git push -f origin release/v2.1.x
```

---

Prepared by: PR Merge Audit Tooling (manual analysis)
Date: 2025-09-15

