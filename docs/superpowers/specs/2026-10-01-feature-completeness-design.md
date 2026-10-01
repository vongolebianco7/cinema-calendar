# Cinemap Feature Completeness Design

## Goal
Raise Cinemap's practical product completeness without adding major new feature families. The target is to make existing core journeys feel coherent, reliable, mobile-first, and ready for broader public use.

## Success Criteria
Cinemap is considered materially more complete when a user can reliably move through the primary journey on iPhone:

1. discover or search for a film;
2. open its detail page;
3. record watched state and a 1–5 rating with minimal interaction;
4. see the saved state immediately reflected in cards and My Cinemap;
5. revisit/reload without losing the record;
6. use related works, people, and critic/deep-dive links without dead or misleading states;
7. see Ocean reflect the saved record without breaking mobile performance.

The work should improve existing journeys rather than create new top-level product areas.

## Non-Negotiable Constraints
- Preserve existing features unless this design explicitly removes or consolidates redundant UI.
- iPhone/mobile is the primary target; 390px viewport must not horizontally overflow.
- No paid APIs, metered AI/API services, subscriptions, or new recurring costs.
- Avoid scraping and unnecessary external requests.
- Respect copyright, licenses, robots policies, API terms, `COMPLIANCE.md`, and `docs/free-only-policy.md`.
- Prefer local/static computation and already-approved data sources.
- Do not reintroduce the "Movie DNA" label.
- Do not fabricate critic consensus or missing metadata; unknown/insufficient data must be represented honestly.
- Existing Ocean acceptance criteria remain authoritative for Ocean-specific behavior.

## Scope and Priority

### Phase 1 — Recording UX
Make recording the most reliable cross-page interaction.

Requirements:
- A movie card/detail view can record watched state without forcing navigation to a separate form.
- Rating uses a single consistent meaning everywhere: `0 = not rated / not watched state`, `1–5 = user rating`.
- Recording updates visible UI immediately after save.
- Saved state persists after reload using the current approved local persistence mechanism.
- The same saved state is consumed by My Cinemap and Ocean; pages must not maintain divergent representations.
- A user can change or clear a previous rating without corrupting watched state.
- Mobile tap targets remain usable and do not create accidental horizontal overflow.

Non-goal: adding accounts or cloud sync.

### Phase 2 — Search and Discovery
Turn existing discovery surfaces into one predictable interaction model.

Requirements:
- Movie result grids that are intended as browse/search results use the existing three-column mobile presentation where already established by product direction.
- Common sorts are available consistently where meaningful: release year, rating, title, and newest/recently added when source data supports it.
- Filters/sort changes do not silently discard unrelated active search state.
- Empty results show a useful zero-state instead of a broken/blank section.
- Person/crew/genre navigation should route back into a usable film result surface.
- Existing specialist filters remain available; this phase consolidates interaction behavior rather than inventing another search system.

Non-goal: expanding every imaginable filter in the same PR.

### Phase 3 — Film Detail, Critic, and Deep Dive
Make detail pages trustworthy and easy to scan.

Information hierarchy:
1. essential film information;
2. record/rating controls;
3. related works and creators/cast;
4. critic/deep-dive information;
5. provenance/source links where applicable.

Requirements:
- Section hierarchy is visually consistent and optimized for iPhone.
- Existing creator/cast/company metadata is grouped as normal film information; the removed "Movie DNA" terminology must stay removed.
- Related items scroll or navigate reliably and do not trap the user in a dead end.
- Critic summaries are based only on verified real sources; present concise paraphrase plus source link rather than copied text.
- When evidence is sparse, explicitly show that there is insufficient information rather than synthesizing a fake consensus.
- Source links must be optional when no qualifying source exists; absence must not break layout.

Non-goal: having AI generate original criticism or opinions.

### Phase 4 — My Cinemap
Make My Cinemap a useful record dashboard rather than a separate competing product.

