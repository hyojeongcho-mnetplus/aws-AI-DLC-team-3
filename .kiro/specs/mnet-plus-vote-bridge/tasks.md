# Tasks: Mnet Plus Vote Bridge

## Execution Notes for Kiro
Kiro can run independent tasks in dependency waves. Keep the data contract stable first, then parallelize UI, AI, storage, and tests.

Task status legend:
- [ ] Not started
- [~] In progress
- [x] Done

## 4-Person Ownership Model

This task plan assumes four people. Finish Wave 1 together, then split Wave 2+ by ownership:

1. Product/UI owner: tasks 5, 8, 10, 12, 16, 18.
2. AI/Guardrails owner: tasks 6, 15, 19.
3. Data/AWS owner: tasks 7, 11, 20.
4. Demo/QA owner: tasks 3, 13, 14, 17, plus final runbook.

Owners can help across lanes, but each lane must keep its interfaces stable and avoid blocking the others.

## Wave 1: Foundation

- [ ] 1. Scaffold the Next.js TypeScript app
  - Create the app routes `/operator`, `/b/[campaignId]`, and `/dashboard/[campaignId]`.
  - Add app-level styling with the Editorial Proof Lab CSS variables.
  - Acceptance: the three routes render placeholder pages with shared header styling.

- [ ] 2. Define campaign domain schema
  - Implement `CampaignInput`, `CampaignBridgeResult`, `Campaign`, and `CampaignStore` types.
  - Add runtime validation for required fields and generated output.
  - Acceptance: invalid missing title, source notice, period, and deep link are rejected.

- [ ] 3. Add sample campaign fixture and sample AI output
  - Create a fictional MAMA-style global vote notice.
  - Create a safe `CampaignBridgeResult` sample for fallback/demo mode.
  - Acceptance: sample fixture can populate the operator form and generated preview.

- [ ] 4. Implement deep-link helpers
  - Convert a voteId into the expected Mnet Plus vote deep link when possible.
  - Validate that the final CTA target is present and safe to render.
  - Acceptance: invalid or empty links disable publish/open actions.

## Wave 2: Independent Core Slices

- [ ] 5. Build `/operator` Editorial Proof Lab shell
  - Build top proof anchor: original notice, bridge arrow, AI fan bridge preview.
  - Build visible-label campaign form and `Load demo notice` action.
  - Acceptance: the operator can enter or load all required input fields.
  - Depends on: 1, 2, 3.

- [ ] 6. Build server generation endpoint
  - Implement `POST /api/campaigns/generate`.
  - Validate input server-side.
  - Call Bedrock Converse in AWS mode.
  - Use timeout, one retry or one repair attempt for malformed output.
  - Fall back to sample output in demo mode.
  - Acceptance: endpoint returns valid `CampaignBridgeResult` for the sample notice without browser-side credentials.
  - Depends on: 2, 3.

- [ ] 7. Build storage adapter
  - Implement `CampaignStore` with local JSON or in-memory fallback.
  - Add DynamoDB implementation behind the same interface if AWS credentials are ready.
  - Implement create, get, and recordEvent.
  - Acceptance: campaign creation/fetch works in local fallback mode.
  - Depends on: 2.

- [ ] 8. Build fact guardrail panel
  - Show `sourceFacts`, `generatedCopy`, and `needsReview` as separate areas.
  - Use green for verified facts, amber for warnings, red for blockers.
  - Disable publish/open bridge when blocker warnings exist, unless explicitly acknowledged in labeled demo mode.
  - Acceptance: sample output renders all three sections and warning colors are not color-only.
  - Depends on: 2, 5.

## Wave 3: Wire Flow Together

- [ ] 9. Connect operator generation and campaign creation
  - Wire the form to `/api/campaigns/generate`.
  - Show loading, success, error, partial, and fallback states.
  - Store the generated campaign.
  - Show links to fan bridge and dashboard after successful creation.
  - Acceptance: operator can complete input -> generate -> open bridge locally.
  - Depends on: 5, 6, 7, 8.

