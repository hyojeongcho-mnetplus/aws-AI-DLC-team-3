# Design: Mnet Plus Fan Friction Radar

## Architecture Summary
Build a single Next.js TypeScript app with server-side route handlers, DynamoDB persistence, source adapters, deterministic classification, optional Bedrock enhancement, and a severity-first command center UI.

```txt
App Store RSS, primary live
        │
Google Play secondary live/replay
        │
Seed import / replay dataset
        ▼
ReviewSourceAdapter
        ▼
Ingestion Service
  normalize, dedupe, source health
        ▼
DynamoDB single table
  REVIEW, SOURCE_STATUS, CLUSTER, ACTION_BRIEF
        ▼
Deterministic Classifier
  category, severity, owner, wave type
        ▼
Bedrock Enhancer, optional
  title, whyNow, risk, action brief
        ▼
Command Center UI
```

## Recommended Stack
- Framework: Next.js with TypeScript.
- Styling: CSS variables plus CSS modules or Tailwind if the scaffold already includes it. Do not add a styling dependency only for this MVP.
- AI: Amazon Bedrock server-side enhancement only.
- Database: DynamoDB single table with on-demand capacity.
- AWS SDK: AWS SDK v3 with `DynamoDBDocumentClient`.
- Tests: Vitest for domain/repository tests, Playwright for the primary dashboard flow if time allows.

## Directory Shape
Kiro may adjust exact filenames to match the scaffold, but preserve these boundaries.

```txt
src/
  app/
    page.tsx
    dashboard/page.tsx
    api/ingest/app-store/route.ts
    api/ingest/google-play/route.ts
    api/clusters/route.ts
    api/action-briefs/route.ts
  components/
    AppShell.tsx
    TopRiskHeader.tsx
    SourceHealthRail.tsx
    SourceModeBadge.tsx
    AiModeBadge.tsx
    RisingIssueList.tsx
    IssueSeverityRow.tsx
    LiveFeedStrip.tsx
    IssueDetailPanel.tsx
    EvidenceQuoteRow.tsx
    ActionBriefPanel.tsx
    EmptyState.tsx
    StateBanner.tsx
  lib/
    domain/friction/types.ts
    domain/friction/classify.ts
    domain/friction/cluster.ts
    domain/friction/wave.ts
    domain/friction/redact.ts
    domain/friction/actionBrief.ts
    adapters/reviews/types.ts
    adapters/reviews/appStoreRssAdapter.ts
    adapters/reviews/googlePlayAdapter.ts
    adapters/reviews/seedReplayAdapter.ts
    repositories/reviewRepository.ts
    repositories/dynamoReviewRepository.ts
    ai/bedrockEnhancer.ts
    ai/clusterSchema.ts
    aws/dynamoClient.ts
  scripts/
    create-dynamodb-table.ts
    import-review-seed.ts
  fixtures/
    reviews/app-store-sample.json
    reviews/google-play-sample.json
    evals/fan-friction-clusters.json
```

## Domain Types

```ts
export type SourceMode = 'live' | 'replay' | 'blocked' | 'stale';
export type ConnectorStatus = 'healthy' | 'degraded' | 'blocked' | 'replaying' | 'stale';
export type ReviewSource = 'app_store' | 'google_play';

export type ReviewEvent = {
  id: string;
  source: ReviewSource;
  sourceMode: SourceMode;
  rating?: number;
  locale?: string;
  country?: string;
  title?: string;
  text: string;
  observedAt: string;
  contentHash: string;
};

export type SourceHealth = {
  source: ReviewSource | 'bedrock' | 'dynamodb';
  status: ConnectorStatus | 'synced' | 'enhanced' | 'deterministic';
  mode?: SourceMode;
  lastSuccessAt?: string;
  lastAttemptAt: string;
  message?: string;
};

export type FrictionCategory =
  | 'vote_failure'
  | 'ads_blocking_vote'
  | 'crash_freeze_white_screen'
  | 'login_account'
  | 'trust_fairness'
  | 'navigation_rule_confusion'
  | 'points_rewards'
  | 'other';

export type FrictionCluster = {
  id: string;
  title: string;
  category: FrictionCategory;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  waveType: 'product_defect' | 'campaign_wave' | 'mixed' | 'unknown';
  trend: 'spiking' | 'rising' | 'stable' | 'falling';
  confidence: number;
  sourceModes: SourceMode[];
  evidenceCount: number;
  evidenceQuotes: Array<{
    source: ReviewSource;
    sourceMode: SourceMode;
    rating?: number;
    country?: string;
    quote: string;
    redacted: boolean;
  }>;
  likelyOwners: Array<'app' | 'ads' | 'vote_backend' | 'content' | 'policy_comms' | 'cx'>;
  suggestedAction: string;
  whyNow?: string;
  riskIfIgnored?: string;
  aiMode: 'deterministic' | 'ai_enhanced';
};
```

