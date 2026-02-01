// Postman API integration

import axios from 'axios';
import type {
  CapturedRequest,
  PostmanCollection,
  RequestHeader,
  AuthType,
  UpsertResult,
  BulkTokenUpdateResult
} from '../shared/types';
import { findMatchingRequest, findMatchingRequestWithMethod, findAllRequestsForHost } from '../utils/urlMatcher';
import { getPostmanApiKey } from './storage';

const POSTMAN_API_BASE = 'https://api.getpostman.com';

/**
 * Get Postman API headers with authentication
 */
async function getApiHeaders(): Promise<Record<string, string>> {
  const apiKey = await getPostmanApiKey();

  if (!apiKey) {
    throw new Error('Postman API key not configured. Please add your API key in Settings.');
  }

  return {
    'X-Api-Key': apiKey,
    'Content-Type': 'application/json'
  };
}

/**
 * Test Postman API connection
 * Returns user info if successful
 */
export async function testConnection(apiKey: string): Promise<any> {
  try {
    const response = await axios.get(`${POSTMAN_API_BASE}/me`, {
      headers: {
        'X-Api-Key': apiKey
      }
    });

    return {
      success: true,
      user: response.data.user
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your Postman API key.');
      }
      throw new Error(`API Error: ${error.response?.statusText || error.message}`);
    }
    throw error;
  }
}

/**
 * Get all Postman collections
 */
export async function getCollections(): Promise<PostmanCollection[]> {
  try {
    const headers = await getApiHeaders();
    const response = await axios.get(`${POSTMAN_API_BASE}/collections`, {
      headers
    });

    return response.data.collections.map((col: any) => ({
      id: col.id,
      name: col.name,
      uid: col.uid
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please reconfigure in Settings.');
      }
      throw new Error(`Failed to fetch collections: ${error.response?.statusText || error.message}`);
    }
    throw error;
  }
}

/**
 * Get a specific collection with all its requests
 */
export async function getCollection(collectionId: string): Promise<any> {
  try {
    const headers = await getApiHeaders();
    const response = await axios.get(
      `${POSTMAN_API_BASE}/collections/${collectionId}`,
      { headers }
    );

    return response.data.collection;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch collection: ${error.response?.statusText || error.message}`);
    }
    throw error;
  }
}

/**
 * Format captured request for Postman schema
 */
function formatRequestForPostman(request: CapturedRequest): any {
  const url = new URL(request.url);

  // Format headers
  const headers = request.headers.map(h => ({
    key: h.key,
    value: h.value
  }));

  // Format URL
  const postmanUrl = {
    raw: request.url,
    protocol: url.protocol.slice(0, -1), // Remove trailing ':'
    host: url.hostname.split('.'),
    path: url.pathname.split('/').filter(Boolean),
    query: Array.from(url.searchParams).map(([key, value]) => ({
      key,
      value
    }))
  };

  // Format body
  let body: any = undefined;
  if (request.body) {
    if (typeof request.body === 'object') {
      body = {
        mode: 'raw',
        raw: JSON.stringify(request.body, null, 2),
        options: {
          raw: {
            language: 'json'
          }
        }
      };
    } else {
      body = {
        mode: 'raw',
        raw: request.body
      };
    }
  }

  // Format auth
  let auth: any = undefined;
  if (request.authType !== 'none' && request.authValue) {
    switch (request.authType) {
      case 'bearer':
        auth = {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: request.authValue,
              type: 'string'
            }
          ]
        };
        break;

      case 'basic':
        auth = {
          type: 'basic',
          basic: [
            {
              key: 'password',
              value: request.authValue,
              type: 'string'
            }
          ]
        };
        break;

      case 'apikey':
        auth = {
          type: 'apikey',
          apikey: [
            {
              key: 'key',
              value: 'Authorization',
              type: 'string'
            },
            {
              key: 'value',
              value: request.authValue,
              type: 'string'
            }
          ]
        };
        break;
    }
  }

  // Generate request name from method and path
  const requestName = `${request.method} ${url.pathname}`;

  return {
    name: requestName,
    request: {
      method: request.method,
      header: headers,
      url: postmanUrl,
      body,
      auth
    }
  };
}

/**
 * Create a new request in a Postman collection
 */
export async function createRequestInCollection(
  collectionId: string,
  capturedRequest: CapturedRequest
): Promise<{ success: boolean; requestName: string }> {
  try {
    const headers = await getApiHeaders();

    // 1. Fetch the collection
    const collection = await getCollection(collectionId);

    // 2. Format the new request
    const newRequest = formatRequestForPostman(capturedRequest);

    // 3. Add request to collection's items
    if (!collection.item) {
      collection.item = [];
    }
    collection.item.push(newRequest);

    // 4. Update the collection
    await axios.put(
      `${POSTMAN_API_BASE}/collections/${collectionId}`,
      { collection },
      { headers }
    );

    return {
      success: true,
      requestName: newRequest.name
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to create request: ${error.response?.statusText || error.message}`);
    }
    throw error;
  }
}

