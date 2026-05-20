# Requirements: Mnet Plus Fan Friction Radar

## Metadata
- Feature: Mnet Plus Fan Friction Radar
- Context: AWS AI-DLC hackathon, 4-person team, Kiro Pro+ may be available up to 72h on event day
- Product direction: Live fan-friction command center, B powered by A
- CEO score: 8.7/10
- Eng score: 8.4/10, DynamoDB-first direction
- Design score: 8.5/10
- Technical default: Next.js single app, DynamoDB single table, App Store primary live connector, Google Play secondary live/replay connector, deterministic-first classifier, Bedrock enhancement
- Design direction: Severity-first operations command center
- Status: Ready for Kiro implementation planning

## Problem
Mnet Plus user pain arrives as scattered public feedback across App Store, Google Play, review aggregators, Reddit, fandom communities, and public web mirrors. Operators cannot quickly tell what is breaking, what is a one-off complaint, what is rising now, whether the issue is a product defect or fandom/trust wave, which team should act, and what evidence supports that action.

Fan Friction Radar turns public review signals into an operator-facing command center. It detects rising friction, shows source trust, classifies issue type, assigns likely owners, and generates action briefs.

## Product Thesis
This is **B powered by A**.

- **A, Evidence-to-Action Board:** AI intelligence layer that ingests reviews, clusters pain, scores severity, selects/redacts evidence, assigns likely owners, and suggests action.
- **B, Live Friction Command Center:** Operator-facing product wrapper that shows live/replay source state, rising issues, evidence, and action drafts.

## Goals
1. Show a live-feeling command center for Mnet Plus public user pain.
2. Ingest App Store review feed as the primary live source.
3. Include Google Play as a secondary live/replay source so Android pain is visible without making the demo fragile.
4. Persist events, source status, clusters, and action briefs in DynamoDB.
5. Detect and display rising issue clusters, especially `ads_blocking_vote`.
6. Separate product defects from campaign/trust waves.
7. Show source mode and AI mode everywhere trust matters.
8. Generate owner-specific action briefs for app, ads, vote backend, CX, and policy/comms.
9. Keep the demo working with seed/replay data if live connectors or Bedrock fail.

## Non-Goals
- No production Mnet Plus app changes.
- No auto-fixing app defects.
- No fan-facing official statements without human review.
- No real Slack/Jira posting in MVP. Draft/copy only.
- No real X/Twitter connector in MVP.
- No full Reddit connector in MVP.
- No multi-table DynamoDB architecture in MVP.
- No OpenSearch or full-text historical search in MVP.
- No claim of exhaustive social/X coverage.
- No raw username/handle/email/phone exposure.

## Personas

### Campaign/Product Operator
Needs to know what issue is rising, whether data is trustworthy, and which team should act.

### CX / Community Manager
Needs evidence quotes, source labels, and a safe response/action draft.

### App / Ads / Vote Backend Engineer
Needs a concise action brief with likely failure area and checks to run.

### Hackathon Judge
Needs to see AI, AWS, live data, user pain, and a clear operational workflow.

## Primary Demo Incident
Anchor the demo on:

> Ads blocking vote completion.

Why:
- It appears across App Store and Google Play review samples.
- It combines voting, ads, and trust.
- It has clear owners: ads, vote backend, app, CX.
- It avoids making policy-heavy fairness disputes the main demo.

## Data Sources

### App Store, primary live
- Source mode: `live` when feed succeeds.
- Source status may become `degraded`, `blocked`, or `stale`.
- If live fetch fails, use seed/replay data but label it clearly.

### Google Play, secondary live/replay
- Source mode: `replay` by default unless live path is trivial and reliable.
- Must contribute Android evidence to clusters.
- Must never block the dashboard.

### Seed Data
- iOS sample: `.omx/research/mnet-plus-ios-reviews-sample.json`, 535 entries.
- Google Play sample: `.omx/research/mnet-plus-google-play-reviews-sample.json`, 1,479 entries.
- Seed importer loads data into DynamoDB.

## User Stories and Acceptance Criteria

### Story 1: Operator opens the command center
As an operator, I want the dashboard to immediately show the top risk and source state so that I know where to focus.

Acceptance criteria:
- `/` or `/dashboard` renders the Fan Friction Radar command center.
- The top header shows product name, top risk, last updated time, and mode summary.
- The source health rail shows App Store, Google Play, Bedrock, and DynamoDB status.
- Rising P1/P2 issues occupy the main center area.
- Live/replay feed is visible but secondary to issue severity.
- The first screen clearly distinguishes `live`, `replay`, `blocked`, and `stale` source modes.

### Story 2: App Store live review ingestion works
As an operator, I want App Store reviews to enter the system as the primary live source so that the demo proves real ingestion.

Acceptance criteria:
- An App Store adapter fetches recent public review feed data for configured countries where possible.
- The adapter normalizes source, rating, locale, country, title, text, observed time, and content hash.
- The adapter writes raw review events to DynamoDB through the repository layer.
- The adapter writes source status to `SOURCE#app_store / STATUS#LATEST`.
- On fetch failure, the adapter updates status and uses replay seed without hiding the mode.

### Story 3: Google Play evidence appears safely
As an operator, I want Google Play reviews visible as Android evidence without risking the whole demo.

