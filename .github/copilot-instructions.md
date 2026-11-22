# Repository instructions

These instructions apply to all agents, including specialized profiles. Respect each role's editing boundaries and coordinate ownership of shared files.

## Before implementation

- Clarify material open questions and establish acceptance criteria before changing tests or implementation. Agree on cross-repository contracts before dependent work; escalate unresolved decisions to the coordinator for the user, or ask the user when working independently.
- Read relevant routes, controllers, services, DTOs/validators, tests, and contracts. Follow feature-based modules under `src/` and nearby naming and layering patterns.
- For behavior changes, create or update focused automated tests, or run suitable existing tests, **before** changing production code. Run them and confirm they fail specifically because the agreed expected behavior is missing or incorrect, not because of setup, compilation, dependencies, or an unrelated error. Investigate unexpected passes or unrelated failures; do not implement until a valid RED is established.
- If a meaningful RED test cannot be established, stop and report the blocker rather than claiming test-first verification. For non-behavioral work where a failing test is not applicable, say why and perform relevant checks instead.

## Implementation and verification

- Make the smallest focused change, then run the test to GREEN. Iterate until it passes; refactor only within scope and rerun affected tests. Do not weaken meaningful tests to obtain a pass.
- Run `npm test` and `npm run build` for code changes. Report actual RED and final check results, failures, blockers, and anything not run or not applicable; never imply an unrun check passed.
- Assess both `documentation/API.md` and `documentation/ARCHITECTURE.md` for every change. Update each when relevant: API paths, permissions, inputs, outputs, or side effects belong in the API documentation; architecture changes belong in the architecture documentation. Report when either needs no update. Agents without documentation ownership should flag needed updates to the responsible agent.
- Follow existing patterns and keep changes scoped; cover observable behavior and meaningful edge cases, preserve type safety, and surface errors explicitly. Use migrations for schema changes; TypeORM synchronization is disabled.
- Do not commit secrets; keep environment-specific values in environment variables. Use kebab-case for new filenames and branch prefixes such as `feat/`, `fix/`, or `refactor/`.

## Collaboration

- Follow `.github/agents/backend-agent.agent.md` when its specialized backend workflow applies. Coordinate non-overlapping ownership and shared contracts before editing; do not invent a stack, contract, or build command.
- Obtain human approval before merging, deploying, or taking destructive actions.
- Keep agent handoffs concise: `scope | contract | changed files | checks/results | blockers`. Use `none` or `not applicable` when appropriate, and identify unverified items explicitly.
