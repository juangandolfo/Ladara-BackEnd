---
name: security-review
description: "Review application code for security vulnerabilities. Use when asked to audit security, perform a security review, find vulnerabilities, or inspect authentication, authorization, input handling, secrets, or OWASP risks. Requires tracing data flow and framework protections before reporting findings."
---

# Security Review

Identify concrete, exploitable weaknesses in the requested code. Follow `.github/copilot-instructions.md` and any applicable agent instructions. Do not edit code unless remediation is explicitly requested.

## Review workflow

1. **Set scope.** Report on the files, diff, or component requested. Inspect surrounding code and the wider repository as needed to establish data flow and protections; do not expand the reported scope without saying so.
2. **Map trust boundaries.** Trace candidate values from their source through validation, authorization, transformation, storage, and sinks. Distinguish attacker-controlled inputs (request data, headers, cookies, uploaded files, untrusted database content) from operator-controlled configuration, constants, and trusted internal state.
3. **Inspect controls.** Read relevant routes, middleware, validators, services, configuration, framework behavior, and tests. Verify whether parameterization, output encoding, authentication, authorization, CSRF defenses, or other controls actually cover the path.
4. **Validate impact.** For each candidate, establish reachable conditions, required privileges, attacker capabilities, affected data or operations, and a plausible impact. Do not infer exploitability from a suspicious API or pattern alone.
5. **Report only substantiated findings.** Prefer fewer high-confidence findings over speculative lists. If important facts are unresolved, put them in a clearly separate verification-needed section; omit low-confidence best-practice observations unless requested.
6. **Suggest focused remediation.** Make recommendations specific to the repository's stack and the vulnerable boundary. Do not claim a fix was applied or verified unless it was.

## Common areas to inspect

- Authentication, session/token handling, authorization, object ownership, and admin-only operations
- Injection through SQL/ORM raw paths, shell/process execution, templates, or dynamic evaluation
- Stored, reflected, and DOM-based XSS, including unsafe HTML sinks
- SSRF, unsafe redirects, path traversal, upload handling, and deserialization
- CSRF, mass assignment, insecure workflow transitions, race conditions, and resource exhaustion
- Secret/PII exposure, cryptographic misuse, unsafe error disclosure, logging, CORS, and security configuration
- Dependency, build, container, and CI/CD risks when those files are in scope

Treat framework protections as evidence to inspect, not as assumptions. For example, ORM parameterization does not protect interpolated raw queries; HTML escaping does not protect explicit raw-HTML sinks; a signed token does not establish object-level authorization by itself.

## Reporting format

Start with the reviewed scope and a short summary. For each confirmed issue include:

- **Severity:** Critical, High, Medium, or Low, based on demonstrated impact and prerequisites.
- **Confidence:** High or Medium; reserve Medium for a concrete candidate whose exploitability depends on a stated unresolved fact.
- **Location:** Existing repository-relative path and line range, where available.
- **Evidence:** Relevant flow, attacker-controlled source, missing/ineffective control, and reachable sink.
- **Impact:** What a realistic attacker could accomplish and under what access conditions.
- **Remediation:** A focused fix or defense.

List unresolved candidates separately with the precise fact that needs verification. If the review finds no confirmed issues, state: **No high-confidence vulnerabilities identified.** Avoid treating code style, hypothetical hardening, tests, comments, and unreachable code as vulnerabilities unless they are explicitly in scope.

## Source

This workspace skill is an original, repository-adapted workflow informed by the upstream Sentry skill at [getsentry/skills security-review](https://github.com/getsentry/skills/tree/a582c51ee29d0f35e6ac321340796f77d43da733/skills/security-review). It does not include that project's reference library; consult stack-specific primary documentation when deeper guidance is required.
