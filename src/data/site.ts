export type LinkItem = {
  label: string;
  href: string;
  external?: boolean;
};

export const siteMeta = {
  title: 'Seth Tipton',
  description:
    'Senior Front-End Engineer with 15+ years building design systems, scalable front-end architecture, accessible interfaces, and high-performance web experiences.',
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
    'I design and build the solid foundations that teams, platforms, and products need to grow with confidence.',
  statement: [
    'I geek out over the systems that make shared product work feel reliable and sane at scale. I love thoughtful component libraries, reusable patterns that dont fight you later, smart logic that teams can actually trust, and CMS/product integrations that respect real human workflows instead of making everyones life harder.',
    'My sweet spot is where fast delivery meets responsible ownership. Thats where I pour my energy into making things accessible by default, ridiculously performant, safe to roll out, delightful for editors, and built on standards that still feel useful years down the road. Ive done this across big enterprise platforms, commerce experiences, CMS-driven sites, and product UIs. These days I also love bringing AI into the mix to supercharge implementation and QA while keeping real engineering judgment firmly in the drivers seat.',
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
