import type { StatusCode } from '../types';

export const success: StatusCode[] = [
  {
    code: 200,
    name: 'OK',
    category: 'success',
    standard: true,
    summary: 'The request succeeded and the response body contains the requested representation.',
    explanation:
      'The most common HTTP response. It means the server understood the request, performed it (or served the resource), and is returning the result in the response body. What "succeeded" means depends on the method: for GET it means the resource was found and returned; for POST it means the action was performed and a representation of the result (or of the outcome) is being returned rather than a newly created resource.',
    scenarios: [
      'Loading any normal web page or API endpoint that returns data successfully.',
      'A POST request that performs an action (e.g. "run this search," "submit this form") and returns a result body instead of creating a new resource.',
      'Health-check endpoints returning 200 to indicate the service is up.',
      'An API returning 200 with an empty or error-shaped JSON body — a common anti-pattern where the HTTP layer says "fine" but the payload says otherwise.',
    ],
    causes: {
      client: [],
      server: ['Request was valid and handled successfully by the application.'],
      intermediary: [],
    },
    fixes: {
      user: [
        'Not an error. If something still looks wrong on a 200 response, the problem is in the response body/content, not the HTTP layer.',
      ],
      developer: [
        'Avoid returning 200 with an error payload ("soft 404s" / "soft errors") — use the matching 4xx/5xx status so caches, monitoring, and clients can react correctly.',
        'For POST/PUT that creates a resource, prefer 201 Created over 200 so clients can distinguish "created" from "processed".',
        'Include a clear, versioned response schema so 200 responses are predictable for API consumers.',
      ],
    },
    headers: [
      { name: 'Content-Type', note: 'Tells the client how to parse the body of a successful response.' },
      { name: 'Cache-Control', note: 'Controls whether and how long this successful response may be cached.' },
    ],
    retrySafe: 'conditional',
    retryNote: 'Safe to retry for idempotent methods (GET, PUT, DELETE); retrying a 200 from a non-idempotent POST can duplicate the action (e.g. double-submitting a payment).',
    cacheable: 'yes',
    cacheNote: 'Cacheable by default for GET/HEAD unless Cache-Control/Expires say otherwise.',
    related: [
      { code: 201, note: '201 Created is more specific: use it when the request resulted in a new resource with its own URL.' },
      { code: 204, note: '204 No Content is used when the request succeeded but there is no body to return.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok',
    keywords: ['success', 'ok response', 'everything worked'],
  },
  {
    code: 201,
    name: 'Created',
    category: 'success',
    standard: true,
    summary: 'The request succeeded and a new resource was created as a result.',
    explanation:
      'Typically the response to a POST (or occasionally PUT) that creates a new resource, such as a new user, order, or file. The response should include a Location header pointing to the URL of the newly created resource, and the body often contains a representation of that resource.',
    scenarios: [
      'Submitting a "create account" or "create order" form via a REST API.',
      'A CI/CD system creating a new deployment or pipeline run via API.',
      'Uploading a new file to a storage API (e.g. S3-compatible service) that returns the new object\'s location.',
      'A client library that automatically follows the Location header of a 201 to fetch the new resource.',
    ],
    causes: {
      client: [],
      server: ['The request caused a new resource to be created and the server confirms it.'],
      intermediary: [],
    },
    fixes: {
      user: [
        'Not an error — if the "created" item does not appear afterward, check whether your client actually followed the Location header or is looking in the wrong place.',
      ],
      developer: [
        'Always set the Location header to the URL of the new resource.',
        'Return the created resource (or at least its id) in the body so clients don\'t need a follow-up GET.',
        'Ensure the operation is not accidentally repeatable on retry — use idempotency keys for POST endpoints that create billable or unique resources.',
      ],
    },
    snippets: {
      express: `app.post('/orders', (req, res) => {
  const order = createOrder(req.body);
  res.status(201)
     .location(\`/orders/\${order.id}\`)
     .json(order);
});`,
    },
    headers: [
      { name: 'Location', note: 'Points to the URL of the newly created resource.' },
    ],
    retrySafe: 'no',
    retryNote: 'POST is not idempotent by default — blindly retrying can create duplicate resources unless the endpoint supports idempotency keys.',
    cacheable: 'conditional',
    cacheNote: 'Cacheable only if explicit freshness headers are present; rarely cached in practice since it represents a one-time creation event.',
    related: [
      { code: 200, note: 'Use 200 instead when the request succeeded but did not create a new addressable resource.' },
      { code: 202, note: 'Use 202 when creation is queued/async rather than completed by the time the response is sent.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-201-created',
    keywords: ['resource created', 'post success', 'new record'],
  },
  {
    code: 202,
    name: 'Accepted',
    category: 'success',
    standard: true,
    summary: 'The request was accepted for processing, but that processing is not finished yet.',
    explanation:
      'Used for asynchronous operations: the server confirms it has received and validated the request and queued the work, but the actual processing happens later (in a background job, queue, or batch). The response is non-committal — there is no guarantee the operation will ultimately succeed. Clients typically need to poll a status URL or wait for a webhook/callback.',
    scenarios: [
      'Uploading a video that needs transcoding before it is available.',
      'Submitting a report-generation request that runs as a background job.',
      'Triggering a bulk data import/export via API.',
      'A webhook receiver that immediately returns 202 and processes the payload asynchronously to avoid blocking the sender.',
    ],
    causes: {
      client: [],
      server: ['Request validated and queued for background processing rather than handled synchronously.'],
      intermediary: [],
    },
    fixes: {
      user: [
        'Not an error — the action is in progress. Check the status endpoint, notification, or email the service provides instead of assuming it failed.',
      ],
      developer: [
        'Include a Location or status-check URL so clients know where to poll for completion.',
        'Document expected processing time and provide a way to distinguish "still processing" from "failed" once work completes.',
        'Prefer webhooks over polling where possible to reduce client complexity and server load.',
      ],
    },
    snippets: {
      express: `app.post('/reports', (req, res) => {
  const jobId = queueReportJob(req.body);
  res.status(202)
     .location(\`/reports/status/\${jobId}\`)
     .json({ jobId, status: 'queued' });
});`,
    },
    headers: [
      { name: 'Location', note: 'Optionally points to a status-monitoring URL for the queued operation.' },
      { name: 'Retry-After', note: 'May suggest how long to wait before polling for status.' },
    ],
    retrySafe: 'no',
    retryNote: 'Retrying the original request may enqueue duplicate jobs; poll the status endpoint instead of resubmitting.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — it describes a transient, in-progress state.',
    related: [
      { code: 200, note: '200 OK is used instead when the work completes synchronously before the response is sent.' },
      { code: 201, note: '201 Created is used when the resource already exists at response time, vs. 202 where it does not yet.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-202-accepted',
    keywords: ['async processing', 'queued job', 'background task', 'polling'],
  },
  {
    code: 203,
    name: 'Non-Authoritative Information',
    category: 'success',
    standard: true,
    summary: 'The request succeeded, but the returned metadata came from a copy or transformation, not the origin server directly.',
    explanation:
      'Indicates the response is a modified or proxied version of the origin\'s 200 OK response — for example, a caching proxy that stripped or rewrote headers, or a transformation service that altered content. It lets clients know the payload may not exactly match what the origin server would have returned.',
    scenarios: [
      'A caching/anonymizing proxy that rewrites response headers before forwarding to the client.',
      'An API gateway that transforms or enriches the origin response body/headers.',
      'A CDN edge worker modifying a response and marking it as such.',
      'Rarely seen directly in browsers, but visible when debugging proxy or gateway transformation logic.',
    ],
    causes: {
      client: [],
      server: ['Origin returned 200, but an intermediary transformed the response before delivering it.'],
      intermediary: ['A proxy, gateway, or edge function modified headers or body content.'],
    },
    fixes: {
      user: ['Not an error — informational only, safe to ignore in normal browsing.'],
      developer: [
        'If you operate a proxy/gateway that transforms responses, consider returning 203 instead of 200 to be transparent about the modification.',
        'If clients depend on exact origin metadata (e.g. checksums), be aware a 203 signals that may not hold.',
      ],
    },
    headers: [],
    retrySafe: 'yes',
    retryNote: 'Safe to retry for idempotent methods, same as 200.',
    cacheable: 'yes',
    cacheNote: 'Cacheable under the same rules as 200 OK.',
    related: [
      { code: 200, note: '200 OK is the equivalent response when returned directly and unmodified by the origin.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-203-non-authoritative-info',
    keywords: ['proxy transformation', 'modified response', 'gateway rewrite'],
  },
  {
    code: 204,
    name: 'No Content',
    category: 'success',
    standard: true,
    summary: 'The request succeeded but there is no body to return.',
    explanation:
      'Confirms success without any response payload. Commonly used for DELETE requests, PUT updates where the client already has the current state, or any action-style endpoint where there is simply nothing to send back. The client should keep its current view/state as-is rather than expecting new content.',
    scenarios: [
      'Deleting a resource via DELETE /items/42.',
      'A "mark as read" or "like" toggle endpoint that only needs to confirm success.',
      'A form submission handled via fetch() where the page updates optimistically and doesn\'t need a response body.',
      'CORS preflight-adjacent endpoints or health checks that intentionally return an empty body.',
    ],
    causes: {
      client: [],
      server: ['Action completed successfully; server intentionally omits a body.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not an error — if the UI does not update after a 204, the issue is client-side state handling, not the server response.'],
      developer: [
        'Do not send a Content-Type or a body with 204 — some clients and proxies treat a non-empty body on a 204 as a protocol violation.',
        'Use 204 for DELETE and no-op-response PUT/POST endpoints instead of 200 with an empty JSON object.',
      ],
    },
    snippets: {
      express: `app.delete('/items/:id', (req, res) => {
  deleteItem(req.params.id);
  res.status(204).end();
});`,
    },
    headers: [],
    retrySafe: 'yes',
    retryNote: 'Safe to retry for idempotent operations like DELETE — deleting an already-deleted resource is typically still a success or a 404, not a new error.',
    cacheable: 'yes',
    cacheNote: 'Cacheable in principle for GET/HEAD, though rarely applicable since 204 usually results from state-changing methods.',
    related: [
      { code: 200, note: 'Use 200 instead when you do have a body to return.' },
      { code: 205, note: '205 Reset Content also has no body, but additionally instructs the client to reset the originating view/form.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-204-no-content',
    keywords: ['empty response', 'delete success', 'no body', 'my api returns nothing'],
  },
  {
    code: 205,
    name: 'Reset Content',
    category: 'success',
    standard: true,
    summary: 'The request succeeded and the client should reset the document/form that originated the request.',
    explanation:
      'Similar to 204 (no body), but with an explicit instruction: the client should reset the view that submitted the request — clearing a form\'s input fields, for instance — because the server has finished processing it.',
    scenarios: [
      'A form submission endpoint that wants the browser to clear all fields after a successful submit.',
      'A native or single-page app resetting an input UI after a successful API call.',
      'Rarely used in modern SPA-driven apps, which usually handle resets in client-side JS instead.',
    ],
    causes: {
      client: [],
      server: ['Server explicitly signals the originating UI should be reset after successful processing.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not an error — informational only.'],
      developer: [
        'Support for 205 is inconsistent across browsers/fetch implementations — most modern apps reset forms in JavaScript instead of relying on this status.',
        'If used, ensure no body is sent, matching 204 semantics.',
      ],
    },
    headers: [],
    retrySafe: 'yes',
    retryNote: 'Same idempotency considerations as the underlying request method.',
    cacheable: 'no',
    cacheNote: 'Not cacheable — tied to a specific interactive form submission.',
    related: [
      { code: 204, note: '204 No Content is identical but without the instruction to reset the originating view.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-205-reset-content',
    keywords: ['form reset', 'clear form'],
  },
  {
    code: 206,
    name: 'Partial Content',
    category: 'success',
    standard: true,
    summary: 'The server is returning only part of the resource, as requested via a Range header.',
    explanation:
      'Returned when a client asks for a byte range of a resource (via the Range request header) and the server can fulfill it. This underpins video/audio streaming, resumable downloads, and PDF viewers that load pages on demand — the client gets just the bytes it needs instead of the whole file.',
    scenarios: [
      'Seeking to a different position in a streaming video or audio player.',
      'Resuming an interrupted large file download in a download manager or browser.',
      'A PDF viewer fetching only the pages currently being viewed.',
      'A CDN serving range requests for large software update/installer files.',
    ],
    causes: {
      client: ['Client sent a Range header requesting part of the resource.'],
      server: ['Server/CDN supports byte-range requests and returns the requested slice with 206.'],
      intermediary: ['A CDN or caching layer serves partial content from a cached full copy.'],
    },
    fixes: {
      user: [
        'Not an error. If streaming/seeking is broken, try clearing the browser cache or testing a direct download link.',
        'Corporate proxies sometimes strip Range headers — try a different network if range requests consistently fail.',
      ],
      developer: [
        'Advertise range support with `Accept-Ranges: bytes` on full responses so clients know they can request partial content.',
        'Ensure Content-Range is set correctly on the 206 response (e.g. `Content-Range: bytes 200-999/1200`).',
        'Static file servers (nginx, most CDNs) support this out of the box; verify it is not disabled or stripped by an intermediate proxy.',
      ],
    },
    snippets: {
      nginx: `location /videos/ {
    add_header Accept-Ranges bytes;
    # nginx supports byte-range requests for static files by default
}`,
      express: `const rangeParser = require('range-parser');
app.get('/video/:file', (req, res) => {
  const stat = fs.statSync(filePath);
  const range = req.headers.range;
  if (!range) return res.sendFile(filePath);
  const parts = rangeParser(stat.size, range)[0];
  res.status(206);
  res.set({
    'Content-Range': \`bytes \${parts.start}-\${parts.end}/\${stat.size}\`,
    'Accept-Ranges': 'bytes',
    'Content-Length': parts.end - parts.start + 1,
  });
  fs.createReadStream(filePath, { start: parts.start, end: parts.end }).pipe(res);
});`,
    },
    headers: [
      { name: 'Content-Range', note: 'States which byte range is included and the total resource size.' },
      { name: 'Accept-Ranges', note: 'Advertised on full responses to signal range-request support.' },
    ],
    retrySafe: 'yes',
    retryNote: 'GET range requests are idempotent and safe to retry, e.g. after a dropped connection during download.',
    cacheable: 'yes',
    cacheNote: 'Cacheable; caches can assemble and serve partial content from stored full or partial responses.',
    related: [
      { code: 200, note: 'Returned instead of 206 if the server ignores the Range header and sends the whole resource.' },
      { code: 416, note: '416 Range Not Satisfiable is returned if the requested range is invalid for the resource.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-206-partial-content',
    keywords: ['range request', 'video streaming', 'resumable download', 'byte range'],
  },
  {
    code: 207,
    name: 'Multi-Status',
    category: 'success',
    standard: true,
    summary: 'The response body contains multiple independent status codes for a batch of sub-operations.',
    explanation:
      'Defined by WebDAV for operations that act on multiple resources at once (like a PROPFIND across a directory tree). Because each sub-resource can succeed or fail independently, a single top-level status code isn\'t enough — the body is an XML (or in modern APIs, often JSON) structure listing a status per item.',
    scenarios: [
      'A WebDAV client requesting properties for many files/folders in one PROPFIND call.',
      'A batch API (some cloud storage or CMS APIs borrow this pattern) that processes multiple items and reports per-item results.',
      'Bulk delete/move operations where some items succeed and others fail.',
    ],
    causes: {
      client: ['Client issued a batch operation covering multiple resources.'],
      server: ['Server processed each item independently and aggregates individual results.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not a single error — check the response body for which specific sub-items failed and why.'],
      developer: [
        'Parse the per-item status in the body rather than treating 207 as pass/fail — some items may have succeeded and others failed.',
        'For non-WebDAV batch APIs, document your own multi-status body schema clearly since 207 has no universal JSON format.',
      ],
    },
    headers: [],
    retrySafe: 'conditional',
    retryNote: 'Only retry the specific sub-operations that failed, listed in the body — retrying the whole batch may re-run already-successful items.',
    cacheable: 'no',
    cacheNote: 'Not typically cacheable — represents an aggregate of possibly non-idempotent sub-results.',
    related: [
      { code: 200, note: 'Used instead when a batch endpoint treats the whole operation as a single pass/fail unit.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc4918#section-11.1',
    keywords: ['webdav', 'batch operation', 'multi status', 'partial success'],
  },
  {
    code: 208,
    name: 'Already Reported',
    category: 'success',
    standard: true,
    summary: 'The members of a WebDAV binding have already been listed in a previous part of this multi-status response, so they are not repeated.',
    explanation:
      'Used inside a 207 Multi-Status response to avoid infinite loops and redundant data when the same resource is reachable through multiple bindings (paths). Once a resource has been reported, later encounters within the same response are marked 208 instead of being fully re-listed.',
    scenarios: [
      'A WebDAV collection with resources accessible via multiple internal bindings/aliases.',
      'Deep-copy or recursive property-listing operations on complex WebDAV hierarchies.',
    ],
    causes: {
      client: ['Client requested a recursive/deep operation over a resource graph with multiple paths to the same resource.'],
      server: ['Server deduplicates repeated resource references within a single Multi-Status response.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not an error — purely an internal deduplication marker inside a 207 response body.'],
      developer: ['Only relevant if implementing a WebDAV server with bindings; standard REST APIs will never need to emit this.'],
    },
    headers: [],
    retrySafe: 'yes',
    retryNote: 'Appears only nested within a 207 response; no independent retry semantics.',
    cacheable: 'no',
    cacheNote: 'Not independently cacheable — it is a sub-element of a 207 Multi-Status body.',
    related: [
      { code: 207, note: '208 only ever appears nested inside a 207 Multi-Status response body.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc5842#section-7.1',
    keywords: ['webdav', 'binding', 'deduplication'],
  },
  {
    code: 218,
    name: 'This is fine',
    category: 'success',
    standard: false,
    summary: 'A non-standard, informal Apache extension used to indicate a request succeeded despite the server encountering warnings during processing.',
    explanation:
      'An unofficial, rarely implemented Apache-specific status code (its name is a reference to the popular "this is fine" meme) used by a small number of legacy or joke integrations to indicate a request completed but the server hit issues along the way that it chose not to escalate to an error. It is not part of any IETF standard and has essentially no real-world adoption — treat it as a curiosity rather than something to design around.',
    scenarios: [
      'Encountered almost exclusively in status-code trivia/reference lists rather than live production traffic.',
      'Possibly returned by a niche or joke API that deliberately implements it for novelty.',
      'Found in HTTP status code libraries/enums that include obscure or historical codes for completeness.',
    ],
    causes: {
      client: [],
      server: ['A non-standard server implementation chose to use this instead of 200 to flag a "degraded but successful" outcome.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not a real error condition — if you see this in the wild, treat the request as having succeeded.'],
      developer: [
        'Do not use 218 in production APIs — it is not registered with IANA and most clients, monitoring tools, and libraries do not recognize it.',
        'Prefer standard 200 OK combined with a structured warnings field in the response body to convey "succeeded with caveats".',
      ],
    },
    headers: [],
    retrySafe: 'yes',
    retryNote: 'Treat like 200 OK for retry purposes since it signals overall success.',
    cacheable: 'no',
    cacheNote: 'Not a registered status; clients and caches will generally treat it as an unrecognized 2xx success and may or may not cache it.',
    related: [
      { code: 200, note: 'The standard equivalent — use 200 with a body-level warning field instead of this non-standard code.' },
    ],
    specUrl: 'https://http.dev/218',
    keywords: ['this is fine', 'apache', 'non-standard', 'unofficial'],
  },
  {
    code: 226,
    name: 'IM Used',
    category: 'success',
    standard: true,
    summary: 'The server fulfilled a GET request using one or more instance manipulations, and the response is a result of applying those to the resource.',
    explanation:
      'Part of the HTTP Delta encoding extension (RFC 3229), used when a client requests a resource with an A-IM (Accept-Instance-Manipulation) header — for example, asking for just the differences ("delta") from a version it already has, rather than the full resource. 226 confirms the response body is the result of applying those instance manipulations, saving bandwidth.',
    scenarios: [
      'A delta-sync client requesting only the changes since its last known version of a resource.',
      'Specialized bandwidth-constrained sync protocols that layer on top of HTTP delta encoding.',
      'Rarely seen in modern web/API traffic — mostly of historical or academic interest today.',
    ],
    causes: {
      client: ['Client requested delta/instance manipulation via the A-IM header.'],
      server: ['Server supports RFC 3229 delta encoding and returns the manipulated result.'],
      intermediary: [],
    },
    fixes: {
      user: ['Not an error — informational only, and extremely rare in practice.'],
      developer: [
        'Modern APIs typically achieve similar bandwidth savings with ETags, conditional GET (304), and JSON Patch/diff formats instead of implementing RFC 3229 delta encoding.',
        'Only implement this if integrating with a legacy system that specifically requires HTTP delta encoding.',
      ],
    },
    headers: [
      { name: 'IM', note: 'Lists the instance manipulations applied to produce the response.' },
    ],
    retrySafe: 'yes',
    retryNote: 'GET-based and idempotent; safe to retry.',
    cacheable: 'yes',
    cacheNote: 'Cacheability is limited/complex since the response represents a delta relative to a specific base version the client already holds.',
    related: [
      { code: 200, note: 'The equivalent full response when instance manipulation is not requested or not applied.' },
      { code: 304, note: '304 Not Modified is the more common, widely supported way to save bandwidth on unchanged resources.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc3229#section-10.4.1',
    keywords: ['delta encoding', 'instance manipulation', 'rfc 3229'],
  },
];
