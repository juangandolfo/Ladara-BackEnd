# Repository instructions

- Use feature-based modules under `src/`; follow nearby naming and layering patterns.
- Keep changes focused. Read the relevant route, controller, service, DTO/validator, and tests before changing behavior.
- Run `npm test` and `npm run build` for code changes. Use migrations for schema changes; TypeORM synchronization is disabled.
- Do not commit secrets. Keep environment-specific values in environment variables.
- When API paths, permissions, inputs, outputs, or side effects change, update `documentation/API.md`.
- Keep architecture changes reflected in `documentation/ARCHITECTURE.md`; avoid duplicating those details here.
- Follow `.github/agents/backend-agent.agent.md` when its specialized backend workflow applies.
- Use kebab-case for new filenames and branch prefixes such as `feat/`, `fix/`, or `refactor/`.
