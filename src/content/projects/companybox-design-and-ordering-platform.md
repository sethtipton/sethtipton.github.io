---
title: CompanyBox
summary: Owned the front-end architecture for CompanyBox's shared Angular codebase, keeping customer storefronts, design workflows, and internal tools aligned across a complicated custom-packaging product.
problem: The hard part was keeping product configuration, pricing, design state, uploads, and ordering consistent across customer, partner, and admin apps instead of letting each surface drift into its own version of the logic.
role: Senior Front-End Engineer
impact:
  - Main front-end engineer for a multi-app Angular product spanning the customer storefront, design workflow, FedEx-branded partner experience, admin/CSR console, and internal builder tools.
  - Built shared Angular libraries for domain models, business services, auth and config injection, and reusable design tooling.
  - Kept configuration, pricing, uploads, saved projects, checkout, and 3D preview working from shared typed logic across customer, partner, and internal workflows.
  - Used service-driven state instead of isolated app logic so multiple branded experiences could stay aligned without forking the core implementation.
stack:
  - Angular
  - TypeScript
  - RxJS
  - Sass
  - Angular Material
  - Bootstrap
  - Playwright
  - Three.js
  - Fabric.js
links:
  live: https://companybox.com/
featured: true
order: 2
thumbnail: ./images/companybox-top.webp
status: Packaging commerce platform
---

### Scale and scope

CompanyBox was not a single storefront. It was a connected product made up of multiple Angular apps spanning customer ordering, design creation, a FedEx-branded partner experience, internal operations, and builder tools for reusable creative assets.

The complexity was in the front end as much as the backend. Product configuration, pricing, design state, uploads, validation, ordering, and internal workflows all had to stay aligned across different audiences and different apps.

### Ownership and approach

I treated the work as one codebase with multiple entry points, not a set of unrelated apps. The core structure was a shared Angular foundation for domain models, business services, auth and configuration injection, and design tooling that each surface could build on.

Much of the product complexity lived in the UI. Pricing and product rules were API-driven, but the front end still had to coordinate multi-step configuration, design creation, asset management, validation, saved projects, checkout, and preview across multiple applications.

I used service-driven state instead of a centralized store, which kept the apps modular while still sharing typed business logic and consistent behavior. I also leaned on end-to-end testing to protect a high-risk area where design, commerce, and internal operations met.

### Business and engineering impact

In a custom-product business, front-end inconsistency turns into operational pain quickly. Misaligned pricing, broken project state, weak validation, or disconnected upload flows affect quoting, ordering, and internal team efficiency. A shared foundation made it possible to support customer, partner, and internal workflows without rebuilding the same logic in parallel.
