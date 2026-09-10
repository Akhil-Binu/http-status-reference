# HTTP Status Reference

> A complete, offline-capable developer reference documenting every HTTP status code (RFC 9110 + widely encountered non-standard provider extensions) with actionable troubleshooting steps, real configuration snippets, wire response visualization, and an interactive REST API decision guide.

---

## Features

- **Complete Status Coverage**: 94 total codes — 63 standard codes defined in **RFC 9110** and earlier IETF RFCs (1xx–5xx, including WebDAV and delta-encoding extensions) plus 31 widely-used non-standard provider extensions:
  - **Apache**: `218 This is fine`
  - **Laravel**: `419 Page Expired`
  - **Twitter**: `420 Enhance Your Calm`
  - **Shopify**: `430 Request Header Fields Too Large`
  - **Microsoft IIS**: `440 Login Time-out`, `449 Retry With`, `450 Blocked by Windows Parental Controls`
  - **nginx**: `444 No Response`, `494 Request Header Too Large`, `495 SSL Certificate Error`, `496 No SSL Certificate`, `497 HTTP to HTTPS`, `499 Client Closed Request`
  - **Cloudflare**: `520 Web Server Returned an Unknown Error`, `521 Web Server Is Down`, `522 Connection Timed Out`, `523 Origin Is Unreachable`, `524 A Timeout Occurred`, `525 SSL Handshake Failed`, `526 Invalid SSL Certificate`, `527 Railgun Error`, `530 Origin DNS Error`
  - **AWS ELB**: `460 Client Closed Connection`, `463 Too Many Forwarded IP Addresses`, `561 Unauthorized`
  - **cPanel/Apache hosting**: `509 Bandwidth Limit Exceeded`
  - **Platform & Proxy**: `498 Invalid Token (Esri)`, `528 Origin Is Unreachable (Pantheon)`, `529 Site is Overloaded (Qualys)`, `598 Network Read Timeout`, `599 Network Connect Timeout`
- **Instant Client-Side Fuzzy Search**:
  - Search by code number (e.g. `502`, `404`), name (e.g. `Bad Gateway`), or symptoms (e.g. `"my API returns nothing"`, `"login keeps failing"`, `"redirect loop"`).
  - Press `/` from anywhere to focus search.
  - Navigate results using `Up` / `Down` arrows, open with `Enter`, close with `Esc`.
- **Actionable Two-Track Troubleshooting**:
  - Concrete steps for **End Users** (refresh, clear cookies, check credentials).
  - Concrete steps for **Developers & Sysadmins** (reverse proxy configs, headers, application code, log analysis).
  - Real configuration snippets for **nginx**, **Apache**, and **Express (Node.js)**.
- **Interactive Wire Protocol & cURL Testing**:
  - Realistic HTTP/1.1 response wire inspection showing exact headers and formatted JSON response bodies.
  - One-click copyable `curl -i` test command.
- **REST API Decision Guide (`/guide`)**:
  - Answers "Which HTTP status code should I use in my API?".
  - Comprehensive dilemma comparisons: `401 vs 403`, `400 vs 422`, `200 vs 201 vs 204`, `301 vs 308`, `404 vs 410`, `502 vs 504`.
  - Quick decision matrix and common anti-patterns to avoid.
- **Deep Linking & Sequential Navigation**:
  - Dedicated SEO-optimized pages for every code (e.g. `/404`, `/502`, `/200`).
  - Next / Previous code pagination buttons for sequential browsing.
- **Offline PWA Support**:
  - Service worker with stale-while-revalidate asset caching and offline navigation fallback.
  - Works offline when your network is down — exactly when you need a reference guide most.
- **Dark & Light Modes**:
  - Respects OS `prefers-color-scheme`.
  - Manual toggle stored in `localStorage` without layout flash.
- **Accessibility & SEO**:
  - WCAG 2.1 AA compliant semantic HTML, high contrast tokens, ARIA combobox attributes.
  - Per-page Open Graph metadata, Twitter cards, JSON-LD structured data (`TechArticle`, `BreadcrumbList`, `FAQPage`), and `sitemap.xml`.

---

## Getting Started

### Prerequisites
- Node.js 18+ or 20+ LTS
- npm or pnpm

### Installation
```bash
# Clone or navigate to the repository directory
cd HTTPCODES_BY_AKHILBINU

# Install dependencies
npm install
```

### Development
```bash
# Start local development server
npm run dev
```
Open `http://localhost:4321` in your browser.

### Static Build
```bash
# Type-check and generate static production build in /dist
npm run build
```

### Preview Static Build
```bash
# Serve the generated /dist folder locally
npm run preview
```

---

## Project Structure

