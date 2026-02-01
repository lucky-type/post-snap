// Request capture using Chrome webRequest API

import type { CapturedRequest, RequestHeader, HostInfo, CaptureState } from '../shared/types';
import { detectAuthType } from '../utils/authDetector';

// Store captured requests in memory (max 100 most recent)
const MAX_REQUESTS = 100;
const capturedRequests: CapturedRequest[] = [];

// Temporary storage for request bodies (keyed by requestId)
const requestBodies = new Map<string, any>();

// Track unique hosts
const hostMap = new Map<string, HostInfo>();

// Capture state
let captureState: CaptureState = {
  isCapturing: false,
  targetHost: null,
  collectionId: null,
  capturedCount: 0,
  syncedCount: 0
};

// Callback for when capture mode is active
let onCaptureCallback: ((request: CapturedRequest) => void) | null = null;

/**
 * Check if URL should be captured (filter out noise)
 */
function shouldCaptureRequest(url: string): boolean {
  // Ignore Chrome internal URLs
  if (url.startsWith('chrome://')) return false;
  if (url.startsWith('chrome-extension://')) return false;
  if (url.startsWith('edge://')) return false;

  // Ignore browser resources
  if (url.startsWith('about:')) return false;
  if (url.startsWith('data:')) return false;
  if (url.startsWith('blob:')) return false;

  // Ignore common static resources to reduce noise
  const urlLower = url.toLowerCase();
  const staticExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
  if (staticExtensions.some(ext => urlLower.endsWith(ext))) {
    return false;
  }

  return true;
}

/**
 * Format request body from webRequest API format
 */
function formatRequestBody(body: any): string | object | undefined {
  if (!body) return undefined;

  // Handle form data
  if (body.formData) {
    return body.formData;
  }

  // Handle raw data (ArrayBuffer)
  if (body.raw && body.raw.length > 0) {
    try {
      const decoder = new TextDecoder('utf-8');
      const rawData = body.raw[0];

      if (rawData.bytes) {
        const decoded = decoder.decode(new Uint8Array(rawData.bytes));

        // Try to parse as JSON
        try {
          return JSON.parse(decoded);
        } catch {
          // Return as string if not JSON
          return decoded;
        }
      }
    } catch (e) {
      console.error('Error decoding request body:', e);
      return undefined;
    }
  }

  return undefined;
}

/**
 * Initialize request capture listeners
 */
export function initializeRequestCapture() {
  console.log('Initializing request capture...');

  // Listener 1: Capture request body (fires before headers are sent)
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (!shouldCaptureRequest(details.url)) {
        return;
      }

      // Only capture main frame and sub frame requests (not images, scripts, etc.)
      if (details.type !== 'xmlhttprequest' && details.type !== 'fetch') {
        return;
      }

      // Store request body temporarily (will be combined with headers later)
      if (details.requestBody) {
        requestBodies.set(details.requestId, details.requestBody);
      }
    },
    { urls: ['<all_urls>'] },
    ['requestBody']
  );

  // Listener 2: Capture headers and combine with body
  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      if (!shouldCaptureRequest(details.url)) {
        return;
      }

      // Only capture API requests (AJAX/fetch)
      if (details.type !== 'xmlhttprequest' && details.type !== 'fetch') {
        return;
      }

      // Convert headers to our format
      const headers: RequestHeader[] = (details.requestHeaders || []).map(h => ({
        key: h.name,
        value: h.value || ''
      }));

      // Detect authentication
      const authInfo = detectAuthType(headers);

      // Get request body from earlier stage
      const body = requestBodies.get(details.requestId);
      const formattedBody = formatRequestBody(body);

      // Clean up body storage
      requestBodies.delete(details.requestId);

      // Create captured request object
      const capturedRequest: CapturedRequest = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        method: details.method,
        url: details.url,
        headers,
        body: formattedBody,
        authType: authInfo.type,
        authValue: authInfo.value
      };

      // Add to captured requests (most recent first)
      capturedRequests.unshift(capturedRequest);

      // Limit to MAX_REQUESTS
      if (capturedRequests.length > MAX_REQUESTS) {
        capturedRequests.pop();
      }

      // Track host
      try {
        const host = new URL(capturedRequest.url).host;
        const existingHost = hostMap.get(host);
        hostMap.set(host, {
          host,
          requestCount: (existingHost?.requestCount || 0) + 1,
          lastSeen: Date.now(),
          hasAuth: existingHost?.hasAuth || capturedRequest.authType !== 'none'
        });

        // If capture mode is active for this host, trigger callback
        if (captureState.isCapturing &&
            captureState.targetHost === host &&
            onCaptureCallback) {
          captureState.capturedCount++;
          onCaptureCallback(capturedRequest);
        }
      } catch (e) {
        // Invalid URL, skip host tracking
      }

      console.log('Captured request:', {
        method: capturedRequest.method,
        url: capturedRequest.url,
        authType: capturedRequest.authType,
        headersCount: capturedRequest.headers.length,
        hasBody: !!capturedRequest.body
      });
    },
    { urls: ['<all_urls>'] },
    ['requestHeaders']
  );

  console.log('Request capture initialized successfully');
}

/**
 * Get all captured requests
 */
export function getCapturedRequests(): CapturedRequest[] {
  return [...capturedRequests]; // Return copy to prevent external modifications
}

/**
 * Get a specific captured request by ID
 */
export function getCapturedRequest(id: string): CapturedRequest | undefined {
  return capturedRequests.find(req => req.id === id);
}

/**
 * Clear all captured requests
 */
export function clearCapturedRequests(): void {
  capturedRequests.length = 0;
  requestBodies.clear();
  console.log('Cleared all captured requests');
}

/**
 * Get unique hosts sorted by last seen
 */
export function getUniqueHosts(): HostInfo[] {
  return Array.from(hostMap.values())
    .sort((a, b) => b.lastSeen - a.lastSeen);
}

/**
 * Start capture mode for a specific host
 */
export function startCapture(
  host: string,
  collectionId: string,
  callback: (request: CapturedRequest) => void
): void {
  captureState = {
    isCapturing: true,
    targetHost: host,
    collectionId,
    capturedCount: 0,
    syncedCount: 0
  };
  onCaptureCallback = callback;
  console.log(`Started capture for host: ${host}`);
}

/**
 * Stop capture mode
 */
export function stopCapture(): CaptureState {
  const finalState = { ...captureState };
  captureState = {
    isCapturing: false,
    targetHost: null,
    collectionId: null,
    capturedCount: 0,
    syncedCount: 0
  };
  onCaptureCallback = null;
  console.log('Stopped capture');
  return finalState;
}

/**
 * Get current capture state
 */
export function getCaptureState(): CaptureState {
  return { ...captureState };
}

/**
 * Increment synced count
 */
export function incrementSyncedCount(): void {
  captureState.syncedCount++;
}

/**
 * Get requests for a specific host
 */
export function getRequestsByHost(host: string): CapturedRequest[] {
  return capturedRequests.filter(req => {
    try {
      return new URL(req.url).host === host;
    } catch {
      return false;
    }
  });
}

/**
 * Get the most recent request with authentication for a host
 */
export function getMostRecentRequestWithAuth(host: string): CapturedRequest | null {
  const hostRequests = getRequestsByHost(host);
  return hostRequests.find(req => req.authType !== 'none') || null;
}
