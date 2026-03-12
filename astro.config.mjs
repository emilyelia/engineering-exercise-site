import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// UPDATE: Replace with your actual domain once you have one
const SITE_URL = process.env.URL || 'https://your-domain.com';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [
    sitemap(),
  ],
  build: {
    // Inline small assets to reduce requests
    inlineStylesheets: 'auto',
  },
});
