import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const site = process.env.SITE_URL ?? 'https://sethtipton.github.io';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  output: 'static',
  site,
  base,
  integrations: [react()],
  server: {
    host: true,
    port: 4321,
  },
  vite: {
    server: {
      hmr: {
        host: '192.168.0.16',
        protocol: 'ws',
        clientPort: 4321,
      },
    },
  },
});
