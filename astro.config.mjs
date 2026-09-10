import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://http.dev',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  compressHTML: false,
});
