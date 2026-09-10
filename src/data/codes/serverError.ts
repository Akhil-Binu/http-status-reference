import type { StatusCode } from '../types';

export const serverError: StatusCode[] = [
  {
    code: 500,
    name: 'Internal Server Error',
    category: 'server-error',
    standard: true,
    summary: 'The server hit an unexpected condition and couldn\'t complete the request — a generic catch-all failure.',
    explanation:
      'The most generic possible server-side failure: something went wrong on the server and it doesn\'t (or won\'t) tell you exactly what. This is typically an unhandled exception, a bug, a database error, or any failure the application didn\'t anticipate and handle gracefully. It says nothing about whether retrying will help.',
    scenarios: [
      'An unhandled exception/uncaught error in application code (e.g. a null reference, a failed type coercion).',
      'A database query failing (connection lost, syntax error, constraint violation) without being caught.',
      'A third-party API call the server depends on failing in a way the code doesn\'t handle.',
      'A recent deployment introducing a regression that crashes on certain inputs.',
      'Running out of memory or another resource mid-request.',
    ],
    causes: {
      client: [],
      server: [
        'Unhandled exception or runtime error in application code.',
        'Database connectivity or query failure.',
        'Misconfiguration (missing environment variable, bad config file) causing a crash.',
        'Resource exhaustion (memory, file handles, disk space) on the server.',
      ],
      intermediary: [],
    },
    fixes: {
      user: [
        'Try again in a few minutes — many 500s are transient (e.g. a brief database hiccup).',
        'If the error persists, try a different action/page to see if the problem is isolated to one feature.',
        'Report the issue to the site/service if it continues, ideally including what you were doing when it happened.',
      ],
      developer: [
        'Check application logs immediately for the stack trace/exception associated with the failing request.',
        'Reproduce with the exact input that triggered the error, if known, to isolate the root cause.',
        'Check recent deployments — a spike in 500s right after a release strongly suggests a regression to roll back.',
        'Add structured error logging/monitoring (e.g. Sentry, Datadog) if the root cause isn\'t immediately visible in logs.',
        'Never expose stack traces or internal error details to end users/clients in production — log them server-side and return a generic message.',
      ],
    },
    snippets: {
      express: `// Centralized error handler — must be registered last
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});`,
      nginx: `# Custom error page instead of exposing backend error details
error_page 500 502 503 504 /50x.html;
location = /50x.html {
    root /usr/share/nginx/html;
}`,
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Safe to retry for idempotent methods (GET, PUT, DELETE); for non-idempotent POST, confirm the action didn\'t partially complete before retrying.',
    cacheable: 'no',
    cacheNote: 'Not cacheable by default — an error response should not be treated as valid content.',
    related: [
      { code: 502, note: '502 Bad Gateway is specifically about an invalid response from an upstream server, a more specific case than a generic 500.' },
      { code: 503, note: '503 Service Unavailable indicates the server is deliberately not handling requests (overload/maintenance), vs. 500\'s unexpected failure.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-500-internal-server-error',
    keywords: ['server crash', 'unhandled exception', 'generic error', 'internal error', 'my api returns nothing'],
  },
  {
    code: 501,
    name: 'Not Implemented',
    category: 'server-error',
    standard: true,
    summary: 'The server doesn\'t support the functionality required to fulfill the request — often an unsupported HTTP method.',
    explanation:
      'Signals that the server does not (and has no plans to) support the capability the request requires — most commonly an HTTP method it doesn\'t recognize or implement at all, anywhere on the server (as opposed to 405, which is scoped to a specific resource that just doesn\'t support this particular method).',
    scenarios: [
      'Sending an HTTP method the server\'s framework doesn\'t implement at all (e.g. an obscure or custom method).',
      'Calling an API feature/endpoint that is documented as planned but not yet built.',
      'A client using a very old or unusual protocol feature the server was never built to handle.',
    ],
    causes: {
      client: ['Client used a method or feature the server has no implementation for.'],
      server: ['Server genuinely lacks support for the requested capability.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not typically end-user actionable — usually indicates a client/integration bug or an unimplemented feature.'],
      developer: [
        'Confirm whether this method/feature is supposed to be supported — if so, implement it; if not, document the limitation clearly.',
        'Double check the client isn\'t simply using the wrong HTTP method for an endpoint that does support a different one (in which case 405 with an Allow header would be more accurate).',
      ],
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying with the identical unsupported method/feature will fail again.',
    cacheable: 'yes',
    cacheNote: 'Cacheable by default unless headers say otherwise.',
    related: [
      { code: 405, note: '405 Method Not Allowed is scoped to one resource not supporting a method; 501 means the server doesn\'t support it anywhere.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-501-not-implemented',
    keywords: ['unsupported method', 'feature not implemented'],
  },
  {
    code: 502,
    name: 'Bad Gateway',
    category: 'server-error',
    standard: true,
    summary: 'A server acting as a gateway or proxy got an invalid response from the upstream server it was trying to reach.',
    explanation:
      'Returned by a reverse proxy, load balancer, or CDN when it successfully contacted an upstream server but received a response it couldn\'t understand or use — malformed HTTP, a connection reset mid-response, or the upstream crashing entirely. This is distinct from 504, which means the upstream simply never responded in time.',
    scenarios: [
      'A backend application server (Node.js, Python, etc.) crashing or restarting while nginx/a load balancer is proxying to it.',
      'A misconfigured reverse proxy pointing to the wrong upstream host/port.',
      'A backend process running out of memory and being killed mid-request by the OS.',
      'An upstream service returning a malformed or non-HTTP-compliant response.',
      'A CDN unable to reach the origin server at all (DNS failure, connection refused).',
    ],
    causes: {
      client: [],
      server: [
        'Application server process crashed, hung, or is not running.',
        'Application returned a malformed or non-standard HTTP response.',
      ],
      intermediary: [
        'Reverse proxy/load balancer misconfigured with the wrong upstream address or port.',
        'Upstream connection refused or reset (firewall, security group, or the app simply isn\'t listening).',
      ],
    },
    fixes: {
      user: [
        'Wait a minute and refresh — this is very often a brief server-side restart or deploy.',
        'If it persists for more than a few minutes, the site is likely experiencing a real outage; check the provider\'s status page.',
      ],
      developer: [
        'Check whether the application/backend process is actually running and listening on the expected port.',
        'Check the reverse proxy/load balancer\'s upstream configuration for a wrong host, port, or stale DNS entry.',
        'Check application logs for crashes, out-of-memory kills, or unhandled startup errors around the time of the 502s.',
        'Verify health checks on the load balancer are correctly detecting and routing around unhealthy backend instances.',
        'Check for a recent deploy that might have left the app in a crash-loop.',
      ],
    },
    snippets: {
      nginx: `upstream backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001 backup;
}
location / {
    proxy_pass http://backend;
    proxy_next_upstream error timeout http_502;
}`,
      apache: `ProxyPass "/" "http://127.0.0.1:3000/" retry=1
ProxyPassReverse "/" "http://127.0.0.1:3000/"`,
      express: `// Ensure the app actually binds correctly and logs startup failures loudly
app.listen(3000, () => console.log('Listening on 3000'))
   .on('error', (err) => { console.error('Failed to start:', err); process.exit(1); });`,
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Safe to retry for idempotent methods once the upstream is healthy again; retry with backoff since the failure may be ongoing.',
    cacheable: 'no',
    cacheNote: 'Not cacheable by default — an error response, not valid content from the origin.',
    related: [
      { code: 504, note: '504 Gateway Timeout is when the upstream never responds in time; 502 is when it responds but with something invalid.' },
      { code: 500, note: '500 originates from the application itself; 502 originates from a proxy/gateway reporting an upstream problem.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-502-bad-gateway',
    keywords: ['proxy error', 'upstream crashed', 'backend down', 'gateway error'],
  },
  {
    code: 503,
    name: 'Service Unavailable',
    category: 'server-error',
    standard: true,
    summary: 'The server is temporarily unable to handle the request, usually due to overload or maintenance.',
    explanation:
      'Signals a temporary condition — unlike 500, this is (or should be) the server deliberately declining requests, often because it\'s overloaded, undergoing maintenance, or a dependency it needs is unavailable. It should ideally include a Retry-After header to tell clients when to try again.',
    scenarios: [
      'A site under heavy traffic (viral spike, DDoS, or a flash sale) exceeding its capacity.',
      'Scheduled maintenance mode deliberately returning 503 to all traffic.',
      'A backend dependency (database, cache, downstream API) being unavailable, causing the app to fail fast rather than hang.',
      'Auto-scaling not keeping up with a sudden traffic increase.',
      'Kubernetes/orchestration briefly routing to a pod that hasn\'t finished starting up.',
    ],
    causes: {
      client: [],
      server: [
        'Application deliberately returns 503 during maintenance windows.',
        'Application or a critical dependency is overloaded and shedding load intentionally.',
      ],
      intermediary: [
        'Load balancer has no healthy backend targets to route to.',
        'A CDN/WAF rate-limiting layer is returning 503 during a traffic spike or attack.',
      ],
    },
    fixes: {
      user: [
        'Wait for the duration specified in the Retry-After header (if shown) before retrying.',
        'Check the service\'s status page for a known ongoing incident or scheduled maintenance.',
        'Try again in a few minutes — this is almost always temporary by definition.',
      ],
      developer: [
        'Set the Retry-After header whenever returning 503 so well-behaved clients back off appropriately instead of hammering the server.',
        'Check autoscaling configuration and current load/resource metrics (CPU, memory, connection pool exhaustion).',
        'Verify load balancer health checks aren\'t marking healthy instances as down (or unhealthy ones as up).',
        'For planned maintenance, ensure the maintenance page itself returns 503, not 200, so search engines and monitoring correctly treat it as temporary.',
        'Implement graceful degradation/circuit breakers so a failing dependency doesn\'t take down the whole service.',
      ],
    },
    snippets: {
      nginx: `# Maintenance mode
location / {
    return 503;
}
error_page 503 @maintenance;
location @maintenance {
    rewrite ^(.*)$ /maintenance.html break;
}
add_header Retry-After 3600 always;`,
      apache: `RewriteEngine On
RewriteCond %{DOCUMENT_ROOT}/maintenance.html -f
RewriteCond %{SCRIPT_FILENAME} !maintenance.html
RewriteRule ^.*$ /maintenance.html [R=503,L]
Header always set Retry-After "3600"`,
      express: `let ready = false;
app.use((req, res, next) => {
  if (!ready) {
    res.set('Retry-After', '30');
    return res.status(503).json({ error: 'Service starting up, try again shortly' });
  }
  next();
});`,
    },
    headers: [
      { name: 'Retry-After', note: 'Tells the client how long to wait before retrying — strongly recommended on every 503.' },
    ],
    retrySafe: 'yes',
    retryNote: 'Safe to retry after the Retry-After duration; retrying immediately in a tight loop can worsen the overload causing the 503 in the first place.',
    cacheable: 'no',
    cacheNote: 'Not cacheable by default — represents a temporary state, not stable content.',
    related: [
      { code: 429, note: '429 Too Many Requests is a per-client quota being exceeded; 503 is the whole service being temporarily unable to serve anyone.' },
      { code: 502, note: '502 means an upstream sent a bad response; 503 means the server itself has decided it cannot serve requests right now.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-503-service-unavailable',
    keywords: ['maintenance mode', 'server overloaded', 'service down', 'temporarily unavailable'],
  },
  {
    code: 504,
    name: 'Gateway Timeout',
    category: 'server-error',
    standard: true,
    summary: 'A server acting as a gateway or proxy did not get a response from the upstream server in time.',
    explanation:
      'A reverse proxy, load balancer, or CDN successfully connected to the upstream server but never received a complete response within its timeout window. Unlike 502 (invalid response), here the upstream just took too long — often because it\'s doing genuinely slow work, or is itself stuck/hung.',
    scenarios: [
      'A slow database query or long-running computation causing the application to exceed the proxy\'s timeout.',
      'A downstream API call (to a third-party service) hanging and blocking the whole request chain.',
      'The application server hanging due to a deadlock, thread-pool exhaustion, or an infinite loop.',
      'A newly deployed backend with a cold-start delay (e.g. serverless cold starts) exceeding the gateway timeout.',
      'Network issues between the proxy and the upstream causing packets to be delayed or dropped.',
    ],
    causes: {
      client: [],
      server: [
        'Application takes too long to respond due to slow queries, external calls, or inefficient code.',
        'Application is hung/deadlocked and never responds at all.',
      ],
      intermediary: [
        'Proxy/load balancer timeout configured shorter than the application\'s legitimate worst-case response time.',
        'Network latency or packet loss between the proxy and the upstream server.',
      ],
    },
    fixes: {
      user: [
        'Wait a minute and retry — the operation may simply need more time or the server may recover shortly.',
        'For an action you know is heavy (large export, big search), consider whether a smaller/narrower request would complete faster.',
      ],
      developer: [
        'Profile the slow endpoint to find the actual bottleneck — slow database query, N+1 queries, or a blocking external API call are the most common causes.',
        'Increase the proxy/gateway timeout only after confirming the backend response time is legitimately that long and cannot be optimized.',
        'Move genuinely long-running work to an async job pattern (202 Accepted + polling/webhook) instead of making the client wait synchronously.',
        'Add timeouts on all outbound calls the server makes (database, third-party APIs) so a single slow dependency can\'t hang the whole request indefinitely.',
        'Check for deadlocks, thread-pool/connection-pool exhaustion under load.',
      ],
    },
    snippets: {
      nginx: `location /api/ {
    proxy_pass http://backend;
    proxy_connect_timeout 5s;
    proxy_read_timeout 30s;
    proxy_send_timeout 30s;
}`,
      apache: `ProxyPass "/api/" "http://127.0.0.1:3000/api/" timeout=30`,
      express: `// Cap outbound calls so a slow dependency doesn't hang the whole request
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);
try {
  const res = await fetch(externalUrl, { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}`,
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Safe to retry for idempotent methods; for non-idempotent requests, confirm the operation didn\'t complete server-side despite the timeout before retrying.',
    cacheable: 'no',
    cacheNote: 'Not cacheable by default — represents a timing failure, not valid content.',
    related: [
      { code: 502, note: '502 means the upstream responded with something invalid; 504 means it never responded within the allotted time at all.' },
      { code: 408, note: '408 Request Timeout is the client-facing equivalent: the server gave up waiting on the client, rather than a proxy giving up on an upstream.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-504-gateway-timeout',
    keywords: ['proxy timeout', 'slow backend', 'upstream timeout', 'gateway timeout'],
  },
  {
    code: 505,
    name: 'HTTP Version Not Supported',
    category: 'server-error',
    standard: true,
    summary: 'The server doesn\'t support the HTTP protocol version used in the request.',
    explanation:
      'The server refuses to service the request because it does not support (or refuses to support) the major HTTP version the client used — for example, a client speaking HTTP/1.0 or an experimental version against a server that requires at least HTTP/1.1.',
    scenarios: [
      'A very old or minimal HTTP client library sending an outdated protocol version.',
      'A server hardened to reject legacy HTTP/1.0 to reduce attack surface or complexity.',
      'A misconfigured proxy downgrading or mislabeling the protocol version.',
    ],
    causes: {
      client: ['Client used an HTTP version the server does not support.'],
      server: ['Server intentionally restricts supported protocol versions.'],
      intermediary: ['A proxy in the path mislabels or downgrades the protocol version.'],
    },
    fixes: {
      user: ['Update your HTTP client/browser/library to a current version supporting modern HTTP.'],
      developer: [
        'Check the exact protocol version the failing client is sending, and confirm your server\'s minimum supported version.',
        'If intentionally dropping support for an old version, communicate this clearly in API/client documentation ahead of time.',
      ],
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying with the same unsupported protocol version will fail again; the client must switch protocol versions.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a protocol-negotiation failure, not content.',
    related: [
      { code: 426, note: '426 Upgrade Required is the client-error counterpart, asking the client to proactively switch protocols before being rejected.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-505-http-version-not-suppor',
    keywords: ['http version', 'protocol not supported', 'outdated client'],
  },
  {
    code: 506,
    name: 'Variant Also Negotiates',
    category: 'server-error',
    standard: true,
    summary: 'A server-side content negotiation configuration error created a circular reference.',
    explanation:
      'Occurs in servers using "transparent content negotiation" (a rarely-used HTTP feature where the server picks among several variant representations). It signals that the chosen variant resource is itself configured to negotiate further, creating a circular/invalid configuration rather than terminating on an actual representation.',
    scenarios: [
      'Extremely rare in modern web infrastructure — mostly seen in older Apache mod_negotiation setups.',
      'A misconfigured content-negotiation setup where a "variant" resource points back into the negotiation process instead of to actual content.',
    ],
    causes: {
      client: [],
      server: ['Server-side content-negotiation configuration references a variant that itself requires negotiation, creating a loop.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not actionable — this is purely a server misconfiguration.'],
      developer: [
        'Review and fix the transparent content-negotiation configuration (e.g. Apache mod_negotiation "var" files) so each variant resolves to concrete content, not another negotiation step.',
        'Consider migrating away from transparent content negotiation toward explicit Accept-header handling in application code, which is far less error-prone.',
      ],
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying will not help — this is a static server misconfiguration that must be fixed before any request to this resource can succeed.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — represents a server configuration error.',
    related: [
      { code: 300, note: '300 Multiple Choices is the intended, working outcome of content negotiation that 506 fails to properly resolve to.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc2295#section-8.1',
    keywords: ['content negotiation loop', 'apache mod_negotiation', 'variant negotiation'],
  },
  {
    code: 507,
    name: 'Insufficient Storage',
    category: 'server-error',
    standard: true,
    summary: 'The server can\'t complete the request because it doesn\'t have enough storage space.',
    explanation:
      'Defined by WebDAV, but broadly applicable: the server understood and would normally fulfill the request, but ran out of disk space, database storage, or quota needed to actually store the result — for instance, a file upload or a resource-creation operation that has nowhere to be written.',
    scenarios: [
      'A file upload failing because the server\'s disk (or a mounted volume) is full.',
      'A database write failing because a storage quota has been reached.',
      'A cloud storage backend (S3-compatible service, etc.) reporting it is out of allocated capacity for this account/bucket.',
    ],
    causes: {
      client: [],
      server: ['Server\'s underlying disk, database, or storage quota is exhausted.'],
      intermediary: [],
    },
    fixes: {
      user: [
        'Not directly actionable — wait and retry later, or contact the service if this persists, since it indicates a server-side capacity problem.',
      ],
      developer: [
        'Check disk usage on the affected server/volume immediately (`df -h` on Linux) and free up space or expand storage.',
        'Set up monitoring/alerting on disk and storage-quota usage well before it becomes critical.',
        'Check database storage quotas/limits if using a managed database service.',
        'Implement cleanup jobs for temporary files, old logs, or expired data that may be consuming unnecessary space.',
      ],
    },
    snippets: {
      nginx: `# Not directly nginx-configurable — this is a server storage/disk-capacity issue,
# but ensure client_body_temp_path points to a volume with adequate free space:
client_body_temp_path /var/nginx/client_temp;`,
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Retry only after storage capacity has actually been freed or expanded — retrying immediately will fail identically.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — represents a transient server capacity condition.',
    related: [
      { code: 413, note: '413 Content Too Large is a client-side limit on the request; 507 is a genuine server-side storage capacity shortage.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc4918#section-11.5',
    keywords: ['disk full', 'storage quota', 'out of space', 'webdav'],
  },
  {
    code: 508,
    name: 'Loop Detected',
    category: 'server-error',
    standard: true,
    summary: 'The server detected an infinite loop while processing a request that involves multiple internal resources.',
    explanation:
      'Defined as a WebDAV extension for operations that traverse a graph of resources (like recursive binding resolution): the server detected that processing would loop indefinitely (e.g. resource A references B which references A) and aborted rather than hanging forever.',
    scenarios: [
      'A WebDAV server resolving deeply nested or circular resource bindings.',
      'Recursive property/COPY operations across a resource graph containing an accidental cycle.',
    ],
    causes: {
      client: [],
      server: ['A circular reference exists in the resource structure the server is trying to process.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not directly actionable — report the circular structure to whoever manages the resource hierarchy.'],
      developer: [
        'Audit the resource graph/bindings for accidental circular references and remove them.',
        'Add cycle-detection safeguards proactively in any recursive resource-traversal logic to fail fast with a clear error.',
      ],
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying will not help until the underlying circular reference is fixed.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — represents a structural error condition.',
    related: [
      { code: 208, note: '208 Already Reported is the successful mechanism (deduplication) that prevents this kind of loop in well-formed WebDAV responses.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc5842#section-7.2',
    keywords: ['infinite loop', 'circular reference', 'webdav'],
  },
  {
    code: 509,
    name: 'Bandwidth Limit Exceeded',
    category: 'server-error',
    standard: false,
    summary: 'A non-standard code (popularized by cPanel/Apache hosting) meaning the server has exceeded its allocated bandwidth.',
    explanation:
      'Not part of any IETF standard, this code became common on shared hosting platforms (via the cPanel/Apache "bw/limited" module) to indicate the hosting account has consumed its allotted monthly or period bandwidth quota, so the server is refusing further requests until the quota resets or is increased.',
    scenarios: [
      'A shared-hosting website going "viral" and exceeding its monthly bandwidth allowance.',
      'A hosting plan\'s bandwidth cap being reached well before the end of the billing cycle.',
      'Legacy cPanel-based hosting environments enforcing bandwidth limits at the Apache module level.',
    ],
    causes: {
      client: [],
      server: [],
      intermediary: ['The hosting provider\'s bandwidth-limiting module enforces a quota independent of the application itself.'],
    },
    fixes: {
      user: ['Wait until the hosting provider\'s billing/quota period resets, or contact the site owner about the outage.'],
      developer: [
        'Check your hosting control panel (e.g. cPanel) for current bandwidth usage against your plan\'s limit.',
        'Upgrade your hosting plan or move large static assets (images, video, downloads) to a CDN to reduce origin bandwidth consumption.',
        'Consider migrating off bandwidth-capped shared hosting to a provider with usage-based or unmetered bandwidth if this recurs.',
      ],
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying will not help until the bandwidth quota resets or is increased.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects an account-level quota state.',
    related: [
      { code: 503, note: '503 Service Unavailable is the standard code many modern hosts use instead for a similar overload/quota condition.' },
    ],
    specUrl: 'https://http.dev/509',
    keywords: ['cpanel', 'shared hosting', 'bandwidth quota', 'bandwidth exceeded'],
  },
  {
    code: 510,
    name: 'Not Extended',
    category: 'server-error',
    standard: true,
    summary: 'Further extensions to the request are required for the server to fulfill it.',
    explanation:
      'Part of the (rarely implemented) HTTP Extension Framework: the server requires the client to use a specific HTTP extension/policy that wasn\'t present in the request, and cannot fulfill the request without it. In practice, virtually no modern service implements or relies on this mechanism.',
    scenarios: [
      'Extremely rare in modern usage — largely a historical/theoretical status tied to an HTTP extension mechanism that never saw wide adoption.',
    ],
    causes: {
      client: ['Request did not include a required HTTP extension/policy declaration.'],
      server: ['Server enforces a policy requiring a specific HTTP extension.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not actionable — encountering this in the wild is exceptionally unlikely with modern software.'],
      developer: [
        'If you encounter this from a legacy system, consult that system\'s specific documentation for the required extension/policy it expects.',
        'Do not design new APIs around this mechanism — it has essentially no real-world tooling or client support.',
      ],
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Retrying without adding the required extension will fail again.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — an unusual, extension-policy-driven rejection.',
    related: [],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc2774',
    keywords: ['http extension framework', 'not extended'],
  },
  {
    code: 511,
    name: 'Network Authentication Required',
    category: 'server-error',
    standard: true,
    summary: 'The client needs to authenticate to gain network access, typically via a captive portal.',
    explanation:
      'Returned not by the origin server but by the network infrastructure itself (a Wi-Fi captive portal at a coffee shop, hotel, or airport) intercepting HTTP traffic to force the user through a login/terms-acceptance page before granting real internet access.',
    scenarios: [
      'Connecting to public Wi-Fi (airport, hotel, cafe) that requires accepting terms or logging in before browsing.',
      'A corporate or campus network requiring authentication/registration for new devices.',
      'A captive portal blocking all traffic until payment or credentials are provided.',
    ],
    causes: {
      client: [],
      server: [],
      intermediary: ['The local network\'s captive portal intercepts traffic until the user authenticates.'],
    },
    fixes: {
      user: [
        'Open a browser and navigate to any http:// (not https://) site — most devices/OSes auto-detect captive portals and prompt you, but manually browsing can trigger the portal too.',
        'Complete the login/terms/payment flow presented by the captive portal.',
        'If the portal page doesn\'t appear automatically, try visiting a known plain-HTTP URL to trigger the redirect.',
      ],
      developer: [
        'Not application-actionable — this happens at the network layer before traffic reaches your servers.',
        'If building network infrastructure, ensure the captive portal correctly returns 511 (rather than silently dropping or redirecting HTTPS traffic, which many OS captive-portal detectors rely on to work smoothly).',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Retry only after completing the network\'s authentication step — the original request itself was never the problem.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a transient network-access state, and caching it could incorrectly persist after authentication.',
    related: [
      { code: 401, note: '401 Unauthorized is application-level authentication; 511 is network-level authentication required before any traffic passes at all.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc6585#section-6',
    keywords: ['captive portal', 'wifi login', 'network authentication'],
  },
  {
    code: 520,
    name: 'Web Server Returned an Unknown Error (Cloudflare)',
    category: 'server-error',
    standard: false,
    summary: 'A Cloudflare-specific code meaning the origin server returned something Cloudflare couldn\'t interpret as a valid HTTP response.',
    explanation:
      'Cloudflare successfully connected to your origin server, but the response it got back was empty, malformed, contained unexpected headers, or otherwise didn\'t look like a normal HTTP response Cloudflare knows how to relay — a broad catch-all for "something is wrong with the origin\'s response that doesn\'t fit our more specific 521-527 codes."',
    scenarios: [
      'The origin web server crashing or restarting mid-response.',
      'A misconfigured origin returning headers or a response format Cloudflare\'s proxy layer rejects.',
      'The origin server silently closing the connection without sending any data.',
      'An application-level firewall or security tool on the origin mangling the response before it leaves the server.',
    ],
    causes: {
      client: [],
      server: [
        'Origin web server (nginx, Apache, application server) crashed or returned a malformed response.',
        'Origin closed the connection unexpectedly mid-response.',
      ],
      intermediary: ['Cloudflare received but could not parse/relay the origin\'s response.'],
    },
    fixes: {
      user: ['Wait a few minutes and retry — check the site\'s status page if this persists.'],
      developer: [
        'Check origin server logs and Cloudflare\'s "Origin Error" logs (available in the dashboard) for the exact time of the 520 to correlate with a crash or malformed response.',
        'Test the origin directly, bypassing Cloudflare (via its direct IP or a hosts-file override), to see the raw response causing the issue.',
        'Check for oversized response headers or cookies on the origin that Cloudflare might be rejecting.',
        'Review any recent changes to the origin web server config or application code around the time errors started.',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Safe to retry for idempotent methods once the origin is confirmed healthy; retry with backoff since the underlying issue may be ongoing.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — an error condition, not valid origin content.',
    related: [
      { code: 502, note: '502 Bad Gateway is the general IETF-standard equivalent; Cloudflare uses 520 as a catch-all when the failure doesn\'t match its more specific 521-527 codes.' },
    ],
    specUrl: 'https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/',
    keywords: ['cloudflare', 'origin error', 'unknown error'],
  },
  {
    code: 521,
    name: 'Web Server Is Down (Cloudflare)',
    category: 'server-error',
    standard: false,
    summary: 'A Cloudflare-specific code meaning the origin server actively refused the connection.',
    explanation:
      'Cloudflare could not establish a TCP connection to your origin server at all — the origin refused the connection outright, typically because the web server process isn\'t running, a firewall is blocking Cloudflare\'s IPs, or the server is genuinely down.',
    scenarios: [
      'The origin\'s web server process (nginx, Apache, application server) has crashed or was never started.',
      'A firewall or security group on the origin blocking Cloudflare\'s IP ranges.',
      'The origin server itself being powered off, rebooting, or unreachable.',
      'A recently changed DNS/origin IP that no longer has a listening web server.',
    ],
    causes: {
      client: [],
      server: [
        'Web server process is not running on the origin.',
        'Origin server is powered off, crashed, or unreachable.',
      ],
      intermediary: [
        'Firewall/security group rules on the origin block inbound connections from Cloudflare\'s IP ranges.',
      ],
    },
    fixes: {
      user: ['Wait and retry later; check the site\'s status page for a known outage.'],
      developer: [
        'SSH into the origin and verify the web server process is actually running (`systemctl status nginx`, etc.).',
        'Confirm the firewall/security group allows inbound traffic from Cloudflare\'s published IP ranges on the relevant ports.',
        'Verify the origin server itself is powered on and reachable independent of Cloudflare.',
        'Check that DNS in Cloudflare points to the correct, current origin IP address.',
      ],
    },
    snippets: {
      nginx: `# Ensure nginx is actually running and listening
sudo systemctl status nginx
sudo systemctl start nginx`,
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Retry once the origin server is confirmed back up and accepting connections.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects a real-time connectivity failure.',
    related: [
      { code: 522, note: '521 is an immediately refused connection; 522 is a connection attempt that times out instead.' },
    ],
    specUrl: 'https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/',
    keywords: ['cloudflare', 'origin down', 'connection refused', 'server down'],
  },
  {
    code: 522,
    name: 'Connection Timed Out (Cloudflare)',
    category: 'server-error',
    standard: false,
    summary: 'A Cloudflare-specific code meaning Cloudflare\'s connection attempt to the origin server timed out.',
    explanation:
      'Cloudflare tried to establish a TCP connection to the origin but never got a response within its timeout window — different from 521 (actively refused) in that here the connection attempt simply hangs, often due to network routing issues, an overwhelmed origin, or overly restrictive firewall rules that silently drop packets instead of rejecting them.',
    scenarios: [
      'The origin server is overwhelmed and too busy to accept new connections.',
      'A firewall silently drops (rather than rejects) packets from Cloudflare\'s IP ranges.',
      'Network routing issues between Cloudflare\'s edge and the origin data center.',
      'The origin server hanging or in a degraded state without fully crashing.',
    ],
    causes: {
      client: [],
      server: ['Origin server is overloaded and unable to accept new connections promptly.'],
      intermediary: [
        'A firewall silently drops rather than rejects packets, causing a hang instead of an immediate refusal.',
        'Network path issues between Cloudflare and the origin.',
      ],
    },
    fixes: {
      user: ['Wait and retry later; check the site\'s status page.'],
      developer: [
        'Check origin server load (CPU, memory, connection counts) for signs of overload at the time of the error.',
        'Verify firewall rules reject rather than silently drop Cloudflare\'s IP ranges, to fail fast and clearly instead of hanging.',
        'Test raw TCP connectivity to the origin\'s web server port from an external host to rule out network path issues.',
        'Check Cloudflare\'s status page for any edge-side connectivity issues to your origin\'s region.',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Retry once origin load/connectivity issues are resolved; retry with backoff since a busy origin may still be recovering.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects a real-time connectivity timeout.',
    related: [
      { code: 521, note: '521 is an immediately refused connection; 522 is a connection attempt that hangs and times out instead.' },
      { code: 524, note: '524 is a timeout waiting for the HTTP response after the TCP connection succeeded; 522 times out during the connection attempt itself.' },
    ],
    specUrl: 'https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/',
    keywords: ['cloudflare', 'connection timeout', 'origin unreachable'],
  },
  {
    code: 523,
    name: 'Origin Is Unreachable (Cloudflare)',
    category: 'server-error',
    standard: false,
    summary: 'A Cloudflare-specific code meaning Cloudflare could not route to the origin server\'s IP address at all.',
    explanation:
      'Distinct from a timeout or refusal — this means Cloudflare could not even find a network path to the origin\'s configured IP address, typically due to a DNS or routing configuration problem rather than the origin server\'s own health.',
    scenarios: [
      'The DNS record in Cloudflare points to an incorrect or no-longer-valid origin IP address.',
      'The origin server\'s hosting provider has a routing/network outage.',
      'A recently decommissioned server whose old IP is still referenced in DNS.',
    ],
    causes: {
      client: [],
      server: [],
      intermediary: [
        'DNS record in Cloudflare points to a wrong or stale IP address.',
        'A network-level routing issue prevents Cloudflare from reaching the origin\'s IP range at all.',
      ],
    },
    fixes: {
      user: ['Wait and retry later; check the site\'s status page.'],
      developer: [
        'Verify the DNS A/AAAA record in Cloudflare points to the correct, current origin IP address.',
        'Confirm the origin server/hosting provider isn\'t experiencing a network outage independent of Cloudflare.',
        'Use a tool like `dig` or the Cloudflare dashboard\'s diagnostics to confirm what IP Cloudflare is actually trying to reach.',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Retry once DNS/routing to the correct origin IP is restored.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects a real-time routing failure.',
    related: [
      { code: 521, note: '521 is a refused connection to a reachable IP; 523 means the IP itself could not be routed to at all.' },
    ],
    specUrl: 'https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/',
    keywords: ['cloudflare', 'dns misconfiguration', 'unreachable origin'],
  },
  {
    code: 524,
    name: 'A Timeout Occurred (Cloudflare)',
    category: 'server-error',
    standard: false,
    summary: 'A Cloudflare-specific code meaning the origin connected successfully but didn\'t finish sending an HTTP response within 100 seconds.',
    explanation:
      'The TCP connection to the origin succeeded, but the origin took longer than Cloudflare\'s fixed timeout (100 seconds on the proxy path) to send back a complete response — most often a slow backend operation such as a heavy database query, large report generation, or a synchronous call to a slow third-party API.',
    scenarios: [
      'A slow database query or report-generation endpoint that legitimately takes longer than 100 seconds.',
      'A synchronous call to a slow third-party API blocking the whole response chain.',
      'An origin server under heavy load taking unusually long to process even normally-fast requests.',
      'A long-running file export/import endpoint that should really be asynchronous.',
    ],
    causes: {
      client: [],
      server: [
        'Slow database queries, inefficient code, or a slow downstream dependency causing the origin to take too long.',
      ],
      intermediary: ['Cloudflare\'s fixed proxy timeout (100 seconds) is not configurable and cannot be raised.'],
    },
    fixes: {
      user: ['Wait and retry; if the operation is inherently heavy (e.g. a big report), it may consistently be too slow through Cloudflare.'],
      developer: [
        'Profile and optimize the slow endpoint — this is the most reliable fix since Cloudflare\'s 100-second proxy timeout is fixed and cannot be extended.',
        'Convert long-running synchronous operations to an async job pattern (202 Accepted + polling or webhook) so the initial HTTP response returns quickly.',
        'Add caching for expensive, frequently-requested computations so most requests don\'t hit the slow path at all.',
        'Check for N+1 database queries or missing indexes as a common, fixable source of unexpectedly slow endpoints.',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Retrying an inherently slow operation through Cloudflare will likely time out again — the endpoint needs to be made faster or asynchronous.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — represents a timing failure, not valid content.',
    related: [
      { code: 504, note: '504 Gateway Timeout is the general IETF-standard equivalent; Cloudflare\'s 524 is specifically its fixed 100-second proxy timeout.' },
    ],
    specUrl: 'https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/',
    keywords: ['cloudflare', '100 second timeout', 'slow origin', 'gateway timeout'],
  },
  {
    code: 525,
    name: 'SSL Handshake Failed (Cloudflare)',
    category: 'server-error',
    standard: false,
    summary: 'A Cloudflare-specific code meaning the SSL/TLS handshake between Cloudflare and the origin server failed.',
    explanation:
      'Occurs when Cloudflare is configured to connect to the origin over HTTPS (Full or Full Strict SSL mode) but the TLS handshake with the origin fails — due to an invalid, expired, self-signed (in Strict mode), or misconfigured SSL certificate on the origin, or a TLS version/cipher mismatch.',
    scenarios: [
      'The origin\'s SSL certificate has expired.',
      'Cloudflare is set to "Full (Strict)" SSL mode, but the origin uses a self-signed certificate.',
      'A TLS version or cipher suite mismatch between Cloudflare and the origin server.',
      'The origin\'s web server isn\'t actually configured to serve HTTPS on the expected port.',
    ],
    causes: {
      client: [],
      server: [
        'Origin SSL certificate is expired, invalid, or self-signed while Strict mode is enabled.',
        'Origin web server not properly configured for HTTPS.',
      ],
      intermediary: ['Cloudflare\'s configured SSL mode requires stricter certificate validation than the origin can satisfy.'],
    },
    fixes: {
      user: ['Wait and retry; report the issue to the site if it persists, since this is a certificate configuration problem on their end.'],
      developer: [
        'Check the origin\'s SSL certificate expiry date and renew if needed (e.g. via Let\'s Encrypt/Certbot or your CA).',
        'If using Cloudflare "Full (Strict)" mode, ensure the origin certificate is issued by a publicly trusted CA (Cloudflare Origin CA certificates work too).',
        'Verify the origin web server is actually listening for HTTPS on port 443 with a valid certificate configured.',
        'Check for TLS version/cipher mismatches — ensure the origin supports the TLS versions Cloudflare uses to connect.',
      ],
    },
    snippets: {
      nginx: `server {
    listen 443 ssl;
    ssl_certificate /etc/ssl/certs/origin.pem;
    ssl_certificate_key /etc/ssl/private/origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
}`,
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Retry once the origin\'s TLS certificate/configuration is fixed.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects a real-time TLS negotiation failure.',
    related: [
      { code: 526, note: '525 is a handshake failure; 526 is a completed handshake with a certificate Cloudflare deems invalid.' },
    ],
    specUrl: 'https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/',
    keywords: ['cloudflare', 'ssl handshake failed', 'tls error', 'origin certificate'],
  },
  {
    code: 526,
    name: 'Invalid SSL Certificate (Cloudflare)',
    category: 'server-error',
    standard: false,
    summary: 'A Cloudflare-specific code meaning the origin\'s SSL certificate failed validation under the configured SSL mode.',
    explanation:
      'The TLS handshake with the origin completed, but Cloudflare rejected the certificate presented — commonly because "Full (Strict)" SSL mode is enabled and the certificate is expired, self-signed, or doesn\'t match the hostname being requested.',
    scenarios: [
      'The origin certificate has expired but the handshake itself still technically completes.',
      'The certificate\'s Common Name/SAN doesn\'t match the hostname Cloudflare is requesting.',
      '"Full (Strict)" mode is enabled with a self-signed or internal-CA certificate Cloudflare doesn\'t trust.',
    ],
    causes: {
      client: [],
      server: [
        'Origin certificate expired, or its hostname doesn\'t match the requested domain.',
        'Origin uses a self-signed or privately-issued certificate not trusted under Strict mode.',
      ],
      intermediary: ['Cloudflare\'s "Full (Strict)" SSL mode enforces stricter certificate validation than "Full" mode.'],
    },
    fixes: {
      user: ['Wait and retry; report the issue to the site if it persists.'],
      developer: [
        'Renew the origin\'s SSL certificate if expired.',
        'Ensure the certificate\'s hostname (CN/SAN) matches the domain Cloudflare is proxying.',
        'Use a Cloudflare Origin CA certificate (free, trusted automatically by Cloudflare) if you don\'t have a publicly trusted cert for the origin.',
        'If you cannot immediately fix the origin certificate, temporarily switching Cloudflare to "Full" (non-strict) mode unblocks traffic, but this reduces security and should only be a short-term measure.',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Retry once the origin certificate issue is resolved.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects a real-time certificate validation failure.',
    related: [
      { code: 525, note: '525 is a failed handshake; 526 is a completed handshake with a certificate that fails validation.' },
    ],
    specUrl: 'https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/',
    keywords: ['cloudflare', 'invalid ssl certificate', 'full strict mode', 'certificate mismatch'],
  },
  {
    code: 527,
    name: 'Railgun Error (Cloudflare)',
    category: 'server-error',
    standard: false,
    summary: 'A Cloudflare-specific code meaning Cloudflare\'s (now-deprecated) Railgun connection to the origin failed.',
    explanation:
      'Railgun was a Cloudflare feature that maintained a persistent, compressed connection between Cloudflare\'s edge and the origin to speed up dynamic content delivery. This error meant that connection failed. Railgun has since been deprecated and retired by Cloudflare, so this code is now primarily of historical interest.',
    scenarios: [
      'Legacy Cloudflare configurations that had Railgun enabled before its deprecation.',
      'Documentation or monitoring tooling referencing historical Railgun-related incidents.',
    ],
    causes: {
      client: [],
      server: ['The Railgun listener process on the origin (if still present from a legacy setup) failed or was unreachable.'],
      intermediary: ['Cloudflare\'s Railgun connection layer itself failed — this feature is now deprecated.'],
    },
    fixes: {
      user: ['Not applicable — Railgun has been retired; this code should not appear on current Cloudflare configurations.'],
      developer: [
        'Since Railgun is deprecated, remove any legacy Railgun listener/configuration from your origin and rely on Cloudflare\'s standard proxying instead.',
        'If you see this on a modern setup, check for stale configuration referencing a decommissioned feature.',
      ],
    },
    headers: [],
    retrySafe: 'no',
    retryNote: 'Not applicable to modern deployments — Railgun is deprecated and should not be in active use.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — an error from a deprecated feature.',
    related: [
      { code: 520, note: '520 is the general-purpose Cloudflare origin-error catch-all now used in place of Railgun-specific errors.' },
    ],
    specUrl: 'https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/',
    keywords: ['cloudflare', 'railgun', 'deprecated feature'],
  },
  {
    code: 528,
    name: 'Origin Is Unreachable (Pantheon / hosting platforms)',
    category: 'server-error',
    standard: false,
    summary: 'A non-standard code used by some hosting platforms (e.g. Pantheon) meaning the origin server behind their edge is unreachable.',
    explanation:
      'Similar in spirit to Cloudflare\'s 523, this code is used by certain hosting/PaaS providers\' own edge/proxy layers to indicate they could not reach the customer\'s origin application container or server, often during deploys, scaling events, or an application crash.',
    scenarios: [
      'A deploy in progress temporarily taking the origin application offline.',
      'An application container crashing or failing to start.',
      'Platform-level scaling/orchestration briefly leaving no healthy origin instance available.',
    ],
    causes: {
      client: [],
      server: ['Application container/process is down, crashed, or mid-deploy.'],
      intermediary: ['The hosting platform\'s edge/routing layer cannot currently reach any healthy origin instance.'],
    },
    fixes: {
      user: ['Wait a few minutes and retry — this is often transient during a deploy.'],
      developer: [
        'Check the platform\'s dashboard/logs for the application\'s current deploy and health status.',
        'Review recent deploy history for a failed or in-progress release around the time errors started.',
        'Check application startup/crash logs if the container is failing to become healthy.',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Retry once the platform confirms the origin/application is healthy again.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects a real-time platform/origin availability issue.',
    related: [
      { code: 502, note: '502 Bad Gateway is the general IETF-standard equivalent for an unreachable/invalid upstream.' },
    ],
    specUrl: 'https://http.dev/528',
    keywords: ['pantheon', 'paas', 'origin unreachable', 'deploy in progress'],
  },
  {
    code: 529,
    name: 'Site is Overloaded (Qualys / hosting platforms)',
    category: 'server-error',
    standard: false,
    summary: 'A non-standard code used by some platforms to indicate the site/server is currently overloaded and cannot accept more requests.',
    explanation:
      'Used by some hosting/security platforms as a more specific alternative to 503, explicitly signaling the server or site is over its current request-handling capacity, distinct from maintenance or a hard outage.',
    scenarios: [
      'A sudden traffic spike exceeding the current provisioned capacity of the origin.',
      'A resource-exhaustion event (CPU, memory, connection limits) on the origin server.',
    ],
    causes: {
      client: [],
      server: ['Server has exceeded its current capacity to handle incoming requests.'],
      intermediary: [],
    },
    fixes: {
      user: ['Wait and retry shortly — this reflects a temporary capacity issue, not a permanent failure.'],
      developer: [
        'Check server resource utilization (CPU, memory, open connections) at the time of the overload.',
        'Scale up/out the origin (more instances, bigger instance size) to handle peak load.',
        'Add caching (CDN, application-level) in front of expensive endpoints to reduce load per request.',
        'Since this code is non-standard, consider using the standard 503 with a Retry-After header for broader client compatibility.',
      ],
    },
    headers: [
      { name: 'Retry-After', note: 'Should ideally be included, similar to 503, to guide client retry timing.' },
    ],
    retrySafe: 'yes',
    retryNote: 'Safe to retry with backoff once server load has decreased.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects a transient overload state.',
    related: [
      { code: 503, note: '503 Service Unavailable is the standard, widely-recognized equivalent for this same overload condition.' },
    ],
    specUrl: 'https://http.dev/529',
    keywords: ['site overloaded', 'capacity exceeded', 'non-standard overload'],
  },
  {
    code: 530,
    name: 'Site Frozen / Origin DNS Error (Cloudflare)',
    category: 'server-error',
    standard: false,
    summary: 'A Cloudflare-specific code meaning either the site has been frozen for inactivity, or (more commonly) an origin DNS resolution error occurred, shown alongside a 1016 error.',
    explanation:
      'Historically used by some hosts (e.g. Pantheon) for sites frozen due to inactivity/non-payment, but on Cloudflare specifically, a 530 response is generally paired with a Cloudflare-specific error code (most often 1016, "Origin DNS Error") indicating Cloudflare could not resolve the DNS for the origin server configured for this hostname.',
    scenarios: [
      'A CNAME record in Cloudflare pointing to a hostname that no longer resolves.',
      'An origin hostname\'s DNS record was removed or misconfigured at the provider being pointed to.',
      'A site on a platform (like Pantheon) that has been frozen due to prolonged inactivity or a billing issue.',
    ],
    causes: {
      client: [],
      server: [],
      intermediary: [
        'DNS for the configured origin hostname fails to resolve.',
        'Platform-level account freeze (inactivity/billing) taking the site fully offline.',
      ],
    },
    fixes: {
      user: ['Wait and retry; contact the site owner if this persists, since it usually requires action on their DNS/hosting account.'],
      developer: [
        'Check the specific Cloudflare error code shown alongside 530 (e.g. 1016) in the Cloudflare dashboard for the precise cause.',
        'Verify the origin hostname\'s DNS record actually resolves (`dig`/`nslookup` the CNAME target) independent of Cloudflare.',
        'If on a platform like Pantheon, check the account/site status for a freeze due to inactivity or billing.',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Retry once the underlying DNS resolution or account-freeze issue is resolved.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — reflects a real-time DNS or account-status failure.',
    related: [
      { code: 523, note: '523 Origin Is Unreachable is Cloudflare\'s code for a resolvable-but-unreachable origin IP; 530 typically indicates DNS resolution itself failed.' },
    ],
    specUrl: 'https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/',
    keywords: ['cloudflare', 'origin dns error', 'site frozen', '1016 error'],
  },
  {
    code: 561,
    name: 'Unauthorized (AWS ELB)',
    category: 'server-error',
    standard: false,
    summary: 'A non-standard AWS Elastic Load Balancer code meaning the load balancer could not authenticate the request against a configured identity provider.',
    explanation:
      'Returned by AWS Application Load Balancers configured with built-in authentication (via Amazon Cognito or an OIDC identity provider) when the ALB itself, rather than the backend application, fails to authenticate the request.',
    scenarios: [
      'An ALB configured with Cognito/OIDC authentication rejecting a request with missing, expired, or invalid identity provider credentials.',
      'A misconfiguration between the ALB\'s authentication action and the identity provider (wrong client ID/secret, wrong issuer URL).',
      'The identity provider itself being temporarily unreachable from the ALB.',
    ],
    causes: {
      client: ['Client did not supply valid identity-provider credentials/session for the ALB\'s configured authentication.'],
      server: [],
      intermediary: [
        'ALB authentication action misconfigured (wrong IdP settings).',
        'Identity provider (Cognito/OIDC) temporarily unreachable or misconfigured.',
      ],
    },
    fixes: {
      user: ['Log in again through the identity provider\'s login flow the ALB redirects you to.'],
      developer: [
        'Verify the ALB listener rule\'s authenticate-oidc/authenticate-cognito action configuration (client ID, secret, issuer, endpoints).',
        'Check CloudWatch logs for the ALB and the identity provider for the specific authentication failure reason.',
        'Confirm the identity provider service itself is healthy and reachable from AWS.',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Retry after completing authentication through the identity provider again.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — tied to a specific authentication failure.',
    related: [
      { code: 401, note: '401 Unauthorized is the general HTTP-layer equivalent; 561 is specific to AWS ALB built-in authentication failures.' },
    ],
    specUrl: 'https://http.dev/561',
    keywords: ['aws alb', 'cognito', 'oidc', 'load balancer authentication'],
  },
  {
    code: 598,
    name: 'Network Read Timeout Error',
    category: 'server-error',
    standard: false,
    summary: 'A non-standard code, used by some proxies, meaning a network read operation to an upstream server timed out.',
    explanation:
      'Used informally by some HTTP proxies and network monitoring tools to indicate a network-level read timeout occurred while waiting for data from an upstream server — conceptually similar to 504, but specifically describing a low-level network read timeout rather than an application-level gateway timeout.',
    scenarios: [
      'A proxy waiting on a slow or hung upstream connection that never delivers data.',
      'Network-level packet loss or congestion causing reads from an upstream to stall.',
      'Monitoring/proxy tooling surfacing this code in logs rather than to end users directly.',
    ],
    causes: {
      client: [],
      server: ['Upstream server is slow, hung, or not sending data.'],
      intermediary: ['A proxy\'s network read from the upstream exceeded its configured timeout.'],
    },
    fixes: {
      user: ['Wait and retry — this reflects a transient network/upstream issue.'],
      developer: [
        'Investigate upstream server health and response times around the time this occurred.',
        'Check for network-level issues (packet loss, congestion) between the proxy and the upstream.',
        'Since this is non-standard, prefer the standard 504 Gateway Timeout in your own systems for broader compatibility.',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Safe to retry for idempotent requests once the upstream/network issue clears.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a transient network timing failure.',
    related: [
      { code: 504, note: '504 Gateway Timeout is the standardized equivalent most systems should use instead of this non-standard code.' },
    ],
    specUrl: 'https://http.dev/598',
    keywords: ['network timeout', 'proxy read timeout', 'non-standard timeout'],
  },
  {
    code: 599,
    name: 'Network Connect Timeout Error',
    category: 'server-error',
    standard: false,
    summary: 'A non-standard code, used by some proxies, meaning the network connection attempt to an upstream server timed out.',
    explanation:
      'Similar to 598 but for the connection-establishment phase specifically: a proxy or client attempted to open a TCP connection to an upstream server and the attempt itself timed out before any data could be exchanged, often indicating the upstream is unreachable, overloaded, or behind a firewall silently dropping packets.',
    scenarios: [
      'A proxy attempting to connect to an upstream that is down, overloaded, or behind a packet-dropping firewall.',
      'DNS resolving to an unreachable or incorrect IP for the upstream host.',
      'Network partition or routing issues between the proxy and the upstream data center.',
    ],
    causes: {
      client: [],
      server: ['Upstream server is down, overloaded, or unreachable at the network level.'],
      intermediary: [
        'A firewall silently drops connection attempts instead of rejecting them.',
        'Network routing/DNS issues prevent the connection from being established.',
      ],
    },
    fixes: {
      user: ['Wait and retry — this reflects a transient network/upstream connectivity issue.'],
      developer: [
        'Verify the upstream server is running and reachable independent of the proxy.',
        'Check DNS resolution for the upstream host resolves to the correct, current IP.',
        'Check firewall rules between the proxy and upstream reject rather than silently drop connections, to fail fast and clearly.',
        'Since this is non-standard, prefer the standard 504 Gateway Timeout (or 522, if using Cloudflare) in your own systems.',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Safe to retry for idempotent requests once the upstream/network issue clears.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — a transient network connectivity failure.',
    related: [
      { code: 504, note: '504 Gateway Timeout is the standardized equivalent most systems should use instead of this non-standard code.' },
      { code: 522, note: '522 Connection Timed Out is Cloudflare\'s specific branded version of this same underlying condition.' },
    ],
    specUrl: 'https://http.dev/599',
    keywords: ['network connect timeout', 'proxy connection timeout', 'non-standard timeout'],
  },
];
