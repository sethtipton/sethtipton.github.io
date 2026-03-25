export type LinkItem = {
  label: string;
  href: string;
  external?: boolean;
};

export const siteMeta = {
  title: 'Seth Tipton',
  description:
    'Senior Front-End Engineer building design systems, front-end platforms, and accessible product UI.',
  themeColor: {
    light: '#f3efe7',
    dark: '#0e1419',
  },
  email: 'sethtipton@gmail.com',
  jobTitle: 'Senior Front-End Engineer',
  sameAs: [
    'https://github.com/sethtipton',
    'https://www.linkedin.com/in/sethtipton',
  ],
  url: 'https://sethtipton.github.io',
} as const;

export const primaryNav: LinkItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Work', href: '/work/' },
  { label: 'Resume', href: '/resume/' },
];

export const socialLinks: LinkItem[] = [
  { label: 'GitHub', href: 'https://github.com/sethtipton', external: true },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/sethtipton',
    external: true,
  },
  { label: 'Email', href: 'mailto:sethtipton@gmail.com', external: true },
];

export const heroContent = {
  name: 'Seth Tipton',
  title:
    'I design and build the foundations that teams, platforms, and products need to scale.',
  statement: [
    'I focus on the systems that make shared product work more reliable at scale, including component libraries, durable UI patterns, reusable logic, and CMS or product integrations that support real team workflows.',
    'My work is strongest where fast delivery and responsible ownership overlap, especially in accessibility, performance, rollout safety, editor experience, and standards that remain useful long after launch. I’ve built across enterprise platforms, commerce, CMS-driven experiences, and product UI, using AI to strengthen implementation and QA while keeping thoughtful engineering decisions at the center.',
  ],
  ctas: [
    { label: 'See case studies', href: '/work/' },
    { label: 'View resume', href: '/resume/' },
  ],
  trustRow: [
    '15+ years across web, product, and platform work',
    '200+ shared components',
    '34 languages / 76 countries',
    '~15% faster page loads',
  ],
} as const;

export const contactLinks: LinkItem[] = [
  ...socialLinks,
  { label: 'Resume', href: '/resume/' },
];

export const availabilityNote =
  'Best fit: front-end platform, design systems, and product UI roles that need strong standards and hands-on execution.';