```
├── public/
│   ├── favicon.svg          # Site favicon
│   ├── manifest.webmanifest # PWA Web App Manifest
│   ├── offline.html         # Offline fallback document
│   ├── og-image.svg         # Social sharing Open Graph image
│   ├── robots.txt           # Crawler instructions
│   ├── sw.js                # Service Worker for offline caching
│   └── scripts/
│       ├── copy.js          # Clipboard copy utility with visual feedback
│       ├── filters.js       # Homepage category & non-standard chip filters
│       ├── search.js        # Fuzzy search & keyboard shortcut navigation
│       ├── sw-register.js   # Service Worker registration & online banner
│       └── theme.js         # Theme toggle & dark mode persistence
├── src/
│   ├── components/
│   │   ├── CategoryBadge.astro # Status category pill component
│   │   ├── Snippet.astro       # Syntax-highlighted code block with copy button
│   │   └── StatusCard.astro    # Status card with provider tags
│   ├── data/
│   │   ├── categories.ts       # Category metadata (1xx - 5xx)
│   │   ├── types.ts            # TypeScript interfaces for status codes
│   │   ├── statusCodes.ts      # Unified status codes registry entrypoint
│   │   └── codes/
│   │       ├── informational.ts # 1xx Informational codes
│   │       ├── success.ts       # 2xx Success codes (standard + 218)
│   │       ├── redirection.ts   # 3xx Redirection codes
│   │       ├── clientError.ts   # 4xx Client Error codes (standard + extensions)
│   │       └── serverError.ts   # 5xx Server Error codes (standard + extensions)
│   ├── layouts/
│   │   └── BaseLayout.astro     # Global layout (header, nav, search, footer, SEO)
│   ├── pages/
│   │   ├── [code].astro         # Dynamic static route for each status code
│   │   ├── index.astro          # Homepage with hero, common codes, and directory
│   │   ├── guide.astro          # REST API Decision Guide & Cheatsheet
│   │   ├── search-index.json.ts # Static search index endpoint
│   │   └── sitemap.xml.ts       # XML sitemap generator
│   └── styles/
│       └── global.css           # Design tokens, reset, typography, and theme variables
├── astro.config.mjs             # Astro configuration
├── package.json                 # Project scripts and dependencies
└── tsconfig.json                # TypeScript configuration
```

---

## How to Add a New HTTP Status Code

The dataset is strictly typed and separated from the UI layer. To add a new status code:

1. **Select the category file** in `src/data/codes/`:
   - `informational.ts` for 1xx
   - `success.ts` for 2xx
   - `redirection.ts` for 3xx
   - `clientError.ts` for 4xx
   - `serverError.ts` for 5xx

2. **Add a new `StatusCode` object** matching the interface in `src/data/types.ts`:

```typescript
{
  code: 499,
  name: 'Client Closed Request (nginx)',
  category: 'client-error',
  standard: false, // true for RFC 9110, false for vendor extensions
  summary: 'An nginx-specific code meaning the client closed the connection before nginx could send a response.',
  explanation:
    'Detailed explanation of what the server or reverse proxy is communicating...',
  scenarios: [
    'A user closes the browser tab while a slow query is executing.',
    'A mobile client loses network connectivity mid-request.',
    'A client library times out and aborts the HTTP connection.',
  ],
  causes: {
    client: ['Client aborted or closed socket before server response completed.'],
    server: ['Backend application is too slow, causing clients to give up and disconnect.'],
    intermediary: ['Reverse proxy timeout settings are longer than client-side timeout settings.'],
  },
  fixes: {
    user: ['Ensure stable network connection and wait for operations to finish.'],
    developer: [
      'Optimize backend query performance to respond before clients time out.',
      'Align client timeout configurations with proxy timeouts.',
    ],
  },
  snippets: {
    nginx: `# Example nginx configuration
proxy_ignore_client_abort on;`,
    express: `// Express handler example
req.on('close', () => {
  console.log('Client aborted connection');
});`,
  },
  headers: [
    { name: 'Connection', note: 'Indicates connection state.' },
  ],
  retrySafe: 'conditional',
  retryNote: 'Safe to retry for idempotent requests (GET); non-idempotent requests (POST) may duplicate actions.',
  cacheable: 'no',
  cacheNote: 'Not cacheable — the response was never delivered to the client.',
  related: [
    { code: 408, note: '408 Request Timeout is sent when the server times out waiting for the client.' },
    { code: 504, note: '504 Gateway Timeout is sent when the gateway times out waiting for the upstream.' },
  ],
  specUrl: 'https://http.dev/499',
  keywords: ['nginx', 'client closed', 'abort', 'closed connection'],
}
```

3. **Verify the static build**:
   ```bash
   npm run build
   ```
   Astro will automatically:
   - Generate `dist/[code].html` with full SEO, JSON-LD, and breadcrumbs.
   - Include the code in `search-index.json`.
   - Add the code URL to `sitemap.xml`.
   - Update category counters and filters on the homepage.

---

## Design System & Accessibility

- **Color Palettes**:
  - 1xx Informational: Blue (`--cat-informational`)
  - 2xx Success: Emerald Green (`--cat-success`)
  - 3xx Redirection: Warm Amber (`--cat-redirection`)
  - 4xx Client Error: Burnt Coral (`--cat-client-error`)
  - 5xx Server Error: Crimson Rose (`--cat-server-error`)
- **WCAG 2.1 AA Compliance**:
  - Color is never used as the sole indicator of state; all categories include explicit text labels.
  - Minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text across light and dark themes.
  - Visible keyboard focus rings (`:focus-visible`).
  - Tested at 200% browser zoom without layout breakage.

---

## License

MIT License. Created by [Akhil Binu](https://github.com).

