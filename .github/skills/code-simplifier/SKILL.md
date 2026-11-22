---
name: code-simplifier
description: "Simplify recently changed code for clarity and maintainability without changing behavior. Use when asked to simplify, clean up, refactor for readability, or review a focused change for unnecessary complexity."
---

# Code Simplifier

Improve clarity and consistency while preserving the program's externally observable behavior. Follow `.github/copilot-instructions.md`, the relevant module conventions, and any specialized agent boundaries.

## Scope and workflow

1. **Set a narrow scope.** Focus on code changed in the current task or explicitly named by the user. Do not use a simplification request as permission for broad cleanup, API changes, dependency additions, or behavior changes.
2. **Understand behavior first.** Read surrounding implementation and relevant tests. Identify contracts, edge cases, error behavior, side effects, and performance assumptions that must remain unchanged.
3. **Prefer clear improvements.** Reduce unnecessary branching, nesting, duplication, or indirection; use precise names; group cohesive logic; and make multi-step transformations easy to follow. Prefer explicit conditionals or `switch` statements over nested ternaries and dense expressions.
4. **Keep useful structure.** Do not optimize for fewer lines. Preserve abstractions that separate concerns or make code easier to test; avoid clever constructs, oversized functions, and unrelated formatting churn.
5. **Preserve semantics.** Do not change validation, authorization, status transitions, ordering, rounding, persistence, public types, errors, or timing behavior under the guise of cleanup. If a behavior change appears necessary, stop and request approval or split it into a separately specified task.
6. **Verify.** For behavior-affecting code, follow strict RED/GREEN rules in repository instructions; for strictly behavior-preserving cleanup, run the focused existing tests and relevant checks. For code changes run `npm test` and `npm run build`, report actual results, and do not imply unrun checks passed.
7. **Summarize.** State the specific clarity improvements and verification results. Mention any relevant API/architecture documentation assessment; usually pure simplification needs no documentation update.

## Review checklist

- Is each branch and intermediate value easy to understand?
- Can repeated logic be consolidated without hiding distinct behavior?
- Are names and boundaries consistent with adjacent code?
- Are comments explaining intent or constraints rather than restating syntax?
- Are observable behavior and tests unchanged?
- Did the edit stay within the requested scope?

## Source

This workspace skill is an original, repository-adapted workflow informed by the [Sentry code-simplifier skill](https://github.com/getsentry/skills/tree/a582c51ee29d0f35e6ac321340796f77d43da733/skills/code-simplifier).
