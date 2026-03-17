---
title: Belltower Brewing
summary: A site built on WordPress for a local brewery with a focused React pairing experience, keeping day-to-day publishing simple while adding a richer product-style recommendation flow.
problem: The site needed to stay easy to update through WordPress while supporting a more interactive beer discovery experience without turning the whole front end into a heavy app.
role: Senior Front-End Engineer
impact:
  - Built the project end to end, including the custom WordPress theme, the React pairing experience, the supporting integrations, and the admin-facing content workflow.
  - Kept the site on a traditional WordPress foundation and used React only where the product experience actually benefited from it.
  - Shipped the pairing experience as a plugin with Gutenberg block and shortcode support, loading React assets only when the feature was present.
  - Built a guided recommendation flow that ranks beers, explains matches, enriches content, and supports interactive flight building without turning the entire site into an app.
stack:
  - WordPress
  - React
  - TypeScript
  - Sass
  - REST APIs
  - Vite
  - Gutenberg blocks
  - OpenAI Responses API
  - Untappd API
  - Google Sheets
links:
  live: http://www.belltowerbrewing.com
  repo: https://github.com/sethtipton/belltower-brewing
featured: true
order: 3
thumbnail: ./images/belltower-top.webp
status: Public side project
note: The public repository covers the theme and pairing work together, so the React enhancement is intentionally treated as part of a broader site implementation.
futureApi:
  projectKey: brewery-tools
  endpointHint: /projects/brewery-tools
---

### Context

Belltower Brewing is a brewery site first, but it also needed a more interesting recommendation experience than a typical brand site. The project had to support regular publishing through WordPress while giving visitors a better way to explore beers, pairings, and flights.

That meant keeping the editorial side straightforward while adding a more product-like interaction layer in a focused part of the site.

### What I focused on

I built the project end to end, from the custom theme through the pairing experience, integrations, and admin-facing publishing flow.

The main technical decision was to keep WordPress doing what it is good at and introduce React only where it clearly improved the product. Instead of turning the site into a full application, I used a React island for the pairing flow so the rest of the site could stay simple to publish and maintain.

The pairing experience is more than a filter. Users move through a short guided quiz around mood, body, bitterness tolerance, flavor, and alcohol preference. The app sends those answers to a custom WordPress REST endpoint, which uses AI in a bounded way to rank likely matches, generate short explanations, and attach pairing details. On the front end, the app reorders results, highlights recommendations, and supports interactive flight building.

I packaged the feature as a WordPress plugin with both shortcode and Gutenberg block support, and only enqueue its React assets when the embed is actually present. I also combined WordPress-managed content with external sources like Untappd and Google Sheets so the site could stay current without code changes for every menu update.

### Why it mattered

This project is a good example of front-end judgment, not just front-end implementation. The challenge was to add the right interaction in the right place. By keeping WordPress as the publishing foundation and layering in a focused React experience, I made the site more useful without making the whole build harder to own.

It also leaves room to grow. The publishing flow is clean, the recommendation layer is reusable, and the site can support richer product behavior without carrying full-app complexity across every page.