Acceptance criteria:
- A Google Play adapter loads replay/seed data at minimum.
- If live scraping/API is attempted, failure falls back to replay mode.
- Google Play review events are written with `source='google_play'` and `sourceMode='replay'` or `live`.
- Google Play can contribute to the same clusters as App Store evidence.
- UI always labels Google Play source mode.

### Story 4: DynamoDB stores command center state
As the team, we want DynamoDB to store review events, source status, clusters, and action briefs so that the AWS architecture is real.

Acceptance criteria:
- `npm run db:setup` creates a DynamoDB table named by env var, default `FanFrictionRadar`.
- Table uses `PK` and `SK` primary key.
- Table uses on-demand capacity.
- TTL is enabled with `expiresAt` for temporary demo/replay items.
- One GSI supports querying status by connector state if implemented.
- `npm run seed:reviews` imports App Store and Google Play sample data idempotently.
- Repository methods can write/list recent events, source status, clusters, and action briefs.

### Story 5: Deterministic classification always works
As an operator, I want issue classification to work even without Bedrock so that the dashboard never depends on model availability.

Acceptance criteria:
- Deterministic classifier assigns category, severity, likely owners, wave type, and confidence.
- Categories include: `vote_failure`, `ads_blocking_vote`, `crash_freeze_white_screen`, `login_account`, `trust_fairness`, `navigation_rule_confusion`, `points_rewards`, `other`.
- The primary demo incident is classified as `ads_blocking_vote`, severity `P1`, wave type `product_defect`.
- Artist exclusion or fairness-review wave examples are classified as `campaign_wave` or `mixed`, not generic product defect.
- Unknown issues fall back to `other` with low confidence.

### Story 6: Bedrock enhances but does not block
As a presenter, I want Bedrock to improve summaries and action briefs while the app remains usable if Bedrock fails.

Acceptance criteria:
- Bedrock enhancer is optional and server-side only.
- It can generate cluster title, `whyNow`, `riskIfIgnored`, and action brief text.
- Invalid JSON, timeout, refusal, or credential failure falls back to deterministic output.
- UI labels enhanced fields as `AI-ENHANCED` and fallback fields as `DETERMINISTIC`.
- Generated text is schema-validated before storage or rendering.

### Story 7: Operator inspects an issue
As an operator, I want to click a rising issue and see evidence and action side by side so that I can trust and act quickly.

Acceptance criteria:
- Issue detail opens for a selected cluster.
- Desktop shows split panel: evidence left, action brief right.
- Mobile shows tabs: Evidence, Action, Feed.
- Evidence rows show source, source mode, rating if available, redaction state, and quote snippet.
- Action panel shows severity, wave type, likely owners, suggested checks, Slack/Jira draft, confidence, and human-review label.
- Copy action brief copies a plain-text draft.

### Story 8: Empty, error, loading, and partial states are designed
As an operator, I want the dashboard to explain missing or partial data so that I understand system state.

Acceptance criteria:
- Source health has loading, empty, error, success, and partial states.
- Rising issues has loading, empty, error, success, and partial states.
- Live feed has loading, empty, error, success, and replay states.
- Issue detail has no-selection, loading, error, success, and partial-AI states.
- No state renders blank cards or generic “No items found” copy.

### Story 9: The design avoids generic dashboard slop
As a judge/operator, I want the interface to feel like an operations room, not a generic AI dashboard.

Acceptance criteria:
- First screen is severity-first, not a generic card grid.
- No purple AI gradients, decorative icon circles, or 3-column SaaS feature layout.
- Cards are used only for interactive issue rows, source health, evidence, or action drafts.
- Badges use text plus color, never color alone.
- Typography and spacing follow the design tokens in `design.md`.

### Story 10: The app is accessible and responsive
As an operator on laptop/tablet/mobile, I want the command center to remain usable and readable.

Acceptance criteria:
- Desktop uses 3-column top workspace and split detail panel.
- Tablet collapses source health to a top strip and feed to secondary panel.
- Mobile uses single column, issue detail tabs, and sticky `Copy brief` action when an issue is selected.
- Touch targets are at least 44px on mobile.
- Keyboard navigation reaches source cards, issue rows, evidence rows, and copy button.
- Focus rings are visible.
- Copy success is announced through an accessible live region.
- Body text contrast meets 4.5:1 or better.

## Design Requirements
- Visual direction: operations room, calm, dense, trust-first.
- Layout: Severity-first command layout.
- Issue detail: split evidence/action panel on desktop, tabs on mobile.
- Source and AI mode badges are always visible where trust matters.
- Use explicit labels, not color-only signals.
- Avoid marketing page patterns.
- No raw, long public review text. Quote snippets should be short and redacted as needed.

## Performance Requirements
- Dashboard should render deterministic clusters before Bedrock enhancement completes.
- Do not classify every event with Bedrock individually.
- Batch or window event processing.
- Cap visible live feed rows.
- Avoid scanning DynamoDB table on dashboard refresh.
- Use query patterns documented in `design.md`.

## Security and Trust Requirements
- Treat all review/social text as untrusted input.
- Escape all rendered text.
- Never expose AWS credentials to the browser.
- Do not auto-send Slack/Jira drafts.
- Do not overclaim live coverage.
- Do not claim official Mnet response or policy judgment.
- Store only needed text snippets and source metadata for demo.
