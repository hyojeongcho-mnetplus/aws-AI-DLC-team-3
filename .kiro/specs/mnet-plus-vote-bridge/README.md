# Kiro Spec Pack: Mnet Plus Vote Bridge

Use this folder as the Kiro-ready implementation package.

Recommended Kiro workflow:
1. Open Kiro and create a new Feature Spec.
2. Paste `requirements.md` as the requirements source.
3. Paste or attach `design.md` as the design source.
4. Paste `tasks.md` as the task plan, preserving task dependencies and waves.
5. Run Wave 1 first. After schema and sample fallback work, run independent Wave 2 tasks in parallel.

Team-size assumption:
- This spec is scoped for a 4-person hackathon team.
- Recommended ownership: Product/UI, AI/Guardrails, Data/AWS, Demo/QA.
- Keep Wave 1 shared contracts small so all four lanes can work in parallel afterward.

Important event-day constraint:
- Kiro Pro+ is available up to 72h, but AWS/Bedrock/DynamoDB/Amplify access may still vary.
- Do not let cloud setup block the demo. Local fallback is part of the product plan.

Primary demo path:
`/operator` -> generate -> `/b/[campaignId]` -> CTA click/copy -> `/dashboard/[campaignId]`.
