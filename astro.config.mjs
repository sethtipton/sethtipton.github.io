import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const site = process.env.SITE_URL ?? 'https://sethtipton.github.io';
const base = process.env.BASE_PATH ?? '/';
const hmrHost = process.env.HMR_HOST?.trim();
const hmrProtocol = process.env.HMR_PROTOCOL?.trim() || 'ws';
const parsedHmrClientPort = Number.parseInt(
  process.env.HMR_CLIENT_PORT ?? '',
  10,
);
const hmrClientPort = Number.isFinite(parsedHmrClientPort)
  ? parsedHmrClientPort
  : undefined;
const hmrConfig = hmrHost
  ? {
      host: hmrHost,
      protocol: hmrProtocol,
      ...(hmrClientPort ? { clientPort: hmrClientPort } : {}),
    }
  : undefined;

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
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
        'three',
        '@react-three/fiber',
        'd3-geo-voronoi',
      ],
    },
    build: {
      rollupOptions: {
        onwarn(warning, defaultHandler) {
          if (
            warning.message?.includes(
              'dynamic import will not move module into another chunk',
            )
          ) {
            return;
          }

          defaultHandler(warning);
        },
      },
    },
    ...(hmrConfig
      ? {
          server: {
            hmr: hmrConfig,
          },
        }
      : {}),
  },
});
