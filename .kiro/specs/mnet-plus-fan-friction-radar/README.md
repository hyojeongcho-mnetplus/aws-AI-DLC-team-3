# Kiro Spec Pack: Mnet Plus Fan Friction Radar

Use this folder as the Kiro-ready implementation package for the second topic.

## Files

- `requirements.md` — product requirements, stories, acceptance criteria.
- `design.md` — architecture, DynamoDB schema, source adapters, UI spec.
- `tasks.md` — 4-person implementation plan with dependency waves.

## Recommended Kiro Workflow

1. Open Kiro and create a new Feature Spec.
2. Paste `requirements.md` as the requirements source.
3. Paste or attach `design.md` as the design source.
4. Paste `tasks.md` as the task plan.
5. Start with Wave 1. Do not let lanes diverge before shared types are locked.
6. Run Wave 2, 3, 4, and 5 in parallel by team owner.
7. Merge on the golden demo incident: `Ads blocking vote completion`.
8. Add Bedrock enhancement after deterministic classification and DynamoDB flow work.

## Final Direction

- Product: Live fan-friction command center.
- Demo anchor: Ads blocking vote completion.
- Data: App Store primary live, Google Play secondary live/replay.
- Storage: DynamoDB single table, on-demand, TTL.
- AI: deterministic-first, Bedrock enhancement.
- UI: severity-first command layout.

## 4-Person Team Split

1. AWS/Data owner: DynamoDB table, repository, seed import.
2. Connectors owner: App Store RSS, Google Play secondary, source health.
3. AI/Domain owner: classifier, wave classifier, redaction, Bedrock enhancer, action brief.
4. UI/Demo owner: command center, detail panel, responsive behavior, runbook.

## Event-Day Constraint

This version intentionally uses DynamoDB because the team has 4 people. Keep the table small. One table, one optional GSI, no OpenSearch, no multi-table architecture.

If Bedrock fails, the deterministic classifier must still power the demo.

If Google Play live fails, Google Play replay evidence must still appear and be labeled as `REPLAY`.

## Primary Demo Path

```txt
Seed/import reviews
  -> open command center
  -> show source health
  -> click P1 Ads blocking vote completion
  -> show evidence/action split
  -> copy Slack/Jira action brief
  -> explain AWS path: connectors -> DynamoDB -> classifier -> Bedrock -> UI
```

## Related Review Artifacts

- `.omx/context/mnet-plus-fan-friction-radar-ceo-review-20260510.md`
- `.omx/context/mnet-plus-fan-friction-radar-eng-review-dynamodb-20260510.md`
- `.omx/context/mnet-plus-fan-friction-radar-design-review-20260510.md`
- `~/.gstack/projects/mnet-plus-aws-AI-DLC-team-3/ceo-plans/2026-05-10-mnet-plus-fan-friction-radar.md`
