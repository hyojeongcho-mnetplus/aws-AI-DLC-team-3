# Requirements: Mnet Plus Vote Bridge

## Metadata
- Feature: Mnet Plus Vote Bridge
- Context: AWS AI-DLC hackathon, 4-person team, Kiro Pro+ available up to 72h on event day
- Product direction: Context-to-Vote Campaign Bridge
- Technical default: Next.js single app, server API, Bedrock structured output, DynamoDB if AWS access is ready, local JSON/sample fallback
- Design direction: Editorial Proof Lab
- Status: Ready for Kiro implementation planning

## Problem
Global fans often leave before they understand why a vote matters. Mnet Plus campaign operators also repeat manual work to rewrite, translate, and explain campaign notices.

Mnet Plus Vote Bridge turns one vote campaign notice into a fan-facing bridge page that explains the vote, keeps official facts visible, and sends fans into the existing Mnet Plus app vote flow through a deep link.

## Goals
1. Help a global fan understand one vote campaign in about 10 seconds.
2. Send the fan to the existing Mnet Plus app vote path through a clear CTA.
3. Let an operator generate and review the bridge from a single campaign notice.
4. Show demo proof: original notice vs AI bridge, page views, CTA clicks, and reading-time proxy.
5. Make AI trust visible by separating source facts, generated copy, and review warnings.

## Non-Goals
- No Mnet Plus app source changes.
- No production Mnet Plus API dependency.
- No full CMS.
- No full multilingual platform.
- No real production analytics or attribution claims.
- No event, quiz, kuji, or non-vote campaign type in the MVP.
- No artist chatbot or artist impersonation.
- No Kiro-specific runtime dependency. Kiro is an implementation tool, not the deployed product.

## Team Assumption

This MVP is scoped for a 4-person hackathon team. The plan should preserve four parallel lanes after the shared schema is stable:

1. Product/UI owner: operator flow, fan bridge, dashboard, responsive polish.
2. AI/Guardrails owner: Bedrock prompt, schema validation, fallback generation, review warnings.
3. Data/AWS owner: campaign store, DynamoDB adapter if credentials are ready, event tracking.
4. Demo/QA owner: sample notice, runbook, accessibility checks, presentation proof path.

Avoid designs that require more than four active owners, such as full CMS, production analytics, or multiple campaign types.

## Personas

### Campaign Operator
The operator wants to create a shareable global vote bridge quickly, review what AI generated, and prove the bridge helps fans understand the action.

### Global Fan
The fan wants to know what the vote is, why it matters, how to participate, and which button opens the Mnet Plus app.

### Hackathon Judge
The judge wants to see a real business problem, an AI-native solution, AWS usage, trust controls, and a working demo path.

## User Stories and Acceptance Criteria

### Story 1: Operator creates a campaign bridge
As a campaign operator, I want to enter one vote campaign notice and app deep link so that I can generate a fan-facing vote bridge.

Acceptance criteria:
- The operator can open `/operator`.
- The form has visible labels for title, period, source notice, participation impact, and app deep link or voteId.
- The form offers a `Load demo notice` action for event-day fallback.
- Missing required fields show field-level errors.
- The generate action calls a server-side endpoint, never a browser-side model call.
- While generating, the UI shows a stable loading state in the same layout.

### Story 2: AI output is structured and reviewable
As a campaign operator, I want AI output split into source facts, generated copy, and warnings so that I can trust or correct the bridge before sharing.

Acceptance criteria:
- Generated output conforms to a schema named `CampaignBridgeResult`.
- Output includes `sourceFacts`, `generatedCopy`, `needsReview`, and `proofPanel`.
- Unsupported or uncertain claims are placed in `needsReview`.
- Blocker-level warnings disable publish/open bridge actions until resolved or acknowledged in demo mode.
- Generated copy is rendered as escaped text, never raw HTML.
- Malformed model output is repaired once or rejected with a visible error.

### Story 3: Fan understands and votes
As a global fan, I want a mobile-friendly bridge page so that I can understand the vote and open Mnet Plus quickly.

Acceptance criteria:
- `/b/[campaignId]` renders a campaign title, 10-second summary, why-it-matters, how-to-vote steps, key facts, and CTA.
- The primary CTA text is specific: `Vote now in Mnet Plus`.
- On mobile, the CTA is sticky at the bottom.
- The CTA includes a visible copy-link fallback.
- The page states that the content was generated from campaign notice facts and needs review if warnings exist.
- Missing campaign ids show a friendly unavailable page.

### Story 4: Demo dashboard proves the bridge
As a hackathon presenter, I want a dashboard that shows before/after proof and demo metrics so that judges understand the value.

Acceptance criteria:
- `/dashboard/[campaignId]` shows the original notice and AI bridge output side by side or stacked on mobile.
- The dashboard shows page views, CTA clicks, CTA click rate, and reading-time delta.
- Every metric is labeled as a demo proxy, not real production lift.
- If no traffic exists, the dashboard shows a warm empty state and a link to open the bridge.
- If metric storage fails, the dashboard shows a stale/pending state instead of blank numbers.

### Story 5: Event-day fallback works
As a hackathon team member, I want the demo to work even if AWS setup fails so that presentation is not blocked.

Acceptance criteria:
- If Bedrock credentials or permissions fail, the app can load a checked-in sample output.
- If DynamoDB access fails, the app can use local JSON or in-memory storage behind the same interface.
- If Amplify deploy is not ready, the app can run locally and still complete the full demo flow.
- Fallback mode is clearly labeled as demo mode.

## Design Requirements
- Visual direction: Editorial Proof Lab.
- First-screen visual anchor: Before/After Proof Panel.
- Avoid generic AI SaaS styling: no purple AI gradients, no 3-column feature grid, no decorative icon circles, no centered-everything layout.
- Use calm editorial surfaces, high contrast, and a single CTA accent.
- Use visible labels, accessible errors, keyboard focus states, and at least 44px mobile touch targets.
- Fan bridge is mobile-first.

## Performance Requirements
- Do not call Bedrock on fan page load.
- AI generation happens once in the operator flow and stores output.
- CTA click tracking must not block app opening or copy fallback.
- Use a timeout and retry once for AI generation.

## Security and Trust Requirements
- Treat source notice text as untrusted input.
- Escape all generated text.
- Do not expose AWS credentials to the browser.
- Do not claim real conversion lift.
- Do not invent dates, rewards, rankings, or official rules.
- Keep app auth and real vote submission inside the existing Mnet Plus app.

## Existing Mnet Plus App Leverage
Known existing paths from `/Users/saseungmin/workspace/mnet-app`:
- `src/lib/Deeplinking.ts`: `VoteDetailV2: "vote/v2/:voteId"`
- `src/utils/generateShareUrl.ts`: `VoteDetailV2(voteId)`
- Existing analytics include `vote_button_clicked` and `vote_done`.

The hackathon app should use these as integration proof, not modify the app.
