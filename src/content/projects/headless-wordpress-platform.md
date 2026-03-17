---
title: Tree City Rentals
summary: Built a headless WordPress and React rental-search site that kept publishing simple for admins while giving the front end cleaner structure and room to grow.
problem: The project needed a modern, interactive front end for rental discovery without losing the flexibility of WordPress for ongoing content updates, which made clear boundaries between CMS content, GraphQL data, and presentation especially important.
role: Senior Front-End Engineer
impact:
  - Built the project end to end as the sole engineer, pairing a headless WordPress backend with a React and TypeScript frontend.
  - Kept CMS content, GraphQL-delivered data, and React presentation logic clearly separated.
  - Used shared UI primitives and page composition patterns to keep the front end consistent and easier to maintain.
  - Preserved familiar publishing workflows for multiple admins while moving presentation into a cleaner, faster application layer.
stack:
  - React
  - TypeScript
  - Vite
  - WordPress
  - GraphQL
  - Apollo Client
  - React Router
links:
  live: https://www.treecityrentals.com/
  repo: https://github.com/sethtipton/treecityrentals
featured: true
order: 4
thumbnail: ./images/tree-city-rentals.svg
status: Headless CMS build
note: The public repo covers the front-end application layer; production deployment details can be added later if needed.
futureApi:
  projectKey: wp-platform
  endpointHint: /projects/headless-wordpress
---

### Context

Tree City Rentals was built as a rental-search experience rather than a traditional WordPress theme. The goal was to get a cleaner React front end without losing the practical content workflow WordPress already gives to multiple admins.

That made the boundaries matter. A headless setup only helps if content, data delivery, and UI stay clearly separated instead of turning into the same old coupling in a different stack.

### What I focused on

I built the project end to end as the sole engineer. My focus was on keeping WordPress as the content source while making the React front end cleaner and easier to extend than a template-heavy theme.

I leaned on shared UI primitives, clean page templates, and layout composition patterns so the front end could stay consistent without becoming rigid. GraphQL handled content delivery from WordPress, and the React app stayed focused on presentation and interaction.

### Why it mattered

The value here was not just swapping stacks. It was creating a setup that made content easier to update, reduced WordPress theme sprawl, and left room for future iteration without a rebuild. The result was a cleaner rental-search front end that still kept publishing practical for admins.
