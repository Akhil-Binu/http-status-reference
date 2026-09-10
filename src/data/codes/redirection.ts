import type { StatusCode } from '../types';

export const redirection: StatusCode[] = [
  {
    code: 300,
    name: 'Multiple Choices',
    category: 'redirection',
    standard: true,
    summary: 'There are several possible representations of the requested resource, and the client must pick one.',
    explanation:
      'The server has more than one representation of the resource (e.g. different content types or languages) and either lists the options in the body for the user/client to choose from, or picks a preferred one via the Location header. In practice this is one of the least-used status codes on the modern web — most content negotiation is resolved automatically via the Accept header instead.',
    scenarios: [
      'A legacy content-negotiation endpoint offering the same document in multiple formats (HTML, PDF, plain text) with no clear default.',
      'An API versioning scheme that lists multiple valid representations for a resource.',
      'Rarely encountered directly by end users; mostly a theoretical/legacy status.',
    ],
    causes: {
      client: ['Request did not specify (or ambiguously specified) which representation it wants via Accept headers.'],
      server: ['Server has multiple valid representations and no strong default to redirect to automatically.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not typically actionable by end users — this is a server design choice, not a network problem.'],
      developer: [
        'Prefer transparent content negotiation (respond directly based on Accept/Accept-Language headers) over surfacing 300 to clients.',
        'If used, set the Location header to the server\'s preferred choice so non-interactive clients still have a sensible default.',
      ],
    },
    headers: [
      { name: 'Location', note: 'May indicate the server\'s preferred representation among the choices.' },
    ],
    retrySafe: 'yes',
    retryNote: 'Safe to retry (GET is idempotent); typically a request that instead specifies a clear Accept header resolves the ambiguity.',
    cacheable: 'yes',
    cacheNote: 'Cacheable by default unless headers say otherwise.',
    related: [
      { code: 406, note: '406 Not Acceptable is returned instead when no representation matches the client\'s Accept header at all, rather than offering choices.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-300-multiple-choices',
    keywords: ['content negotiation', 'multiple representations'],
  },
  {
    code: 301,
    name: 'Moved Permanently',
    category: 'redirection',
    standard: true,
    summary: 'The resource has permanently moved to a new URL — update your links and bookmarks.',
    explanation:
      'Tells clients and search engines that the resource now lives at a different URL for good. Browsers and crawlers are expected to update bookmarks/indexes to the new location. Historically, 301 allowed the redirected request\'s method to be changed to GET by some clients (a long-standing ambiguity in older HTTP specs), which is why 308 exists for cases where the method must be strictly preserved.',
    scenarios: [
      'A site migrating from http:// to https://, or from a non-www to www domain (or vice versa).',
      'A page permanently renamed or moved as part of a site restructure, with the old URL redirecting to the new one.',
      'Consolidating duplicate URLs (e.g. trailing slash normalization) for SEO purposes.',
      'A company changing domains after a rebrand, permanently forwarding the old domain.',
    ],
    causes: {
      client: [],
      server: ['Server/application configured a permanent redirect rule for this path.'],
      intermediary: ['A CDN, load balancer, or reverse proxy rule issues the redirect before the request reaches the origin.'],
    },
    fixes: {
      user: [
        'Not an error — browsers follow this automatically. If a bookmark is stale, update it to the new URL shown after redirect.',
        'If stuck in a redirect loop, clear cookies/cache for the site, since 301s are aggressively cached by browsers.',
      ],
      developer: [
        'Verify the Location header points to the final, correct URL (not another redirect) to avoid redirect chains.',
        'Use 301 only when the move truly is permanent — browsers and CDNs cache it long-term, making mistakes hard to undo quickly.',
        'Update internal links and sitemaps to the new URL directly rather than relying on the redirect long-term, for both performance and SEO.',
        'If a request method (POST) must be preserved across the redirect, use 308 instead of 301.',
      ],
    },
    snippets: {
      nginx: `# Redirect old path permanently
location /old-page {
    return 301 /new-page;
}
# Redirect whole domain to https/www
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://www.example.com$request_uri;
}`,
      apache: `# .htaccess
Redirect 301 /old-page /new-page
# Or with mod_rewrite for pattern-based rules
RewriteEngine On
RewriteRule ^old-page$ /new-page [R=301,L]`,
      express: `app.get('/old-page', (req, res) => {
  res.redirect(301, '/new-page');
});`,
    },
    headers: [
      { name: 'Location', note: 'The new permanent URL for the resource.' },
    ],
    retrySafe: 'yes',
    retryNote: 'Following the redirect is safe for GET/HEAD; some older clients rewrite POST to GET on 301, so use 308 if method preservation matters.',
    cacheable: 'yes',
    cacheNote: 'Aggressively and often permanently cached by browsers — mistakes are slow to undo, so verify carefully before deploying.',
    related: [
      { code: 302, note: '302 Found is for temporary moves — use 301 only when the change is permanent.' },
      { code: 308, note: '308 Permanent Redirect behaves like 301 but strictly guarantees the request method is not changed.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-301-moved-permanently',
    keywords: ['permanent redirect', 'url moved', 'seo redirect', '301 redirect', 'redirect loop', 'too many redirects'],
  },
  {
    code: 302,
    name: 'Found',
    category: 'redirection',
    standard: true,
    summary: 'The resource temporarily lives at a different URL — come back to the original URL next time.',
    explanation:
      'Signals a temporary redirect: the client should follow the Location header for this request, but should keep using the original URL for future requests (unlike 301). Historically ambiguous about whether the method should change to GET on redirect — most browsers do change POST to GET on 302, which is why 307 exists for cases requiring strict method preservation.',
    scenarios: [
      'Redirecting a user to a login page before showing protected content, then back afterward.',
      'A/B testing or feature flag frameworks temporarily routing traffic to a variant URL.',
      'Post-form-submission redirects (the Post/Redirect/Get pattern) to prevent duplicate submissions on refresh.',
      'Temporary maintenance redirects pointing to a status page.',
    ],
    causes: {
      client: [],
      server: ['Application logic issues a temporary redirect based on session state, feature flags, or workflow logic.'],
      intermediary: ['A load balancer or CDN edge rule temporarily reroutes traffic.'],
    },
    fixes: {
      user: [
        'Not an error — browsers follow it automatically. If redirected somewhere unexpected repeatedly, clear cookies/session data which often drive this logic.',
      ],
      developer: [
        'Use 302 only for genuinely temporary redirects; use 301/308 for permanent ones so caches and SEO behave correctly.',
        'If the redirected request is a POST/PUT/DELETE and the method must be preserved, use 307 instead of 302.',
        'Follow the Post/Redirect/Get pattern after form submissions to avoid duplicate-submission-on-refresh issues.',
      ],
    },
    snippets: {
      nginx: `location /promo {
    return 302 /promo/2024;
}`,
      apache: `Redirect 302 /promo /promo/2024`,
      express: `app.post('/checkout', (req, res) => {
  processOrder(req.body);
  res.redirect(302, '/order-confirmation'); // Post/Redirect/Get
});`,
    },
    headers: [
      { name: 'Location', note: 'The temporary URL to follow for this request only.' },
    ],
    retrySafe: 'yes',
    retryNote: 'Safe for GET/HEAD; many clients historically convert POST to GET on 302 — use 307 if that would break your workflow.',
    cacheable: 'conditional',
    cacheNote: 'Not cached by default unless explicit caching headers (Cache-Control/Expires) are present.',
    related: [
      { code: 301, note: 'Use 301 instead if the move is actually permanent.' },
      { code: 307, note: '307 Temporary Redirect is the strict-method-preserving version of 302.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-302-found',
    keywords: ['temporary redirect', 'found', '302 redirect', 'redirect loop', 'too many redirects'],
  },
  {
    code: 303,
    name: 'See Other',
    category: 'redirection',
    standard: true,
    summary: 'The response to the request can be found at a different URL, and should be fetched with a GET.',
    explanation:
      'Explicitly tells the client to retrieve the result using GET at a different URL, regardless of the original request\'s method. This resolves the ambiguity of 302 by being unambiguous: always follow with GET. It is the correct status for the "redirect after a successful POST" pattern.',
    scenarios: [
      'Redirecting to an order confirmation page after successfully processing a POST checkout request.',
      'An API that processes a resource-creating action via POST and redirects to a GET-able status/result page.',
      'Form submission handlers that want to guarantee the following request is a GET, unlike the ambiguous 302.',
    ],
    causes: {
      client: [],
      server: ['Application explicitly wants the client to fetch the result via GET at a new URL.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not an error — browsers handle this automatically and correctly convert to GET.'],
      developer: [
        'Use 303 (not 302) whenever you specifically need the follow-up request to be GET regardless of the original method — it removes the ambiguity 302 has.',
        'Pair with the Post/Redirect/Get pattern for form submissions to prevent duplicate POSTs on page refresh.',
      ],
    },
    snippets: {
      express: `app.post('/orders', (req, res) => {
  const order = createOrder(req.body);
  res.redirect(303, \`/orders/\${order.id}\`);
});`,
    },
    headers: [
      { name: 'Location', note: 'The URL to GET for the result of the processed request.' },
    ],
    retrySafe: 'yes',
    retryNote: 'The follow-up GET is safe and idempotent by definition.',
    cacheable: 'conditional',
    cacheNote: 'The 303 response itself is not cached by default; the resulting GET response follows normal caching rules.',
    related: [
      { code: 302, note: '302 is ambiguous about method preservation; 303 always means "GET this instead".' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-303-see-other',
    keywords: ['post redirect get', 'see other', 'prg pattern'],
  },
  {
    code: 304,
    name: 'Not Modified',
    category: 'redirection',
    standard: true,
    summary: 'The client\'s cached version of the resource is still valid — no need to re-download it.',
    explanation:
      'Returned in response to a conditional GET (using If-None-Match or If-Modified-Since headers) when the resource has not changed since the client\'s cached copy was retrieved. The response has no body — the client is told to reuse its cached version, saving bandwidth and improving load speed.',
    scenarios: [
      'Reloading a page where static assets (CSS/JS/images) haven\'t changed since the last visit.',
      'An API client polling an endpoint with an If-None-Match ETag and getting confirmation that nothing changed.',
      'Browser DevTools Network tab showing 304 for cached assets on a hard-refresh-free reload.',
      'A CDN validating with the origin whether its cached copy is still fresh.',
    ],
    causes: {
      client: ['Client sent a conditional request with If-None-Match or If-Modified-Since.'],
      server: ['Server compared the condition against the current resource state and found no change.'],
      intermediary: ['A CDN or caching proxy performs the validation and serves the cached copy directly.'],
    },
    fixes: {
      user: [
        'Not an error — this is a performance optimization. If content looks stale despite this, force a hard refresh (Ctrl/Cmd+Shift+R) to bypass the cache.',
      ],
      developer: [
        'Ensure ETag or Last-Modified headers are set correctly and consistently so conditional requests work as intended.',
        'If clients never get 304 (always re-downloading), check that your server/CDN actually implements conditional request handling.',
        'If clients get stale 304s after real content changes, verify your ETag generation reflects actual content changes (e.g. includes a content hash, not just a timestamp that might not update).',
      ],
    },
    snippets: {
      nginx: `# nginx handles ETag/If-None-Match automatically for static files
etag on;`,
      express: `const etag = require('etag');
app.get('/data', (req, res) => {
  const body = getData();
  const tag = etag(JSON.stringify(body));
  res.set('ETag', tag);
  if (req.headers['if-none-match'] === tag) {
    return res.status(304).end();
  }
  res.json(body);
});`,
    },
    headers: [
      { name: 'ETag', note: 'Opaque validator compared against If-None-Match to determine freshness.' },
      { name: 'Last-Modified', note: 'Timestamp compared against If-Modified-Since as an alternative validator.' },
    ],
    retrySafe: 'yes',
    retryNote: 'GET-based and idempotent; safe to retry (though there is rarely a reason to).',
    cacheable: 'yes',
    cacheNote: 'By definition this response confirms the cached copy remains valid and reusable.',
    related: [
      { code: 200, note: 'Returned instead of 304 when the resource has changed and a fresh copy is sent.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-304-not-modified',
    keywords: ['conditional get', 'etag', 'cache validation', 'not modified'],
  },
  {
    code: 305,
    name: 'Use Proxy',
    category: 'redirection',
    standard: true,
    summary: 'Deprecated: the requested resource must be accessed through the proxy specified in the Location header.',
    explanation:
      'Instructed the client to repeat the request via a specific proxy. Due to significant security concerns (it could be abused to redirect traffic through an attacker-controlled proxy) and inconsistent browser support, 305 was deprecated and browsers largely ignore or refuse to act on it.',
    scenarios: [
      'Almost never encountered in modern web traffic; primarily of historical interest.',
      'May appear in legacy enterprise systems built before its deprecation was widely known.',
    ],
    causes: {
      client: [],
      server: ['A legacy server implementation is configured to require proxy-based access.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not actionable — modern browsers ignore this status code, so encountering it usually indicates a broken legacy integration.'],
      developer: [
        'Do not use 305 in new systems — it is deprecated and unsupported by modern browsers.',
        'Use explicit proxy configuration on the client side instead of relying on the server to direct proxy usage via HTTP status.',
      ],
    },
    headers: [
      { name: 'Location', note: 'Specified which proxy to use, per the original (now deprecated) design.' },
    ],
    retrySafe: 'no',
    retryNote: 'Deprecated and unreliable across clients — do not build retry logic around this code.',
    cacheable: 'no',
    cacheNote: 'Not meaningfully cacheable; deprecated and inconsistently handled.',
    related: [
      { code: 307, note: 'For legitimate temporary redirects with preserved method, use 307 instead.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-305-use-proxy',
    keywords: ['deprecated', 'proxy redirect', 'use proxy'],
  },
  {
    code: 306,
    name: '(Unused)',
    category: 'redirection',
    standard: true,
    summary: 'Reserved but no longer used; originally meant "Switch Proxy" in an early HTTP draft.',
    explanation:
      'Was used in a draft of the HTTP/1.1 specification to mean "Switch Proxy" but was never finalized or adopted. The code is formally reserved by the spec so it cannot be reused for something else, but no server should ever return it.',
    scenarios: [
      'Should never appear in real traffic — its presence usually indicates a bug, a hand-crafted/malformed response, or test/fuzzing tooling.',
    ],
    causes: {
      client: [],
      server: ['A misbehaving or buggy server implementation incorrectly returns this reserved code.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not actionable — report this to the site operator, since a legitimate server should never send it.'],
      developer: [
        'If your application ever emits 306, it is almost certainly a bug — audit your status code logic and replace it with the correct 3xx/4xx/5xx code.',
      ],
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Not a defined, actionable response — treat any occurrence as a server bug rather than something to retry.',
    cacheable: 'no',
    cacheNote: 'Not applicable — this code is reserved and unused.',
    related: [],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-306-unused',
    keywords: ['reserved', 'unused', 'switch proxy'],
  },
  {
    code: 307,
    name: 'Temporary Redirect',
    category: 'redirection',
    standard: true,
    summary: 'The resource is temporarily at a different URL, and the request method and body must be repeated exactly as sent.',
    explanation:
      'Functionally like 302, but unambiguous: unlike 302, clients must NOT change the request method (or drop the body) when following a 307. This makes it the correct choice for temporary redirects on POST/PUT/PATCH/DELETE requests where changing the method to GET would be wrong.',
    scenarios: [
      'Temporarily redirecting an API POST endpoint to a different backend during a migration, while preserving the request body.',
      'Load-balancing or failover logic that redirects a write request to another regional endpoint.',
      'A/B testing infrastructure that redirects non-GET requests without altering their semantics.',
    ],
    causes: {
      client: [],
      server: ['Application issues a temporary redirect where method/body preservation is required.'],
      intermediary: ['A load balancer or edge routing rule temporarily reroutes non-GET traffic.'],
    },
    fixes: {
      user: ['Not an error — handled automatically by compliant HTTP clients.'],
      developer: [
        'Use 307 instead of 302 whenever the redirected request is not a GET and the method/body must be preserved.',
        'Verify your HTTP client library actually respects 307 semantics — some older or non-compliant clients still convert to GET incorrectly.',
      ],
    },
    snippets: {
      express: `app.post('/api/v1/submit', (req, res) => {
  res.redirect(307, '/api/v2/submit'); // method and body preserved
});`,
    },
    headers: [
      { name: 'Location', note: 'The temporary URL to repeat the exact request against.' },
    ],
    retrySafe: 'conditional',
    retryNote: 'Safe to retry only if the original request itself was idempotent/safe to repeat — 307 does not change the underlying method\'s retry safety.',
    cacheable: 'conditional',
    cacheNote: 'Not cached by default unless explicit freshness headers are present.',
    related: [
      { code: 302, note: '302 permits clients to change the method to GET; 307 explicitly forbids that.' },
      { code: 308, note: '308 is the permanent equivalent of 307 with the same strict method preservation.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-307-temporary-redirect',
    keywords: ['temporary redirect', 'method preserving redirect', '307'],
  },
  {
    code: 308,
    name: 'Permanent Redirect',
    category: 'redirection',
    standard: true,
    summary: 'The resource has permanently moved, and the request method and body must be repeated exactly as sent.',
    explanation:
      'The strict, unambiguous version of 301: the resource has permanently moved to the URL in the Location header, and unlike 301, clients must not change the request method when following the redirect. This is the correct choice for permanently redirecting non-GET API endpoints (e.g. during an API version migration) without silently turning POSTs into GETs.',
    scenarios: [
      'Permanently redirecting an old API endpoint version to a new one while preserving POST/PUT bodies and methods.',
      'A domain or path migration where write endpoints (not just pages) need to keep working seamlessly.',
      'Enforcing HTTPS or canonical hostnames for API traffic without breaking non-GET requests.',
    ],
    causes: {
      client: [],
      server: ['Server configured a permanent, method-preserving redirect rule.'],
      intermediary: ['A CDN, API gateway, or load balancer applies the redirect rule.'],
    },
    fixes: {
      user: ['Not an error — handled automatically by compliant HTTP clients.'],
      developer: [
        'Use 308 instead of 301 for any redirect where preserving the original method (POST/PUT/PATCH/DELETE) and body matters.',
        'Update clients/documentation to point at the new URL directly rather than depending on the redirect long-term.',
        'Confirm your HTTP client, SDKs, and any intermediate proxies correctly support 308 — a small number of very old clients do not.',
      ],
    },
    snippets: {
      nginx: `location /api/v1/ {
    return 308 /api/v2/$1;
}`,
      apache: `RewriteEngine On
RewriteRule ^api/v1/(.*)$ /api/v2/$1 [R=308,L]`,
      express: `app.all('/api/v1/*', (req, res) => {
  const newPath = req.originalUrl.replace('/api/v1', '/api/v2');
  res.redirect(308, newPath);
});`,
    },
    headers: [
      { name: 'Location', note: 'The new permanent URL for the resource.' },
    ],
    retrySafe: 'conditional',
    retryNote: 'Retry safety matches the original request method\'s own idempotency — the redirect itself does not add risk since the method is preserved exactly.',
    cacheable: 'yes',
    cacheNote: 'Cacheable and typically cached long-term, similar to 301.',
    related: [
      { code: 301, note: '301 permits clients to change the method to GET; 308 explicitly forbids that.' },
      { code: 307, note: '307 is the temporary equivalent of 308 with the same strict method preservation.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-308-permanent-redirect',
    keywords: ['permanent redirect', 'method preserving redirect', '308'],
  },
];
