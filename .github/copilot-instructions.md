# Backend collaboration

- Before implementation, clarify material open questions and establish acceptance criteria. For cross-repository work, agree on the relevant API contract before dependent work begins. Escalate unresolved decisions to the coordinator for the user; when working without a coordinator, ask the user.
- Assign non-overlapping ownership and coordinate shared files or contracts before changing them. Do not select a backend stack or invent build commands without an explicit decision and repository evidence.
- Follow existing conventions and add focused tests for changed behavior. Run applicable repository checks, and report failures, missing checks, and anything unverified explicitly.
- Obtain human approval before merging, deploying, or taking destructive actions.
- Keep agent handoffs concise: `scope | contract | changed files | checks/results | blockers`. Use `none` or `not applicable` when appropriate; identify unverified items rather than implying success.
