import type { CategoryMeta } from './types';

export const categories: CategoryMeta[] = [
  {
    id: 'informational',
    label: 'Informational',
    range: '1xx',
    description:
      'The request was received and the server is continuing to process it, or is telling the client how to proceed before a final response arrives.',
    color: 'informational',
  },
  {
    id: 'success',
    label: 'Success',
    range: '2xx',
    description:
      'The request was successfully received, understood, and accepted.',
    color: 'success',
  },
  {
    id: 'redirection',
    label: 'Redirection',
    range: '3xx',
    description:
      'Further action needs to be taken by the client to complete the request, usually by requesting a different URL.',
    color: 'redirection',
  },
  {
    id: 'client-error',
    label: 'Client Error',
    range: '4xx',
    description:
      'The request contains bad syntax, is missing information, or cannot be fulfilled because of something the client did.',
    color: 'client-error',
  },
  {
    id: 'server-error',
    label: 'Server Error',
    range: '5xx',
    description:
      'The server failed to fulfill a valid request due to an error, overload, or misconfiguration on its own side.',
    color: 'server-error',
  },
];

export function getCategoryMeta(id: string): CategoryMeta | undefined {
  return categories.find((c) => c.id === id);
}
