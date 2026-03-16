---
title: My Portfolio
summary: Built this site as a structured Astro publishing system for case studies, resume content, and front-end experiments, with a static-first setup that stays fast and easy to maintain.
problem: The challenge was to make the site feel editorially controlled and technically sharp without turning a personal portfolio into a heavier application than it needed to be.
role: Senior Front-End Engineer
impact:
  - Built the site end to end in Astro with shared content models across the homepage, work archive, case studies, and resume.
  - Kept content and templates separate so visual or structural changes do not require reworking the entire site.
  - Structured case studies and resume content around shared schemas, reducing duplication across multiple views and outputs.
  - Added focused client-side behavior like theme persistence, SVG motion, and view transitions without giving up the static-first baseline.
stack:
  - Astro
  - TypeScript
  - Sass
  - GSAP
  - Astro Content Collections
links:
  live: https://sethtipton.github.io
  repo: https://github.com/sethtipton/sethtipton.github.io
featured: true
order: 5
thumbnail: ./images/performance-accessibility.svg
status: Personal site platform
note: The site acts as both a public portfolio and a working front-end system, so the implementation evolves alongside the content it presents.
futureApi:
  projectKey: portfolio-site
  endpointHint: /projects/portfolio-site
---

### Context

The site needed to do more than list projects. It had to support longer case studies, structured resume content, and ongoing iteration without becoming a pile of one-off pages.

Because it also acts as a front-end sample, the implementation mattered as much as the content. It needed to feel intentional, load quickly, and stay easy to maintain.

### What I focused on

I built the site end to end in Astro, partly as a showcase and partly as a practical way to learn the framework. The main goal was to create a structured publishing setup instead of a collection of loosely connected pages.

I used shared data schemas, reusable layouts, and a clear split between content and templates so the site could stay consistent as it grew. Token-driven styling keeps the visual system flexible, and Astro content collections make it easy to update case studies and resume data across multiple views without duplicating structure.

Client-side behavior stays intentionally narrow. The baseline remains static-first, with a few targeted enhancements layered in where they add value without changing the overall performance profile.

### Why it mattered

A portfolio should reflect the same level of judgment it talks about. For me, that meant building something fast, maintainable, and structured enough to evolve cleanly. Treating it like a publishing system instead of a one-off marketing page makes it a better representation of how I approach front-end work.
