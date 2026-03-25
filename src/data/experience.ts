export const buildPrinciples = [
  {
    title: 'Performance that compounds',
    summary:
      'I look for implementation choices that keep products fast now and easier to tune as the surface area grows.',
  },
  {
    title: 'Accessibility in the interaction model',
    summary:
      'Keyboard support, semantics, focus behavior, and screen reader paths belong in the implementation, not a cleanup pass.',
  },
  {
    title: 'Shared systems over one-offs',
    summary:
      'I turn repeated UI and state problems into patterns teams can reuse instead of re-solving them feature by feature.',
  },
  {
    title: 'Rollouts teams can trust',
    summary:
      'Configuration, testing, migration, and failure states matter when shared front-end changes land across multiple surfaces.',
  },
  {
    title: 'Standards that support mentoring',
    summary:
      'Documentation, code review, and clear defaults help other engineers extend the work without inheriting hidden traps.',
  },
  {
    title: 'Practical tooling, bounded AI',
    summary:
      'I use tooling and AI where they reduce friction, support QA, and protect quality without replacing engineering judgment.',
  },
] as const;
