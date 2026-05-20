# Design: Mnet Plus Vote Bridge

## Architecture Summary
Build a single Next.js app with server-side APIs. The app has three user-facing routes and a small server-side domain layer.

```txt
/operator
  ├─ input form
  ├─ Before/After Proof anchor
  └─ AI review output
      │
      ▼
POST /api/campaigns/generate
  ├─ validate CampaignInput
  ├─ call Bedrock Converse with structured output
  ├─ repair/reject malformed schema
  └─ return CampaignBridgeResult
      │
      ▼
POST /api/campaigns
  └─ store campaign through CampaignStore
      │
      ├─ /b/[campaignId]
      │    ├─ render fan bridge
      │    ├─ record page_view non-blocking
      │    └─ open/copy Mnet Plus deep link
      │
      └─ /dashboard/[campaignId]
           ├─ render proof panel
           ├─ render metrics
           └─ render trust review
```

## Recommended Stack
- Framework: Next.js with TypeScript.
- Styling: CSS variables plus app-level CSS modules or Tailwind if the scaffold already includes it. Do not add a dependency only for styling.
- AI: Amazon Bedrock Converse API with structured JSON output if available.
- Runtime deploy: AWS Amplify Hosting if event-day setup is available.
- Storage: DynamoDB in AWS mode, local JSON or in-memory store in fallback mode.
- Tests: Vitest or Jest for unit tests, Playwright for route-level demo checks if time allows.

## Directory Shape
Kiro may adjust exact filenames to match the scaffold, but preserve these boundaries.

```txt
src/
  app/
    operator/page.tsx
    b/[campaignId]/page.tsx
    dashboard/[campaignId]/page.tsx
    api/campaigns/generate/route.ts
    api/campaigns/route.ts
    api/events/route.ts
  components/
    ProofPanel.tsx
    CampaignForm.tsx
    FactGuardrailPanel.tsx
    FanBridgePreview.tsx
    StickyVoteCta.tsx
    DemoMetricTiles.tsx
    StateMessage.tsx
  lib/
    campaign/schema.ts
    campaign/deeplink.ts
    campaign/readingTime.ts
    ai/bedrockGenerate.ts
    ai/sampleOutput.ts
    store/CampaignStore.ts
    store/DynamoCampaignStore.ts
    store/LocalCampaignStore.ts
    metrics/trackEvent.ts
  test/
    campaign-schema.test.ts
    deeplink.test.ts
    reading-time.test.ts
    guardrails.test.ts
```

## Domain Types

```ts
export type CampaignInput = {
  title: string;
  sourceNotice: string;
  period: string;
  participationImpact: string;
  voteId?: string;
  deepLink: string;
  primaryLanguage: 'en';
};

export type CampaignBridgeResult = {
  sourceFacts: {
    title: string;
    period: string;
    action: string;
    impact: string;
    deepLink: string;
  };
  generatedCopy: {
    summary10sec: string;
    whyItMatters: string;
    howToVote: string[];
    primaryCta: string;
    ctaVariants?: string[];
  };
  needsReview: Array<{
    field: string;
    reason: string;
    severity: 'info' | 'warning' | 'blocker';
  }>;
  proofPanel: {
    beforeReadingTimeSec: number;
    afterReadingTimeSec: number;
    ctaClarityBefore: string;
    ctaClarityAfter: string;
    metricLabel: 'demo_proxy';
  };
};
```

Use a runtime validator. If adding a dependency is not approved, implement a small hand-written validator for the MVP.

## Store Interface

```ts
export type Campaign = {
  id: string;
  input: CampaignInput;
  result: CampaignBridgeResult;
  createdAt: string;
  metrics: {
    pageViews: number;
    ctaClicks: number;
  };
};

export interface CampaignStore {
  create(input: CampaignInput, result: CampaignBridgeResult): Promise<Campaign>;
  get(id: string): Promise<Campaign | null>;
  recordEvent(id: string, event: 'page_view' | 'cta_click'): Promise<void>;
}
```

Implement DynamoDB and local fallback behind this interface. The UI should not care which store is active.

## AI Generation Design

The prompt must tell the model:
- Use only facts from the source notice and operator fields.
- Never invent dates, rewards, rankings, vote mechanics, or official rules.
- If a fact is missing, put it in `needsReview`.
- Output JSON matching `CampaignBridgeResult` only.
- English-only for MVP.

