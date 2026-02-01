// Detect authentication type from request headers

import type { AuthType, RequestHeader } from '../shared/types';

export interface AuthInfo {
  type: AuthType;
  value?: string;
}

/**
 * Detect authentication type from request headers
 * Supports: Bearer tokens, Basic auth, API keys, and cookies
 */
export function detectAuthType(headers: RequestHeader[]): AuthInfo {
  for (const header of headers) {
    const name = header.key.toLowerCase();
    const value = header.value;

    // Check for Authorization header
    if (name === 'authorization') {
      // Bearer token (most common for APIs)
      if (value.startsWith('Bearer ')) {
        return {
          type: 'bearer',
          value: value.substring(7).trim()
        };
      }

      // Basic authentication
      if (value.startsWith('Basic ')) {
        return {
          type: 'basic',
          value: value.substring(6).trim()
        };
      }
    }

    // Check for API key headers (various naming conventions)
    if (
      name === 'x-api-key' ||
      name === 'api-key' ||
      name === 'apikey' ||
      name.includes('api-key') ||
      name.includes('apikey')
    ) {
      return {
        type: 'apikey',
        value: value
      };
    }

    // Check for session cookies
    if (name === 'cookie') {
      // Look for common session cookie patterns
      const sessionPatterns = [
        /sessionid=/i,
        /session=/i,
        /sid=/i,
        /connect\.sid=/i,
        /PHPSESSID=/i,
        /JSESSIONID=/i,
        /ASP\.NET_SessionId=/i
      ];

      const hasSessionCookie = sessionPatterns.some(pattern =>
        pattern.test(value)
      );

      if (hasSessionCookie) {
        return {
          type: 'cookie',
          value: value
        };
      }
    }
  }

  // No authentication detected
  return { type: 'none' };
}

/**
 * Extract just the token value from Authorization header for display
 */
export function extractTokenForDisplay(authValue: string, authType: AuthType): string {
  if (!authValue) return '';

  switch (authType) {
    case 'bearer':
    case 'basic':
      // Show first 20 chars and last 10 chars for long tokens
      if (authValue.length > 40) {
        return `${authValue.substring(0, 20)}...${authValue.substring(authValue.length - 10)}`;
      }
      return authValue;

    case 'apikey':
      // Show first 15 chars for API keys
      if (authValue.length > 20) {
        return `${authValue.substring(0, 15)}...`;
      }
      return authValue;

    case 'cookie':
      // Just show "Session cookie"
      return 'Session cookie';

    default:
      return '';
  }
}