- [ ] 10. Build fan bridge page `/b/[campaignId]`
  - Render campaign title, 10-second summary, why-it-matters, how-to-vote, key facts, and official-info boundary.
  - Implement mobile sticky CTA with `Vote now in Mnet Plus` and `Copy app link` fallback.
  - Record page_view without blocking render.
  - Acceptance: sample campaign fan page works on mobile width and CTA is always reachable.
  - Depends on: 7.

- [ ] 11. Build event tracking endpoint
  - Implement `POST /api/events` for `page_view` and `cta_click`.
  - Ensure tracking failure does not block CTA navigation.
  - Acceptance: cta_click increments in the dashboard after pressing Vote now or copy fallback.
  - Depends on: 7, 10.

- [ ] 12. Build dashboard page `/dashboard/[campaignId]`
  - Render Before/After Proof Panel.
  - Render page views, CTA clicks, CTA click rate, reading-time delta.
  - Label every metric as `demo proxy`.
  - Render trust review snapshot.
  - Acceptance: dashboard updates after opening bridge and clicking CTA.
  - Depends on: 7, 11.

## Wave 4: Quality and Demo Hardening

- [ ] 13. Add unit tests for pure logic
  - Test input validation.
  - Test deep-link validation.
  - Test reading-time calculation.
  - Test generated output validation.
  - Acceptance: tests cover happy path, missing required fields, malformed generated output, and invalid link.
  - Depends on: 2, 4.

- [ ] 14. Add integration tests for demo flow
  - Test sample input -> generated output -> store -> bridge render -> dashboard metrics.
  - Use local fallback mode so tests do not require AWS credentials.
  - Acceptance: one command proves the full local demo path works.
  - Depends on: 9, 10, 11, 12.

- [ ] 15. Add AI eval/manual check
  - Verify sample notice output does not invent dates, rewards, rankings, vote rules, or official claims.
  - Verify generated output includes summary, why-it-matters, how-to-vote, CTA, and needsReview.
  - Acceptance: eval checklist passes against sample output and any live Bedrock output used in demo.
  - Depends on: 6, 8.

- [ ] 16. Add accessibility and responsive checks
  - Check visible labels, keyboard focus, touch target size, contrast, and mobile sticky CTA behavior.
  - Acceptance: `/operator`, `/b/[campaignId]`, and `/dashboard/[campaignId]` are usable at desktop and 375px mobile widths.
  - Depends on: 9, 10, 12.

- [ ] 17. Add event-day runbook
  - Document AWS mode and fallback mode.
  - Include commands to run locally, seed sample data, and demo the route flow.
  - Include exact presentation script: operator generate -> bridge open -> CTA click -> dashboard proof.
  - Acceptance: a teammate can run the demo from the runbook without extra explanation.
  - Depends on: 14.

## Wave 5: Stretch Only After Must-Have Works

- [ ] 18. Add CTA variants
  - Generate urgency, fandom pride, and reward/benefit variants.
  - Keep variant comparison basic.
  - Acceptance: operator can see 2-3 CTA variants without breaking primary flow.
  - Depends on: 9, 12.

- [ ] 19. Add Share Pack
  - Generate X/Twitter, Instagram Story, and community post copy.
  - Validate rough length constraints.
  - Acceptance: share copy points back to the same bridge/app deep link and does not invent campaign facts.
  - Depends on: 8, 15.

- [ ] 20. Add Amplify deployment polish
  - Deploy only if AWS/Amplify setup is ready and the local demo is already stable.
  - Acceptance: deployed URL completes the same demo flow, or deployment is explicitly skipped without hurting local demo.
  - Depends on: 14, 17.

## Definition of Done
- Operator can generate one bridge from a sample vote notice.
- Fan bridge shows summary, why-it-matters, how-to-vote, and sticky CTA.
- CTA opens or copies a valid Mnet Plus app deep link.
- Dashboard shows page views and CTA clicks as demo proxy metrics.
- sourceFacts, generatedCopy, and needsReview are visible.
- No generated copy is rendered as raw HTML.
- Local fallback demo works without AWS credentials.
- Tests or scripted checks cover the full demo path.
