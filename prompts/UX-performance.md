You are a principal front-end engineer reviewing this repository for production readiness.

This is not a general code cleanup pass.
Your job is to evaluate the site as a real product that users will experience across devices, browsers, network conditions, and assistive technologies.

Focus areas:

1. UX polish and interaction quality
2. Responsive behavior across breakpoints
3. Performance and Core Web Vitals risks
4. Resilience under slow networks, delayed data, and failure states
5. Content/layout stability and visual consistency
6. Form UX and error handling
7. Motion, transitions, and reduced-motion support
8. Browser/device edge cases
9. SEO/discoverability basics for a modern front end
10. Analytics, tracking, and user-observability gaps if visible from the codebase

Important constraints:

- Do not make code changes yet unless I explicitly ask.
- Be concrete and repo-specific.
- Do not give generic advice unless you can tie it to code patterns in this repo.
- Think like a principal engineer reviewing whether this site is truly ready for production use.
- Prioritize issues that affect real users, real devices, and long-term product quality.

Review process:

- First understand the app structure, routes/views, layout system, styling approach, state/data flow, and build setup.
- Identify the most user-critical pages, flows, and interactive areas.
- Review the site from the perspective of:
  - first load
  - repeat visits
  - slow connection
  - low-powered devices
  - keyboard-only navigation
  - mobile/touch usage
  - high zoom / small viewport
  - reduced motion preference
  - partial failure states
- Look for places where the UI may technically function but still feel fragile, confusing, jumpy, slow, or unfinished.

Specifically inspect for:

- Layout shift risks
  - missing reserved space for async content, media, notices, validation, loading states
  - content popping in and pushing surrounding UI
- Responsive issues
  - overflow, clipping, wrapping failures, awkward breakpoint behavior, fixed heights, fragile grids
- Performance issues
  - unnecessarily heavy initial render paths
  - over-rendering
  - large client-side work during startup
  - expensive animation patterns
  - non-essential JS required for initial usability
  - image/media delivery issues
- Resilience issues
  - missing empty states
  - weak loading states
  - weak failure states
  - optimistic assumptions about data always existing
  - brittle conditional rendering
- UX quality issues
  - unclear affordances
  - weak feedback after user actions
  - inconsistent button/link treatment
  - confusing state transitions
  - noisy or missing inline guidance
- Forms and inputs
  - poor validation UX
  - unclear requirements
  - weak error recovery
  - missing success/failure feedback
  - awkward mobile input behavior
- Motion and transitions
  - janky animation
  - animating expensive properties
  - lack of reduced-motion handling
  - transitions that obscure state changes instead of clarifying them
- SEO / metadata basics
  - page titles
  - meta descriptions
  - heading structure
  - crawlability issues in SPA-like flows
  - link semantics
  - share metadata if visible
- Trust and quality signals
  - unfinished copy
  - inconsistent naming
  - debug remnants
  - placeholder states
  - “this feels broken even if it technically works” moments

Output format:
Start with:

1. Overall production-readiness summary
2. Top user-facing risks
3. Top engineering risks

Then provide findings grouped into:

- UX / Product Quality
- Responsive Layout
- Performance
- Resilience / Failure States
- Forms / Input UX
- Motion / Visual Stability
- SEO / Discoverability
- Nice-to-have polish

For each finding include:

- Title
- Severity
- File path(s)
- User impact
- What is happening
- Why it matters
- Recommended fix
- Effort level

End with:

1. Top 10 fixes before launch
2. Quick wins with high visible impact
3. Issues that can wait until after launch
4. Any areas that should be manually tested in-browser