/**
 * Update token in an existing Postman request
 * Uses smart URL matching to find the request
 */
export async function updateTokenInCollection(
  collectionId: string,
  capturedRequest: CapturedRequest
): Promise<{ success: boolean; requestName: string }> {
  try {
    const headers = await getApiHeaders();

    // 1. Fetch the collection
    const collection = await getCollection(collectionId);

    // 2. Find matching request using smart URL matcher
    const matchedRequest = findMatchingRequest(capturedRequest.url, collection.item || []);

    if (!matchedRequest) {
      throw new Error(
        'No matching request found in collection. The URL pattern does not match any existing requests.'
      );
    }

    // 3. Update Authorization header
    const newAuthValue = capturedRequest.authType === 'bearer'
      ? `Bearer ${capturedRequest.authValue}`
      : capturedRequest.authValue || '';

    const authHeaderIndex = matchedRequest.request.header.findIndex(
      (h: RequestHeader) => h.key.toLowerCase() === 'authorization'
    );

    if (authHeaderIndex >= 0) {
      // Update existing Authorization header
      matchedRequest.request.header[authHeaderIndex].value = newAuthValue;
    } else {
      // Add Authorization header if it doesn't exist
      matchedRequest.request.header.push({
        key: 'Authorization',
        value: newAuthValue
      });
    }

    // 4. Update the collection
    await axios.put(
      `${POSTMAN_API_BASE}/collections/${collectionId}`,
      { collection },
      { headers }
    );

    return {
      success: true,
      requestName: matchedRequest.name
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to update token: ${error.response?.statusText || error.message}`);
    }
    throw error;
  }
}

/**
 * Create or update a request in Postman collection (upsert)
 * Uses smart URL matching to find existing requests
 */
export async function upsertRequestInCollection(
  collectionId: string,
  capturedRequest: CapturedRequest
): Promise<UpsertResult> {
  try {
    const headers = await getApiHeaders();

    // 1. Fetch the collection
    const collection = await getCollection(collectionId);

    // 2. Check if request already exists (match by normalized URL + method)
    const existingRequest = findMatchingRequestWithMethod(
      capturedRequest.url,
      capturedRequest.method,
      collection.item || []
    );

    // 3. Format the new/updated request
    const formattedRequest = formatRequestForPostman(capturedRequest);

    if (existingRequest) {
      // Update existing request
      existingRequest.request = formattedRequest.request;
      existingRequest.name = formattedRequest.name;

      // 4. Update the collection
      await axios.put(
        `${POSTMAN_API_BASE}/collections/${collectionId}`,
        { collection },
        { headers }
      );

      return {
        action: 'updated',
        requestName: formattedRequest.name
      };
    } else {
      // Create new request
      if (!collection.item) {
        collection.item = [];
      }
      collection.item.push(formattedRequest);

      // 4. Update the collection
      await axios.put(
        `${POSTMAN_API_BASE}/collections/${collectionId}`,
        { collection },
        { headers }
      );

      return {
        action: 'created',
        requestName: formattedRequest.name
      };
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to upsert request: ${error.response?.statusText || error.message}`);
    }
    throw error;
  }
}

/**
 * Update token in ALL matching requests for a host in the collection
 */
export async function updateTokenForHost(
  collectionId: string,
  host: string,
  authValue: string,
  authType: AuthType
): Promise<BulkTokenUpdateResult> {
  try {
    const headers = await getApiHeaders();

    // 1. Fetch the collection
    const collection = await getCollection(collectionId);

    // 2. Find all requests matching this host
    const matchingRequests = findAllRequestsForHost(host, collection.item || []);

    if (matchingRequests.length === 0) {
      throw new Error(`No requests found for host "${host}" in this collection.`);
    }

    // 3. Update Authorization header in all matching requests
    const newAuthValue = authType === 'bearer'
      ? `Bearer ${authValue}`
      : authValue;

    const updatedNames: string[] = [];

    for (const request of matchingRequests) {
      const authHeaderIndex = request.request.header.findIndex(
        (h: RequestHeader) => h.key.toLowerCase() === 'authorization'
      );

      if (authHeaderIndex >= 0) {
        request.request.header[authHeaderIndex].value = newAuthValue;
      } else {
        request.request.header.push({
          key: 'Authorization',
          value: newAuthValue
        });
      }
      updatedNames.push(request.name);
    }

    // 4. Update the collection
    await axios.put(
      `${POSTMAN_API_BASE}/collections/${collectionId}`,
      { collection },
      { headers }
    );

    return {
      updatedCount: matchingRequests.length,
      totalMatched: matchingRequests.length,
      requestNames: updatedNames
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to update tokens: ${error.response?.statusText || error.message}`);
    }
    throw error;
  }
}