Generation flow:
```txt
validate input
  └─ build structured prompt
      └─ Bedrock Converse call with timeout
          ├─ valid schema -> return result
          ├─ malformed schema -> repair once
          ├─ repair fails -> visible error or sample fallback
          └─ credentials fail -> sample fallback in demo mode
```

## UI Design

### Visual Direction
Editorial Proof Lab.

CSS token seed:
```css
:root {
  --bg: #F7F3EC;
  --surface: #FFFDFC;
  --ink: #181716;
  --muted: #6D6258;
  --line: #DDD4C8;
  --accent: #E94B5F;
  --accent-ink: #FFFFFF;
  --trust: #236B5E;
  --warning: #B76E00;
  --danger: #B42318;
}
```

Typography:
- Display: Sora, Manrope, or Space Grotesk.
- Body: IBM Plex Sans, Noto Sans, or Source Sans 3.

### `/operator`
First screen priority:
1. Before/After Proof anchor.
2. Generated Vote now action.
3. Fact guardrail status.

Layout:
```txt
Top bar
Proof Lab hero: Original notice | Bridge arrow | AI fan bridge preview
Work area: Campaign form | Review output
Dashboard strip: page views | CTA clicks | reading-time delta | CTA clarity
```

### `/b/[campaignId]`
Mobile-first fan article.

Above fold:
- Campaign title.
- 10-second fan summary.
- Why this vote matters.
- `Vote now in Mnet Plus` CTA.

Sticky mobile CTA:
- Primary button: `Vote now in Mnet Plus`.
- Secondary action: `Copy app link`.
- Small helper text: `Opens Mnet Plus app`.

### `/dashboard/[campaignId]`
Proof and metrics, not analytics suite.
- Before/After Proof Panel.
- Demo metric tiles.
- Trust Review: sourceFacts, needsReview, generated copy snapshot.
- Every metric labeled `demo proxy`.

## Interaction States

| Feature | Loading | Empty | Error | Success | Partial |
|---|---|---|---|---|---|
| Operator form | Generate spinner with fixed layout | Load demo notice prompt | Field-level errors | Preview appears | Missing optional facts become warnings |
| AI generation | Proof skeleton | No output prompt | Retry/sample fallback | Structured output visible | Schema repair warning |
| Fact guardrails | Panel skeleton | No facts yet | Blockers disable publish | Verified facts green | Warnings amber |
| Fan bridge | Page skeleton with CTA space | Friendly unavailable page | Bridge unavailable message | Summary and CTA visible | Warnings show boundary label |
| CTA | Pressed state | Disabled when no link | Copy fallback visible | Non-blocking click tracking | Metrics failure hidden from fan |
| Dashboard | Metric skeleton | No demo traffic yet | Stale metrics warning | Metrics visible | Missing metric says Pending |

## Accessibility
- All form controls have visible labels.
- Never use placeholders as the only label.
- Normal body text is at least 16px.
- Text contrast is at least 4.5:1.
- Buttons and links have visible focus states.
- Mobile touch targets are at least 44px.
- Error messages are text, not color-only.
- Use semantic landmarks: header, main, form, aside.

## Error Handling
- Missing required fields: field-level errors.
- Invalid deep link: block publish/open bridge and show operator error.
- AI timeout: retry once, then sample fallback if demo mode is enabled.
- Malformed AI output: repair once, then reject.
- Unsupported claim: needsReview warning or blocker.
- Missing campaign: friendly unavailable page.
- Metrics failure: do not block CTA.

## Testing Strategy
Unit:
- input validation
- deep-link validation
- reading-time calculation
- schema validation
- unsupported-claim guardrail

Integration:
- generate sample campaign
- store and fetch campaign
- render bridge page
- record page view and CTA click
- dashboard displays metrics

Eval/manual:
- sample vote notice does not produce invented date, reward, rule, or ranking claim
- demo path works with local fallback

## Event-Day Fallback Plan
1. Try AWS mode: Bedrock + DynamoDB + Amplify.
2. If Bedrock fails, use sample AI output.
3. If DynamoDB fails, use local JSON/in-memory store.
4. If Amplify fails, run locally and present the same route flow.

All fallback states must be labeled demo mode. Do not hide the fallback if asked.
