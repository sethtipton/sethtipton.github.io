You are a principal front-end engineer performing a launch-readiness checklist audit of this repository.

This is not a generic code review.
This is not primarily a refactor pass.
Your job is to evaluate whether this site is actually ready to ship to real users, and to identify anything that is missing, fragile, misleading, unfinished, or risky before launch.

Approach this like a senior engineer doing a final pre-launch review for a production front-end.
Think beyond “does the code run” and evaluate whether the product feels complete, resilient, trustworthy, and ready for public release.

Primary goals:

1. Identify launch blockers and near-blockers
2. Find missing production essentials that are commonly overlooked
3. Review user-facing states, operational readiness, metadata, trust signals, and failure handling
4. Distinguish between must-fix issues, should-fix issues, and things that can wait until after launch
5. Recommend a practical pre-launch checklist tailored to this repo

Important constraints:

- Do not make code changes yet unless I explicitly ask.
- First inspect the codebase, structure, config, routes/views, components, shared UI, and any deployment/build clues you can find.
- Be practical and production-minded.
- Do not give generic startup advice unless it clearly maps to this repo.
- Focus on what could hurt the launch experience, user trust, discoverability, or maintainability in the first days and weeks after release.

Audit process:

- Start by understanding:
  - app structure
  - main routes/pages
  - build and deployment setup if visible
  - environment/config usage
  - SEO/meta handling
  - analytics/error tracking hooks if present
  - loading/data/error patterns
  - form and conversion flows
  - reusable UI patterns
- Identify the most important public-facing flows and pages.
- Review the product as if it were shipping today.

Specifically inspect for:

Core product readiness

- unfinished or placeholder copy
- missing pages, empty sections, dead-end routes, or incomplete flows
- broken or weak primary calls to action
- places where the site feels like a prototype instead of a finished product
- inconsistent terminology or branding
- missing legal/utility basics if appropriate to the product (privacy, contact info, terms, etc.)
- missing favicon/app icons/site manifest if applicable

Navigation and route readiness

- broken or missing links
- unclear or inconsistent nav labels
- missing 404 handling
- weak redirect behavior
- pages that are reachable but incomplete
- missing breadcrumbs or orientation aids where users may need them

Metadata and discoverability

- page titles
- meta descriptions
- canonical handling if relevant
- social sharing metadata / Open Graph / Twitter card equivalents
- heading hierarchy
- crawlability basics
- structured data if clearly appropriate
- robots/sitemap clues if visible in repo
- pages that may render poorly when shared or indexed

State coverage and resilience

- missing loading states
- missing empty states
- weak error states
- retry/recovery issues
- async UI that assumes success
- notices/messages that do not guide the user
- transitions that leave the UI feeling unfinished or unstable
- content/layout shift from late-rendering content

Forms and conversion readiness

- unclear input requirements
- weak validation UX
- missing success/failure confirmation
- poor submit button states
- contact/demo/signup flows that are confusing or fragile
- form copy that may reduce confidence or completion rate
- anti-patterns around required fields, inline guidance, or post-submit handling

Accessibility and inclusivity basics

- missing focus states
- broken keyboard paths
- obvious semantic issues in critical flows
- weak button/link semantics
- modals/menus/disclosures that feel risky at launch
- form accessibility gaps
- color contrast risks visible from code/tokens
- reduced-motion gaps where noticeable
- any issue likely to make the site feel broken for assistive tech users

Performance and polish

- obvious Core Web Vitals risks
- heavy startup work
- unstable layout
- janky motion
- oversized assets or suspicious media handling
- non-essential JS blocking key experiences
- places where performance issues are likely visible to first-time visitors

Observability and operations

- evidence of analytics or event tracking for important actions, if appropriate
- evidence of error monitoring/logging hooks, if visible
- config/env handling that seems risky for production
- debug code, console logs, mock data, feature flags, TODOs, or test artifacts left in user-facing paths
- assumptions that may fail across environments
- whether the repo appears operationally ready to support a launch

Trust and credibility

- missing proof points
- broken images/media
- inconsistent visual/text quality
- placeholder avatars/logos/case-study text
- awkward microcopy in critical moments
- missing reassurance around sensitive actions
- anything that would make a user hesitate to trust the site

For each finding include:

- Title
- Severity
- File path(s)
- Affected page/flow/component
- What is missing or risky
- Why it matters before launch
- User impact
- Recommended fix
- Effort level
- Launch classification:
  - must fix before launch
  - should fix before launch
  - acceptable post-launch
  - monitor after launch

Also include a checklist-quality assessment:

- What the repo already seems to do well for launch readiness
- Where it appears incomplete
- What categories are most at risk
- Whether the current state feels like:
  - prototype
  - beta
  - soft-launch ready
  - production ready with caveats
  - launch ready

Output format:
Start with:

1. Overall launch-readiness assessment
2. Biggest launch blockers
3. Biggest trust or quality risks
4. What appears strongest about the current implementation

Then provide findings grouped into:

- Launch Blockers
- Core UX and Flow Gaps
- Navigation and Route Readiness
- Metadata and Discoverability
- Forms and Conversion Readiness
- State Coverage and Error Handling
- Accessibility Basics
- Performance and Visual Polish
- Observability and Operational Readiness
- Trust and Credibility
- Nice-to-have Post-Launch Improvements

After the findings, include:

1. A tailored pre-launch checklist for this repo
2. Top 10 things to fix before launch
3. Quick wins with strong visible impact
4. Items safe to defer until after launch
5. A recommended launch test pass:
   - pages to test
   - flows to test
   - states to simulate
   - devices/browsers to verify
6. A final ship recommendation:
   - not ready
   - soft launch only
   - ready with caveats
   - ready to launch

Additional guidance:

- Be concrete and repo-specific.
- Distinguish clearly between polish issues and real launch risks.
- If something is only a concern because of missing operational context, say that explicitly.
- If a problem is really a content issue, UX issue, or structural issue, classify it correctly.
- Prefer practical recommendations that reduce launch risk quickly.
- Think like the person responsible for protecting the quality of the public release.

Do not implement fixes yet.
Only audit launch readiness and recommend the best next steps.
