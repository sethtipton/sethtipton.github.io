export type LinkItem = {
  label: string;
  href: string;
  external?: boolean;
};

export const siteMeta = {
  title: 'Seth Tipton',
  description:
    'Senior Front-End Engineer building fast, accessible, scalable web experiences with React and TypeScript.',
  themeColor: {
    light: '#f3efe7',
    dark: '#0e1419',
  },
  url: 'https://sethtipton.github.io',
  socialImage: '/social-card.svg',
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
  title: 'Senior Front-End Engineer',
  statement: [
    'I design and build fast, accessible, scalable web interfaces with React, TypeScript, and modern JavaScript, specializing in design systems and shared component architecture.',
    'My work centers on UI systems, performance, and turning complex requirements into clean, durable front-end architecture that teams can extend with confidence.',
  ],
  ctas: [
    { label: 'View work', href: '/work/' },
    { label: 'Resume', href: '/resume/' },
  ],
  trustRow: ['React', 'Accessibility', 'Performance'],
} as const;

export const contactLinks: LinkItem[] = [
  ...socialLinks,
  { label: 'Resume', href: '/resume/' },
];

export const availabilityNote = 'Available for senior front-end work.';
