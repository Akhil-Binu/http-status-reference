/**
 * Shared types for the HTTP status code dataset.
 * See src/data/statusCodes.ts for the data itself, and README.md
 * for instructions on adding a new code.
 */

export type Category =
  | 'informational'
  | 'success'
  | 'redirection'
  | 'client-error'
  | 'server-error';

export interface CategoryMeta {
  id: Category;
  label: string;
  range: string;
  description: string;
  /** CSS custom-property suffix, e.g. "--cat-informational" */
  color: string;
}

export interface CodeSnippets {
  nginx?: string;
  apache?: string;
  express?: string;
}

export interface RelatedCode {
  code: number;
  note: string;
}

export interface StatusCode {
  code: number;
  name: string;
  category: Category;
  /** RFC 9110 / IETF standard vs. widely-used non-standard extension */
  standard: boolean;
  /** One-line, plain-English summary shown in search results and cards. */
  summary: string;
  /** Longer explanation of what the server is actually communicating. */
  explanation: string;
  /** 3-5 realistic "when you'll see this" scenarios. */
  scenarios: string[];
  causes: {
    client: string[];
    server: string[];
    intermediary: string[];
  };
  fixes: {
    user: string[];
    developer: string[];
  };
  snippets?: CodeSnippets;
  /** Related header names with a short note on relevance. */
  headers: { name: string; note: string }[];
  retrySafe: 'yes' | 'no' | 'conditional';
  retryNote: string;
  cacheable: 'yes' | 'no' | 'conditional';
  cacheNote: string;
  related: RelatedCode[];
  specUrl: string;
  /** Extra free-text search terms (symptoms, aliases) not present elsewhere. */
  keywords: string[];
}
