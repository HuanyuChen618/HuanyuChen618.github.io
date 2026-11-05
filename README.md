# huanyu-site

Personal website (Astro → GitHub Pages), migrated from the USC Google Site.

## Run locally
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to ./dist
```

## Deploy (GitHub Pages)
1. Create a GitHub repo. For the cleanest URL, name it **`<username>.github.io`** (a *user site*).
2. In `astro.config.mjs`, set `site` to your Pages URL.
   - User site: `site: 'https://<username>.github.io'` (no `base`).
   - Project repo (any other name): also add `base: '/<repo-name>'`.
3. Push to the `main` branch.
4. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions.**
5. The included workflow (`.github/workflows/deploy.yml`) builds and deploys on every push.

## To finish the migration — drop these in and I'll wire them up
Put files in `public/`:
- `public/profile.jpg` — your headshot (replaces the placeholder)
- `public/CV_Huanyu_Chen_2025_05.pdf` — your CV
- `public/projects/nyc-parkour.jpg`, `public/projects/spherical.jpg` — project images

Paste text for:
- **Publications** → `src/pages/publications.astro`
- **Project descriptions** → `src/pages/projects.astro`
- **Contact links** (GitHub / Scholar / LinkedIn) → `src/pages/contact.astro`

Placeholder images are included so the layout renders before you add the real ones.

## Structure
```
src/
  layouts/BaseLayout.astro
  components/{Nav,Footer}.astro
  pages/{index,publications,projects,contact}.astro
  pages/blog/index.astro     # travel blog goes here later
  styles/global.css
public/                      # images, CV, favicon (served at site root)
```
