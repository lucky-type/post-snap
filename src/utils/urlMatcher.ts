// Smart URL matching that normalizes dynamic segments (IDs, UUIDs)

import type { PostmanRequest } from '../shared/types';

/**
 * Normalize URL by replacing dynamic segments (IDs, UUIDs) with placeholders
 *
 * Examples:
 *   /api/users/123 → /api/users/:id
 *   /api/users/abc-123-def/posts/456 → /api/users/:id/posts/:id
 *   /api/products/550e8400-e29b-41d4-a716-446655440000 → /api/products/:id
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;

    // Replace UUIDs (standard format: 8-4-4-4-12 hex characters)
    pathname = pathname.replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '/:id'
    );

    // Replace numeric IDs (e.g., /123, /456)
    pathname = pathname.replace(/\/\d+/g, '/:id');

    // Replace alphanumeric IDs (6+ chars, e.g., abc123, xyz-789-def)
    // This matches common ID patterns but avoids replacing short words
    pathname = pathname.replace(/\/[a-z0-9_-]{8,}/gi, '/:id');

    // Replace MongoDB ObjectIDs (24 hex characters)
    pathname = pathname.replace(/\/[0-9a-f]{24}/gi, '/:id');

    return pathname;
  } catch (e) {
    console.error('Error normalizing URL:', e);
    // Return original if parsing fails
    return url;
  }
}

/**
 * Extract URL from Postman request format
 */
function extractPostmanUrl(request: PostmanRequest): string {
  const url = request.request.url;

  if (typeof url === 'string') {
    return url;
  }

  // If url is an object, return the raw URL
  return url.raw;
}

/**
 * Find matching request in Postman collection by URL pattern
 * Returns the matching request or null if no match found
 */
export function findMatchingRequest(
  capturedUrl: string,
  postmanRequests: any[]
): any | null {
  const normalizedCaptured = normalizeUrl(capturedUrl);

  for (const item of postmanRequests) {
    // Handle folders (recursive search)
    if (item.item && Array.isArray(item.item)) {
      const match = findMatchingRequest(capturedUrl, item.item);
      if (match) return match;
    }

    // Check if this is a request (not a folder)
    if (item.request) {
      try {
        const postmanUrl = extractPostmanUrl(item);
        const normalizedPostman = normalizeUrl(postmanUrl);

        if (normalizedCaptured === normalizedPostman) {
          return item; // Found match!
        }
      } catch (e) {
        console.error('Error extracting Postman URL:', e);
        continue;
      }
    }
  }

  return null; // No match found
}

/**
 * Find all matching requests in Postman collection by URL pattern
 * Returns array of matching requests (useful if multiple matches found)
 */
export function findAllMatchingRequests(
  capturedUrl: string,
  postmanRequests: any[]
): any[] {
  const normalizedCaptured = normalizeUrl(capturedUrl);
  const matches: any[] = [];

  function searchRecursive(items: any[]) {
    for (const item of items) {
      // Handle folders (recursive search)
      if (item.item && Array.isArray(item.item)) {
        searchRecursive(item.item);
      }

      // Check if this is a request (not a folder)
      if (item.request) {
        try {
          const postmanUrl = extractPostmanUrl(item);
          const normalizedPostman = normalizeUrl(postmanUrl);

          if (normalizedCaptured === normalizedPostman) {
            matches.push(item);
          }
        } catch (e) {
          console.error('Error extracting Postman URL:', e);
          continue;
        }
      }
    }
  }

  searchRecursive(postmanRequests);
  return matches;
}

/**
 * Compare similarity between two URLs (0-1 score)
 * Useful for suggesting matches when exact match not found
 */
export function calculateUrlSimilarity(url1: string, url2: string): number {
  const normalized1 = normalizeUrl(url1);
  const normalized2 = normalizeUrl(url2);

  if (normalized1 === normalized2) return 1.0;

  // Calculate path segment overlap
  const segments1 = normalized1.split('/').filter(s => s.length > 0);
  const segments2 = normalized2.split('/').filter(s => s.length > 0);

  const maxLength = Math.max(segments1.length, segments2.length);
  if (maxLength === 0) return 0;

  let matches = 0;
  const minLength = Math.min(segments1.length, segments2.length);

  for (let i = 0; i < minLength; i++) {
    if (segments1[i] === segments2[i]) {
      matches++;
    }
  }

  return matches / maxLength;
}

/**
 * Find matching request by URL pattern AND HTTP method
 * Returns the matching request or null if no match found
 */
export function findMatchingRequestWithMethod(
  capturedUrl: string,
  method: string,
  postmanRequests: any[]
): any | null {
  const normalizedCaptured = normalizeUrl(capturedUrl);

  function searchRecursive(items: any[]): any | null {
    for (const item of items) {
      // Handle folders (recursive search)
      if (item.item && Array.isArray(item.item)) {
        const match = searchRecursive(item.item);
        if (match) return match;
      }

      // Check if this is a request (not a folder)
      if (item.request) {
        try {
          const postmanUrl = extractPostmanUrl(item);
          const normalizedPostman = normalizeUrl(postmanUrl);
          const postmanMethod = item.request.method?.toUpperCase() || 'GET';

          if (normalizedCaptured === normalizedPostman &&
              method.toUpperCase() === postmanMethod) {
            return item;
          }
        } catch (e) {
          continue;
        }
      }
    }
    return null;
  }

  return searchRecursive(postmanRequests);
}

/**
 * Find all requests for a specific host in the collection
 */
export function findAllRequestsForHost(
  host: string,
  postmanRequests: any[]
): any[] {
  const matches: any[] = [];

  function searchRecursive(items: any[]) {
    for (const item of items) {
      if (item.item && Array.isArray(item.item)) {
        searchRecursive(item.item);
      }

      if (item.request) {
        try {
          const postmanUrl = extractPostmanUrl(item);
          const urlHost = new URL(postmanUrl).host;

          if (urlHost === host) {
            matches.push(item);
          }
        } catch (e) {
          continue;
        }
      }
    }
  }

  searchRecursive(postmanRequests);
  return matches;
}
