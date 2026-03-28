---
title: AI as a Practical Layer in My Workflow
summary: I use AI as a practical working layer for research, debugging, writing, planning, and small automation, with clear checks so the output stays grounded in the real code, browser, and product.
problem: The challenge is getting real leverage from AI without turning the workflow into vague prompting, low-trust output, or extra review overhead.
role: Senior Front-End Engineer
impact:
  - Use AI as a set of specialized tools for research, debugging, code review, writing, planning, and repeatable workflow support rather than one generic assistant.
  - Ground model output in local repository context, browser evidence, documentation, and deterministic checks so suggestions can be inspected and verified quickly.
  - Pair model reasoning with browser automation and DevTools to reproduce issues, inspect behavior, and confirm fixes with evidence instead of intuition alone.
  - Build lightweight automations for recurring work while keeping explicit approval points around risky changes, production decisions, and anything that affects trust.
stack:
  - Codex
  - OpenAI API
  - Playwright MCP
  - Chrome DevTools MCP
  - Context7 MCP
  - Markdown
  - YAML
  - GitHub Actions
links: {}
published: false
featured: false
order: 6
thumbnail: ./images/ai-case-study.webp
status: Current working practice
note: This case study covers how I work day to day rather than a single shipped product.
---

### Scale and scope

This is not one AI feature or a one-off experiment. It is the working layer I use across front-end development: research, code reading, debugging, writing, planning, and small automation.

The goal is not to hand authorship to a model. The goal is to remove mechanical drag, shorten slow loops, and make it easier to move from question to evidence to a real decision.

### How I actually use it

I use AI in modes, not as one catch-all workflow.

Sometimes it is a fast research partner that helps compare options, summarize messy information, or turn a rough idea into a cleaner structure. Sometimes it is a narrow implementation assistant with the local repo in view. Sometimes it works best beside browser automation and DevTools when I need to reproduce a bug, inspect DOM and network behavior, trace a rendering issue, or verify a fix with something more concrete than a guess.

That shift matters. The useful version of AI is not just conversational. It is connected to context, constrained by real inputs, and easy to interrupt when it starts drifting.

### Boundaries, trust, and review

AI is most useful when the boundaries are clear.

I try to make the model responsible for the parts it is good at: organizing context, drafting structures, mapping messy information into something usable, suggesting implementation paths, and helping coordinate repetitive steps. I keep final judgment, verification, and higher-risk decisions on my side.

In practice that means explicit prompts, structured inputs, repo-aware workflows, approval gates before automation, and real checks after suggestions. If a model proposes a change, I want to know where the idea came from, how it was evaluated, and what evidence says it should be trusted.

That is especially important in front-end work, where small decisions ripple outward into accessibility, performance, maintainability, content workflows, and UX consistency.

### Tooling and workflow

A lot of the value comes from how the tools work together.

I use local AI workflows when I want the model close to the codebase and project structure. I use documentation-aware tooling when I want current framework guidance instead of half-remembered patterns. I use browser automation and DevTools when I need direct evidence from the running product. I use markdown, YAML, and lightweight automation to make repeatable tasks easier to run without turning them into a black box.

That combination changes the role of AI. It stops being a place to ask for magic and becomes a practical layer in the workflow: one part reasoning, one part evidence gathering, one part scaffolding, one part acceleration.

### Business and engineering impact

Used this way, AI is not a replacement for engineering judgment. It is leverage.

It makes research less serial, debugging less blind, writing easier to sharpen, and maintenance work less likely to pile up behind more visible priorities. It also makes it easier to keep more of the workflow moving at once without lowering the trust bar.

The biggest gain is not raw speed. It is reducing friction while keeping quality standards intact. When the model has the right context, the browser has the real evidence, and the workflow has clear gates, AI becomes part of a practical delivery system instead of a novelty layer.

### Where I Think AI Is Headed and How We Should Be Building Today

I do not think the long-term value is in who can generate the most code or write the cleverest prompt. As models improve, raw generation gets cheaper. The scarcer layers become trust, context, verification, taste, owned data, distribution, and real-world outcomes. That is the right lens.

That has implications for how we build now.

First, we should assume AI will become a normal layer in product workflows, not a special feature. That means building systems that are structured, inspectable, and easy for both humans and agents to navigate. Clear markup, stable patterns, strong naming, explicit states, predictable APIs, and well-shaped content models matter even more in that world.

Second, we should build for verification, not just generation. If AI can produce endless drafts, code, copy, and recommendations, the products that stand out will be the ones that make trust visible. Provenance, approvals, audit trails, validation steps, evidence, and clear ownership become product features, not just internal process details. In a world full of generated output, people pay for what can be trusted.

Third, I think private context becomes a bigger advantage than generic intelligence. The winning systems will not just be the ones with access to a powerful model. They will be the ones that combine the model with local codebase knowledge, browser evidence, documentation, workflow history, domain rules, and real business constraints. Generic intelligence gets cheaper. Ground truth stays valuable.

Fourth, more software will need to communicate clearly not just to users but to other systems and agents. That pushes us toward machine-readable structures, stronger semantics, clearer interfaces, and more explicit contracts around compatibility, pricing, permissions, and outcomes. Even in front-end work, that changes how I think about content models, UI states, metadata, accessibility, and system boundaries.

So the way I want to build today is straightforward: make systems easier to inspect, easier to verify, easier to automate safely, and easier to connect to trustworthy context. Use AI aggressively for leverage, but build the surrounding workflow so quality does not depend on wishful thinking.

That feels more durable than chasing novelty. The future probably belongs less to teams that simply use AI and more to teams that know how to shape trust, evidence, context, and execution around it.
