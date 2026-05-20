# Tasks: Mnet Plus Fan Friction Radar

## Execution Notes for Kiro
This spec is for a 4-person hackathon team. Keep shared types stable first, then split work by lane.

Task status legend:
- [ ] Not started
- [~] In progress
- [x] Done

## Team Lanes

### Lane A: AWS/Data owner
Owns DynamoDB table, seed import, repository.

### Lane B: Connectors owner
Owns App Store primary live, Google Play secondary replay/live, source health.

### Lane C: AI/Domain owner
Owns classifier, wave classifier, redaction, Bedrock enhancer, action brief.

### Lane D: UI/Demo owner
Owns command center UI, issue detail, responsive behavior, demo script.

## Wave 1: Shared Foundation

- [ ] 1. Scaffold Next.js TypeScript app
  - Create base routes `/` or `/dashboard` and API route folders.
  - Add global CSS variables from `design.md`.
  - Acceptance: app renders a placeholder command center shell.

- [ ] 2. Define shared domain types
  - Implement `ReviewEvent`, `SourceHealth`, `FrictionCluster`, `SourceMode`, `ConnectorStatus`, `ReviewSourceAdapter`, and `ReviewRepository` types.
  - Acceptance: all lanes import shared types from one module.

- [ ] 3. Add review seed fixtures
  - Copy or transform `.omx/research/mnet-plus-ios-reviews-sample.json` into `fixtures/reviews/app-store-sample.json`.
  - Copy or transform `.omx/research/mnet-plus-google-play-reviews-sample.json` into `fixtures/reviews/google-play-sample.json`.
  - Keep only fields needed for demo if files are too large.
  - Acceptance: fixtures load in Node scripts without parse errors.

## Wave 2: AWS/Data Lane

- [ ] 4. Create DynamoDB setup script
  - Add `scripts/create-dynamodb-table.ts`.
  - Create table with `PK`, `SK`, on-demand billing, and TTL attribute `expiresAt`.
  - Add optional `GSI1PK/GSI1SK` for status queries if time allows.
  - Add `npm run db:setup`.
  - Acceptance: command creates or reuses the table safely.
  - Depends on: 2.

- [ ] 5. Implement DynamoDB client
  - Add `lib/aws/dynamoClient.ts`.
  - Read table name and region from env vars.
  - Use AWS SDK v3 and `DynamoDBDocumentClient`.
  - Acceptance: repository tests can inject or construct a document client.
  - Depends on: 4.

- [ ] 6. Implement `DynamoReviewRepository`
  - Implement save/list raw events, source health, clusters, and action briefs.
  - Use key shapes from `design.md`.
  - Avoid table scans in dashboard paths.
  - Acceptance: repository can write and query seeded review events.
  - Depends on: 2, 5.

- [ ] 7. Implement seed importer
  - Add `scripts/import-review-seed.ts`.
  - Import App Store and Google Play fixtures into DynamoDB.
  - Use `contentHash` or deterministic id for idempotency.
  - Add `npm run seed:reviews`.
  - Acceptance: running importer twice does not duplicate visible events.
  - Depends on: 3, 6.

## Wave 3: Connectors Lane

- [ ] 8. Implement App Store RSS adapter
  - Fetch public review feed for configured countries where possible.
  - Normalize entries into `ReviewEvent`.
  - Set `source='app_store'` and `sourceMode='live'` on success.
  - On failure, return degraded/blocked/stale status and allow replay fallback.
  - Acceptance: adapter can produce normalized App Store events or visible source status.
  - Depends on: 2.

- [ ] 9. Implement Google Play secondary adapter
  - Load Google Play seed/replay data by default.
  - If a trivial live path exists, it may be added, but it must not block the demo.
  - Set `source='google_play'` and source mode accurately.
  - Acceptance: Android review evidence appears in repository with `replay` mode at minimum.
  - Depends on: 2, 3.

- [ ] 10. Implement ingestion route/job
  - Add API route or server function to run adapters and save events/source health to repository.
  - Deduplicate by content hash.
  - Acceptance: command center can trigger or load ingested events from DynamoDB.
  - Depends on: 6, 8, 9.

## Wave 4: AI/Domain Lane

- [ ] 11. Implement deterministic classifier
  - Map review text to category, severity, owners, wave type, and confidence.
  - Cover vote/ad/crash/login/trust/navigation/points categories.
  - Acceptance: ads blocking vote completion maps to `ads_blocking_vote`, `P1`, product defect.
  - Depends on: 2.

- [ ] 12. Implement wave classifier
  - Separate product defects from campaign/trust waves.
  - Mark ambiguous cases as `mixed` or `unknown` with lower confidence.
  - Acceptance: artist-exclusion/trust wave fixtures do not route as app defect.
  - Depends on: 11.

- [ ] 13. Implement redaction and evidence selection
  - Clip long quotes.
  - Remove or mask handles, emails, phone-like strings, and unnecessary personal text.
  - Preserve source and redaction labels.
  - Acceptance: evidence rows never display long raw review bodies.
  - Depends on: 2.

- [ ] 14. Implement clustering and cluster snapshots
  - Group classified events into `FrictionCluster` snapshots.
  - Sort by severity and trend.
  - Save cluster snapshots to repository.
  - Acceptance: primary demo cluster appears from seed data.
  - Depends on: 6, 11, 12, 13.

- [ ] 15. Implement Bedrock enhancer
  - Server-side only.
  - Enhance top clusters with title, whyNow, riskIfIgnored, and action brief.
  - Validate output schema.
  - Fall back to deterministic output on timeout, invalid JSON, refusal, or missing credentials.
  - Acceptance: dashboard works with and without Bedrock credentials.
  - Depends on: 14.

## Wave 5: UI/Demo Lane

