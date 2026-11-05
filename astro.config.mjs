import { defineConfig } from 'astro/config';

// TODO — set this to your GitHub Pages URL once you know your username/repo:
//  • User site  (repo named  <username>.github.io):  site: 'https://<username>.github.io'   (leave base unset)
//  • Project site (any other repo name):             also add  base: '/<repo-name>'
export default defineConfig({
  site: 'https://huanyuusc.github.io',
  // Local Windows builds: keep Vite's cache out of Dropbox (Dropbox locks files mid-rename). CI uses the default.
  vite: process.env.LOCALAPPDATA ? { cacheDir: process.env.LOCALAPPDATA + '/huanyu-site-vite' } : {},
});