## DynamoDB Design

Use one table for the demo.

Table name:
- Env var: `FAN_FRICTION_TABLE_NAME`
- Default: `FanFrictionRadar`

Capacity:
- On-demand.

TTL:
- Attribute: `expiresAt`.

Primary key:
```txt
PK: string
SK: string
```

Item shapes:

```txt
Review event
PK = REVIEW#<source>#<yyyy-mm-dd>
SK = <timestamp>#<sourceReviewIdOrHash>

Source status
PK = SOURCE#<source>
SK = STATUS#LATEST

Cluster snapshot
PK = CLUSTER#<category>
SK = <severity>#<updatedAt>#<clusterId>

Action brief
PK = ACTION#<clusterId>
SK = VERSION#<timestamp>
```

Optional one GSI:

```txt
GSI1PK = STATUS#<connectorStatus>
GSI1SK = <updatedAt>
```

Access patterns:

| Use case | Query |
|---|---|
| Recent App Store events | `PK=REVIEW#app_store#YYYY-MM-DD`, descending SK |
| Recent Google Play events | `PK=REVIEW#google_play#YYYY-MM-DD`, descending SK |
| Latest source health | `PK=SOURCE#app_store`, `SK=STATUS#LATEST` |
| Ads blocking vote cluster | `PK=CLUSTER#ads_blocking_vote` |
| Cluster action briefs | `PK=ACTION#<clusterId>` |
| Degraded sources | `GSI1PK=STATUS#degraded` or `STATUS#blocked` |

Repository interface:

```ts
export interface ReviewRepository {
  saveRawEvents(events: ReviewEvent[]): Promise<void>;
  listRecentEvents(input: { source?: ReviewSource; limit: number }): Promise<ReviewEvent[]>;
  saveSourceHealth(status: SourceHealth): Promise<void>;
  listSourceHealth(): Promise<SourceHealth[]>;
  saveClusters(clusters: FrictionCluster[]): Promise<void>;
  listClusters(): Promise<FrictionCluster[]>;
  saveActionBrief(clusterId: string, brief: ActionBrief): Promise<void>;
}
```

## Source Adapter Design

```ts
export type FetchReviewsInput = {
  country?: string;
  limit?: number;
  since?: string;
};

export type FetchReviewsResult = {
  events: ReviewEvent[];
  status: ConnectorStatus;
  mode: SourceMode;
  fetchedAt: string;
  staleAfterMs: number;
  error?: { code: string; message: string; retryable: boolean };
};

export interface ReviewSourceAdapter {
  source: ReviewSource;
  fetchReviews(input: FetchReviewsInput): Promise<FetchReviewsResult>;
}
```

Adapters:
- `AppStoreRssAdapter`: primary live path, falls back to replay if unavailable.
- `GooglePlayAdapter`: secondary path, can use seed/replay by default.
- `SeedReplayAdapter`: deterministic event-day fallback.

## AI and Classification Design

Flow:

```txt
Review events
  ▼
Deterministic classifier
  ├─ category
  ├─ severity
  ├─ owners
  ├─ wave type
  └─ confidence
  ▼
Cluster snapshot
  ▼
Optional Bedrock enhancer
  ├─ better title
  ├─ whyNow
  ├─ riskIfIgnored
  └─ action brief
  ▼
Schema validation
  ├─ valid -> save enhanced cluster
  └─ invalid/timeout -> keep deterministic cluster
```

Rules:
- Dashboard must work without Bedrock credentials.
- Bedrock never runs in the browser.
- Model output is schema-validated.
- Prompt injection inside reviews is treated as review text only.
- Action drafts are human-review drafts, never auto-sent.

## UI Design

### Visual Direction
Operations room, not SaaS landing page.

- Calm neutral surfaces.
- Dense but readable layout.
- Severity colors are functional, not decorative.
- Badges use text and color.
- Cards exist only for interaction or evidence.
- No purple AI gradients, decorative icons, centered marketing sections, or generic card mosaics.

### Design Tokens

```css
:root {
  --bg: #0b0f14;
  --surface: #111820;
  --surface-raised: #17212b;
  --border: #263241;
  --text-primary: #eef4f8;
  --text-secondary: #9fb0bf;
  --severity-p1: #ff5a5f;
  --severity-p2: #ffb020;
  --severity-p3: #5c9ded;
  --live: #2ecc71;
  --replay: #8aa4bf;
  --blocked: #ff5a5f;
  --stale: #ffb020;
  --ai: #2dd4bf;
  --review: #f59e0b;
}
```