- [ ] 16. Build severity-first command shell
  - Implement `TopRiskHeader`, `SourceHealthRail`, `RisingIssueList`, and `LiveFeedStrip`.
  - Use desktop wireframe from `design.md`.
  - Acceptance: first screen shows top risk, source modes, top issues, and feed.
  - Depends on: 1, 2.

- [ ] 17. Build source and AI mode badges
  - Implement `SourceModeBadge` and `AiModeBadge`.
  - Badges must include text and color.
  - Use badge rules from design review.
  - Acceptance: issue cards and evidence rows always display mode badges.
  - Depends on: 16.

- [ ] 18. Build rising issue cards/rows
  - Show severity, title, trend, wave type, owners, confidence, and source modes.
  - Sort P1/P2 first.
  - Acceptance: `Ads blocking vote completion` is visually dominant in demo data.
  - Depends on: 14, 16, 17.

- [ ] 19. Build split issue detail panel
  - Desktop: evidence left, action brief right.
  - Mobile: tabs for Evidence, Action, Feed.
  - Acceptance: selected issue shows evidence rows and action draft in one decision view.
  - Depends on: 17, 18.

- [ ] 20. Build action brief copy flow
  - Show likely owners, suggested checks, Slack/Jira draft, confidence, human-review label.
  - Copy plain text to clipboard.
  - Announce copy success accessibly.
  - Acceptance: user can copy the primary demo action brief.
  - Depends on: 19.

- [ ] 21. Build state views
  - Add loading, empty, error, success, partial states for source health, rising issues, feed, issue detail, action brief, and Bedrock enhancement.
  - Acceptance: no blank panels or generic “No items found” states.
  - Depends on: 16, 19.

- [ ] 22. Add responsive layout
  - Desktop: 3-column workspace and split detail.
  - Tablet: source strip, full-width issues, collapsible feed.
  - Mobile: single column and detail tabs.
  - Acceptance: 375px width remains usable and primary action is reachable.
  - Depends on: 16, 19, 20.

## Wave 6: Wire Together

- [ ] 23. Connect dashboard to repository-backed API
  - API returns source health, recent events, clusters, and selected action brief.
  - UI consumes API data, not static imports.
  - Acceptance: seeded DynamoDB data appears in UI.
  - Depends on: 6, 7, 16.

- [ ] 24. Connect ingestion/classification pipeline
  - Run ingestion, classification, clustering, repository save.
  - Trigger manually via API/button/script for demo.
  - Acceptance: seed/imported events generate visible clusters.
  - Depends on: 10, 14.

- [ ] 25. Connect Bedrock enhancement to top clusters
  - Enhance top cluster after deterministic result exists.
  - UI updates badge/fields when enhancement succeeds or fails.
  - Acceptance: deterministic result appears first, enhanced fields appear later if available.
  - Depends on: 15, 23, 24.

## Wave 7: Tests and QA

- [ ] 26. Add domain unit tests
  - Test classifier, wave classifier, redaction, evidence selection, and action brief fallback.
  - Acceptance: happy path, unknown, campaign wave, prompt injection, and redaction cases pass.
  - Depends on: 11, 12, 13.

- [ ] 27. Add repository tests
  - Test DynamoDB repository key shapes, source status overwrite, seed idempotency, cluster save/list.
  - Use mocked client or local test mode if available.
  - Acceptance: repository behavior is verified without manual AWS console inspection.
  - Depends on: 6, 7.

- [ ] 28. Add adapter tests
  - Test App Store RSS parse success/failure with fixture payloads.
  - Test Google Play replay load and source mode.
  - Acceptance: adapter failures produce visible status, not thrown unhandled errors.
  - Depends on: 8, 9.

- [ ] 29. Add dashboard E2E or scripted QA
  - Test source health visible.
  - Test P1 issue visible.
  - Test issue detail opens.
  - Test action brief copy button.
  - Test mobile layout at 375px.
  - Acceptance: one script/checklist proves the primary demo path.
  - Depends on: 23, 24, 25.

- [ ] 30. Add AI eval/manual checklist
  - Fixture cases: ads blocking vote, white screen, login, artist exclusion wave, vote rigging/trust complaint, points/rewards, navigation confusion, prompt injection.
  - Verify category, wave type, owner, and action brief quality.
  - Acceptance: Bedrock-enhanced output does not invent unsupported facts.
  - Depends on: 15.

## Wave 8: Demo Hardening

- [ ] 31. Add event-day runbook
  - Include AWS env vars, `db:setup`, `seed:reviews`, local dev command, ingestion command, demo script.
  - Include fallback instructions for Bedrock failure and Google Play live failure.
  - Acceptance: a teammate can run the demo without extra explanation.
  - Depends on: 23, 24, 25.

- [ ] 32. Add presentation data reset script
  - Reset or reseed DynamoDB demo data for a clean run.
  - Acceptance: presenter can restore the golden demo state before judging.
  - Depends on: 7, 24.

- [ ] 33. Final design QA checklist
  - Check no generic dashboard slop.
  - Check badges are visible and text-labeled.
  - Check contrast, focus rings, touch targets.
  - Acceptance: design review checklist passes before final presentation.
  - Depends on: 16-22.

## Definition of Done
- App Store primary live connector works or visibly falls back.
- Google Play secondary replay/live evidence appears.
- DynamoDB stores review events, source health, clusters, and action briefs.
- Deterministic classifier works without Bedrock.
- Bedrock enhancement works when credentials are available and does not block when unavailable.
- Dashboard uses severity-first command layout.
- Source and AI mode badges are always visible where trust matters.
- Issue detail uses evidence/action split on desktop and tabs on mobile.
- Primary demo incident appears as P1 ads blocking vote completion.
- Action brief can be copied.
- Event-day runbook exists.
