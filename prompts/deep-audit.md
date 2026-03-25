You are a principal front-end engineer performing a deep audit of this repository.

Your goal is to review the entire codebase and identify:

1. Improvements to code quality, maintainability, readability, and architecture
2. Opportunities to simplify logic, reduce duplication, and remove unnecessary complexity
3. Accessibility issues and WCAG-minded improvements
4. Performance issues that are obvious from static analysis
5. Risky patterns, dead code, fragile abstractions, and inconsistent conventions

Important constraints:

- Do not make code changes yet unless I explicitly ask for them.
- First inspect and understand the codebase structure, tooling, and patterns.
- Be conservative and evidence-based. Do not invent issues.
- Prefer minimal-diff recommendations that fit the existing patterns of the repo.
- Respect the current stack, conventions, naming, and architecture unless there is a strong reason to change them.
- Call out tradeoffs when a recommendation is subjective.
- Prioritize issues that matter most in production and for long-term maintainability.

Audit process:

- Start by mapping the repo structure and identifying the major app areas, frameworks, build tools, styling approach, component patterns, and test setup.
- Review shared UI primitives, layout components, form controls, navigation, modals/dialogs, menus, tables, carousels, accordions, and interactive widgets first.
- Then review feature-level components, hooks, utilities, styles, and state management.
- Look for repeated patterns that could be abstracted or simplified.
- Look for over-engineering, unnecessary indirection, prop drilling, brittle conditionals, and confusing state flows.
- Review TypeScript usage if present: weak typing, any abuse, overly complex types, missing discriminated unions, unsafe casts, poor prop contracts.
- Review CSS/SCSS/styling patterns: duplication, specificity issues, leakage, magic numbers, hard-coded values, inconsistent token usage, responsiveness problems.
- Review React patterns if present: unnecessary re-renders, unstable callbacks/objects, derived state issues, incorrect effects, missing cleanup, poor memoization choices, key misuse, anti-patterns in controlled/uncontrolled components.
- Review accessibility thoroughly:
  - semantic HTML usage
  - heading hierarchy
  - landmark usage
  - button vs link correctness
  - accessible names
  - label/input association
  - keyboard access and focus order
  - focus trapping where needed
  - visible focus states
  - aria misuse / redundant aria
  - dialogs, menus, disclosures, tabs, comboboxes, and custom controls
  - screen reader announcement issues
  - color contrast risks
  - reduced motion considerations
  - touch target sizing
  - error messaging and validation accessibility
  - hidden content, inert states, disabled states, and live regions
- Flag places where UI may visually work but be broken for keyboard or assistive tech users.
- Note places where code comments, naming, or structure make future maintenance harder.

When you report findings:

- Group them by severity:
  - Critical
  - High
  - Medium
  - Low
  - Nice-to-have
- For each issue include:
  - Title
  - Severity
  - File path(s)
  - Why it matters
  - What is wrong
  - Recommended fix
  - Whether the fix is low, medium, or high effort
- For code quality and simplification findings, include before/after thinking in plain English.
- For accessibility findings, explain both the user impact and the technical issue.
- Prefer concrete, file-specific findings over general advice.
- Quote small relevant snippets only when necessary.
- At the end, provide:
  1. Top 10 highest-value fixes
  2. A shortlist of “quick wins”
  3. A shortlist of “structural refactors worth planning”
  4. Any patterns that should become team standards

Output format:

- Start with a short repo health summary
- Then provide the full audit
- End with a prioritized action plan in recommended execution order

If helpful, run available static checks such as linting, type checking, tests, or build commands to support your findings, but do not get blocked by them. If a script fails, include that as part of the audit.