Requirements:
- My Cinemap reads the same canonical local record store used by cards/detail pages.
- Recently recorded films and ratings are easy to review on mobile.
- The user can enter a recorded film and correct its rating with minimal navigation.
- Statistics/visualization shown must be derived from actual available records; avoid decorative metrics with ambiguous meaning.
- Ocean is presented as a consequence/reward of movie records, not as a replacement for the record list.

Non-goal: social feed, follower system, public profile, or cloud account.

### Phase 5 — Ocean Completion
Finish the currently approved Ocean direction before adding another Ocean feature family.

Requirements:
- Reconcile active Ocean PRs before starting duplicate changes.
- Keep `1 watched film = 1 logical creature` exact.
- Complete the approved milestone schedule and rigid-body swimming corrections.
- Large animals preserve believable size hierarchy and do not remain visibly bent while traversing the screen.
- Dense states retain visible habitat depth/open water and avoid an empty lower third.
- 500-creature iPhone visual/performance validation must pass the existing quality gate before Ocean is treated as complete for this program.
- No new paid/runtime image or AI dependency.

Non-goal: new 3D engine, multiplayer aquarium, cloud persistence, or genre-to-fish mapping.

### Phase 6 — Data and Release Quality
Raise trust and reduce broken states across all core journeys.

Requirements:
- Missing release/streaming/critic metadata is represented as unknown/unavailable, never guessed.
- Data with provenance requirements must keep source attribution in the existing approved form.
- Primary journey is covered by deterministic/mobile browser checks: search/discover -> detail -> record -> My Cinemap -> Ocean.
- Console/page errors in that journey are release blockers.
- 390px horizontal page overflow is a release blocker; internal horizontal rails remain allowed.
- Production deployment follows existing repository policy only after quality gates pass and approved changes land on `main`.

## Architecture

### Canonical record state
Do not create another storage model. Consolidate reads/writes around the existing approved record persistence layer. UI surfaces should consume a shared record shape/helper rather than duplicating interpretation of watched/rating state.

### Shared interaction behavior
Where multiple pages expose the same concern—record controls, result sorting, movie card state—prefer shared helpers/components/data contracts already present in the repository. Do not perform an unrelated framework rewrite.

### Progressive enhancement
Static/local behavior remains the baseline. External data enriches a page only when already approved and available; missing external data must degrade to a complete, truthful local UI.

### Ocean boundary
Ocean consumes user record state but retains its own renderer/acceptance tests. The feature-completeness work must not couple search/detail logic directly to renderer internals.

## Error Handling
- Invalid/corrupt local record data should fail soft: ignore/recover the invalid entry where possible and keep the app usable.
- Unsupported/missing metadata should produce a deliberate empty/unknown state, not placeholder claims.
- Failed optional external links/data must not block recording or navigation.
- UI operations must avoid leaving contradictory state across cards/detail/My Cinemap after save.

## Testing Strategy

Each implementation slice follows TDD or regression-first testing where practical and is delivered through a small PR.

Required gates by scope:
- deterministic unit/contract tests for record semantics, sorting/filter state, critic-data handling, and Ocean invariants;
- `python scripts/quality_gate.py` for every implementation PR;
- existing mobile Chromium + WebKit checks for UI changes;
- iPhone-sized end-to-end journey coverage for the core flow;
- Ocean visual/performance gate for Ocean changes;
- compliance review whenever a change alters external data access, source usage, storage, authentication, or user content handling.

## Delivery Order
1. Recording UX
2. Search and discovery consistency
3. Film detail / critic / deep-dive reliability
4. My Cinemap completion
5. Ocean completion/reconciliation
6. Cross-journey data and release QA

Each phase must leave `main` in a usable state. A PR, merge, or subjective completion percentage is not itself a stopping point; continue until the approved acceptance gates for the phase are satisfied or an allowed repository stop state is reached.

## Explicit Non-Goals for This Program
- accounts/authentication/cloud sync;
- paid APIs or metered AI;
- social/following/recommendation network;
- major hosting migration;
- another top-level feature category;
- wholesale framework rewrite;
- unverified bulk scraping;
- generated critic opinions;
- new Ocean concept beyond the already approved personal marine ecosystem.
