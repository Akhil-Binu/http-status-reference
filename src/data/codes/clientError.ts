import type { StatusCode } from '../types';

export const clientError: StatusCode[] = [
  {
    code: 400,
    name: 'Bad Request',
    category: 'client-error',
    standard: true,
    summary: 'The server could not understand the request due to malformed syntax or invalid data.',
    explanation:
      'A generic catch-all meaning the server considers the request itself invalid — before it even got to business logic. This can be malformed JSON, a missing required field, an invalid query parameter, an oversized header, or any input that fails validation. Unlike 422, which is specifically about semantically invalid data in an otherwise well-formed request, 400 often covers structural/syntactic problems too.',
    scenarios: [
      'Submitting a form or API request with malformed JSON (a trailing comma, unescaped quote, etc.).',
      'Calling an API with a required query parameter missing or in the wrong type (e.g. "id=abc" where a number is expected).',
      'A mobile app sending a request built against an old API contract that no longer matches the server\'s expected shape.',
      'Uploading a file that exceeds a field-level size limit checked before full processing.',
      'A URL containing invalid characters or an overly long query string.',
    ],
    causes: {
      client: [
        'Malformed request body (invalid JSON/XML syntax).',
        'Missing required fields or parameters.',
        'Wrong data types (string where a number is expected, etc.).',
        'Invalid or malformed URL encoding.',
      ],
      server: [
        'Overly strict or buggy request validation logic rejecting legitimate input.',
        'Outdated API documentation causing clients to send an incorrect shape.',
      ],
      intermediary: [
        'A proxy or WAF rewriting/truncating the request body or headers before it reaches the origin.',
      ],
    },
    fixes: {
      user: [
        'Refresh the page and try the action again in case of a one-off glitch.',
        'Double-check any form fields for obviously invalid input (special characters, wrong format like an email without an @).',
        'Clear cookies/cache and retry, in case stale client-side state is sending an outdated request.',
        'If using an API/integration, confirm you are following the current documentation, not a cached or old version.',
      ],
      developer: [
        'Check server logs for the specific validation error — most frameworks log why a 400 was triggered.',
        'Return a descriptive error body (not just the status code) explaining exactly which field/value failed validation.',
        'Validate and log the raw request body during debugging to see exactly what the client sent.',
        'Confirm Content-Type header matches the actual body format (e.g. not sending form-encoded data with a JSON Content-Type).',
        'Check any WAF/proxy rules that might be mangling the request before it reaches your application.',
      ],
    },
    snippets: {
      express: `app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  next(err);
});

app.post('/users', (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({ error: 'email is required' });
  }
  // ...
});`,
      nginx: `# Reject requests with excessively large headers before they reach the app
large_client_header_buffers 4 8k;`,
    },
    headers: [
      { name: 'Content-Type', note: 'Verify it matches the actual body format being sent.' },
    ],
    retrySafe: 'no',
    retryNote: 'Retrying the identical request will fail identically — fix the request content first.',
    cacheable: 'conditional',
    cacheNote: 'Cacheable only if explicit freshness headers are present; rarely useful to cache since it depends on request content.',
    related: [
      { code: 422, note: '422 Unprocessable Content is for well-formed requests with semantically invalid data; 400 often covers structurally invalid requests.' },
      { code: 401, note: 'Use 401 instead when the real issue is missing/invalid authentication, not the request shape.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request',
    keywords: ['malformed request', 'invalid json', 'bad syntax', 'validation error'],
  },
  {
    code: 401,
    name: 'Unauthorized',
    category: 'client-error',
    standard: true,
    summary: 'Authentication is required, and either none was provided or what was provided is invalid.',
    explanation:
      'Despite the name, this is about authentication, not authorization — it means "I don\'t know who you are" (or your credentials are wrong/expired), not "I know who you are but you\'re not allowed." A compliant 401 response must include a WWW-Authenticate header describing how to authenticate. Contrast with 403, which means the server does know who you are and is refusing anyway.',
    scenarios: [
      'Accessing an API without an Authorization header, or with an expired/invalid bearer token or API key.',
      'A session cookie expiring while a user is mid-session, so the next request is treated as anonymous.',
      'Basic Auth-protected staging/internal tools rejecting the wrong username/password.',
      'An OAuth access token expiring and the client not yet having refreshed it.',
      'Calling a protected endpoint directly (e.g. via curl or Postman) without including the required credentials.',
    ],
    causes: {
      client: [
        'Missing Authorization header entirely.',
        'Expired, malformed, or revoked token/API key.',
        'Incorrect credentials (wrong username/password, wrong API key for the environment).',
      ],
      server: [
        'Token validation logic rejecting a token it should accept (clock skew, wrong signing key, misconfigured issuer).',
        'Session store misconfiguration causing valid sessions to appear invalid.',
      ],
      intermediary: [
        'An API gateway or auth proxy stripping the Authorization header before forwarding upstream.',
      ],
    },
    fixes: {
      user: [
        'Log out and log back in to obtain a fresh session/token.',
        'Double-check API keys/tokens for typos, extra whitespace, or accidental truncation when copy-pasting.',
        'Confirm you are using credentials for the correct environment (e.g. not a staging key against production).',
        'Check whether your token/session has simply expired and needs to be refreshed.',
      ],
      developer: [
        'Confirm the WWW-Authenticate header is present and correctly describes the expected auth scheme.',
        'Check token expiry/clock-skew handling — a common cause is server and token-issuer clocks drifting apart.',
        'Verify any reverse proxy or gateway in front of the app is not stripping the Authorization header.',
        'Log authentication failures with the specific reason (expired vs. invalid signature vs. missing) to speed up debugging.',
        'Ensure refresh-token flows are implemented client-side so expired access tokens are renewed transparently.',
      ],
    },
    snippets: {
      express: `const jwt = require('jsonwebtoken');
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.set('WWW-Authenticate', 'Bearer realm="api"');
    return res.status(401).json({ error: 'Missing bearer token' });
  }
  try {
    req.user = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.set('WWW-Authenticate', 'Bearer realm="api", error="invalid_token"');
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}`,
      nginx: `location /internal/ {
    auth_basic "Restricted area";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://backend;
}`,
      apache: `<Location "/internal">
    AuthType Basic
    AuthName "Restricted area"
    AuthUserFile /etc/apache2/.htpasswd
    Require valid-user
</Location>`,
    },
    headers: [
      { name: 'WWW-Authenticate', note: 'Required on 401 responses — describes the auth scheme and realm the client should use.' },
      { name: 'Authorization', note: 'The request header the client must supply with valid credentials.' },
    ],
    retrySafe: 'conditional',
    retryNote: 'Retrying with the same (invalid) credentials will fail again; retry only after refreshing/correcting credentials.',
    cacheable: 'no',
    cacheNote: 'Not cacheable by shared caches by default, to avoid leaking auth-gated content.',
    related: [
      { code: 403, note: '403 Forbidden means the server knows who you are and denies access anyway; 401 means it doesn\'t know (or doesn\'t accept) who you are yet.' },
      { code: 407, note: '407 Proxy Authentication Required is the equivalent for authenticating to an intermediate proxy rather than the origin server.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-401-unauthorized',
    keywords: ['login required', 'invalid token', 'expired session', 'auth failed', 'unauthenticated', 'login keeps failing'],
  },
  {
    code: 402,
    name: 'Payment Required',
    category: 'client-error',
    standard: true,
    summary: 'Reserved for future use; in practice, widely repurposed by APIs to indicate billing or payment issues.',
    explanation:
      'Originally reserved in the HTTP spec for future digital-payment schemes that never fully materialized, 402 has been informally adopted by many modern APIs (payment processors, SaaS platforms, some crypto/Web3 APIs) to mean "this action requires payment," such as a depleted quota, an expired subscription, or a declined charge.',
    scenarios: [
      'An API rejecting a request because the account\'s free-tier quota or trial has expired.',
      'A SaaS product blocking access because the subscription payment failed.',
      'A pay-per-call API rejecting a request due to insufficient account balance.',
      'A content paywall API used by some publishers to gate premium articles.',
    ],
    causes: {
      client: ['Account or subscription in a state that requires payment before the request can proceed.'],
      server: ['Application-level billing logic returns this to signal a payment-related block.'],
      intermediary: [],
    },
    fixes: {
      user: [
        'Check your account\'s billing/subscription status and update payment details if a charge failed.',
        'Verify you have not exceeded a plan\'s usage quota or trial period.',
      ],
      developer: [
        'Since 402 is non-standard in practice, include a clear error body explaining exactly what payment action is needed and a link to resolve it.',
        'Consider whether 403 Forbidden (with a body explaining the billing reason) might be more broadly understood by generic HTTP clients that don\'t special-case 402.',
      ],
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying will keep failing until the underlying billing/subscription issue is resolved.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects current account/billing state, which can change at any time.',
    related: [
      { code: 403, note: '403 Forbidden is the more universally supported fallback some APIs use instead for billing-related denials.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-402-payment-required',
    keywords: ['billing', 'payment failed', 'quota exceeded', 'subscription expired'],
  },
  {
    code: 403,
    name: 'Forbidden',
    category: 'client-error',
    standard: true,
    summary: 'The server understood the request and knows who you are, but refuses to authorize it.',
    explanation:
      'Unlike 401, authenticating again will not help — the server has identified the requester (or does not need to) and has simply decided the action is not permitted. This can be a permissions/role check, an IP allowlist, a WAF rule, or a deliberately hidden resource. Some servers intentionally return 403 instead of 404 to avoid confirming a resource exists.',
    scenarios: [
      'A logged-in user without admin rights trying to access an admin-only page or API endpoint.',
      'A WAF (Web Application Firewall) blocking a request that matches a suspicious pattern (e.g. SQL injection-like query strings).',
      'An IP-restricted internal tool being accessed from outside the allowed IP range.',
      'A CDN or storage bucket (e.g. S3) denying access due to a restrictive bucket/object policy.',
      'A CSRF token missing or mismatched on a state-changing request.',
    ],
    causes: {
      client: [
        'User account lacks the required role/permission for the resource.',
        'Missing or invalid CSRF token on a form submission.',
      ],
      server: [
        'Authorization/role-check logic denies the request.',
        'Overly broad file/directory permission rules block legitimate access.',
      ],
      intermediary: [
        'A WAF, CDN, or firewall rule blocks the request based on IP, geography, user agent, or payload pattern.',
      ],
    },
    fixes: {
      user: [
        'Confirm you are logged in with an account that actually has permission for this resource.',
        'If accessing from a VPN or unusual network, try your normal network in case of IP-based blocking.',
        'Clear cookies and log in again in case of a stale/invalid session token being sent as if valid.',
        'Contact the site/service if you believe you should have access — a permissions grant may be needed.',
      ],
      developer: [
        'Check server/WAF logs for the specific rule or authorization check that triggered the block.',
        'Review role/permission logic for the affected route — confirm the user\'s role actually should be denied here.',
        'Verify file and directory permissions (Unix file modes, cloud storage bucket policies) are not overly restrictive.',
        'Check CSRF token handling if the request is a state-changing form submission.',
        'If deliberately hiding resource existence, consider whether 404 is more appropriate than 403 for your threat model.',
      ],
    },
    snippets: {
      nginx: `location /admin/ {
    allow 10.0.0.0/8;
    deny all;
}`,
      apache: `<Directory "/var/www/admin">
    Require ip 10.0.0.0/8
</Directory>`,
      express: `function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
app.get('/admin/reports', requireRole('admin'), handler);`,
    },
    headers: [
      { name: 'Retry-After', note: 'Occasionally used if the forbidden state is temporary (e.g. a rate-limit-adjacent block).' },
    ],
    retrySafe: 'no',
    retryNote: 'Retrying identically will not succeed — the underlying permission or policy must change first.',
    cacheable: 'yes',
    cacheNote: 'Cacheable in principle, though caching authorization-denial responses can be risky if permissions change frequently.',
    related: [
      { code: 401, note: '401 means the server doesn\'t know who you are yet; 403 means it does and still says no.' },
      { code: 404, note: 'Some servers deliberately return 404 instead of 403 to avoid revealing that a restricted resource exists.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-403-forbidden',
    keywords: ['access denied', 'permission denied', 'waf block', 'not allowed'],
  },
  {
    code: 404,
    name: 'Not Found',
    category: 'client-error',
    standard: true,
    summary: 'The server can\'t find the requested resource — the URL doesn\'t exist (or the server won\'t say why).',
    explanation:
      'The most well-known status code. It means the server has no known resource at this URL and, unlike 410, gives no indication of whether that is permanent. It intentionally does not distinguish "never existed," "was deleted," and "you\'re not allowed to know it exists" — some servers use 404 deliberately in place of 403 for the latter case.',
    scenarios: [
      'Following a broken or outdated link (a typo in the URL, or a page that was moved without a redirect).',
      'An API call to an endpoint or resource ID that does not exist (e.g. GET /users/99999 for a deleted or never-existing user).',
      'A single-page app\'s client-side router serving a 404 from the server for a route it handles only in JavaScript (missing SPA fallback config).',
      'A typo in an API base URL or path segment.',
      'A resource that was deleted and never had a redirect set up.',
    ],
    causes: {
      client: [
        'Typo in the URL or an outdated bookmark/link.',
        'Requesting a resource ID that never existed or was deleted.',
      ],
      server: [
        'Route not defined in the application/router.',
        'Static file genuinely missing from the deployed build.',
        'SPA server not configured to fall back to index.html for client-side routes.',
      ],
      intermediary: [
        'A CDN serving a stale/incorrect cached 404 for a URL that now exists.',
        'A reverse proxy misrouting the request to the wrong backend/service.',
      ],
    },
    fixes: {
      user: [
        'Double-check the URL for typos.',
        'Use the site\'s search or navigation instead of an old/bookmarked link.',
        'Try the site\'s homepage and navigate from there in case the page was moved.',
        'If you followed a link from another site, the target may have been removed — check if there\'s an archived or updated version.',
      ],
      developer: [
        'Check application routing to confirm the path is actually registered.',
        'For SPAs, configure the server/CDN to fall back to index.html for unknown paths so client-side routing can take over.',
        'Check CDN cache — purge any stale cached 404 for a path that should now resolve.',
        'Add a custom, helpful 404 page with search/navigation instead of a bare error.',
        'Consider redirecting commonly mistyped or removed URLs (301) instead of leaving a dead 404.',
      ],
    },
    snippets: {
      nginx: `# SPA fallback: serve index.html for unmatched routes
location / {
    try_files $uri $uri/ /index.html;
}
# Custom 404 page
error_page 404 /404.html;`,
      apache: `# .htaccess SPA fallback
FallbackResource /index.html
ErrorDocument 404 /404.html`,
      express: `app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});`,
    },
    headers: [],
    retrySafe: 'yes',
    retryNote: 'Retrying an unchanged URL will keep returning 404; safe to retry (idempotent) but pointless unless the resource is later created or the URL corrected.',
    cacheable: 'yes',
    cacheNote: 'Cacheable by default; be careful with CDN TTLs on 404s for URLs that may become valid later, as stale caching can hide a fixed resource.',
    related: [
      { code: 410, note: '410 Gone is a more specific, deliberate statement that a resource used to exist and was intentionally removed permanently.' },
      { code: 403, note: '403 is used instead of 404 by some servers to explicitly signal access is denied rather than hiding resource existence.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found',
    keywords: ['page not found', 'broken link', 'missing resource', 'my api returns nothing', '404 error'],
  },
  {
    code: 405,
    name: 'Method Not Allowed',
    category: 'client-error',
    standard: true,
    summary: 'The resource exists, but doesn\'t support the HTTP method you used to request it.',
    explanation:
      'The URL is valid and the resource is real, but the specific HTTP method (GET, POST, DELETE, etc.) used isn\'t supported for it — e.g. sending a DELETE to a read-only endpoint. A compliant response must include an Allow header listing the methods that are actually supported.',
    scenarios: [
      'Sending a POST to an endpoint that only supports GET (or vice versa).',
      'Calling DELETE on a resource that\'s intentionally read-only via the API.',
      'A REST client using the wrong HTTP verb due to outdated documentation or a copy-paste mistake.',
      'CORS preflight (OPTIONS) requests hitting a route that doesn\'t explicitly handle OPTIONS.',
    ],
    causes: {
      client: ['Wrong HTTP method used for the target endpoint.'],
      server: [
        'Route registered for only specific methods, and the request used one that isn\'t among them.',
        'Missing OPTIONS handler for CORS-enabled routes.',
      ],
      intermediary: ['A reverse proxy or API gateway restricts allowed methods for a given path.'],
    },
    fixes: {
      user: ['Not typically end-user actionable — this is usually a client/integration bug; report it if seen in a product UI.'],
      developer: [
        'Check the Allow header in the response — it lists exactly which methods are supported.',
        'Verify your router/framework registers the endpoint for the method you intend to use.',
        'For CORS-enabled APIs, ensure OPTIONS preflight requests are handled (many frameworks do this automatically).',
        'Check any reverse proxy/gateway method restrictions that might be blocking a method your app actually supports.',
      ],
    },
    snippets: {
      nginx: `location /api/readonly/ {
    limit_except GET {
        deny all;
    }
}`,
      apache: `<Location "/api/readonly">
    <LimitExcept GET>
        Require all denied
    </LimitExcept>
</Location>`,
      express: `app.route('/items/:id')
  .get(getItem)
  .put(updateItem);
// DELETE /items/:id automatically falls through to Express's default 404,
// but to return a proper 405 with an Allow header:
app.all('/items/:id', (req, res) => {
  res.set('Allow', 'GET, PUT').status(405).json({ error: 'Method not allowed' });
});`,
    },
    headers: [
      { name: 'Allow', note: 'Required on 405 responses — lists the HTTP methods actually supported for this resource.' },
    ],
    retrySafe: 'yes',
    retryNote: 'Retrying with the same method will keep failing; retry with a method listed in the Allow header.',
    cacheable: 'yes',
    cacheNote: 'Cacheable by default unless headers say otherwise.',
    related: [
      { code: 404, note: '404 means the resource itself doesn\'t exist; 405 means it exists but rejects this particular method.' },
      { code: 501, note: '501 Not Implemented is used when the server doesn\'t support the method at all, anywhere, rather than just for this resource.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-405-method-not-allowed',
    keywords: ['wrong http method', 'verb not allowed', 'allow header'],
  },
  {
    code: 406,
    name: 'Not Acceptable',
    category: 'client-error',
    standard: true,
    summary: 'The server can\'t produce a response matching the content types the client says it will accept.',
    explanation:
      'Triggered by content negotiation: the client\'s Accept, Accept-Language, or Accept-Encoding headers specify formats/languages the server is unable to satisfy for this resource. It is relatively rare because most servers fall back to a default representation rather than strictly rejecting the request.',
    scenarios: [
      'An API client requesting `Accept: application/xml` from an API that only produces JSON.',
      'A strict content-negotiation server rejecting a request for an unsupported language via Accept-Language.',
      'A misconfigured client library sending an overly restrictive or incorrect Accept header.',
    ],
    causes: {
      client: ['Accept/Accept-Language/Accept-Encoding header specifies formats the server does not support.'],
      server: ['Server implements strict content negotiation instead of falling back to a default representation.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not typically end-user actionable — usually an integration/client configuration issue.'],
      developer: [
        'Check exactly what Accept header the failing client is sending, and compare with what your API actually produces.',
        'Consider relaxing strict content negotiation to fall back to a sensible default (e.g. JSON) instead of returning 406.',
        'Document supported content types clearly in your API reference.',
      ],
    },
    headers: [
      { name: 'Accept', note: 'The request header whose requirements the server could not satisfy.' },
    ],
    retrySafe: 'yes',
    retryNote: 'Retry with a corrected Accept header matching a representation the server actually supports.',
    cacheable: 'yes',
    cacheNote: 'Cacheable by default unless headers say otherwise, though caching is rarely useful for this response.',
    related: [
      { code: 415, note: '415 Unsupported Media Type is about the format of the request body the client sent; 406 is about the format the client is willing to accept back.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-406-not-acceptable',
    keywords: ['content negotiation', 'accept header', 'unsupported format'],
  },
  {
    code: 407,
    name: 'Proxy Authentication Required',
    category: 'client-error',
    standard: true,
    summary: 'You must authenticate with the intermediate proxy before the request can proceed.',
    explanation:
      'Like 401, but for a proxy server sitting between the client and the origin rather than the origin itself. Common in corporate networks where outbound traffic must pass through an authenticated forward proxy.',
    scenarios: [
      'A corporate network requiring proxy credentials before allowing internet access.',
      'A command-line tool (curl, git, npm) failing to reach the internet because it isn\'t configured with proxy credentials.',
      'A CI/CD runner behind a corporate proxy that needs explicit proxy auth configuration.',
    ],
    causes: {
      client: ['Client not configured with the required proxy credentials.'],
      server: [],
      intermediary: ['The forward proxy itself requires and did not receive valid authentication.'],
    },
    fixes: {
      user: [
        'Configure your system or application\'s proxy settings with the correct username/password.',
        'Check with your IT department for the correct proxy address and credentials.',
      ],
      developer: [
        'For CLI tools, set the HTTP_PROXY/HTTPS_PROXY environment variables including credentials (e.g. http://user:pass@proxy:port).',
        'Confirm the Proxy-Authenticate header to see what auth scheme the proxy expects.',
      ],
    },
    snippets: {
      express: `// Configuring an outbound proxy with auth for a Node.js client
process.env.HTTPS_PROXY = 'http://username:password@proxy.company.com:8080';`,
    },
    headers: [
      { name: 'Proxy-Authenticate', note: 'Required on the response — describes how to authenticate to the proxy.' },
      { name: 'Proxy-Authorization', note: 'The request header the client must supply with proxy credentials.' },
    ],
    retrySafe: 'conditional',
    retryNote: 'Retry after supplying valid proxy credentials; retrying unchanged will fail again.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — tied to a specific unauthenticated proxy session.',
    related: [
      { code: 401, note: '401 is authentication required by the origin server; 407 is authentication required by an intermediate proxy.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-407-proxy-authentication-re',
    keywords: ['proxy auth', 'corporate proxy', 'proxy credentials'],
  },
  {
    code: 408,
    name: 'Request Timeout',
    category: 'client-error',
    standard: true,
    summary: 'The server timed out waiting for the client to finish sending the request.',
    explanation:
      'The server gave up waiting for the client to send a complete request within its configured timeout. This can happen with slow or unstable client connections, or a client that opened a connection but never (or very slowly) sent data — sometimes deliberately, as in a Slowloris-style attack.',
    scenarios: [
      'A very slow or unstable mobile/network connection failing to complete uploading a request in time.',
      'A client opening a keep-alive connection and going idle longer than the server\'s timeout allows.',
      'Debugging tools or manual testing (e.g. a paused breakpoint mid-request in a proxy tool) exceeding the timeout.',
      'Legitimate large uploads exceeding a too-strict server timeout setting.',
    ],
    causes: {
      client: ['Slow, unstable, or interrupted network connection.'],
      server: ['Request timeout configured too aggressively for legitimate slow clients/uploads.'],
      intermediary: ['A load balancer or reverse proxy enforcing its own (possibly shorter) timeout.'],
    },
    fixes: {
      user: [
        'Check your internet connection and retry.',
        'For large uploads, try a more stable connection (e.g. wired instead of Wi-Fi) or a smaller file.',
      ],
      developer: [
        'Review and, if appropriate, increase server/proxy timeout settings for endpoints that legitimately need more time (large uploads).',
        'Ensure client and server timeout values are aligned across the whole request path (app server, reverse proxy, load balancer).',
        'Add client-side retry logic with backoff for transient timeouts.',
      ],
    },
    snippets: {
      nginx: `client_body_timeout 60s;
client_header_timeout 60s;`,
      apache: `TimeOut 60`,
      express: `const server = app.listen(3000);
server.requestTimeout = 60000; // 60s, Node.js 14+`,
    },
    headers: [
      { name: 'Connection', note: 'Servers often include "Connection: close" alongside 408 to signal the connection is being closed.' },
    ],
    retrySafe: 'yes',
    retryNote: 'Safe to retry — this is a transport-level timeout, not a rejection of the request content.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a transient network/timing condition.',
    related: [
      { code: 504, note: '504 Gateway Timeout is the server-side equivalent: the server timed out waiting on an upstream, rather than on the client.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-408-request-timeout',
    keywords: ['timeout', 'slow connection', 'request timed out'],
  },
  {
    code: 409,
    name: 'Conflict',
    category: 'client-error',
    standard: true,
    summary: 'The request conflicts with the current state of the resource on the server.',
    explanation:
      'The request is well-formed and understood, but cannot be completed because it clashes with the resource\'s current state — for example, trying to create a resource that already exists (a duplicate), or updating a record that has changed since the client last read it (a version conflict).',
    scenarios: [
      'Trying to register a username or email that\'s already taken.',
      'Two users editing the same document simultaneously and the second save conflicting with the first (optimistic concurrency control).',
      'Attempting to create a resource with a unique key that already exists in the database.',
      'Trying to delete a resource that other records still depend on (a foreign-key-style conflict).',
    ],
    causes: {
      client: [
        'Submitting data that duplicates an existing unique resource.',
        'Acting on stale data (e.g. an outdated ETag/version) that has since changed on the server.',
      ],
      server: ['Application enforces uniqueness or state-transition constraints that this request violates.'],
      intermediary: [],
    },
    fixes: {
      user: [
        'If registering an account, try a different username/email, or use "forgot password" if the account may already be yours.',
        'Refresh the page to get the latest version of the data, then reapply your changes.',
      ],
      developer: [
        'Return a response body describing exactly what conflicted (e.g. which field or constraint) so clients can react appropriately.',
        'For concurrent-edit scenarios, implement optimistic concurrency control using ETag/If-Match so conflicting writes are detected and reported clearly.',
        'Consider whether the operation should instead be idempotent (e.g. upsert) if duplicate submissions are expected and harmless.',
      ],
    },
    snippets: {
      express: `app.post('/users', async (req, res) => {
  const existing = await db.users.findOne({ email: req.body.email });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  // ...
});`,
    },
    headers: [
      { name: 'ETag', note: 'Used with If-Match on updates to detect and reject conflicting concurrent edits.' },
    ],
    retrySafe: 'no',
    retryNote: 'Retrying the identical request will conflict again; resolve the underlying state conflict first (e.g. fetch fresh data, choose a different identifier).',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects a point-in-time state conflict that may not recur.',
    related: [
      { code: 422, note: '422 is for semantically invalid data; 409 is specifically about conflicting with existing resource state.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict',
    keywords: ['duplicate resource', 'version conflict', 'concurrent edit', 'already exists'],
  },
  {
    code: 410,
    name: 'Gone',
    category: 'client-error',
    standard: true,
    summary: 'The resource used to exist here but has been permanently and deliberately removed.',
    explanation:
      'Unlike 404, which is agnostic about whether a resource ever existed or might come back, 410 is a deliberate, permanent statement: this resource existed, and the server operator knows it is gone for good and does not intend to provide a redirect. Search engines treat 410 as a stronger signal than 404 to deindex a page promptly.',
    scenarios: [
      'An old API version being formally decommissioned after a sunset period.',
      'A product page for a discontinued item that will never return.',
      'A user deleting their account or content, with the platform explicitly signaling permanent removal.',
      'A blog post the author intentionally and permanently retracted.',
    ],
    causes: {
      client: [],
      server: ['Resource was deliberately and permanently deleted, and the server is configured to say so explicitly.'],
      intermediary: [],
    },
    fixes: {
      user: [
        'The resource is not coming back — check for an announcement about where equivalent content might now live, or search for an alternative.',
      ],
      developer: [
        'Use 410 (not 404) when you want to explicitly and permanently confirm removal, e.g. for SEO deindexing or API sunset communication.',
        'Keep 410 responses in place for a meaningful period (search engines and API consumers need time to notice and react) rather than immediately reverting to a generic 404.',
        'Include a body explaining what happened and where users might find related content.',
      ],
    },
    snippets: {
      nginx: `location = /old-product {
    return 410;
}`,
      express: `app.get('/api/v1/*', (req, res) => {
  res.status(410).json({ error: 'This API version was retired on 2025-01-01.' });
});`,
    },
    headers: [],
    retrySafe: 'yes',
    retryNote: 'Idempotent and safe to retry, but pointless — the resource is permanently gone by definition.',
    cacheable: 'yes',
    cacheNote: 'Cacheable and generally intended to be cached/remembered, reinforcing the permanence signal.',
    related: [
      { code: 404, note: '404 is ambiguous about permanence; 410 is a deliberate, stronger statement that removal is final.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-410-gone',
    keywords: ['permanently removed', 'deprecated endpoint', 'deleted resource', 'sunset api'],
  },
  {
    code: 411,
    name: 'Length Required',
    category: 'client-error',
    standard: true,
    summary: 'The server requires a Content-Length header, which the client did not provide.',
    explanation:
      'Some servers refuse to accept a request body unless the client explicitly declares its length via the Content-Length header, rather than relying solely on chunked transfer encoding, to simplify buffering, security checks, or streaming logic.',
    scenarios: [
      'A low-level HTTP client or custom script manually crafting a request without setting Content-Length.',
      'A misconfigured proxy stripping the Content-Length header before forwarding.',
      'An older or minimal HTTP client library that doesn\'t automatically compute and send Content-Length.',
    ],
    causes: {
      client: ['Request sent without a Content-Length header and without valid chunked encoding.'],
      server: ['Server explicitly requires Content-Length for this endpoint/method.'],
      intermediary: ['A proxy strips or fails to forward the Content-Length header.'],
    },
    fixes: {
      user: ['Not typically end-user actionable — this is a low-level client/integration issue.'],
      developer: [
        'Ensure your HTTP client library computes and sends Content-Length automatically (most modern libraries do this by default).',
        'If hand-crafting raw HTTP requests, always include Content-Length or use valid chunked Transfer-Encoding.',
        'Check intermediate proxies aren\'t stripping this header.',
      ],
    },
    headers: [
      { name: 'Content-Length', note: 'The header the client must supply for the request to be accepted.' },
    ],
    retrySafe: 'yes',
    retryNote: 'Retry after adding a correct Content-Length header to the request.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a request-formation error rather than a content response.',
    related: [
      { code: 400, note: '400 Bad Request is the more general malformed-request code; 411 is specific to a missing Content-Length.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-411-length-required',
    keywords: ['content-length', 'missing header', 'chunked encoding'],
  },
  {
    code: 412,
    name: 'Precondition Failed',
    category: 'client-error',
    standard: true,
    summary: 'A condition set in the request headers (like If-Match) was not met, so the request was rejected.',
    explanation:
      'The client attached a conditional header — If-Match, If-Unmodified-Since, If-None-Match — asserting an expectation about the resource\'s current state, and that expectation turned out to be false. This is the standard mechanism for optimistic concurrency control: "only update this if it still has the version I last saw."',
    scenarios: [
      'Updating a resource with If-Match set to an ETag that no longer matches because someone else updated it first.',
      'A "safe save" feature in a document editor that refuses to overwrite changes made by another user since the document was loaded.',
      'An API client using conditional requests to avoid accidentally clobbering concurrent changes.',
    ],
    causes: {
      client: ['Conditional header (If-Match/If-Unmodified-Since) references a stale version of the resource.'],
      server: ['Server correctly enforces the conditional check and finds the current state doesn\'t match.'],
      intermediary: [],
    },
    fixes: {
      user: [
        'Refresh to load the current version of the resource, then reapply and resubmit your changes.',
      ],
      developer: [
        'Return the current ETag/Last-Modified in the 412 response (or a follow-up GET) so the client can re-sync before retrying.',
        'Use this pattern deliberately for any endpoint where concurrent edits must be detected rather than silently overwritten.',
      ],
    },
    snippets: {
      express: `app.put('/docs/:id', async (req, res) => {
  const doc = await db.docs.findById(req.params.id);
  const currentEtag = etag(JSON.stringify(doc));
  if (req.headers['if-match'] !== currentEtag) {
    return res.status(412).json({ error: 'Document has changed since you loaded it' });
  }
  // proceed with update
});`,
    },
    headers: [
      { name: 'If-Match', note: 'The conditional request header whose requirement was not satisfied.' },
      { name: 'ETag', note: 'Servers should surface the current ETag so the client can re-sync.' },
    ],
    retrySafe: 'no',
    retryNote: 'Retrying unchanged will fail again; the client must fetch the current state and retry with an updated precondition.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects a specific, transient version mismatch.',
    related: [
      { code: 409, note: '409 Conflict is a broader statement of conflicting state; 412 is specifically about a failed conditional-header check.' },
      { code: 428, note: '428 Precondition Required is the inverse: the server requires a condition that the client failed to supply at all.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-412-precondition-failed',
    keywords: ['optimistic concurrency', 'if-match', 'stale version', 'conditional request'],
  },
  {
    code: 413,
    name: 'Content Too Large',
    category: 'client-error',
    standard: true,
    summary: 'The request body is larger than the server is willing or able to process.',
    explanation:
      'Historically named "Payload Too Large" (still commonly seen). The client\'s request body exceeds a size limit — set for security, memory-protection, or plan-tier reasons — configured somewhere along the request path: the application, a reverse proxy, or a CDN/WAF.',
    scenarios: [
      'Uploading a file or image larger than the server or CDN\'s configured maximum.',
      'Submitting an API request with an unusually large JSON payload (e.g. a huge embedded base64-encoded file).',
      'A form submission exceeding the web server\'s default body-size limit.',
      'Bulk-import endpoints receiving a larger-than-expected dataset in one request.',
    ],
    causes: {
      client: ['File or payload genuinely exceeds the documented/allowed size limit.'],
      server: ['Application or framework body-size limit configured too low for legitimate use cases.'],
      intermediary: ['A reverse proxy, load balancer, or CDN enforces its own (possibly stricter) body-size cap.'],
    },
    fixes: {
      user: [
        'Reduce the file size (compress, resize an image, trim a video) before uploading.',
        'Split a large submission into smaller chunks/batches if the service supports it.',
      ],
      developer: [
        'Check and, if appropriate, raise the body-size limit at every layer: application middleware, reverse proxy, and any CDN/WAF in front.',
        'For large uploads, prefer chunked/multipart or direct-to-storage (e.g. presigned URL) uploads over passing the whole file through your app server.',
        'Return a clear error message stating the actual size limit so clients can adapt.',
      ],
    },
    snippets: {
      nginx: `http {
    client_max_body_size 20M;
}`,
      apache: `LimitRequestBody 20971520`,
      express: `const express = require('express');
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));`,
    },
    headers: [
      { name: 'Content-Length', note: 'What the server compares against its configured maximum body size.' },
      { name: 'Retry-After', note: 'Sometimes included if the limit is temporary (e.g. during high load).' },
    ],
    retrySafe: 'no',
    retryNote: 'Retrying the identical oversized payload will fail again; reduce the payload size first.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a request-formation error, not cacheable content.',
    related: [
      { code: 414, note: '414 URI Too Long is the equivalent limit applied to the request URL rather than the body.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-413-content-too-large',
    keywords: ['payload too large', 'file upload limit', 'body size limit', 'request entity too large'],
  },
  {
    code: 414,
    name: 'URI Too Long',
    category: 'client-error',
    standard: true,
    summary: 'The request URL is longer than the server is willing to interpret.',
    explanation:
      'Every server imposes a maximum URL length for memory-safety and security reasons. This is triggered when a URL — often because of an excessively long query string — exceeds that limit. It can also indicate a client stuck in a redirect loop that keeps appending data to the URL.',
    scenarios: [
      'A GET request with a very long query string (e.g. encoding a large search filter or a whole form as URL parameters).',
      'A client bug causing a redirect loop that keeps appending parameters to the URL each time.',
      'Passing a large object or array as URL-encoded query parameters instead of in a request body.',
      'A malformed or malicious request probing for buffer-overflow-style vulnerabilities.',
    ],
    causes: {
      client: ['URL constructed with an excessively long query string or path.'],
      server: ['URI length limit configured too low for legitimate use cases.'],
      intermediary: ['A proxy or load balancer enforces its own stricter URL length cap.'],
    },
    fixes: {
      user: ['Not typically end-user actionable — this usually indicates a bug in the calling application.'],
      developer: [
        'Move large parameter sets from the query string into a POST request body instead.',
        'Check for redirect loops that might be accumulating query parameters on each hop.',
        'If legitimately needed, raise the URI length limit at the web server/proxy level.',
      ],
    },
    snippets: {
      nginx: `large_client_header_buffers 4 16k;`,
      apache: `LimitRequestLine 16384`,
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying the identical long URL will fail again; shorten the URL or move data into the body first.',
    cacheable: 'yes',
    cacheNote: 'Cacheable by default unless headers say otherwise.',
    related: [
      { code: 413, note: '413 Content Too Large is the equivalent limit for the request body rather than the URL.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-414-uri-too-long',
    keywords: ['long url', 'query string too long', 'uri length limit'],
  },
  {
    code: 415,
    name: 'Unsupported Media Type',
    category: 'client-error',
    standard: true,
    summary: 'The server refuses the request because the body\'s format (Content-Type) isn\'t one it supports.',
    explanation:
      'The request body is encoded in a media type (declared via the Content-Type header) that this endpoint does not know how to process — for example, sending XML to an endpoint that only accepts JSON, or omitting Content-Type entirely against a strict server.',
    scenarios: [
      'Sending `Content-Type: text/plain` or omitting it entirely to a JSON-only API.',
      'Uploading a file in a format the endpoint doesn\'t accept (e.g. a .heic image where only .jpg/.png are supported).',
      'A client library defaulting to the wrong Content-Type for the data being sent.',
      'An outdated integration still sending XML/SOAP to an API that has since moved to JSON-only.',
    ],
    causes: {
      client: ['Content-Type header does not match a format the endpoint accepts, or is missing.'],
      server: ['Endpoint only implements parsing/handling for specific media types.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not typically end-user actionable — usually an integration/client bug; check the API docs for the required Content-Type.'],
      developer: [
        'Set the correct Content-Type header explicitly on the request rather than relying on a client library default.',
        'Document the exact set of accepted media types in your API reference.',
        'Return a clear list of supported types in the error body to speed up client-side debugging.',
      ],
    },
    snippets: {
      express: `app.post('/api/data', (req, res, next) => {
  if (req.headers['content-type'] !== 'application/json') {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }
  next();
}, handler);`,
    },
    headers: [
      { name: 'Content-Type', note: 'The header whose value the server found unsupported.' },
      { name: 'Accept', note: 'Servers may list accepted types via a custom header or in the error body.' },
    ],
    retrySafe: 'no',
    retryNote: 'Retrying with the same Content-Type will fail again; correct the header/body format first.',
    cacheable: 'yes',
    cacheNote: 'Cacheable by default unless headers say otherwise, though rarely useful to cache.',
    related: [
      { code: 406, note: '406 Not Acceptable is about what format the client is willing to receive back; 415 is about the format the client sent.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-415-unsupported-media-type',
    keywords: ['content-type error', 'wrong format', 'unsupported file type'],
  },
  {
    code: 416,
    name: 'Range Not Satisfiable',
    category: 'client-error',
    standard: true,
    summary: 'The client asked for a byte range of a resource that doesn\'t exist or is invalid.',
    explanation:
      'Returned when a Range request header specifies a range that is outside the bounds of the resource — for example, requesting bytes 5000-6000 of a 1000-byte file, or a range with a start greater than the end.',
    scenarios: [
      'A download manager resuming a file transfer with an incorrect or stale byte offset (e.g. the file changed size on the server since the download started).',
      'A video player seeking past the actual duration/size of a partially uploaded or corrupted media file.',
      'A client bug computing an invalid range header.',
    ],
    causes: {
      client: ['Range header specifies a start/end outside the resource\'s actual size.'],
      server: ['Resource size changed since the client last checked, invalidating its previously valid range.'],
      intermediary: [],
    },
    fixes: {
      user: [
        'Restart the download/stream from the beginning rather than resuming, in case the source file changed.',
        'Clear any partially-downloaded file and retry.',
      ],
      developer: [
        'Ensure Content-Range in the 416 response reports the actual resource size (`Content-Range: bytes */<size>`) so clients can recover.',
        'If resources can change size, invalidate cached range offsets/ETags appropriately so stale resume attempts fail fast and clearly.',
      ],
    },
    headers: [
      { name: 'Content-Range', note: 'On a 416 response, reports the actual total size so the client can compute a valid range.' },
    ],
    retrySafe: 'yes',
    retryNote: 'Retry with a corrected range (or no range, for the full resource) based on the actual size reported.',
    cacheable: 'yes',
    cacheNote: 'Cacheable by default unless headers say otherwise.',
    related: [
      { code: 206, note: '206 Partial Content is the success case this code complements — returned when the requested range is valid.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-416-range-not-satisfiable',
    keywords: ['range header', 'invalid byte range', 'resume download'],
  },
  {
    code: 417,
    name: 'Expectation Failed',
    category: 'client-error',
    standard: true,
    summary: 'The server cannot meet the requirement stated in the client\'s Expect header.',
    explanation:
      'Returned when a client sends an Expect header (most commonly "Expect: 100-continue") and the server is unable or unwilling to meet that expectation, so it rejects the request outright rather than proceeding.',
    scenarios: [
      'A client sending "Expect: 100-continue" to a server or intermediary that doesn\'t support the Expect/Continue handshake.',
      'An older or non-compliant proxy in the request path that mishandles the Expect header.',
    ],
    causes: {
      client: ['Client sent an Expect header the server cannot satisfy.'],
      server: ['Server or its HTTP stack doesn\'t support the requested expectation.'],
      intermediary: ['A proxy along the path doesn\'t correctly relay Expect/Continue semantics.'],
    },
    fixes: {
      user: ['Not typically end-user actionable — a low-level client/server compatibility issue.'],
      developer: [
        'If seeing this consistently, try disabling "Expect: 100-continue" in your HTTP client as a workaround (many libraries offer this option).',
        'Verify all intermediary proxies fully support HTTP/1.1 Expect/Continue handling.',
      ],
    },
    headers: [
      { name: 'Expect', note: 'The header whose stated expectation the server could not meet.' },
    ],
    retrySafe: 'yes',
    retryNote: 'Retry without the Expect header, or with a client/proxy configuration that supports it correctly.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a transport-negotiation failure, not content.',
    related: [
      { code: 100, note: '100 Continue is the successful counterpart when the server can meet the Expect requirement.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-417-expectation-failed',
    keywords: ['expect header', '100-continue failure'],
  },
  {
    code: 418,
    name: "I'm a teapot",
    category: 'client-error',
    standard: true,
    summary: 'An April Fools\' joke status from the Hyper Text Coffee Pot Control Protocol — a teapot refusing to brew coffee.',
    explanation:
      'Originally defined in RFC 2324 (1998), an April Fools\' RFC parodying HTTP for coffee pot control, and reaffirmed for historical reasons in RFC 9110. It has no serious, standardized meaning, but has become a popular Easter egg — some frameworks and APIs implement it literally, and it is occasionally repurposed informally to mean "I refuse to process this request, and I\'m telling you so with a wink."',
    scenarios: [
      'Hitting an Easter-egg endpoint some APIs deliberately implement for fun (e.g. Google\'s and GitHub\'s APIs have historically included one).',
      'Encountered in HTTP client libraries\' or frameworks\' test suites/status-code enums.',
      'Occasionally used informally/humorously by a service to reject an obviously absurd request.',
    ],
    causes: {
      client: [],
      server: ['A deliberate, non-serious Easter egg implemented by the API/service.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not an error to fix — it\'s a joke. Enjoy it.'],
      developer: [
        'Do not use 418 for real error conditions in production APIs — it carries no defined operational meaning and can confuse monitoring/alerting.',
        'If you want to implement it as an Easter egg, keep it on an obviously non-critical, well-documented endpoint.',
      ],
    },
    headers: [],
    retrySafe: 'yes',
    retryNote: 'Not a real error state — there is nothing meaningful to retry.',
    cacheable: 'no',
    cacheNote: 'Not meaningfully cacheable.',
    related: [],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-418-unused',
    keywords: ["im a teapot", 'april fools', 'easter egg', 'hyper text coffee pot'],
  },
  {
    code: 419,
    name: 'Page Expired',
    category: 'client-error',
    standard: false,
    summary: 'A non-standard status (popularized by the Laravel PHP framework) meaning your session/CSRF token expired.',
    explanation:
      'Not part of any IETF standard — this is an application-level convention, most famously used by the Laravel framework, to indicate that a form\'s CSRF token has expired (usually because the page was left open too long before submitting), so the request was rejected for security reasons rather than being processed.',
    scenarios: [
      'Leaving a Laravel-powered form open in a browser tab for a long time (past session/CSRF token lifetime) before submitting.',
      'Submitting a form after the underlying session cookie has expired or been invalidated.',
      'A user logging out in another tab, invalidating the session used by a still-open form in the original tab.',
    ],
    causes: {
      client: ['Form/page was open long enough that its CSRF token or session expired before submission.'],
      server: ['Session or CSRF token lifetime configured shorter than realistic user think-time for some flows.'],
      intermediary: [],
    },
    fixes: {
      user: [
        'Refresh the page and resubmit the form — this regenerates a fresh CSRF token/session.',
        'Avoid leaving forms open for very long periods before submitting, especially on sites with short session timeouts.',
      ],
      developer: [
        'Consider extending CSRF token/session lifetime for forms known to involve long user think-time.',
        'Add client-side handling (e.g. a periodic token refresh via AJAX) to avoid users hitting this on long-lived forms.',
        'Since this is Laravel/framework-specific and non-standard, document it clearly for API consumers who may not recognize the code.',
      ],
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying the exact same expired-token request will fail again; the client must obtain a fresh CSRF token/session first.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — tied to a specific expired session/token state.',
    related: [
      { code: 403, note: 'Many frameworks return 403 for an invalid CSRF token instead of the non-standard 419 — the underlying cause is often the same.' },
      { code: 440, note: '440 Login Time-out is Microsoft IIS\'s equivalent non-standard code for session expiry.' },
    ],
    specUrl: 'https://http.dev/419',
    keywords: ['csrf token expired', 'laravel', 'session expired', 'page expired', 'login keeps failing'],
  },
  {
    code: 420,
    name: 'Enhance Your Calm',
    category: 'client-error',
    standard: false,
    summary: 'A non-standard code originally used by Twitter\'s API to indicate the client was being rate-limited too aggressively.',
    explanation:
      'Twitter (now X) historically used 420 — a playful reference to cannabis culture combined with the number\'s HTTP-adjacent look — to tell clients they were being rate-limited or making requests too aggressively, before the API later switched to the standard 429 Too Many Requests. It still appears in some legacy integrations, documentation, and client libraries referencing older Twitter API versions.',
    scenarios: [
      'Legacy code integrating with an old version of the Twitter/X API before it adopted 429.',
      'A client library or documentation still referencing this historical status.',
      'Rarely, other APIs that deliberately adopted the same convention as an homage.',
    ],
    causes: {
      client: ['Client sending requests faster than the API\'s rate limit allows.'],
      server: ['API enforcing rate limiting and choosing this non-standard code to signal it.'],
      intermediary: [],
    },
    fixes: {
      user: ['Slow down request frequency and wait before retrying.'],
      developer: [
        'For new APIs, use the standard 429 Too Many Requests instead — it\'s universally recognized by HTTP clients, proxies, and monitoring tools.',
        'If integrating with a legacy API that still returns 420, treat it identically to 429: back off and retry with exponential backoff, respecting any Retry-After-equivalent guidance in the docs.',
      ],
    },
    headers: [
      { name: 'Retry-After', note: 'Some implementations include this to indicate how long to wait, mirroring 429 behavior.' },
    ],
    retrySafe: 'yes',
    retryNote: 'Safe to retry after backing off — treat exactly like 429 Too Many Requests.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects a transient rate-limit state.',
    related: [
      { code: 429, note: '429 Too Many Requests is the standardized status that superseded this non-standard Twitter-specific code.' },
    ],
    specUrl: 'https://http.dev/420',
    keywords: ['twitter rate limit', 'enhance your calm', 'non-standard rate limit'],
  },
  {
    code: 421,
    name: 'Misdirected Request',
    category: 'client-error',
    standard: true,
    summary: 'The request was sent to a server that isn\'t configured to produce a response for the combination of scheme and authority in the URL.',
    explanation:
      'Relevant primarily to HTTP/2 and connection reuse: when a client reuses an existing connection for a different origin (permitted under certain TLS certificate-sharing conditions), the server can reply 421 if it turns out it cannot actually serve that origin, telling the client to retry on a fresh connection.',
    scenarios: [
      'An HTTP/2 client reusing a connection across domains sharing a wildcard/SAN TLS certificate, where the server unexpectedly can\'t serve one of them.',
      'A misconfigured multi-tenant server/CDN edge that advertises a shared certificate but doesn\'t route all covered hostnames correctly.',
      'Debugging connection-coalescing behavior in HTTP/2 clients.',
    ],
    causes: {
      client: ['Client reused an HTTP/2 connection for a hostname the server cannot actually handle on that connection.'],
      server: ['Server/CDN advertises a certificate covering hostnames it doesn\'t fully support routing for.'],
      intermediary: ['A CDN edge node misconfigured for one of several hostnames sharing a certificate.'],
    },
    fixes: {
      user: ['Not typically end-user actionable — usually resolves automatically as compliant clients retry on a new connection.'],
      developer: [
        'Ensure any server/CDN presenting a shared TLS certificate for multiple hostnames can actually route and serve all of them correctly.',
        'Verify HTTP/2 connection-coalescing configuration matches your actual virtual host/routing setup.',
      ],
    },
    headers: [],
    retrySafe: 'yes',
    retryNote: 'Compliant clients should transparently retry the request on a new connection.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a connection-routing issue, not content.',
    related: [
      { code: 400, note: '400 Bad Request is used for general malformed requests; 421 is specific to HTTP/2 connection/authority mismatches.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-421-misdirected-request',
    keywords: ['http/2', 'connection coalescing', 'misdirected request', 'wrong origin'],
  },
  {
    code: 422,
    name: 'Unprocessable Content',
    category: 'client-error',
    standard: true,
    summary: 'The request is well-formed, but the server can\'t process the semantic content — the data itself is invalid.',
    explanation:
      'Distinguished from 400: the request\'s syntax is perfectly fine (valid JSON, correct Content-Type) but the data fails business-rule or semantic validation — for example, an email field that\'s syntactically a string but not a valid email, or a date that\'s in the past when a future date is required. Extremely common in modern REST/JSON APIs for form and input validation errors.',
    scenarios: [
      'Submitting a signup form with a syntactically valid but already-registered email, or a password that doesn\'t meet complexity rules.',
      'An API rejecting a request where a required field is present but has an invalid value (e.g. a negative quantity).',
      'A date range where the end date is before the start date.',
      'Validation frameworks (e.g. in Rails, Laravel, many JSON:API implementations) returning this by convention for failed model validation.',
    ],
    causes: {
      client: ['Submitted data fails business-rule/semantic validation despite being syntactically valid.'],
      server: ['Validation logic correctly enforces domain rules the submitted data violates.'],
      intermediary: [],
    },
    fixes: {
      user: [
        'Review the specific field-level error messages returned and correct the flagged values.',
        'Double check formats (dates, emails, phone numbers) match what the form expects.',
      ],
      developer: [
        'Return a structured error body listing every failing field and the specific reason, not just a generic message.',
        'Keep validation rules consistent between client-side (for UX) and server-side (for security) checks.',
        'Use a consistent error response shape across the whole API so clients can handle 422s generically.',
      ],
    },
    snippets: {
      express: `app.post('/signup', (req, res) => {
  const errors = validate(req.body); // e.g. using a schema validator
  if (errors.length) {
    return res.status(422).json({ errors });
  }
  // ...
});`,
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying with the identical invalid data will fail again; correct the flagged fields first.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — depends entirely on the specific submitted data.',
    related: [
      { code: 400, note: '400 is for structurally/syntactically invalid requests; 422 is for well-formed requests with invalid semantic content.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-422-unprocessable-content',
    keywords: ['validation error', 'invalid form data', 'semantic error', 'my form wont submit'],
  },
  {
    code: 423,
    name: 'Locked',
    category: 'client-error',
    standard: true,
    summary: 'The resource being accessed is locked, typically by another process or user.',
    explanation:
      'Defined by WebDAV for resources that support locking to prevent concurrent conflicting edits. It means the target resource has an active lock held by someone/something else, and the request cannot proceed until that lock is released.',
    scenarios: [
      'A WebDAV-based document management system where another user has locked a file for editing.',
      'A CMS or file-sync tool preventing concurrent writes to the same resource.',
      'An account or resource administratively locked (some APIs borrow this code informally for locked accounts).',
    ],
    causes: {
      client: [],
      server: ['Resource currently has an active lock held by another session/user.'],
      intermediary: [],
    },
    fixes: {
      user: [
        'Wait for the other user/process to finish and release the lock, then retry.',
        'Check whether you (or a stale session) hold the lock and need to explicitly unlock it.',
      ],
      developer: [
        'Implement lock timeouts so abandoned locks (e.g. from a crashed client) don\'t block resources indefinitely.',
        'Expose a way to view or force-release locks for administrators when appropriate.',
      ],
    },
    headers: [],
    retrySafe: 'yes',
    retryNote: 'Safe to retry once the lock is released; retrying while still locked will keep failing.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects a transient locked state.',
    related: [
      { code: 409, note: '409 Conflict is the general-purpose state-conflict code; 423 is specifically about an active resource lock.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc4918#section-11.3',
    keywords: ['webdav lock', 'resource locked', 'concurrent edit lock'],
  },
  {
    code: 424,
    name: 'Failed Dependency',
    category: 'client-error',
    standard: true,
    summary: 'The request failed because a previous, related request that it depended on also failed.',
    explanation:
      'Defined by WebDAV for batch/method-chaining operations: when one step in a multi-step operation fails, all the steps that depended on it are reported as 424 rather than being attempted, since their success was contingent on the earlier step.',
    scenarios: [
      'A WebDAV batch operation where an earlier step in a dependency chain fails, causing dependent steps to be skipped and reported as 424.',
      'Some workflow/orchestration APIs borrow this convention for multi-step pipelines with hard dependencies.',
    ],
    causes: {
      client: [],
      server: ['An earlier, prerequisite operation in the same request chain failed.'],
      intermediary: [],
    },
    fixes: {
      user: ['Check the error for the earlier, root-cause failure — fixing that resolves the dependent 424s as well.'],
      developer: [
        'Surface the specific upstream failure that caused the dependency chain to break, not just the downstream 424.',
        'Design batch/dependency operations so a partial failure report clearly separates the root cause from cascading failures.',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Retry the whole dependency chain only after the root-cause failure has been fixed.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects a specific point-in-time dependency failure.',
    related: [
      { code: 207, note: '207 Multi-Status is often used alongside 424 to report per-item results in the same batch operation.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc4918#section-11.4',
    keywords: ['webdav', 'dependency failure', 'chained request'],
  },
  {
    code: 425,
    name: 'Too Early',
    category: 'client-error',
    standard: true,
    summary: 'The server is unwilling to process a request that might be replayed, sent using TLS 0-RTT early data.',
    explanation:
      'TLS 1.3\'s "0-RTT" mode lets a returning client send request data before the handshake fully completes, for speed — but this data is potentially replayable by an attacker who intercepts it. A server can reject such early requests with 425 for operations where replay could cause harm (e.g. non-idempotent actions like payments), asking the client to retry once the full handshake is confirmed.',
    scenarios: [
      'A non-idempotent API request (e.g. a payment or purchase) sent as TLS 1.3 0-RTT early data that the server refuses to risk processing before the handshake completes.',
      'CDNs and TLS terminators that support 0-RTT proactively rejecting risky methods sent as early data.',
    ],
    causes: {
      client: ['Client sent a potentially non-idempotent request as TLS 0-RTT early data.'],
      server: ['Server policy refuses to risk-process early data for this type of request.'],
      intermediary: ['A TLS-terminating CDN/load balancer enforces 0-RTT replay protection.'],
    },
    fixes: {
      user: ['Not typically end-user actionable — the client should automatically retry after the full TLS handshake completes.'],
      developer: [
        'Ensure HTTP client/TLS libraries handle 425 by automatically retrying the request once the handshake is fully established.',
        'Consider disabling 0-RTT for endpoints handling non-idempotent, high-value operations if replay risk is a concern.',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Safe to retry once the full TLS handshake is complete (i.e., not as early data) — this is precisely what 425 asks the client to do.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a transport-security timing concern, not content.',
    related: [],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc8470',
    keywords: ['tls 0-rtt', 'early data', 'replay attack'],
  },
  {
    code: 426,
    name: 'Upgrade Required',
    category: 'client-error',
    standard: true,
    summary: 'The server refuses to process the request using the current protocol and requires the client to upgrade.',
    explanation:
      'The server will not serve this request over the protocol the client used, and wants the client to switch (typically to a newer TLS/HTTP version) via the Upgrade mechanism before proceeding. This is essentially the "you must upgrade" counterpart to 101 Switching Protocols.',
    scenarios: [
      'A server requiring TLS/HTTPS and rejecting a plaintext HTTP request with a request to upgrade.',
      'An API enforcing a minimum HTTP version and rejecting requests from very old HTTP/1.0-only clients.',
      'A WebSocket endpoint rejecting a plain HTTP request that didn\'t include the necessary Upgrade headers.',
    ],
    causes: {
      client: ['Client used an older or unsupported protocol version for this request.'],
      server: ['Server enforces a minimum required protocol/TLS version for this resource.'],
      intermediary: [],
    },
    fixes: {
      user: ['Update your browser or client application to a current version that supports modern protocols/TLS.'],
      developer: [
        'Include the Upgrade header in the response specifying exactly which protocol the client should switch to.',
        'Update client libraries/SDKs to support the required protocol version.',
      ],
    },
    headers: [
      { name: 'Upgrade', note: 'Names the protocol the server requires the client to switch to.' },
      { name: 'Connection', note: 'Should include "Upgrade" alongside the Upgrade header.' },
    ],
    retrySafe: 'conditional',
    retryNote: 'Retry after upgrading to the required protocol/TLS version; retrying unchanged will fail again.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a protocol-negotiation rejection, not content.',
    related: [
      { code: 101, note: '101 Switching Protocols is the successful handshake outcome this code is effectively demanding.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-426-upgrade-required',
    keywords: ['protocol upgrade required', 'tls required', 'https required'],
  },
  {
    code: 428,
    name: 'Precondition Required',
    category: 'client-error',
    standard: true,
    summary: 'The server requires the request to include a conditional header, which was missing.',
    explanation:
      'The inverse of 412: rather than a supplied precondition failing, no precondition was supplied at all, and the server requires one — typically to prevent the "lost update" problem, where two clients read a resource, both edit it, and the second write silently overwrites the first without ever knowing about the conflict.',
    scenarios: [
      'A PUT/PATCH request to update a resource without including an If-Match header, on an API that requires optimistic concurrency control.',
      'An API enforcing conditional requests to prevent accidental silent overwrites in multi-client scenarios.',
    ],
    causes: {
      client: ['Request omitted a required conditional header (If-Match, If-Unmodified-Since).'],
      server: ['Endpoint enforces mandatory conditional requests to prevent lost updates.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not typically end-user actionable — a client/integration needs to be updated to send the required header.'],
      developer: [
        'Fetch the resource first to obtain its current ETag, then include it via If-Match on the update request.',
        'Document clearly which endpoints require conditional headers and why.',
      ],
    },
    snippets: {
      express: `app.put('/docs/:id', (req, res) => {
  if (!req.headers['if-match']) {
    return res.status(428).json({ error: 'If-Match header required to prevent lost updates' });
  }
  // ...
});`,
    },
    headers: [
      { name: 'If-Match', note: 'The conditional header the server requires but did not receive.' },
    ],
    retrySafe: 'no',
    retryNote: 'Retry after including the required conditional header (typically obtained via a prior GET).',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a request-formation requirement, not content.',
    related: [
      { code: 412, note: '412 Precondition Failed is when a supplied condition doesn\'t match; 428 is when no condition was supplied at all.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc6585#section-3',
    keywords: ['lost update', 'if-match required', 'conditional request required'],
  },
  {
    code: 429,
    name: 'Too Many Requests',
    category: 'client-error',
    standard: true,
    summary: 'You\'ve sent too many requests in a given time period — slow down.',
    explanation:
      'The standard rate-limiting response. The client has exceeded a request quota, whether that\'s per-second burst limiting, per-minute API quotas, or login-attempt throttling for security. The response should include a Retry-After header telling the client how long to wait before trying again.',
    scenarios: [
      'An API client polling an endpoint faster than the documented rate limit allows.',
      'Too many failed login attempts triggering brute-force protection.',
      'A script or bot making rapid-fire requests without any throttling/backoff logic.',
      'Multiple users/services sharing one API key and collectively exceeding its quota.',
      'A sudden traffic spike (e.g. a viral post) exceeding per-IP or per-user rate limits.',
    ],
    causes: {
      client: ['Client is sending requests faster than the allowed rate, with no backoff logic.'],
      server: ['Rate limit configured intentionally to protect backend resources or enforce a pricing tier.'],
      intermediary: ['A CDN, API gateway, or WAF enforces rate limiting before requests reach the origin.'],
    },
    fixes: {
      user: [
        'Wait for the duration specified in the Retry-After header before trying again.',
        'Reduce the frequency of actions (e.g. refreshing, submitting) that trigger this.',
        'If this happens repeatedly during normal use, check whether multiple tabs/devices are making duplicate requests.',
      ],
      developer: [
        'Read and respect the Retry-After header in client code, implementing exponential backoff with jitter.',
        'Check X-RateLimit-* headers (if provided) to understand remaining quota and reset time, and surface this to API consumers.',
        'On the server, ensure rate-limit thresholds are documented and tuned to allow legitimate burst usage while blocking abuse.',
        'Consider per-user/per-key limits instead of overly broad per-IP limits that can penalize shared NAT/proxy users unfairly.',
      ],
    },
    snippets: {
      nginx: `http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    server {
        location /api/ {
            limit_req zone=api burst=20 nodelay;
        }
    }
}`,
      apache: `# Requires mod_ratelimit or mod_qos
<Location "/api">
    SetOutputFilter RATE_LIMIT
    SetEnv rate-limit 400
</Location>`,
      express: `const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));`,
    },
    headers: [
      { name: 'Retry-After', note: 'Tells the client how many seconds (or a date) to wait before retrying.' },
      { name: 'RateLimit', note: 'Structured field (or legacy X-RateLimit-Limit/Remaining/Reset headers) reporting quota status.' },
    ],
    retrySafe: 'yes',
    retryNote: 'Safe to retry after waiting the duration given in Retry-After — retrying immediately just extends the throttling.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects a transient, per-client rate-limit state.',
    related: [
      { code: 420, note: '420 Enhance Your Calm was Twitter\'s non-standard precursor to this now-standardized code.' },
      { code: 503, note: '503 Service Unavailable is used for general overload/maintenance, while 429 is specifically about per-client request quota.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc6585#section-4',
    keywords: ['rate limit', 'throttled', 'too many requests', 'slow down', 'retry-after'],
  },
  {
    code: 430,
    name: 'Request Header Fields Too Large',
    category: 'client-error',
    standard: false,
    summary: 'A Shopify-originated, non-standard variant of 431 specifically calling out oversized request headers.',
    explanation:
      'Functionally identical to the standardized 431, this non-standard code was used by some platforms (notably an early Shopify convention) before 431 was finalized. It indicates the cumulative size of the request\'s headers (or a single header/cookie) exceeds what the server will process.',
    scenarios: [
      'A request carrying an unusually large or bloated cookie (e.g. many stacked session/tracking cookies).',
      'Overly verbose custom headers added by browser extensions, proxies, or misbehaving client code.',
      'Debugging integrations against platforms that still use this legacy convention instead of 431.',
    ],
    causes: {
      client: ['Request includes excessively large or numerous headers/cookies.'],
      server: ['Header size limit configured too low for legitimate traffic, or the client is genuinely abusive.'],
      intermediary: ['A proxy or load balancer accumulates headers (e.g. via forwarding chains) that push the total over the limit.'],
    },
    fixes: {
      user: [
        'Clear cookies for the site, since oversized/accumulated cookies are the most common cause.',
        'Disable browser extensions that inject custom headers, then retry.',
      ],
      developer: [
        'Since this code is non-standard, prefer 431 Request Header Fields Too Large for new implementations.',
        'Audit cookie usage — avoid stacking many large cookies; move large data server-side (session store) instead.',
        'Increase header buffer limits at the proxy/server layer only if the traffic is legitimate.',
      ],
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying with the same oversized headers/cookies will fail again; reduce header/cookie size first.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a request-formation error.',
    related: [
      { code: 431, note: '431 Request Header Fields Too Large is the standardized IETF version of this same condition.' },
    ],
    specUrl: 'https://http.dev/430',
    keywords: ['oversized headers', 'cookie too large', 'shopify'],
  },
  {
    code: 431,
    name: 'Request Header Fields Too Large',
    category: 'client-error',
    standard: true,
    summary: 'The server refuses to process the request because its header fields are too large.',
    explanation:
      'The standardized version of the header-size limit: either one individual header field, or the combined size of all headers, exceeds what the server is willing to process. Frequently caused by oversized or accumulated cookies rather than custom application headers.',
    scenarios: [
      'A browser sending a request with a large accumulation of cookies (session, analytics, tracking, feature-flag cookies all stacked).',
      'An overly long Authorization header (e.g. a bloated JWT with excessive claims).',
      'A misconfigured reverse proxy that appends headers on each hop (e.g. X-Forwarded-For chains) until the total exceeds the limit.',
      'Browser extensions injecting extra custom headers on every request.',
    ],
    causes: {
      client: ['Excessive cookies or custom headers accumulated over time.'],
      server: ['Header size limit configured too conservatively for legitimate use, e.g. large JWTs.'],
      intermediary: ['A proxy chain repeatedly appends/duplicates headers across multiple hops.'],
    },
    fixes: {
      user: [
        'Clear cookies and site data, then retry.',
        'Disable browser extensions that add custom headers and test again.',
        'Try a private/incognito window to rule out accumulated local state.',
      ],
      developer: [
        'Move large session data server-side (a session store keyed by a small cookie) instead of storing it all in cookies.',
        'Reduce JWT claim bloat, or switch to opaque tokens with server-side lookup for large claim sets.',
        'Raise nginx/Apache header buffer sizes only after confirming the traffic causing this is legitimate, not abusive.',
        'Check for proxy misconfiguration causing header duplication across hops.',
      ],
    },
    snippets: {
      nginx: `large_client_header_buffers 4 16k;
client_header_buffer_size 4k;`,
      apache: `LimitRequestFieldSize 16384
LimitRequestFields 100`,
      express: `const http = require('http');
const server = http.createServer(app);
server.maxHeadersCount = 100; // Node.js option, tune as needed`,
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying with the same oversized headers will fail again; reduce cookie/header size first.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a request-formation error.',
    related: [
      { code: 413, note: '413 Content Too Large is the equivalent limit for the request body rather than its headers.' },
      { code: 430, note: '430 was a non-standard predecessor used by some platforms before 431 was standardized.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc6585#section-5',
    keywords: ['oversized headers', 'cookie bloat', 'jwt too large', 'header size limit'],
  },
  {
    code: 440,
    name: 'Login Time-out',
    category: 'client-error',
    standard: false,
    summary: 'A non-standard Microsoft IIS status meaning your session has expired and you need to log in again.',
    explanation:
      'Used by Microsoft\'s IIS web server (not part of the IETF standard) to specifically indicate that a session has timed out due to inactivity, and the client must re-authenticate. Functionally similar to how 401 is used elsewhere, but IIS-specific and tied to session/idle timeout rather than missing credentials.',
    scenarios: [
      'Returning to an IIS-hosted internal application/intranet site after leaving it idle past the session timeout.',
      'A legacy ASP.NET application enforcing a strict session idle timeout.',
      'SharePoint or other Microsoft-stack products signaling expired session state.',
    ],
    causes: {
      client: ['User left a session idle longer than the configured timeout.'],
      server: ['Session timeout configured (sometimes aggressively) at the IIS/application level.'],
      intermediary: [],
    },
    fixes: {
      user: ['Log in again to start a fresh session.'],
      developer: [
        'Review and adjust the session idle timeout if it is too short for realistic user workflows.',
        'Since this is IIS-specific and non-standard, ensure any non-Microsoft clients consuming this API can recognize and handle it appropriately (or map it to 401 for wider compatibility).',
      ],
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying without re-authenticating will fail again; log in again first.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — tied to a specific expired session.',
    related: [
      { code: 401, note: '401 Unauthorized is the standard equivalent most non-IIS servers use for expired/missing authentication.' },
      { code: 419, note: '419 Page Expired (Laravel) is a similar non-standard convention for expired session/CSRF state on a different stack.' },
    ],
    specUrl: 'https://http.dev/440',
    keywords: ['iis', 'session timeout', 'login timeout', 'login keeps failing'],
  },
  {
    code: 444,
    name: 'No Response',
    category: 'client-error',
    standard: false,
    summary: 'An nginx-specific, non-standard code meaning the server closed the connection without sending any response at all.',
    explanation:
      'This is an internal nginx convention, never actually sent over the wire — it\'s used in nginx config/logs to tell nginx itself to close the connection immediately without returning any HTTP response. It\'s commonly used to silently drop connections from clients nginx has identified as malicious, bots, or otherwise undesirable, denying them even the information a real error response would provide.',
    scenarios: [
      'nginx configured to silently drop requests matching known bad-bot or scanner user-agent patterns.',
      'Blocking access attempts to sensitive paths (e.g. wp-admin on a non-WordPress site) without revealing anything to the prober.',
      'Mitigating certain classes of automated abuse/scanning traffic by refusing to even acknowledge the request.',
      'A server intentionally returning nothing to conserve resources under DDoS attack.',
      'Debugging an API where curl returns `Empty reply from server` or exits without headers.',
    ],
    causes: {
      client: ['Request matched a pattern or security rule nginx is configured to drop silently.'],
      server: ['nginx `return 444;` directive explicitly triggered.'],
      intermediary: ['nginx deliberately configured to drop the connection for requests matching certain rules.'],
    },
    fixes: {
      user: [
        'Not applicable — you will simply see a connection failure/reset in your browser or client, with no error page.',
        'Confirm you are using a standard browser or client; tools mimicking scrapers or known scanning bots may be silently dropped.',
        'Check network connectivity and proxy/VPN settings.',
      ],
      developer: [
        'Use this only for traffic you are confident is malicious/unwanted — legitimate clients get no diagnostic information at all when this fires.',
        'Log matched requests separately (since no response is returned) so you can audit what\'s being silently dropped and adjust rules if legitimate traffic is caught.',
      ],
    },
    snippets: {
      nginx: `# Silently drop requests from known bad user agents
if ($http_user_agent ~* (badbot|scanner)) {
    return 444;
}`,
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Not a meaningful HTTP response to retry against — the connection is simply terminated.',
    cacheable: 'no',
    cacheNote: 'Not applicable — no response is actually sent.',
    related: [
      { code: 403, note: '403 Forbidden at least tells the client it was denied; 444 denies without any acknowledgment at all.' },
    ],
    specUrl: 'https://http.dev/444',
    keywords: ['nginx', 'connection closed', 'silent drop', 'no response', 'my api returns nothing', 'empty reply from server'],
  },
  {
    code: 449,
    name: 'Retry With',
    category: 'client-error',
    standard: false,
    summary: 'A non-standard Microsoft IIS code meaning the request should be retried after the client provides additional information.',
    explanation:
      'Used by older Microsoft IIS/ASP applications to indicate that a request could not be processed because some additional information is needed from the client — for example, retrying with different parameters after a validation step. Largely a historical/legacy artifact of the Microsoft web stack.',
    scenarios: [
      'A legacy ASP.NET/IIS application prompting for additional required parameters before it will process the request.',
      'Older Microsoft-stack multi-step form workflows requesting clarification before proceeding.',
    ],
    causes: {
      client: ['Original request was missing information the server needs to proceed.'],
      server: ['Application logic (specific to older IIS/ASP conventions) requires additional client-supplied data.'],
      intermediary: [],
    },
    fixes: {
      user: ['Check the response body for what additional information/parameters are being requested, and resubmit with them.'],
      developer: [
        'For new development, prefer standard 400 Bad Request or 422 Unprocessable Content with a clear body describing exactly what\'s missing, rather than this legacy non-standard code.',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Retry only after supplying the additional information the server is requesting.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a request-formation issue specific to one submission.',
    related: [
      { code: 400, note: '400 Bad Request is the standard, widely-supported equivalent for a request needing correction/more data.' },
    ],
    specUrl: 'https://http.dev/449',
    keywords: ['iis', 'retry with', 'legacy microsoft'],
  },
  {
    code: 450,
    name: 'Blocked by Windows Parental Controls',
    category: 'client-error',
    standard: false,
    summary: 'A non-standard Microsoft code returned when Windows Parental Controls block access to a webpage.',
    explanation:
      'Returned by Microsoft\'s Windows Parental Controls software (via Internet Explorer/the OS network stack) when a site is blocked by parental-control content filtering rules configured on the machine. It\'s generated locally by the OS/browser, not by remote web servers.',
    scenarios: [
      'A child\'s account on a Windows PC attempting to access a site blocked by parental control content filtering.',
      'IT-managed family/education devices with content restrictions enabled.',
    ],
    causes: {
      client: ['Local Windows Parental Controls configuration blocks the requested site/category.'],
      server: [],
      intermediary: [],
    },
    fixes: {
      user: [
        'Ask a parent/administrator to review and adjust the Parental Controls / Family Safety settings for the account.',
        'Verify the site isn\'t miscategorized by the content filter if you believe the block is a false positive.',
      ],
      developer: ['Not server-actionable — this is generated entirely client-side by the OS, not by your application.'],
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying will not help while the local content-filter policy remains in place.',
    cacheable: 'no',
    cacheNote: 'Not applicable — generated locally by the OS, not a server response.',
    related: [
      { code: 451, note: '451 Unavailable For Legal Reasons is the IETF-standard equivalent for legally-mandated content blocking at the network/server level.' },
    ],
    specUrl: 'https://http.dev/450',
    keywords: ['parental controls', 'windows family safety', 'content filter'],
  },
  {
    code: 451,
    name: 'Unavailable For Legal Reasons',
    category: 'client-error',
    standard: true,
    summary: 'The requested resource is unavailable because of a legal demand, such as a government-mandated content block or court order.',
    explanation:
      'Named as a nod to Ray Bradbury\'s "Fahrenheit 451," this standardized status makes content censorship explicit and machine-readable: rather than returning a misleading 404 or 403, the server states clearly that access is being denied specifically due to a legal restriction — a DMCA takedown, government censorship order, court injunction, or similar — often with a link to details about the legal demand.',
    scenarios: [
      'A government-mandated block on specific content or domains within a jurisdiction.',
      'Content removed in response to a DMCA takedown notice or similar legal process.',
      'A search engine or platform excluding certain results in specific countries due to local law.',
      'An ISP or network operator legally required to block access to specific resources.',
    ],
    causes: {
      client: [],
      server: ['Server/platform is legally required or compelled to withhold this specific content.'],
      intermediary: ['An ISP, DNS resolver, or national network gateway blocks the resource due to a legal/regulatory order.'],
    },
    fixes: {
      user: [
        'This is not a technical fault — the content is intentionally unavailable due to a legal requirement in your jurisdiction or context.',
        'If you believe the block is mistaken, look for a linked explanation of the legal basis and any formal appeal/counter-notice process.',
      ],
      developer: [
        'Use 451 (rather than 403/404) whenever content is withheld for a legal/regulatory reason — it\'s the honest, standards-compliant, and machine-parseable way to signal this.',
        'Include a Link header or response body pointing to details about the legal demand where permitted to disclose it.',
        'Log and retain records of legal takedown requests according to your jurisdiction\'s requirements and your own compliance policy.',
      ],
    },
    headers: [
      { name: 'Link', note: 'Can point to a resource describing the specific legal demand behind the block.' },
    ],
    retrySafe: 'no',
    retryNote: 'Retrying will not help — the block is a deliberate, legally-mandated policy, not a transient error.',
    cacheable: 'yes',
    cacheNote: 'Cacheable by default unless headers say otherwise, since the legal restriction is typically stable over time.',
    related: [
      { code: 403, note: '403 Forbidden is a generic access denial; 451 specifically and transparently signals a legal basis for the denial.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc7725',
    keywords: ['censorship', 'legal block', 'dmca', 'government blocked', 'geoblocked'],
  },
  {
    code: 460,
    name: 'Client Closed Connection (AWS ELB)',
    category: 'client-error',
    standard: false,
    summary: 'A non-standard AWS Elastic Load Balancer code meaning the client disconnected before the load balancer could send a response, combined with an upstream timeout.',
    explanation:
      'Specific to AWS\'s Classic/Application Load Balancer logs: it indicates the client closed the connection while the load balancer was still waiting on a response from the target (backend) server, which itself had not responded within the configured idle timeout. It\'s a diagnostic code found in AWS ELB access logs rather than something typically returned as a live response body.',
    scenarios: [
      'A user closing a browser tab or navigating away while a slow backend request is still in flight behind an AWS ALB/ELB.',
      'A mobile client losing network connectivity mid-request while waiting on a slow backend.',
      'Investigating AWS load balancer access logs for elevated 460 counts correlating with backend latency spikes.',
    ],
    causes: {
      client: ['Client disconnected (navigated away, lost network, or explicit timeout) before the response arrived.'],
      server: ['Backend target took too long to respond, extending the window during which the client could disconnect first.'],
      intermediary: ['AWS ELB/ALB idle timeout and connection-draining behavior determine exactly how this is logged.'],
    },
    fixes: {
      user: ['Not applicable — this is a server-side/infrastructure log entry, not something visible to end users as an error page.'],
      developer: [
        'Investigate backend latency — a high rate of 460s often correlates with slow endpoints causing clients to give up before the response arrives.',
        'Review ALB/ELB idle timeout settings versus your application\'s typical and worst-case response times.',
        'Add server-side request cancellation so backend work stops promptly once the client disconnects, saving resources.',
      ],
    },
    headers: [],
    retrySafe: 'yes',
    retryNote: 'Safe to retry — the original request was never completed from the client\'s perspective.',
    cacheable: 'no',
    cacheNote: 'Not applicable — an infrastructure log code, not a cacheable HTTP response.',
    related: [
      { code: 408, note: '408 Request Timeout is the standard HTTP code for a related but distinct client-side timeout condition.' },
      { code: 504, note: '504 Gateway Timeout is what would be logged instead if the backend timed out before any client disconnect occurred.' },
    ],
    specUrl: 'https://http.dev/460',
    keywords: ['aws elb', 'aws alb', 'client disconnected', 'load balancer log'],
  },
  {
    code: 463,
    name: 'Too Many Forwarded IP Addresses (AWS ELB)',
    category: 'client-error',
    standard: false,
    summary: 'A non-standard AWS Elastic Load Balancer code meaning the X-Forwarded-For header contained more IP addresses than AWS allows.',
    explanation:
      'AWS ELB/ALB rejects requests whose X-Forwarded-For header has an excessive number of chained IP addresses (beyond AWS\'s configured limit), which can indicate either a very long, legitimate proxy chain or a malformed/spoofed header being used in an attempted attack.',
    scenarios: [
      'A request passing through an unusually long chain of proxies/CDNs before reaching an AWS load balancer.',
      'A malformed or maliciously crafted X-Forwarded-For header attempting to spoof origin IP information.',
      'Investigating elevated 463 counts in ALB access logs after adding a new upstream proxy/CDN layer.',
    ],
    causes: {
      client: [],
      server: [],
      intermediary: ['An upstream proxy chain appended an excessive number of IPs to X-Forwarded-For before reaching the AWS load balancer.'],
    },
    fixes: {
      user: ['Not applicable — this is an infrastructure-level rejection, not a user-facing error condition.'],
      developer: [
        'Audit your full request path (CDN, proxies, load balancers) to understand why X-Forwarded-For is accumulating so many entries.',
        'Ensure trusted proxy configuration is correct so intermediate layers rewrite rather than indefinitely append to X-Forwarded-For.',
        'Check AWS documentation for the current maximum allowed IP count in this header for your load balancer type.',
      ],
    },
    headers: [
      { name: 'X-Forwarded-For', note: 'The header whose IP chain exceeded the allowed length.' },
    ],
    retrySafe: 'no',
    retryNote: 'Retrying without addressing the proxy chain configuration will produce the same rejection.',
    cacheable: 'no',
    cacheNote: 'Not applicable — an infrastructure rejection, not a cacheable HTTP response.',
    related: [
      { code: 400, note: '400 Bad Request is the general-purpose standard code for other forms of malformed-header rejection.' },
    ],
    specUrl: 'https://http.dev/463',
    keywords: ['aws elb', 'x-forwarded-for', 'proxy chain'],
  },
  {
    code: 494,
    name: 'Request Header Too Large (nginx)',
    category: 'client-error',
    standard: false,
    summary: 'An nginx-specific code meaning the request\'s header section exceeded nginx\'s configured buffer size.',
    explanation:
      'nginx returns this internally (visible in logs, and sometimes surfaced to clients) when the total size of the request headers exceeds the configured `large_client_header_buffers` setting — functionally very similar to the standard 431, but specific to nginx\'s own implementation.',
    scenarios: [
      'A request with a large accumulation of cookies or an oversized Authorization/JWT header hitting an nginx-fronted service.',
      'Debugging nginx error logs showing 494 entries correlated with specific high-traffic clients or misbehaving integrations.',
    ],
    causes: {
      client: ['Excessive cookies or oversized custom/auth headers sent in the request.'],
      server: ['nginx `large_client_header_buffers` configured smaller than what legitimate traffic requires.'],
      intermediary: [],
    },
    fixes: {
      user: ['Clear cookies for the site and retry; disable browser extensions that add custom headers.'],
      developer: [
        'Increase `large_client_header_buffers` in nginx config if the oversized headers are from legitimate traffic.',
        'Reduce cookie/header bloat at the application level (move large data server-side) rather than only raising limits.',
      ],
    },
    snippets: {
      nginx: `http {
    large_client_header_buffers 4 16k;
}`,
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying with the same oversized headers will fail again; reduce header/cookie size first.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a request-formation rejection.',
    related: [
      { code: 431, note: '431 Request Header Fields Too Large is the standardized, server-agnostic equivalent of this nginx-specific code.' },
    ],
    specUrl: 'https://http.dev/494',
    keywords: ['nginx', 'header too large', 'buffer size'],
  },
  {
    code: 495,
    name: 'SSL Certificate Error (nginx)',
    category: 'client-error',
    standard: false,
    summary: 'An nginx-specific code meaning the client presented an invalid SSL/TLS client certificate.',
    explanation:
      'Occurs specifically in nginx configurations using mutual TLS (mTLS), where clients must present a valid certificate to authenticate. This is returned when nginx\'s certificate verification of the client cert fails — expired, untrusted CA, or malformed certificate.',
    scenarios: [
      'A service-to-service API secured with mutual TLS where the calling service presents an expired client certificate.',
      'A misconfigured or outdated client certificate being used against an mTLS-protected internal endpoint.',
      'Certificate rotation issues where a client hasn\'t picked up a newly issued certificate.',
    ],
    causes: {
      client: ['Client presented an invalid, expired, or untrusted certificate.'],
      server: ['nginx configured to require and strictly verify client certificates (mTLS).'],
      intermediary: [],
    },
    fixes: {
      user: ['Not typically end-user actionable — contact whoever manages your client certificate for a valid, current one.'],
      developer: [
        'Verify the client certificate\'s validity period, issuing CA, and chain of trust against what nginx `ssl_client_certificate` expects.',
        'Automate certificate rotation and renewal so expired client certs don\'t silently start failing in production.',
        'Check nginx error logs for the specific SSL verification failure reason.',
      ],
    },
    snippets: {
      nginx: `server {
    ssl_client_certificate /etc/nginx/ca.crt;
    ssl_verify_client on;
}`,
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying with the same invalid certificate will fail again; a valid client certificate must be installed first.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — tied to a specific TLS handshake failure.',
    related: [
      { code: 401, note: '401 Unauthorized is the general HTTP-layer authentication failure; 495 is specific to nginx TLS client-certificate verification.' },
    ],
    specUrl: 'https://http.dev/495',
    keywords: ['nginx', 'mtls', 'client certificate', 'ssl error'],
  },
  {
    code: 496,
    name: 'No SSL Certificate (nginx)',
    category: 'client-error',
    standard: false,
    summary: 'An nginx-specific code meaning the client did not present a required SSL/TLS client certificate.',
    explanation:
      'Similar to 495, but specifically for the case where nginx requires a client certificate (mTLS) for the requested resource and the client did not present one at all, rather than presenting an invalid one.',
    scenarios: [
      'A client application not configured to send a client certificate against an mTLS-protected endpoint.',
      'A developer testing an mTLS API with a generic HTTP client (curl, Postman) without configuring the required client cert.',
      'A newly provisioned service that hasn\'t yet been issued its client certificate.',
    ],
    causes: {
      client: ['No client certificate was presented in the TLS handshake.'],
      server: ['nginx configured to require a client certificate (mTLS) for this resource.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not typically end-user actionable — obtain and configure the required client certificate for your integration.'],
      developer: [
        'Confirm the calling service/client is configured to present its certificate during the TLS handshake (e.g. curl --cert/--key flags).',
        'Document mTLS requirements clearly for API consumers, including exactly how to configure client certificates.',
      ],
    },
    snippets: {
      nginx: `server {
    ssl_client_certificate /etc/nginx/ca.crt;
    ssl_verify_client on; # returns 496 if no cert is presented
}`,
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retry after configuring the client to present a valid certificate.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — tied to a specific TLS handshake failure.',
    related: [
      { code: 495, note: '495 is for an invalid presented certificate; 496 is for no certificate presented at all.' },
    ],
    specUrl: 'https://http.dev/496',
    keywords: ['nginx', 'mtls', 'missing client certificate'],
  },
  {
    code: 497,
    name: 'HTTP Request Sent to HTTPS Port (nginx)',
    category: 'client-error',
    standard: false,
    summary: 'An nginx-specific code meaning a plain HTTP request was sent to a port that only serves HTTPS.',
    explanation:
      'nginx detects that the connection is speaking plain HTTP on a port configured for TLS-only traffic and returns this to signal the client should use HTTPS instead. It commonly appears in logs as a garbled-looking plaintext response when a browser or client tries a `http://` URL against an HTTPS-only port.',
    scenarios: [
      'A user or old bookmark using `http://` instead of `https://` against a server that only serves TLS on that port.',
      'A misconfigured client or script hardcoded to plain HTTP against an HTTPS-only endpoint.',
      'An HTTP-to-HTTPS redirect improperly configured, so port 443 receives raw HTTP traffic directly instead of being redirected at port 80 first.',
    ],
    causes: {
      client: ['Client used http:// instead of https:// for this host/port.'],
      server: [],
      intermediary: ['No HTTP-to-HTTPS redirect exists on port 80, or DNS/load-balancer misrouting sent plain HTTP straight to the TLS port.'],
    },
    fixes: {
      user: ['Use https:// explicitly in the URL, or update the bookmark/link causing the issue.'],
      developer: [
        'Set up a proper HTTP-to-HTTPS redirect on port 80 (a 301 to the https:// equivalent) rather than letting HTTP traffic hit the TLS-only port directly.',
        'Check for any HSTS misconfiguration that might be contributing to inconsistent scheme handling.',
      ],
    },
    snippets: {
      nginx: `server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name example.com;
    # ...
}`,
    },
    headers: [],
    retrySafe: 'yes',
    retryNote: 'Safe to retry using https:// instead of http://.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a protocol-scheme mismatch, not content.',
    related: [
      { code: 301, note: 'A proper 301 HTTP-to-HTTPS redirect on port 80 is the correct fix that prevents clients from ever seeing 497.' },
    ],
    specUrl: 'https://http.dev/497',
    keywords: ['nginx', 'http to https', 'wrong scheme', 'plain http on tls port'],
  },
  {
    code: 498,
    name: 'Token expired/invalid (Esri)',
    category: 'client-error',
    standard: false,
    summary: 'A non-standard code used by Esri (ArcGIS) APIs to indicate an authentication token has expired or is invalid.',
    explanation:
      'Used by Esri\'s ArcGIS Server and related geospatial/mapping APIs to indicate the security token supplied with the request is invalid or expired — functionally analogous to 401, but specific to Esri\'s token-based authentication scheme.',
    scenarios: [
      'A mapping application making ArcGIS REST API calls with an expired short-lived token.',
      'A GIS integration that hasn\'t implemented automatic token refresh before expiry.',
      'Testing ArcGIS endpoints manually with a stale token copied from an earlier session.',
    ],
    causes: {
      client: ['Token used in the request has expired or is malformed/invalid.'],
      server: ['Esri/ArcGIS token validation logic rejects the supplied token.'],
      intermediary: [],
    },
    fixes: {
      user: ['Log in again to the GIS application to obtain a fresh token.'],
      developer: [
        'Implement automatic token refresh ahead of expiry in any ArcGIS API integration.',
        'Check the token\'s configured expiry duration and request lifecycle to ensure long-running operations don\'t outlive it.',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Retry only after obtaining a fresh, valid token.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — tied to a specific expired/invalid token.',
    related: [
      { code: 401, note: '401 Unauthorized is the standard equivalent most non-Esri APIs use for expired/invalid authentication tokens.' },
    ],
    specUrl: 'https://http.dev/498',
    keywords: ['esri', 'arcgis', 'token expired', 'gis api'],
  },
  {
    code: 499,
    name: 'Client Closed Request (nginx)',
    category: 'client-error',
    standard: false,
    summary: 'An nginx-specific code meaning the client closed the connection before nginx could send a response.',
    explanation:
      'Logged by nginx (not sent as an actual response, since the client is already gone) when the client disconnects — by navigating away, cancelling a request, or timing out — while nginx (or the upstream it\'s proxying to) was still processing. A high rate of 499s in access logs is a strong signal of slow backend responses causing clients to give up.',
    scenarios: [
      'A user closing a browser tab or clicking "stop" while a slow page/API call is still loading.',
      'A mobile client with a short internal timeout abandoning a request to a slow endpoint.',
      'An upstream application taking too long, so client-side timeouts fire before nginx can proxy back a response.',
      'Investigating nginx access logs and finding 499 spikes correlating with slow database queries or downstream API calls.',
    ],
    causes: {
      client: ['User/application cancelled or timed out the request before a response arrived.'],
      server: ['Backend/upstream response time is slow enough that clients frequently give up first.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not applicable — this is a server-side log entry, not a user-facing error page.'],
      developer: [
        'Investigate and reduce backend latency for the affected endpoint(s) — this is almost always the real root cause behind a high 499 rate.',
        'Add server-side cancellation so backend work (database queries, downstream calls) stops promptly when the client disconnects, freeing resources.',
        'Correlate 499 spikes in nginx logs with slow-query logs or APM traces to pinpoint the specific slow dependency.',
        'Review client-side timeout settings — an unrealistically short client timeout can generate 499s even when the backend is healthy but just slow.',
      ],
    },
    snippets: {
      nginx: `# Increase logging detail to help correlate 499s with upstream timing
log_format timing '$remote_addr - $status - upstream_time=$upstream_response_time - request_time=$request_time';
access_log /var/log/nginx/access.log timing;`,
    },
    headers: [],
    retrySafe: 'yes',
    retryNote: 'Safe to retry — the original request was abandoned client-side, not rejected by the server.',
    cacheable: 'no',
    cacheNote: 'Not applicable — an internal nginx log code, not an actual cacheable response.',
    related: [
      { code: 408, note: '408 Request Timeout is the standard HTTP code for a related client-timeout condition.' },
      { code: 504, note: '504 Gateway Timeout is logged instead if nginx itself times out waiting on the upstream, rather than the client disconnecting first.' },
    ],
    specUrl: 'https://http.dev/499',
    keywords: ['nginx', 'client disconnected', 'slow backend', 'request cancelled'],
  },
];
