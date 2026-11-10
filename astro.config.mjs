import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Canonical address of the site (GitHub Pages custom domain; huanyuchen618.github.io redirects here).
export default defineConfig({
  site: 'https://huanyuchen.com',
  integrations: [sitemap()],
  // Local Windows builds: keep Vite's cache out of Dropbox (Dropbox locks files mid-rename). CI uses the default.
  vite: process.env.LOCALAPPDATA ? { cacheDir: process.env.LOCALAPPDATA + '/huanyu-site-vite' } : {},
});
