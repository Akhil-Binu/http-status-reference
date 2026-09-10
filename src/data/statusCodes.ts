import type { StatusCode } from './types';
import { informational } from './codes/informational';
import { success } from './codes/success';
import { redirection } from './codes/redirection';
import { clientError } from './codes/clientError';
import { serverError } from './codes/serverError';

export * from './types';
export { categories, getCategoryMeta } from './categories';

/** Every documented HTTP status code, sorted numerically. */
export const statusCodes: StatusCode[] = [
  ...informational,
  ...success,
  ...redirection,
  ...clientError,
  ...serverError,
].sort((a, b) => a.code - b.code);

const byCode = new Map<number, StatusCode>(statusCodes.map((s) => [s.code, s]));

export function getStatusCode(code: number): StatusCode | undefined {
  return byCode.get(code);
}

export function getStatusCodesByCategory(category: string): StatusCode[] {
  return statusCodes.filter((s) => s.category === category);
}

/**
 * A hand-picked list of the codes developers hit most often in day-to-day
 * work, used to power the "Most Common" view on the homepage.
 */
export const mostCommonCodes = [
  200, 201, 204, 301, 302, 304, 400, 401, 403, 404, 405, 409, 410, 422, 429,
  500, 502, 503, 504,
];
