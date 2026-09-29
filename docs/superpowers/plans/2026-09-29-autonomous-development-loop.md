# Cinemap Continuous Autonomous Development Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make merge an intermediate transition so autonomous Cinemap work re-evaluates latest main and continues toward explicit acceptance gates.

**Architecture:** Repository instructions define the outer convergence loop and legal stop states; an Ocean acceptance document supplies the active feature gates. Existing deterministic quality gate/Playwright remain the verification mechanism rather than introducing a new paid service or runtime daemon.

**Tech Stack:** Markdown repository policy, existing Python quality gate, existing GitHub Actions/Playwright.

**Spec:** `docs/superpowers/specs/2026-09-29-autonomous-development-loop-design.md`

## Global Constraints
- Preserve existing features unless explicitly approved otherwise.
- iPhone/mobile is primary.
- Free-only; no paid/metered APIs, paid AI runtime, scraping, trackers, or unnecessary external requests.
- Follow `COMPLIANCE.md` and `docs/free-only-policy.md`.
- Merge approved-scope PRs only after Autonomous quality gate succeeds.
- Repair deterministic failures at most three times.

## Review Focus
- A merged PR must lead to latest-main re-evaluation rather than a completion state.
- A running/failed CI must never be mistaken for mergeable success.
- Human-required decisions must stop rather than be guessed.
- Acceptance status must not use subjective percentages.
- Ocean completion must be judged against explicit gates, including iPhone usability and preservation of recording/navigation journeys.

---

### Task 1: Encode the outer autonomous loop

**Files:**
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: repository policies and existing quality gate commands.
- Produces: normative observe/evaluate/implement/verify/integrate/re-observe loop and stop-state contract.

- [ ] Replace the old human-approval-only merge rule with approved-scope CI-gated merge behavior while preserving human escalation for HUMAN_REQUIRED cases.
- [ ] State explicitly that PR creation, CI success, merge, progress, next-task identification, and percentages are illegal stop reasons.
- [ ] Require latest-main re-evaluation immediately after every merge.
- [ ] Preserve the three-repair limit and deterministic-first policy.
- [ ] Verify the resulting instructions are consistent with `COMPLIANCE.md` and `docs/free-only-policy.md`.

### Task 2: Add Ocean acceptance gates

**Files:**
- Create: `docs/ocean-acceptance.md`

**Interfaces:**
- Consumes: Ocean/Aquarium approved product goal.
- Produces: ordered gates with statuses limited to UNKNOWN/PASS/FAIL/BLOCKED.

- [ ] Define gates for record-to-ecosystem update, rating effect, biodiversity growth, non-genre-map behavior, environmental maturation, sparse-vs-mature visual distinction, iPhone usability, renderer fallback, persistence, quality-gate success, and visual regression safety.
- [ ] Prohibit percentage completion and require evidence from current main.
- [ ] Define priority ordering so the next autonomous task is deterministic when multiple gates fail.

### Task 3: Deterministic policy regression guard

**Files:**
- Create or modify the smallest suitable test under `tests/` or `scripts/` following existing repository patterns.
- Modify: `scripts/quality_gate.py` only if needed to register the guard.

**Interfaces:**
- Consumes: `AGENTS.md` and `docs/ocean-acceptance.md`.
- Produces: deterministic failure if the continuation/stop contract is accidentally removed.

- [ ] Write a failing policy test asserting post-merge re-evaluation, the four legal stop states, and absence of percentage completion semantics.
- [ ] Run the focused test and confirm it fails before policy implementation where practical.
- [ ] Implement/register the minimal guard.
- [ ] Run the focused test and confirm PASS.
- [ ] Run `python scripts/quality_gate.py` and confirm PASS.

### Task 4: PR and integration

**Files:**
- No product-code additions beyond Tasks 1-3.

**Interfaces:**
- Consumes: verified branch.
- Produces: reviewable PR and, after successful Autonomous quality gate, main integration.

- [ ] Open one PR summarizing the orchestration change and deterministic verification.
- [ ] Check Autonomous quality gate.
- [ ] Repair failures up to three times if necessary.
- [ ] If successful and still within approved scope, merge without another user confirmation.
- [ ] Re-fetch latest main and verify the new continuation contract is present; this merge itself is not a reason to stop future autonomous product work.
