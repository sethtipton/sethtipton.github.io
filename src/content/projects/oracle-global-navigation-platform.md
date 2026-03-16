---
title: Oracle Global Navigation
summary: Built and evolved Oracle's shared global navigation as reusable front-end infrastructure for a large international web footprint, with accessibility, localization, and performance built into the core implementation.
problem: Oracle needed one navigation system that could handle deep information architecture, localization, site-specific customization, and ongoing brand and platform change without turning into a collection of fragile one-offs.
role: Senior Front-End Engineer
impact:
  - Sole front-end engineer responsible for six generations of Oracle's shared navigation over time.
  - Built the navigation as a reusable library component with configurable content, branding, and site-level behavior instead of site-specific forks.
  - Owned the interaction model end to end, including accessibility, responsive behavior, keyboard and focus management, testing, and rollout.
  - Reduced initial render cost by loading the large navigation DOM only when needed, improving Core Web Vitals without cutting capability.
stack:
  - React
  - TypeScript
  - Sass
  - Component libraries
  - Accessibility
  - Localization
  - Performance optimization
links:
  live: https://www.oracle.com/
featured: true
order: 1
thumbnail: ./images/oracle_thumbnail.webp
status: Enterprise platform
note: Code is proprietary; the public link points to the production surface rather than the internal component repository.
futureApi:
  projectKey: oracle-nav
  endpointHint: /projects/oracle-nav
---

### Context

Oracle's global navigation was not a page-level component. It had to work across multiple web properties, support deep and changing information architecture, localize across 34 languages, and stay accessible as business, brand, and platform requirements kept moving.

### What I focused on

I was the sole front-end engineer on the shared navigation through six generations of the system. The work covered implementation, accessibility, responsive behavior, testing, rollout, and the less visible maintenance work that keeps a shared component from drifting over time.

I built it inside a shared component library so it could roll out broadly while still letting teams control content, logos, colors, and site-specific configuration without forking the underlying interaction model.

One of the harder parts was performance. The navigation carried a large DOM footprint, so I used dynamic loading to keep initial page cost down while preserving the richer interaction model the product needed.

### Why it mattered

At this scale, navigation bugs do not stay local. Accessibility issues, focus regressions, or weak customization patterns can spread quickly across a large web ecosystem. Getting the shared implementation right made the global web experience more consistent across 9 sites, 34 languages, and 76 countries, including acquired properties and changing brand surfaces.
