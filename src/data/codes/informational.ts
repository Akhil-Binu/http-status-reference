import type { StatusCode } from '../types';

export const informational: StatusCode[] = [
  {
    code: 100,
    name: 'Continue',
    category: 'informational',
    standard: true,
    summary: 'The server got the request headers and the client should go ahead and send the body.',
    explanation:
      'A client that plans to send a large request body can send only the headers first, along with an "Expect: 100-continue" header, and wait. The server inspects the headers (auth, size limits, content type) and replies 100 Continue to say "headers look fine, send the body," saving the client from uploading a large payload that would just be rejected. This is an interim response — a final status code (200, 201, 413, etc.) always follows once the body is processed.',
    scenarios: [
      'Uploading a large file with curl using `-H "Expect: 100-continue"` or a client library that sets it automatically for big payloads.',
      'A REST client library (e.g. some HTTP clients in Go, Java, or .NET) automatically adds Expect: 100-continue for PUT/POST requests over a size threshold.',
      'Debugging with a packet capture (Wireshark/tcpdump) and seeing a request split into a headers-only frame followed by a 100 response before the body frame.',
      'An API gateway or load balancer sitting in front of your app and handling the 100-continue handshake before proxying the body upstream.',
    ],
    causes: {
      client: [
        'HTTP client explicitly sets the Expect: 100-continue header before sending a body.',
        'Client library defaults to this behavior for requests above a certain body size.',
      ],
      server: [
        'Server or framework supports HTTP/1.1 Expect/Continue negotiation and responds automatically.',
      ],
      intermediary: [
        'A reverse proxy or load balancer may generate or strip the 100 response depending on its HTTP/1.1 compliance.',
      ],
    },
    fixes: {
      user: [
        'Nothing to fix — 100 Continue is not an error. If an upload hangs after this response, the problem is with the body transfer, not this status.',
        'If a client seems stuck waiting for 100 Continue that never arrives, check that the server actually supports HTTP/1.1 keep-alive/Expect handling, or disable Expect: 100-continue in the client as a workaround.',
      ],
      developer: [
        'Confirm your server/framework and any reverse proxy in front of it correctly implement the Expect/Continue handshake (most modern servers do this transparently).',
        'If clients time out waiting for 100 Continue, verify no intermediary is buffering or dropping interim responses.',
        'Avoid manually emitting 100 Continue in application code — it should be handled at the HTTP server layer, not in request handlers.',
      ],
    },
    headers: [
      { name: 'Expect', note: 'Sent by the client on the initial request to request this interim response.' },
    ],
    retrySafe: 'yes',
    retryNote: 'This is an interim response, not a final outcome — there is nothing to retry; the client simply proceeds to send the body.',
    cacheable: 'no',
    cacheNote: 'Interim (1xx) responses are never cached.',
    related: [
      { code: 417, note: '417 Expectation Failed is returned instead of 100 Continue when the server cannot meet the Expect header requirement.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-100-continue',
    keywords: ['expect continue', 'interim response', '100-continue handshake'],
  },
  {
    code: 101,
    name: 'Switching Protocols',
    category: 'informational',
    standard: true,
    summary: 'The server agrees to switch protocols as requested by the client, most commonly to WebSocket.',
    explanation:
      'The client sent an Upgrade header asking to switch from HTTP/1.1 to a different protocol on the same connection (typically WebSocket, sometimes HTTP/2 over cleartext). The server replies 101 to confirm the switch, and immediately after this response the connection stops speaking HTTP and starts speaking the new protocol.',
    scenarios: [
      'Opening a WebSocket connection from the browser (`new WebSocket("wss://...")`) for real-time chat, notifications, or live dashboards.',
      'A Socket.IO or SignalR client establishing its underlying WebSocket transport.',
      'Inspecting browser DevTools Network tab and seeing a request with status 101 for a WS/WSS connection.',
      'A reverse proxy (nginx, Apache) configured to proxy WebSocket traffic to an app server.',
    ],
    causes: {
      client: [
        'Browser or client library issues a WebSocket handshake (Connection: Upgrade, Upgrade: websocket).',
      ],
      server: [
        'Application server or framework supports and accepts the requested protocol upgrade.',
      ],
      intermediary: [
        'Reverse proxies must be explicitly configured to pass through Upgrade/Connection headers, or the handshake fails before reaching the app.',
      ],
    },
    fixes: {
      user: [
        'Not an error — if a real-time feature (chat, live updates) is not working, the problem is usually the connection dropping after the upgrade, not the 101 itself.',
        'Check for corporate proxies, VPNs, or firewalls that block WebSocket upgrades and fall back to plain HTTP polling if needed.',
      ],
      developer: [
        'If the WebSocket handshake never completes, verify your reverse proxy forwards the Upgrade and Connection headers.',
        'For nginx, ensure `proxy_http_version 1.1` and the Upgrade/Connection headers are set on the relevant location block.',
        'For Apache, ensure mod_proxy_wstunnel is enabled and mapped to the WebSocket backend.',
        'Check load balancer idle-timeout settings — long-lived WebSocket connections are often dropped by defaults tuned for short HTTP requests.',
      ],
    },
    snippets: {
      nginx: `location /ws/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}`,
      apache: `<Location "/ws/">
    ProxyPass "ws://localhost:8080/ws/"
    ProxyPassReverse "ws://localhost:8080/ws/"
</Location>
# Requires: a2enmod proxy_wstunnel`,
      express: `// Express itself doesn't handle the upgrade; use a ws-aware library
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ server: httpServer });
wss.on('connection', (socket) => { /* ... */ });`,
    },
    headers: [
      { name: 'Upgrade', note: 'Names the protocol being switched to (e.g. "websocket").' },
      { name: 'Connection', note: 'Must include "Upgrade" to signal a protocol switch on this connection.' },
    ],
    retrySafe: 'yes',
    retryNote: 'The handshake itself is idempotent; if the upgrade fails, retrying the initial request is safe.',
    cacheable: 'no',
    cacheNote: 'Interim (1xx) responses are never cached.',
    related: [
      { code: 426, note: '426 Upgrade Required is the client-error counterpart: the server refuses to serve the request except over a different protocol.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-101-switching-protocols',
    keywords: ['websocket', 'upgrade header', 'protocol switch', 'ws handshake'],
  },
  {
    code: 102,
    name: 'Processing',
    category: 'informational',
    standard: true,
    summary: 'The server has accepted the full request but processing will take a while, so it sends this to prevent a client timeout.',
    explanation:
      'Defined by WebDAV (RFC 2518, carried forward informationally), 102 Processing tells the client "I\'m still working on it" for operations that take longer than usual, such as a bulk COPY or MOVE of many resources, so the client does not assume the connection has died and time out.',
    scenarios: [
      'A WebDAV client performing a large COPY or MOVE across many files/collections on a document management server.',
      'Legacy CalDAV/CardDAV sync clients handling large batches.',
      'A long-running server-side operation triggered via WebDAV extensions used by some file-sync or CMS backends.',
      'Seeing 102 in raw HTTP traces from older enterprise document/content management systems.',
    ],
    causes: {
      client: ['Client issued a WebDAV method (COPY, MOVE, PROPFIND) against a large or deep resource tree.'],
      server: ['Server-side operation takes long enough that it proactively signals it is still alive.'],
      intermediary: ['Some proxies and most modern HTTP/2 stacks do not forward or generate 102 — it has largely fallen out of practical use.'],
    },
    fixes: {
      user: [
        'Not an error — simply wait for the operation to complete; avoid cancelling and retrying, which can duplicate partial work.',
      ],
      developer: [
        'Modern APIs rarely need this; prefer async job patterns (202 Accepted + polling, or webhooks) over relying on 102, since HTTP/2 and many clients ignore it.',
        'If supporting legacy WebDAV clients, ensure your server library emits 102 automatically for long operations rather than hand-rolling it.',
      ],
    },
    headers: [],
    retrySafe: 'yes',
    retryNote: 'Interim response only — nothing to retry; wait for the final status.',
    cacheable: 'no',
    cacheNote: 'Interim (1xx) responses are never cached.',
    related: [
      { code: 202, note: '202 Accepted is the modern, HTTP/2-friendly alternative for signaling a long-running async operation.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc2518#section-10.1',
    keywords: ['webdav', 'long running operation', 'copy move'],
  },
  {
    code: 103,
    name: 'Early Hints',
    category: 'informational',
    standard: true,
    summary: 'The server sends preliminary headers (like preload links) before the final response is ready, so the browser can start fetching resources early.',
    explanation:
      'While the server is still assembling the final response (perhaps waiting on a slow database query), it can send an Early Hints response containing Link headers for stylesheets, fonts, or scripts it already knows the page will need. The browser starts fetching those resources immediately, in parallel with the server finishing the main response, improving perceived load performance.',
    scenarios: [
      'A server-side rendered page with a slow backend data fetch that still knows its static CSS/JS/font dependencies upfront.',
      'A CDN or edge server (e.g. Cloudflare, Fastly) configured to emit 103 for HTML responses to speed up Core Web Vitals.',
      'Inspecting the Network tab in Chrome DevTools and seeing a separate "Early Hints" entry before the real document response.',
      'Performance auditing tools (Lighthouse, WebPageTest) flagging an opportunity to add 103 support for faster First Contentful Paint.',
    ],
    causes: {
      client: [],
      server: ['Server/application supports emitting a 103 response with preload/preconnect Link headers ahead of the final response.'],
      intermediary: ['A CDN or reverse proxy generates Early Hints on behalf of an origin that does not natively support them.'],
    },
    fixes: {
      user: [
        'Not an error and not user-actionable — this only affects load performance, not correctness.',
      ],
      developer: [
        'Add 103 support behind a slow data-dependent route by sending Link: <style.css>; rel=preload as headers before the body is ready.',
        'Verify your CDN/reverse proxy passes 1xx responses through rather than swallowing them (older HTTP/1.0 proxies may not support this).',
        'Confirm actual browser support before relying on it exclusively — treat it as a progressive enhancement, not a requirement.',
      ],
    },
    snippets: {
      nginx: `# nginx 1.25.4+ supports 103 Early Hints natively
add_header Link "</style.css>; rel=preload; as=style" always;`,
      express: `// Node.js 18+ / Express with a raw response write for early hints
res.writeEarlyHints({
  link: ['</style.css>; rel=preload; as=style'],
});`,
    },
    headers: [
      { name: 'Link', note: 'Carries the preload/preconnect hints the browser should act on immediately.' },
    ],
    retrySafe: 'yes',
    retryNote: 'Interim response — nothing to retry; the final response follows normally.',
    cacheable: 'no',
    cacheNote: 'Interim (1xx) responses are never cached, though the resources they hint at may be.',
    related: [
      { code: 200, note: '200 OK is the final response that always follows one or more 103 Early Hints.' },
    ],
    specUrl: 'https://www.rfc-editor.org/rfc/rfc8297',
    keywords: ['preload', 'link header', 'performance', 'core web vitals'],
  },
];