Typography:
- UI: IBM Plex Sans or Geist.
- Monospace: IBM Plex Mono for timestamps/source IDs.
- Body minimum: 16px.

### Desktop Wireframe

```txt
+--------------------------------------------------------------------------------+
| Fan Friction Radar          Top risk: P1 Ads blocking vote     Updated 12:04   |
| Mode: App Store LIVE · Google Play REPLAY · AI deterministic+Bedrock enhanced   |
+----------------------+----------------------------------+--------------------+
| SOURCE HEALTH        | RISING ISSUES                    | LIVE / REPLAY FEED |
| App Store   LIVE     | [P1] Ads blocking vote           | 12:04 App Store    |
| Google Play REPLAY   |      +37% · product defect       | 12:03 Google Play  |
| Bedrock     ENHANCED |      owners: ads, vote backend   | 12:03 App Store    |
| DynamoDB    SYNCED   |      badges: live+replay, AI     | ...                |
+----------------------+----------------------------------+--------------------+
| ISSUE DETAIL: Ads blocking vote completion                                      |
| +--------------------------------------+---------------------------------------+ |
| | EVIDENCE                             | ACTION BRIEF                          | |
| | App Store LIVE · redacted            | Owner: ads + vote_backend + app       | |
| | “Watched ad but vote did not...”     | Suggested check: ad_completed vs...   | |
| | Google Play REPLAY · source sample   | Slack draft: Investigating reports... | |
| | “After ads my vote never...”         | [Copy brief] [Mark needs review]      | |
| +--------------------------------------+---------------------------------------+ |
+--------------------------------------------------------------------------------+
```

### Responsive Behavior

Desktop, 1280px+:
- 3-column top workspace: source rail 240px, issue workspace flexible, feed 280px.
- Detail panel spans full width.
- Evidence/action split 50/50.

Tablet, 768-1279px:
- Source health collapses to top horizontal strip.
- Rising issues full width.
- Feed becomes secondary collapsible panel.
- Detail split if space allows, otherwise stacked.

Mobile, 375-767px:
- Single column.
- Top risk header first.
- Source health summary second.
- Rising issues third.
- Issue detail uses tabs: Evidence, Action, Feed.
- Sticky bottom action: Copy brief only when an issue is selected.

### Interaction States

| Feature | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Source health | Pulsing source rows with checking | No sources configured + seed import CTA | blocked/degraded badge with reason | Live/replay/stale badges visible | Mixed, e.g. App Store live, Google Play replay |
| Rising issues | Skeleton rows, no fake numbers | No rising issues yet. Waiting for review signal. | Could not compute clusters. Showing raw feed. | P1/P2 sorted by severity/trend | Low-confidence clusters separated below main list |
| Live feed | Stream placeholder | No events in this window | Feed paused, replay available | Time-stamped event rows | Replay rows visually marked |
| Issue detail | Detail skeleton after click | Select an issue to inspect evidence and action | Issue snapshot unavailable | Evidence/action split visible | Evidence available but AI brief pending |
| Action brief | Generating draft, evidence remains visible | Not enough evidence for a draft | Draft unavailable, copy evidence summary | Copyable Slack/Jira draft | Human-review label shown |
| Bedrock enhancement | Badge: enhancing | Deterministic-only | Badge: enhancement failed | AI-enhanced badge | Some fields enhanced, others deterministic |

### Accessibility
- Keyboard navigation through source cards, issue rows, evidence rows, and copy button.
- Visible focus ring, 2px minimum.
- ARIA landmarks: header, navigation/filter, main, complementary feed, issue detail region.
- Badge labels are text, not color-only.
- Touch targets 44px minimum on mobile.
- Copy action announces success using `aria-live="polite"`.

## Event-Day Demo Script

1. Open command center.
2. Point out source modes: App Store LIVE, Google Play REPLAY, Bedrock AI-ENHANCED.
3. Show rising P1: Ads blocking vote completion.
4. Click issue.
5. Show evidence left: live/replay source badges and redacted quotes.
6. Show action right: likely owners, checks, Slack/Jira draft.
7. Copy action brief.
8. Explain AWS path: App Store/Google Play -> DynamoDB -> classifier -> Bedrock -> dashboard.

## Failure and Fallback Behavior
- App Store fetch fails: show source degraded and use replay data.
- Google Play live unavailable: show replay mode and keep Android evidence visible.
- Bedrock fails: show deterministic mode and keep clusters visible.
- DynamoDB setup fails: this is a setup blocker for this DynamoDB-first spec. Keep seed JSON for recovery, but do not pretend DynamoDB is synced.
