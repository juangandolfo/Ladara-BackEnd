---
name: architect
description: "Design a non-trivial change before implementation. Use when asked to architect, design, or plan a feature, API, data model, migration, or module boundary, especially when multiple designs are plausible."
---

# Architect

Establish a clear design before implementation. Follow repository instructions and existing architecture; this skill produces a design, not production code, unless implementation is separately requested.

## Workflow

1. **Define the change.** Restate the goal, observable behavior, constraints, and acceptance criteria. Inspect relevant modules, tests, contracts, migrations, and documentation before proposing structure.
2. **Trace affected systems.** Map callers, routes, controllers, services, entities, validation, persistence, DTOs, integrations, and affected clients. Identify ownership of state and important trust or transaction boundaries.
3. **Resolve material unknowns.** Do not invent business rules, API contracts, or persistence semantics. Ask concise questions when an unresolved choice changes behavior, authorization, data compatibility, or client expectations. Otherwise, state assumptions explicitly.
4. **Sketch two viable designs.** Compare module boundaries, types/signatures, state ownership, failure handling, compatibility, and testability. Keep sketches compact and concrete; include only relevant components.
5. **Choose and justify.** Prefer one owner for each piece of state, one obvious operation for each action, narrow caller knowledge, and consistency with established repository patterns. Avoid layering workarounds over recurring design problems.
6. **Plan verification and rollout.** List behavior-focused tests, migration/backward-compatibility concerns, API and architecture documentation impacts, and the project-required checks. For backend behavior changes, account for the repository's required RED-before-production-change workflow and final `npm test` and `npm run build` checks.
7. **Hand off a usable design.** Present the chosen approach, key types/signatures, request/response or persistence contract when applicable, alternatives considered, risks, and ordered implementation steps. Mark unverified assumptions clearly.

For broad or contentious designs, identify the competing constraints and recommend a separate structured review rather than presenting an unsupported single answer. Keep the final design proportional to the change; do not produce speculative architecture for unrelated parts of the system.

## Source

This workspace skill is an original adaptation informed by the [Cursor pstack architect skill](https://github.com/cursor/plugins/tree/e1cc03121a0e71129a4fb730d7c5528a0a3e43c8/pstack/skills/architect).
